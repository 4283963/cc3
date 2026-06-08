from fastapi import APIRouter, Request, Depends, HTTPException, Header
from sqlalchemy.orm import Session
import os

from .. import crud
from ..database import get_db

router = APIRouter()


@router.post("/jira")
async def jira_webhook(
    request: Request,
    db: Session = Depends(get_db),
    x_jira_webhook_token: str = Header(None)
):
    expected_token = os.getenv("JIRA_WEBHOOK_TOKEN")
    if expected_token and x_jira_webhook_token != expected_token:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    payload = await request.json()
    
    webhook_event = payload.get("webhookEvent", "")
    issue = payload.get("issue", {})
    
    if issue:
        crud.add_or_update_jira_issue(db, issue)
        return {"status": "success", "event": webhook_event, "issue_key": issue.get("key")}
    
    return {"status": "ignored", "event": webhook_event}
