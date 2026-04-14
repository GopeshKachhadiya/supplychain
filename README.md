<div align="center">

# 🚀 AI-Driven Smart Supply Chain Optimization Platform

**An AI-powered brain for supply chains** — inspired by Blinkit/Zepto's 10-minute delivery model. Predict demand, optimize inventory, visualize everything.

[🌐 Live Demo](#-live-demo) · [⚡ Quick Start](#-quick-start) · [🏗️ Architecture](#️-system-architecture) · [📡 API Reference](#-api-reference)

</div>

---

## 📖 Problem Statement

Traditional supply chain tools like SAP and Oracle SCM are expensive, static, and don't factor in real-world external signals. We built an **AI brain** for supply chains that:

- 🔮 **Predicts demand** → *"Tomorrow, WH_01 will need ~450 units of PRD_003"*
- 📦 **Stocks smartly** → Uses EOQ + Safety Stock logic to prevent stockouts
- 🌦️ **Adapts to external signals** → Weather, holidays, and social trends affect demand
- 📊 **Visualizes everything** → Dashboard showing stock levels, forecasts, and real-time alerts

### 🎯 What Makes Us Different

| Existing Tools | Our Edge |
|---|---|
| SAP, Oracle SCM — no real-time external signals | We use weather + holiday + social trend data from our CSV |
| Single-model forecasting | XGBoost + ARIMA ensemble with rich feature engineering |
| Static routing | Dynamic reorder alerts based on live inventory simulation |
| Expensive & inaccessible | 100% open-source, local-first, demo-ready |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────┐
│    CUSTOM FRONTEND (Next.js / React)    │
│       TypeScript + TailwindCSS          │
└──────────────────┬──────────────────────┘
                   │ REST API calls (Axios)
┌──────────────────▼──────────────────────┐
│          FASTAPI BACKEND                │
│  /forecast  /inventory  /alerts         │
│  /routing   /dataset                    │
└───────┬──────────┬────────┬─────────────┘
        │          │        │
   ┌────▼───┐  ┌───▼───┐  ┌▼──────────┐
   │XGBoost │  │  EOQ  │  │  Alerts   │
   │& ARIMA │  │ Safety│  │  Engine   │
   │Forecast│  │ Stock │  │           │
   └────────┘  └───────┘  └───────────┘
        │
   [supply_chain_sales_master.csv]    (730K rows)
   [supply_chain_inventory.csv]       (100 products)
   [supply_chain_external_factors.csv](730 days)
```

---

## ✨ Features

| Feature | Description |
|---|---|
| 📈 **Demand Forecasting** | XGBoost + ARIMA models with 7/30-day lag features |
| 📦 **Inventory Optimization** | EOQ + Safety Stock calculations per product-warehouse pair |
| 🚨 **Real-time Alerts** | Stockout risk, holiday demand spikes, critical inventory warnings |
| 🗺️ **Route Optimization** | Greedy nearest-neighbor with Haversine distance across 10 Indian warehouses |
| 🌦️ **External Signal Integration** | Weather, holidays, and social trend scores built into every forecast |
| 📊 **Interactive Dashboard** | Recharts-powered charts with confidence bands, color-coded status tables |
| 🗺️ **Map View** | Leaflet-based warehouse map with live route visualization |
| 📤 **Custom Data Upload** | Upload your own test CSVs for live scenario testing |

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Python** | 3.10+ | Core runtime |
| **FastAPI** | ≥ 0.115 | REST API framework |
| **Uvicorn** | ≥ 0.30 | ASGI server |
| **XGBoost** | Latest | Demand forecasting (primary ML model) |
| **ARIMA (statsmodels)** | ≥ 0.14 | Time-series forecasting |
| **pandas** | ≥ 2.0 | Data processing & feature engineering |
| **NumPy** | ≥ 1.24 | Numerical computing |
| **scikit-learn** | ≥ 1.3 | Model utilities, metrics |
| **SciPy** | Latest | Safety stock (normal distribution z-score) |
| **joblib** | ≥ 1.3 | Model serialization |
| **geopy** | Latest | Geocoding for route optimizer |
| **pydantic** | ≥ 2.7 | Request/response validation |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 16.2.3 | React framework with SSR |
| **React** | 19.2.4 | UI library |
| **TypeScript** | 5 | Type-safe JavaScript |
| **TailwindCSS** | 4 | Utility-first CSS framework |
| **Recharts** | ≥ 3.8 | Charts & data visualization |
| **Leaflet + React-Leaflet** | 1.9.4 | Interactive map for warehouse routing |
| **Axios** | ≥ 1.15 | HTTP client for API calls |
| **Lucide React** | Latest | Icon system |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Docker** | Containerized deployment |
| **Vercel** | Frontend deployment |
| **Render** | Backend deployment |

---

## 📦 Datasets

The platform uses **3 pre-built CSV datasets** (Gemini-generated, real-world structure):

### 1. `supply_chain_sales_master.csv` — 730,000 rows × 9 columns
The backbone dataset. One row = one product sold at one warehouse on one date.

| Column | Description |
|---|---|
| `date` | Transaction date (2024–2026) |
| `product_id` | Product code (`PRD_001` … `PRD_100`) |
| `warehouse_id` | Warehouse code (`WH_01` … `WH_10`) |
| `units_sold` | Actual units sold that day |
| `unit_price` | Selling price per unit |
| `weather_condition` | Weather on that day (Sunny/Cloudy/Rain/Fog) |
| `temperature` | Temperature in °C |
| `is_holiday` | `1` = holiday, `0` = not |
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
Daily external context signals used in forecasting.

| Column | Description |
|---|---|
| `date` | Date |
| `weather_condition` | Weather (Sunny/Rain/Cloudy/Fog) |
| `temperature` | Temperature in °C |
| `is_holiday` | `0` or `1` |
| `social_trend_score` | Aggregate trend score 1–10 |

---

## 📁 Project Structure

```
supplychain/
│
├── 📊 DATA
│   ├── supply_chain_sales_master.csv       ← 730K row sales backbone
│   ├── supply_chain_inventory.csv          ← 100 product metadata rows
│   └── supply_chain_external_factors.csv   ← 730 days of external signals
│
├── 🤖 ML & FORECASTING
│   ├── eda_and_features.py                 ← EDA + feature engineering
│   ├── model_arima.py                      ← ARIMA model training
│   ├── predict_api.py                      ← Reusable forecast function
│   ├── arima_demand_model.pkl              ← Trained ARIMA model
│   └── sales_features.csv                  ← Processed features (generated)
│
├── ⚙️ OPTIMIZATION
│   ├── inventory_optimizer.py              ← EOQ + Safety Stock engine
│   └── route_optimizer.py                  ← Greedy nearest-neighbor routing
│
├── 🌐 BACKEND (FastAPI)
│   ├── main.py                             ← FastAPI app entry point
│   ├── data_loader.py                      ← Shared CSV data access layer
│   └── routers/
│       ├── forecast.py                     ← /api/forecast endpoints
│       ├── inventory.py                    ← /api/inventory endpoints
│       ├── alerts.py                       ← /api/alerts endpoints
│       ├── routing.py                      ← /api/routing endpoints
│       └── dataset.py                      ← /api/dataset upload endpoints
│
├── 🎨 FRONTEND (Next.js)
│   ├── src/
│   │   ├── app/                            ← Next.js App Router pages
│   │   └── components/                     ← Reusable React components
│   ├── public/                             ← Static assets
│   ├── package.json
│   └── next.config.js
│
├── 🐳 DEVOPS
│   ├── Dockerfile                          ← Container config
│   ├── render.yaml                         ← Render deployment config
│   └── vercel.json                         ← Vercel deployment config
│
├── 🧪 UTILITIES
│   ├── validate_data.py                    ← Verify all 3 datasets load correctly
│   ├── test_all.py                         ← API integration tests
│   ├── testdata.py                         ← Test data generator
│   └── utils/mock_data.py                  ← Fallback demo data
│
├── start_project.bat                       ← 🪟 Windows one-click launcher
├── requirements.txt                        ← Python dependencies
└── roadmap.md                              ← Full 12-hour hackathon roadmap
```

---

## ⚡ Quick Start

### Prerequisites

Make sure you have the following installed:

| Tool | Version | Download |
|---|---|---|
| **Python** | 3.10+ | [python.org](https://python.org/downloads) |
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org) |
| **npm** | 9+ | Comes with Node.js |
| **Git** | Any | [git-scm.com](https://git-scm.com) |

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/GopeshKachhadiya/supplychain.git
cd supplychain
```

---

### Step 2 — Install Python (Backend) Dependencies

```bash
pip install -r requirements.txt
```

Or install manually:

```bash
pip install pandas numpy scikit-learn xgboost statsmodels fastapi uvicorn \
            plotly scipy joblib python-dotenv pydantic geopy requests httpx python-multipart
```

---

### Step 3 — Verify Datasets

Run a quick check to make sure all 3 CSVs are loaded correctly:

```bash
python validate_data.py
```

Expected output:
```
=== SALES MASTER ===
Shape: (730000, 9)
...
=== INVENTORY ===
Shape: (100, 4)
...
=== EXTERNAL FACTORS ===
Shape: (730, 5)
...
```

---

### Step 4 — Install Frontend Dependencies

```bash
npm install
```

---

### Step 5 — Run the Platform

#### 🪟 Windows (Recommended — One Click)

Double-click `start_project.bat`, or run:

```bat
start_project.bat
```

This will:
1. Kill any existing processes on ports 8000 and 3000
2. Start the **FastAPI backend** in a new terminal window
3. Start the **Next.js frontend** in a new terminal window

#### 🐧 Linux / macOS (Manual)

Open **two separate terminals**:

**Terminal 1 — Backend:**
```bash
python -m uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
npm run dev
```

---

### Step 6 — Access the Application

| Service | URL |
|---|---|
| 🎨 **Frontend Dashboard** | http://localhost:3000 |
| 🌐 **Backend API** | http://localhost:8000 |
| 📄 **Interactive API Docs** | http://localhost:8000/docs |
| ❤️ **Health Check** | http://localhost:8000/health |

---

## 📡 API Reference

### Health Check
```
GET /health
```
```json
{ "status": "ok", "team": "AntiGravity", "version": "1.0.0" }
```

---

### Demand Forecasting

#### Get 7-Day Forecast
```
POST /api/forecast/predict
```
```json
{
  "product_id": "PRD_001",
  "warehouse_id": "WH_01",
  "start_date": "2025-06-01",
  "days": 7
}
```

**Response:**
```json
{
  "status": "success",
  "forecasts": [
    {
      "date": "2025-06-01",
      "predicted_demand": 312,
      "lower_bound": 265,
      "upper_bound": 358,
      "is_holiday": 0,
      "weather": "Sunny"
    }
  ]
}
```

#### List Products
```
GET /api/forecast/products
```

#### List Warehouses
```
GET /api/forecast/warehouses
```

---

### Inventory Management

#### Get Inventory Status for a Warehouse
```
GET /api/inventory/status/{warehouse_id}
```
**Example:** `GET /api/inventory/status/WH_01`

**Response:**
```json
{
  "warehouse_id": "WH_01",
  "total_products": 100,
  "alerts": 12,
  "inventory": [
    {
      "product_id": "PRD_001",
      "category": "Electronics",
      "current_stock": 245,
      "safety_stock": 180,
      "reorder_point": 320,
      "eoq": 850,
      "lead_time_days": 5,
      "status": "REORDER"
    }
  ]
}
```

**Status values:** `OK` | `REORDER` | `CRITICAL`

---

### Alerts

#### Get Active Alerts
```
GET /api/alerts/active
```
**Response:**
```json
{
  "total_alerts": 5,
  "alerts": [
    {
      "type": "STOCKOUT_RISK",
      "product_id": "PRD_042",
      "warehouse_id": "WH_03",
      "message": "PRD_042 at WH_03 has critically low sales (<50 units avg)",
      "severity": "HIGH"
    },
    {
      "type": "HOLIDAY_DEMAND_SPIKE",
      "date": "2025-06-15",
      "message": "Holiday on 2025-06-15 — expect +40% demand spike",
      "weather": "Sunny",
      "severity": "MEDIUM"
    }
  ]
}
```

---

### Route Optimization

#### Optimize Delivery Route
```
POST /api/routing/optimize
```
```json
{
  "start_warehouse": "WH_01",
  "stops": ["WH_02", "WH_03", "WH_04", "WH_05"]
}
```

**Response:**
```json
{
  "route": ["WH_01", "WH_03", "WH_05", "WH_04", "WH_02", "WH_01"],
  "total_distance_km": 4218.3,
  "estimated_time_hrs": 70.3
}
```

---

## 🧪 Running Tests

Verify all backend endpoints work end-to-end:

```bash
python test_all.py
```

Or manually test endpoints with curl:

```bash
# Health check
curl http://localhost:8000/health

# Forecast (POST)
curl -X POST http://localhost:8000/api/forecast/predict \
     -H "Content-Type: application/json" \
     -d '{"product_id":"PRD_001","warehouse_id":"WH_01","start_date":"2025-06-01","days":7}'

# Inventory status
curl http://localhost:8000/api/inventory/status/WH_01

# Active alerts
curl http://localhost:8000/api/alerts/active
```

---

## 🐳 Docker Deployment

Build and run the backend in Docker:

```bash
# Build the image
docker build -t supplychain-api .

# Run the container
docker run -p 8000:8000 supplychain-api
```

---

## ☁️ Cloud Deployment

### Backend → Render
The `render.yaml` is pre-configured. Connect your GitHub repo at [render.com](https://render.com) and it will auto-deploy.

### Frontend → Vercel
The `vercel.json` is pre-configured. Import your GitHub repo at [vercel.com](https://vercel.com) and set:

```
NEXT_PUBLIC_BACKEND_URL=https://your-render-url.onrender.com
```

## 🔮 ML Model Overview

### Demand Forecasting Pipeline

```
Raw Sales Data
    ↓
Feature Engineering
    ↓  day_of_week, month, is_weekend, is_rainy
       is_holiday, social_trend_score, temperature
       unit_price, lag_7, lag_30, rolling_7_mean
    ↓
XGBoost Regressor (n_estimators=200, lr=0.05, max_depth=6)
+
ARIMA (statsmodels)
    ↓
Prediction with Confidence Bands (±15%)
```

### Inventory Formulas

**Safety Stock:**
```
SS = Z(service_level) × σ_demand × √(lead_time)
```
*(service_level = 95% → Z = 1.645)*

**Economic Order Quantity (EOQ):**
```
EOQ = √(2 × annual_demand × order_cost / holding_cost)
```

**Reorder Point:**
```
ROP = avg_daily_demand × lead_time_days + safety_stock
```

<div align="center">
</div>
