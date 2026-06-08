from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional

from .. import crud, schemas
from ..database import get_db

router = APIRouter()


@router.get("/rankings", response_model=schemas.EfficiencyRankingResponse)
def get_rankings(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        start_dt = None
        end_dt = None
        if start_date:
            start_dt = datetime.fromisoformat(start_date)
        if end_date:
            end_dt = datetime.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format.")
    
    rankings = crud.get_efficiency_rankings(db, start_dt, end_dt)
    weights = crud.get_default_weight_config(db)
    
    return schemas.EfficiencyRankingResponse(
        rankings=rankings,
        weights=weights,
        updated_at=weights.updated_at
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
