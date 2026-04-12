from fastapi import APIRouter
from data_loader import get_sales, get_external
import pandas as pd

router = APIRouter()

@router.get("/active")
def get_active_alerts():
    sales    = get_sales()
    external = get_external()

    alerts = []

    if sales is None or external is None:
        # Mock alerts
        return {
            "total_alerts": 2,
            "alerts": [
                {"type": "STOCKOUT_RISK", "product_id": "PRD_003", "warehouse_id": "WH_01", "message": "PRD_003 at WH_01 has critically low sales", "severity": "HIGH"},
                {"type": "HOLIDAY_DEMAND_SPIKE", "date": "2025-08-15", "message": "Holiday demand spike", "weather": "Sunny", "severity": "MEDIUM"}
            ]
        }

    # Alert 1: Stockout risk — products with declining trend
    recent = sales[sales['date'] >= sales['date'].max() - pd.Timedelta(days=14)]
    for (pid, wid), grp in recent.groupby(['product_id', 'warehouse_id']):
        weekly_avg = grp['units_sold'].mean()
        if pd.notna(weekly_avg) and weekly_avg < 5:
            alerts.append({
                'type': 'STOCKOUT_RISK',
                'product_id': pid,
                'warehouse_id': wid,
                'message': f'{pid} at {wid} has critically low sales (<5 units avg)',
                'severity': 'HIGH'
            })
            if len(alerts) > 5:
                break

    # Alert 2: Holiday alert from external factors
    upcoming = external[external['is_holiday'] == 1].tail(3)
    
    # Holiday detection map (Month, Day)
    HOLIDAY_MAP = {
        (10, 15): "Navratri Beginning",
        (10, 20): "Navaratri Peak",
        (10, 21): "Navaratri Peak",
        (10, 22): "Navaratri Peak",
        (10, 23): "Dussehra",
        (10, 31): "Diwali Prep",
        (11, 1): "Diwali Festival",
        (11, 2): "Govardhan Puja",
        (12, 24): "Christmas Eve",
        (12, 25): "Christmas Day",
        (12, 28): "Year-End Mega Sale",
        (12, 29): "Year-End Mega Sale",
        (12, 30): "Year-End Mega Sale",
        (12, 31): "New Year's Eve",
        (1, 1): "New Year's Day",
        (1, 26): "Republic Day Sale",
        (8, 15): "Independence Day Sale"
    }

    for _, row in upcoming.iterrows():
        dt = row['date']
        # Try to find specific holiday, fallback to Year-End peak if in December, else Holiday Season
        h_name = HOLIDAY_MAP.get((dt.month, dt.day))
        if not h_name:
            if dt.month == 12: h_name = "Year-End Peak"
            else: h_name = "Holiday Season"
        
        alerts.append({
            'type': 'HOLIDAY_DEMAND_SPIKE',
            'date': str(dt.date()),
            'holiday_name': h_name,
            'message': f"{h_name} Event — {dt.strftime('%d %b')} — Expected +40% Surge",
            'weather': row['weather_condition'],
            'severity': 'MEDIUM'
        })

    return {"total_alerts": len(alerts), "alerts": alerts[:10]}
