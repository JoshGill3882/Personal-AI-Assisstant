"""Wrappers around the Google Calendar API tailored for the assistant."""

from __future__ import annotations

import os
from datetime import datetime, timedelta
from typing import Optional

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

from .config import settings

# Single scope keeps the service limited to Calendar access only.
SCOPES = ["https://www.googleapis.com/auth/calendar"]


def _load_creds() -> Credentials:
    """Load OAuth credentials, refreshing or re-authorising when required."""
    token_path = settings.GOOGLE_TOKEN_PATH
    cred_path = settings.GOOGLE_CRED_PATH
    creds: Optional[Credentials] = None

    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            # Refresh in-place when Google issued a refresh token previously.
            from google.auth.transport.requests import Request

            creds.refresh(Request())
        else:
            # First-run experience: walk the user through browser-based consent.
            flow = InstalledAppFlow.from_client_secrets_file(cred_path, SCOPES)
            creds = flow.run_local_server(open_browser=True, port=8765)

        # Persist the updated token so subsequent calls can reuse it silently.
        with open(token_path, "w", encoding="utf-8") as file:
            file.write(creds.to_json())

    return creds


def get_service():
    """Build an authenticated Calendar API client."""
    creds = _load_creds()
    return build("calendar", "v3", credentials=creds, cache_discovery=False)


def _format_start(start_value: str | None) -> str:
    """Convert an ISO date/time string to a reader-friendly summary."""
    if not start_value:
        return "time to be confirmed"

    try:
        dt = datetime.fromisoformat(start_value.replace("Z", "+00:00"))
        return dt.strftime("%a %d %b %Y at %H:%M")
    except ValueError:
        # Fall back to the raw value if Google returns an unexpected format.
        return start_value


def list_events(days: int = 7) -> str:
    """Return a text summary of upcoming events in the next ``days`` days."""
    svc = get_service()
    now = datetime.utcnow().isoformat() + "Z"
    until = (datetime.utcnow() + timedelta(days=days)).isoformat() + "Z"

    events_result = (
        svc.events()
        .list(
            calendarId="primary",
            timeMin=now,
            timeMax=until,
            singleEvents=True,
            orderBy="startTime",
        )
        .execute()
    )
    events = events_result.get("items", [])

    if not events:
        return "You have no events coming up in the next few days."

    lines = ["Here's what you have coming up:"]
    for idx, evt in enumerate(events, start=1):
        summary = evt.get("summary") or "(no title)"
        start_raw = evt["start"].get("dateTime", evt["start"].get("date"))
        when = _format_start(start_raw)
        location = evt.get("location")

        details = f"{idx}. {summary} - {when}"
        if location:
            details += f" @ {location}"
        lines.append(details)

    return "\n".join(lines)


def create_event(
    title: str,
    start_iso: str,
    end_iso: str,
    description: Optional[str] = None,
) -> str:
    """Create a Google Calendar event and return the provider link."""
    svc = get_service()
    body = {
        "summary": title,
        "description": description or "",
        "start": {"dateTime": start_iso},
        "end": {"dateTime": end_iso},
    }
    event = svc.events().insert(calendarId="primary", body=body).execute()
    return event.get("htmlLink", "Created.")
