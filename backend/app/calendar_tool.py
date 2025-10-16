from __future__ import annotations
from datetime import datetime, timedelta
import os
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from .config import settings

SCOPES = ["https://www.googleapis.com/auth/calendar"]

def _load_creds() -> Credentials:
    token_path = settings.GOOGLE_TOKEN_PATH
    cred_path = settings.GOOGLE_CRED_PATH
    creds = None
    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            from google.auth.transport.requests import Request
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(cred_path, SCOPES)
            creds = flow.run_local_server(open_browser=True, port=8765)  # first-time only
        with open(token_path, "w") as f:
            f.write(creds.to_json())
    return creds

def get_service():
    creds = _load_creds()
    return build("calendar", "v3", credentials=creds, cache_discovery=False)

def _format_start(start_value: str | None) -> str:
    if not start_value:
        return "time to be confirmed"
    try:
        dt = datetime.fromisoformat(start_value.replace("Z", "+00:00"))
        return dt.strftime("%a %d %b %Y at %H:%M")
    except ValueError:
        return start_value

def list_events(days=7):
    svc = get_service()
    now = datetime.utcnow().isoformat() + "Z"
    until = (datetime.utcnow() + timedelta(days=days)).isoformat() + "Z"
    events_result = svc.events().list(
        calendarId="primary",
        timeMin=now,
        timeMax=until,
        singleEvents=True,
        orderBy="startTime",
    ).execute()
    events = events_result.get("items", [])
    if not events:
        return "You have no events coming up in the next few days."

    lines = ["Here's what you have coming up:"]
    for idx, evt in enumerate(events, start=1):
        summary = evt.get("summary") or "(no title)"
        start_raw = evt["start"].get("dateTime", evt["start"].get("date"))
        when = _format_start(start_raw)
        location = evt.get("location")
        details = f"{idx}. {summary} — {when}"
        if location:
            details += f" @ {location}"
        lines.append(details)
    return "\n".join(lines)

def create_event(title: str, start_iso: str, end_iso: str, description: str|None=None):
    svc = get_service()
    body = {
        "summary": title,
        "description": description or "",
        "start": {"dateTime": start_iso},
        "end":   {"dateTime": end_iso},
    }
    ev = svc.events().insert(calendarId="primary", body=body).execute()
    return ev.get("htmlLink", "Created.")
