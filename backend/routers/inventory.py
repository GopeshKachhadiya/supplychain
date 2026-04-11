from fastapi import APIRouter
import pandas as pd, numpy as np
from backend.data_loader import get_sales, get_inventory
from scipy import stats

router = APIRouter()

def compute_safety_stock(avg_demand, std_demand, lead_time, service_level=0.95):
    z = stats.norm.ppf(service_level)
    return int(np.ceil(z * std_demand * np.sqrt(lead_time)))

def compute_eoq(annual_demand, order_cost=500, holding_cost=12):
    if holding_cost <= 0:
        holding_cost = 12
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
