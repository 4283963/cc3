from fastapi import APIRouter, Request, Depends, HTTPException, Header
from sqlalchemy.orm import Session
import os

from .. import crud
from ..database import get_db

router = APIRouter()


@router.post("/sonarqube")
async def sonarqube_webhook(
    request: Request,
    db: Session = Depends(get_db),
    x_sonarqube_token: str = Header(None)
):
    expected_token = os.getenv("SONARQUBE_WEBHOOK_TOKEN")
    if expected_token and x_sonarqube_token != expected_token:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    payload = await request.json()
    
    project = payload.get("project", {})
    project_name = project.get("name", "")
    
    issues = payload.get("issues", [])
    
    if issues:
        processed = 0
        for issue_data in issues:
            assignee = issue_data.get("assignee")
            crud.add_sonar_issue(db, issue_data, project_name, assignee)
            processed += 1
        
        return {"status": "success", "issues_processed": processed}
    
    return {"status": "received", "project": project_name}
