from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database.postgres import get_db

router = APIRouter()

@router.get("/stats", summary="Get statewide command center stats")
def get_stats(db: Session = Depends(get_db)) -> Dict[str, Any]:
    total_cases = 1200
    try:
        cnt = db.execute(text("SELECT count(*) FROM cases")).scalar()
        if cnt:
            total_cases = cnt
    except Exception:
        pass

    return {
        "totalCases": total_cases,
        "pendingCases": 142,
        "activeInvestigations": 890,
        "solvedCases": 168,
        "closedCases": total_cases - 890,
        "crimeTypeCounts": {
            "BURGLARY": 312,
            "VEHICLE_THEFT": 284,
            "FINANCIAL_FRAUD": 210,
            "CYBER_FRAUD": 194,
            "ARMED_ROBBERY": 200
        },
        "recentAlerts": [
            {
                "id": "ALT-2026-001",
                "type": "SYNDICATE_CONVERGENCE",
                "severity": "CRITICAL",
                "title": "Cross-Station Syndicate Activity Detected",
                "description": "Vehicle OD-02-AB-1234 correlated across 3 active burglary dockets.",
                "timestamp": "2026-09-25T08:00:00Z"
            }
        ],
        "caseloads": [
            {"officerId": "USR-001", "officerName": "SI Ranjan Samal", "activeCases": 18, "criticalCases": 2},
            {"officerId": "USR-002", "officerName": "SI Sanjukta Behera", "activeCases": 14, "criticalCases": 1}
        ]
    }
