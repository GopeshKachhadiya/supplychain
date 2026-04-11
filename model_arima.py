from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error
from statsmodels.tsa.statespace.sarimax import SARIMAX

BASE_DIR = Path(__file__).resolve().parent
FEATURES_PATH = BASE_DIR / "sales_features.csv"
SALES_PATH = BASE_DIR / "supply_chain_sales_master.csv"
EXTERNAL_PATH = BASE_DIR / "supply_chain_external_factors.csv"
MODEL_PATH = BASE_DIR / "arima_demand_model.pkl"
PLOT_PATH = BASE_DIR / "arima_forecast_plot.png"

PRODUCT = "PRD_001"
WAREHOUSE = "WH_01"
TARGET = "units_sold"
PRICE_CANDIDATES = ["unit_price", "price"]
EXOG_FEATURES = [
    "day_of_week",
    "month",
    "is_weekend",
    "is_rainy",
    "is_holiday",
    "social_trend_score",
    "temperature",
    "unit_price",
]


def build_features() -> pd.DataFrame:
    sales = pd.read_csv(SALES_PATH, parse_dates=["date"])
    external = pd.read_csv(EXTERNAL_PATH, parse_dates=["date"])

    df = sales.merge(
        external[["date", "is_holiday", "social_trend_score"]],
        on="date",
        how="left",
        suffixes=("", "_ext"),
    )

    if "is_holiday_ext" in df.columns:
        df["is_holiday"] = df["is_holiday_ext"].fillna(df["is_holiday"])
        df = df.drop(columns=["is_holiday_ext"])
    if "social_trend_score_ext" in df.columns:
        df["social_trend_score"] = df["social_trend_score_ext"].fillna(
            df["social_trend_score"]
        )
        df = df.drop(columns=["social_trend_score_ext"])

    df["day_of_week"] = df["date"].dt.dayofweek
    df["month"] = df["date"].dt.month
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
    df["is_rainy"] = (df["weather_condition"] == "Rain").astype(int)
    df["lag_7"] = df.groupby(["product_id", "warehouse_id"])[TARGET].shift(7)
    df["lag_30"] = df.groupby(["product_id", "warehouse_id"])[TARGET].shift(30)
    df["rolling_7_mean"] = (
        df.groupby(["product_id", "warehouse_id"])[TARGET]
        .transform(lambda x: x.shift(1).rolling(7).mean())
    )
    df = df.dropna().sort_values("date")
    df.to_csv(FEATURES_PATH, index=False)
    return df


def resolve_price_column(df: pd.DataFrame) -> str:
    for col in PRICE_CANDIDATES:
        if col in df.columns:
            return col
    raise KeyError(f"Missing price column. Expected one of: {PRICE_CANDIDATES}")


def load_features() -> pd.DataFrame:
    if FEATURES_PATH.exists():
        return pd.read_csv(FEATURES_PATH, parse_dates=["date"])

    print("sales_features.csv not found. Generating it from source datasets...")
    return build_features()


def train_model() -> None:
    df = load_features()
    price_column = resolve_price_column(df)

    subset = df[
        (df["product_id"] == PRODUCT) & (df["warehouse_id"] == WAREHOUSE)
    ].copy()
    subset = subset.sort_values("date")
    subset["unit_price"] = subset[price_column]
    subset = subset.set_index("date")
    subset.index = pd.DatetimeIndex(subset.index, freq="D")

    if subset.empty:
        raise ValueError(
            f"No rows found for product={PRODUCT} and warehouse={WAREHOUSE}."
        )

    train_size = int(len(subset) * 0.8)
    train = subset.iloc[:train_size]
    test = subset.iloc[train_size:]

    if len(subset) < 60 or train.empty or test.empty:
        raise ValueError(
            f"Not enough history for ARIMA training on {PRODUCT}/{WAREHOUSE}. "
            f"Need at least 60 rows after feature engineering, found {len(subset)}."
        )

    model = SARIMAX(
        train[TARGET],
        exog=train[EXOG_FEATURES],
        order=(2, 1, 2),
        seasonal_order=(1, 0, 1, 7),
        enforce_stationarity=False,
        enforce_invertibility=False,
    )
    model_fit = model.fit(disp=False)

    forecast = model_fit.get_forecast(
        steps=len(test),
        exog=test[EXOG_FEATURES],
    )
    preds = forecast.predicted_mean.to_numpy()

    mae = mean_absolute_error(test[TARGET], preds)
    mape = (
        np.mean(
            np.abs((test[TARGET].to_numpy() - preds) / (test[TARGET].to_numpy() + 1e-5))
        )
        * 100
    )

    print(f"ARIMA trained | MAE: {mae:.2f} | MAPE: {mape:.2f}%")

    artifacts = {
        "model_fit": model_fit,
        "product_id": PRODUCT,
        "warehouse_id": WAREHOUSE,
        "feature_columns": EXOG_FEATURES,
        "avg_unit_price": float(subset["unit_price"].mean()),
    }
    joblib.dump(artifacts, MODEL_PATH)
    print(f"Model saved -> {MODEL_PATH.name}")

    plt.figure(figsize=(10, 5))
    plt.plot(test.index, test[TARGET].to_numpy(), label="Actual", marker="o")
    plt.plot(test.index, preds, label="Forecast", marker="o")
    plt.title("ARIMA Forecast vs Actual")
    plt.xlabel("Date")
    plt.ylabel("Units Sold")
    plt.legend()
    plt.tight_layout()
    plt.savefig(PLOT_PATH)
    print(f"Forecast chart saved -> {PLOT_PATH.name}")


if __name__ == "__main__":
    train_model()
