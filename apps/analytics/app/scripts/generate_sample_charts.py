"""Generate sample chart JSON responses for documentation and smoke tests."""

import json
from pathlib import Path

from app.services.charts import (
    ChartFilterRequest,
    generate_district_performance,
    generate_grant_utilization,
    generate_program_trends,
    generate_risk_distribution,
)


def main() -> None:
    samples_dir = Path(__file__).resolve().parents[1] / "samples" / "chart-responses"
    samples_dir.mkdir(parents=True, exist_ok=True)

    scenarios: list[tuple[str, ChartFilterRequest, object]] = [
        ("program-trends-default", ChartFilterRequest(), generate_program_trends),
        (
            "program-trends-district-a",
            ChartFilterRequest(district="District A", month="2025-09"),
            generate_program_trends,
        ),
        (
            "district-performance-default",
            ChartFilterRequest(month="2025-09"),
            generate_district_performance,
        ),
        ("risk-distribution-default", ChartFilterRequest(), generate_risk_distribution),
        (
            "grant-utilization-default",
            ChartFilterRequest(month="2025-09"),
            generate_grant_utilization,
        ),
        (
            "grant-utilization-grant-aa",
            ChartFilterRequest(grantId="GRANT_AA_2025", month="2025-09"),
            generate_grant_utilization,
        ),
        (
            "empty-district-filter",
            ChartFilterRequest(district="Nonexistent District XYZ", month="2025-09"),
            generate_district_performance,
        ),
    ]

    for name, request, generator in scenarios:
        payload = generator(request)
        output = samples_dir / f"{name}.json"
        output.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        print(f"Wrote {output} (isEmpty={payload.get('isEmpty')})")


if __name__ == "__main__":
    main()
