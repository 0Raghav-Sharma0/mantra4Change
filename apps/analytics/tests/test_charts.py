from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app
from app.services.charts import ChartFilterRequest

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_program_trends_chart_endpoint():
    response = client.post(
        "/charts/program-trends",
        json=ChartFilterRequest(month="2025-09", exportPng=False).model_dump(),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["chartType"] == "program-trends"
    assert body["isEmpty"] is False
    assert "plotlyFigure" in body
    assert body["plotlyFigure"]["data"]


def test_district_performance_chart_endpoint():
    response = client.post(
        "/charts/district-performance",
        json={"month": "2025-09", "exportPng": False},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["chartType"] == "district-performance"
    assert body["isEmpty"] is False


def test_risk_distribution_chart_endpoint():
    response = client.post(
        "/charts/risk-distribution",
        json={"month": "2025-09", "exportPng": False},
    )
    assert response.status_code == 200
    assert response.json()["chartType"] == "risk-distribution"


def test_grant_utilization_chart_endpoint():
    response = client.post(
        "/charts/grant-utilization",
        json={"grantId": "GRANT_AA_2025", "month": "2025-09", "exportPng": False},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["chartType"] == "grant-utilization"
    assert body["isEmpty"] is False
