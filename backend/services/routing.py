def calculate_priority(urgency_keywords: list, job_level: str) -> str:
    """Calculate ticket priority"""
    score = len(urgency_keywords) * 3
    
    level_scores = {"Senior": 8, "Manager": 6, "Mid": 4, "Junior": 2}
    score += level_scores.get(job_level, 2)
    
    if score >= 12:
        return "Critical"
    elif score >= 8:
        return "High"
    elif score >= 4:
        return "Medium"
    else:
        return "Low"

def assign_team(category: str, location: str, os: str) -> str:
    """Assign ticket to support team"""
    
    teams = {
        "Hardware": f"Hardware Support - {location}",
        "Software": f"{os} Support - {location}",
        "Network": f"Network Team - {location}",
        "Access/Permissions": f"Identity Team - {location}",
        "Security": f"Security Team - {location}",
    }
    
    return teams.get(category, f"Support Center - {location}")