"""Generate apps/analytics/reports/data_quality.json from CSV sources."""

from app.services.data_quality import save_data_quality_report


def main() -> None:
    path = save_data_quality_report()
    print(f"Data quality report written to {path}")


if __name__ == "__main__":
    main()
