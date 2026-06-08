from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List, Optional

from . import models, schemas
from .database import SessionLocal


def get_or_create_user(db: Session, username: str, display_name: str = None, email: str = None) -> models.User:
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        user = models.User(
            username=username,
            display_name=display_name or username,
            email=email
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def get_default_weight_config(db: Session) -> models.WeightConfig:
    config = db.query(models.WeightConfig).filter(models.WeightConfig.name == "default").first()
    if not config:
        config = models.WeightConfig(
            name="default",
            code_line_weight=0.1,
            bug_fix_weight=5.0,
            story_point_weight=10.0,
            sonar_bug_penalty=3.0,
            code_smell_penalty=1.0,
            vulnerability_penalty=5.0,
            updated_by="system"
        )
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


def update_weight_config(db: Session, update_data: schemas.WeightConfigUpdate, updated_by: str = "admin") -> models.WeightConfig:
    config = get_default_weight_config(db)
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        if hasattr(config, key) and value is not None:
            setattr(config, key, value)
    config.updated_by = updated_by
    config.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(config)
    return config


def add_gitlab_commit(db: Session, commit_data: dict, repo_name: str, username: str, user_name: str, user_email: str = None):
    user = get_or_create_user(db, username, user_name, user_email)
    commit_sha = commit_data.get("id", commit_data.get("sha"))
    
    existing = db.query(models.CodeCommit).filter(models.CodeCommit.commit_sha == commit_sha).first()
    if existing:
        return existing
    
    added = commit_data.get("added", 0)
    removed = commit_data.get("removed", 0)
    
    if not added and not removed:
        added = len(commit_data.get("added_files", []))
        removed = len(commit_data.get("removed_files", []))
    
    commit = models.CodeCommit(
        commit_sha=commit_sha,
        message=commit_data.get("message", ""),
        additions=added,
        deletions=removed,
        total_lines=added + removed,
        branch=commit_data.get("branch", ""),
        repo_name=repo_name,
        commit_url=commit_data.get("url", ""),
        committed_at=datetime.fromisoformat(commit_data["timestamp"].replace("Z", "+00:00")) if commit_data.get("timestamp") else datetime.utcnow(),
        author_id=user.id
    )
    db.add(commit)
    db.commit()
    db.refresh(commit)
    return commit


def add_or_update_jira_issue(db: Session, issue_data: dict, assignee_username: str = None, assignee_name: str = None):
    issue_key = issue_data.get("key", "")
    
    fields = issue_data.get("fields", {})
    issue_type = fields.get("issuetype", {}).get("name", "")
    status = fields.get("status", {}).get("name", "")
    priority = fields.get("priority", {}).get("name", "")
    title = fields.get("summary", "")
    is_bug = issue_type.lower() == "bug"
    
    story_points = fields.get("customfield_10016", 0) or 0
    
    assignee = fields.get("assignee")
    if assignee:
        assignee_username = assignee.get("key", assignee.get("name", ""))
        assignee_name = assignee.get("displayName", assignee_name)
    
    user = None
    if assignee_username:
        user = get_or_create_user(db, assignee_username, assignee_name)
    
    existing = db.query(models.JiraIssue).filter(models.JiraIssue.issue_key == issue_key).first()
    if existing:
        existing.title = title
        existing.issue_type = issue_type
        existing.status = status
        existing.priority = priority
        existing.story_points = float(story_points)
        existing.is_bug = is_bug
        existing.assignee_id = user.id if user else None
        if status.lower() in ["done", "resolved", "closed"] and not existing.resolved_at:
            existing.resolved_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    
    issue = models.JiraIssue(
        issue_key=issue_key,
        title=title,
        issue_type=issue_type,
        status=status,
        priority=priority,
        story_points=float(story_points),
        is_bug=is_bug,
        assignee_id=user.id if user else None
    )
    if status.lower() in ["done", "resolved", "closed"]:
        issue.resolved_at = datetime.utcnow()
    db.add(issue)
    db.commit()
    db.refresh(issue)
    return issue


def add_sonar_issue(db: Session, issue_data: dict, project: str, assignee_username: str = None):
    sonar_key = issue_data.get("key", "")
    
    existing = db.query(models.SonarIssue).filter(models.SonarIssue.sonar_key == sonar_key).first()
    if existing:
        existing.severity = issue_data.get("severity", existing.severity)
        existing.type = issue_data.get("type", existing.type)
        existing.message = issue_data.get("message", existing.message)
        existing.resolved = issue_data.get("status", "") == "RESOLVED"
        if existing.resolved and not existing.resolved_at:
            existing.resolved_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    
    user = None
    if assignee_username:
        user = get_or_create_user(db, assignee_username)
    
    sonar_issue = models.SonarIssue(
        sonar_key=sonar_key,
        severity=issue_data.get("severity", "MAJOR"),
        type=issue_data.get("type", "CODE_SMELL"),
        message=issue_data.get("message", ""),
        component=issue_data.get("component", ""),
        project=project,
        is_new=issue_data.get("isNew", True),
        resolved=False,
        assignee_id=user.id if user else None
    )
    db.add(sonar_issue)
    db.commit()
    db.refresh(sonar_issue)
    return sonar_issue


def calculate_user_efficiency(db: Session, user_id: int, weights: models.WeightConfig, start_date: datetime = None, end_date: datetime = None) -> dict:
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=30)
    if not end_date:
        end_date = datetime.utcnow()
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return None
    
    total_lines = db.query(func.coalesce(func.sum(models.CodeCommit.total_lines), 0)).filter(
        models.CodeCommit.author_id == user_id,
        models.CodeCommit.committed_at >= start_date,
        models.CodeCommit.committed_at <= end_date
    ).scalar()
    
    bugs_fixed = db.query(func.count(models.JiraIssue.id)).filter(
        models.JiraIssue.assignee_id == user_id,
        models.JiraIssue.is_bug == True,
        models.JiraIssue.resolved_at >= start_date,
        models.JiraIssue.resolved_at <= end_date
    ).scalar()
    
    story_points = db.query(func.coalesce(func.sum(models.JiraIssue.story_points), 0)).filter(
        models.JiraIssue.assignee_id == user_id,
        models.JiraIssue.resolved_at >= start_date,
        models.JiraIssue.resolved_at <= end_date
    ).scalar()
    
    sonar_bugs = db.query(func.count(models.SonarIssue.id)).filter(
        models.SonarIssue.assignee_id == user_id,
        models.SonarIssue.type == "BUG",
        models.SonarIssue.resolved == False,
        models.SonarIssue.created_at <= end_date
    ).scalar()
    
    code_smells = db.query(func.count(models.SonarIssue.id)).filter(
        models.SonarIssue.assignee_id == user_id,
        models.SonarIssue.type == "CODE_SMELL",
        models.SonarIssue.resolved == False,
        models.SonarIssue.created_at <= end_date
    ).scalar()
    
    vulnerabilities = db.query(func.count(models.SonarIssue.id)).filter(
        models.SonarIssue.assignee_id == user_id,
        models.SonarIssue.type == "VULNERABILITY",
        models.SonarIssue.resolved == False,
        models.SonarIssue.created_at <= end_date
    ).scalar()
    
    code_score = total_lines * weights.code_line_weight
    bug_fix_score = bugs_fixed * weights.bug_fix_weight
    story_score = story_points * weights.story_point_weight
    bug_penalty = sonar_bugs * weights.sonar_bug_penalty
    smell_penalty = code_smells * weights.code_smell_penalty
    vuln_penalty = vulnerabilities * weights.vulnerability_penalty
    
    total_score = code_score + bug_fix_score + story_score - bug_penalty - smell_penalty - vuln_penalty
    
    bug_rate = (sonar_bugs / total_lines * 1000) if total_lines > 0 else 0.0
    
    return {
        "user_id": user.id,
        "username": user.username,
        "display_name": user.display_name,
        "avatar_url": user.avatar_url,
        "department": user.department,
        "total_lines": total_lines,
        "bugs_fixed": bugs_fixed,
        "story_points": float(story_points),
        "sonar_bugs": sonar_bugs,
        "code_smells": code_smells,
        "vulnerabilities": vulnerabilities,
        "total_score": round(total_score, 2),
        "bug_rate": round(bug_rate, 2)
    }


def get_efficiency_rankings(db: Session, start_date: datetime = None, end_date: datetime = None) -> List[dict]:
    users = db.query(models.User).all()
    weights = get_default_weight_config(db)
    
    rankings = []
    for user in users:
        efficiency = calculate_user_efficiency(db, user.id, weights, start_date, end_date)
        if efficiency:
            rankings.append(efficiency)
    
    rankings.sort(key=lambda x: x["total_score"], reverse=True)
    
    for i, item in enumerate(rankings):
        item["rank"] = i + 1
    
    return rankings
