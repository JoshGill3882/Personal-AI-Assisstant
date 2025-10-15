from __future__ import annotations
from datetime import datetime, timedelta
import os, json
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

def list_events(days=7):
    svc = get_service()
    now = datetime.utcnow().isoformat() + "Z"
    until = (datetime.utcnow() + timedelta(days=days)).isoformat() + "Z"
    events_result = svc.events().list(calendarId="primary",
                                      timeMin=now, timeMax=until,
                                      singleEvents=True, orderBy="startTime").execute()
    events = events_result.get("items", [])
    # format simple text
    lines = []
    for e in events:
        start = e["start"].get("dateTime", e["start"].get("date"))
        summary = e.get("summary", "(no title)")
        lines.append(f"- {start}: {summary}")
    return "\n".join(lines) if lines else "No upcoming events."

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
