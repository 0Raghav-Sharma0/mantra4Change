"""Export dashboard metrics as JSON for Node verify script parity checks."""

from __future__ import annotations

import json
import sys

from app.services.program_intelligence import (
    build_dashboard_metrics,
    load_program_frame,
    normalize_filters,
)


def main() -> None:
    filters = normalize_filters({"month": "2025-09"})
    payload = build_dashboard_metrics(load_program_frame(), filters)
    json.dump(payload, sys.stdout)


if __name__ == "__main__":
    main()
