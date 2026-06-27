from __future__ import annotations

from typing import Any

import pandas as pd

from app.services.program_intelligence import (
    REPORTING_MONTHS,
    _aggregate_attendance,
    _evidence_metrics,
    _participation_metrics,
    load_program_frame,
    normalize_filters,
)


def filter_frame_scoped(frame: pd.DataFrame, filters: dict[str, str | None]) -> pd.DataFrame:
    """Apply dashboard filters; optional month restricts to one reporting month."""
    from app.services.program_intelligence import (
        _matches_grade,
        _matches_subject,
    )

    scoped = frame.copy()
    if filters.get("month"):
        scoped = scoped[scoped["reportingMonth"] == filters["month"]]
    if filters.get("district"):
        scoped = scoped[scoped["district"] == filters["district"]]
    if filters.get("block"):
        scoped = scoped[scoped["block"] == filters["block"]]
    if filters.get("grade"):
        grade = str(filters["grade"])
        scoped = scoped[scoped["classes"].apply(lambda v: _matches_grade(str(v), grade))]
    if filters.get("subject"):
        subject = str(filters["subject"])
        scoped = scoped[scoped["subjects"].apply(lambda v: _matches_subject(str(v), subject))]
    return scoped


def build_program_trends_data(
    frame: pd.DataFrame,
    filters: dict[str, str | None],
) -> pd.DataFrame:
    trend_filters = {**filters, "month": None}
    scoped = filter_frame_scoped(frame, trend_filters)
    rows: list[dict[str, Any]] = []

    for month in REPORTING_MONTHS:
        month_frame = scoped[scoped["reportingMonth"] == month]
        participation = _participation_metrics(month_frame)
        evidence = _evidence_metrics(month_frame)
        attendance = _aggregate_attendance(month_frame, filters.get("grade"), filters.get("subject"))
        rows.append(
            {
                "reportingMonth": month,
                "participationRate": participation["participationRate"],
                "evidenceSubmissionRate": evidence["evidenceSubmissionRate"],
                "attendanceRate": attendance["attendanceRate"],
                "totalSchools": participation["totalSchools"],
            }
        )

    return pd.DataFrame(rows)


def build_district_performance_data(
    frame: pd.DataFrame,
    filters: dict[str, str | None],
    limit: int = 5,
) -> pd.DataFrame:
    from app.services.program_intelligence import _resolve_month

    month = _resolve_month(filters.get("month"))
    month_filters = {**filters, "month": month}
    scoped = filter_frame_scoped(frame, month_filters)

    if scoped.empty:
        return pd.DataFrame(
            columns=["district", "compositeScore", "participationRate", "tier"]
        )

    rows: list[dict[str, Any]] = []
    for district, group in scoped.groupby("district", sort=True):
        participation = _participation_metrics(group)
        evidence = _evidence_metrics(group)
        attendance = _aggregate_attendance(group, filters.get("grade"), filters.get("subject"))
        composite = (
            participation["participationRate"]
            + evidence["evidenceSubmissionRate"]
            + attendance["attendanceRate"]
        ) / 3
        rows.append(
            {
                "district": str(district),
                "compositeScore": composite,
                "participationRate": participation["participationRate"],
                "evidenceSubmissionRate": evidence["evidenceSubmissionRate"],
                "attendanceRate": attendance["attendanceRate"],
                "schoolCount": participation["totalSchools"],
            }
        )

    ranked = pd.DataFrame(rows).sort_values("compositeScore", ascending=False)
    top = ranked.head(limit).assign(tier="top")
    bottom = ranked.tail(limit).sort_values("compositeScore", ascending=True).assign(tier="bottom")
    return pd.concat([top, bottom], ignore_index=True)


def build_risk_distribution_data(
    frame: pd.DataFrame,
    filters: dict[str, str | None],
) -> pd.DataFrame:
    trend_filters = {**filters, "month": None}
    scoped = filter_frame_scoped(frame, trend_filters)

    if scoped.empty:
        return pd.DataFrame(columns=["reportingMonth", "riskStatus", "count"])

    rows: list[dict[str, Any]] = []
    for month in REPORTING_MONTHS:
        month_frame = scoped[scoped["reportingMonth"] == month]
        if month_frame.empty:
            for status in ["On Track", "Behind", "At Risk", "Critical"]:
                rows.append({"reportingMonth": month, "riskStatus": status, "count": 0})
            continue

        status_series = month_frame["riskStatus"].fillna("Critical")
        counts = status_series.value_counts()
        for status in ["On Track", "Behind", "At Risk", "Critical"]:
            rows.append(
                {
                    "reportingMonth": month,
                    "riskStatus": status,
                    "count": int(counts.get(status, 0)),
                }
            )

    return pd.DataFrame(rows)


def build_grant_utilization_data(
    filters: dict[str, str | None],
) -> pd.DataFrame:
    from app.services.ingestion import coerce_grant_finance_types, load_grant_finance_frame

    finance = coerce_grant_finance_types(load_grant_finance_frame())
    scoped = finance.copy()

    if filters.get("month"):
        scoped = scoped[scoped["reportingMonth"] == filters["month"]]
    if filters.get("grantId"):
        scoped = scoped[scoped["grantId"] == filters["grantId"]]

    if scoped.empty:
        return pd.DataFrame(
            columns=[
                "grantId",
                "reportingMonth",
                "budgetLine",
                "cumulativeUtilizationRate",
                "approvedBudgetUnits",
                "cumulativeUtilizedUnits",
            ]
        )

    return scoped[
        [
            "grantId",
            "reportingMonth",
            "budgetLine",
            "cumulativeUtilizationRate",
            "approvedBudgetUnits",
            "cumulativeUtilizedUnits",
        ]
    ].sort_values(["grantId", "reportingMonth", "budgetLine"])


def load_chart_context(filters: dict[str, str | None]) -> tuple[pd.DataFrame, dict[str, str | None]]:
    return load_program_frame(), normalize_filters(filters)
