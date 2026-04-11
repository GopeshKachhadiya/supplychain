from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from predict_api import predict_demand
except ImportError:
    # Mock fallback if Member 1 hasn't finished predict_api.py yet
    def predict_demand(product_id: str, warehouse_id: str, start_date: str, days: int = 7) -> list:
        import numpy as np, pandas as pd
        dates = pd.date_range(start_date, periods=days)
        base = np.random.randint(200, 400, days)
        return [{'date': str(d.date()), 'predicted_demand': int(b),
                 'lower_bound': int(b*0.85), 'upper_bound': int(b*1.15),
                 'is_holiday': 0, 'weather': 'Sunny'}
                for d, b in zip(dates, base)]

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
    if sales is None or sales.empty:
        return {"products": ["PRD_001", "PRD_002", "PRD_003"]}
    return {"products": sorted(sales['product_id'].unique().tolist())}

@router.get("/warehouses")
def list_warehouses():
    from data_loader import get_sales
    sales = get_sales()
    if sales is None or sales.empty:
         return {"warehouses": ["WH_01", "WH_02", "WH_03"]}
    return {"warehouses": sorted(sales['warehouse_id'].unique().tolist())}
