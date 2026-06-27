from pathlib import Path

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    host: str = "0.0.0.0"
    port: int = Field(default=8000, validation_alias=AliasChoices("ANALYTICS_PORT", "PORT"))
    log_level: str = "info"
    data_root: Path = Path("../../data")
    pbl_csv_dir: Path = Path("../../data/pbl/csv_exports")
    grant_csv_dir: Path = Path("../../data/grant/csv")
    chart_output_dir: Path = Path("./output/charts")
    reports_dir: Path = Path("./reports")
    node_server_url: str = "http://localhost:5000"

    def resolve_from_service_root(self, value: Path) -> Path:
        service_root = Path(__file__).resolve().parents[1]
        if value.is_absolute():
            return value
        return (service_root / value).resolve()


settings = Settings()
settings.data_root = settings.resolve_from_service_root(settings.data_root)
settings.pbl_csv_dir = settings.resolve_from_service_root(settings.pbl_csv_dir)
settings.grant_csv_dir = settings.resolve_from_service_root(settings.grant_csv_dir)
settings.chart_output_dir = settings.resolve_from_service_root(settings.chart_output_dir)
settings.reports_dir = settings.resolve_from_service_root(settings.reports_dir)
settings.chart_output_dir.mkdir(parents=True, exist_ok=True)
settings.reports_dir.mkdir(parents=True, exist_ok=True)
