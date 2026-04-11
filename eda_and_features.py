import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# Load datasets
sales = pd.read_csv('supply_chain_sales_master.csv', parse_dates=['date'])
inventory = pd.read_csv('supply_chain_inventory.csv')
external = pd.read_csv('supply_chain_external_factors.csv', parse_dates=['date'])

# ── Merge external factors into sales ────────────────────────
df = sales.merge(external[['date','is_holiday','social_trend_score']],
                 on='date', how='left', suffixes=('','_ext'))

# ── Feature Engineering ──────────────────────────────────────
df['day_of_week']    = df['date'].dt.dayofweek
df['month']          = df['date'].dt.month
df['is_weekend']     = (df['day_of_week'] >= 5).astype(int)
df['is_rainy']       = (df['weather_condition'] == 'Rain').astype(int)
df['lag_7']          = df.groupby(['product_id','warehouse_id'])['units_sold'].shift(7)
df['lag_30']         = df.groupby(['product_id','warehouse_id'])['units_sold'].shift(30)
df['rolling_7_mean'] = df.groupby(['product_id','warehouse_id'])['units_sold'] \
                         .transform(lambda x: x.shift(1).rolling(7).mean())
df.dropna(inplace=True)

print(f"Feature-engineered dataset: {df.shape}")
df.to_csv('sales_features.csv', index=False)

# ── Quick EDA ────────────────────────────────────────────────
# 1. Average demand by weather condition
weather_demand = df.groupby('weather_condition')['units_sold'].mean()
print("\nAvg demand by weather:\n", weather_demand)

# 2. Holiday vs non-holiday
holiday_demand = df.groupby('is_holiday')['units_sold'].agg(['mean','std'])
print("\nHoliday impact:\n", holiday_demand)

# 3. Top 5 products by volume
top_prods = df.groupby('product_id')['units_sold'].sum().nlargest(5)
print("\nTop 5 products:\n", top_prods)
