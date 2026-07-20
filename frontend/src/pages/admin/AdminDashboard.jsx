import React, { useEffect, useState } from 'react';
import { DollarSign, Briefcase, Activity, TrendingDown } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import api from '../../lib/axios';
import MetricCard from '../../components/ui/MetricCard';
import ChartContainer from '../../components/ui/ChartContainer';
import DataTable from '../../components/ui/DataTable';
import { SkeletonKPIRow, SkeletonChart, SkeletonTable } from '../../components/ui/Skeletons';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
const VERTICAL_COLORS = { Rental: '#3B82F6', Piling: '#10B981', 'O&M': '#F59E0B' };

const MOCK = {
  total_revenue: 1250000,
  active_projects: 42,
  equipment_utilization_percent: 78.5,
  outstanding_receivables: 320000,
};

const MOCK_REVENUE_TREND = [
  { month: 'Jan', Rental: 60000, Piling: 40000, 'O&M': 25000 },
  { month: 'Feb', Rental: 72000, Piling: 48000, 'O&M': 28000 },
  { month: 'Mar', Rental: 68000, Piling: 45000, 'O&M': 32000 },
  { month: 'Apr', Rental: 85000, Piling: 55000, 'O&M': 35000 },
  { month: 'May', Rental: 91000, Piling: 58000, 'O&M': 38000 },
  { month: 'Jun', Rental: 102000, Piling: 63000, 'O&M': 42000 },
];

const MOCK_PIE = [
  { name: 'Rental', value: 478000 },
  { name: 'Piling', value: 309000 },
  { name: 'O&M', value: 200000 },
];

const MOCK_AGING = [
  { range: '0–30 days', amount: 150000 },
  { range: '31–60 days', amount: 100000 },
  { range: '61–90 days', amount: 50000 },
  { range: '>90 days', amount: 20000 },
];

const MOCK_CLIENT_PROFIT = [
  { client_name: 'Alpha Construction', profit: 185000 },
  { client_name: 'BuildRight LLC', profit: 142000 },
  { client_name: 'Horizon Infra', profit: 128000 },
  { client_name: 'Gulf Projects', profit: 110000 },
  { client_name: 'Prime Piling Co.', profit: 98000 },
  { client_name: 'SkyBuild Group', profit: 87000 },
  { client_name: 'TerraWorks', profit: 75000 },
  { client_name: 'Landmark Estates', profit: 64000 },
  { client_name: 'Nexus Industrial', profit: 55000 },
  { client_name: 'Metro Foundations', profit: 48000 },
];

const MOCK_USERS = [
  { id: 1, username: 'System Admin', email: 'admin@serosops.com', role: 'admin', status: 'Active' },
  { id: 2, username: 'John Rental', email: 'john@serosops.com', role: 'rental_manager', status: 'Active' },
  { id: 3, username: 'Sarah Piling', email: 'sarah@serosops.com', role: 'piling_manager', status: 'Active' },
  { id: 4, username: 'Mike O&M', email: 'mike@serosops.com', role: 'om_manager', status: 'Inactive' },
];

const formatCurrency = (val) => `$${(val / 1000).toFixed(0)}k`;

const AdminDashboard = () => {
  const [kpis, setKpis] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState(MOCK_REVENUE_TREND);
  const [revenuePie, setRevenuePie] = useState(MOCK_PIE);
  const [aging, setAging] = useState(MOCK_AGING);
  const [clientProfit, setClientProfit] = useState(MOCK_CLIENT_PROFIT);
  const [users, setUsers] = useState(MOCK_USERS);
  const [loading, setLoading] = useState(true);
  const [trendPeriod, setTrendPeriod] = useState('monthly');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [kpiRes, pieRes, agingRes, clientRes, usersRes] = await Promise.allSettled([
          api.get('/admin-dashboard/metrics'),
          api.get('/admin-dashboard/charts/revenue-pie'),
          api.get('/admin-dashboard/charts/receivables-aging'),
          api.get('/admin-dashboard/charts/client-profit'),
          api.get('/admin-dashboard/users'),
        ]);

        if (kpiRes.status === 'fulfilled') setKpis(kpiRes.value.data);
        if (pieRes.status === 'fulfilled' && pieRes.value.data?.data?.length) {
          setRevenuePie(pieRes.value.data.data.map(d => ({ name: d.vertical, value: d.revenue })));
        }
        if (agingRes.status === 'fulfilled' && agingRes.value.data) {
          const d = agingRes.value.data;
          setAging([
            { range: '0–30 days', amount: d.days_0_30 },
            { range: '31–60 days', amount: d.days_31_60 },
            { range: '61–90 days', amount: d.days_61_90 },
            { range: '>90 days', amount: d.days_90_plus },
          ]);
        }
        if (clientRes.status === 'fulfilled' && clientRes.value.data?.data?.length) {
          setClientProfit(clientRes.value.data.data);
        }
        if (usersRes.status === 'fulfilled' && usersRes.value.data?.length) {
          setUsers(usersRes.value.data);
        }
      } catch {
        // Fallback to mock — already set as defaults
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const data = kpis || MOCK;

  const userColumns = [
    {
      header: 'User',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold uppercase">
            {row.username?.charAt(0)}
          </div>
          <span className="text-white">{row.username}</span>
        </div>
      )
    },
    { header: 'Email', render: (row) => <span className="text-gray-400 text-xs">{row.email}</span> },
    { header: 'Role', render: (row) => <span className="capitalize text-gray-300 text-xs">{row.role?.replace(/_/g, ' ')}</span> },
    {
      header: 'Status',
      render: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${row.status === 'Active' ? 'bg-healthy/20 text-healthy' : 'bg-gray-700 text-gray-400'}`}>
          {row.status}
        </span>
      )
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 skeleton rounded" />
        </div>
        <SkeletonKPIRow />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><SkeletonChart height={350} title /></div>
          <SkeletonChart height={350} title />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart height={300} title />
          <SkeletonTable rows={4} cols={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Company Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Cross-vertical operational summary</p>
        </div>
        <div className="text-xs text-gray-500">
          Updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Revenue (YTD)" value={`$${Number(data.total_revenue).toLocaleString()}`} icon={DollarSign} trend={12.5} trendLabel="vs last year" />
        <MetricCard title="Avg Equipment Utilization" value={`${Number(data.equipment_utilization_percent || 0).toFixed(1)}%`} icon={Activity} trend={-2.1} trendLabel="vs last month" />
        <MetricCard title="Active Projects" value={data.active_projects} icon={Briefcase} trend={5.0} trendLabel="vs last month" />
        <MetricCard title="Outstanding Receivables" value={`$${Number(data.outstanding_receivables).toLocaleString()}`} icon={TrendingDown} trend={-15.0} trendLabel="vs last month" trendUpIsGood={false} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-white">Revenue Trend</h3>
              <div className="flex gap-1 bg-background rounded-md p-0.5">
                {['daily', 'monthly', 'yearly'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setTrendPeriod(p)}
                    className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors ${trendPeriod === p ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1" style={{ minHeight: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                  <XAxis dataKey="month" stroke="#A1A1AA" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#A1A1AA" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={formatCurrency} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#27272A', color: '#FFF' }} formatter={(v) => `$${v.toLocaleString()}`} />
                  <Legend wrapperStyle={{ color: '#A1A1AA', fontSize: 12 }} />
                  <Line type="monotone" dataKey="Rental" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Piling" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="O&M" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <ChartContainer title="Revenue by Vertical" height={350}>
          <PieChart>
            <Pie
              data={revenuePie}
              cx="50%"
              cy="42%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {revenuePie.map((entry, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#27272A', color: '#FFF' }} formatter={(v) => `$${v.toLocaleString()}`} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ color: '#A1A1AA', fontSize: 12 }} />
          </PieChart>
        </ChartContainer>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receivables Aging */}
        <ChartContainer title="Receivables Aging" height={280}>
          <BarChart data={aging} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
            <XAxis dataKey="range" stroke="#A1A1AA" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#A1A1AA" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={formatCurrency} />
            <RechartsTooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#27272A', color: '#FFF' }} cursor={{ fill: '#27272A', opacity: 0.4 }} formatter={(v) => `$${v.toLocaleString()}`} />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
              {aging.map((_, i) => (
                <Cell key={i} fill={i >= 2 ? '#EF4444' : '#F59E0B'} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>

        {/* Client Profitability */}
        <ChartContainer title="Top 10 Client Revenue" height={280}>
          <BarChart data={clientProfit} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272A" horizontal={false} />
            <XAxis type="number" stroke="#A1A1AA" tick={{ fill: '#A1A1AA', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatCurrency} />
            <YAxis type="category" dataKey="client_name" stroke="#A1A1AA" tick={{ fill: '#A1A1AA', fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
            <RechartsTooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#27272A', color: '#FFF' }} cursor={{ fill: '#27272A', opacity: 0.4 }} formatter={(v) => `$${v.toLocaleString()}`} />
            <Bar dataKey="profit" name="Revenue" fill="#3B82F6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </div>

      {/* Users Table */}
      <div>
        <DataTable title="System Users" columns={userColumns} data={users} />
      </div>
    </div>
  );
};

export default AdminDashboard;
