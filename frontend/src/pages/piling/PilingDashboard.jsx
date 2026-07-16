import React, { useEffect, useState } from 'react';
import { Target, DollarSign, Activity, Clock } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, ComposedChart, Line
} from 'recharts';
import api from '../../lib/axios';

import MetricCard from '../../components/ui/MetricCard';
import ChartContainer from '../../components/ui/ChartContainer';

const PilingDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/piling-dashboard/summary');
        
        // Merge API data with mock data for missing visualizations
        setData({
          piles_per_day: response.data.average_depth || 14,
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
          ]
        });
      } catch (error) {
        console.warn("Using mock data for Piling Dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading || !data) {
    return <div className="p-8 text-center text-gray-400">Loading Dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Piling Operations</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Avg Piles / Day" value={data.piles_per_day} icon={Target} trend={1.2} trendLabel="vs last week" />
        <MetricCard title="Cost Per Pile" value={`$${data.cost_per_pile}`} icon={DollarSign} trend={-3.5} trendLabel="vs last month" trendUpIsGood={false} />
        <MetricCard title="Rig Utilization" value={`${data.rig_utilization}%`} icon={Activity} trend={5.0} trendLabel="vs last month" />
        <MetricCard title="Delay Days" value={data.delay_days} icon={Clock} trend={-1} trendLabel="vs last month" trendUpIsGood={false} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer title="Daily Bore Count (This Week)" height={300}>
          <BarChart data={data.daily_bored} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
            <XAxis dataKey="day" stroke="#A1A1AA" tick={{ fill: '#A1A1AA' }} axisLine={false} tickLine={false} />
            <YAxis stroke="#A1A1AA" tick={{ fill: '#A1A1AA' }} axisLine={false} tickLine={false} />
            <RechartsTooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#27272A', color: '#FFF' }} cursor={{ fill: '#27272A', opacity: 0.4 }} />
            <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>

        <ChartContainer title="Cumulative Depth Progress (Meters)" height={300}>
          <AreaChart data={data.depth_progress} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="colorDepth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
            <XAxis dataKey="week" stroke="#A1A1AA" tick={{ fill: '#A1A1AA' }} axisLine={false} tickLine={false} />
            <YAxis stroke="#A1A1AA" tick={{ fill: '#A1A1AA' }} axisLine={false} tickLine={false} />
            <RechartsTooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#27272A', color: '#FFF' }} />
            <Area type="monotone" dataKey="depth" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorDepth)" />
          </AreaChart>
        </ChartContainer>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6">
        <ChartContainer title="Planned vs Actual Piles (Monthly)" height={350}>
          <ComposedChart data={data.planned_vs_actual} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
            <XAxis dataKey="month" stroke="#A1A1AA" tick={{ fill: '#A1A1AA' }} axisLine={false} tickLine={false} />
            <YAxis stroke="#A1A1AA" tick={{ fill: '#A1A1AA' }} axisLine={false} tickLine={false} />
            <RechartsTooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#27272A', color: '#FFF' }} cursor={{ fill: '#27272A', opacity: 0.4 }} />
            <Bar dataKey="actual" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Actual" />
            <Line type="monotone" dataKey="planned" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} name="Planned Target" />
          </ComposedChart>
        </ChartContainer>
      </div>
    </div>
  );
};

export default PilingDashboard;
