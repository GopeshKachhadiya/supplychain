from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import sys; sys.path.insert(0, '.')
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
    from backend.data_loader import get_sales
    sales = get_sales()
    return {"products": sorted(sales['product_id'].unique().tolist())}

@router.get("/warehouses")
def list_warehouses():
    from backend.data_loader import get_sales
    sales = get_sales()
    return {"warehouses": sorted(sales['warehouse_id'].unique().tolist())}
