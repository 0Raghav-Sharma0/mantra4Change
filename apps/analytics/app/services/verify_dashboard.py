from __future__ import annotations

from typing import Any

import httpx

from app.config import settings
from app.services.program_intelligence import (
    build_dashboard_metrics,
    build_geography_response,
    load_program_frame,
    normalize_filters,
)

FLOAT_TOLERANCE = 0.0001


def _flatten(prefix: str, value: Any, output: dict[str, Any]) -> None:
    if isinstance(value, dict):
        for key, nested in value.items():
            _flatten(f"{prefix}.{key}" if prefix else key, nested, output)
        return
    output[prefix] = value


def flatten_payload(payload: dict[str, Any]) -> dict[str, Any]:
    flat: dict[str, Any] = {}
    _flatten("", payload, flat)
    return {key.lstrip("."): value for key, value in flat.items()}


def compare_values(node_value: Any, pandas_value: Any) -> dict[str, Any] | None:
    if node_value is None and pandas_value is None:
        return None
    if isinstance(node_value, (int, float)) and isinstance(pandas_value, (int, float)):
        if abs(float(node_value) - float(pandas_value)) <= FLOAT_TOLERANCE:
            return None
    if node_value == pandas_value:
        return None
    return {"node": node_value, "pandas": pandas_value}


def diff_dashboard(node_payload: dict[str, Any], pandas_payload: dict[str, Any]) -> dict[str, Any]:
    node_flat = flatten_payload(node_payload)
    pandas_flat = flatten_payload(pandas_payload)

    keys = sorted(set(node_flat) | set(pandas_flat))
    diffs: dict[str, Any] = {}
    for key in keys:
        if key.endswith(".filters.reportingMonth"):
            continue
        diff = compare_values(node_flat.get(key), pandas_flat.get(key))
        if diff:
            diffs[key] = diff

    return {
        "match": len(diffs) == 0,
        "differences": diffs,
        "comparedKeys": len(keys),
    }


async def fetch_node_dashboard(filters: dict[str, str | None]) -> dict[str, Any]:
    params = {key: value for key, value in filters.items() if value}
    if params.get("month"):
        params["month"] = params["month"]

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f"{settings.node_server_url.rstrip('/')}/api/program/dashboard",
            params={
                "month": filters.get("month") or filters.get("reportingMonth"),
                "district": filters.get("district"),
                "block": filters.get("block"),
                "grade": filters.get("grade"),
                "subject": filters.get("subject"),
            },
        )
        response.raise_for_status()
        return response.json()


async def verify_dashboard(payload: dict[str, Any]) -> dict[str, Any]:
    filters = normalize_filters(payload)
    frame = load_program_frame()
    pandas_dashboard = build_dashboard_metrics(frame, filters)

    node_dashboard: dict[str, Any] | None = None
    node_error: str | None = None
    try:
        node_dashboard = await fetch_node_dashboard(filters)
    except Exception as exc:  # noqa: BLE001 - report verification errors to caller
        node_error = str(exc)

    result: dict[str, Any] = {
        "filters": filters,
        "pandas": pandas_dashboard,
        "node": node_dashboard,
        "nodeError": node_error,
    }

    if node_dashboard:
        result["dashboardDiff"] = diff_dashboard(node_dashboard, pandas_dashboard)
        pandas_districts = build_geography_response(frame, filters, "district")
        pandas_blocks = build_geography_response(frame, filters, "block")
        result["pandasDistrictCount"] = len(pandas_districts["performers"])
        result["pandasBlockCount"] = len(pandas_blocks["performers"])

    return result
