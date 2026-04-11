def mock_forecast(days=7):
    import numpy as np, pandas as pd
    dates = pd.date_range('2025-06-01', periods=days)
    base  = np.random.randint(200, 400, days)
    return [{'date': str(d.date()), 'predicted_demand': int(b),
             'lower_bound': int(b*0.85), 'upper_bound': int(b*1.15)}
            for d, b in zip(dates, base)]

def mock_inventory():
    import random
    products = [f'PRD_{str(i).zfill(3)}' for i in range(1, 11)]
    return [{'product_id': p,
             'current_stock': random.randint(10, 500),
             'safety_stock':  random.randint(50, 100),
             'reorder_point': random.randint(80, 150),
             'eoq':           random.randint(200, 800),
             'status':        random.choice(['OK','REORDER','CRITICAL'])}
            for p in products]
