from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class TicketCategory(str, Enum):
    HARDWARE = "Hardware"
    SOFTWARE = "Software"
    NETWORK = "Network"
    ACCESS = "Access/Permissions"
    SECURITY = "Security"

class TicketPriority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class TicketStatus(str, Enum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"

class CreateTicketRequest(BaseModel):
    employee_id: str
    issue_description: str
    additional_info: Optional[str] = None

class UpdateTicketRequest(BaseModel):
    status: Optional[TicketStatus] = None
    resolution_notes: Optional[str] = None