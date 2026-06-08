from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from .. import crud, schemas
from ..database import get_db

router = APIRouter()


@router.get("", response_model=schemas.HighRiskAlertListResponse)
def get_alerts(
    resolved: Optional[bool] = Query(False, description="是否已处理"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    alerts, total, unresolved_count = crud.get_high_risk_alerts(
        db=db,
        resolved=resolved,
        limit=limit,
        offset=offset
    )
    
    return schemas.HighRiskAlertListResponse(
        alerts=alerts,
        total=total,
        unresolved_count=unresolved_count
    )


@router.post("/scan")
def scan_alerts(db: Session = Depends(get_db)):
    new_alerts = crud.scan_and_create_idle_alerts(db)
    return {
        "status": "success",
        "new_alerts_count": len(new_alerts),
        "new_alerts": [
            {
                "id": alert.id,
                "user_id": alert.user_id,
                "title": alert.title,
                "penalty_points": alert.penalty_points
            }
            for alert in new_alerts
        ]
    }


@router.post("/{alert_id}/resolve")
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = crud.resolve_alert(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "success", "alert_id": alert_id, "resolved": True}
