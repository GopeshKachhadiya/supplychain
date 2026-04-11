from pathlib import Path
from datetime import timedelta

import joblib
import numpy as np
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "arima_demand_model.pkl"
EXTERNAL_PATH = BASE_DIR / "supply_chain_external_factors.csv"


def load_artifacts() -> dict:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            "arima_demand_model.pkl not found. Run model_arima.py first."
        )
    return joblib.load(MODEL_PATH)


def predict_demand(
    product_id: str,
    warehouse_id: str,
    start_date: str,
    days: int = 7,
) -> list:
    """
    Return demand forecasts for the next `days` days.
    Uses the trained ARIMA/SARIMAX model and future external signals.
    """
    artifacts = load_artifacts()
    model_fit = artifacts["model_fit"]
    trained_product = artifacts["product_id"]
    trained_warehouse = artifacts["warehouse_id"]
    feature_columns = artifacts["feature_columns"]
    avg_unit_price = artifacts["avg_unit_price"]

    if product_id != trained_product or warehouse_id != trained_warehouse:
        raise ValueError(
            f"Model trained only for {trained_product} / {trained_warehouse}."
        )

    external = pd.read_csv(EXTERNAL_PATH, parse_dates=["date"])
    start = pd.to_datetime(start_date)
    future_rows = []
    future_dates = []

    for i in range(days):
        fc_date = start + timedelta(days=i)
        future_dates.append(fc_date)
        ext_row = external[external["date"] == fc_date]

        is_holiday = int(ext_row["is_holiday"].values[0]) if len(ext_row) else 0
        trend_score = (
            float(ext_row["social_trend_score"].values[0]) if len(ext_row) else 5.0
        )
        temperature = float(ext_row["temperature"].values[0]) if len(ext_row) else 28.0
        weather = ext_row["weather_condition"].values[0] if len(ext_row) else "Sunny"

        future_rows.append(
            [
                fc_date.dayofweek,
                fc_date.month,
                int(fc_date.dayofweek >= 5),
                int(weather == "Rain"),
                is_holiday,
                trend_score,
                temperature,
                avg_unit_price,
            ]
        )

    future_exog = pd.DataFrame(
        future_rows,
        columns=feature_columns,
        index=pd.DatetimeIndex(future_dates, freq="D"),
    )
    forecast = model_fit.get_forecast(steps=days, exog=future_exog)
    preds = np.maximum(0, forecast.predicted_mean.to_numpy())
    conf_int = forecast.conf_int()

    forecasts = []
    for i in range(days):
        fc_date = start + timedelta(days=i)
        ext_row = external[external["date"] == fc_date]
        is_holiday = int(ext_row["is_holiday"].values[0]) if len(ext_row) else 0
        weather = ext_row["weather_condition"].values[0] if len(ext_row) else "Sunny"
        lower = max(0, int(conf_int.iloc[i, 0]))
        upper = max(lower, int(conf_int.iloc[i, 1]))

        forecasts.append(
            {
                "date": str(fc_date.date()),
                "predicted_demand": int(preds[i]),
                "lower_bound": lower,
                "upper_bound": upper,
                "is_holiday": is_holiday,
                "weather": weather,
            }
        )

    return forecasts


if __name__ == "__main__":
    result = predict_demand("PRD_001", "WH_01", "2025-01-01", days=7)
    for row in result:
        print(row)
