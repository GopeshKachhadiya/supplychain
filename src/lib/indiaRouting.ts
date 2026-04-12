// ─────────────────────────────────────────────────────────────────────────────
// India Highway Routing Engine — A* over real NH road network
// ─────────────────────────────────────────────────────────────────────────────

export type RoutePoint = { name: string; coords: [number, number] };

// Real Indian city coordinates (lat, lon)
const NODES: Record<string, [number, number]> = {
  'Mumbai':         [19.0760, 72.8777],
  'Pune':           [18.5204, 73.8567],
  'Nashik':         [19.9975, 73.7898],
  'Surat':          [21.1702, 72.8311],
  'Vadodara':       [22.3072, 73.1812],
  'Ahmedabad':      [23.0225, 72.5714],
  'Rajkot':         [22.3039, 70.8022],
  'Mundra':         [22.8390, 69.7210],
  'Udaipur':        [24.5854, 73.7125],
  'Ajmer':          [26.4499, 74.6399],
  'Jaipur':         [26.9124, 75.7873],
  'Kota':           [25.2138, 75.8648],
  'Jodhpur':        [26.2389, 73.0243],
  'Delhi':          [28.6139, 77.2090],
  'Agra':           [27.1767, 78.0081],
  'Jhansi':         [25.4484, 78.5685],
  'Bhopal':         [23.2599, 77.4126],
  'Indore':         [22.7196, 75.8577],
  'Dhule':          [20.9042, 74.7794],
  'Nagpur':         [21.1458, 79.0882],
  'Lucknow':        [26.8467, 80.9462],
  'Kanpur':         [26.4499, 80.3319],
  'Patna':          [25.5941, 85.1376],
  'Raipur':         [21.2514, 81.6296],
  'Hyderabad':      [17.3850, 78.4867],
  'Warangal':       [17.9784, 79.5941],
  'Nalgonda':       [17.0521, 79.2671],
  'Kurnool':        [15.8281, 78.0373],
  'Anantapur':      [14.6819, 77.6006],
  'Bengaluru':      [12.9716, 77.5946],
  'Chennai':        [13.0827, 80.2707],
  'Nellore':        [14.4426, 79.9865],
  'Vijayawada':     [16.5062, 80.6480],
  'Visakhapatnam':  [17.6868, 83.2185],
  'Bhubaneswar':    [20.2961, 85.8245],
  'Kolkata':        [22.5726, 88.3639],
  'Solapur':        [17.6599, 75.9064],
};

// Bidirectional NH road graph — distances in km (real road distances)
const EDGES: Record<string, Array<{ to: string; km: number }>> = {
  'Mumbai':        [{ to:'Pune',km:149 },{ to:'Nashik',km:167 },{ to:'Surat',km:263 }],
  'Pune':          [{ to:'Mumbai',km:149 },{ to:'Nashik',km:212 },{ to:'Solapur',km:247 },{ to:'Hyderabad',km:560 }],
  'Nashik':        [{ to:'Mumbai',km:167 },{ to:'Pune',km:212 },{ to:'Dhule',km:112 }],
  'Surat':         [{ to:'Mumbai',km:263 },{ to:'Vadodara',km:130 }],
  'Vadodara':      [{ to:'Surat',km:130 },{ to:'Ahmedabad',km:100 }],
  'Ahmedabad':     [{ to:'Vadodara',km:100 },{ to:'Rajkot',km:216 },{ to:'Udaipur',km:245 },{ to:'Mundra',km:380 }],
  'Rajkot':        [{ to:'Ahmedabad',km:216 },{ to:'Mundra',km:170 }],
  'Mundra':        [{ to:'Rajkot',km:170 },{ to:'Ahmedabad',km:380 }],
  'Udaipur':       [{ to:'Ahmedabad',km:245 },{ to:'Ajmer',km:258 },{ to:'Kota',km:270 }],
  'Ajmer':         [{ to:'Udaipur',km:258 },{ to:'Jaipur',km:131 },{ to:'Jodhpur',km:201 }],
  'Jaipur':        [{ to:'Ajmer',km:131 },{ to:'Delhi',km:262 },{ to:'Kota',km:238 },{ to:'Agra',km:235 }],
  'Kota':          [{ to:'Jaipur',km:238 },{ to:'Udaipur',km:270 },{ to:'Bhopal',km:326 },{ to:'Agra',km:293 }],
  'Jodhpur':       [{ to:'Ajmer',km:201 },{ to:'Jaipur',km:338 }],
  'Delhi':         [{ to:'Jaipur',km:262 },{ to:'Agra',km:200 },{ to:'Lucknow',km:555 }],
  'Agra':          [{ to:'Delhi',km:200 },{ to:'Jhansi',km:233 },{ to:'Lucknow',km:363 },{ to:'Jaipur',km:235 },{ to:'Kanpur',km:293 }],
  'Jhansi':        [{ to:'Agra',km:233 },{ to:'Bhopal',km:307 },{ to:'Lucknow',km:299 }],
  'Bhopal':        [{ to:'Jhansi',km:307 },{ to:'Indore',km:190 },{ to:'Nagpur',km:355 },{ to:'Kota',km:326 }],
  'Indore':        [{ to:'Bhopal',km:190 },{ to:'Dhule',km:235 }],
  'Dhule':         [{ to:'Nashik',km:112 },{ to:'Indore',km:235 }],
  'Nagpur':        [{ to:'Bhopal',km:355 },{ to:'Raipur',km:293 },{ to:'Hyderabad',km:500 },{ to:'Warangal',km:380 }],
  'Lucknow':       [{ to:'Delhi',km:555 },{ to:'Agra',km:363 },{ to:'Kanpur',km:80 },{ to:'Patna',km:542 }],
  'Kanpur':        [{ to:'Lucknow',km:80 },{ to:'Agra',km:293 }],
  'Patna':         [{ to:'Lucknow',km:542 },{ to:'Kolkata',km:600 }],
  'Raipur':        [{ to:'Nagpur',km:293 },{ to:'Kolkata',km:700 },{ to:'Bhubaneswar',km:410 }],
  'Hyderabad':     [{ to:'Nagpur',km:500 },{ to:'Kurnool',km:215 },{ to:'Nalgonda',km:141 },{ to:'Vijayawada',km:274 },{ to:'Warangal',km:155 },{ to:'Pune',km:560 },{ to:'Solapur',km:374 }],
  'Warangal':      [{ to:'Hyderabad',km:155 },{ to:'Nagpur',km:380 },{ to:'Vijayawada',km:195 }],
  'Nalgonda':      [{ to:'Hyderabad',km:141 },{ to:'Vijayawada',km:250 }],
  'Kurnool':       [{ to:'Hyderabad',km:215 },{ to:'Anantapur',km:188 },{ to:'Vijayawada',km:340 }],
  'Anantapur':     [{ to:'Kurnool',km:188 },{ to:'Bengaluru',km:200 }],
  'Bengaluru':     [{ to:'Anantapur',km:200 },{ to:'Chennai',km:346 }],
  'Chennai':       [{ to:'Bengaluru',km:346 },{ to:'Nellore',km:175 }],
  'Nellore':       [{ to:'Chennai',km:175 },{ to:'Vijayawada',km:270 }],
  'Vijayawada':    [{ to:'Nellore',km:270 },{ to:'Hyderabad',km:274 },{ to:'Warangal',km:195 },{ to:'Nalgonda',km:250 },{ to:'Visakhapatnam',km:346 },{ to:'Kurnool',km:340 }],
  'Visakhapatnam': [{ to:'Vijayawada',km:346 },{ to:'Bhubaneswar',km:445 }],
  'Bhubaneswar':   [{ to:'Visakhapatnam',km:445 },{ to:'Kolkata',km:445 },{ to:'Raipur',km:410 }],
  'Kolkata':       [{ to:'Bhubaneswar',km:445 },{ to:'Patna',km:600 },{ to:'Raipur',km:700 }],
  'Solapur':       [{ to:'Pune',km:247 },{ to:'Hyderabad',km:374 }],
};

// Haversine straight-line distance (km) — used as A* heuristic
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * A* shortest-path on the India highway graph.
 * @param start     - city name (key in NODES)
 * @param goal      - city name
 * @param blockNodes - city names that are completely unavailable
 * @param blockEdges - directed edge strings like "Mumbai→Surat" that are blocked
 */
export function aStar(
  start: string,
  goal: string,
  blockNodes: Set<string> = new Set(),
  blockEdges: Set<string> = new Set(),
): { path: string[]; totalKm: number } {
  if (!NODES[start] || !NODES[goal]) return { path: [start, goal], totalKm: 0 };

  const [gLat, gLon] = NODES[goal];
  const h = (c: string) => {
    const n = NODES[c]; return n ? haversineKm(n[0], n[1], gLat, gLon) : 999_999;
  };

  const gScore = new Map<string, number>([[start, 0]]);
  const fScore = new Map<string, number>([[start, h(start)]]);
  const parent = new Map<string, string | null>([[start, null]]);
  const open = new Set<string>([start]);
  const closed = new Set<string>();

  while (open.size > 0) {
    let current = ''; let lowestF = Infinity;
    for (const c of open) { const f = fScore.get(c) ?? Infinity; if (f < lowestF) { lowestF = f; current = c; } }

    if (current === goal) {
      const path: string[] = [];
      let node: string | null = current;
      while (node !== null) { path.unshift(node); node = parent.get(node) ?? null; }
      const totalKm = path.reduce((s, c, i) => {
        if (i === 0) return 0;
        const e = EDGES[path[i - 1]]?.find(x => x.to === c); return s + (e?.km ?? 0);
      }, 0);
      return { path, totalKm };
    }

    open.delete(current); closed.add(current);
    const curG = gScore.get(current) ?? Infinity;

    for (const { to, km } of (EDGES[current] ?? [])) {
      if (closed.has(to)) continue;
      if (blockNodes.has(to) && to !== goal) continue;
      if (blockEdges.has(`${current}→${to}`)) continue;
      const tG = curG + km;
      if (tG < (gScore.get(to) ?? Infinity)) {
        parent.set(to, current); gScore.set(to, tG); fScore.set(to, tG + h(to)); open.add(to);
      }
    }
  }
  return { path: [start, goal], totalKm: 0 };
}

// Convert city name array → RoutePoint[] for the map
export function toRoutePoints(cities: string[]): RoutePoint[] {
  return cities.map(city => ({ name: city, coords: (NODES[city] ?? [22, 78]) as [number, number] }));
}

// ─── Disruption Routing Scenarios ──────────────────────────────────────────
// Each target maps to: primary A*(start→end) + rerouted A*(start→end, with blocks)
// blockEdges format: "CityA→CityB" (one-directional; add both dirs for road block)
type RoutingCfg = {
  pStart: string; pEnd: string;                              // primary route
  rStart?: string; rEnd?: string;                            // rerouted start/end (defaults to primary)
  blockEdges?: string[];                                     // edges blocked during reroute
  blockNodes?: string[];                                     // nodes blocked during reroute
};

export const DISRUPTION_ROUTING: Record<string, RoutingCfg> = {
  // === Warehouse Offline — backup hub takes over ===
  'WH_01 - Mumbai Hub':         { pStart:'Mumbai',    pEnd:'Delhi',     rStart:'Pune',     rEnd:'Delhi' },
  'WH_03 - Bengaluru Center':   { pStart:'Bengaluru', pEnd:'Hyderabad', rStart:'Chennai',  rEnd:'Hyderabad' },
  'WH_05 - Hyderabad Port':     { pStart:'Hyderabad', pEnd:'Chennai',   rStart:'Vijayawada', rEnd:'Chennai' },

  // === Supplier Delay — key segment on supplier lane is delayed ===
  // Supplier Alpha: delayed on Pune→Mumbai → reroute from Pune direct to Delhi
  'Supplier Alpha / PRD_014':   { pStart:'Pune',      pEnd:'Mumbai',    rStart:'Pune', rEnd:'Delhi',
                                  blockEdges:['Pune→Mumbai','Mumbai→Pune'] },
  // Supplier Nova: Ahmedabad→Delhi via Jaipur; Jaipur→Delhi congested → bypass via Kota→Agra
  'Supplier Nova / PRD_021':    { pStart:'Ahmedabad', pEnd:'Delhi',
                                  blockEdges:['Jaipur→Delhi','Delhi→Jaipur'] },
  // Supplier Apex: coastal NH-16 Kolkata→Chennai; block Visakhapatnam→Bhubaneswar coastal hop
  'Supplier Apex / PRD_033':    { pStart:'Kolkata',   pEnd:'Chennai',
                                  blockEdges:['Visakhapatnam→Bhubaneswar','Bhubaneswar→Visakhapatnam'] },

  // === Demand Surge — key stretch overloaded, force detour ===
  // PRD_014: normal = western NH-48 (via Surat→Ahmedabad→Jaipur); surge blocks Ahmedabad→Udaipur
  'PRD_014 - Smart Kettle':     { pStart:'Mumbai',    pEnd:'Delhi',
                                  blockEdges:['Ahmedabad→Udaipur','Udaipur→Ahmedabad','Ajmer→Jaipur','Jaipur→Ajmer'] },
  // PRD_021: Bengaluru→Delhi; Hyderabad→Nagpur direct overloaded → detour via Warangal
  'PRD_021 - Energy Bars':      { pStart:'Bengaluru', pEnd:'Delhi',
                                  blockEdges:['Hyderabad→Nagpur','Nagpur→Hyderabad'] },
  // PRD_033: Chennai→Mumbai; Hyderabad→Pune overloaded → detour via Solapur
  'PRD_033 - Festival Lights':  { pStart:'Chennai',   pEnd:'Mumbai',
                                  blockEdges:['Hyderabad→Pune','Pune→Hyderabad'] },

  // === Weather Block — full corridor closed ===
  // Route MUM-DEL: weather closes NH-48 Gujarat-Rajasthan stretch → central India detour
  'Route MUM-DEL':              { pStart:'Mumbai',    pEnd:'Delhi',
                                  blockEdges:['Ahmedabad→Udaipur','Udaipur→Ahmedabad','Ajmer→Jaipur','Jaipur→Ajmer'] },
  // Route BLR-HYD: NH-44 Kurnool section flooded → coastal via Vijayawada
  'Route BLR-HYD':              { pStart:'Bengaluru', pEnd:'Hyderabad',
                                  blockEdges:['Kurnool→Hyderabad','Hyderabad→Kurnool','Anantapur→Kurnool','Kurnool→Anantapur'] },
  // Route CHN-KOL: cyclone blocks coastal Vizag→Bhubaneswar → inland via Nagpur
  'Route CHN-KOL':              { pStart:'Chennai',   pEnd:'Kolkata',
                                  blockEdges:['Visakhapatnam→Bhubaneswar','Bhubaneswar→Visakhapatnam'] },

  // === Port Strike ===
  // Nhava Sheva: coastal NH blocked → central India
  'Nhava Sheva Port':           { pStart:'Mumbai',    pEnd:'Delhi',
                                  blockEdges:['Mumbai→Surat','Surat→Mumbai'] },
  // Chennai Port: coastal Nellore road blocked → Bengaluru route
  'Chennai Port':               { pStart:'Chennai',   pEnd:'Hyderabad',
                                  blockEdges:['Chennai→Nellore','Nellore→Chennai'] },
  // Mundra Port: Rajkot interchange blocked → direct to Ahmedabad
  'Mundra Port':                { pStart:'Mundra',    pEnd:'Delhi',
                                  blockEdges:['Rajkot→Ahmedabad','Ahmedabad→Rajkot'] },
};

/**
 * Compute both primary and rerouted RoutePoint[] for a given disruption target.
 * Primary = A* on the full graph (optimal route).
 * Rerouted = A* with the disruption's blocked edges/nodes applied.
 */
export function computeDisruptionRoutes(target: string): {
  primaryRoute: RoutePoint[];
  reroutedRoute: RoutePoint[];
  primaryKm: number;
  reroutedKm: number;
} {
  const cfg = DISRUPTION_ROUTING[target] ?? DISRUPTION_ROUTING['WH_01 - Mumbai Hub'];

  const primary = aStar(cfg.pStart, cfg.pEnd);
  const blockE = new Set(cfg.blockEdges ?? []);
  const blockN = new Set(cfg.blockNodes ?? []);
  const rStart = cfg.rStart ?? cfg.pStart;
  const rEnd   = cfg.rEnd   ?? cfg.pEnd;
  const rerouted = aStar(rStart, rEnd, blockN, blockE);

  return {
    primaryRoute:  toRoutePoints(primary.path),
    reroutedRoute: toRoutePoints(rerouted.path),
    primaryKm:     primary.totalKm,
    reroutedKm:    rerouted.totalKm,
  };
}
