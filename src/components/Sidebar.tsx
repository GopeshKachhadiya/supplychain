'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  Package, 
  Bell, 
  Map, 
  LayoutDashboard,
  Settings,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Demand Forecast', href: '/', icon: BarChart3 },
  { label: 'Inventory Status', href: '/inventory', icon: Package },
  { label: 'Alerts', href: '/alerts', icon: Bell },
  { label: 'Route Optimizer', href: '/routing', icon: Map },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-screen w-64 bg-[#f2f3f8] border-r border-[#acb3ba]/20 text-[#2d3339]">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-[#7b41b3] to-[#6f34a5] rounded-lg shadow-md flex items-center justify-center">
            <LayoutDashboard className="text-white w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold tracking-tight font-manrope">AnvayaAI</h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-[#7b41b3] text-white shadow-lg shadow-[#7b41b3]/20" 
                  : "hover:bg-[#ebeef4] text-[#596067]"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5",
                isActive ? "text-white" : "text-[#757b83] group-hover:text-[#7b41b3]"
              )} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-[#acb3ba]/20 space-y-2">
        <button className="flex items-center gap-3 px-4 py-2 w-full text-[#596067] hover:text-[#2d3339] transition-colors">
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
        <button className="flex items-center gap-3 px-4 py-2 w-full text-[#9e3f4e] hover:text-[#4f0116] transition-colors">
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
