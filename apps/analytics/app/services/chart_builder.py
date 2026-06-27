from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import plotly.graph_objects as go
import plotly.io as pio
import seaborn as sns

from app.config import settings

RISK_COLORS = {
    "On Track": "#16a34a",
    "Behind": "#ca8a04",
    "At Risk": "#ea580c",
    "Critical": "#dc2626",
}

METRIC_COLORS = {
    "participationRate": "#2563eb",
    "evidenceSubmissionRate": "#7c3aed",
    "attendanceRate": "#0891b2",
}

CHART_FONT = {"family": "IBM Plex Sans, system-ui, sans-serif", "size": 11, "color": "#64748b"}


def _legend_below() -> dict[str, Any]:
    return {
        "orientation": "h",
        "yanchor": "top",
        "y": -0.22,
        "x": 0,
        "xanchor": "left",
        "font": {"size": 10, "color": "#64748b"},
    }


def _dashboard_layout(**overrides: Any) -> dict[str, Any]:
    layout = {
        "template": "plotly_white",
        "font": CHART_FONT,
        "margin": {"l": 56, "r": 20, "t": 24, "b": 72},
        "legend": _legend_below(),
        "paper_bgcolor": "rgba(255,255,255,0)",
        "plot_bgcolor": "rgba(255,255,255,0)",
    }
    layout.update(overrides)
    return layout


def filters_hash(chart_type: str, filters: dict[str, Any]) -> str:
    payload = json.dumps({"chartType": chart_type, "filters": filters}, sort_keys=True)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:12]


def empty_figure(title: str, message: str) -> go.Figure:
    fig = go.Figure()
    fig.add_annotation(
        text=message,
        xref="paper",
        yref="paper",
        x=0.5,
        y=0.5,
        showarrow=False,
        font={"size": 16, "color": "#64748b"},
    )
    fig.update_layout(
        title=title,
        xaxis={"visible": False},
        yaxis={"visible": False},
        template="plotly_white",
        height=420,
    )
    return fig


def figure_to_json(fig: go.Figure) -> dict[str, Any]:
    return json.loads(pio.to_json(fig))


def export_png_matplotlib(
    chart_type: str,
    file_stub: str,
    plot_fn,
) -> str | None:
    output_dir = settings.chart_output_dir
    output_dir.mkdir(parents=True, exist_ok=True)
    png_path = output_dir / f"{file_stub}.png"

    sns.set_theme(style="whitegrid")
    plt.figure(figsize=(10, 5))
    try:
        plot_fn(plt.gca())
        plt.tight_layout()
        plt.savefig(png_path, dpi=144, bbox_inches="tight")
    finally:
        plt.close()

    analytics_root = settings.chart_output_dir.parent.parent  # apps/analytics
    try:
        return str(png_path.relative_to(analytics_root))
    except ValueError:
        return str(png_path)


def build_program_trends_chart(data, filters: dict[str, Any], export_png: bool = True) -> dict[str, Any]:
    chart_type = "program-trends"
    file_stub = f"{chart_type}-{filters_hash(chart_type, filters)}"

    if data.empty or int(data["totalSchools"].sum()) == 0:
        fig = empty_figure(
            "Program Trends (Jul - Sep 2025)",
            "No data available for the selected filters.",
        )
        return {
            "chartType": chart_type,
            "filters": filters,
            "isEmpty": True,
            "plotlyFigure": figure_to_json(fig),
            "pngPath": None,
            "summary": {"months": [], "totalSchools": 0},
        }

    fig = go.Figure()
    months = data["reportingMonth"].tolist()
    for metric, label in [
        ("participationRate", "Participation"),
        ("evidenceSubmissionRate", "Evidence submission"),
        ("attendanceRate", "Attendance"),
    ]:
        fig.add_trace(
            go.Scatter(
                x=months,
                y=(data[metric] * 100).round(2),
                mode="lines+markers",
                name=label,
                line={"color": METRIC_COLORS[metric], "width": 3},
            )
        )

    fig.update_layout(
        **_dashboard_layout(
            title="Program Trends (Jul - Sep 2025)",
            xaxis_title="Month",
            yaxis_title="Rate (%)",
            yaxis={"range": [0, 100], "gridcolor": "#e2e8f0", "zeroline": False},
            xaxis={"gridcolor": "#f1f5f9"},
            height=420,
        )
    )

    png_path = None
    if export_png:

        def _plot(ax):
            for metric, label in [
                ("participationRate", "Participation"),
                ("evidenceSubmissionRate", "Evidence"),
                ("attendanceRate", "Attendance"),
            ]:
                ax.plot(
                    data["reportingMonth"],
                    data[metric] * 100,
                    marker="o",
                    label=label,
                    color=METRIC_COLORS[metric],
                )
            ax.set_title("Program Trends (Jul - Sep 2025)")
            ax.set_ylabel("Rate (%)")
            ax.set_xlabel("Reporting month")
            ax.set_ylim(0, 100)
            ax.legend()

        png_path = export_png_matplotlib(chart_type, file_stub, _plot)

    return {
        "chartType": chart_type,
        "filters": filters,
        "isEmpty": False,
        "plotlyFigure": figure_to_json(fig),
        "pngPath": png_path,
        "summary": {
            "months": months,
            "totalSchools": int(data["totalSchools"].max()),
            "latestParticipationPct": round(float(data["participationRate"].iloc[-1]) * 100, 2),
        },
    }


def build_district_performance_chart(data, filters: dict[str, Any], export_png: bool = True) -> dict[str, Any]:
    chart_type = "district-performance"
    file_stub = f"{chart_type}-{filters_hash(chart_type, filters)}"

    if data.empty:
        fig = empty_figure(
            "District Performance",
            "No districts match the selected filters.",
        )
        return {
            "chartType": chart_type,
            "filters": filters,
            "isEmpty": True,
            "plotlyFigure": figure_to_json(fig),
            "pngPath": None,
            "summary": {"districtCount": 0},
        }

    colors = data["tier"].map({"top": "#16a34a", "bottom": "#dc2626"}).tolist()
    fig = go.Figure(
        go.Bar(
            x=(data["compositeScore"] * 100).round(2),
            y=data["district"],
            orientation="h",
            marker={"color": colors},
        )
    )
    fig.update_layout(
        **_dashboard_layout(
            title="District Performance (Top & Bottom)",
            xaxis_title="Composite score (%)",
            yaxis_title="",
            showlegend=False,
            margin={"l": 96, "r": 24, "t": 24, "b": 48},
            xaxis={"range": [0, 100], "gridcolor": "#e2e8f0"},
            yaxis={"tickfont": {"size": 11, "color": "#334155"}, "automargin": True},
            height=max(420, len(data) * 34),
        )
    )

    png_path = None
    if export_png:

        def _plot(ax):
            sns.barplot(
                data=data,
                y="district",
                x="compositeScore",
                hue="tier",
                dodge=False,
                palette={"top": "#16a34a", "bottom": "#dc2626"},
                ax=ax,
            )
            ax.set_xlabel("Composite score")
            ax.set_title("District Performance (Top & Bottom)")
            ax.set_xlim(0, 1)

        png_path = export_png_matplotlib(chart_type, file_stub, _plot)

    return {
        "chartType": chart_type,
        "filters": filters,
        "isEmpty": False,
        "plotlyFigure": figure_to_json(fig),
        "pngPath": png_path,
        "summary": {
            "districtCount": int(data["district"].nunique()),
            "topDistrict": str(data[data["tier"] == "top"]["district"].iloc[0])
            if (data["tier"] == "top").any()
            else None,
        },
    }


def build_risk_distribution_chart(data, filters: dict[str, Any], export_png: bool = True) -> dict[str, Any]:
    chart_type = "risk-distribution"
    file_stub = f"{chart_type}-{filters_hash(chart_type, filters)}"

    if data.empty or int(data["count"].sum()) == 0:
        fig = empty_figure(
            "Risk Distribution",
            "No schools available for risk distribution with these filters.",
        )
        return {
            "chartType": chart_type,
            "filters": filters,
            "isEmpty": True,
            "plotlyFigure": figure_to_json(fig),
            "pngPath": None,
            "summary": {"totalSchools": 0},
        }

    fig = go.Figure()
    for status in ["On Track", "Behind", "At Risk", "Critical"]:
        subset = data[data["riskStatus"] == status]
        fig.add_trace(
            go.Bar(
                x=subset["reportingMonth"],
                y=subset["count"],
                name=status,
                marker={"color": RISK_COLORS[status]},
            )
        )

    fig.update_layout(
        **_dashboard_layout(
            barmode="stack",
            title="Risk Status Distribution by Month",
            xaxis_title="Month",
            yaxis_title="School count",
            xaxis={"type": "category", "tickangle": 0},
            yaxis={"gridcolor": "#e2e8f0"},
            height=420,
        )
    )

    png_path = None
    if export_png:

        def _plot(ax):
            pivot = data.pivot(index="reportingMonth", columns="riskStatus", values="count").fillna(0)
            pivot = pivot[["On Track", "Behind", "At Risk", "Critical"]]
            pivot.plot(kind="bar", stacked=True, ax=ax, color=[RISK_COLORS[s] for s in pivot.columns])
            ax.set_title("Risk Status Distribution by Month")
            ax.set_xlabel("Reporting month")
            ax.set_ylabel("School count")
            ax.legend(title="Risk status")

        png_path = export_png_matplotlib(chart_type, file_stub, _plot)

    return {
        "chartType": chart_type,
        "filters": filters,
        "isEmpty": False,
        "plotlyFigure": figure_to_json(fig),
        "pngPath": png_path,
        "summary": {
            "totalSchools": int(data["count"].sum()),
            "byStatus": data.groupby("riskStatus")["count"].sum().to_dict(),
        },
    }


def build_grant_utilization_chart(data, filters: dict[str, Any], export_png: bool = True) -> dict[str, Any]:
    chart_type = "grant-utilization"
    file_stub = f"{chart_type}-{filters_hash(chart_type, filters)}"

    if data.empty:
        fig = empty_figure(
            "Grant Utilization",
            "No grant finance rows match the selected filters.",
        )
        return {
            "chartType": chart_type,
            "filters": filters,
            "isEmpty": True,
            "plotlyFigure": figure_to_json(fig),
            "pngPath": None,
            "summary": {"budgetLines": 0},
        }

    data = data.copy()
    data["label"] = data["grantId"] + " / " + data["reportingMonth"] + " / " + data["budgetLine"]

    fig = go.Figure(
        go.Bar(
            x=data["label"],
            y=(data["cumulativeUtilizationRate"] * 100).round(2),
            marker={"color": "#4f46e5"},
            text=(data["cumulativeUtilizationRate"] * 100).round(1).astype(str) + "%",
            textposition="auto",
        )
    )
    fig.update_layout(
        title="Grant Budget Line Utilization",
        xaxis_title="Grant / Month / Budget line",
        yaxis_title="Cumulative utilization (%)",
        yaxis={"range": [0, 100]},
        template="plotly_white",
        height=max(420, len(data) * 18),
        xaxis={"tickangle": -35},
    )

    png_path = None
    if export_png:

        def _plot(ax):
            sns.barplot(
                data=data,
                x="label",
                y="cumulativeUtilizationRate",
                color="#4f46e5",
                ax=ax,
            )
            ax.set_title("Grant Budget Line Utilization")
            ax.set_ylabel("Cumulative utilization")
            ax.set_xlabel("Grant / Month / Budget line")
            ax.tick_params(axis="x", rotation=35)

        png_path = export_png_matplotlib(chart_type, file_stub, _plot)

    return {
        "chartType": chart_type,
        "filters": filters,
        "isEmpty": False,
        "plotlyFigure": figure_to_json(fig),
        "pngPath": png_path,
        "summary": {
            "budgetLines": int(len(data)),
            "grants": sorted(data["grantId"].unique().tolist()),
        },
    }
