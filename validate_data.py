import pandas as pd

sales = pd.read_csv('supply_chain_sales_master.csv')
inventory = pd.read_csv('supply_chain_inventory.csv')
external = pd.read_csv('supply_chain_external_factors.csv')

print("=== SALES MASTER ===")
print(f"Shape: {sales.shape}")
print(sales.dtypes)
print(sales.head(3))

print("\n=== INVENTORY ===")
print(f"Shape: {inventory.shape}")
print(inventory.head(3))

print("\n=== EXTERNAL FACTORS ===")
print(f"Shape: {external.shape}")
print(external.head(3))
