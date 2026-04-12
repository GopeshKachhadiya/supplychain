'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  AlertTriangle, 
  CheckCircle2, 
  PackageSearch, 
  RefreshCcw,
  ChevronDown
} from 'lucide-react';
import { fetchInventoryStatus, fetchWarehouses } from '@/services/api';
import { cn } from '@/lib/utils';

export default function InventoryStatus() {
  const [warehouses, setWarehouses] = useState<string[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('WH_01');
  const [inventory, setInventory] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total_products: 0, alerts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const whs = await fetchWarehouses();
        setWarehouses(whs);
        const data = await fetchInventoryStatus('WH_01');
        setInventory(data.inventory);
        setSummary({ total_products: data.total_products, alerts: data.alerts });
      } catch (error) {
        console.error("Failed to fetch inventory", error);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleUpdate = async (wh: string) => {
    setSelectedWarehouse(wh);
    setLoading(true);
    try {
      const data = await fetchInventoryStatus(wh);
      setInventory(data.inventory);
      setSummary({ total_products: data.total_products, alerts: data.alerts });
    } catch (error) {
      console.error("Update failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 text-[#2d3339]">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold font-manrope">Inventory Status</h2>
          <p className="text-[#596067]">Real-time stock monitoring and EOQ optimization.</p>
        </div>

        <div className="flex gap-4 items-center bg-white p-2 rounded-2xl shadow-sm border border-[#acb3ba]/20">
          <div className="relative">
            <select 
              value={selectedWarehouse} 
              onChange={(e) => handleUpdate(e.target.value)}
              className="appearance-none bg-[#f2f3f8] px-4 py-2 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7b41b3]/50 text-sm font-medium"
            >
              {warehouses.map(wh => <option key={wh} value={wh}>{wh}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#757b83]" />
          </div>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#acb3ba]/10 flex items-center gap-5">
          <div className="w-14 h-14 bg-[#ebeef4] rounded-2xl flex items-center justify-center">
            <PackageSearch className="text-[#5d5f66] w-7 h-7" />
          </div>
          <div>
             <p className="text-[#596067] text-sm font-medium uppercase tracking-wider">Total SKUs</p>
             <h3 className="text-2xl font-bold">{summary.total_products}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#acb3ba]/10 flex items-center gap-5">
          <div className="w-14 h-14 bg-[#ff8b9a]/20 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="text-[#9e3f4e] w-7 h-7" />
          </div>
          <div>
             <p className="text-[#596067] text-sm font-medium uppercase tracking-wider">Alerts (Critical/Reorder)</p>
             <h3 className="text-2xl font-bold text-[#9e3f4e]">{summary.alerts}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#acb3ba]/10 flex items-center gap-5">
          <div className="w-14 h-14 bg-[#f0dbff] rounded-2xl flex items-center justify-center">
            <RefreshCcw className="text-[#7b41b3] w-7 h-7" />
          </div>
          <div>
             <p className="text-[#596067] text-sm font-medium uppercase tracking-wider">Reorder Optimization</p>
             <h3 className="text-2xl font-bold">Active</h3>
          </div>
        </div>
      </div>

      {/* Table & Chart Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white overflow-hidden rounded-[2rem] shadow-sm border border-[#acb3ba]/10">
          <div className="px-8 py-6 border-b border-[#ebeef4] bg-white">
            <h3 className="text-xl font-bold">Stock Levels & Replenishment Info</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#f2f3f8]">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-[#596067]">Product</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-[#596067]">Stock</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-[#596067]">Safety</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-[#596067]">Reorder @</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-[#596067]">EOQ</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-[#596067]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebeef4]">
                {inventory.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#f9f9fc] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-sm">{row.product_id}</div>
                      <div className="text-xs text-[#596067]">{row.category}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold">{row.current_stock}</td>
                    <td className="px-6 py-4 text-[#757b83]">{row.safety_stock}</td>
                    <td className="px-6 py-4 text-[#757b83] font-medium">{row.reorder_point}</td>
                    <td className="px-6 py-4 text-[#7b41b3] font-bold">{row.eoq}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        row.status === 'OK' ? "bg-[#f0dbff] text-[#6e33a5]" : 
                        row.status === 'REORDER' ? "bg-[#e1e2eb] text-[#505159]" : 
                        "bg-[#ff8b9a] text-[#782232]"
                      )}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-[#acb3ba]/10 space-y-8">
          <h3 className="text-xl font-bold">Optimal Order qty (EOQ)</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventory.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ebeef4" />
                <XAxis dataKey="product_id" hide />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#757b83', fontSize: 10}} />
                <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="eoq" radius={[6, 6, 0, 0]}>
                  {inventory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.eoq > 500 ? '#7b41b3' : '#acb3ba'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-[#f2f3f8] p-5 rounded-2xl">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#596067] mb-2">Optimization Insight</h4>
            <p className="text-xs leading-relaxed text-[#2d3339]">
              EOQ balancing minimizes holding vs ordering costs. Currently, **{inventory.filter(i => i.status !== 'OK').length} items** deviate from optimal safety stock levels.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
