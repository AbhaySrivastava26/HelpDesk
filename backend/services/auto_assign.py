# backend/services/auto_assign.py
# When an employee connects to chat, this finds the best free agent automatically

from data.helpdesk_teams import HELPDESK_TEAMS, get_agents_for_category
from db.mongo import get_db
from datetime import datetime

# Track which agents are currently busy in active chats
# { agent_id: ticket_id }
active_assignments: dict = {}


def find_best_agent(category: str) -> dict | None:
    """
    Finds the best available agent for a given ticket category.
    Priority: online first, then busy, never offline.
    Skips agents already handling an active chat.
    """
    agents = get_agents_for_category(category)
    if not agents:
        # Fallback: try Software team if category not found
        agents = get_agents_for_category("Software")

    # Sort: online > busy > offline
    priority = {"online": 0, "busy": 1, "offline": 99}
    sorted_agents = sorted(agents, key=lambda a: priority.get(a["status"], 99))

    for agent in sorted_agents:
        if agent["status"] == "offline":
            continue
        # Skip if agent is already handling another ticket
        if agent["agent_id"] in active_assignments:
            continue
        return agent

    # All agents busy — return the least-loaded busy agent
    busy_agents = [a for a in agents if a["status"] == "busy"]
    if busy_agents:
        return busy_agents[0]

    return None


def assign_agent(agent_id: str, ticket_id: str):
    """Mark an agent as handling this ticket."""
    active_assignments[agent_id] = ticket_id


def release_agent(agent_id: str):
    """Free up an agent when chat ends."""
    active_assignments.pop(agent_id, None)


def get_agent_assignment(ticket_id: str) -> str | None:
    """Get which agent is assigned to a ticket."""
    for agent_id, tid in active_assignments.items():
        if tid == ticket_id:
            return agent_id
    return None


def get_ticket_category(ticket_id: str) -> str:
    """Look up the category of a ticket from MongoDB."""
    try:
        db = get_db()
        if db is None:
            return "Software"
        ticket = db.tickets.find_one({"ticket_id": ticket_id})
        if ticket:
            return ticket.get("category", "Software")
    except Exception as e:
        print(f"Error fetching ticket category: {e}")
    return "Software"


def get_team_info_for_category(category: str) -> dict:
    """Returns team metadata for a category."""
    team = HELPDESK_TEAMS.get(category, HELPDESK_TEAMS.get("Software", {}))
    return {
        "team_name": team.get("team_name", "Support Team"),
        "color":     team.get("color", "#667eea"),
        "icon":      team.get("icon", "🔧"),
        "category":  category,
    }