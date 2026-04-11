import pandas as pd

_sales     = None
_inventory = None
_external  = None

def get_sales():
    global _sales
    if _sales is None:
        _sales = pd.read_csv('supply_chain_sales_master.csv', parse_dates=['date'])
    return _sales

def get_inventory():
    global _inventory
    if _inventory is None:
        _inventory = pd.read_csv('supply_chain_inventory.csv')
    return _inventory

def get_external():
    global _external
    if _external is None:
        _external = pd.read_csv('supply_chain_external_factors.csv', parse_dates=['date'])
    return _external
