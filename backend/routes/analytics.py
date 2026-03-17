from fastapi import APIRouter
from db.mongo import get_db

router = APIRouter()

@router.get("/summary")
def get_summary():
    db = get_db()
    if db is None:
        return {"total": 0, "open": 0, "in_progress": 0, "resolved": 0}
    
    tickets = list(db.tickets.find({}))
    return {
        "total": len(tickets),
        "open": len([t for t in tickets if t["status"] == "Open"]),
        "in_progress": len([t for t in tickets if t["status"] == "In Progress"]),
        "resolved": len([t for t in tickets if t["status"] == "Resolved"]),
    }

@router.get("/by-category")
def by_category():
    db = get_db()
    if db is None:
        return {"data": []}
    
    pipeline = [{"$group": {"_id": "$category", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}]
    result = list(db.tickets.aggregate(pipeline))
    return {"data": result}

@router.get("/by-department")
def by_department():
    db = get_db()
    if db is None:
        return {"data": []}
    
    pipeline = [{"$group": {"_id": "$department", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}]
    result = list(db.tickets.aggregate(pipeline))
    return {"data": result}

@router.get("/by-location")
def by_location():
    db = get_db()
    if db is None:
        return {"data": []}
    
    pipeline = [{"$group": {"_id": "$location", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}]
    result = list(db.tickets.aggregate(pipeline))
    return {"data": result}

@router.get("/by-priority")
def by_priority():
    db = get_db()
    if db is None:
        return {"data": []}
    
    pipeline = [{"$group": {"_id": "$priority", "count": {"$sum": 1}}}]
    result = list(db.tickets.aggregate(pipeline))
    return {"data": result}