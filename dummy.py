import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# --- CONFIGURATION (Change these to generate more/less data) ---
NUM_DAYS = 730         # 2 years of daily data
NUM_PRODUCTS = 100     # Number of unique products
NUM_STORES = 10        # Number of warehouses/stores
START_DATE = datetime(2024, 1, 1)

print("Starting data generation...")

# 1. GENERATE DATES & EXTERNAL FACTORS
dates = [START_DATE + timedelta(days=i) for i in range(NUM_DAYS)]
weather_options = ['Clear', 'Rain', 'Cloudy', 'Snow', 'Extreme Storm']
weather_weights = [0.5, 0.2, 0.2, 0.08, 0.02] # Make clear weather most common

external_data = []
for d in dates:
    weather = random.choices(weather_options, weights=weather_weights)[0]
    is_holiday = 1 if d.month == 12 and d.day > 20 else 0 # Simple holiday logic
    trend_score = random.randint(10, 100) if random.random() > 0.9 else random.randint(1, 10) # Occasional viral spikes
    external_data.append([d, weather, round(random.uniform(-5, 35), 1), is_holiday, trend_score])

df_external = pd.DataFrame(external_data, columns=['date', 'weather_condition', 'temperature', 'is_holiday', 'social_trend_score'])

# 2. GENERATE PRODUCTS & INVENTORY
categories = ['Electronics', 'Apparel', 'Grocery', 'Home Goods']
product_data = []
for p_id in range(1, NUM_PRODUCTS + 1):
    cat = random.choice(categories)
    holding_cost = round(random.uniform(0.5, 5.0), 2)
    lead_time = random.randint(2, 14)
    product_data.append([f"PRD_{p_id:03d}", cat, holding_cost, lead_time])

df_products = pd.DataFrame(product_data, columns=['product_id', 'category', 'holding_cost', 'supplier_lead_time_days'])

# 3. GENERATE MASSIVE SALES & DEMAND DATA
sales_data = []
for d in dates:
    for p_id in df_products['product_id']:
        for s_id in range(1, NUM_STORES + 1):
            # Base demand
            base_demand = random.randint(5, 50)
            
            # Add some randomness and connect it to external factors
            holiday_boost = 2.0 if d.month == 12 else 1.0
            
            # Calculate final units sold
            units_sold = int(base_demand * holiday_boost * random.uniform(0.8, 1.2))
            
            sales_data.append([
                d, 
                p_id, 
                f"WH_{s_id:02d}", 
                units_sold, 
                round(random.uniform(10, 200), 2) # Random price
            ])

df_sales = pd.DataFrame(sales_data, columns=['date', 'product_id', 'warehouse_id', 'units_sold', 'price'])

# 4. MERGE SALES WITH EXTERNAL FACTORS
# This creates the perfect master dataset for your Machine Learning model
df_master_sales = pd.merge(df_sales, df_external, on='date', how='left')

# --- EXPORT TO CSV ---
df_master_sales.to_csv('supply_chain_sales_master.csv', index=False)
df_products.to_csv('supply_chain_inventory.csv', index=False)
df_external.to_csv('supply_chain_external_factors.csv', index=False)

print(f"Success! Generated {len(df_master_sales)} rows of complex sales data.")
print("Files saved: supply_chain_sales_master.csv, supply_chain_inventory.csv, supply_chain_external_factors.csv")