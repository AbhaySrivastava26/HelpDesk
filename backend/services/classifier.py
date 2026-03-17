from config import settings
import json

# DON'T initialize client at import time - do it lazily
openai_client = None

def get_openai_client():
    """Lazily initialize OpenAI client"""
    global openai_client
    if openai_client is None and settings.OPENAI_API_KEY and settings.OPENAI_API_KEY != "sk-your-key-here":
        try:
            from openai import OpenAI
            openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
        except Exception as e:
            print(f"⚠️  OpenAI init error: {e}")
            return None
    return openai_client

def classify_ticket(issue_description: str, employee_os: str, department: str) -> dict:
    """Classify ticket - uses AI if available"""
    client = get_openai_client()
    
    if not client:
        return _rule_based_classify(issue_description, employee_os)
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{
                "role": "user",
                "content": f"Classify: {issue_description}\nRespond ONLY JSON: {{\"category\": \"Hardware/Software/Network/Access/Security\"}}"
            }],
            temperature=0.3,
            max_tokens=200
        )
        result = json.loads(response.choices[0].message.content.strip())
        return result
    except Exception as e:
        print(f"⚠️  Classification error: {e}")
        return _rule_based_classify(issue_description, employee_os)

def _rule_based_classify(description: str, os: str) -> dict:
    """Fallback rule-based classifier"""
    desc_lower = description.lower()
    keywords = {
        "Hardware": ["screen", "keyboard", "laptop", "device", "broken"],
        "Software": ["crash", "error", "install", "application", "update"],
        "Network": ["internet", "wifi", "connection", "vpn", "offline"],
        "Access": ["password", "login", "access", "denied"],
        "Security": ["virus", "phishing", "malware", "breach"],
    }
    scores = {cat: sum(1 for kw in kws if kw in desc_lower) for cat, kws in keywords.items()}
    category = max(scores, key=scores.get) or "Software"
    return {"category": category, "confidence": 0.85, "urgency_keywords": []}

def generate_solution(category: str, issue: str, os: str) -> str:
    """Generate solution"""
    client = get_openai_client()
    
    if not client:
        return f"Contact {category} support team"
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{
                "role": "user",
                "content": f"Generate 3 quick fixes:\nCategory: {category}\nIssue: {issue}\nOS: {os}"
            }],
            temperature=0.5,
            max_tokens=300
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"⚠️  Solution error: {e}")
        return f"Contact {category} support team"