# backend/routes/teams.py

from fastapi import APIRouter
from data.helpdesk_teams import HELPDESK_TEAMS, get_agents_for_category, get_agent_by_id

router = APIRouter()


@router.get("/all")
def get_all_teams():
    """Returns all help desk teams and their agents."""
    result = []
    for category, team in HELPDESK_TEAMS.items():
        online  = sum(1 for a in team["agents"] if a["status"] == "online")
        busy    = sum(1 for a in team["agents"] if a["status"] == "busy")
        offline = sum(1 for a in team["agents"] if a["status"] == "offline")
        result.append({
            "category":   category,
            "team_name":  team["team_name"],
            "color":      team["color"],
            "icon":       team["icon"],
            "agents":     team["agents"],
            "stats": {
                "total":   len(team["agents"]),
                "online":  online,
                "busy":    busy,
                "offline": offline,
            }
        })
    return {"teams": result}


@router.get("/category/{category}")
def get_team_by_category(category: str):
    """Returns the team and agents for a specific ticket category."""
    from data.helpdesk_teams import get_team_for_category
    team = get_team_for_category(category)
    return {
        "category":  category,
        "team_name": team["team_name"],
        "color":     team["color"],
        "icon":      team["icon"],
        "agents":    team["agents"],
    }


@router.get("/agent/{agent_id}")
def get_agent(agent_id: str):
    """Returns info about a specific help desk agent."""
    agent = get_agent_by_id(agent_id)
    if not agent:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.get("/tickets/{agent_id}")
def get_tickets_for_agent(agent_id: str):
    """
    Returns all open tickets assigned to the team this agent belongs to.
    This is what the admin dashboard uses to show only relevant tickets.
    """
    from data.helpdesk_teams import get_agent_by_id, HELPDESK_TEAMS
    from db.mongo import get_db

    agent = get_agent_by_id(agent_id)
    if not agent:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Agent not found")

    # Find which category this agent handles
    agent_category = None
    for category, team in HELPDESK_TEAMS.items():
        if any(a["agent_id"] == agent_id for a in team["agents"]):
            agent_category = category
            break

    if not agent_category:
        return {"tickets": [], "agent": agent, "category": None}

    db = get_db()
    if db is None:
        return {"tickets": [], "agent": agent, "category": agent_category}

    # Only return tickets matching this agent's category
    tickets = list(db.tickets.find(
        {"category": agent_category},
        sort=[("created_at", -1)]
    ))
    for t in tickets:
        t["_id"] = str(t["_id"])

    return {
        "tickets":  tickets,
        "agent":    agent,
        "category": agent_category,
        "count":    len(tickets),
    }