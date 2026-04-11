import numpy as np
import os
import json
import requests
import time
from geopy.geocoders import Nominatim
import heapq
import itertools

class RouteOptimizer:
    # Textual Queries to dynamically localize locations reliably.
    WAREHOUSE_QUERIES = {
        'WH_01': 'Mumbai, Maharashtra, India',
        'WH_02': 'New Delhi, Delhi, India',
        'WH_03': 'Bangalore, Karnataka, India',
        'WH_04': 'Kolkata, West Bengal, India',
        'WH_05': 'Hyderabad, Telangana, India',
        'WH_06': 'Chennai, Tamil Nadu, India',
        'WH_07': 'Ahmedabad, Gujarat, India',
        'WH_08': 'Pune, Maharashtra, India',
        'WH_09': 'Surat, Gujarat, India',
        'WH_10': 'Jaipur, Rajasthan, India',
        'GN_01': 'Infocity, Gandhinagar, Gujarat, India',
        'GN_02': 'Sector 11, Gandhinagar, Gujarat, India',
        'GN_03': 'Sector 21, Gandhinagar, Gujarat, India',
    }

    def __init__(self):
        self.WAREHOUSES = self.load_or_geocode()

    def load_or_geocode(self):
        cache_file = os.path.join(os.path.dirname(__file__), 'geo_cache.json')
        if os.path.exists(cache_file):
            try:
                with open(cache_file, 'r') as f:
                    coords = json.load(f)
                    if all(k in coords for k in self.WAREHOUSE_QUERIES):
                        return {k: (v[0], v[1]) for k, v in coords.items()}
            except:
                pass

        geolocator = Nominatim(user_agent="anvaya_supply_routing")
        coords = {}
        for wh_id, query in self.WAREHOUSE_QUERIES.items():
            try:
                location = geolocator.geocode(query)
                if location:
                    coords[wh_id] = (location.latitude, location.longitude)
                else:
                    coords[wh_id] = (20.0, 77.0)
                time.sleep(0.5)
            except:
                coords[wh_id] = (20.0, 77.0)

        with open(cache_file, 'w') as f:
            json.dump(coords, f)
        
        return coords

    def haversine(self, loc1, loc2):
        """Fallback Haversine Distance"""
        R = 6371
        lat1, lon1 = np.radians(loc1)
        lat2, lon2 = np.radians(loc2)
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = np.sin(dlat/2)**2 + np.cos(lat1)*np.cos(lat2)*np.sin(dlon/2)**2
        return R * 2 * np.arcsin(np.sqrt(a))
        
    def get_distance_matrix(self, nodes):
        """Fetches OSRM True Road distance matrix for perfect routing."""
        node_list = list(nodes)
        coords = ";".join([f"{self.WAREHOUSES[n][1]},{self.WAREHOUSES[n][0]}" for n in node_list])
        url = f"http://router.project-osrm.org/table/v1/driving/{coords}?annotations=distance"
        try:
            req = requests.get(url, timeout=10)
            data = req.json()
            if data["code"] == "Ok":
                distances = data["distances"]
                matrix = {u: {} for u in node_list}
                for i, u in enumerate(node_list):
                    for j, v in enumerate(node_list):
                        matrix[u][v] = distances[i][j] / 1000.0  # meters to km
                return matrix
        except:
            pass
        return None

    def mst_cost(self, nodes, matrix=None):
        if not nodes:
            return 0
        nodes_list = list(nodes)
        if len(nodes_list) == 1:
            return 0
        
        in_mst = {nodes_list[0]}
        n = len(nodes_list)
        mst_weight = 0
        
        while len(in_mst) < n:
            min_dist = float('inf')
            best_node = None
            for u in in_mst:
                for v in nodes_list:
                    if v not in in_mst:
                        d = matrix[u][v] if matrix else self.haversine(self.WAREHOUSES[u], self.WAREHOUSES[v])
                        if d < min_dist:
                            min_dist = d
                            best_node = v
            in_mst.add(best_node)
            mst_weight += min_dist
            
        return mst_weight

    def get_optimal_route(self, start_wh: str, stops: list) -> dict:
        """A* Algorithm using exact road network maps."""
        if start_wh not in self.WAREHOUSES:
            return {"error": f"Invalid start warehouse: {start_wh}"}
            
        valid_stops = set([s for s in stops if s in self.WAREHOUSES])
        if start_wh in valid_stops:
            valid_stops.remove(start_wh)
            
        all_nodes = list(valid_stops) + [start_wh]
        dist_matrix = self.get_distance_matrix(all_nodes)
        
        def get_cost(u, v):
            if dist_matrix and u in dist_matrix and v in dist_matrix[u]:
                return dist_matrix[u][v]
            return self.haversine(self.WAREHOUSES[u], self.WAREHOUSES[v])
            
        initial_unvisited = frozenset(valid_stops)
        counter = itertools.count()
        pq = [(0, 0, next(counter), start_wh, initial_unvisited, [start_wh])]
        visited_states = {}
        
        while pq:
            f, g, _, current, unvisited, path = heapq.heappop(pq)
            state = (current, unvisited)
            
            if state in visited_states and visited_states[state] <= g:
                continue
            visited_states[state] = g
            
            if not unvisited:
                final_g = g + get_cost(current, start_wh)
                return {
                    'route': path + [start_wh],
                    'total_distance_km': round(final_g, 1),
                    'estimated_time_hrs': round(final_g / 60, 1),
                    'stops_count': len(path) + 1
                }
                
            for next_wh in unvisited:
                new_unvisited = unvisited - frozenset([next_wh])
                step_cost = get_cost(current, next_wh)
                new_g = g + step_cost
                
                if not new_unvisited:
                    h = get_cost(next_wh, start_wh)
                else:
                    min_leave = min(get_cost(next_wh, u) for u in new_unvisited)
                    min_return = min(get_cost(u, start_wh) for u in new_unvisited)
                    mst_val = self.mst_cost(new_unvisited, dist_matrix)
                    h = min_leave + mst_val + min_return
                    
                heapq.heappush(pq, (new_g + h, new_g, next(counter), next_wh, new_unvisited, path + [next_wh]))
                
        return {"error": "No valid route found."}

def a_star_route(start_wh: str, stops: list) -> dict:
    optimizer = RouteOptimizer()
    return optimizer.get_optimal_route(start_wh, stops)

if __name__ == '__main__':
    stops = ['GN_01', 'GN_02', 'GN_03', 'WH_07']
    result = a_star_route('WH_01', stops)
    print("Optimized Route:", " -> ".join(result['route']))
    print(f"Total Distance : {result['total_distance_km']} km")

