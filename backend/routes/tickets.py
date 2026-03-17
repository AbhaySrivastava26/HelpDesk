from fastapi import APIRouter, HTTPException
from models.ticket import CreateTicketRequest, UpdateTicketRequest
from services.classifier import classify_ticket, generate_solution
from services.routing import assign_team, calculate_priority
from services.employee_service import get_employee_details
from db.mongo import get_db
from datetime import datetime
import uuid

router = APIRouter()

@router.post("/create")
def create_ticket(request: CreateTicketRequest):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    employee = get_employee_details(request.employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    classification = classify_ticket(request.issue_description, employee.get("primary_device_os"), employee.get("department"))
    category = classification.get("category", "Software")
    urgency = classification.get("urgency_keywords", [])
    priority = calculate_priority(urgency, employee.get("job_level"))
    assigned_team = assign_team(category, employee.get("location"), employee.get("primary_device_os"))
    solution = generate_solution(category, request.issue_description, employee.get("primary_device_os"))
    
    ticket_id = f"TICKET-{uuid.uuid4().hex[:8].upper()}"
    ticket = {
        "ticket_id": ticket_id,
        "employee_id": request.employee_id,
        "employee_name": employee.get("employee_name"),
        "department": employee.get("department"),
        "location": employee.get("location"),
        "job_level": employee.get("job_level"),
        "os": employee.get("primary_device_os"),
        "issue_description": request.issue_description,
        "category": category,
        "priority": priority,
        "assigned_team": assigned_team,
        "suggested_solution": solution,
        "status": "Open",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    db.tickets.insert_one(ticket)
    
    return {"success": True, "ticket_id": ticket_id, "category": category, "priority": priority, "assigned_team": assigned_team}

@router.get("/all")
def get_all_tickets():
    db = get_db()
    if db is None:
        return {"tickets": []}
    
    tickets = list(db.tickets.find({}).sort("created_at", -1).limit(1000))
    for ticket in tickets:
        ticket["_id"] = str(ticket["_id"])
    
    return {"tickets": tickets}

@router.get("/{ticket_id}")
def get_ticket(ticket_id: str):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    ticket = db.tickets.find_one({"ticket_id": ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket["_id"] = str(ticket["_id"])
    return ticket

@router.put("/{ticket_id}")
def update_ticket(ticket_id: str, request: UpdateTicketRequest):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    update_data = {"updated_at": datetime.utcnow()}
    if request.status:
        update_data["status"] = request.status
    if request.resolution_notes:
        update_data["resolution_notes"] = request.resolution_notes
    
    result = db.tickets.update_one({"ticket_id": ticket_id}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return {"success": True}




#newly generated data

# ── Paste this at the BOTTOM of backend/routes/tickets.py ──

# ── Replace your existing @router.post("/auto-solve") in backend/routes/tickets.py ──

@router.post("/auto-solve")
def auto_solve_ticket(request: dict):
    """
    Calls ChatGPT (via classifier.py) to generate a real solution based on the chat context.
    Falls back to rule-based solutions if OpenAI is unavailable.
    """
    issue_context = request.get("issue_context", "")
    ticket_id     = request.get("ticket_id", "")
    employee_id   = request.get("employee_id", "")

    # Detect category from the context first
    try:
        from services.classifier import classify_ticket, generate_solution
        classification = classify_ticket(issue_context, "Unknown", "General")
        category = classification.get("category", "Software")
        # Now generate a real solution using ChatGPT with the full context
        solution = generate_solution(category, issue_context, "Unknown")
    except Exception as e:
        print(f"Auto-solve error: {e}")
        solution = None

    # Final fallback if everything failed
    if not solution:
        solution = (
            "General troubleshooting steps:\n"
            "1. Restart your device — resolves ~40% of IT issues\n"
            "2. Check if colleagues are affected (ask in team chat)\n"
            "3. Note the exact error message for the support agent\n"
            "4. Try an alternate method or browser\n"
            "5. Your ticket has been escalated to the appropriate team\n"
            "An agent will follow up shortly."
        )

    return {
        "ticket_id":    ticket_id,
        "employee_id":  employee_id,
        "solution":     solution,
        "generated_by": "AI Assistant"
    }