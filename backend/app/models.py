from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    email = Column(String(200))
    avatar_url = Column(String(500))
    department = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    commits = relationship("CodeCommit", back_populates="author")
    jira_issues = relationship("JiraIssue", back_populates="assignee")
    sonar_issues = relationship("SonarIssue", back_populates="assignee")


class CodeCommit(Base):
    __tablename__ = "code_commits"

    id = Column(Integer, primary_key=True, index=True)
    commit_sha = Column(String(64), unique=True, index=True)
    message = Column(Text)
    additions = Column(Integer, default=0)
    deletions = Column(Integer, default=0)
    total_lines = Column(Integer, default=0)
    branch = Column(String(200))
    repo_name = Column(String(200))
    commit_url = Column(String(500))
    committed_at = Column(DateTime, default=datetime.utcnow)
    author_id = Column(Integer, ForeignKey("users.id"))

    author = relationship("User", back_populates="commits")


class JiraIssue(Base):
    __tablename__ = "jira_issues"

    id = Column(Integer, primary_key=True, index=True)
    issue_key = Column(String(50), unique=True, index=True)
    title = Column(String(500))
    issue_type = Column(String(50))
    status = Column(String(50))
    priority = Column(String(50))
    story_points = Column(Float, default=0)
    is_bug = Column(Boolean, default=False)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    assignee_id = Column(Integer, ForeignKey("users.id"))

    assignee = relationship("User", back_populates="jira_issues")


class SonarIssue(Base):
    __tablename__ = "sonar_issues"

    id = Column(Integer, primary_key=True, index=True)
    sonar_key = Column(String(200), unique=True, index=True)
    severity = Column(String(50))
    type = Column(String(50))
    message = Column(Text)
    component = Column(String(500))
    project = Column(String(200))
    is_new = Column(Boolean, default=True)
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    assignee_id = Column(Integer, ForeignKey("users.id"))

    assignee = relationship("User", back_populates="sonar_issues")


class WeightConfig(Base):
    __tablename__ = "weight_configs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    code_line_weight = Column(Float, default=0.1)
    bug_fix_weight = Column(Float, default=5.0)
    story_point_weight = Column(Float, default=10.0)
    sonar_bug_penalty = Column(Float, default=3.0)
    code_smell_penalty = Column(Float, default=1.0)
    vulnerability_penalty = Column(Float, default=5.0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = Column(String(100))
