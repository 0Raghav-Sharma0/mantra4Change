from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.data_quality import build_data_quality_report, save_data_quality_report
from app.services.ingestion import load_school_response_frame, school_response_uniques
from app.services.program_intelligence import (
    build_dashboard_metrics,
    build_geography_response,
    load_program_frame,
    normalize_filters,
)
from app.services.verify_dashboard import verify_dashboard

router = APIRouter(prefix="/analytics", tags=["analytics"])


class VerifyDashboardRequest(BaseModel):
    month: str | None = None
    reportingMonth: str | None = None
    district: str | None = None
    block: str | None = None
    grade: str | None = None
    subject: str | None = None


@router.get("/pbl/summary")
def pbl_summary() -> dict[str, int | list[str]]:
    try:
        frame = load_school_response_frame()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    uniques = school_response_uniques(frame)
    months = sorted(frame["reportingMonth"].dropna().astype(str).unique().tolist())

    return {
        "row_count": int(len(frame)),
        "reporting_months": months,
        "district_count": uniques["districts"],
        "block_count": uniques["blocks"],
        "school_count": uniques["schools"],
    }


@router.get("/data-quality")
def data_quality() -> dict:
    try:
        return build_data_quality_report()
    except (FileNotFoundError, ValueError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/data-quality/report")
def generate_data_quality_report() -> dict[str, str]:
    try:
        path = save_data_quality_report()
        return {"path": str(path), "status": "written"}
    except (FileNotFoundError, ValueError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/program/dashboard")
def program_dashboard(
    month: str | None = None,
    district: str | None = None,
    block: str | None = None,
    grade: str | None = None,
    subject: str | None = None,
) -> dict:
    try:
        frame = load_program_frame()
        filters = normalize_filters(
            {
                "month": month,
                "district": district,
                "block": block,
                "grade": grade,
                "subject": subject,
            }
        )
        return build_dashboard_metrics(frame, filters)
    except (FileNotFoundError, ValueError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/program/districts")
def program_districts(
    month: str | None = None,
    district: str | None = None,
    block: str | None = None,
    grade: str | None = None,
    subject: str | None = None,
) -> dict:
    try:
        frame = load_program_frame()
        filters = normalize_filters(
            {
                "month": month,
                "district": district,
                "block": block,
                "grade": grade,
                "subject": subject,
            }
        )
        return build_geography_response(frame, filters, "district")
    except (FileNotFoundError, ValueError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/verify-dashboard")
async def verify_dashboard_endpoint(body: VerifyDashboardRequest) -> dict:
    try:
        return await verify_dashboard(body.model_dump())
    except (FileNotFoundError, ValueError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
