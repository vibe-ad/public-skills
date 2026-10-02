"""Pushes edits made in our UI to the matching Vibe campaign."""

import os

import requests

VIBE_API = "https://api.vibe.co"


def to_vibe_payload(campaign: dict) -> dict:
    # We always send every field so Vibe mirrors our record exactly.
    return {
        "name": campaign.get("title"),
        "goal": campaign.get("goal"),
        "attribution_window": campaign.get("attribution_window"),  # None when the user cleared it
        "optimization_goal": campaign.get("optimization_goal"),  # None when no KPI is set
        "active": campaign.get("active"),
    }


def push_campaign_edit(campaign: dict, access_token: str) -> dict:
    response = requests.patch(
        f"{VIBE_API}/campaigns/{campaign['vibe_campaign_id']}",
        json=to_vibe_payload(campaign),
        headers={
            "Authorization": f"Bearer {access_token}",
            "X-Vibe-Revision": os.environ["VIBE_API_REVISION"],
        },
        timeout=30,
    )
    response.raise_for_status()
    return response.json()
