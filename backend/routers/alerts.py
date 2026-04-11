from fastapi import APIRouter
from backend.data_loader import get_sales, get_external
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
