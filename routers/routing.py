"""
routers/routing.py
------------------
Member 3 — Route Optimizer API Endpoint

Exposes the RouteOptimizer engine as a FastAPI router.
Added to main.py under /api/routing prefix.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

from route_optimizer import RouteOptimizer

router = APIRouter()
_route_engine = RouteOptimizer()

class RouteRequest(BaseModel):
    start_warehouse: str = "WH_01"
    stops: List[str] = ["WH_02", "WH_03", "WH_04", "WH_05"]

@router.post("/optimize")
def optimize_route(req: RouteRequest):
    """
    Returns the optimal delivery route using Greedy Nearest-Neighbor algorithm.
    Supports all 10 warehouses (WH_01 to WH_10).
    """
    result = _route_engine.get_optimal_route(req.start_warehouse, req.stops)
    if "error" in result:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=result["error"])
    return {"status": "success", "route": result}

@router.get("/warehouses")
def list_route_warehouses():
    """Returns all warehouses with their geographic coordinates."""
    return {
        "warehouses": [
            {"id": wh_id, "lat": lat, "lon": lon}
            for wh_id, (lat, lon) in _route_engine.WAREHOUSES.items()
        ]
    }
