import pandas as pd

_sales     = None
_inventory = None
_external  = None

def get_sales():
    global _sales
    if _sales is None:
        try:
            _sales = pd.read_csv('supply_chain_sales_master.csv', parse_dates=['date'])
        except FileNotFoundError:
            _sales = pd.read_csv('../supply_chain_sales_master.csv', parse_dates=['date'])
    return _sales

def get_inventory():
    global _inventory
    if _inventory is None:
        try:
            _inventory = pd.read_csv('supply_chain_inventory.csv')
        except FileNotFoundError:
            _inventory = pd.read_csv('../supply_chain_inventory.csv')
    return _inventory

def get_external():
    global _external
    if _external is None:
        try:
            _external = pd.read_csv('supply_chain_external_factors.csv', parse_dates=['date'])
        except FileNotFoundError:
            _external = pd.read_csv('../supply_chain_external_factors.csv', parse_dates=['date'])
    return _external
