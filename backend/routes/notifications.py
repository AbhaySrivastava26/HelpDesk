# backend/routes/notifications.py
# Each agent maintains a persistent WebSocket connection to receive real-time notifications
# When a ticket is auto-assigned to them, they get an instant push notification

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict
from datetime import datetime
import json

router = APIRouter()

# { agent_id: websocket }  — one connection per logged-in agent
agent_connections: Dict[str, WebSocket] = {}


async def notify_agent(agent_id: str, notification: dict):
    """Push a notification to a specific agent if they are online."""
    ws = agent_connections.get(agent_id)
    if ws:
        try:
            await ws.send_text(json.dumps(notification))
            return True
        except Exception:
            agent_connections.pop(agent_id, None)
    return False


async def notify_all_agents(notification: dict):
    """Broadcast to all connected agents (e.g. system alerts)."""
    dead = []
    for agent_id, ws in agent_connections.items():
        try:
            await ws.send_text(json.dumps(notification))
        except Exception:
            dead.append(agent_id)
    for a in dead:
        agent_connections.pop(a, None)


def get_online_agents() -> list:
    """Returns list of agent_ids currently connected."""
    return list(agent_connections.keys())


@router.websocket("/ws/{agent_id}")
async def agent_notification_ws(websocket: WebSocket, agent_id: str):
    """
    Each help desk agent opens this WebSocket when they log into the agent dashboard.
    They receive real-time ticket assignment notifications through this connection.
    """
    await websocket.accept()
    agent_connections[agent_id] = websocket

    try:
        # Confirm connection to agent
        await websocket.send_text(json.dumps({
            "type":      "connected",
            "text":      f"You are now online as {agent_id}. You will receive ticket notifications here.",
            "timestamp": datetime.now().strftime("%I:%M:%S %p")
        }))

        # Keep connection alive — agent just listens for notifications
        # Agent can also send "ping" or "ack" messages
        while True:
            raw  = await websocket.receive_text()
            data = json.loads(raw)

            if data.get("type") == "ack":
                # Agent acknowledged a notification
                ticket_id = data.get("ticket_id")
                await websocket.send_text(json.dumps({
                    "type":      "ack_confirmed",
                    "ticket_id": ticket_id,
                    "text":      "Ticket acknowledged. Opening chat...",
                    "timestamp": datetime.now().strftime("%I:%M:%S %p")
                }))

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"Notification WS error [{agent_id}]: {e}")
    finally:
        agent_connections.pop(agent_id, None)
        print(f"Agent {agent_id} went offline")


@router.get("/online")
def get_online():
    """Returns currently online agents."""
    return {"online_agents": get_online_agents(), "count": len(agent_connections)}