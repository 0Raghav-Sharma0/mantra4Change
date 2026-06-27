from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routers.analytics import router as analytics_router
from app.routers.charts import router as charts_router
from app.routers.health import router as health_router

app = FastAPI(
    title="Mantra4Change Analytics Service",
    description="Deterministic pandas/numpy aggregations and chart generation",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(analytics_router)
app.include_router(charts_router)
app.mount("/static/charts", StaticFiles(directory=str(settings.chart_output_dir)), name="chart-exports")


@app.get("/")
def root() -> dict[str, str]:
    return {
        "service": "mantra4change-analytics",
        "data_root": str(settings.data_root),
    }
