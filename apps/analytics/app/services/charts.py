from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from app.services.chart_builder import (
    build_district_performance_chart,
    build_grant_utilization_chart,
    build_program_trends_chart,
    build_risk_distribution_chart,
)
from app.services.chart_data import (
    build_district_performance_data,
    build_grant_utilization_data,
    build_program_trends_data,
    build_risk_distribution_data,
    load_chart_context,
)
from app.services.program_intelligence import normalize_filters


class ChartFilterRequest(BaseModel):
    month: str | None = None
    reportingMonth: str | None = None
    district: str | None = None
    block: str | None = None
    grade: str | None = None
    subject: str | None = None
    grantId: str | None = None
    exportPng: bool = Field(default=True, description="Generate static PNG via matplotlib/seaborn")


def _filters_from_request(body: ChartFilterRequest) -> dict[str, str | None]:
    normalized = normalize_filters(body.model_dump())
    if body.grantId:
        normalized["grantId"] = body.grantId
    return normalized


def generate_program_trends(body: ChartFilterRequest) -> dict[str, Any]:
    filters = _filters_from_request(body)
    frame, _ = load_chart_context(filters)
    data = build_program_trends_data(frame, filters)
    return build_program_trends_chart(data, filters, export_png=body.exportPng)


def generate_district_performance(body: ChartFilterRequest) -> dict[str, Any]:
    filters = _filters_from_request(body)
    frame, _ = load_chart_context(filters)
    data = build_district_performance_data(frame, filters)
    return build_district_performance_chart(data, filters, export_png=body.exportPng)


def generate_risk_distribution(body: ChartFilterRequest) -> dict[str, Any]:
    filters = _filters_from_request(body)
    frame, _ = load_chart_context(filters)
    data = build_risk_distribution_data(frame, filters)
    return build_risk_distribution_chart(data, filters, export_png=body.exportPng)


def generate_grant_utilization(body: ChartFilterRequest) -> dict[str, Any]:
    filters = _filters_from_request(body)
    data = build_grant_utilization_data(filters)
    return build_grant_utilization_chart(data, filters, export_png=body.exportPng)
