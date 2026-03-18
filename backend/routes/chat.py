# backend/routes/chat.py — full replacement

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
from datetime import datetime
import json
import asyncio

# Pending notifications: if agent not online yet, queue it
# { agent_id: [notification_dict, ...] }
pending_notifications: Dict[str, list] = {}

router = APIRouter()

# Strict room isolation: { ticket_id: [ {ws, user_id, role, agent_info} ] }
rooms: Dict[str, List[dict]] = {}

# Store a virtual "agent bot" websocket per room for auto-assigned agents
# When agent is auto-assigned, we create a virtual presence in the room
auto_agents: Dict[str, dict] = {}  # { ticket_id: agent_info }


async def broadcast_to_room(ticket_id: str, message: dict):
    """Send to ALL real WebSocket connections in the room."""
    if ticket_id not in rooms:
        return
    dead = []
    for conn in rooms[ticket_id]:
        try:
            await conn["ws"].send_text(json.dumps(message))
        except Exception:
            dead.append(conn)
    for d in dead:
        rooms[ticket_id].remove(d)


@router.websocket("/ws/{ticket_id}")
async def chat_ws(websocket: WebSocket, ticket_id: str):
    await websocket.accept()

    user_id = None
    role    = None

    try:
        # First message = join payload
        raw  = await websocket.receive_text()
        data = json.loads(raw)
        user_id = data.get("user_id", "unknown")
        role    = data.get("role", "employee")

        if ticket_id not in rooms:
            rooms[ticket_id] = []

        conn_entry = {"ws": websocket, "user_id": user_id, "role": role}
        rooms[ticket_id].append(conn_entry)

        # ── AUTO-ASSIGNMENT: fires when an employee connects ──
        if role == "employee":
            await _auto_assign_agent(ticket_id, websocket)

        # If this is an auto-assigned admin joining, announce them properly
        if role == "admin":
            agent_info = data.get("agent_info", {})
            await broadcast_to_room(ticket_id, {
                "type":       "agent_joined",
                "agent_id":   user_id,
                "agent_name": agent_info.get("name", user_id),
                "team_name":  agent_info.get("team_name", "Support Team"),
                "specialty":  agent_info.get("specialty", ""),
                "color":      agent_info.get("color", "#667eea"),
                "icon":       agent_info.get("icon", "🔧"),
                "text":       f"✅ {agent_info.get('name', user_id)} from {agent_info.get('team_name', 'Support')} has joined to help you.",
                "timestamp":  datetime.now().strftime("%I:%M:%S %p")
            })
        else:
            await broadcast_to_room(ticket_id, {
                "type":      "system",
                "text":      f"{user_id} connected — finding the right agent for you...",
                "timestamp": datetime.now().strftime("%I:%M:%S %p")
            })

        # Main message loop
        while True:
            raw  = await websocket.receive_text()
            data = json.loads(raw)
            msg_type = data.get("type", "message")

            if msg_type == "message":
                await broadcast_to_room(ticket_id, {
                    "type":        "message",
                    "sender_id":   user_id,
                    "sender_role": role,
                    "text":        data.get("text", ""),
                    "timestamp":   datetime.now().strftime("%I:%M:%S %p")
                })

            elif msg_type == "ticket_closed":
                # Agent closed the ticket — broadcast to ALL in room (including employee)
                closed_by = data.get("closed_by", user_id)
                await broadcast_to_room(ticket_id, {
                    "type":      "ticket_closed",
                    "closed_by": closed_by,
                    "text":      f"This ticket has been resolved and closed by {closed_by}. Thank you for using HelpIQ!",
                    "timestamp": datetime.now().strftime("%I:%M:%S %p")
                })

            elif msg_type == "auto_solve":
                solution = data.get("solution", "No solution available")
                await broadcast_to_room(ticket_id, {
                    "type":        "auto_solve",
                    "sender_id":   "AI Assistant",
                    "sender_role": "ai",
                    "text":        solution,
                    "timestamp":   datetime.now().strftime("%I:%M:%S %p")
                })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"Chat WS error [{ticket_id}]: {e}")
    finally:
        # Cleanup
        if ticket_id in rooms and user_id:
            rooms[ticket_id] = [c for c in rooms[ticket_id] if c["ws"] != websocket]

            # Release agent if admin disconnected
            if role == "admin":
                try:
                    from services.auto_assign import release_agent
                    release_agent(user_id)
                except Exception:
                    pass

            if not rooms[ticket_id]:
                del rooms[ticket_id]
                auto_agents.pop(ticket_id, None)
            else:
                try:
                    name = user_id
                    if role == "admin" and ticket_id in auto_agents:
                        name = auto_agents[ticket_id].get("name", user_id)
                    await broadcast_to_room(ticket_id, {
                        "type":      "system",
                        "text":      f"{name} left the chat",
                        "timestamp": datetime.now().strftime("%I:%M:%S %p")
                    })
                except Exception:
                    pass


async def _retry_notify(agent_id: str, payload: dict, retries: int, delay: float):
    """Retry sending notification to agent until they come online."""
    for attempt in range(retries):
        await asyncio.sleep(delay)
        try:
            from routes.notifications import notify_agent, agent_connections
            print(f"Retry {attempt+1}/{retries} for {agent_id} — online: {list(agent_connections.keys())}")
            delivered = await notify_agent(agent_id, payload)
            if delivered:
                print(f"Notification delivered to {agent_id} on retry {attempt+1}")
                return
        except Exception as e:
            print(f"Retry notify error: {e}")
    print(f"Failed to deliver notification to {agent_id} after {retries} retries")


async def _auto_assign_agent(ticket_id: str, employee_ws: WebSocket):
    """
    Called when an employee connects.
    Finds the best available agent for this ticket's category
    and notifies the employee immediately.
    """
    try:
        from services.auto_assign import (
            find_best_agent, assign_agent, get_ticket_category, get_team_info_for_category
        )
        from data.helpdesk_teams import HELPDESK_TEAMS

        # Get the ticket's category from DB
        category = get_ticket_category(ticket_id)
        team_info = get_team_info_for_category(category)

        # Find best available agent
        agent = find_best_agent(category)

        if agent:
            # Mark agent as assigned
            assign_agent(agent["agent_id"], ticket_id)
            auto_agents[ticket_id] = {
                **agent,
                "team_name": team_info["team_name"],
                "color":     team_info["color"],
                "icon":      team_info["icon"],
                "category":  category,
            }

            # Small delay so employee sees the "searching" message first
            await asyncio.sleep(1.2)

            # Send agent-joined notification to the employee
            await broadcast_to_room(ticket_id, {
                "type":       "agent_joined",
                "agent_id":   agent["agent_id"],
                "agent_name": agent["name"],
                "team_name":  team_info["team_name"],
                "specialty":  agent["specialty"],
                "color":      team_info["color"],
                "icon":       team_info["icon"],
                "text": (
                    f"✅ {agent['name']} from {team_info['team_name']} "
                    f"({agent['specialty']}) has been assigned to your ticket. "
                    f"They will respond shortly."
                ),
                "timestamp": datetime.now().strftime("%I:%M:%S %p")
            })

            # ── PUSH NOTIFICATION to agent's portal ──
            try:
                from routes.notifications import notify_agent, agent_connections

                # Get ticket info for notification
                priority    = "Medium"
                employee_id = "Unknown"
                try:
                    from db.mongo import get_db as _get_db
                    _db = _get_db()
                    if _db is not None:
                        _t = _db.tickets.find_one({"ticket_id": ticket_id})
                        if _t:
                            priority    = _t.get("priority",    "Medium")
                            employee_id = _t.get("employee_id", "Unknown")
                except Exception:
                    pass

                notif_payload = {
                    "type":        "ticket_assigned",
                    "ticket_id":   ticket_id,
                    "employee_id": employee_id,
                    "category":    category,
                    "priority":    priority,
                    "team_name":   team_info["team_name"],
                    "icon":        team_info["icon"],
                    "color":       team_info["color"],
                    "text":        f"New ticket assigned: {ticket_id} from {employee_id}",
                    "timestamp":   datetime.now().strftime("%I:%M:%S %p")
                }

                agent_id_to_notify = agent["agent_id"]
                print(f"Attempting notification → {agent_id_to_notify}")
                print(f"Online agents: {list(agent_connections.keys())}")

                # Try immediately
                delivered = await notify_agent(agent_id_to_notify, notif_payload)

                if not delivered:
                    # Agent not online yet — retry up to 10 times over 20 seconds
                    print(f"Agent {agent_id_to_notify} not online, will retry...")
                    asyncio.create_task(
                        _retry_notify(agent_id_to_notify, notif_payload, retries=10, delay=2.0)
                    )
                else:
                    print(f"Notification delivered immediately to {agent_id_to_notify}")

            except Exception as e:
                print(f"Notification error: {e}")
                import traceback; traceback.print_exc()

            # Store assignment in DB for persistence
            try:
                from db.mongo import get_db
                db = get_db()
                if db is not None:
                    db.tickets.update_one(
                        {"ticket_id": ticket_id},
                        {"$set": {
                            "assigned_agent":    agent["agent_id"],
                            "assigned_agent_name": agent["name"],
                            "assigned_team":     team_info["team_name"],
                            "status":            "In Progress",
                            "assigned_at":       datetime.utcnow()
                        }}
                    )
            except Exception as e:
                print(f"DB update error: {e}")

        else:
            # No agents available
            await asyncio.sleep(0.5)
            await broadcast_to_room(ticket_id, {
                "type":      "system",
                "text":      f"⚠️ All {category} team agents are currently unavailable. Your ticket is queued — an agent will join shortly.",
                "timestamp": datetime.now().strftime("%I:%M:%S %p")
            })

    except Exception as e:
        print(f"Auto-assign error: {e}")
        await broadcast_to_room(ticket_id, {
            "type":      "system",
            "text":      "Connecting you to a support agent...",
            "timestamp": datetime.now().strftime("%I:%M:%S %p")
        })


@router.get("/room/{ticket_id}")
def get_room_info(ticket_id: str):
    """Returns current room state including assigned agent."""
    connections = rooms.get(ticket_id, [])
    assigned_agent = auto_agents.get(ticket_id)
    return {
        "ticket_id":        ticket_id,
        "active_users":     len(connections),
        "assigned_agent":   assigned_agent,
        "users": [{"user_id": c["user_id"], "role": c["role"]} for c in connections]
    }