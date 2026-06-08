from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from .. import crud, schemas
from ..database import get_db

router = APIRouter()


@router.get("", response_model=schemas.WeightConfigResponse)
def get_weights(db: Session = Depends(get_db)):
    config = crud.get_default_weight_config(db)
    return config


@router.put("", response_model=schemas.WeightConfigResponse)
def update_weights(
    weight_update: schemas.WeightConfigUpdate,
    db: Session = Depends(get_db)
):
    try:
        updated = crud.update_weight_config(db, weight_update, updated_by="admin")
        return updated
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recalculate")
def recalculate_rankings(db: Session = Depends(get_db)):
    rankings = crud.get_efficiency_rankings(db)
    return {
        "status": "success",
        "total_users": len(rankings),
        "updated_at": datetime.utcnow(),
        "top_performer": rankings[0]["display_name"] if rankings else None
    }
