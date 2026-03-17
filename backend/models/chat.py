from pydantic import BaseModel
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    EMPLOYEE = "employee"
    ADMIN = "admin"

class Message(BaseModel):
    sender_id: str
    sender_role: UserRole
    receiver_id: str
    content: str
    ticket_id: str
    auto_solved: bool = False

class ChatSession(BaseModel):
    ticket_id: str
    employee_id: str
    admin_id: Optional[str] = None
    messages: list = []
    is_active: bool = True
    created_at: str