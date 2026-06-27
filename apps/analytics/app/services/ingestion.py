from __future__ import annotations

from pathlib import Path
from typing import Any

import pandas as pd

from app.config import settings
from app.services.column_maps import (
    DATASET_SCHEMAS,
    EVIDENCE_MEDIA_COLUMN_MAP,
    GRANT_FINANCE_COLUMN_MAP,
    GRANT_PERFORMANCE_COLUMN_MAP,
    PBL_COLUMN_MAP,
)


def _read_csv(path: Path) -> pd.DataFrame:
    return pd.read_csv(path, dtype=str, keep_default_na=True)


def _normalize_columns(frame: pd.DataFrame, column_map: dict[str, str]) -> pd.DataFrame:
    missing = [source for source in column_map if source not in frame.columns]
    if missing:
        raise ValueError(f"Missing expected columns: {missing[:5]}{'...' if len(missing) > 5 else ''}")
    return frame.rename(columns=column_map)


def _parse_yes_no(series: pd.Series) -> pd.Series:
    normalized = series.fillna("").astype(str).str.strip().str.lower()
    return normalized.isin(["yes", "y", "true", "1"])


def _parse_numeric(series: pd.Series) -> pd.Series:
    cleaned = series.fillna("").astype(str).str.replace(",", "", regex=False).str.strip()
    return pd.to_numeric(cleaned, errors="coerce")


def _parse_dates(series: pd.Series) -> pd.Series:
    return pd.to_datetime(series, errors="coerce", utc=False)


def list_pbl_csv_files() -> list[Path]:
    directory = settings.pbl_csv_dir
    if not directory.exists():
        raise FileNotFoundError(f"PBL CSV directory not found: {directory}")
    return sorted(directory.glob("PBL_School_Response_Data_*.csv"))


def list_grant_csv_files() -> dict[str, Path]:
    directory = settings.grant_csv_dir
    files = {
        "grantFinance": directory / "01_Grant_Profile_and_Finance.csv",
        "grantPerformance": directory / "02_Grant_Performance_and_Report_Material.csv",
        "evidenceMedia": directory / "03_Evidence_and_Media_Index.csv",
    }
    for name, path in files.items():
        if not path.exists():
            raise FileNotFoundError(f"{name} CSV not found: {path}")
    return files


def load_school_response_frame() -> pd.DataFrame:
    frames: list[pd.DataFrame] = []
    for csv_path in list_pbl_csv_files():
        raw = _read_csv(csv_path)
        raw["sourceFile"] = csv_path.name
        normalized = _normalize_columns(raw, PBL_COLUMN_MAP)
        frames.append(normalized)
    if not frames:
        return pd.DataFrame(columns=list(PBL_COLUMN_MAP.values()))
    return pd.concat(frames, ignore_index=True)


def load_grant_finance_frame() -> pd.DataFrame:
    path = list_grant_csv_files()["grantFinance"]
    return _normalize_columns(_read_csv(path), GRANT_FINANCE_COLUMN_MAP)


def load_grant_performance_frame() -> pd.DataFrame:
    path = list_grant_csv_files()["grantPerformance"]
    return _normalize_columns(_read_csv(path), GRANT_PERFORMANCE_COLUMN_MAP)


def load_evidence_media_frame() -> pd.DataFrame:
    path = list_grant_csv_files()["evidenceMedia"]
    return _normalize_columns(_read_csv(path), EVIDENCE_MEDIA_COLUMN_MAP)


def coerce_school_response_types(frame: pd.DataFrame) -> pd.DataFrame:
    typed = frame.copy()
    typed["pblConducted"] = _parse_yes_no(typed["pblConducted"])
    typed["evidenceSubmitted"] = _parse_yes_no(typed["evidenceSubmitted"])
    typed["submittedAt"] = _parse_dates(typed["timestampRaw"])

    numeric_columns = [
        "enrollmentClass6",
        "attendanceClass6Science",
        "attendanceClass6Math",
        "enrollmentClass7",
        "attendanceClass7Science",
        "attendanceClass7Math",
        "enrollmentClass8",
        "attendanceClass8Science",
        "attendanceClass8Math",
        "totalEnrollment",
        "totalAttendance",
        "attendanceRate",
    ]
    for column in numeric_columns:
        typed[column] = _parse_numeric(typed[column])
    return typed


def coerce_grant_finance_types(frame: pd.DataFrame) -> pd.DataFrame:
    typed = frame.copy()
    typed["periodStart"] = _parse_dates(typed["periodStart"])
    typed["periodEnd"] = _parse_dates(typed["periodEnd"])
    for column in [
        "approvedBudgetUnits",
        "monthlyUtilizedUnits",
        "cumulativeUtilizedUnits",
        "cumulativeUtilizationRate",
    ]:
        typed[column] = _parse_numeric(typed[column])
    return typed


def coerce_grant_performance_types(frame: pd.DataFrame) -> pd.DataFrame:
    typed = frame.copy()
    typed["periodEndDate"] = _parse_dates(typed["periodEndDate"])
    typed["reportDueDate"] = _parse_dates(typed["reportDueDate"])
    for column in [
        "sampledSchoolRecords",
        "schoolsCompletedPbl",
        "pblCompletionRate",
        "schoolsWithEvidence",
        "evidenceSubmissionRate",
        "totalEnrollment",
        "totalAttendance",
        "attendanceRate",
    ]:
        typed[column] = _parse_numeric(typed[column])
    return typed


def load_all_normalized_frames() -> dict[str, pd.DataFrame]:
    return {
        "schoolResponse": coerce_school_response_types(load_school_response_frame()),
        "grantFinance": coerce_grant_finance_types(load_grant_finance_frame()),
        "grantPerformance": coerce_grant_performance_types(load_grant_performance_frame()),
        "evidenceMedia": load_evidence_media_frame(),
    }


def validate_schema(frame: pd.DataFrame, dataset_name: str) -> list[str]:
    expected = set(DATASET_SCHEMAS[dataset_name].values())
    actual = set(frame.columns)
    missing = sorted(expected - actual)
    if missing:
        return [f"Missing normalized columns: {missing}"]
    return []


def null_percentages(frame: pd.DataFrame) -> dict[str, float]:
    if frame.empty:
        return {}
    total = len(frame)
    result: dict[str, float] = {}
    for column in frame.columns:
        null_count = int(frame[column].isna().sum())
        if null_count == 0 and frame[column].astype(str).str.strip().eq("").any():
            null_count = int(frame[column].astype(str).str.strip().eq("").sum())
        result[column] = round((null_count / total) * 100, 2)
    return result


def month_coverage(frame: pd.DataFrame, month_column: str = "reportingMonth") -> dict[str, Any]:
    if month_column not in frame.columns or frame.empty:
        return {"months": [], "rowsPerMonth": {}}
    counts = frame[month_column].value_counts(dropna=False).to_dict()
    rows_per_month = {str(month): int(count) for month, count in counts.items()}
    return {
        "months": sorted(rows_per_month.keys()),
        "rowsPerMonth": rows_per_month,
    }


def school_response_uniques(frame: pd.DataFrame) -> dict[str, int]:
    return {
        "districts": int(frame["district"].nunique(dropna=True)),
        "blocks": int(frame["block"].nunique(dropna=True)),
        "schools": int(frame["schoolCode"].nunique(dropna=True)),
    }


def grant_uniques(frame: pd.DataFrame) -> dict[str, int]:
    return {
        "grants": int(frame["grantId"].nunique(dropna=True)),
        "donors": int(frame["donor"].nunique(dropna=True)),
    }


def duplicate_school_month_count(frame: pd.DataFrame) -> int:
    if frame.empty:
        return 0
    keys = frame[["reportingMonth", "schoolCode"]].astype(str)
    duplicated = keys.duplicated(keep=False)
    return int(duplicated.sum())


def summarize_dataset(name: str, frame: pd.DataFrame) -> dict[str, Any]:
    schema_errors = validate_schema(frame, name)
    summary: dict[str, Any] = {
        "rowCount": int(len(frame)),
        "columnCount": int(len(frame.columns)),
        "nullPercentages": null_percentages(frame),
        "schemaValid": len(schema_errors) == 0,
        "schemaErrors": schema_errors,
    }

    if name == "schoolResponse":
        summary["uniqueCounts"] = school_response_uniques(frame)
        summary["monthCoverage"] = month_coverage(frame)
        summary["duplicateSchoolMonthRows"] = duplicate_school_month_count(frame)
        if "sourceFile" in frame.columns:
            summary["sourceFiles"] = sorted(frame["sourceFile"].dropna().unique().tolist())
    elif name in {"grantFinance", "grantPerformance", "evidenceMedia"}:
        summary["uniqueCounts"] = grant_uniques(frame)
        summary["monthCoverage"] = month_coverage(frame)

    return summary
