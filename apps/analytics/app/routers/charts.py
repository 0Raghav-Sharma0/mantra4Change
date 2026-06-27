from fastapi import APIRouter, HTTPException

from app.services.charts import (
    ChartFilterRequest,
    generate_district_performance,
    generate_grant_utilization,
    generate_program_trends,
    generate_risk_distribution,
)

router = APIRouter(prefix="/charts", tags=["charts"])


@router.post("/program-trends")
def program_trends(body: ChartFilterRequest) -> dict:
    try:
        return generate_program_trends(body)
    except (FileNotFoundError, ValueError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/district-performance")
def district_performance(body: ChartFilterRequest) -> dict:
    try:
        return generate_district_performance(body)
    except (FileNotFoundError, ValueError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/risk-distribution")
def risk_distribution(body: ChartFilterRequest) -> dict:
    try:
        return generate_risk_distribution(body)
    except (FileNotFoundError, ValueError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/grant-utilization")
def grant_utilization(body: ChartFilterRequest) -> dict:
    try:
        return generate_grant_utilization(body)
    except (FileNotFoundError, ValueError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
