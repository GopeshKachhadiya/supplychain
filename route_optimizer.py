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
        """Greedy nearest-neighbor route starting from start_wh."""
        if start_wh not in self.WAREHOUSES:
            return {"error": f"Invalid start warehouse: {start_wh}"}
            
        valid_stops = [s for s in stops if s in self.WAREHOUSES]
        unvisited = list(valid_stops)
        route = [start_wh]
        current = start_wh
        total_dist = 0

        while unvisited:
            nearest = min(unvisited,
                          key=lambda w: self.haversine(self.WAREHOUSES[current], self.WAREHOUSES[w]))
            dist = self.haversine(self.WAREHOUSES[current], self.WAREHOUSES[nearest])
            total_dist += dist
            route.append(nearest)
            unvisited.remove(nearest)
            current = nearest

        # Return to start
        total_dist += self.haversine(self.WAREHOUSES[current], self.WAREHOUSES[start_wh])
        route.append(start_wh)

        return {
            'route': route,
            'total_distance_km': round(total_dist, 1),
            'estimated_time_hrs': round(total_dist / 60, 1),  # assume 60 km/h avg
            'stops_count': len(route)
        }

def nearest_neighbor_route(start_wh: str, stops: list) -> dict:
    optimizer = RouteOptimizer()
    return optimizer.get_optimal_route(start_wh, stops)

if __name__ == '__main__':
    stops = ['WH_02', 'WH_03', 'WH_04', 'WH_05']
    result = nearest_neighbor_route('WH_01', stops)
    print("Optimized Route:", " → ".join(result['route']))
    print(f"Total Distance : {result['total_distance_km']} km")
    print(f"Estimated Time : {result['estimated_time_hrs']} hours")
