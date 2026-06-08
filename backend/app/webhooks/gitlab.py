from fastapi import APIRouter, Request, Depends, HTTPException, Header
from sqlalchemy.orm import Session
import os

from .. import crud
from ..database import get_db

router = APIRouter()


@router.post("/gitlab")
async def gitlab_webhook(
    request: Request,
    db: Session = Depends(get_db),
    x_gitlab_token: str = Header(None)
):
    expected_token = os.getenv("GITLAB_WEBHOOK_TOKEN")
    if expected_token and x_gitlab_token != expected_token:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    payload = await request.json()
    
    object_kind = payload.get("object_kind", "")
    
    if object_kind == "push":
        project = payload.get("project", {})
        repo_name = project.get("name", "")
        username = payload.get("user_username", "")
        user_name = payload.get("user_name", "")
        user_email = payload.get("user_email", "")
        
        commits = payload.get("commits", [])
        processed = 0
        for commit in commits:
            crud.add_gitlab_commit(db, commit, repo_name, username, user_name, user_email)
            processed += 1
        
        return {"status": "success", "commits_processed": processed}
    
    return {"status": "ignored", "object_kind": object_kind}
