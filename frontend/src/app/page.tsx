'use client';

import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  TrendingUp, 
  Target, 
  Box, 
  Calendar, 
  Filter,
  ChevronDown
} from 'lucide-react';
import { fetchProducts, fetchWarehouses, fetchForecast } from '@/services/api';
import { cn } from '@/lib/utils';

export default function DemandForecast() {
  const [products, setProducts] = useState<string[]>([]);
  const [warehouses, setWarehouses] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('PRD_001');
  const [selectedWarehouse, setSelectedWarehouse] = useState('WH_01');
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const [prods, whs] = await Promise.all([fetchProducts(), fetchWarehouses()]);
        setProducts(prods);
        setWarehouses(whs);
        const data = await fetchForecast('PRD_001', 'WH_01');
        setForecastData(data);
      } catch (error) {
        console.error("Failed to fetch initial data", error);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const data = await fetchForecast(selectedProduct, selectedWarehouse);
      setForecastData(data);
    } catch (error) {
      console.error("Update failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold font-manrope text-[#2d3339]">Demand Forecast</h2>
          <p className="text-[#596067]">Predict future demand with AI-driven confidence bands.</p>
        </div>

        <div className="flex gap-4 items-center bg-white p-2 rounded-2xl shadow-sm border border-[#acb3ba]/20">
          <div className="relative">
            <select 
              value={selectedWarehouse} 
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="appearance-none bg-[#f2f3f8] px-4 py-2 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7b41b3]/50 text-sm font-medium"
            >
              {warehouses.map(wh => <option key={wh} value={wh}>{wh}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#757b83]" />
          </div>

          <div className="relative">
            <select 
              value={selectedProduct} 
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="appearance-none bg-[#f2f3f8] px-4 py-2 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7b41b3]/50 text-sm font-medium"
            >
              {products.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#757b83]" />
          </div>

          <button 
            onClick={handleUpdate}
            disabled={loading}
            className="bg-[#7b41b3] text-white px-6 py-2 rounded-xl font-medium hover:bg-[#6f34a5] transition-colors shadow-md disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Generate'}
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#acb3ba]/10 flex items-center gap-5">
          <div className="w-14 h-14 bg-[#f0dbff] rounded-2xl flex items-center justify-center">
            <Target className="text-[#7b41b3] w-7 h-7" />
          </div>
          <div>
             <p className="text-[#596067] text-sm font-medium uppercase tracking-wider">Accuracy (MAPE)</p>
             <h3 className="text-2xl font-bold text-[#2d3339]">94.2%</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#acb3ba]/10 flex items-center gap-5">
          <div className="w-14 h-14 bg-[#e1e2eb] rounded-2xl flex items-center justify-center">
            <TrendingUp className="text-[#5d5f66] w-7 h-7" />
          </div>
          <div>
             <p className="text-[#596067] text-sm font-medium uppercase tracking-wider">Predicted Vol</p>
             <h3 className="text-2xl font-bold text-[#2d3339]">
               {forecastData.reduce((acc, curr) => acc + curr.predicted_demand, 0)} Units
             </h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#acb3ba]/10 flex items-center gap-5">
          <div className="w-14 h-14 bg-[#ded5f7] rounded-2xl flex items-center justify-center">
            <Calendar className="text-[#625b77] w-7 h-7" />
          </div>
          <div>
             <p className="text-[#596067] text-sm font-medium uppercase tracking-wider">Forecast Horizon</p>
             <h3 className="text-2xl font-bold text-[#2d3339]">7 Days</h3>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-[#acb3ba]/10">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-bold text-[#2d3339]">Demand Prediction & Confidence Intervals</h3>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 bg-[#7b41b3] rounded-full"></div>
               <span className="text-sm text-[#596067]">Forecast</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 bg-[#7b41b3]/20 rounded-full"></div>
               <span className="text-sm text-[#596067]">95% CI</span>
             </div>
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastData}>
              <defs>
                <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7b41b3" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#7b41b3" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ebeef4" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#757b83', fontSize: 12}}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#757b83', fontSize: 12}}
                dx={-10}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderRadius: '16px', 
                  border: '1px solid #ebeef4',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="upper_bound" 
                stroke="none" 
                fill="#7b41b3" 
                fillOpacity={0.1} 
              />
              <Area 
                type="monotone" 
                dataKey="lower_bound" 
                stroke="none" 
                fill="#7b41b3" 
                fillOpacity={0.1} 
              />
              <Area 
                type="monotone" 
                dataKey="predicted_demand" 
                stroke="#7b41b3" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorDemand)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white overflow-hidden rounded-[2rem] shadow-sm border border-[#acb3ba]/10">
        <div className="px-8 py-6 border-b border-[#ebeef4]">
          <h3 className="text-xl font-bold text-[#2d3339]">Detailed Daily Forecast</h3>
        </div>
        <table className="w-full text-left">
          <thead className="bg-[#f2f3f8]">
            <tr>
              <th className="px-8 py-4 text-sm font-semibold text-[#596067]">Date</th>
              <th className="px-8 py-4 text-sm font-semibold text-[#596067]">Predicted Demand</th>
              <th className="px-8 py-4 text-sm font-semibold text-[#596067]">Range (L - H)</th>
              <th className="px-8 py-4 text-sm font-semibold text-[#596067]">Weather</th>
              <th className="px-8 py-4 text-sm font-semibold text-[#596067]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ebeef4]">
            {forecastData.map((row, idx) => (
              <tr key={idx} className="hover:bg-[#f9f9fc] transition-colors">
                <td className="px-8 py-4 font-medium">{row.date}</td>
                <td className="px-8 py-4 text-[#7b41b3] font-bold">{row.predicted_demand}</td>
                <td className="px-8 py-4 text-[#596067]">{row.lower_bound} - {row.upper_bound}</td>
                <td className="px-8 py-4">
                  <span className="px-3 py-1 bg-[#e1e2eb] rounded-full text-xs font-bold text-[#51535a]">
                    {row.weather}
                  </span>
                </td>
                <td className="px-8 py-4">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      row.is_holiday ? "bg-[#9e3f4e]" : "bg-[#7b41b3]"
                    )}></div>
                    <span className="text-sm font-medium">{row.is_holiday ? 'Holiday Peak' : 'Normal'}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
