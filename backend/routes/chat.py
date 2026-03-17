from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
from datetime import datetime
import json

router = APIRouter()

# Strict room isolation: { ticket_id: [ {ws, user_id, role} ] }
rooms: Dict[str, List[dict]] = {}


async def broadcast_to_room(ticket_id: str, message: dict):
    """Send to ALL connections in a room including the sender."""
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
    # Accept ALL WebSocket connections — CORS does not apply to WS
    # Authentication is handled via the first message payload instead
    await websocket.accept()

    user_id = None
    role = None

    try:
        # First message must be a join payload: { user_id, role }
        raw = await websocket.receive_text()
        data = json.loads(raw)
        user_id = data.get("user_id", "unknown")
        role    = data.get("role", "employee")

        # Add to room
        if ticket_id not in rooms:
            rooms[ticket_id] = []

        conn_entry = {"ws": websocket, "user_id": user_id, "role": role}
        rooms[ticket_id].append(conn_entry)

        # Notify everyone this user joined
        await broadcast_to_room(ticket_id, {
            "type":      "system",
            "text":      f"{user_id} ({role}) joined",
            "timestamp": datetime.now().strftime("%I:%M:%S %p")
        })

        # Main message loop
        while True:
            raw = await websocket.receive_text()
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
        if ticket_id in rooms and user_id:
            rooms[ticket_id] = [c for c in rooms[ticket_id] if c["ws"] != websocket]
            if not rooms[ticket_id]:
                del rooms[ticket_id]
            else:
                try:
                    await broadcast_to_room(ticket_id, {
                        "type":      "system",
                        "text":      f"{user_id} left the chat",
                        "timestamp": datetime.now().strftime("%I:%M:%S %p")
                    })
                except Exception:
                    pass


@router.get("/history/{ticket_id}")
def get_room_users(ticket_id: str):
    if ticket_id not in rooms:
        return {"ticket_id": ticket_id, "active_connections": 0, "users": []}
    users = [{"user_id": c["user_id"], "role": c["role"]} for c in rooms[ticket_id]]
    return {"ticket_id": ticket_id, "active_connections": len(users), "users": users}