'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  IndianRupee,
  Route,
  ShieldCheck,
  Sparkles,
  TimerReset,
  TrendingUp,
  Warehouse,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DisruptionLeafletMap = dynamic(
  () => import('@/components/DisruptionLeafletMap'),
  { ssr: false }
);

type DisruptionType =
  | 'Warehouse Offline'
  | 'Supplier Delay (+X days)'
  | 'Demand Surge (+X%)'
  | 'Weather Block (route unavailable)'
  | 'Port Strike';

type InventoryItem = {
  sku: string;
  warehouse: string;
  stockBefore: number;
  stockAfter: number;
  eoqBefore: number;
  eoqAfter: number;
  impacted: boolean;
};

type ComparisonMetric = {
  label: string;
  before: string;
  after: string;
  improvement: string;
};

type RoutePoint = {
  name: string;
  coords: [number, number];
};

type SimulationResult = {
  inventory: InventoryItem[];
  primaryRoute: RoutePoint[];
  reroutedRoute: RoutePoint[];
  costImpact: number;
  recoveryTime: string;
  comparisons: ComparisonMetric[];
  recommendations: string[];
};

const disruptionTypes: DisruptionType[] = [
  'Warehouse Offline',
  'Supplier Delay (+X days)',
  'Demand Surge (+X%)',
  'Weather Block (route unavailable)',
  'Port Strike',
];

const targetOptions: Record<DisruptionType, string[]> = {
  'Warehouse Offline': ['WH_01 - Mumbai Hub', 'WH_03 - Bengaluru Center', 'WH_05 - Hyderabad Port'],
  'Supplier Delay (+X days)': ['Supplier Alpha / PRD_014', 'Supplier Nova / PRD_021', 'Supplier Apex / PRD_033'],
  'Demand Surge (+X%)': ['PRD_014 - Smart Kettle', 'PRD_021 - Energy Bars', 'PRD_033 - Festival Lights'],
  'Weather Block (route unavailable)': ['Route MUM-DEL', 'Route BLR-HYD', 'Route CHN-KOL'],
  'Port Strike': ['Nhava Sheva Port', 'Chennai Port', 'Mundra Port'],
};

const routeLibrary: Record<string, RoutePoint[]> = {
  'WH_01 - Mumbai Hub': [
    { name: 'Mumbai Hub', coords: [19.076, 72.8777] },
    { name: 'Nashik Node', coords: [19.9975, 73.7898] },
    { name: 'Delhi DC', coords: [28.6139, 77.209] },
  ],
  'WH_03 - Bengaluru Center': [
    { name: 'Bengaluru Center', coords: [12.9716, 77.5946] },
    { name: 'Hyderabad Port', coords: [17.385, 78.4867] },
    { name: 'Nagpur Relay', coords: [21.1458, 79.0882] },
  ],
  'WH_05 - Hyderabad Port': [
    { name: 'Hyderabad Port', coords: [17.385, 78.4867] },
    { name: 'Vijayawada Depot', coords: [16.5062, 80.648] },
    { name: 'Chennai Port', coords: [13.0827, 80.2707] },
  ],
  'Supplier Alpha / PRD_014': [
    { name: 'Pune Supplier', coords: [18.5204, 73.8567] },
    { name: 'Mumbai Hub', coords: [19.076, 72.8777] },
    { name: 'Delhi DC', coords: [28.6139, 77.209] },
  ],
  'Supplier Nova / PRD_021': [
    { name: 'Ahmedabad Supplier', coords: [23.0225, 72.5714] },
    { name: 'Jaipur Relay', coords: [26.9124, 75.7873] },
    { name: 'Delhi DC', coords: [28.6139, 77.209] },
  ],
  'Supplier Apex / PRD_033': [
    { name: 'Kolkata Supplier', coords: [22.5726, 88.3639] },
    { name: 'Bhubaneswar Node', coords: [20.2961, 85.8245] },
    { name: 'Chennai Port', coords: [13.0827, 80.2707] },
  ],
  'PRD_014 - Smart Kettle': [
    { name: 'Mumbai Hub', coords: [19.076, 72.8777] },
    { name: 'Surat Buffer', coords: [21.1702, 72.8311] },
    { name: 'Delhi DC', coords: [28.6139, 77.209] },
  ],
  'PRD_021 - Energy Bars': [
    { name: 'Bengaluru Center', coords: [12.9716, 77.5946] },
    { name: 'Nagpur Relay', coords: [21.1458, 79.0882] },
    { name: 'Delhi DC', coords: [28.6139, 77.209] },
  ],
  'PRD_033 - Festival Lights': [
    { name: 'Chennai Port', coords: [13.0827, 80.2707] },
    { name: 'Hyderabad Port', coords: [17.385, 78.4867] },
    { name: 'Mumbai Hub', coords: [19.076, 72.8777] },
  ],
  'Route MUM-DEL': [
    { name: 'Mumbai Hub', coords: [19.076, 72.8777] },
    { name: 'Vadodara Checkpoint', coords: [22.3072, 73.1812] },
    { name: 'Delhi DC', coords: [28.6139, 77.209] },
  ],
  'Route BLR-HYD': [
    { name: 'Bengaluru Center', coords: [12.9716, 77.5946] },
    { name: 'Kurnool Junction', coords: [15.8281, 78.0373] },
    { name: 'Hyderabad Port', coords: [17.385, 78.4867] },
  ],
  'Route CHN-KOL': [
    { name: 'Chennai Port', coords: [13.0827, 80.2707] },
    { name: 'Visakhapatnam Node', coords: [17.6868, 83.2185] },
    { name: 'Kolkata Depot', coords: [22.5726, 88.3639] },
  ],
  'Nhava Sheva Port': [
    { name: 'Nhava Sheva Port', coords: [18.95, 72.95] },
    { name: 'Mumbai Hub', coords: [19.076, 72.8777] },
    { name: 'Delhi DC', coords: [28.6139, 77.209] },
  ],
  'Chennai Port': [
    { name: 'Chennai Port', coords: [13.0827, 80.2707] },
    { name: 'Bengaluru Center', coords: [12.9716, 77.5946] },
    { name: 'Hyderabad Port', coords: [17.385, 78.4867] },
  ],
  'Mundra Port': [
    { name: 'Mundra Port', coords: [22.839, 69.721] },
    { name: 'Ahmedabad Buffer', coords: [23.0225, 72.5714] },
    { name: 'Mumbai Hub', coords: [19.076, 72.8777] },
  ],
};

function buildSimulation(
  disruptionType: DisruptionType,
  target: string,
  intensity: number
): SimulationResult {
  const baseInventory: InventoryItem[] = [
    { sku: 'PRD_014', warehouse: 'WH_01', stockBefore: 420, stockAfter: 0, eoqBefore: 520, eoqAfter: 0, impacted: false },
    { sku: 'PRD_021', warehouse: 'WH_03', stockBefore: 290, stockAfter: 0, eoqBefore: 380, eoqAfter: 0, impacted: false },
    { sku: 'PRD_033', warehouse: 'WH_05', stockBefore: 510, stockAfter: 0, eoqBefore: 610, eoqAfter: 0, impacted: false },
    { sku: 'PRD_041', warehouse: 'WH_01', stockBefore: 335, stockAfter: 0, eoqBefore: 420, eoqAfter: 0, impacted: false },
  ];

  const disruptionFactor =
    disruptionType === 'Warehouse Offline' ? 0.42 :
    disruptionType === 'Supplier Delay (+X days)' ? 0.26 :
    disruptionType === 'Demand Surge (+X%)' ? 0.34 :
    disruptionType === 'Weather Block (route unavailable)' ? 0.3 :
    0.38;

  const routeSeed = routeLibrary[target] ?? routeLibrary['WH_01 - Mumbai Hub'];
  const reroutedRoute = [
    routeSeed[0],
    { name: 'AI Flex Hub', coords: [20.5937, 78.9629] as [number, number] },
    routeSeed[routeSeed.length - 1],
  ];

  const inventory = baseInventory.map((item, index) => {
    const impacted =
      target.includes(item.warehouse) ||
      target.includes(item.sku) ||
      (disruptionType === 'Warehouse Offline' && index < 2) ||
      (disruptionType === 'Port Strike' && index % 2 === 0);

    const loss = impacted ? Math.round(item.stockBefore * (disruptionFactor + intensity / 1000)) : Math.round(item.stockBefore * 0.08);
    const adaptiveGain = impacted ? Math.round(item.stockBefore * 0.18) : Math.round(item.stockBefore * 0.05);
    const stockAfter = Math.max(42, item.stockBefore - loss + adaptiveGain);
    const eoqAfter = Math.round(item.eoqBefore * (impacted ? 1.12 + intensity / 300 : 1.04));

    return {
      ...item,
      stockAfter,
      eoqAfter,
      impacted,
    };
  });

  const costImpact = Math.round(185000 + intensity * 3100 + disruptionFactor * 90000);
  const recoveryDays = Math.max(2, Math.round(9 - intensity / 20 - disruptionFactor * 6));

  return {
    inventory,
    primaryRoute: routeSeed,
    reroutedRoute,
    costImpact,
    recoveryTime: `${recoveryDays} days`,
    comparisons: [
      {
        label: 'Fulfillment Rate',
        before: '96.0%',
        after: `${Math.min(99, 91 + intensity / 12).toFixed(1)}%`,
        improvement: `+${Math.round(12 + intensity / 8)}%`,
      },
      {
        label: 'Stockout Risk',
        before: '18.4%',
        after: `${Math.max(4.8, 9.5 - intensity / 35).toFixed(1)}%`,
        improvement: `+${Math.round(28 + intensity / 6)}%`,
      },
      {
        label: 'Transport Agility',
        before: '61.0%',
        after: `${Math.min(96, 78 + intensity / 5).toFixed(1)}%`,
        improvement: `+${Math.round(18 + intensity / 7)}%`,
      },
      {
        label: 'Supplier Coverage',
        before: '2 backup lanes',
        after: `${3 + Math.round(intensity / 25)} backup lanes`,
        improvement: `+${Math.round(22 + intensity / 10)}%`,
      },
    ],
    recommendations: [
      `Pre-position ${Math.round(120 + intensity * 1.4)} units of PRD_021 at WH_03 and trigger a midnight cross-dock into the affected lane.`,
      `Shift ${Math.round(18 + intensity / 3)}% of replenishment volume to the AI Flex Hub and hold expedited carrier capacity for 48 hours.`,
      `Increase EOQ on impacted SKUs by ${Math.round(8 + intensity / 8)}% and run a twice-daily control tower review until recovery stabilizes.`,
    ],
  };
}

export default function DisruptionSimulatorPage() {
  const [disruptionType, setDisruptionType] = useState<DisruptionType>('Warehouse Offline');
  const [target, setTarget] = useState(targetOptions['Warehouse Offline'][0]);
  const [intensity, setIntensity] = useState(35);
  const [simulationTick, setSimulationTick] = useState(0);
  const [simulation, setSimulation] = useState<SimulationResult>(
    buildSimulation('Warehouse Offline', targetOptions['Warehouse Offline'][0], 35)
  );

  const selectedTargets = targetOptions[disruptionType];

  const impactedCount = useMemo(
    () => simulation.inventory.filter((item) => item.impacted).length,
    [simulation]
  );

  const averageEOQShift = useMemo(() => {
    const totalBefore = simulation.inventory.reduce((sum, item) => sum + item.eoqBefore, 0);
    const totalAfter = simulation.inventory.reduce((sum, item) => sum + item.eoqAfter, 0);
    return Math.round(((totalAfter - totalBefore) / totalBefore) * 100);
  }, [simulation]);

  const handleDisruptionChange = (value: DisruptionType) => {
    setDisruptionType(value);
    setTarget(targetOptions[value][0]);
  };

  const simulateImpact = () => {
    setSimulation(buildSimulation(disruptionType, target, intensity));
    setSimulationTick((prev) => prev + 1);
  };

  return (
    <div className="p-8 space-y-8 text-[#2d3339]">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#F5F3FF] px-4 py-2 text-sm font-semibold text-[#7C3AED]">
            <Sparkles className="h-4 w-4" />
            AnvayaAI Control Tower
          </div>
          <h2 className="mt-4 text-3xl font-bold font-manrope text-[#2d3339]">Disruption Simulator</h2>
          <p className="mt-2 max-w-3xl text-[#596067]">
            Stress-test your network against warehouse outages, supplier shocks, demand spikes, and route failures. Every scenario is mock-powered and visualized live for rapid storytelling.
          </p>
        </div>

        <div className="grid w-full gap-4 rounded-[2rem] border border-[#C4B5FD]/40 bg-white p-4 shadow-sm xl:w-auto xl:min-w-[720px] xl:grid-cols-4">
          <div className="relative">
            <label className="mb-2 block text-xs font-black uppercase tracking-widest text-[#596067]">Disruption Type</label>
            <select
              value={disruptionType}
              onChange={(e) => handleDisruptionChange(e.target.value as DisruptionType)}
              className="w-full appearance-none rounded-xl border border-[#DDD6FE] bg-[#F5F3FF] px-4 py-3 pr-10 text-sm font-medium outline-none ring-[#7C3AED]/50 transition focus:ring-2"
            >
              {disruptionTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-[42px] h-4 w-4 text-[#7C3AED]" />
          </div>

          <div className="relative">
            <label className="mb-2 block text-xs font-black uppercase tracking-widest text-[#596067]">Target</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full appearance-none rounded-xl border border-[#DDD6FE] bg-[#F5F3FF] px-4 py-3 pr-10 text-sm font-medium outline-none ring-[#7C3AED]/50 transition focus:ring-2"
            >
              {selectedTargets.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-[42px] h-4 w-4 text-[#7C3AED]" />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-widest text-[#596067]">
              Severity {disruptionType.includes('Delay') ? '(Days)' : disruptionType.includes('Surge') ? '(%)' : '(Index)'}
            </label>
            <input
              type="range"
              min={10}
              max={80}
              step={5}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="mt-3 w-full accent-[#7C3AED]"
            />
            <div className="mt-2 flex items-center justify-between text-xs font-semibold text-[#7C3AED]">
              <span>Low</span>
              <span>{intensity}</span>
              <span>High</span>
            </div>
          </div>

          <button
            onClick={simulateImpact}
            className="flex items-center justify-center gap-3 rounded-2xl bg-[#7C3AED] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-[#7C3AED]/25 transition hover:bg-[#6D28D9]"
          >
            <AlertTriangle className="h-5 w-5" />
            Simulate Impact
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-[2rem] border border-[#E9D5FF] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F3FF]">
              <Warehouse className="h-7 w-7 text-[#7C3AED]" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-[#596067]">Impacted SKUs</div>
              <div className="text-3xl font-bold text-[#2d3339]">{impactedCount}</div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#E9D5FF] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F3FF]">
              <Route className="h-7 w-7 text-[#7C3AED]" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-[#596067]">Auto-Rerouted Lanes</div>
              <div className="text-3xl font-bold text-[#2d3339]">{simulation.reroutedRoute.length - 1}</div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#E9D5FF] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F3FF]">
              <TrendingUp className="h-7 w-7 text-[#7C3AED]" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-[#596067]">EOQ Shift</div>
              <div className="text-3xl font-bold text-[#2d3339]">+{averageEOQShift}%</div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#E9D5FF] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F3FF]">
              <IndianRupee className="h-7 w-7 text-[#7C3AED]" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-[#596067]">Estimated Cost Impact</div>
              <div className="text-3xl font-bold text-[#2d3339]">₹{simulation.costImpact.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#E9D5FF] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F3FF]">
              <TimerReset className="h-7 w-7 text-[#7C3AED]" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-[#596067]">Recovery Time</div>
              <div className="text-3xl font-bold text-[#2d3339]">{simulation.recoveryTime}</div>
            </div>
          </div>
        </div>
      </div>

      <div
        key={simulationTick}
        className="grid grid-cols-1 gap-8 xl:grid-cols-[1.2fr_1fr] animate-[fadeSlide_700ms_ease]"
      >
        <div className="space-y-8">
          <div className="rounded-[2rem] border border-[#E9D5FF] bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#2d3339]">Affected Inventory Levels</h3>
                <p className="text-sm text-[#596067]">Impacted SKUs are highlighted in red while AI rebalances stock and EOQ.</p>
              </div>
              <div className="rounded-full bg-[#F5F3FF] px-4 py-2 text-sm font-semibold text-[#7C3AED]">
                Severity {intensity}
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-[#E9D5FF]">
              <table className="w-full text-left">
                <thead className="bg-[#F5F3FF]">
                  <tr>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[#596067]">SKU</th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[#596067]">Warehouse</th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[#596067]">Before Stock</th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[#596067]">After Stock</th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[#596067]">New EOQ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3E8FF]">
                  {simulation.inventory.map((item) => (
                    <tr
                      key={item.sku}
                      className={cn(
                        'transition-all duration-700',
                        item.impacted ? 'bg-[#FEF2F2]' : 'bg-white'
                      )}
                    >
                      <td className="px-6 py-4 font-bold text-[#2d3339]">{item.sku}</td>
                      <td className="px-6 py-4 text-[#596067]">{item.warehouse}</td>
                      <td className="px-6 py-4 text-[#596067]">{item.stockBefore}</td>
                      <td className={cn('px-6 py-4 font-bold', item.impacted ? 'text-[#DC2626]' : 'text-[#7C3AED]')}>
                        {item.stockAfter}
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#7C3AED]">{item.eoqAfter}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#E9D5FF] bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#2d3339]">Before Disruption vs After AI Adaptation</h3>
                <p className="text-sm text-[#596067]">Animated comparison of resilience metrics under the selected disruption scenario.</p>
              </div>
              <div className="rounded-full bg-[#ECFDF5] px-4 py-2 text-sm font-bold text-[#16A34A]">
                AI lift active
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-[#E5E7EB] bg-[#FAFAFA] p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDE9FE]">
                    <AlertTriangle className="h-6 w-6 text-[#7C3AED]" />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-[#596067]">Left State</div>
                    <div className="text-xl font-bold text-[#2d3339]">Before Disruption</div>
                  </div>
                </div>
                <div className="space-y-4">
                  {simulation.comparisons.map((metric) => (
                    <div key={metric.label} className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
                      <div className="text-sm font-semibold text-[#596067]">{metric.label}</div>
                      <div className="mt-2 text-2xl font-bold text-[#2d3339]">{metric.before}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-[#DDD6FE] bg-[#F5F3FF] p-6 transition-all duration-700">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7C3AED]">
                    <ShieldCheck className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-[#596067]">Right State</div>
                    <div className="text-xl font-bold text-[#2d3339]">After AI Adaptation</div>
                  </div>
                </div>
                <div className="space-y-4">
                  {simulation.comparisons.map((metric) => (
                    <div key={metric.label} className="rounded-2xl border border-[#C4B5FD] bg-white p-4 shadow-sm transition-all duration-700 hover:translate-y-[-2px]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-[#596067]">{metric.label}</div>
                          <div className="mt-2 text-2xl font-bold text-[#2d3339]">{metric.after}</div>
                        </div>
                        <div className="rounded-full bg-[#ECFDF5] px-3 py-1 text-xs font-black uppercase tracking-widest text-[#16A34A]">
                          {metric.improvement}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-[2rem] border border-[#E9D5FF] bg-white p-8 shadow-sm">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-[#2d3339]">Auto-Rerouted Path</h3>
              <p className="text-sm text-[#596067]">Red shows the blocked lane, purple shows AnvayaAI’s recovery route.</p>
            </div>
            <div className="h-[340px] overflow-hidden rounded-[1.5rem] border border-[#DDD6FE]">
              <DisruptionLeafletMap
                primaryRoute={simulation.primaryRoute}
                reroutedRoute={simulation.reroutedRoute}
              />
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#E9D5FF] bg-white p-8 shadow-sm">
            <h3 className="text-xl font-bold text-[#2d3339]">Disruption Economics</h3>
            <div className="mt-6 grid gap-4">
              <div className="rounded-2xl bg-[#F5F3FF] p-5">
                <div className="text-xs font-black uppercase tracking-widest text-[#596067]">Cost Impact</div>
                <div className="mt-2 text-3xl font-bold text-[#7C3AED]">₹{simulation.costImpact.toLocaleString('en-IN')}</div>
              </div>
              <div className="rounded-2xl bg-[#F5F3FF] p-5">
                <div className="text-xs font-black uppercase tracking-widest text-[#596067]">Recovery Time Estimate</div>
                <div className="mt-2 text-3xl font-bold text-[#7C3AED]">{simulation.recoveryTime}</div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#C4B5FD] bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] p-8 text-white shadow-lg shadow-[#7C3AED]/25">
            <div className="mb-4 flex items-center gap-3">
              <Sparkles className="h-6 w-6" />
              <h3 className="text-xl font-bold">AI Recommendation</h3>
            </div>
            <div className="space-y-3">
              {simulation.recommendations.map((recommendation, index) => (
                <div
                  key={recommendation}
                  className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm leading-relaxed backdrop-blur-sm transition-all duration-700"
                  style={{ transitionDelay: `${index * 90}ms` }}
                >
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-black">
                    {index + 1}
                  </span>
                  {recommendation}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
