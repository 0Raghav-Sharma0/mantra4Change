from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.config import settings
from app.services.ingestion import load_all_normalized_frames, summarize_dataset


def build_data_quality_report() -> dict[str, Any]:
    frames = load_all_normalized_frames()
    datasets = {
        name: summarize_dataset(name, frame)
        for name, frame in frames.items()
    }

    school = datasets.get("schoolResponse", {})
    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "dataRoot": str(settings.data_root),
        "assumptions": [
            "Synthetic assessment data only - not official monitoring records.",
            "One school response row per school per reporting month.",
            "Attendance and utilization rates are stored as decimals (0-1).",
        ],
        "summary": {
            "totalRows": sum(item.get("rowCount", 0) for item in datasets.values()),
            "schoolResponseRows": school.get("rowCount", 0),
            "uniqueDistricts": school.get("uniqueCounts", {}).get("districts", 0),
            "uniqueBlocks": school.get("uniqueCounts", {}).get("blocks", 0),
            "uniqueSchools": school.get("uniqueCounts", {}).get("schools", 0),
            "reportingMonths": school.get("monthCoverage", {}).get("months", []),
        },
        "datasets": datasets,
    }


def save_data_quality_report(output_path: Path | None = None) -> Path:
    report = build_data_quality_report()
    target = output_path or (settings.reports_dir / "data_quality.json")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(report, indent=2), encoding="utf-8")
    return target
