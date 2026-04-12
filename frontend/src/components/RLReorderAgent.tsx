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

const THEME_COLOR = '#7b41b3';
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
    <div className="w-full min-h-full bg-white text-[#2d3339] p-8 rounded-[2rem] shadow-sm flex flex-col gap-8 font-sans border border-[#acb3ba]/10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-[#ebeef4] pb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3 text-[#2d3339]">
            <Brain className="w-10 h-10 text-[#7b41b3]" />
            RL Reorder Agent
          </h2>
          <p className="text-[#596067] text-base mt-2">
            Simulating Q-Learning inventory decisions
          </p>
        </div>

        <div className="flex items-center gap-6 bg-[#f2f3f8] p-4 rounded-2xl border border-[#acb3ba]/10">
          <div className="flex flex-col items-center px-4 border-r border-[#acb3ba]/30">
            <span className="text-[10px] text-[#596067] font-bold uppercase tracking-widest mb-1">EPISODE</span>
            <span className="text-2xl font-mono font-bold text-[#2d3339]">{episode} <span className="text-[#757b83] text-sm">/ {MAX_EPISODES}</span></span>
          </div>
          <div className="flex flex-col items-center px-4">
            <span className="text-[10px] text-[#596067] font-bold uppercase tracking-widest mb-1">CUMULATIVE REWARD</span>
            <span className={`text-2xl font-mono font-bold ${cumulativeReward >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {cumulativeReward > 0 ? '+' : ''}{cumulativeReward}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent State Panel */}
        <div className="bg-white rounded-3xl p-6 border border-[#acb3ba]/10 shadow-sm flex flex-col gap-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
            <Activity className="w-32 h-32 text-[#7b41b3]" />
          </div>
          
          <h3 className="font-bold text-[#596067] flex items-center gap-2 uppercase tracking-widest text-xs mb-1">
            <Target className="w-4 h-4 text-[#7b41b3]" /> Environment State
          </h3>
          
          <div className="grid grid-cols-2 gap-4 relative z-10">
            <div className="bg-[#f0dbff]/30 p-4 rounded-2xl border border-[#7b41b3]/10">
              <div className="text-[10px] text-[#757b83] font-bold uppercase tracking-tight flex items-center gap-1.5 mb-1.5"><MapPin className="w-3.5 h-3.5"/> Warehouse</div>
              <div className="font-mono text-[#7b41b3] font-bold text-lg">{currentState.warehouse}</div>
            </div>
            <div className="bg-[#f0dbff]/30 p-4 rounded-2xl border border-[#7b41b3]/10">
              <div className="text-[10px] text-[#757b83] font-bold uppercase tracking-tight flex items-center gap-1.5 mb-1.5"><Package className="w-3.5 h-3.5"/> Product</div>
              <div className="font-mono text-[#7b41b3] font-bold text-lg">{currentState.product}</div>
            </div>
            
            <div className="bg-[#f2f3f8] p-5 rounded-2xl border border-[#acb3ba]/10 col-span-2">
              <div className="flex justify-between items-end gap-2">
                <div>
                  <div className="text-[10px] text-[#757b83] font-bold uppercase mb-1">Current Stock</div>
                  <div className="text-3xl font-mono text-[#2d3339] font-black">{currentState.stockLevel}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-[#757b83] font-bold uppercase mb-1">Demand / Day</div>
                  <div className="text-xl font-mono text-blue-600 font-bold">{currentState.demandForecast}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-[#757b83] font-bold uppercase mb-1">Est. Days Left</div>
                  <div className={`text-xl font-mono font-black ${currentState.daysToStockout < 3 ? 'text-red-500' : 'text-green-600'}`}>
                    {currentState.daysToStockout}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Taken Panel */}
        <div className="bg-white rounded-3xl p-6 border border-[#acb3ba]/10 shadow-sm flex flex-col justify-center items-center relative overflow-hidden transition-all duration-300 group">
          <h3 className="absolute top-6 left-6 font-bold text-[#596067] flex items-center gap-2 uppercase tracking-widest text-xs mb-1">
            <Zap className="w-4 h-4 text-[#7b41b3]" /> Agent Action
          </h3>

          {!currentAction ? (
             <div className="text-[#757b83] italic mt-8 font-medium">Waiting for simulation to start...</div>
          ) : (
            <div key={episode} className="animate-in fade-in zoom-in duration-300 flex flex-col items-center text-center mt-6 w-full">
               <div className={`text-5xl font-black mb-3 tracking-tight flex items-center gap-4 ${currentAction.type === 'REORDER' ? 'text-[#7b41b3]' : 'text-[#2d3339]'}`}>
                 {currentAction.type === 'REORDER' ? <Inbox className="w-10 h-10" /> : <Package className="w-10 h-10"/>}
                 {currentAction.type} {currentAction.type === 'REORDER' && currentAction.amount}
               </div>
               
               <div className="text-sm bg-[#f2f3f8] px-5 py-3 rounded-2xl border border-[#acb3ba]/10 text-[#596067] mb-5 max-w-full font-medium shadow-inner">
                 <span className="font-bold text-[#2d3339]">Reason:</span> {currentAction.reason}
               </div>

               <div className={`inline-flex items-center gap-3 px-6 py-2 rounded-2xl font-black text-xl shadow-sm ${currentAction.reward > 0 ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                 Reward: {currentAction.reward > 0 ? '+' : ''}{currentAction.reward}
               </div>
            </div>
          )}
        </div>

        {/* Controls Panel */}
        <div className="bg-white rounded-3xl p-6 border border-[#acb3ba]/10 shadow-sm flex flex-col justify-center gap-6">
           <h3 className="font-bold text-[#596067] flex items-center gap-2 uppercase tracking-widest text-xs">
            <Settings className="w-4 h-4 text-[#7b41b3]" /> Controls
           </h3>
           
           <div className="flex gap-4">
             <button 
                onClick={() => setIsRunning(!isRunning)}
                disabled={episode >= MAX_EPISODES}
                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-bold transition-all shadow-md ${
                  isRunning 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200' 
                    : 'bg-[#7b41b3] text-white hover:bg-[#6f34a5] border border-[#7b41b3]/20'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isRunning ? <><Pause className="w-5 h-5"/> Pause</> : <><Play className="w-5 h-5"/> {episode === 0 ? 'Start Training' : 'Resume'}</>}
             </button>
             
             <button 
                onClick={handleReset}
                className="px-5 bg-[#f2f3f8] text-[#596067] hover:text-[#2d3339] hover:bg-[#e1e2eb] rounded-2xl flex items-center justify-center transition-all border border-[#acb3ba]/20 shadow-sm"
                title="Reset Agent"
              >
                <RotateCcw className="w-6 h-6" />
             </button>
           </div>

           <div className="space-y-4 pt-2">
             <div className="flex justify-between text-xs text-[#596067] font-black uppercase tracking-widest">
                <span>Sim Speed</span>
                <span className="text-[#7b41b3]">{speed === 1000 ? 'Slow' : speed === 600 ? 'Medium' : speed === 200 ? 'Fast' : 'Custom'}</span>
             </div>
             <input 
               type="range" 
               min="100" 
               max="1500" 
               step="100"
               value={2000 - speed} 
               onChange={(e) => setSpeed(2000 - parseInt(e.target.value))}
               className="w-full h-2 bg-[#f2f3f8] rounded-2xl appearance-none cursor-pointer accent-[#7b41b3] border border-[#acb3ba]/10"
             />
             <div className="flex justify-between text-[10px] text-[#757b83] font-bold uppercase">
               <span>Slow</span>
               <span>Fast</span>
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[500px]">
        {/* Learning Curve Chart */}
        <div className="bg-white rounded-[2rem] p-8 border border-[#acb3ba]/10 shadow-sm flex flex-col">
          <h3 className="font-bold text-[#596067] flex items-center gap-2 uppercase tracking-widest text-xs mb-8">
            <TrendingUp className="w-4 h-4 text-[#7b41b3]" /> Learning Curve
          </h3>
          <div className="flex-1 w-full min-h-[350px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ebeef4" vertical={false} />
                <XAxis 
                  dataKey="episode" 
                  stroke="#757b83" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#757b83" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `${val > 0 ? '+' : ''}${val}`}
                  dx={-5}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#ebeef4', borderRadius: '1rem', color: '#2d3339', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#7b41b3', fontWeight: 'bold' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="reward" 
                  stroke={THEME_COLOR} 
                  strokeWidth={4}
                  dot={false}
                  activeDot={{ r: 8, fill: THEME_COLOR, stroke: '#ffffff', strokeWidth: 3 }}
                  animationDuration={300}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Decision Log Table */}
        <div className="bg-white rounded-[2rem] p-8 border border-[#acb3ba]/10 shadow-sm flex flex-col overflow-hidden">
          <h3 className="font-bold text-[#596067] flex items-center gap-2 uppercase tracking-widest text-xs mb-8">
            <Activity className="w-4 h-4 text-[#7b41b3]" /> Decision Log
          </h3>
          
          <div className="flex-1 overflow-x-auto overflow-y-auto pr-2 custom-scrollbar min-h-[350px]">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-[#596067] bg-[#f2f3f8] uppercase sticky top-0 backdrop-blur-sm z-10 hidden sm:table-header-group">
                <tr>
                  <th className="px-4 py-3 rounded-tl-2xl font-bold tracking-widest">Ep</th>
                  <th className="px-4 py-3 font-bold tracking-widest">Product</th>
                  <th className="px-4 py-3 font-bold tracking-widest">Action</th>
                  <th className="px-4 py-3 rounded-tr-2xl font-bold tracking-widest text-right">Reward</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-[#757b83] py-20 italic font-medium">
                      No simulations run yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-[#ebeef4] last:border-0 hover:bg-[#f9f9fc] transition-all animate-in slide-in-from-top-2">
                       <td className="px-4 py-4 font-mono text-[#757b83] font-bold">#{log.id}</td>
                       <td className="px-4 py-4">
                        <div className="font-bold text-[#2d3339]">{log.product}</div>
                        <div className="text-[10px] text-[#757b83] font-mono font-bold uppercase">{log.warehouse}</div>
                      </td>
                      <td className="px-4 py-4">
                         <div className={`font-black uppercase tracking-tight ${log.action.includes('REORDER') ? 'text-[#7b41b3]' : 'text-[#757b83]'}`}>
                           {log.action}
                         </div>
                         <div className="text-[11px] text-[#596067] font-medium leading-tight mt-0.5">
                            {log.reason}
                         </div>
                      </td>
                      <td className="px-4 py-4 text-right font-mono font-black">
                        <span className={log.reward > 0 ? 'text-green-600' : 'text-red-500'}>
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
