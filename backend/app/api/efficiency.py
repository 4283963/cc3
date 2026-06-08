from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import re

from .. import crud, schemas
from ..database import get_db

router = APIRouter()


def parse_time_range(time_range: str) -> Optional[datetime]:
    """
    解析时间范围字符串，返回对应的开始时间（从现在往前推）
    
    支持的格式：
    - 7d: 7天
    - 30d: 30天
    - 90d: 90天
    - 6m: 6个月 (注意：m = month，不是 minute)
    - 1y: 1年
    - 12h: 12小时
    """
    if not time_range:
        return None
    
    time_range = time_range.strip().lower()
    pattern = r'^(\d+)([dmyh])$'
    match = re.match(pattern, time_range)
    
    if not match:
        raise ValueError(f"Invalid time range format: {time_range}. Use format like '7d', '30d', '6m', '1y'")
    
    value = int(match.group(1))
    unit = match.group(2)
    
    now = datetime.utcnow()
    
    if unit == 'd':
        return now - timedelta(days=value)
    elif unit == 'm':
        return now - timedelta(days=value * 30)
    elif unit == 'y':
        return now - timedelta(days=value * 365)
    elif unit == 'h':
        return now - timedelta(hours=value)
    else:
        raise ValueError(f"Unsupported time unit: {unit}")


@router.get("/rankings", response_model=schemas.EfficiencyRankingResponse)
def get_rankings(
    time_range: Optional[str] = Query(None, description="时间范围快捷选择，如 7d, 30d, 90d, 6m, 1y"),
    days: Optional[int] = Query(None, description="最近 N 天"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        start_dt = None
        end_dt = None
        
        if time_range:
            start_dt = parse_time_range(time_range)
            end_dt = datetime.utcnow()
        elif days is not None and days > 0:
            start_dt = datetime.utcnow() - timedelta(days=days)
            end_dt = datetime.utcnow()
        else:
            if start_date:
                try:
                    start_dt = datetime.fromisoformat(start_date)
                except ValueError:
                    raise HTTPException(status_code=400, detail=f"Invalid start_date format: {start_date}. Use ISO format like '2024-01-01'")
            if end_date:
                try:
                    end_dt = datetime.fromisoformat(end_date)
                except ValueError:
                    raise HTTPException(status_code=400, detail=f"Invalid end_date format: {end_date}. Use ISO format like '2024-01-01'")
        
        if start_dt and end_dt and start_dt > end_dt:
            raise HTTPException(status_code=400, detail="start_date must be before end_date")
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    rankings = crud.get_efficiency_rankings(db, start_dt, end_dt)
    weights = crud.get_default_weight_config(db)
    
    if not rankings:
        rankings = []
    
    return schemas.EfficiencyRankingResponse(
        rankings=rankings,
        weights=weights,
        updated_at=datetime.utcnow()
    )


@router.get("/user/{user_id}")
def get_user_efficiency(
    user_id: int,
    days: int = 30,
    db: Session = Depends(get_db)
):
    weights = crud.get_default_weight_config(db)
    start_date = datetime.utcnow() - timedelta(days=days)
    efficiency = crud.calculate_user_efficiency(db, user_id, weights, start_date)
    
    if not efficiency:
        raise HTTPException(status_code=404, detail="User not found")
    
    return efficiency
