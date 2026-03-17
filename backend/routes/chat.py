# backend/routes/chat.py — full replacement

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
from datetime import datetime
import json
import asyncio

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