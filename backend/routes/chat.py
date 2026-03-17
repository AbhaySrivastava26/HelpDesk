# backend/routes/chat.py — full replacement

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
from datetime import datetime
import json
import asyncio

router = APIRouter()

rooms:       Dict[str, List[dict]] = {}
auto_agents: Dict[str, dict]       = {}


async def broadcast_to_room(ticket_id: str, message: dict):
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
        raw     = await websocket.receive_text()
        data    = json.loads(raw)
        user_id = data.get("user_id", "unknown")
        role    = data.get("role", "employee")

        if ticket_id not in rooms:
            rooms[ticket_id] = []
        rooms[ticket_id].append({"ws": websocket, "user_id": user_id, "role": role})

        if role == "employee":
            await broadcast_to_room(ticket_id, {
                "type":      "system",
                "text":      f"{user_id} connected — finding the right specialist for you...",
                "timestamp": datetime.now().strftime("%I:%M:%S %p")
            })
            await _auto_assign_agent(ticket_id, user_id)

        elif role == "admin":
            agent_info = data.get("agent_info", {})
            await broadcast_to_room(ticket_id, {
                "type":       "agent_joined",
                "agent_id":   user_id,
                "agent_name": agent_info.get("name", user_id),
                "team_name":  agent_info.get("team_name", "Support Team"),
                "specialty":  agent_info.get("specialty", ""),
                "color":      agent_info.get("color", "#667eea"),
                "icon":       agent_info.get("icon", "🔧"),
                "text":       f"✅ {agent_info.get('name', user_id)} from {agent_info.get('team_name','Support')} has joined.",
                "timestamp":  datetime.now().strftime("%I:%M:%S %p")
            })

        while True:
            raw      = await websocket.receive_text()
            data     = json.loads(raw)
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
                await broadcast_to_room(ticket_id, {
                    "type":        "auto_solve",
                    "sender_id":   "AI Assistant",
                    "sender_role": "ai",
                    "text":        data.get("solution", "No solution available"),
                    "timestamp":   datetime.now().strftime("%I:%M:%S %p")
                })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"Chat WS error [{ticket_id}]: {e}")
    finally:
        if ticket_id in rooms and user_id:
            rooms[ticket_id] = [c for c in rooms[ticket_id] if c["ws"] != websocket]
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
                    await broadcast_to_room(ticket_id, {
                        "type":      "system",
                        "text":      f"{user_id} left the chat",
                        "timestamp": datetime.now().strftime("%I:%M:%S %p")
                    })
                except Exception:
                    pass


async def _auto_assign_agent(ticket_id: str, employee_id: str):
    try:
        from services.auto_assign import (
            find_best_agent, assign_agent,
            get_ticket_category, get_team_info_for_category
        )
        from routes.notifications import notify_agent

        category  = get_ticket_category(ticket_id)
        team_info = get_team_info_for_category(category)
        agent     = find_best_agent(category)

        if agent:
            assign_agent(agent["agent_id"], ticket_id)
            auto_agents[ticket_id] = {**agent, **team_info}

            await asyncio.sleep(1.2)

            # ── Notify the assigned agent on their dashboard ──
            await notify_agent(agent["agent_id"], {
                "type":        "ticket_assigned",
                "ticket_id":   ticket_id,
                "employee_id": employee_id,
                "category":    category,
                "priority":    _get_ticket_priority(ticket_id),
                "team_name":   team_info["team_name"],
                "icon":        team_info["icon"],
                "color":       team_info["color"],
                "text":        f"New ticket assigned: {ticket_id} from {employee_id}",
                "timestamp":   datetime.now().strftime("%I:%M:%S %p")
            })

            # ── Notify employee that agent was found ──
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
                    f"({agent['specialty']}) has been assigned. They will respond shortly."
                ),
                "timestamp": datetime.now().strftime("%I:%M:%S %p")
            })

            # ── Update ticket in DB ──
            try:
                from db.mongo import get_db
                db = get_db()
                if db is not None:
                    db.tickets.update_one(
                        {"ticket_id": ticket_id},
                        {"$set": {
                            "assigned_agent":      agent["agent_id"],
                            "assigned_agent_name": agent["name"],
                            "assigned_team":       team_info["team_name"],
                            "status":              "In Progress",
                            "assigned_at":         datetime.utcnow()
                        }}
                    )
            except Exception as e:
                print(f"DB update error: {e}")

        else:
            await asyncio.sleep(0.5)
            await broadcast_to_room(ticket_id, {
                "type":      "system",
                "text":      f"⚠️ All {category} team agents are currently busy. Your ticket is queued.",
                "timestamp": datetime.now().strftime("%I:%M:%S %p")
            })

    except Exception as e:
        print(f"Auto-assign error: {e}")


def _get_ticket_priority(ticket_id: str) -> str:
    try:
        from db.mongo import get_db
        db = get_db()
        if db:
            t = db.tickets.find_one({"ticket_id": ticket_id})
            if t:
                return t.get("priority", "Medium")
    except Exception:
        pass
    return "Medium"