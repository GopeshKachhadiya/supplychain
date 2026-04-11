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
    for _, row in upcoming.iterrows():
        alerts.append({
            'type': 'HOLIDAY_DEMAND_SPIKE',
            'date': str(row['date'].date()),
            'message': f"Holiday on {row['date'].date()} — expect +40% demand spike",
            'weather': row['weather_condition'],
            'severity': 'MEDIUM'
        })

    return {"total_alerts": len(alerts), "alerts": alerts[:10]}
