import os
import json
import csv

# 1. Create the target folder
folder_name = "hurricane_test_data"
if not os.path.exists(folder_name):
    os.makedirs(folder_name)
    print(f"Created directory: {folder_name}/")

# 2. Define the exact test data from our crisis scenario
external_data = [
    ["date", "weather_condition", "temperature", "is_holiday", "social_trend_score"],
    ["2026-08-01", "Clear", 28.5, 0, 12],
    ["2026-08-02", "Clear", 29.0, 0, 15],
    ["2026-08-03", "Cloudy", 26.5, 0, 25],
    ["2026-08-04", "Rain", 22.0, 0, 65],  # Hurricane news breaks
    ["2026-08-05", "Extreme Storm", 18.0, 0, 95], # Panic buying
    ["2026-08-06", "Extreme Storm", 17.5, 0, 98],
    ["2026-08-07", "Rain", 20.0, 0, 80]
]

demand_data = [
    ["date", "product_id", "product_name", "warehouse_id", "actual_units_sold"],
    # Product 1: Emergency Generators (Demand Spikes)
    ["2026-08-01", "PRD_001", "Generators", "WH_EastCoast", 2],
    ["2026-08-02", "PRD_001", "Generators", "WH_EastCoast", 3],
    ["2026-08-03", "PRD_001", "Generators", "WH_EastCoast", 8],
    ["2026-08-04", "PRD_001", "Generators", "WH_EastCoast", 45],
    ["2026-08-05", "PRD_001", "Generators", "WH_EastCoast", 120],
    ["2026-08-06", "PRD_001", "Generators", "WH_EastCoast", 150],
    ["2026-08-07", "PRD_001", "Generators", "WH_EastCoast", 90],
    # Product 2: Summer T-Shirts (Demand Crashes)
    ["2026-08-01", "PRD_002", "Summer T-Shirts", "WH_EastCoast", 50],
    ["2026-08-02", "PRD_002", "Summer T-Shirts", "WH_EastCoast", 45],
    ["2026-08-03", "PRD_002", "Summer T-Shirts", "WH_EastCoast", 30],
    ["2026-08-04", "PRD_002", "Summer T-Shirts", "WH_EastCoast", 5],
    ["2026-08-05", "PRD_002", "Summer T-Shirts", "WH_EastCoast", 0],
    ["2026-08-06", "PRD_002", "Summer T-Shirts", "WH_EastCoast", 0],
    ["2026-08-07", "PRD_002", "Summer T-Shirts", "WH_EastCoast", 2]
]

inventory_data = [
    ["date", "product_id", "current_stock_level", "ai_recommended_action", "order_quantity"],
    ["2026-08-01", "PRD_001", 50, "Hold", 0],
    ["2026-08-02", "PRD_001", 47, "Hold", 0],
    ["2026-08-03", "PRD_001", 39, "EMERGENCY_RESTOCK", 200], # AI spots the storm early
    ["2026-08-04", "PRD_001", 194, "Hold", 0], # Stock arrives just in time
    ["2026-08-05", "PRD_001", 74, "Hold", 0],
    ["2026-08-06", "PRD_001", 0, "CRITICAL_STOCKOUT", 0], # Demand outpaces supply despite AI
    ["2026-08-07", "PRD_001", 0, "Hold", 0]
]

logistics_data = [
    {
        "order_id": "ORD_991",
        "status": "In Transit",
        "cargo": "PRD_001 (Generators)",
        "priority": "High (Hospital)",
        "standard_route_nodes": ["WH_East", "Hwy_95", "City_Center", "Hospital"],
        "disruption_event": "Hwy_95_Flooded",
        "ai_rerouted_path": ["WH_East", "County_Road_B", "West_Bridge", "City_Center", "Hospital"],
        "delay_incurred_mins": 45
    }
]

# 3. Helper function to write CSVs
def write_csv(filename, data):
    filepath = os.path.join(folder_name, filename)
    with open(filepath, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerows(data)
    print(f"Generated: {filepath}")

# 4. Generate the files
write_csv("test_external.csv", external_data)
write_csv("test_demand.csv", demand_data)
write_csv("test_inventory.csv", inventory_data)

# 5. Write the JSON for the logistics map
logistics_filepath = os.path.join(folder_name, "test_logistics.json")
with open(logistics_filepath, 'w') as json_file:
    json.dump(logistics_data, json_file, indent=4)
print(f"Generated: {logistics_filepath}")

print("\nSuccess! All test data files are ready in your folder.")