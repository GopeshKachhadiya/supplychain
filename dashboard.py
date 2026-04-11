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
    [f"WH_{str(i).zfill(2)}" for i in range(1, 11)]
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
        with st.spinner("Running ARIMA model..."):
            try:
                resp = requests.post(f"{BACKEND}/api/forecast/predict", json={
                    "product_id": product_id,
                    "warehouse_id": warehouse_id,
                    "start_date": "2025-06-01",
                    "days": forecast_days
                })
                data = resp.json()
                if "forecasts" in data:
                    df_fc = pd.DataFrame(data["forecasts"])
                    
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
                    fig.update_layout(title='Demand Forecast with Confidence Bands',
                                      xaxis_title='Date', yaxis_title='Units')
                    st.plotly_chart(fig, use_container_width=True)
                    st.dataframe(df_fc, use_container_width=True)
                else:
                    st.error("Invalid response from Backend. Did you start FastAPI on port 8000?")
            except Exception as e:
                st.error(f"Backend error: {e}")

# ── Tab 2: Inventory Status ──────────────────────────────────
with tab2:
    st.subheader(f"Inventory Status — {warehouse_id}")

    if st.button("📊 Load Inventory", key="btn_inv"):
        with st.spinner("Computing inventory metrics..."):
            try:
                resp = requests.get(f"{BACKEND}/api/inventory/status/{warehouse_id}")
                data = resp.json()["inventory"]
                df_inv = pd.DataFrame(data)

                col1, col2, col3 = st.columns(3)
                col1.metric("Total Products", len(df_inv))
                
                if len(df_inv) > 0:
                    col2.metric("Critical Alerts", len(df_inv[df_inv['status'] == 'CRITICAL']))
                    col3.metric("Reorder Needed", len(df_inv[df_inv['status'] == 'REORDER']))
                else:
                    col2.metric("Critical Alerts", 0)
                    col3.metric("Reorder Needed", 0)

                def color_status(val):
                    color = '#ff4b4b' if val == 'CRITICAL' else '#ffa421' if val == 'REORDER' else '#00cc96'
                    return f'background-color: {color}'

                st.dataframe(df_inv.style.map(color_status, subset=['status']), use_container_width=True)
            except Exception as e:
                st.error(f"Backend error: {e}")

# ── Tab 3: Alerts ────────────────────────────────────────────
with tab3:
    st.subheader("🚨 Active System Alerts")
    
    if st.button("Fetch Alerts", key="btn_alerts"):
        try:
            resp = requests.get(f"{BACKEND}/api/alerts/active")
            alerts = resp.json()["alerts"]
            for a in alerts:
                if a['severity'] == 'HIGH':
                    st.error(f"**{a['type']}**: {a['message']}")
                else:
                    st.warning(f"**{a['type']}**: {a['message']}")
        except Exception as e:
            st.error(f"Backend error: {e}")

# ── Tab 4: Route Optimizer ───────────────────────────────────
with tab4:
    st.subheader("🗺️ Optimal Delivery Routing (Demo)")
    st.info("Greedy Nearest-Neighbor Heuristic for Warehouse deliveries")
    
    if st.button("Optimize Route", key="btn_route"):
        import sys
        import os
        sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
        try:
            from route_optimizer import nearest_neighbor_route
            
            # Pick 4 random destinations that are not the starting point
            all_stops = [f"WH_{str(i).zfill(2)}" for i in range(1, 11)]
            stops = list(np.random.choice([s for s in all_stops if s != warehouse_id], 4, replace=False))
            
            res = nearest_neighbor_route(warehouse_id, stops)
            if "error" in res:
                st.error(res["error"])
            else:
                st.success(f"Optimized Route: {' → '.join(res['route'])}")
                st.metric("Total Distance", f"{res['total_distance_km']} km")
                st.metric("Estimated Time", f"{res['estimated_time_hrs']} hrs")
        except ImportError:
            st.error("route_optimizer.py not found. Make sure it's in the same directory.")
