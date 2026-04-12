import pandas as pd
import io

_sales     = None
_inventory = None
_external  = None

# Keep original file paths available as defaults
DEFAULT_SALES = 'supply_chain_sales_master.csv'
DEFAULT_INVENTORY = 'supply_chain_inventory.csv'
DEFAULT_EXTERNAL = 'supply_chain_external_factors.csv'

def get_sales():
    global _sales
    if _sales is None:
        try:
            _sales = pd.read_csv(DEFAULT_SALES, parse_dates=['date'])
        except FileNotFoundError:
            try:
                _sales = pd.read_csv('../' + DEFAULT_SALES, parse_dates=['date'])
            except FileNotFoundError:
                _sales = pd.DataFrame()
    return _sales

def get_inventory():
    global _inventory
    if _inventory is None:
        try:
            _inventory = pd.read_csv(DEFAULT_INVENTORY)
        except FileNotFoundError:
            try:
                _inventory = pd.read_csv('../' + DEFAULT_INVENTORY)
            except FileNotFoundError:
                 _inventory = pd.DataFrame()
    return _inventory

def get_external():
    global _external
    if _external is None:
        try:
            _external = pd.read_csv(DEFAULT_EXTERNAL, parse_dates=['date'])
        except FileNotFoundError:
            try:
                _external = pd.read_csv('../' + DEFAULT_EXTERNAL, parse_dates=['date'])
            except FileNotFoundError:
                 _external = pd.DataFrame()
    return _external

def override_dataset(dataset_type: str, file_contents: bytes):
    """
    Allows overwriting in-memory cache with custom uploaded data.
    dataset_type: 'sales', 'inventory', or 'external'
    """
    global _sales, _inventory, _external
    try:
        df = pd.read_csv(io.BytesIO(file_contents))
        if dataset_type == 'sales':
            if 'date' in df.columns:
                df['date'] = pd.to_datetime(df['date'])
            _sales = df
        elif dataset_type == 'inventory':
            _inventory = df
        elif dataset_type == 'external':
            if 'date' in df.columns:
                df['date'] = pd.to_datetime(df['date'])
            _external = df
        return True
    except Exception as e:
        print(f"Error overriding {dataset_type}: {e}")
        return False

def reset_datasets():
    """Resets cache back to None, forcing reload from original files upon next fetch."""
    global _sales, _inventory, _external
    _sales = None
    _inventory = None
    _external = None
    return True
