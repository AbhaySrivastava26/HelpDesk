from data.employees import EMPLOYEES_DATA

def get_employee_details(employee_id: str):
    """Get employee info"""
    for emp in EMPLOYEES_DATA:
        if emp["employee_id"] == employee_id:
            return emp
    return None