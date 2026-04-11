"""
routers/inventory.py
--------------------
Member 2 (Backend) + Member 3 (Optimization Engine) — Integrated

Instead of duplicating EOQ/Safety Stock math, this router delegates
all computation to Member 3's InventoryOptimizer class. This ensures:
  - A single source of truth for all inventory calculations
  - Smart holiday-aware status (PRE_HOLIDAY_STOCKING)
  - Consistent results across all API endpoints
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter
from data_loader import get_sales, get_inventory

router = APIRouter()

# ---------------------------------------------------------------------------
# Lazy-load Member 3's InventoryOptimizer engine
# Falls back to a standalone implementation if the file is not yet present.
# ---------------------------------------------------------------------------
try:
    from inventory_optimizer import InventoryOptimizer
    _optimizer = InventoryOptimizer()
    _USE_ENGINE = True
except Exception:
    _USE_ENGINE = False

# ---------------------------------------------------------------------------
# Standalone fallback (mirrors Member 2's original logic exactly)
# Used only if inventory_optimizer.py is missing on another member's machine.
# ---------------------------------------------------------------------------
import numpy as np
import pandas as pd
from scipy import stats

def _compute_safety_stock(avg_demand, std_demand, lead_time, service_level=0.95):
    z = stats.norm.ppf(service_level)
    return int(np.ceil(z * std_demand * np.sqrt(lead_time)))

def _compute_eoq(annual_demand, holding_cost=12):
    return int(np.sqrt((2 * annual_demand * 500) / holding_cost))

def _standalone_inventory_status(warehouse_id: str):
    """Original Member 2 logic — fallback only."""
    sales = get_sales()
    inv   = get_inventory()

    if sales is None or inv is None:
        return {
            "warehouse_id": warehouse_id,
            "total_products": 2,
            "alerts": 1,
            "inventory": [
                {"product_id": "PRD_001", "category": "Apparel", "current_stock": 50,
                 "safety_stock": 60, "reorder_point": 100, "eoq": 200,
                 "lead_time_days": 2, "status": "CRITICAL"},
                {"product_id": "PRD_002", "category": "Home", "current_stock": 250,
                 "safety_stock": 40, "reorder_point": 90, "eoq": 300,
                 "lead_time_days": 3, "status": "OK"},
            ]
        }

    wh_sales = sales[sales['warehouse_id'] == warehouse_id]
    results  = []

    for product_id, grp in wh_sales.groupby('product_id'):
        inv_row = inv[inv['product_id'] == product_id]
        if inv_row.empty:
            continue

        lead_time    = int(inv_row['supplier_lead_time_days'].values[0])
        holding_cost = float(inv_row['holding_cost'].values[0])

        avg_d = grp['units_sold'].mean()
        std_d = grp['units_sold'].std()

        if pd.isna(avg_d) or pd.isna(std_d) or std_d == 0:
            avg_d, std_d = 10, 2

        ss  = _compute_safety_stock(avg_d, std_d, lead_time)
        rop = int(avg_d * lead_time) + ss
        eoq = _compute_eoq(avg_d * 365, holding_cost=holding_cost)

        current_stock = int(grp['units_sold'].tail(3).mean() * 5)
        if pd.isna(current_stock):
            current_stock = 0

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

    alerts_count = sum(1 for r in results if r['status'] in ['CRITICAL', 'REORDER'])
    return {
        "warehouse_id": warehouse_id,
        "total_products": len(results),
        "alerts": alerts_count,
        "inventory": results
    }

# ---------------------------------------------------------------------------
# API Endpoint
# ---------------------------------------------------------------------------
@router.get("/status/{warehouse_id}")
def inventory_status(warehouse_id: str):
    """
    Returns inventory status for a given warehouse.
    Uses Member 3's InventoryOptimizer if available (holiday-aware, smarter EOQ),
    otherwise falls back to Member 2's standalone logic.
    """
    if _USE_ENGINE:
        return _optimizer.get_inventory_status_api(warehouse_id)
    else:
        return _standalone_inventory_status(warehouse_id)
