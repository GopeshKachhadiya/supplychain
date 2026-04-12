'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  CloudRain, Sun, Cloud, Wind, Zap, Thermometer,
  TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle,
  Package, Ship, Truck, Activity, RefreshCw, Clock,
  BarChart2, Globe
} from 'lucide-react';

// ───────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────
type ImpactLevel = 'HIGH' | 'LOW';
type TrendDir = 'up' | 'down' | 'stable';
type Severity = 'critical' | 'warning' | 'info' | 'success';

interface WeatherCity {
  city: string;
  icon: React.ReactNode;
  condition: string;
  temp: number;
  impact: ImpactLevel;
}

interface MarketSignal {
  category: string;
  emoji: string;
  trend: TrendDir;
  change: number;
  label: string;
  forecastImpact: number;
}

interface NewsItem {
  id: number;
  icon: string;
  title: string;
  severity: Severity;
  affectedWarehouses: string[];
  suggestedAction: string;
  minsAgo: number;
}

// ───────────────────────────────────────────────
// MOCK DATA GENERATORS
// ───────────────────────────────────────────────
const BASE_WEATHER: Omit<WeatherCity, 'temp' | 'impact'>[] = [
  { city: 'Mumbai', icon: <CloudRain className="w-5 h-5" />, condition: 'Heavy Showers' },
  { city: 'Delhi', icon: <Wind className="w-5 h-5" />, condition: 'Partly Cloudy' },
  { city: 'Bangalore', icon: <Cloud className="w-5 h-5" />, condition: 'Overcast' },
  { city: 'Chennai', icon: <Zap className="w-5 h-5" />, condition: 'Thunderstorm' },
  { city: 'Kolkata', icon: <Sun className="w-5 h-5" />, condition: 'Clear Sky' },
];

const BASE_TEMPS = [28, 33, 22, 31, 29];
const BASE_IMPACTS: ImpactLevel[] = ['HIGH', 'LOW', 'LOW', 'HIGH', 'LOW'];

function generateWeatherData(): WeatherCity[] {
  return BASE_WEATHER.map((w, i) => ({
    ...w,
    temp: BASE_TEMPS[i] + Math.round((Math.random() - 0.5) * 4),
    impact: Math.random() > 0.7 ? (BASE_IMPACTS[i] === 'HIGH' ? 'LOW' : 'HIGH') : BASE_IMPACTS[i],
  }));
}

const MARKET_SIGNALS: MarketSignal[] = [
  { category: 'Grocery', emoji: '🛒', trend: 'up', change: 12, label: 'Diwali season', forecastImpact: 18 },
  { category: 'Apparel', emoji: '👗', trend: 'up', change: 34, label: 'Winter collection', forecastImpact: 42 },
  { category: 'Electronics', emoji: '💻', trend: 'stable', change: 0, label: 'Steady demand', forecastImpact: 2 },
  { category: 'Home Goods', emoji: '🛋️', trend: 'down', change: -8, label: 'Post-sale dip', forecastImpact: -11 },
  { category: 'Pharma', emoji: '💊', trend: 'up', change: 6, label: 'Season change', forecastImpact: 9 },
];

const NEWS_ITEMS: NewsItem[] = [
  {
    id: 1,
    icon: '🚢',
    title: 'Port congestion at Nhava Sheva — +2 day delay expected',
    severity: 'critical',
    affectedWarehouses: ['WH-Mumbai-01', 'WH-Pune-03'],
    suggestedAction: 'Reroute via Mundra Port for next 48 hrs',
    minsAgo: 8,
  },
  {
    id: 2,
    icon: '🌧️',
    title: 'Heavy rains forecast Mumbai — road delays expected',
    severity: 'warning',
    affectedWarehouses: ['WH-Mumbai-01', 'WH-Mumbai-02'],
    suggestedAction: 'Pre-position inventory at peripheral hubs',
    minsAgo: 22,
  },
  {
    id: 3,
    icon: '📦',
    title: 'Supplier XYZ reports 15% capacity reduction this week',
    severity: 'warning',
    affectedWarehouses: ['WH-Delhi-02'],
    suggestedAction: 'Activate secondary supplier (Supplier-B) immediately',
    minsAgo: 45,
  },
  {
    id: 4,
    icon: '✅',
    title: 'NH-48 highway cleared — routes normalized',
    severity: 'success',
    affectedWarehouses: ['WH-Bangalore-01', 'WH-Chennai-01'],
    suggestedAction: 'Resume standard dispatch schedule',
    minsAgo: 61,
  },
  {
    id: 5,
    icon: '⚡',
    title: 'Power grid disruption in industrial belt — Pune area',
    severity: 'critical',
    affectedWarehouses: ['WH-Pune-01', 'WH-Pune-03'],
    suggestedAction: 'Switch to generator backup; delay cold-chain ops',
    minsAgo: 90,
  },
];

// ───────────────────────────────────────────────
// SUB-COMPONENTS
// ───────────────────────────────────────────────

function SectionHeader({ title, subtitle, icon }: { title: string; subtitle: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="bg-[#7b41b3] p-2 rounded-xl shadow-md">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-base text-[#2d3339] leading-tight">{title}</h3>
        <p className="text-xs font-medium text-[#7b41b3] uppercase tracking-tight">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── PANEL 1: Weather ───────────────────────────
function WeatherPanel({ data, lastUpdated }: { data: WeatherCity[]; lastUpdated: Date }) {
  return (
    <div className="esf-panel">
      <SectionHeader
        title="Weather Impact"
        subtitle="Indian cities — live conditions"
        icon={<CloudRain className="w-4 h-4 text-white" />}
      />
      <div className="space-y-2.5">
        {data.map((w) => (
          <div key={w.city} className="esf-city-row">
            <div className="flex items-center gap-3 flex-1">
              <div className="esf-weather-icon">{w.icon}</div>
              <div>
                <p className="text-sm font-bold text-[#2d3339]">{w.city}</p>
                <p className="text-[11px] font-medium text-[#596067]">{w.condition}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-[#f59e0b]">
                <Thermometer className="w-3.5 h-3.5" />
                <span className="text-sm font-mono font-bold">{w.temp}°C</span>
              </div>
              <span className={`esf-badge ${w.impact === 'HIGH' ? 'esf-badge-red' : 'esf-badge-green'}`}>
                {w.impact === 'HIGH' ? '⚠ HIGH IMPACT' : '✓ LOW IMPACT'}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-2 text-[#7b41b3]">
        <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
        <span className="text-[11px] font-bold tracking-tight">
          Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · Auto-refresh every 30s
        </span>
      </div>
    </div>
  );
}

// ─── PANEL 2: Market Trends ──────────────────
function MarketTrendsPanel() {
  return (
    <div className="esf-panel">
      <SectionHeader
        title="Market Trend Signals"
        subtitle="Real-time demand movement"
        icon={<TrendingUp className="w-4 h-4 text-white" />}
      />
      <div className="space-y-3">
        {MARKET_SIGNALS.map((s) => {
          const isUp = s.trend === 'up';
          const isDown = s.trend === 'down';
          const trendColor = isUp ? '#34D399' : isDown ? '#F87171' : '#FCD34D';
          const fgColor = isUp ? '#6EE7B7' : isDown ? '#FCA5A5' : '#FDE68A';

          return (
            <div key={s.category} className="esf-market-row">
              <div className="flex items-center gap-3 w-40">
                <span className="text-xl">{s.emoji}</span>
                <span className="text-sm font-bold text-[#2d3339]">{s.category}</span>
              </div>

              {/* Trend arrow + delta */}
              <div className="flex items-center gap-1.5" style={{ color: trendColor }}>
                {isUp && <TrendingUp className="w-4 h-4" />}
                {isDown && <TrendingDown className="w-4 h-4" />}
                {!isUp && !isDown && <Minus className="w-4 h-4" />}
                <span className="text-sm font-black font-mono">
                  {s.change > 0 ? `+${s.change}%` : s.change === 0 ? 'Stable' : `${s.change}%`}
                </span>
              </div>

              {/* Label */}
              <span className="text-xs flex-1 text-center font-medium text-[#596067] tracking-tight">{s.label}</span>

              {/* Forecast bar */}
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: trendColor }}>
                  Forecast {s.forecastImpact > 0 ? '+' : ''}{s.forecastImpact}%
                </span>
                <div className="w-20 h-2 rounded-full overflow-hidden bg-[#f0f2f5]">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(Math.abs(s.forecastImpact) * 2, 100)}%`,
                      background: trendColor,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PANEL 3: News Feed ──────────────────────
const SEVERITY_CONFIG: Record<Severity, { bg: string; border: string; badge: string; label: string }> = {
  critical: { bg: 'rgba(239,68,68,0.08)', border: '#EF4444', badge: '#EF4444', label: 'CRITICAL' },
  warning:  { bg: 'rgba(251,191,36,0.08)', border: '#FBBF24', badge: '#FBBF24', label: 'WARNING'  },
  info:     { bg: 'rgba(99,102,241,0.08)',  border: '#6366F1', badge: '#6366F1', label: 'INFO'     },
  success:  { bg: 'rgba(52,211,153,0.08)', border: '#34D399', badge: '#34D399', label: 'RESOLVED' },
};

function NewsCard({ item }: { item: NewsItem }) {
  const cfg = SEVERITY_CONFIG[item.severity];
  return (
    <div
      className="esf-news-card"
      style={{ background: cfg.bg, borderLeft: `3px solid ${cfg.border}` }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-none">{item.icon}</span>
          <p className="text-sm text-[#2d3339] font-bold leading-snug">{item.title}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className="text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm"
            style={{ backgroundColor: 'white', color: cfg.badge, border: `1.5px solid ${cfg.badge}` }}
          >
            {cfg.label}
          </span>
          <div className="flex items-center gap-1.5 text-[#7b41b3]">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold font-mono">{item.minsAgo}m ago</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          {item.affectedWarehouses.map((wh) => (
            <span key={wh} className="esf-wh-chip">{wh}</span>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-start gap-2">
        <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-[#7b41b3]" />
        <p className="text-[12px] font-medium text-[#596067] italic leading-tight">{item.suggestedAction}</p>
      </div>
    </div>
  );
}

function DisruptionFeed() {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll loop
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let animId: number;
    let paused = false;

    const scroll = () => {
      if (!paused && el) {
        el.scrollTop += 0.6;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 5) {
          el.scrollTop = 0;
        }
      }
      animId = requestAnimationFrame(scroll);
    };
    animId = requestAnimationFrame(scroll);

    el.addEventListener('mouseenter', () => { paused = true; });
    el.addEventListener('mouseleave', () => { paused = false; });

    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="esf-panel">
      <SectionHeader
        title="Disruption News Feed"
        subtitle="Live alerts affecting supply chain"
        icon={<AlertTriangle className="w-4 h-4 text-white" />}
      />
      <div
        ref={scrollRef}
        className="space-y-3 overflow-y-hidden"
        style={{ maxHeight: '280px', scrollbarWidth: 'none' }}
      >
        {[...NEWS_ITEMS, ...NEWS_ITEMS].map((item, idx) => (
          <NewsCard key={`${item.id}-${idx}`} item={item} />
        ))}
      </div>
    </div>
  );
}

// ─── PANEL 4: Risk Gauge ─────────────────────
function getRiskConfig(score: number) {
  if (score < 30) return { color: '#34D399', label: 'LOW RISK', zone: 'green' };
  if (score < 70) return { color: '#FBBF24', label: 'MODERATE RISK', zone: 'yellow' };
  return { color: '#EF4444', label: 'HIGH RISK', zone: 'red' };
}

function GaugeSVG({ score }: { score: number }) {
  // Semi-circle gauge
  const R = 80;
  const cx = 110;
  const cy = 100;
  const totalArc = Math.PI; // 180 deg semi-circle
  const angle = -Math.PI + (score / 100) * totalArc;
  const needleX = cx + R * Math.cos(angle);
  const needleY = cy + R * Math.sin(angle);
  const cfg = getRiskConfig(score);

  return (
    <svg viewBox="0 0 220 120" className="w-full max-w-[240px]">
      {/* Background track */}
      <path
        d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
        fill="none" stroke="#f0f2f5" strokeWidth="14" strokeLinecap="round"
      />
      {/* Green zone 0-30% */}
      <path
        d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R * Math.cos(-Math.PI + 0.3 * Math.PI)} ${cy + R * Math.sin(-Math.PI + 0.3 * Math.PI)}`}
        fill="none" stroke="#10b98120" strokeWidth="14"
      />
      {/* Yellow zone 30-70% */}
      <path
        d={`M ${cx + R * Math.cos(-Math.PI + 0.3 * Math.PI)} ${cy + R * Math.sin(-Math.PI + 0.3 * Math.PI)} A ${R} ${R} 0 0 1 ${cx + R * Math.cos(-Math.PI + 0.7 * Math.PI)} ${cy + R * Math.sin(-Math.PI + 0.7 * Math.PI)}`}
        fill="none" stroke="#f59e0b20" strokeWidth="14"
      />
      {/* Red zone 70-100% */}
      <path
        d={`M ${cx + R * Math.cos(-Math.PI + 0.7 * Math.PI)} ${cy + R * Math.sin(-Math.PI + 0.7 * Math.PI)} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
        fill="none" stroke="#ef444420" strokeWidth="14"
      />
      {/* Active arc */}
      <path
        d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${needleX} ${needleY}`}
        fill="none" stroke={cfg.color} strokeWidth="14" strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 4px ${cfg.color}50)` }}
      />
      {/* Needle */}
      <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="#2d3339" strokeWidth="3" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="6" fill={cfg.color} stroke="white" strokeWidth="2" />
      {/* Labels */}
      <text x={cx - R - 6} y={cy + 22} fill="#757b83" fontSize="11" fontWeight="bold" textAnchor="middle">0</text>
      <text x={cx} y={cy - R - 12} fill="#757b83" fontSize="11" fontWeight="bold" textAnchor="middle">50</text>
      <text x={cx + R + 6} y={cy + 22} fill="#757b83" fontSize="11" fontWeight="bold" textAnchor="middle">100</text>
    </svg>
  );
}

function RiskIndexPanel({ weatherData }: { weatherData: WeatherCity[] }) {
  // Compute a dynamic risk score
  const highImpactCount = weatherData.filter(w => w.impact === 'HIGH').length;
  const criticalNews = NEWS_ITEMS.filter(n => n.severity === 'critical').length;
  const downTrends = MARKET_SIGNALS.filter(m => m.trend === 'down').length;
  const score = Math.min(100, Math.round(
    highImpactCount * 10 + criticalNews * 12 + downTrends * 5 + 18 + Math.random() * 4
  ));
  const cfg = getRiskConfig(score);

  return (
    <div className="esf-panel flex flex-col items-center justify-between">
      <SectionHeader
        title="Supply Chain Risk Index"
        subtitle="Combined impact score"
        icon={<Activity className="w-4 h-4 text-white" />}
      />
      <div className="w-full flex flex-col items-center gap-2">
        <GaugeSVG score={score} />
        <div className="text-center -mt-2">
        <div className="text-5xl font-black font-mono tracking-tighter" style={{ color: cfg.color }}>
            {score}
          </div>
          <div className="text-[10px] font-black tracking-[0.2em] mt-2 uppercase" style={{ color: cfg.color }}>{cfg.label}</div>
        </div>
        <div className="w-full mt-6 grid grid-cols-3 gap-3">
          {[
            { label: 'Weather Events', val: highImpactCount, icon: <CloudRain className="w-4 h-4" />, color: '#ef4444' },
            { label: 'Critical Alerts', val: criticalNews, icon: <AlertTriangle className="w-4 h-4" />, color: '#f59e0b' },
            { label: 'Market Dips', val: downTrends, icon: <TrendingDown className="w-4 h-4" />, color: '#7b41b3' },
          ].map(({ label, val, icon, color }) => (
            <div key={label} className="esf-mini-stat shadow-sm" style={{ border: `1.5px solid ${color}20`, backgroundColor: 'white' }}>
              <div style={{ color }}>{icon}</div>
              <span className="text-xl font-black" style={{ color }}>{val}</span>
              <span className="text-[10px] text-center font-bold tracking-tight uppercase leading-none mt-1" style={{ color: '#596067' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────
// MAIN COMPONENT
// ───────────────────────────────────────────────
export default function ExternalSignalsFeed() {
  const [weatherData, setWeatherData] = useState<WeatherCity[]>(generateWeatherData());
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setWeatherData(generateWeatherData());
      setLastUpdated(new Date());
      setPulse(true);
      setTimeout(() => setPulse(false), 800);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="esf-root">
      {/* Header */}
      <div className="esf-header">
        <div className="flex items-center gap-3">
          <div className="esf-logo-ring">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-[#2d3339]">External Signals Feed</h2>
            <p className="text-sm font-medium text-[#7b41b3]">Real-world factors impacting your supply chain · AnvayaAI</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl shadow-sm ${pulse ? 'esf-pulse-anim' : ''}`}
            style={{ backgroundColor: 'white', border: '1.5px solid #7b41b322' }}>
            <span className="esf-live-dot" />
            <span className="text-xs font-black tracking-widest text-[#7b41b3]">LIVE FEED</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-[#acb3ba]/20 shadow-sm text-[#596067]">
            <BarChart2 className="w-4 h-4 text-[#7b41b3]" />
            <span className="text-xs font-bold uppercase tracking-tight">Supply Intelligence</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="esf-grid">
        <WeatherPanel data={weatherData} lastUpdated={lastUpdated} />
        <MarketTrendsPanel />
        <DisruptionFeed />
        <RiskIndexPanel weatherData={weatherData} />
      </div>

      <style>{`
        .esf-root {
          min-height: 100vh;
          background-color: #f9f9fc;
          padding: 40px;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .esf-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
          padding: 24px 32px;
          border-radius: 24px;
          background-color: white;
          border: 1.5px solid rgba(172,179,186,0.15);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .esf-logo-ring {
          width: 48px; height: 48px;
          border-radius: 16px;
          background: linear-gradient(135deg, #7b41b3, #9F67FF);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 16px rgba(123,65,179,0.3);
        }

        .esf-live-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 8px #ef444450;
          display: inline-block;
          animation: blink 1s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .esf-pulse-anim {
          animation: pulse-border 0.8s ease;
        }
        @keyframes pulse-border {
          0% { box-shadow: 0 0 0 0 rgba(123,65,179,0.4); }
          100% { box-shadow: 0 0 0 12px rgba(123,65,179,0); }
        }

        .esf-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: auto auto;
          gap: 32px;
        }

        .esf-panel {
          background-color: white;
          border: 1.5px solid rgba(172,179,186,0.15);
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;
        }
        .esf-panel:hover {
          transform: translateY(-4px);
          border-color: rgba(123,65,179,0.25);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .esf-city-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-radius: 20px;
          background-color: #f2f3f8;
          border: 1px solid rgba(172,179,186,0.1);
          transition: all 0.2s;
        }
        .esf-city-row:hover {
          background-color: white;
          border-color: #7b41b344;
          box-shadow: 0 4px 12px rgba(123,65,179,0.06);
        }

        .esf-weather-icon {
          width: 42px; height: 42px;
          border-radius: 12px;
          background-color: white;
          display: flex; align-items: center; justify-content: center;
          border: 1.5px solid rgba(123,65,179,0.15);
          color: #7b41b3;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .esf-badge {
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.05em;
          padding: 4px 10px;
          border-radius: 20px;
          white-space: nowrap;
          box-shadow: inset 0 1px 2px rgba(255,255,255,0.2);
        }
        .esf-badge-red {
          background-color: #fee2e2;
          color: #dc2626;
          border: 1.5px solid #fecaca;
        }
        .esf-badge-green {
          background-color: #d1fae5;
          color: #059669;
          border: 1.5px solid #a7f3d0;
        }

        .esf-market-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 16px 20px;
          border-radius: 20px;
          background-color: #f2f3f8;
          border: 1px solid rgba(172,179,186,0.1);
          transition: all 0.2s;
        }
        .esf-market-row:hover {
          background-color: white;
          border-color: #7b41b344;
          box-shadow: 0 4px 12px rgba(123,65,179,0.06);
        }

        .esf-news-card {
          padding: 20px;
          border-radius: 20px;
          transition: all 0.2s;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        .esf-news-card:hover {
          transform: translateX(4px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .esf-wh-chip {
          font-size: 10px;
          font-weight: 800;
          padding: 3px 10px;
          border-radius: 20px;
          background-color: white;
          color: #7b41b3;
          border: 1.5px solid #7b41b320;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .esf-mini-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 10px 6px;
          border-radius: 12px;
          background: rgba(124,58,237,0.08);
          border: 1px solid;
        }

        @media (max-width: 900px) {
          .esf-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
