import pandas as pd
import numpy as np
from scipy import stats

class InventoryOptimizer:
    """
    Uses supply_chain_inventory.csv for lead times and holding costs.
    Uses supply_chain_sales_master.csv for demand statistics.
    """
    def __init__(self):
        self.sales     = pd.read_csv('supply_chain_sales_master.csv', parse_dates=['date'])
        self.inventory = pd.read_csv('supply_chain_inventory.csv')
        try:
            self.external  = pd.read_csv('supply_chain_external_factors.csv', parse_dates=['date'])
        except:
            self.external = None

    def compute_eoq(self, annual_demand, order_cost, holding_cost_per_unit):
        return np.sqrt((2 * annual_demand * order_cost) / holding_cost_per_unit)

    def compute_safety_stock(self, avg_daily_demand, std_daily_demand,
                              lead_time_days, service_level=0.95):
        z = stats.norm.ppf(service_level)
        return int(np.ceil(z * std_daily_demand * np.sqrt(lead_time_days)))

    def optimize_all(self, warehouse_id: str = None) -> pd.DataFrame:
        """Run optimization for all product-warehouse combos (or one warehouse)."""
        sales = self.sales
        if warehouse_id:
            sales = sales[sales['warehouse_id'] == warehouse_id]

        results = []
        for (wh, prod), grp in sales.groupby(['warehouse_id', 'product_id']):
            inv_row = self.inventory[self.inventory['product_id'] == prod]
            if inv_row.empty:
                continue

            lead_time    = int(inv_row['supplier_lead_time_days'].values[0])
            holding_cost = float(inv_row['holding_cost'].values[0])
            category     = inv_row['category'].values[0]

            avg_d        = grp['units_sold'].mean()
            std_d        = grp['units_sold'].std()
            annual_demand = avg_d * 365

            eoq  = self.compute_eoq(annual_demand, order_cost=500,
                                    holding_cost_per_unit=holding_cost)
            ss   = self.compute_safety_stock(avg_d, std_d, lead_time)
            rop  = int(avg_d * lead_time) + ss

            results.append({
                'warehouse_id':      wh,
                'product_id':        prod,
                'category':          category,
                'avg_daily_demand':  round(avg_d, 1),
                'std_demand':        round(std_d, 1),
                'EOQ':               int(eoq),
                'safety_stock':      ss,
                'reorder_point':     rop,
                'lead_time_days':    lead_time,
                'holding_cost':      holding_cost,
            })

        return pd.DataFrame(results)

    def holiday_adjustment(self, base_eoq: int, holiday_factor: float = 1.4) -> int:
        """Boost order quantity before holidays (from external_factors.csv)."""
        return int(base_eoq * holiday_factor)

    def get_inventory_status_api(self, warehouse_id: str) -> dict:
        """
        API-compatible method for Member 2's inventory router.
        Now includes 'Smart' features: detects upcoming holidays.
        """
        df = self.optimize_all(warehouse_id)
        if df.empty:
            return {"warehouse_id": warehouse_id, "total_products": 0, "alerts": 0, "inventory": []}
            
        sales_wh = self.sales[self.sales['warehouse_id'] == warehouse_id]
        
        # Smart Check: Is there a holiday in the next 7 days?
        upcoming_holiday = False
        if self.external is not None:
            max_date = self.sales['date'].max()
            future_7 = self.external[(self.external['date'] > max_date) & 
                                     (self.external['date'] <= max_date + pd.Timedelta(days=7))]
            upcoming_holiday = any(future_7['is_holiday'] == 1)

        results = []
        for idx, row in df.iterrows():
            prod_id = row['product_id']
            # Simulate current stock
            recent_sales = sales_wh[sales_wh['product_id'] == prod_id]
            current_stock = int(recent_sales['units_sold'].tail(3).mean() * 5) if not recent_sales.empty else 0
            
            ss = row['safety_stock']
            rop = row['reorder_point']
            eoq = row['EOQ']
            
            # Smart Adjustment: If holiday upcoming, boost EOQ
            if upcoming_holiday:
                eoq = self.holiday_adjustment(eoq)
            
            status = "CRITICAL" if current_stock < ss \
                else "PRE_HOLIDAY_STOCKING" if upcoming_holiday and current_stock < (rop * 1.2) \
                else "REORDER" if current_stock < rop \
                else "OK"
                
            results.append({
                "product_id":     prod_id,
                "category":       row['category'],
                "current_stock":  current_stock,
                "safety_stock":   ss,
                "reorder_point":  rop,
                "eoq":            eoq,
                "lead_time_days": row['lead_time_days'],
                "status":         status,
                "smart_alert":    "Upcoming Holiday Spike Detected" if upcoming_holiday else None
            })
            
        alerts_count = sum(1 for r in results if r['status'] in ['CRITICAL', 'REORDER', 'PRE_HOLIDAY_STOCKING'])
        
        return {
            "warehouse_id": warehouse_id,
            "total_products": len(results),
            "alerts": alerts_count,
            "upcoming_holiday": upcoming_holiday,
            "inventory": results
        }

if __name__ == '__main__':
    opt = InventoryOptimizer()
    result_df = opt.optimize_all(warehouse_id='WH_01')
    print(result_df.head(10).to_string())
    result_df.to_csv('inventory_optimization_results.csv', index=False)
    print("Saved -> inventory_optimization_results.csv")
