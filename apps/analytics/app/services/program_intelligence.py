from __future__ import annotations

from typing import Any

import pandas as pd

from app.services.ingestion import coerce_school_response_types, load_school_response_frame

REPORTING_MONTHS = ["2025-07", "2025-08", "2025-09"]
LATEST_MONTH = "2025-09"

GRADE_PATTERNS = {
    "6": r"\bClass(?:es)?\s+6\b",
    "7": r"\bClass(?:es)?\s+7\b",
    "8": r"\bClass(?:es)?\s+8\b",
}


def _resolve_month(month: str | None) -> str:
    if month in REPORTING_MONTHS:
        return month
    return LATEST_MONTH


def _previous_month(month: str) -> str | None:
    index = REPORTING_MONTHS.index(month)
    if index <= 0:
        return None
    return REPORTING_MONTHS[index - 1]


def _matches_grade(classes: str, grade: str) -> bool:
    pattern = GRADE_PATTERNS.get(grade)
    if pattern:
        return bool(pd.Series([classes]).str.contains(pattern, case=False, regex=True).iloc[0])
    return grade in classes


def _matches_subject(subjects: str, subject: str) -> bool:
    value = subjects.lower()
    normalized = subject.strip().lower()
    if normalized == "math":
        return "math" in value
    if normalized == "science":
        return "science" in value
    return normalized in value


def _filter_frame(frame: pd.DataFrame, filters: dict[str, str | None]) -> pd.DataFrame:
    month = _resolve_month(filters.get("month"))
    scoped = frame[frame["reportingMonth"] == month].copy()

    if filters.get("district"):
        scoped = scoped[scoped["district"] == filters["district"]]
    if filters.get("block"):
        scoped = scoped[scoped["block"] == filters["block"]]
    if filters.get("grade"):
        grade = str(filters["grade"])
        scoped = scoped[scoped["classes"].apply(lambda value: _matches_grade(str(value), grade))]
    if filters.get("subject"):
        subject = str(filters["subject"])
        scoped = scoped[scoped["subjects"].apply(lambda value: _matches_subject(str(value), subject))]

    return scoped


def _grade_metrics(row: pd.Series, grade: str, subject: str | None = None) -> tuple[float, float, float]:
    enrollment = float(row[f"enrollmentClass{grade}"])
    science = float(row[f"attendanceClass{grade}Science"])
    math = float(row[f"attendanceClass{grade}Math"])

    attendance = 0.0
    subject_norm = subject.lower() if subject else None
    if not subject_norm or subject_norm == "science":
        attendance += science
    if not subject_norm or subject_norm == "math":
        attendance += math
    if subject_norm == "math and science":
        attendance = science + math

    rate = min(attendance / enrollment, 1.0) if enrollment > 0 else 0.0
    return enrollment, attendance, rate


def _scoped_metrics(row: pd.Series, grade: str | None, subject: str | None) -> tuple[float, float, float]:
    if not grade and not subject:
        return float(row["totalEnrollment"]), float(row["totalAttendance"]), float(row["attendanceRate"])

    if grade in {"6", "7", "8"}:
        return _grade_metrics(row, grade, subject)

    if subject:
        enrollment = 0.0
        attendance = 0.0
        for g in ("6", "7", "8"):
            if _matches_grade(str(row["classes"]), g):
                e, a, _ = _grade_metrics(row, g, subject)
                enrollment += e
                attendance += a
        rate = min(attendance / enrollment, 1.0) if enrollment > 0 else 0.0
        return enrollment, attendance, rate

    return float(row["totalEnrollment"]), float(row["totalAttendance"]), float(row["attendanceRate"])


def _aggregate_attendance(frame: pd.DataFrame, grade: str | None, subject: str | None) -> dict[str, float]:
    total_enrollment = 0.0
    total_attendance = 0.0
    weighted_rate = 0.0
    weight = 0.0

    for _, row in frame.iterrows():
        enrollment, attendance, rate = _scoped_metrics(row, grade, subject)
        total_enrollment += enrollment
        total_attendance += attendance
        if enrollment > 0:
            weighted_rate += rate * enrollment
            weight += enrollment

    attendance_rate = weighted_rate / weight if weight > 0 else 0.0
    return {
        "totalEnrollment": total_enrollment,
        "totalAttendance": total_attendance,
        "attendanceRate": attendance_rate,
    }


def _participation_metrics(frame: pd.DataFrame) -> dict[str, float | int]:
    total = len(frame)
    participating = int(frame["pblConducted"].sum()) if total else 0
    return {
        "totalSchools": total,
        "participatingSchools": participating,
        "participationRate": participating / total if total else 0.0,
    }


def _evidence_metrics(frame: pd.DataFrame) -> dict[str, float | int]:
    total = len(frame)
    evidence = int(frame["evidenceSubmitted"].sum()) if total else 0
    return {
        "evidenceSchools": evidence,
        "evidenceSubmissionRate": evidence / total if total else 0.0,
    }


def classify_risk(rate_decimal: float) -> str:
    pct = rate_decimal * 100
    if pct >= 75:
        return "On Track"
    if pct >= 60:
        return "Behind"
    if pct >= 35:
        return "At Risk"
    return "Critical"


def explain_risk(label: str, rate_decimal: float) -> str:
    pct_text = f"{rate_decimal * 100:.1f}"
    status = classify_risk(rate_decimal)
    if status == "On Track":
        return f"{label} is {pct_text}%, classified as On Track (>= 75%)."
    if status == "Behind":
        return f"{label} is {pct_text}%, classified as Behind (60% to below 75%)."
    if status == "At Risk":
        return f"{label} is {pct_text}%, classified as At Risk (35% to below 60%)."
    return f"{label} is {pct_text}%, classified as Critical (below 35%)."


def build_dashboard_metrics(frame: pd.DataFrame, filters: dict[str, str | None]) -> dict[str, Any]:
    month = _resolve_month(filters.get("month"))
    current = _filter_frame(frame, {**filters, "month": month})
    participation = _participation_metrics(current)
    evidence = _evidence_metrics(current)
    attendance = _aggregate_attendance(current, filters.get("grade"), filters.get("subject"))

    mom: dict[str, float | None] = {}
    previous = _previous_month(month)
    if previous:
        prev = _filter_frame(frame, {**filters, "month": previous})
        prev_participation = _participation_metrics(prev)
        prev_evidence = _evidence_metrics(prev)
        prev_attendance = _aggregate_attendance(prev, filters.get("grade"), filters.get("subject"))
        mom = {
            "participationRate": round(
                participation["participationRate"] - prev_participation["participationRate"], 4
            ),
            "evidenceSubmissionRate": round(
                evidence["evidenceSubmissionRate"] - prev_evidence["evidenceSubmissionRate"], 4
            ),
            "attendanceRate": round(
                attendance["attendanceRate"] - prev_attendance["attendanceRate"], 4
            ),
        }

    return {
        "reportingMonth": month,
        "previousMonth": previous,
        "filters": {
            "reportingMonth": month,
            "district": filters.get("district"),
            "block": filters.get("block"),
            "grade": filters.get("grade"),
            "subject": filters.get("subject"),
        },
        "metrics": {
            **participation,
            **evidence,
            **attendance,
            "monthOverMonth": mom,
        },
    }


def _group_performance(
    frame: pd.DataFrame,
    filters: dict[str, str | None],
    level: str,
) -> list[dict[str, Any]]:
    scoped = _filter_frame(frame, filters)
    group_col = "district" if level == "district" else "block"
    performers: list[dict[str, Any]] = []

    for name, group in scoped.groupby(group_col, sort=True):
        participation = _participation_metrics(group)
        evidence = _evidence_metrics(group)
        attendance = _aggregate_attendance(group, filters.get("grade"), filters.get("subject"))
        composite = (
            participation["participationRate"]
            + evidence["evidenceSubmissionRate"]
            + attendance["attendanceRate"]
        ) / 3

        district = None
        if level == "block":
            district = str(group["district"].iloc[0])

        performers.append(
            {
                "name": str(name),
                "level": level,
                "district": district,
                "participationRate": participation["participationRate"],
                "evidenceSubmissionRate": evidence["evidenceSubmissionRate"],
                "attendanceRate": attendance["attendanceRate"],
                "riskStatus": classify_risk(composite),
                "schoolCount": participation["totalSchools"],
                "compositeScore": composite,
            }
        )

    return sorted(performers, key=lambda item: item["compositeScore"], reverse=True)


def build_geography_response(frame: pd.DataFrame, filters: dict[str, str | None], level: str) -> dict[str, Any]:
    performers = _group_performance(frame, filters, level)
    return {
        "reportingMonth": _resolve_month(filters.get("month")),
        "filters": {
            "reportingMonth": _resolve_month(filters.get("month")),
            "district": filters.get("district"),
            "block": filters.get("block"),
            "grade": filters.get("grade"),
            "subject": filters.get("subject"),
        },
        "performers": performers,
        "highPerformers": performers[:5],
        "lowPerformers": list(reversed(performers[-5:])),
    }


def load_program_frame() -> pd.DataFrame:
    frame = load_school_response_frame()
    typed = coerce_school_response_types(frame)
    typed["pblConducted"] = typed["pblConducted"].fillna(False)
    typed["evidenceSubmitted"] = typed["evidenceSubmitted"].fillna(False)
    return typed


def normalize_filters(payload: dict[str, Any]) -> dict[str, str | None]:
    return {
        "month": payload.get("month") or payload.get("reportingMonth"),
        "district": payload.get("district"),
        "block": payload.get("block"),
        "grade": payload.get("grade"),
        "subject": payload.get("subject"),
    }
