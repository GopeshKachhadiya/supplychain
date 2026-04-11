import numpy as np
import random

class RouteOptimizer:
    # Simulated warehouse locations (major Indian cities)
    WAREHOUSES = {
        'WH_01': (19.0760, 72.8777),   # Mumbai
        'WH_02': (28.7041, 77.1025),   # Delhi
        'WH_03': (12.9716, 77.5946),   # Bangalore
        'WH_04': (22.5726, 88.3639),   # Kolkata
        'WH_05': (17.3850, 78.4867),   # Hyderabad
        'WH_06': (13.0827, 80.2707),   # Chennai
        'WH_07': (23.0225, 72.5714),   # Ahmedabad
        'WH_08': (18.5204, 73.8567),   # Pune
        'WH_09': (21.1702, 72.8311),   # Surat
        'WH_10': (26.9124, 75.7873),   # Jaipur
    }

    def haversine(self, loc1, loc2):
        """Distance in km between two lat/lon points."""
        R = 6371
        lat1, lon1 = np.radians(loc1)
        lat2, lon2 = np.radians(loc2)
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = np.sin(dlat/2)**2 + np.cos(lat1)*np.cos(lat2)*np.sin(dlon/2)**2
        return R * 2 * np.arcsin(np.sqrt(a))

    def get_optimal_route(self, start_wh: str, stops: list) -> dict:
        """A* Algorithm to find the exact shortest path visiting all stops."""
        import heapq
        
        if start_wh not in self.WAREHOUSES:
            return {"error": f"Invalid start warehouse: {start_wh}"}
            
        valid_stops = set([s for s in stops if s in self.WAREHOUSES])
        if start_wh in valid_stops:
            valid_stops.remove(start_wh)
            
        initial_unvisited = frozenset(valid_stops)
        
        # Priority Queue: (f_score, g_score, current_wh, unvisited_set, path)
        pq = [(0, 0, start_wh, initial_unvisited, [start_wh])]
        
        # Track the minimum g_score for each state to prune worse paths
        visited_states = {}
        
        while pq:
            f, g, current, unvisited, path = heapq.heappop(pq)
            
            state = (current, unvisited)
            if state in visited_states and visited_states[state] <= g:
                continue
            visited_states[state] = g
            
            # Goal Check: All stops visited
            if not unvisited:
                # Add distance to return to start warehouse
                final_g = g + self.haversine(self.WAREHOUSES[current], self.WAREHOUSES[start_wh])
                final_path = path + [start_wh]
                return {
                    'route': final_path,
                    'total_distance_km': round(final_g, 1),
                    'estimated_time_hrs': round(final_g / 60, 1),
                    'stops_count': len(final_path)
                }
                
            # Expand next possible stops
            for next_wh in unvisited:
                new_unvisited = unvisited - frozenset([next_wh])
                step_cost = self.haversine(self.WAREHOUSES[current], self.WAREHOUSES[next_wh])
                new_g = g + step_cost
                
                # Admissible Heuristic (h): 
                if not new_unvisited:
                    # If it's the last stop, h brings it directly back to start
                    h = self.haversine(self.WAREHOUSES[next_wh], self.WAREHOUSES[start_wh])
                else:
                    # Minimum distance away + minimum distance back to start
                    min_leave = min(self.haversine(self.WAREHOUSES[next_wh], self.WAREHOUSES[u]) for u in new_unvisited)
                    min_return = min(self.haversine(self.WAREHOUSES[u], self.WAREHOUSES[start_wh]) for u in new_unvisited)
                    h = min_leave + min_return
                    
                new_f = new_g + h
                
                heapq.heappush(pq, (new_f, new_g, next_wh, new_unvisited, path + [next_wh]))
                
        return {"error": "No valid route found."}

def a_star_route(start_wh: str, stops: list) -> dict:
    optimizer = RouteOptimizer()
    return optimizer.get_optimal_route(start_wh, stops)

if __name__ == '__main__':
    stops = ['WH_02', 'WH_03', 'WH_04', 'WH_05']
    result = a_star_route('WH_01', stops)
    print("Optimized Route:", " → ".join(result['route']))
    print(f"Total Distance : {result['total_distance_km']} km")
    print(f"Estimated Time : {result['estimated_time_hrs']} hours")
