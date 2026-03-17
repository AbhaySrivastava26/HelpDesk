# backend/data/helpdesk_teams.py
# This is your help desk staff database
# Each agent belongs to a team and handles specific ticket categories

HELPDESK_TEAMS = {
    "Network": {
        "team_name": "Network Operations Team",
        "color": "#2563eb",
        "icon": "🌐",
        "handles": ["Network"],
        "agents": [
            {"agent_id": "HD-NET-001", "name": "Rahul Mishra",    "location": "Bangalore", "status": "online",  "specialty": "VPN & Connectivity"},
            {"agent_id": "HD-NET-002", "name": "Sonal Verma",     "location": "Delhi",     "status": "online",  "specialty": "Wi-Fi & LAN"},
            {"agent_id": "HD-NET-003", "name": "Aman Tiwari",     "location": "Hyderabad", "status": "busy",    "specialty": "Firewall & Security"},
            {"agent_id": "HD-NET-004", "name": "Preethi Nair",    "location": "Mumbai",    "status": "offline", "specialty": "Network Infrastructure"},
        ]
    },
    "Hardware": {
        "team_name": "Hardware Support Team",
        "color": "#7c3aed",
        "icon": "🖥️",
        "handles": ["Hardware"],
        "agents": [
            {"agent_id": "HD-HW-001",  "name": "Deepa Pillai",    "location": "Bangalore", "status": "online",  "specialty": "Laptops & Desktops"},
            {"agent_id": "HD-HW-002",  "name": "Nitin Sharma",    "location": "Delhi",     "status": "online",  "specialty": "Printers & Peripherals"},
            {"agent_id": "HD-HW-003",  "name": "Kavitha Rao",     "location": "Pune",      "status": "busy",    "specialty": "Mobile Devices"},
            {"agent_id": "HD-HW-004",  "name": "Suraj Mehta",     "location": "Hyderabad", "status": "online",  "specialty": "Display & Input Devices"},
        ]
    },
    "Software": {
        "team_name": "Software Support Team",
        "color": "#059669",
        "icon": "💻",
        "handles": ["Software"],
        "agents": [
            {"agent_id": "HD-SW-001",  "name": "Ankita Joshi",    "location": "Bangalore", "status": "online",  "specialty": "Microsoft Office Suite"},
            {"agent_id": "HD-SW-002",  "name": "Vikash Kumar",    "location": "Delhi",     "status": "online",  "specialty": "Enterprise Applications"},
            {"agent_id": "HD-SW-003",  "name": "Meghna Patel",    "location": "Mumbai",    "status": "busy",    "specialty": "OS & System Tools"},
            {"agent_id": "HD-SW-004",  "name": "Ravi Shankar",    "location": "Hyderabad", "status": "online",  "specialty": "Collaboration Tools"},
        ]
    },
    "Access": {
        "team_name": "Identity & Access Team",
        "color": "#d97706",
        "icon": "🔐",
        "handles": ["Access"],
        "agents": [
            {"agent_id": "HD-ACC-001", "name": "Pooja Iyer",      "location": "Bangalore", "status": "online",  "specialty": "Password & SSO"},
            {"agent_id": "HD-ACC-002", "name": "Rohit Saxena",    "location": "Delhi",     "status": "online",  "specialty": "Active Directory"},
            {"agent_id": "HD-ACC-003", "name": "Divya Menon",     "location": "Hyderabad", "status": "offline", "specialty": "VPN Access & Permissions"},
        ]
    },
    "Security": {
        "team_name": "Cyber Security Response Team",
        "color": "#dc2626",
        "icon": "🛡️",
        "handles": ["Security"],
        "agents": [
            {"agent_id": "HD-SEC-001", "name": "Arjun Nair",      "location": "Bangalore", "status": "online",  "specialty": "Incident Response"},
            {"agent_id": "HD-SEC-002", "name": "Shreya Kapoor",   "location": "Delhi",     "status": "busy",    "specialty": "Malware & Phishing"},
            {"agent_id": "HD-SEC-003", "name": "Kiran Reddy",     "location": "Hyderabad", "status": "online",  "specialty": "Data Breach & Compliance"},
        ]
    },
}

def get_team_for_category(category: str) -> dict:
    """Returns team info for a given ticket category."""
    return HELPDESK_TEAMS.get(category, HELPDESK_TEAMS["Software"])

def get_agent_by_id(agent_id: str) -> dict | None:
    """Find an agent across all teams by their ID."""
    for team in HELPDESK_TEAMS.values():
        for agent in team["agents"]:
            if agent["agent_id"] == agent_id:
                return {**agent, "team_name": team["team_name"]}
    return None

def get_agents_for_category(category: str) -> list:
    """Returns list of agents who handle a specific category."""
    team = HELPDESK_TEAMS.get(category, {})
    return team.get("agents", [])

def validate_agent(agent_id: str, category: str) -> bool:
    """Check if an agent belongs to the team that handles this category."""
    agents = get_agents_for_category(category)
    return any(a["agent_id"] == agent_id for a in agents)