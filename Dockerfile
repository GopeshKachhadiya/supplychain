# ── Backend Dockerfile ──────────────────────────────────────────────────────
# Deploys the FastAPI backend on Render (Web Service)

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend files
COPY main.py .
COPY data_loader.py .
COPY inventory_optimizer.py .
COPY model_arima.py .
COPY predict_api.py .
COPY route_optimizer.py .
COPY eda_and_features.py .
COPY validate_data.py .
COPY geo_cache.json .
COPY routers/ ./routers/
COPY utils/ ./utils/

# Copy data files (CSVs and model)
COPY arima_demand_model.pkl .
COPY supply_chain_inventory.csv .
COPY supply_chain_external_factors.csv .
# Note: large CSV files (sales_features.csv, supply_chain_sales_master.csv)
# are excluded from Docker to keep image size manageable.
# Add them back if your routers require them.

# Expose port
EXPOSE 8000

# Start the server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
