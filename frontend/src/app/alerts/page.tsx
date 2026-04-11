'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  AlertCircle, 
  ShieldAlert, 
  CalendarClock, 
  CheckCircle,
  History,
  MoreVertical
} from 'lucide-react';
import { fetchAlerts } from '@/services/api';
import { cn } from '@/lib/utils';

export default function AlertsView() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    async function init() {
      try {
        const data = await fetchAlerts();
        setAlerts(data.alerts);
      } catch (error) {
        console.error("Failed to fetch alerts", error);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  return (
    <div className="p-8 space-y-8 text-[#2d3339]">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold font-manrope">System Alerts</h2>
          <p className="text-[#596067]">Critical anomaly detection and holiday demand spikes.</p>
        </div>

        <div className="flex bg-[#f2f3f8] p-1 rounded-2xl border border-[#acb3ba]/20">
          <button 
            onClick={() => setActiveTab('active')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all",
              activeTab === 'active' ? "bg-white shadow-sm text-[#7b41b3]" : "text-[#596067]"
            )}
          >
            Active
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all",
              activeTab === 'history' ? "bg-white shadow-sm text-[#7b41b3]" : "text-[#596067]"
            )}
          >
            History
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-20 text-center animate-pulse text-[#596067] font-medium">Monitoring system signals...</div>
        ) : alerts.length === 0 ? (
          <div className="p-20 text-center bg-white rounded-[2rem] border border-[#acb3ba]/10">
            <CheckCircle className="w-12 h-12 text-[#7b41b3] mx-auto mb-4" />
            <h3 className="text-xl font-bold">System Healthy</h3>
            <p className="text-[#596067]">No critical stockouts or demand spikes detected.</p>
          </div>
        ) : (
          alerts.map((alert, idx) => (
            <div 
              key={idx} 
              className="bg-white p-6 rounded-3xl shadow-sm border border-[#acb3ba]/10 flex gap-6 items-start hover:shadow-md transition-shadow group"
            >
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
                alert.severity === 'HIGH' ? "bg-[#ff8b9a]/20 text-[#9e3f4e]" : 
                alert.severity === 'MEDIUM' ? "bg-[#ded5f7] text-[#625b77]" : 
                "bg-[#f0dbff] text-[#7b41b3]"
              )}>
                {alert.type === 'STOCKOUT_RISK' ? <ShieldAlert className="w-7 h-7" /> : <CalendarClock className="w-7 h-7" />}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex justify-between">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    alert.severity === 'HIGH' ? "text-[#9e3f4e]" : "text-[#596067]"
                  )}>
                    {alert.type} • {alert.severity} PRIORITY
                  </span>
                  <span className="text-xs text-[#acb3ba] font-medium">Just Now</span>
                </div>
                <h3 className="text-lg font-bold">{alert.message}</h3>
                <div className="flex gap-4 items-center pt-2">
                   {alert.product_id && (
                     <span className="bg-[#f2f3f8] px-3 py-1 rounded-lg text-xs font-bold text-[#596067]">
                       SKU: {alert.product_id}
                     </span>
                   )}
                   {alert.warehouse_id && (
                     <span className="bg-[#f2f3f8] px-3 py-1 rounded-lg text-xs font-bold text-[#596067]">
                       WH: {alert.warehouse_id}
                     </span>
                   )}
                </div>
              </div>

              <button className="text-[#acb3ba] hover:text-[#2d3339] p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="bg-[#f2f3f8] p-10 rounded-[3rem] text-center border-2 border-dashed border-[#acb3ba]/30">
          <History className="w-10 h-10 text-[#acb3ba] mx-auto mb-4" />
          <p className="text-[#596067] font-medium">System continues to ingest real-time sales and external factor signals.</p>
      </div>
    </div>
  );
}
