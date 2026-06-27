from __future__ import annotations

import pytest

from app.services.program_intelligence import (
    build_dashboard_metrics,
    build_geography_response,
    classify_risk,
    load_program_frame,
    normalize_filters,
)


@pytest.fixture(scope="module")
def program_frame():
    return load_program_frame()


def test_dashboard_metrics_shape(program_frame):
    filters = normalize_filters({"month": "2025-09"})
    payload = build_dashboard_metrics(program_frame, filters)

    assert payload["reportingMonth"] == "2025-09"
    metrics = payload["metrics"]
    assert metrics["totalSchools"] > 0
    assert 0 <= metrics["participationRate"] <= 1
    assert 0 <= metrics["evidenceSubmissionRate"] <= 1
    assert 0 <= metrics["attendanceRate"] <= 1
    assert "monthOverMonth" in metrics


def test_dashboard_mom_for_september(program_frame):
    filters = normalize_filters({"month": "2025-09"})
    payload = build_dashboard_metrics(program_frame, filters)
    mom = payload["metrics"]["monthOverMonth"]

    assert mom["participationRate"] is not None
    assert mom["evidenceSubmissionRate"] is not None
    assert mom["attendanceRate"] is not None


def test_district_geography_aggregation(program_frame):
    filters = normalize_filters({"month": "2025-09"})
    payload = build_geography_response(program_frame, filters, "district")

    assert len(payload["performers"]) > 0
    first = payload["performers"][0]
    assert "participationRate" in first
    assert first["level"] == "district"
    assert first["riskStatus"] in {"On Track", "Behind", "At Risk", "Critical"}


def test_risk_classification_thresholds():
    assert classify_risk(0.75) == "On Track"
    assert classify_risk(0.74) == "Behind"
    assert classify_risk(0.60) == "Behind"
    assert classify_risk(0.59) == "At Risk"
    assert classify_risk(0.35) == "At Risk"
    assert classify_risk(0.34) == "Critical"
