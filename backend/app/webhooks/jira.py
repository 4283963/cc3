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
    changelog = payload.get("changelog", {})
    
    if issue:
        issue_obj = crud.add_or_update_jira_issue(db, issue)
        
        if webhook_event == "jira:issue_updated" and changelog:
            items = changelog.get("items", [])
            for item in items:
                if item.get("field") == "status":
                    old_status = item.get("fromString", "")
                    new_status = item.get("toString", "")
                    
                    if issue_obj and issue_obj.assignee_id:
                        crud.record_jira_status_change(
                            db=db,
                            issue_key=issue.get("key", ""),
                            old_status=old_status,
                            new_status=new_status,
                            assignee_id=issue_obj.assignee_id,
                            change_type="status_change"
                        )
                        
                        result = crud.detect_idle_fish_behavior(db, issue_obj.assignee_id, idle_days=3)
                        if result:
                            crud.create_high_risk_alert(
                                db=db,
                                user_id=issue_obj.assignee_id,
                                alert_type="idle_fish",
                                title=result["alert_title"],
                                description=result["alert_description"],
                                issue_keys=result["high_risk_issues"],
                                penalty_points=result["penalty_points"],
                                severity="high"
                            )
        
        return {"status": "success", "event": webhook_event, "issue_key": issue.get("key")}
    
    return {"status": "ignored", "event": webhook_event}
