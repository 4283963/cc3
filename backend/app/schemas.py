from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional


class UserBase(BaseModel):
    username: str
    display_name: str
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    department: Optional[str] = None


class UserCreate(UserBase):
    pass


class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class WeightConfigBase(BaseModel):
    name: str = "default"
    code_line_weight: float = 0.1
    bug_fix_weight: float = 5.0
    story_point_weight: float = 10.0
    sonar_bug_penalty: float = 3.0
    code_smell_penalty: float = 1.0
    vulnerability_penalty: float = 5.0


class WeightConfigUpdate(BaseModel):
    code_line_weight: Optional[float] = None
    bug_fix_weight: Optional[float] = None
    story_point_weight: Optional[float] = None
    sonar_bug_penalty: Optional[float] = None
    code_smell_penalty: Optional[float] = None
    vulnerability_penalty: Optional[float] = None


class WeightConfigResponse(WeightConfigBase):
    id: int
    updated_at: datetime
    updated_by: Optional[str] = None

    class Config:
        from_attributes = True


class UserEfficiency(BaseModel):
    rank: int
    user_id: int
    username: str
    display_name: str
    avatar_url: Optional[str] = None
    department: Optional[str] = None
    total_lines: int = 0
    bugs_fixed: int = 0
    story_points: float = 0.0
    sonar_bugs: int = 0
    code_smells: int = 0
    vulnerabilities: int = 0
    total_score: float = 0.0
    bug_rate: float = 0.0


class EfficiencyRankingResponse(BaseModel):
    rankings: List[UserEfficiency]
    weights: WeightConfigResponse
    updated_at: datetime


class GitlabCommitPayload(BaseModel):
    object_kind: str
    project: dict
    commits: List[dict]
    user_username: str
    user_name: str
    user_email: Optional[str] = None


class JiraWebhookPayload(BaseModel):
    webhookEvent: str
    issue: dict
    user: Optional[dict] = None


class SonarQubeWebhookPayload(BaseModel):
    project: dict
    qualityGate: Optional[dict] = None
    issues: Optional[List[dict]] = None
