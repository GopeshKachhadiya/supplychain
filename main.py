from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import forecast, inventory, alerts, routing

app = FastAPI(
    title="AntiGravity Supply Chain API",
    version="1.0.0",
    description="AI Supply Chain Optimization — Team AntiGravity Hackathon"
)

app.add_middleware(CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

app.include_router(forecast.router,   prefix="/api/forecast",   tags=["Forecasting"])
app.include_router(inventory.router,  prefix="/api/inventory",  tags=["Inventory"])
app.include_router(alerts.router,     prefix="/api/alerts",     tags=["Alerts"])
app.include_router(routing.router,    prefix="/api/routing",    tags=["Route Optimizer"])

@app.get("/health")
def health():
    return {"status": "ok", "team": "AntiGravity", "version": "1.0.0"}

# Run: uvicorn main:app --reload --port 8000
