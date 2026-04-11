"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Brain, Activity, Package, MapPin, Zap, Settings, TrendingUp, Inbox, Target } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const THEME_COLOR = '#7C3AED';
const MAX_EPISODES = 100;

interface LogEntry {
  id: number;
  timestamp: string;
  product: string;
  warehouse: string;
  action: string;
  reward: number;
  reason: string;
}

export default function RLReorderAgent() {
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(600); // ms per episode
  const [episode, setEpisode] = useState(0);
  const [cumulativeReward, setCumulativeReward] = useState(0);
  // Using an initial value to anchor the graph
  const [chartData, setChartData] = useState<{ episode: number; reward: number }[]>([{ episode: 0, reward: 0 }]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const [currentState, setCurrentState] = useState({
    warehouse: 'WH_01',
    product: 'PRD_001',
    stockLevel: 500,
    demandForecast: 100,
    daysToStockout: 5
  });

  const [currentAction, setCurrentAction] = useState<{
    type: 'REORDER' | 'HOLD';
    amount: number;
    reason: string;
    reward: number;
  } | null>(null);

  // Persist state for setInterval
  const stateRef = useRef({ episode, cumulativeReward, chartData, logs });
  useEffect(() => {
    stateRef.current = { episode, cumulativeReward, chartData, logs };
  }, [episode, cumulativeReward, chartData, logs]);

  const triggerSimulationStep = useCallback(() => {
    const { episode: ep, cumulativeReward: cr, chartData: cd, logs: l } = stateRef.current;

    if (ep >= MAX_EPISODES) {
      setIsRunning(false);
      return;
    }

    const newEp = ep + 1;
    // Simulate learning improvement over episodes (0 to 100)
    const learningFactor = newEp / MAX_EPISODES; 

    // Generate random mock state
    const whNum = Math.floor(Math.random() * 10) + 1;
    const prdNum = Math.floor(Math.random() * 20) + 1;
    const warehouse = `WH_${whNum.toString().padStart(2, '0')}`;
    const product = `PRD_${prdNum.toString().padStart(3, '0')}`;

    const demandForecast = Math.floor(Math.random() * 150) + 30;
    const stockLevel = Math.floor(Math.random() * 800);
    const reorderPoint = demandForecast * 2 + 50; 
    const daysToStockout = demandForecast > 0 ? (stockLevel / demandForecast).toFixed(1) : '∞';

    setCurrentState({
      warehouse,
      product,
      stockLevel,
      demandForecast,
      daysToStockout: Number(daysToStockout)
    });

    let actionType: 'REORDER' | 'HOLD';
    let amount = 0;
    let reward = 0;
    let reason = '';

    const optimalDecision = stockLevel < reorderPoint ? 'REORDER' : 'HOLD';

    // The agent gradually makes fewer "random" (suboptimal) decisions as learning progresses
    const makeOptimalDecision = Math.random() < (0.2 + 0.75 * learningFactor);

    if (makeOptimalDecision) {
      actionType = optimalDecision;
      if (actionType === 'REORDER') {
        amount = Math.max(reorderPoint * 2 - stockLevel, 0) + Math.floor(Math.random() * 50);
        reward = 15;
        reason = `Stock ${stockLevel} < Reorder point ${reorderPoint}`;
      } else {
        reward = 10;
        reason = `Stock ${stockLevel} sufficient (Point: ${reorderPoint})`;
      }
    } else {
      // Suboptimal choice
      actionType = optimalDecision === 'REORDER' ? 'HOLD' : 'REORDER';
      if (actionType === 'REORDER') {
        amount = Math.floor(Math.random() * 500) + 100;
        reward = -8;
        reason = `Overstock penalty (Stock ${stockLevel} >= ${reorderPoint})`;
      } else {
        reward = -15;
        reason = `Stockout risk (Stock ${stockLevel} < ${reorderPoint})`;
      }
    }

    // Add noise to reward
    const actualReward = reward + Math.floor((Math.random() * 4) - 2);
    const newCr = cr + actualReward;

    setCurrentAction({
      type: actionType,
      amount,
      reason,
      reward: actualReward
    });

    setCumulativeReward(newCr);
    setEpisode(newEp);

    const newLog: LogEntry = {
      id: newEp,
      timestamp: new Date().toLocaleTimeString(),
      product,
      warehouse,
      action: actionType === 'REORDER' ? `REORDER ${amount}` : 'HOLD',
      reward: actualReward,
      reason
    };

    setLogs([newLog, ...l].slice(0, 10));

    // Update chart
    const newChartData = [...cd, { episode: newEp, reward: newCr }];
    // Keep max 100 points
    if (newChartData.length > MAX_EPISODES + 1) {
      newChartData.shift();
    }
    setChartData(newChartData);

    if (newEp >= MAX_EPISODES) {
      setIsRunning(false);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(triggerSimulationStep, speed);
    }
    return () => clearInterval(interval);
  }, [isRunning, speed, triggerSimulationStep]);

  const handleReset = () => {
    setIsRunning(false);
    setEpisode(0);
    setCumulativeReward(0);
    setChartData([{ episode: 0, reward: 0 }]);
    setLogs([]);
    setCurrentAction(null);
  };

  return (
    <div className="w-full h-full bg-slate-900 text-slate-200 p-6 rounded-xl shadow-2xl flex flex-col gap-6 font-sans border border-slate-800">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
            <Brain className="w-8 h-8 text-[#7C3AED]" />
            RL Reorder Agent
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Simulating Q-Learning inventory decisions
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-800/50 p-2 rounded-lg border border-slate-800">
          <div className="flex flex-col items-center px-4 border-r border-slate-700">
            <span className="text-xs text-slate-400 font-semibold tracking-wider">EPISODE</span>
            <span className="text-xl font-mono font-bold text-white">{episode} <span className="text-slate-500 text-sm">/ {MAX_EPISODES}</span></span>
          </div>
          <div className="flex flex-col items-center px-4">
            <span className="text-xs text-slate-400 font-semibold tracking-wider">CUMULATIVE REWARD</span>
            <span className={`text-xl font-mono font-bold ${cumulativeReward >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {cumulativeReward > 0 ? '+' : ''}{cumulativeReward}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent State Panel */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Activity className="w-32 h-32" />
          </div>
          
          <h3 className="font-semibold text-slate-300 flex items-center gap-2 uppercase tracking-wider text-sm mb-2">
            <Target className="w-4 h-4 text-[#7C3AED]" /> Environment State
          </h3>
          
          <div className="grid grid-cols-2 gap-4 relative z-10">
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
              <div className="text-xs text-slate-500 flex items-center gap-1 mb-1"><MapPin className="w-3 h-3"/> Warehouse</div>
              <div className="font-mono text-purple-400 font-medium">{currentState.warehouse}</div>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
              <div className="text-xs text-slate-500 flex items-center gap-1 mb-1"><Package className="w-3 h-3"/> Product</div>
              <div className="font-mono text-purple-400 font-medium">{currentState.product}</div>
            </div>
            
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 col-span-2">
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Current Stock</div>
                  <div className="text-2xl font-mono text-white font-bold">{currentState.stockLevel}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 mb-1">Demand / Day</div>
                  <div className="text-lg font-mono text-blue-400">{currentState.demandForecast}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 mb-1">Est. Days Left</div>
                  <div className={`text-lg font-mono font-bold ${currentState.daysToStockout < 3 ? 'text-red-400' : 'text-green-400'}`}>
                    {currentState.daysToStockout}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Taken Panel */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 flex flex-col justify-center items-center relative overflow-hidden transition-all duration-300">
          <h3 className="absolute top-5 left-5 font-semibold text-slate-300 flex items-center gap-2 uppercase tracking-wider text-sm mb-2">
            <Zap className="w-4 h-4 text-[#7C3AED]" /> Agent Action
          </h3>

          {!currentAction ? (
             <div className="text-slate-500 italic mt-8">Waiting for simulation to start...</div>
          ) : (
            <div key={episode} className="animate-in fade-in zoom-in duration-300 flex flex-col items-center text-center mt-6 w-full">
               <div className={`text-4xl font-black mb-2 tracking-tight flex items-center gap-3 ${currentAction.type === 'REORDER' ? 'text-[#7C3AED]' : 'text-slate-300'}`}>
                 {currentAction.type === 'REORDER' ? <Inbox className="w-8 h-8" /> : <Package className="w-8 h-8"/>}
                 {currentAction.type} {currentAction.type === 'REORDER' && currentAction.amount}
               </div>
               
               <div className="text-sm bg-slate-900/80 px-4 py-2 rounded-md border border-slate-700 text-slate-300 mb-4 max-w-full truncate text-ellipsis">
                 <span className="font-semibold text-slate-400">Reason:</span> {currentAction.reason}
               </div>

               <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-lg ${currentAction.reward > 0 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                 Reward: {currentAction.reward > 0 ? '+' : ''}{currentAction.reward}
               </div>
            </div>
          )}
        </div>

        {/* Controls Panel */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 flex flex-col justify-center gap-5">
           <h3 className="font-semibold text-slate-300 flex items-center gap-2 uppercase tracking-wider text-sm">
            <Settings className="w-4 h-4 text-[#7C3AED]" /> Controls
           </h3>
           
           <div className="flex gap-3 mt-1">
             <button 
                onClick={() => setIsRunning(!isRunning)}
                disabled={episode >= MAX_EPISODES}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${
                  isRunning 
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50' 
                    : 'bg-[#7C3AED] text-white hover:bg-[#6c30d9] shadow-lg shadow-purple-900/20 border border-[#8B5CF6]/50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isRunning ? <><Pause className="w-5 h-5"/> Pause</> : <><Play className="w-5 h-5"/> {episode === 0 ? 'Start Training' : 'Resume'}</>}
             </button>
             
             <button 
                onClick={handleReset}
                className="px-4 bg-slate-700 text-slate-300 hover:text-white hover:bg-slate-600 rounded-lg flex items-center justify-center transition-all border border-slate-600"
                title="Reset Agent"
              >
                <RotateCcw className="w-5 h-5" />
             </button>
           </div>

           <div className="space-y-3 pt-2">
             <div className="flex justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
               <span>Sim Speed</span>
               <span>{speed === 1000 ? 'Slow' : speed === 600 ? 'Medium' : speed === 200 ? 'Fast' : 'Custom'}</span>
             </div>
             <input 
               type="range" 
               min="100" 
               max="1500" 
               step="100"
               value={2000 - speed} // Invert slider for intuitive feel (right = faster = lower ms)
               onChange={(e) => setSpeed(2000 - parseInt(e.target.value))}
               className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#7C3AED]"
             />
             <div className="flex justify-between text-[10px] text-slate-500">
               <span>Slow</span>
               <span>Fast</span>
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-96">
        {/* Learning Curve Chart */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 flex flex-col">
          <h3 className="font-semibold text-slate-300 flex items-center gap-2 uppercase tracking-wider text-sm mb-4">
            <TrendingUp className="w-4 h-4 text-[#7C3AED]" /> Learning Curve (Cumulative Reward)
          </h3>
          <div className="flex-1 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="episode" 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `${val > 0 ? '+' : ''}${val}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                  itemStyle={{ color: '#c084fc', fontWeight: 'bold' }}
                />
                {/* Visual rendering of the learning line */}
                <Line 
                  type="monotone" 
                  dataKey="reward" 
                  stroke={THEME_COLOR} 
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: THEME_COLOR, stroke: '#0f172a', strokeWidth: 2 }}
                  animationDuration={300}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Decision Log Table */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 flex flex-col overflow-hidden">
          <h3 className="font-semibold text-slate-300 flex items-center gap-2 uppercase tracking-wider text-sm mb-4">
            <Activity className="w-4 h-4 text-[#7C3AED]" /> Decision Log
          </h3>
          
          <div className="flex-1 overflow-x-auto overflow-y-auto pr-2 custom-scrollbar">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 bg-slate-900/50 uppercase sticky top-0 backdrop-blur-sm z-10 hidden sm:table-header-group">
                <tr>
                  <th className="px-3 py-2 rounded-tl-lg font-medium">Ep</th>
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium">Action</th>
                  <th className="px-3 py-2 rounded-tr-lg font-medium text-right">Reward</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-slate-500 py-10 italic border-t border-slate-700/50">
                      No simulations run yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30 transition-colors animate-in slide-in-from-top-2">
                      <td className="px-3 py-2.5 font-mono text-slate-400 whitespace-nowrap">#{log.id}</td>
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-slate-300">{log.product}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{log.warehouse}</div>
                      </td>
                      <td className="px-3 py-2.5">
                         <div className={`font-semibold ${log.action.includes('REORDER') ? 'text-[#7C3AED]' : 'text-slate-400'}`}>
                           {log.action}
                         </div>
                         <div className="text-xs text-slate-500 max-w-[150px] truncate" title={log.reason}>
                            {log.reason}
                         </div>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold">
                        <span className={log.reward > 0 ? 'text-green-400' : 'text-red-400'}>
                          {log.reward > 0 ? '+' : ''}{log.reward}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
