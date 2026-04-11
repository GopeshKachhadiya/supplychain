'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { 
  Navigation, 
  Clock, 
  Route as RouteIcon,
  ChevronDown,
  Plus,
  Play,
  CheckCircle,
  RefreshCcw,
  Box
} from 'lucide-react';
import { fetchWarehouses, fetchRoute } from '@/services/api';
import { cn } from '@/lib/utils';
import axios from 'axios';

// Dynamically import Map to avoid SSR errors with Leaflet
const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-[#f2f3f8]">Loading Map...</div>
});



export default function RouteOptimizer() {
  const [warehouses, setWarehouses] = useState<string[]>([]);
  const [LOCATIONS, setLocations] = useState<any>({});
  const [startPoint, setStartPoint] = useState('WH_01');
  const [selectedStops, setSelectedStops] = useState<string[]>(['WH_02', 'WH_03']);
  const [routeResult, setRouteResult] = useState<any>(null);
  const [roadCoords, setRoadCoords] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function init() {
      const data = await fetchWarehouses();
      const whList = [];
      const locMap: any = {};
      for (const w of data) {
         whList.push(w.id);
         locMap[w.id] = { name: w.name, coords: [w.lat, w.lon] };
      }
      setWarehouses(whList);
      setLocations(locMap);
    }
    init();
  }, []);

  const getRoadGeometry = async (path: string[]) => {
    const allRoadCoords: [number, number][] = [];
    for (let i = 0; i < path.length - 1; i++) {
        const c1 = LOCATIONS[path[i]].coords;
        const c2 = LOCATIONS[path[i+1]].coords;
        try {
            const res = await axios.get(`https://router.project-osrm.org/route/v1/driving/${c1[1]},${c1[0]};${c2[1]},${c2[0]}?overview=full&geometries=geojson`);
            const coords = res.data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
            allRoadCoords.push(...coords);
        } catch (e) {
            allRoadCoords.push([c1[0], c1[1]], [c2[0], c2[1]]);
        }
    }
    return allRoadCoords;
  };

  const handleOptimize = async () => {
    setLoading(true);
    setRouteResult(null);
    setRoadCoords([]);
    
    try {
        const res = await fetchRoute(startPoint, selectedStops);
        const road = await getRoadGeometry(res.route);
        setRouteResult(res);
        setRoadCoords(road);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const pathCoords = useMemo(() => {
    if (!routeResult) return [];
    return routeResult.route.map((wh: string) => LOCATIONS[wh].coords);
  }, [routeResult]);

  return (
    <div className="p-8 space-y-8 text-[#2d3339]">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold font-manrope">A* Route Optimizer</h2>
        <p className="text-[#596067]">Calculating mathematical shortest paths with real industrial road mapping.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Config */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#acb3ba]/10 space-y-6">
             <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#596067]">Origin Hub</label>
                <div className="relative">
                  <select 
                    value={startPoint} 
                    onChange={(e) => setStartPoint(e.target.value)}
                    className="w-full appearance-none bg-[#f2f3f8] px-4 py-3 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7b41b3]/50 text-sm font-bold"
                  >
                    {warehouses.map(wh => <option key={wh} value={wh}>{wh} - {LOCATIONS[wh]?.name || 'Warehouse'}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#757b83]" />
                </div>
             </div>

             <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-[#596067]">Delivery Stops</label>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {warehouses.filter(w => w !== startPoint).map(wh => (
                    <button
                      key={wh}
                      onClick={() => setSelectedStops(prev => 
                        prev.includes(wh) ? prev.filter(s => s !== wh) : [...prev, wh]
                      )}
                      className={cn(
                        "flex items-center justify-between w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all mb-2",
                        selectedStops.includes(wh) 
                          ? "bg-[#f0dbff] border-[#7b41b3] text-[#6e33a5]" 
                          : "bg-white border-[#ebeef4] text-[#596067] hover:border-[#acb3ba]"
                      )}
                    >
                      <div className="text-left">
                        <div className="font-bold">{wh}</div>
                        <div className="text-[10px] opacity-70">{LOCATIONS[wh]?.name}</div>
                      </div>
                      {selectedStops.includes(wh) ? <CheckCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
             </div>

             <button 
               onClick={handleOptimize}
               disabled={loading || selectedStops.length === 0}
               className="w-full bg-[#7b41b3] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#6f34a5] transition-all shadow-lg shadow-[#7b41b3]/20 disabled:opacity-50"
             >
               {loading ? <RefreshCcw className="animate-spin w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
               <span>{loading ? 'Calculating...' : 'Optimize Path'}</span>
             </button>
          </div>
        </div>

        {/* Map Visualization */}
        <div className="lg:col-span-3 space-y-8">
           <div className="bg-white rounded-[2rem] shadow-sm border border-[#acb3ba]/10 h-[500px] relative overflow-hidden bg-[#f2f3f8]">
              <Map 
                pathCoords={pathCoords} 
                roadCoords={roadCoords} 
                warehouses={LOCATIONS}
                route={routeResult?.route || []}
              />
           </div>

           {/* Route Details KPIs */}
           {routeResult && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#acb3ba]/10 flex items-center gap-5">
                   <div className="w-14 h-14 bg-[#f0dbff] rounded-2xl flex items-center justify-center">
                    <Navigation className="text-[#7b41b3] w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-[#596067] text-[10px] font-black uppercase tracking-widest">A* Optimized Distance</p>
                    <h3 className="text-2xl font-bold">{routeResult.total_distance_km} KM</h3>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#acb3ba]/10 flex items-center gap-5">
                  <div className="w-14 h-14 bg-[#e1e2eb] rounded-2xl flex items-center justify-center">
                    <Clock className="text-[#5d5f66] w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-[#596067] text-[10px] font-black uppercase tracking-widest">Est. Travel Time</p>
                    <h3 className="text-2xl font-bold">{routeResult.estimated_time_hrs} HRS</h3>
                  </div>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
