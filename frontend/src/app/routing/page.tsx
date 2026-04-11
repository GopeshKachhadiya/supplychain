'use client';

import React, { useState, useEffect } from 'react';
import { 
  Map as MapIcon, 
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
import { fetchWarehouses } from '@/services/api';
import { cn } from '@/lib/utils';

// Mock locations for visualization
const LOCATIONS: any = {
  'WH_01': { name: 'Mumbai Hub', coords: [19.076, 72.877] },
  'WH_02': { name: 'Delhi Terminal', coords: [28.704, 77.102] },
  'WH_03': { name: 'Bangalore Center', coords: [12.971, 77.594] },
  'WH_04': { name: 'Kolkata Depot', coords: [22.572, 88.363] },
  'WH_05': { name: 'Hyderabad Port', coords: [17.385, 78.486] },
};

export default function RouteOptimizer() {
  const [warehouses, setWarehouses] = useState<string[]>([]);
  const [startPoint, setStartPoint] = useState('WH_01');
  const [selectedStops, setSelectedStops] = useState<string[]>(['WH_02', 'WH_03']);
  const [routeResult, setRouteResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function init() {
      const whs = await fetchWarehouses();
      setWarehouses(whs);
    }
    init();
  }, []);

  const handleOptimize = async () => {
    setLoading(true);
    // Mocking the result for UI demonstration consistent with route_optimizer.py logic
    setTimeout(() => {
      setRouteResult({
        route: [startPoint, ...selectedStops, startPoint],
        total_distance: 1450.4,
        est_time: 24.5
      });
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="p-8 space-y-8 text-[#2d3339]">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold font-manrope">Route Optimizer</h2>
        <p className="text-[#596067]">Greedy algorithm for multi-stop delivery sequences.</p>
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
                <div className="space-y-2">
                  {warehouses.filter(w => w !== startPoint).map(wh => (
                    <button
                      key={wh}
                      onClick={() => setSelectedStops(prev => 
                        prev.includes(wh) ? prev.filter(s => s !== wh) : [...prev, wh]
                      )}
                      className={cn(
                        "flex items-center justify-between w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all",
                        selectedStops.includes(wh) 
                          ? "bg-[#f0dbff] border-[#7b41b3] text-[#6e33a5]" 
                          : "bg-white border-[#ebeef4] text-[#596067] hover:border-[#acb3ba]"
                      )}
                    >
                      <span>{wh}</span>
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
               {loading ? <RefreshCcw className="animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
               <span>Optimize Path</span>
             </button>
          </div>
        </div>

        {/* Map Visualization */}
        <div className="lg:col-span-3 space-y-8">
           <div className="bg-white rounded-[2rem] shadow-sm border border-[#acb3ba]/10 h-[500px] relative overflow-hidden flex items-center justify-center bg-[#f2f3f8]">
              {/* This represents a stylized map placeholder */}
              <div className="absolute inset-0 opacity-10 flex items-center justify-center p-20">
                 <MapIcon className="w-full h-full text-[#7b41b3]" />
              </div>
              
              {routeResult ? (
                <div className="z-10 w-full h-full p-20 flex flex-col items-center justify-center relative">
                   {/* Styled route line connection simulation */}
                   <div className="flex gap-12 items-center relative">
                     {routeResult.route.map((node: string, idx: number) => (
                        <React.Fragment key={idx}>
                           <div className="relative group">
                              <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-110",
                                idx === 0 || idx === routeResult.route.length - 1 
                                  ? "bg-[#7b41b3] text-white" 
                                  : "bg-white text-[#7b41b3]"
                              )}>
                                <Box className="w-7 h-7" />
                              </div>
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#2d3339] text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                 {node} {LOCATIONS[node]?.name}
                              </div>
                           </div>
                           {idx < routeResult.route.length - 1 && (
                             <div className="w-32 h-[2px] bg-gradient-to-r from-[#7b41b3] to-[#7b41b3]/30 relative">
                                <Navigation className="absolute top-1/2 -translate-y-1/2 right-0 w-4 h-4 text-[#7b41b3] rotate-90" />
                             </div>
                           )}
                        </React.Fragment>
                     ))}
                   </div>
                   <div className="mt-20 text-center space-y-2">
                      <h3 className="text-2xl font-bold font-manrope">Optimized Dynamic Sequence</h3>
                      <p className="text-[#596067] font-medium uppercase tracking-widest text-xs">Total distance calculated: {routeResult.total_distance} KM</p>
                   </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                   <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                      <RouteIcon className="w-10 h-10 text-[#acb3ba]" />
                   </div>
                   <p className="text-[#596067] font-bold">Select origin and stops to view pathing.</p>
                </div>
              )}
           </div>

           {/* Route Details KPIs */}
           {routeResult && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#acb3ba]/10 flex items-center gap-5">
                  <div className="w-14 h-14 bg-[#f0dbff] rounded-2xl flex items-center justify-center">
                    <Navigation className="text-[#7b41b3] w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-[#596067] text-[10px] font-black uppercase tracking-widest">Calculated Distance</p>
                    <h3 className="text-2xl font-bold">{routeResult.total_distance} KM</h3>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#acb3ba]/10 flex items-center gap-5">
                  <div className="w-14 h-14 bg-[#e1e2eb] rounded-2xl flex items-center justify-center">
                    <Clock className="text-[#5d5f66] w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-[#596067] text-[10px] font-black uppercase tracking-widest">Est. Travel Time</p>
                    <h3 className="text-2xl font-bold">{routeResult.est_time} HRS</h3>
                  </div>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
