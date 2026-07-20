import React, { useEffect, useState } from 'react';
import { Target, DollarSign, Activity, Clock } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, ComposedChart, Line, Cell, Legend
} from 'recharts';
import api from '../../lib/axios';
import MetricCard from '../../components/ui/MetricCard';
import ChartContainer from '../../components/ui/ChartContainer';
import { SkeletonKPIRow, SkeletonChart } from '../../components/ui/Skeletons';

const MOCK_DATA = {
  piles_per_day: 14,
  cost_per_pile: 1250,
  rig_utilization: 82.5,
  delay_days: 3,
  daily_bored: [
    { day: 'Mon', count: 12 },
    { day: 'Tue', count: 15 },
    { day: 'Wed', count: 14 },
    { day: 'Thu', count: 16 },
    { day: 'Fri', count: 18 },
    { day: 'Sat', count: 10 },
  ],
  depth_progress: [
    { week: 'W1', depth: 400 },
    { week: 'W2', depth: 950 },
    { week: 'W3', depth: 1600 },
    { week: 'W4', depth: 2400 },
  ],
  planned_vs_actual: [
    { month: 'Jan', planned: 200, actual: 180 },
    { month: 'Feb', planned: 220, actual: 230 },
    { month: 'Mar', planned: 250, actual: 245 },
    { month: 'Apr', planned: 250, actual: 210 },
    { month: 'May', planned: 280, actual: 275 },
    { month: 'Jun', planned: 300, actual: 290 },
  ],
  cost_variance: [
    { project: 'Harbor Bridge', budget: 480000, actual: 512000 },
    { project: 'North Highway', budget: 320000, actual: 298000 },
    { project: 'Metro Station', budget: 650000, actual: 645000 },
    { project: 'Riverside Tower', budget: 280000, actual: 310000 },
    { project: 'Airport Expansion', budget: 920000, actual: 885000 },
  ],
};

const PilingDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get('/piling-dashboard/summary');
        setData({
          ...MOCK_DATA,
          piles_per_day: res.data.average_depth || MOCK_DATA.piles_per_day,
        });
      } catch {
        setData(MOCK_DATA);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonKPIRow />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart height={280} title />
          <SkeletonChart height={280} title />
        </div>
        <SkeletonChart height={320} title />
        <SkeletonChart height={300} title />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Piling Operations</h1>
        <p className="text-sm text-gray-500 mt-1">Daily bore count, depth progress &amp; project cost tracking</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Avg Piles / Day" value={data.piles_per_day} icon={Target} trend={1.2} trendLabel="vs last week" />
        <MetricCard title="Cost Per Pile" value={`$${data.cost_per_pile.toLocaleString()}`} icon={DollarSign} trend={-3.5} trendLabel="vs last month" trendUpIsGood={false} />
        <MetricCard title="Rig Utilization" value={`${data.rig_utilization}%`} icon={Activity} trend={5.0} trendLabel="vs last month" />
        <MetricCard title="Delay Days" value={data.delay_days} icon={Clock} trend={-1} trendLabel="vs last month" trendUpIsGood={false} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer title="Daily Bore Count (This Week)" height={280}>
          <BarChart data={data.daily_bored} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
            <XAxis dataKey="day" stroke="#A1A1AA" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#A1A1AA" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} />
            <RechartsTooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#27272A', color: '#FFF' }} cursor={{ fill: '#27272A', opacity: 0.3 }} />
            <Bar dataKey="count" name="Piles Bored" radius={[4, 4, 0, 0]}>
              {data.daily_bored.map((entry, i) => (
                <Cell key={i} fill={entry.count >= 16 ? '#10B981' : entry.count >= 12 ? '#3B82F6' : '#F59E0B'} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>

        <ChartContainer title="Cumulative Depth Progress (m)" height={280}>
          <AreaChart data={data.depth_progress} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="colorDepth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
            <XAxis dataKey="week" stroke="#A1A1AA" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#A1A1AA" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} />
            <RechartsTooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#27272A', color: '#FFF' }} formatter={(v) => [`${v}m`, 'Depth']} />
            <Area type="monotone" dataKey="depth" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorDepth)" />
          </AreaChart>
        </ChartContainer>
      </div>

      {/* Planned vs Actual */}
      <ChartContainer title="Planned vs Actual Piles (Monthly)" height={320}>
        <ComposedChart data={data.planned_vs_actual} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
          <XAxis dataKey="month" stroke="#A1A1AA" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis stroke="#A1A1AA" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} />
          <RechartsTooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#27272A', color: '#FFF' }} cursor={{ fill: '#27272A', opacity: 0.3 }} />
          <Legend wrapperStyle={{ color: '#A1A1AA', fontSize: 12 }} />
          <Bar dataKey="actual" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Actual" />
          <Line type="monotone" dataKey="planned" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 4 }} name="Planned Target" />
        </ComposedChart>
      </ChartContainer>

      {/* Cost Variance */}
      <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-medium text-white mb-6">Cost Variance by Project</h3>
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.cost_variance} layout="vertical" margin={{ top: 5, right: 40, bottom: 5, left: 120 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272A" horizontal={false} />
              <XAxis type="number" stroke="#A1A1AA" tick={{ fill: '#A1A1AA', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
              <YAxis type="category" dataKey="project" stroke="#A1A1AA" tick={{ fill: '#A1A1AA', fontSize: 10 }} axisLine={false} tickLine={false} width={115} />
              <RechartsTooltip
                contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#27272A', color: '#FFF' }}
                cursor={{ fill: '#27272A', opacity: 0.3 }}
                formatter={(v, name) => [`$${v.toLocaleString()}`, name]}
              />
              <Legend wrapperStyle={{ color: '#A1A1AA', fontSize: 12 }} />
              <Bar dataKey="budget" name="Budget" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              <Bar dataKey="actual" name="Actual" radius={[0, 4, 4, 0]}>
                {data.cost_variance.map((entry, i) => (
                  <Cell key={i} fill={entry.actual > entry.budget ? '#EF4444' : '#10B981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          <span className="inline-flex items-center gap-1.5 mr-4"><span className="w-2 h-2 rounded-sm bg-healthy inline-block" /> Under budget</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-alert inline-block" /> Over budget</span>
        </p>
      </div>
    </div>
  );
};

export default PilingDashboard;
