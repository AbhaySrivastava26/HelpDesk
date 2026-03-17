import os
import json
from dotenv import load_dotenv

load_dotenv()

# Lazy initialization — client only created when actually needed
_client = None

def get_client():
    global _client
    if _client is not None:
        return _client
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    try:
        from openai import OpenAI
        _client = OpenAI(api_key=api_key)
        return _client
    except Exception as e:
        print(f"OpenAI init error: {e}")
        return None


def classify_ticket(issue_description: str, employee_os: str, department: str) -> dict:
    client = get_client()
    if client:
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{
                    "role": "user",
                    "content": (
                        f"Classify this IT support ticket.\n"
                        f"Issue: {issue_description}\n"
                        f"OS: {employee_os}, Department: {department}\n"
                        f"Respond ONLY with valid JSON, no extra text:\n"
                        f'{{ "category": "Hardware|Software|Network|Access|Security", '
                        f'"urgency_keywords": ["list", "of", "urgent", "words", "found"] }}'
                    )
                }],
                temperature=0.2,
                max_tokens=150
            )
            text = response.choices[0].message.content.strip()
            return json.loads(text)
        except Exception as e:
            print(f"Classification error: {e}")

    # Rule-based fallback
    return _rule_classify(issue_description, employee_os)


def _rule_classify(description: str, os: str) -> dict:
    desc = description.lower()
    rules = {
        "Hardware": ["screen", "keyboard", "laptop", "mouse", "device", "broken", "hardware", "printer", "shutdown", "shuts down", "turning off", "power", "restart", "battery"],
        "Software": ["crash", "error", "install", "application", "app", "slow", "freeze", "update", "office", "excel", "teams", "outlook"],
        "Network":  ["internet", "wifi", "wi-fi", "connection", "vpn", "network", "bandwidth"],
        "Access":   ["password", "login", "access", "locked", "account", "denied", "permission"],
        "Security": ["virus", "phishing", "malware", "breach", "suspicious", "hack"],
    }
    scores = {cat: sum(1 for kw in kws if kw in desc) for cat, kws in rules.items()}
    category = max(scores, key=scores.get)
    if scores[category] == 0:
        category = "Software"

    urgent_words = ["urgent", "critical", "immediately", "asap", "emergency", "meeting", "production", "down", "not working"]
    found_urgent = [w for w in urgent_words if w in desc]
    return {"category": category, "urgency_keywords": found_urgent}


def generate_solution(category: str, issue: str, os: str) -> str:
    """Generate a detailed solution. Uses ChatGPT if available, falls back to rules."""
    client = get_client()
    if client:
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{
                    "role": "system",
                    "content": (
                        "You are an expert IT helpdesk assistant. "
                        "Give clear, numbered troubleshooting steps. "
                        "Be specific and practical. Max 6 steps. "
                        "End with one escalation note if needed."
                    )
                }, {
                    "role": "user",
                    "content": (
                        f"An employee reported this IT issue:\n\"{issue}\"\n\n"
                        f"Category: {category}, OS: {os}\n\n"
                        f"Provide step-by-step troubleshooting instructions to resolve this."
                    )
                }],
                temperature=0.4,
                max_tokens=400
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Solution generation error: {e}")

    # Rule-based fallback per category
    return _rule_solution(category, issue)


def _rule_solution(category: str, issue: str) -> str:
    desc = issue.lower()

    if category == "Hardware" or any(k in desc for k in ["shutdown", "shuts", "turning off", "power off", "laptop off"]):
        return (
            "Laptop shutting down — troubleshooting steps:\n"
            "1. Check battery: plug in charger and see if shutdowns stop\n"
            "2. Check for overheating: ensure vents are not blocked, use on a hard surface\n"
            "3. Run Windows power diagnostics: Settings → System → Power & Sleep → Additional settings\n"
            "4. Check Event Viewer for critical errors: Win+R → eventvwr → Windows Logs → System\n"
            "5. Update drivers: Device Manager → right-click each device → Update driver\n"
            "6. If issue persists, Hardware Team will arrange inspection/replacement."
        )
    elif category == "Network":
        return (
            "Network troubleshooting steps:\n"
            "1. Restart your Wi-Fi adapter: Settings → Network → Disable, then Enable\n"
            "2. Forget the network and reconnect with credentials\n"
            "3. Flush DNS: open CMD as admin → ipconfig /flushdns\n"
            "4. Try a wired (Ethernet) connection to isolate Wi-Fi issue\n"
            "5. If VPN related: disconnect, restart VPN client, reconnect\n"
            "6. Network Team has been notified if issue continues."
        )
    elif category == "Access":
        return (
            "Access/login troubleshooting steps:\n"
            "1. Reset password via company portal: sso.company.com/reset\n"
            "2. Clear browser cache and cookies, then retry\n"
            "3. Verify Caps Lock is off\n"
            "4. Try incognito mode or a different browser\n"
            "5. If account locked: IT can unlock within 15 minutes — ticket escalated\n"
            "6. Contact the Identity Team for urgent access issues."
        )
    elif category == "Security":
        return (
            "Security incident response steps:\n"
            "1. Do NOT click any suspicious links or attachments\n"
            "2. Disconnect from the network immediately if breach suspected\n"
            "3. Take a screenshot of the suspicious content as evidence\n"
            "4. Report to security@company.com with subject: SECURITY INCIDENT\n"
            "5. Do not delete anything — preserve evidence\n"
            "6. Security Response Team has been alerted — they will contact you shortly."
        )
    else:
        return (
            "Software troubleshooting steps:\n"
            "1. Close and reopen the application completely\n"
            "2. Restart your device — resolves most software issues\n"
            "3. Check for pending Windows/app updates\n"
            "4. Run the app as Administrator: right-click → Run as admin\n"
            "5. Clear app cache: check %AppData% for the application folder\n"
            "6. Software Support Team has been notified if issue continues."
        )