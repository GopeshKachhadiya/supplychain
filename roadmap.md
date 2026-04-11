# 🚀 AI-Driven Smart Supply Chain Optimization Platform
## 12-Hour Hackathon Roadmap — Team AntiGravity

> ⏰ **Total Time: 12 Hours** | 🗓️ Hackathon Day Only | 👥 Team of 5

---

## 📖 PROBLEM STATEMENT (Plain English)

We're building an **AI brain** for supply chains — inspired by Blinkit/Zepto's 10-minute delivery model:

- **Predicts demand** → "Tomorrow, WH_01 will need ~450 units of PRD_003"
- **Stocks smartly** → Uses inventory safety stock logic to prevent stockouts
- **Adapts to external signals** → Weather, holidays, social trends affect demand
- **Visualizes everything** → Dashboard showing stock levels, forecasts, alerts

### 🎯 What Makes Us Different From Existing Tools
| Existing Tools | Our Edge |
|---|---|
| SAP, Oracle SCM — No real-time external signals | We use weather + holiday + social trend data from our CSV |
| Single model forecasting | XGBoost ensemble with feature engineering on real data |
| Static routing | Dynamic reorder alerts based on live inventory |
| Expensive & inaccessible | Open-source, local-first, demo-ready in 12 hours |

---

## 📦 OUR REAL DATASETS (Gemini-Generated)

We have **3 pre-built CSV datasets** — no dummy data generation needed. Use these directly!

### 1. `supply_chain_sales_master.csv` — 730,000 rows × 9 columns
The backbone dataset. Each row = one product sold at one warehouse on one date.

| Column | Description |
|---|---|
| `date` | Transaction date (2024–2026) |
| `product_id` | Product code (e.g., `PRD_001` … `PRD_100`) |
| `warehouse_id` | Warehouse code (e.g., `WH_01` … `WH_10`) |
| `units_sold` | Actual units sold that day |
| `unit_price` | Selling price per unit |
| `weather_condition` | Weather on that day (Sunny/Cloudy/Rain/Fog) |
| `temperature` | Temperature in °C |
| `is_holiday` | 1 = holiday, 0 = not |
| `social_trend_score` | Trend score 1–10 (like Google Trends) |

### 2. `supply_chain_inventory.csv` — 100 rows × 4 columns
Product-level static inventory metadata.

| Column | Description |
|---|---|
| `product_id` | Product code |
| `category` | Product category (Electronics, Apparel, Home Goods, etc.) |
| `holding_cost_per_unit` | ₹ cost to store one unit per day |
| `supplier_lead_time_days` | Days for restock after reorder |

### 3. `supply_chain_external_factors.csv` — 730 rows × 5 columns
Daily external context signals.

| Column | Description |
|---|---|
| `date` | Date |
| `weather_condition` | Weather (Sunny/Rain/Cloudy/Fog) |
| `temperature` | Temperature in °C |
| `is_holiday` | 0 or 1 |
| `social_trend_score` | Aggregate trend score 1–10 |

---

## 🏗️ SYSTEM ARCHITECTURE (12-Hour Scope)

```
┌─────────────────────────────────────────┐
│         STREAMLIT / HTML DASHBOARD       │
│     (Charts + Inventory Table + Alerts)  │
└──────────────────┬──────────────────────┘
                   │ REST API calls
┌──────────────────▼──────────────────────┐
│          FASTAPI BACKEND                 │
│  /forecast  /inventory  /alerts          │
└───────┬──────────┬────────┬─────────────┘
        │          │        │
   ┌────▼───┐  ┌───▼───┐  ┌▼──────────┐
   │XGBoost │  │  EOQ  │  │  Alerts   │
   │Forecast│  │ Safety│  │  Engine   │
   │ Module │  │ Stock │  │           │
   └────────┘  └───────┘  └───────────┘
        │
   [supply_chain_sales_master.csv]
   [supply_chain_inventory.csv]
   [supply_chain_external_factors.csv]
```

---

## ⏱️ HOUR-BY-HOUR SCHEDULE

### 🟢 HOUR 0–1: Setup + Data Loading (ALL MEMBERS)
**Everyone runs the same setup in parallel**

```bash
# Create project folder
mkdir supply_chain_ai && cd supply_chain_ai

# Install all dependencies at once
pip install pandas numpy scikit-learn xgboost fastapi uvicorn streamlit \
            matplotlib seaborn plotly scipy joblib python-dotenv
```

**Data Validation (run this immediately to confirm datasets work):**
```python
# validate_data.py  — run first thing!
import pandas as pd

sales = pd.read_csv('supply_chain_sales_master.csv')
inventory = pd.read_csv('supply_chain_inventory.csv')
external = pd.read_csv('supply_chain_external_factors.csv')

print("=== SALES MASTER ===")
print(f"Shape: {sales.shape}")
print(sales.dtypes)
print(sales.head(3))

print("\n=== INVENTORY ===")
print(f"Shape: {inventory.shape}")
print(inventory.head(3))

print("\n=== EXTERNAL FACTORS ===")
print(f"Shape: {external.shape}")
print(external.head(3))
```

---

### 🟡 HOUR 1–3: Core ML Model (Member 1) + Backend Skeleton (Member 2)
*These two work in parallel*

---

#### 👤 MEMBER 1 — ML Forecast (Hours 1–5)

**Hour 1–2: EDA + Feature Engineering on Real Data**

```python
# eda_and_features.py
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# Load datasets
sales = pd.read_csv('supply_chain_sales_master.csv', parse_dates=['date'])
inventory = pd.read_csv('supply_chain_inventory.csv')
external = pd.read_csv('supply_chain_external_factors.csv', parse_dates=['date'])

# ── Merge external factors into sales ────────────────────────
df = sales.merge(external[['date','is_holiday','social_trend_score']],
                 on='date', how='left', suffixes=('','_ext'))

# ── Feature Engineering ──────────────────────────────────────
df['day_of_week']    = df['date'].dt.dayofweek
df['month']          = df['date'].dt.month
df['is_weekend']     = (df['day_of_week'] >= 5).astype(int)
df['is_rainy']       = (df['weather_condition'] == 'Rain').astype(int)
df['lag_7']          = df.groupby(['product_id','warehouse_id'])['units_sold'].shift(7)
df['lag_30']         = df.groupby(['product_id','warehouse_id'])['units_sold'].shift(30)
df['rolling_7_mean'] = df.groupby(['product_id','warehouse_id'])['units_sold'] \
                         .transform(lambda x: x.shift(1).rolling(7).mean())
df.dropna(inplace=True)

print(f"Feature-engineered dataset: {df.shape}")
df.to_csv('sales_features.csv', index=False)

# ── Quick EDA ────────────────────────────────────────────────
# 1. Average demand by weather condition
weather_demand = df.groupby('weather_condition')['units_sold'].mean()
print("\nAvg demand by weather:\n", weather_demand)

# 2. Holiday vs non-holiday
holiday_demand = df.groupby('is_holiday')['units_sold'].agg(['mean','std'])
print("\nHoliday impact:\n", holiday_demand)

# 3. Top 5 products by volume
top_prods = df.groupby('product_id')['units_sold'].sum().nlargest(5)
print("\nTop 5 products:\n", top_prods)
```

**Hour 2–4: Train XGBoost Demand Forecast Model**

```python
# model_xgboost.py
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib

df = pd.read_csv('sales_features.csv', parse_dates=['date'])

# Focus on top product-warehouse pair for demo
# (Extend to all in production)
PRODUCT   = 'PRD_001'
WAREHOUSE = 'WH_01'

subset = df[(df['product_id'] == PRODUCT) &
            (df['warehouse_id'] == WAREHOUSE)].copy()
subset = subset.sort_values('date')

FEATURES = [
    'day_of_week', 'month', 'is_weekend', 'is_rainy',
    'is_holiday', 'social_trend_score', 'temperature',
    'unit_price', 'lag_7', 'lag_30', 'rolling_7_mean'
]
TARGET = 'units_sold'

X = subset[FEATURES]
y = subset[TARGET]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, shuffle=False)

model = xgb.XGBRegressor(
    n_estimators=200,
    learning_rate=0.05,
    max_depth=6,
    random_state=42,
    verbosity=0
)
model.fit(X_train, y_train)

preds = model.predict(X_test)
mae   = mean_absolute_error(y_test, preds)
mape  = np.mean(np.abs((y_test.values - preds) / (y_test.values + 1e-5))) * 100

print(f"✅ XGBoost trained | MAE: {mae:.2f} | MAPE: {mape:.2f}%")

# Save model
joblib.dump(model, 'xgb_demand_model.pkl')
print("✅ Model saved → xgb_demand_model.pkl")

# Feature importance
import matplotlib.pyplot as plt
xgb.plot_importance(model, max_num_features=10)
plt.tight_layout()
plt.savefig('feature_importance.png')
print("✅ Feature importance chart saved")
```

**Hour 4–5: Prediction API Function**

```python
# predict_api.py
import pandas as pd
import numpy as np
import joblib
from datetime import date, timedelta

model = joblib.load('xgb_demand_model.pkl')

def predict_demand(product_id: str, warehouse_id: str,
                   start_date: str, days: int = 7) -> list:
    """
    Returns demand forecast for next `days` days.
    Uses last known lag values from sales_features.csv
    """
    df = pd.read_csv('sales_features.csv', parse_dates=['date'])
    external = pd.read_csv('supply_chain_external_factors.csv', parse_dates=['date'])

    subset = df[(df['product_id'] == product_id) &
                (df['warehouse_id'] == warehouse_id)].sort_values('date')

    last_7  = subset['units_sold'].tail(7).values
    last_30 = subset['units_sold'].tail(30).values

    start = pd.to_datetime(start_date)
    forecasts = []

    for i in range(days):
        fc_date = start + timedelta(days=i)
        ext_row = external[external['date'] == fc_date]

        is_holiday    = int(ext_row['is_holiday'].values[0]) if len(ext_row) else 0
        trend_score   = float(ext_row['social_trend_score'].values[0]) if len(ext_row) else 5
        temperature   = float(ext_row['temperature'].values[0]) if len(ext_row) else 28
        weather       = ext_row['weather_condition'].values[0] if len(ext_row) else 'Sunny'

        features = [[
            fc_date.dayofweek,
            fc_date.month,
            int(fc_date.dayofweek >= 5),
            int(weather == 'Rain'),
            is_holiday,
            trend_score,
            temperature,
            subset['unit_price'].mean(),
            last_7[-7] if len(last_7) >= 7 else last_7[0],
            last_30[-30] if len(last_30) >= 30 else last_30[0],
            np.mean(last_7)
        ]]

        pred = max(0, int(model.predict(features)[0]))
        forecasts.append({
            'date': str(fc_date.date()),
            'predicted_demand': pred,
            'lower_bound': int(pred * 0.85),
            'upper_bound': int(pred * 1.15),
            'is_holiday': is_holiday,
            'weather': weather
        })

    return forecasts

# Quick test
if __name__ == '__main__':
    result = predict_demand('PRD_001', 'WH_01', '2025-01-01', days=7)
    for r in result:
        print(r)
```

---

#### 👤 MEMBER 2 — FastAPI Backend (Hours 1–4)

**Hour 1–2: Project Skeleton**

```
backend/
├── main.py
├── routers/
│   ├── forecast.py
│   ├── inventory.py
│   └── alerts.py
└── data_loader.py
```

```python
# data_loader.py  — shared data access layer
import pandas as pd

_sales     = None
_inventory = None
_external  = None

def get_sales():
    global _sales
    if _sales is None:
        _sales = pd.read_csv('supply_chain_sales_master.csv', parse_dates=['date'])
    return _sales

def get_inventory():
    global _inventory
    if _inventory is None:
        _inventory = pd.read_csv('supply_chain_inventory.csv')
    return _inventory

def get_external():
    global _external
    if _external is None:
        _external = pd.read_csv('supply_chain_external_factors.csv', parse_dates=['date'])
    return _external
```

```python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import forecast, inventory, alerts

app = FastAPI(
    title="AntiGravity Supply Chain API",
    version="1.0.0",
    description="AI Supply Chain Optimization — Team AntiGravity Hackathon"
)

app.add_middleware(CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

app.include_router(forecast.router,   prefix="/api/forecast",   tags=["Forecasting"])
app.include_router(inventory.router,  prefix="/api/inventory",  tags=["Inventory"])
app.include_router(alerts.router,     prefix="/api/alerts",     tags=["Alerts"])

@app.get("/health")
def health():
    return {"status": "ok", "team": "AntiGravity", "version": "1.0.0"}

# Run: uvicorn main:app --reload --port 8000
```

**Hour 2–4: API Endpoints**

```python
# routers/forecast.py
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import sys; sys.path.insert(0, '..')
from predict_api import predict_demand

router = APIRouter()

class ForecastRequest(BaseModel):
    product_id: str = "PRD_001"
    warehouse_id: str = "WH_01"
    start_date: str  = "2025-01-01"
    days: int        = 7

@router.post("/predict")
def get_forecast(req: ForecastRequest):
    results = predict_demand(req.product_id, req.warehouse_id,
                             req.start_date, req.days)
    return {"status": "success", "forecasts": results}

@router.get("/products")
def list_products():
    from data_loader import get_sales
    sales = get_sales()
    return {"products": sorted(sales['product_id'].unique().tolist())}

@router.get("/warehouses")
def list_warehouses():
    from data_loader import get_sales
    sales = get_sales()
    return {"warehouses": sorted(sales['warehouse_id'].unique().tolist())}
```

```python
# routers/inventory.py
from fastapi import APIRouter
import pandas as pd, numpy as np
from data_loader import get_sales, get_inventory
from scipy import stats

router = APIRouter()

def compute_safety_stock(avg_demand, std_demand, lead_time, service_level=0.95):
    z = stats.norm.ppf(service_level)
    return int(np.ceil(z * std_demand * np.sqrt(lead_time)))

def compute_eoq(annual_demand, order_cost=500, holding_cost=12):
    return int(np.sqrt((2 * annual_demand * order_cost) / holding_cost))

@router.get("/status/{warehouse_id}")
def inventory_status(warehouse_id: str):
    sales = get_sales()
    inv   = get_inventory()

    wh_sales = sales[sales['warehouse_id'] == warehouse_id]
    results  = []

    for product_id, grp in wh_sales.groupby('product_id'):
        inv_row = inv[inv['product_id'] == product_id]
        if inv_row.empty:
            continue

        lead_time    = int(inv_row['supplier_lead_time_days'].values[0])
        holding_cost = float(inv_row['holding_cost_per_unit'].values[0])

        avg_d  = grp['units_sold'].mean()
        std_d  = grp['units_sold'].std()
        ss     = compute_safety_stock(avg_d, std_d, lead_time)
        rop    = int(avg_d * lead_time) + ss
        eoq    = compute_eoq(avg_d * 365, holding_cost_per_unit=holding_cost)

        # Simulate current stock (in real system: from DB)
        current_stock = int(grp['units_sold'].tail(3).mean() * 5)
        status = "CRITICAL" if current_stock < ss \
            else "REORDER" if current_stock < rop \
            else "OK"

        results.append({
            "product_id":     product_id,
            "category":       inv_row['category'].values[0],
            "current_stock":  current_stock,
            "safety_stock":   ss,
            "reorder_point":  rop,
            "eoq":            eoq,
            "lead_time_days": lead_time,
            "status":         status
        })

    alerts = sum(1 for r in results if r['status'] in ['CRITICAL','REORDER'])
    return {
        "warehouse_id": warehouse_id,
        "total_products": len(results),
        "alerts": alerts,
        "inventory": results
    }
```

```python
# routers/alerts.py
from fastapi import APIRouter
from data_loader import get_sales, get_external
import pandas as pd

router = APIRouter()

@router.get("/active")
def get_active_alerts():
    sales    = get_sales()
    external = get_external()

    alerts = []

    # Alert 1: Stockout risk — products with declining trend
    recent = sales[sales['date'] >= sales['date'].max() - pd.Timedelta(days=14)]
    for (pid, wid), grp in recent.groupby(['product_id', 'warehouse_id']):
        weekly_avg = grp['units_sold'].mean()
        if weekly_avg < 50:
            alerts.append({
                'type': 'STOCKOUT_RISK',
                'product_id': pid,
                'warehouse_id': wid,
                'message': f'{pid} at {wid} has critically low sales (<50 units avg)',
                'severity': 'HIGH'
            })

    # Alert 2: Holiday alert from external factors
    upcoming = external[external['is_holiday'] == 1].tail(3)
    for _, row in upcoming.iterrows():
        alerts.append({
            'type': 'HOLIDAY_DEMAND_SPIKE',
            'date': str(row['date'].date()),
            'message': f"Holiday on {row['date'].date()} — expect +40% demand spike",
            'weather': row['weather_condition'],
            'severity': 'MEDIUM'
        })

    return {"total_alerts": len(alerts), "alerts": alerts[:10]}
```

---

### 🟠 HOUR 3–6: Inventory Engine + Routing Logic (Member 3)

#### 👤 MEMBER 3 — Optimization Engine (Hours 3–7)

**Hour 3–5: Inventory Optimizer Using Real Data**

```python
# inventory_optimizer.py
import pandas as pd
import numpy as np
from scipy import stats

class InventoryOptimizer:
    """
    Uses supply_chain_inventory.csv for lead times and holding costs.
    Uses supply_chain_sales_master.csv for demand statistics.
    """
    def __init__(self):
        self.sales     = pd.read_csv('supply_chain_sales_master.csv', parse_dates=['date'])
        self.inventory = pd.read_csv('supply_chain_inventory.csv')

    def compute_eoq(self, annual_demand, order_cost, holding_cost_per_unit):
        return np.sqrt((2 * annual_demand * order_cost) / holding_cost_per_unit)

    def compute_safety_stock(self, avg_daily_demand, std_daily_demand,
                              lead_time_days, service_level=0.95):
        z = stats.norm.ppf(service_level)
        return int(np.ceil(z * std_daily_demand * np.sqrt(lead_time_days)))

    def optimize_all(self, warehouse_id: str = None) -> pd.DataFrame:
        """Run optimization for all product-warehouse combos (or one warehouse)."""
        sales = self.sales
        if warehouse_id:
            sales = sales[sales['warehouse_id'] == warehouse_id]

        results = []
        for (wh, prod), grp in sales.groupby(['warehouse_id', 'product_id']):
            inv_row = self.inventory[self.inventory['product_id'] == prod]
            if inv_row.empty:
                continue

            lead_time    = int(inv_row['supplier_lead_time_days'].values[0])
            holding_cost = float(inv_row['holding_cost_per_unit'].values[0])
            category     = inv_row['category'].values[0]

            avg_d        = grp['units_sold'].mean()
            std_d        = grp['units_sold'].std()
            annual_demand = avg_d * 365

            eoq  = self.compute_eoq(annual_demand, order_cost=500,
                                    holding_cost_per_unit=holding_cost)
            ss   = self.compute_safety_stock(avg_d, std_d, lead_time)
            rop  = int(avg_d * lead_time) + ss

            results.append({
                'warehouse_id':      wh,
                'product_id':        prod,
                'category':          category,
                'avg_daily_demand':  round(avg_d, 1),
                'std_demand':        round(std_d, 1),
                'EOQ':               int(eoq),
                'safety_stock':      ss,
                'reorder_point':     rop,
                'lead_time_days':    lead_time,
                'holding_cost':      holding_cost,
            })

        return pd.DataFrame(results)

    def holiday_adjustment(self, base_eoq: int, holiday_factor: float = 1.4) -> int:
        """Boost order quantity before holidays (from external_factors.csv)."""
        return int(base_eoq * holiday_factor)

if __name__ == '__main__':
    opt = InventoryOptimizer()
    result_df = opt.optimize_all(warehouse_id='WH_01')
    print(result_df.head(10).to_string())
    result_df.to_csv('inventory_optimization_results.csv', index=False)
    print("✅ Saved → inventory_optimization_results.csv")
```

**Hour 5–7: Simple Route Optimizer (Simulated)**

```python
# route_optimizer.py  —  Greedy Nearest-Neighbor for demo
import numpy as np
import random

# Simulated warehouse locations (lat/lon for demo)
WAREHOUSES = {
    'WH_01': (19.0760, 72.8777),   # Mumbai
    'WH_02': (28.7041, 77.1025),   # Delhi
    'WH_03': (12.9716, 77.5946),   # Bangalore
    'WH_04': (22.5726, 88.3639),   # Kolkata
    'WH_05': (17.3850, 78.4867),   # Hyderabad
}

def haversine(loc1, loc2):
    """Distance in km between two lat/lon points."""
    R = 6371
    lat1, lon1 = np.radians(loc1)
    lat2, lon2 = np.radians(loc2)
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = np.sin(dlat/2)**2 + np.cos(lat1)*np.cos(lat2)*np.sin(dlon/2)**2
    return R * 2 * np.arcsin(np.sqrt(a))

def nearest_neighbor_route(start_wh: str, stops: list) -> dict:
    """Greedy nearest-neighbor route starting from start_wh."""
    unvisited = list(stops)
    route = [start_wh]
    current = start_wh
    total_dist = 0

    while unvisited:
        nearest = min(unvisited,
                      key=lambda w: haversine(WAREHOUSES[current], WAREHOUSES[w]))
        dist = haversine(WAREHOUSES[current], WAREHOUSES[nearest])
        total_dist += dist
        route.append(nearest)
        unvisited.remove(nearest)
        current = nearest

    # Return to start
    total_dist += haversine(WAREHOUSES[current], WAREHOUSES[start_wh])
    route.append(start_wh)

    return {
        'route': route,
        'total_distance_km': round(total_dist, 1),
        'estimated_time_hrs': round(total_dist / 60, 1)  # assume 60 km/h avg
    }

if __name__ == '__main__':
    stops = ['WH_02', 'WH_03', 'WH_04', 'WH_05']
    result = nearest_neighbor_route('WH_01', stops)
    print("Optimized Route:", " → ".join(result['route']))
    print(f"Total Distance : {result['total_distance_km']} km")
    print(f"Estimated Time : {result['estimated_time_hrs']} hours")
```

---

### 🔴 HOUR 5–8: Frontend Dashboard (Member 4)

#### 👤 MEMBER 4 — Streamlit Dashboard (Hours 5–10)

```python
# dashboard.py
import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import requests

st.set_page_config(
    page_title="AntiGravity Supply Chain AI",
    page_icon="🚀",
    layout="wide"
)

# ── Header ──────────────────────────────────────────────────
st.title("🚀 AI-Driven Supply Chain Optimization")
st.caption("Team AntiGravity | Hackathon 2025")

BACKEND = "http://localhost:8000"

# ── Sidebar Controls ─────────────────────────────────────────
st.sidebar.header("🔧 Controls")
warehouse_id = st.sidebar.selectbox(
    "Select Warehouse",
    ["WH_01", "WH_02", "WH_03", "WH_04", "WH_05"]
)
product_id = st.sidebar.selectbox(
    "Select Product",
    [f"PRD_{str(i).zfill(3)}" for i in range(1, 21)]
)
forecast_days = st.sidebar.slider("Forecast Days", 7, 30, 14)

# ── Tabs ─────────────────────────────────────────────────────
tab1, tab2, tab3, tab4 = st.tabs([
    "📈 Demand Forecast",
    "📦 Inventory Status",
    "🚨 Alerts",
    "🗺️ Route Optimizer"
])

# ── Tab 1: Demand Forecast ───────────────────────────────────
with tab1:
    st.subheader(f"Demand Forecast — {product_id} @ {warehouse_id}")

    if st.button("🔮 Run Forecast", key="btn_forecast"):
        with st.spinner("Running XGBoost model..."):
            try:
                resp = requests.post(f"{BACKEND}/api/forecast/predict", json={
                    "product_id": product_id,
                    "warehouse_id": warehouse_id,
                    "start_date": "2025-06-01",
                    "days": forecast_days
                })
                data = resp.json()["forecasts"]
                df_fc = pd.DataFrame(data)

                fig = go.Figure()
                fig.add_trace(go.Scatter(
                    x=df_fc['date'], y=df_fc['predicted_demand'],
                    name='Predicted', line=dict(color='#6C63FF', width=2)
                ))
                fig.add_trace(go.Scatter(
                    x=df_fc['date'], y=df_fc['upper_bound'],
                    name='Upper Bound', line=dict(color='#ccc', dash='dot')
                ))
                fig.add_trace(go.Scatter(
                    x=df_fc['date'], y=df_fc['lower_bound'],
                    name='Lower Bound', fill='tonexty', fillcolor='rgba(108,99,255,0.1)',
                    line=dict(color='#ccc', dash='dot')
                ))
                fig.update_layout(title='7–30 Day Demand Forecast with Confidence Bands',
                                  xaxis_title='Date', yaxis_title='Units')
                st.plotly_chart(fig, use_container_width=True)
                st.dataframe(df_fc, use_container_width=True)

            except Exception as e:
                st.error(f"Backend error: {e}")
                # Fallback demo chart
                dates = pd.date_range('2025-06-01', periods=forecast_days)
                demo = pd.DataFrame({
                    'date': dates,
                    'predicted_demand': np.random.randint(100, 400, forecast_days)
                })
                st.line_chart(demo.set_index('date'))

# ── Tab 2: Inventory Status ──────────────────────────────────
with tab2:
    st.subheader(f"Inventory Status — {warehouse_id}")

    if st.button("📊 Load Inventory", key="btn_inv"):
        with st.spinner("Computing inventory metrics..."):
            try:
                resp = requests.get(f"{BACKEND}/api/inventory/status/{warehouse_id}")
                data = resp.json()

                col1, col2, col3 = st.columns(3)
                col1.metric("Total Products", data['total_products'])
                col2.metric("Active Alerts", data['alerts'], delta="⚠️" if data['alerts'] > 0 else None)
                col3.metric("Warehouse", warehouse_id)

                df_inv = pd.DataFrame(data['inventory'])

                # Color code status
                def color_status(val):
                    colors = {'CRITICAL': 'background-color: #ff4444; color: white',
                              'REORDER': 'background-color: #ffaa00; color: black',
                              'OK': 'background-color: #44bb44; color: white'}
                    return colors.get(val, '')

                st.dataframe(
                    df_inv.style.applymap(color_status, subset=['status']),
                    use_container_width=True
                )

                # EOQ bar chart
                fig = px.bar(df_inv.head(15), x='product_id', y='eoq',
                             color='status',
                             color_discrete_map={'OK':'green','REORDER':'orange','CRITICAL':'red'},
                             title='Economic Order Quantity by Product')
                st.plotly_chart(fig, use_container_width=True)

            except Exception as e:
                st.error(f"Backend error: {e}")

# ── Tab 3: Alerts ────────────────────────────────────────────
with tab3:
    st.subheader("🚨 Real-Time Alerts")

    try:
        resp = requests.get(f"{BACKEND}/api/alerts/active")
        alerts_data = resp.json()
        st.metric("Total Active Alerts", alerts_data['total_alerts'])

        for alert in alerts_data['alerts']:
            severity_color = {'HIGH': '🔴', 'MEDIUM': '🟡', 'LOW': '🟢'}.get(alert['severity'], '⚪')
            with st.expander(f"{severity_color} {alert['type']} — {alert.get('product_id','')}{alert.get('warehouse_id','')}"):
                st.write(alert['message'])
                st.json(alert)

    except Exception as e:
        st.error(f"Backend error: {e}")
        # Demo alerts
        for msg in ["🔴 PRD_003 at WH_01 — Critical stock below safety threshold",
                    "🟡 Holiday demand spike expected on 2025-08-15",
                    "🟡 PRD_017 at WH_03 — Reorder point reached"]:
            st.warning(msg)

# ── Tab 4: Route Optimizer ───────────────────────────────────
with tab4:
    st.subheader("🗺️ Delivery Route Optimizer")

    selected_stops = st.multiselect(
        "Select Delivery Stops",
        ["WH_01", "WH_02", "WH_03", "WH_04", "WH_05"],
        default=["WH_02", "WH_03"]
    )
    start_wh = st.selectbox("Start Warehouse", ["WH_01", "WH_02", "WH_03"])

    if st.button("🗺️ Optimize Route") and selected_stops:
        import sys; sys.path.insert(0, '.')
        from route_optimizer import nearest_neighbor_route
        result = nearest_neighbor_route(start_wh, selected_stops)

        st.success(f"✅ Optimized Route: {' → '.join(result['route'])}")
        col1, col2 = st.columns(2)
        col1.metric("Total Distance", f"{result['total_distance_km']} km")
        col2.metric("Estimated Time", f"{result['estimated_time_hrs']} hrs")

        # Map visualization
        WH_COORDS = {
            'WH_01': (19.0760, 72.8777), 'WH_02': (28.7041, 77.1025),
            'WH_03': (12.9716, 77.5946), 'WH_04': (22.5726, 88.3639),
            'WH_05': (17.3850, 78.4867),
        }
        route_coords = [WH_COORDS[w] for w in result['route'] if w in WH_COORDS]
        df_map = pd.DataFrame(route_coords, columns=['lat', 'lon'])
        st.map(df_map)
```

---

### 🟣 HOUR 6–10: Integration + Polish (Member 5 — Team Lead / Full-Stack)

#### 👤 MEMBER 5 — Integration & Demo Lead (Hours 6–12)

**Hour 6–8: Wire Everything Together**

```bash
# Start backend
cd supply_chain_ai
uvicorn main:app --reload --port 8000 &

# Start dashboard
streamlit run dashboard.py --server.port 8501
```

**Integration Checklist:**
- [ ] Backend `/health` returns `200 OK`
- [ ] `/api/forecast/predict` returns JSON forecasts
- [ ] `/api/inventory/status/WH_01` returns inventory with EOQ
- [ ] `/api/alerts/active` returns alert list
- [ ] Dashboard connects to backend successfully
- [ ] Forecast chart renders with confidence bands
- [ ] Inventory table shows color-coded status (OK/REORDER/CRITICAL)
- [ ] Route optimizer shows result + map

**Hour 8–10: Polish + Fallback Modes**

Ensure the dashboard has **offline/demo mode** (using mock data) if backend is slow:

```python
# utils/mock_data.py  — fallback for demo
def mock_forecast(days=7):
    import numpy as np, pandas as pd
    dates = pd.date_range('2025-06-01', periods=days)
    base  = np.random.randint(200, 400, days)
    return [{'date': str(d.date()), 'predicted_demand': int(b),
             'lower_bound': int(b*0.85), 'upper_bound': int(b*1.15)}
            for d, b in zip(dates, base)]

def mock_inventory():
    import random
    products = [f'PRD_{str(i).zfill(3)}' for i in range(1, 11)]
    return [{'product_id': p,
             'current_stock': random.randint(10, 500),
             'safety_stock':  random.randint(50, 100),
             'reorder_point': random.randint(80, 150),
             'eoq':           random.randint(200, 800),
             'status':        random.choice(['OK','REORDER','CRITICAL'])}
            for p in products]
```

**Hour 10–11: Presentation Prep**

- [ ] Record a 2-minute demo video (backend + dashboard running)
- [ ] Export `inventory_optimization_results.csv`
- [ ] Screenshot: Feature importance chart
- [ ] Screenshot: Forecast chart with confidence bands
- [ ] Screenshot: Inventory status table (color-coded)
- [ ] Prepare 5-slide deck:
  1. Problem Statement
  2. Our Dataset (3 CSVs — 730K+ rows)
  3. Architecture diagram
  4. Live Demo screenshots
  5. Results + Innovation

**Hour 11–12: Final QA + Submission**

```bash
# Final test sequence
curl http://localhost:8000/health
curl -X POST http://localhost:8000/api/forecast/predict \
     -H "Content-Type: application/json" \
     -d '{"product_id":"PRD_001","warehouse_id":"WH_01","start_date":"2025-06-01","days":7}'
curl http://localhost:8000/api/inventory/status/WH_01
curl http://localhost:8000/api/alerts/active
```

---

## 👥 TEAM ASSIGNMENT SUMMARY

| Member | Role | Hours Active | Key Output |
|---|---|---|---|
| Member 1 | ML Engineer | 1–5 | `xgb_demand_model.pkl`, `predict_api.py` |
| Member 2 | Backend Engineer | 1–4 | FastAPI running on port 8000 |
| Member 3 | Optimization | 3–7 | `inventory_optimizer.py`, `route_optimizer.py` |
| Member 4 | Frontend | 5–10 | Streamlit dashboard on port 8501 |
| Member 5 | Team Lead / Integration | 6–12 | Full system wired + demo-ready |

---

## 📁 FINAL PROJECT STRUCTURE

```
supply_chain_ai/
├── supply_chain_sales_master.csv       ← 730K row sales data
├── supply_chain_inventory.csv          ← 100 product metadata
├── supply_chain_external_factors.csv   ← 730 days external signals
│
├── validate_data.py                    ← Run first to verify datasets
├── eda_and_features.py                 ← EDA + feature engineering
├── sales_features.csv                  ← Processed features (generated)
├── model_xgboost.py                    ← XGBoost training
├── xgb_demand_model.pkl                ← Trained model (generated)
├── predict_api.py                      ← Forecast function
│
├── inventory_optimizer.py              ← EOQ + Safety Stock
├── inventory_optimization_results.csv  ← Output (generated)
├── route_optimizer.py                  ← Greedy route optimizer
│
├── main.py                             ← FastAPI app
├── data_loader.py                      ← Shared CSV reader
├── routers/
│   ├── forecast.py
│   ├── inventory.py
│   └── alerts.py
│
├── dashboard.py                        ← Streamlit dashboard
└── utils/mock_data.py                  ← Fallback demo data
```

---

## ⚡ QUICK START (For Any Member)

```bash
# 1. Clone / enter project folder
cd supply_chain_ai

# 2. Install dependencies
pip install pandas numpy scikit-learn xgboost fastapi uvicorn streamlit plotly scipy joblib

# 3. Verify datasets
python validate_data.py

# 4. Generate features + train model
python eda_and_features.py
python model_xgboost.py

# 5. Start backend
uvicorn main:app --reload --port 8000

# 6. Start dashboard (new terminal)
streamlit run dashboard.py

# 7. Open browser
# Dashboard: http://localhost:8501
# API Docs:  http://localhost:8000/docs
```

---

## 🏆 JUDGING CRITERIA ALIGNMENT

| Criterion | What We Deliver |
|---|---|
| **Innovation** | Ensemble of XGBoost + EOQ + external signals (weather, holidays, trends) |
| **Real Data** | 730K+ rows across 3 professional CSV datasets |
| **Working Demo** | Live backend + Streamlit dashboard |
| **Business Impact** | Stockout prevention, route optimization, holiday demand alerts |
| **Code Quality** | Modular structure, typed APIs, fallback demo mode |
| **Presentation** | Color-coded dashboard, Plotly charts, confidence bands |

---

> 💡 **GOLDEN RULE for 12 Hours**: Working demo > perfect code. Get the pipeline running end-to-end first, then polish. Every member should have their module callable independently with mock data before integration.
