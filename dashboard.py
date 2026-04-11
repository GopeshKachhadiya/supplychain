import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import requests

st.set_page_config(
    page_title="AntiGravity Supply Chain AI",
    page_icon="🚀",
    layout="wide"
)

st.title("🚀 AI-Driven Supply Chain Optimization")
st.caption("Team AntiGravity | Hackathon 2025")

BACKEND = "http://localhost:8000"

# ── Sidebar ───────────────────────────────────────────────────
st.sidebar.header("🔧 Controls")
warehouse_id = st.sidebar.selectbox("Select Warehouse",
    [f"WH_{str(i).zfill(2)}" for i in range(1, 11)])
product_id = st.sidebar.selectbox("Select Product",
    [f"PRD_{str(i).zfill(3)}" for i in range(1, 21)])
forecast_days = st.sidebar.slider("Forecast Days", 7, 30, 14)

# ── Tabs ──────────────────────────────────────────────────────
tab1, tab2, tab3, tab4 = st.tabs([
    "📈 Demand Forecast", "📦 Inventory Status", "🚨 Alerts", "🗺️ Route Optimizer"
])

# ── Tab 1: Demand Forecast ────────────────────────────────────
with tab1:
    st.subheader(f"Demand Forecast — {product_id} @ {warehouse_id}")
    if st.button("🔮 Run Forecast", key="btn_forecast"):
        with st.spinner("Running ARIMA model..."):
            try:
                resp = requests.post(f"{BACKEND}/api/forecast/predict", json={
                    "product_id": product_id, "warehouse_id": warehouse_id,
                    "start_date": "2025-06-01", "days": forecast_days
                })
                data = resp.json()
                if "forecasts" in data:
                    df_fc = pd.DataFrame(data["forecasts"])
                    fig = go.Figure()
                    fig.add_trace(go.Scatter(x=df_fc['date'], y=df_fc['predicted_demand'],
                        name='Predicted', line=dict(color='#6C63FF', width=2)))
                    fig.add_trace(go.Scatter(x=df_fc['date'], y=df_fc['upper_bound'],
                        name='Upper Bound', line=dict(color='#ccc', dash='dot')))
                    fig.add_trace(go.Scatter(x=df_fc['date'], y=df_fc['lower_bound'],
                        name='Lower Bound', fill='tonexty',
                        fillcolor='rgba(108,99,255,0.1)', line=dict(color='#ccc', dash='dot')))
                    fig.update_layout(title='Demand Forecast with Confidence Bands',
                                      xaxis_title='Date', yaxis_title='Units')
                    st.plotly_chart(fig, use_container_width=True)
                    st.dataframe(df_fc, use_container_width=True)
                else:
                    st.error("Invalid response. Is the backend running on port 8000?")
            except Exception as e:
                st.error(f"Backend error: {e}")

# ── Tab 2: Inventory Status ───────────────────────────────────
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
                    col3.metric("Reorder Needed",  len(df_inv[df_inv['status'] == 'REORDER']))
                else:
                    col2.metric("Critical Alerts", 0)
                    col3.metric("Reorder Needed", 0)
                def color_status(val):
                    color = '#ff4b4b' if val == 'CRITICAL' else '#ffa421' if val == 'REORDER' else '#00cc96'
                    return f'background-color: {color}'
                st.dataframe(df_inv.style.map(color_status, subset=['status']),
                             use_container_width=True)
            except Exception as e:
                st.error(f"Backend error: {e}")

# ── Tab 3: Alerts ─────────────────────────────────────────────
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

# ── Tab 4: Route Optimizer ────────────────────────────────────
with tab4:
    st.subheader("🗺️ Optimal Delivery Routing (A*)")
    st.info("Uses A* Search Algorithm for the mathematically shortest warehouse-to-warehouse path.")

    WH_CITY = {
        "WH_01": "Mumbai",    "WH_02": "Delhi",     "WH_03": "Bengaluru",
        "WH_04": "Kolkata",   "WH_05": "Hyderabad", "WH_06": "Chennai",
        "WH_07": "Ahmedabad", "WH_08": "Pune",      "WH_09": "Surat",
        "WH_10": "Jaipur",
    }

    # Persist results across Streamlit re-runs (e.g. map pan/zoom)
    if "route_result" not in st.session_state:
        st.session_state.route_result    = None
    if "route_wh_coords" not in st.session_state:
        st.session_state.route_wh_coords = None

    all_warehouses = [f"WH_{str(i).zfill(2)}" for i in range(1, 11)]
    stops = st.multiselect(
        "Select warehouses to visit",
        [w for w in all_warehouses if w != warehouse_id],
        default=[all_warehouses[1], all_warehouses[2]],
    )

    if st.button("Calculate Optimal Route", key="btn_route"):
        try:
            resp = requests.post(f"{BACKEND}/api/routing/optimize", json={
                "start_warehouse": warehouse_id, "stops": stops
            })
            if resp.status_code != 200:
                st.error(resp.json().get("detail", "Error calculating route"))
            else:
                wh_resp   = requests.get(f"{BACKEND}/api/routing/warehouses")
                wh_coords = {w["id"]: (w["lat"], w["lon"]) for w in wh_resp.json()["warehouses"]}
                st.session_state.route_result    = resp.json()["route"]
                st.session_state.route_wh_coords = wh_coords
        except Exception as e:
            st.error(f"Backend error: {e}")

    # ── Display (reads from session_state — stable across re-runs) ────────────
    if st.session_state.route_result:
        route_data = st.session_state.route_result
        wh_coords  = st.session_state.route_wh_coords
        path       = route_data["route"]

        st.success(f"**Optimal Route:** {' → '.join(path)}")
        c1, c2 = st.columns(2)
        c1.metric("Total Distance", f"{route_data['total_distance_km']} km")
        c2.metric("Estimated Time", f"{route_data['estimated_time_hrs']} hrs")

        import folium
        from streamlit_folium import st_folium

        lats   = [wh_coords[wh][0] for wh in path]
        lons   = [wh_coords[wh][1] for wh in path]
        center = [sum(lats) / len(lats), sum(lons) / len(lons)]

        # ── Google Maps tiles — streets, cities, rivers, buildings ────────────
        fmap = folium.Map(location=center, zoom_start=5, tiles=None)
        folium.TileLayer(
            tiles="https://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}",
            attr="Google Maps",
            name="Google Maps",
            max_zoom=20,
        ).add_to(fmap)

        # ── Fetch REAL road route geometry from OSRM (free, no API key) ─────────
        # OSRM returns the actual road path between stops, just like Google Maps.
        def get_road_path(coord1, coord2):
            """Call OSRM public API to get actual road route geometry."""
            try:
                lon1, lat1 = coord1[1], coord1[0]
                lon2, lat2 = coord2[1], coord2[0]
                url = (
                    f"http://router.project-osrm.org/route/v1/driving/"
                    f"{lon1},{lat1};{lon2},{lat2}"
                    f"?overview=full&geometries=geojson"
                )
                r = requests.get(url, timeout=10)
                if r.status_code == 200:
                    coords = r.json()["routes"][0]["geometry"]["coordinates"]
                    # OSRM returns [lon, lat] — Folium needs [lat, lon]
                    return [[c[1], c[0]] for c in coords]
            except Exception:
                pass
            # Fallback: straight line if OSRM fails
            return [list(coord1), list(coord2)]

        # Draw actual road path for each consecutive pair of stops
        for seg_i in range(len(path) - 1):
            wh_from = path[seg_i]
            wh_to   = path[seg_i + 1]
            road_coords = get_road_path(wh_coords[wh_from], wh_coords[wh_to])
            # Shadow line
            folium.PolyLine(road_coords, color="#1a237e", weight=9, opacity=0.2).add_to(fmap)
            # Main blue route line
            folium.PolyLine(road_coords, color="#4285F4", weight=5, opacity=0.9,
                            tooltip=f"Road: {wh_from} → {wh_to}").add_to(fmap)


        # Numbered circle markers
        for i, wh in enumerate(path):
            # Skip duplicate return-to-start marker
            if i == len(path) - 1 and path[0] == path[-1]:
                continue
            lat, lon = wh_coords[wh]
            city     = WH_CITY.get(wh, wh)
            bg       = "#34A853" if i == 0 else "#4285F4"
            lbl      = "S"       if i == 0 else str(i)
            icon_html = (
                f'<div style="background:{bg};color:white;border-radius:50%;'
                f'width:32px;height:32px;display:flex;align-items:center;'
                f'justify-content:center;font-weight:bold;font-size:14px;'
                f'border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.45);">'
                f'{lbl}</div>'
            )
            folium.Marker(
                location=[lat, lon],
                icon=folium.DivIcon(html=icon_html, icon_size=(32, 32), icon_anchor=(16, 16)),
                popup=folium.Popup(f"<b>{wh}</b><br>{city}", max_width=150),
                tooltip=f"{'START' if i == 0 else f'Stop {i}'}: {wh} ({city})",
            ).add_to(fmap)

        folium.LayerControl().add_to(fmap)
        fmap.fit_bounds([[min(lats) - 0.5, min(lons) - 0.5],
                         [max(lats) + 0.5, max(lons) + 0.5]])

        st.markdown("### 🗺️ Live Route Map (Google Maps)")
        # returned_objects=[] → map pan/zoom will NOT re-trigger Streamlit
        st_folium(fmap, width="100%", height=550, returned_objects=[])

        # Route summary table
        st.markdown("### 📋 Route Summary")
        table = [
            {"Step": "🟢 Start" if i == 0 else f"🔵 Stop {i}",
             "Warehouse": wh, "City": WH_CITY.get(wh, wh)}
            for i, wh in enumerate(path)
        ]
        st.dataframe(pd.DataFrame(table), use_container_width=True, hide_index=True)

        # Google Maps navigation button
        stops_str = "/".join([f"{wh_coords[wh][0]},{wh_coords[wh][1]}" for wh in path])
        gmaps_url = "https://www.google.com/maps/dir/" + stops_str
        st.markdown(f"""
        <div style="text-align:center;margin-top:20px;">
            <a href="{gmaps_url}" target="_blank" style="text-decoration:none;">
                <button style="background:#4285F4;color:white;padding:14px 36px;
                               border:none;border-radius:8px;cursor:pointer;
                               font-weight:bold;font-size:16px;
                               box-shadow:0 4px 12px rgba(66,133,244,0.4);">
                    📍 Open Full Route in Google Maps
                </button>
            </a>
        </div>
        """, unsafe_allow_html=True)
