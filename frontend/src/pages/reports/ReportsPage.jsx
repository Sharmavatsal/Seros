import React, { useState, useEffect } from 'react';
import { Download, FileText, BarChart2, Calendar, Filter } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/ToastContext';
import { SkeletonChart, SkeletonTable } from '../../components/ui/Skeletons';

const ROLE_VERTICAL = {
  admin: null,
  rental_manager: 'rental',
  piling_manager: 'piling',
  om_manager: 'om',
};

const MOCK_DATA = {
  daily: [
    { date: '2026-07-14', revenue: 12400, count: 3 },
    { date: '2026-07-15', revenue: 18200, count: 5 },
    { date: '2026-07-16', revenue: 9800, count: 2 },
    { date: '2026-07-17', revenue: 22100, count: 6 },
    { date: '2026-07-18', revenue: 15600, count: 4 },
    { date: '2026-07-19', revenue: 19800, count: 5 },
    { date: '2026-07-20', revenue: 8400, count: 2 },
  ],
  monthly: [
    { date: '2026-01', revenue: 85000, count: 18 },
    { date: '2026-02', revenue: 92000, count: 22 },
    { date: '2026-03', revenue: 78000, count: 15 },
    { date: '2026-04', revenue: 110000, count: 28 },
    { date: '2026-05', revenue: 125000, count: 31 },
    { date: '2026-06', revenue: 138000, count: 35 },
  ],
  yearly: [
    { date: '2022', revenue: 820000, count: 180 },
    { date: '2023', revenue: 940000, count: 210 },
    { date: '2024', revenue: 1050000, count: 235 },
    { date: '2025', revenue: 1230000, count: 275 },
    { date: '2026', revenue: 628000, count: 149 },
  ],
};

const formatCurrency = (v) => `$${Number(v || 0).toLocaleString()}`;

const ReportsPage = () => {
  const user = useAuthStore((s) => s.user);
  const toast = useToast();
  const userVertical = ROLE_VERTICAL[user?.role];

  const [timeframe, setTimeframe] = useState('monthly');
  const [vertical, setVertical] = useState(userVertical || 'all');
  const [viewMode, setViewMode] = useState('graphical');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [exporting, setExporting] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = { timeframe };
      if (vertical !== 'all') params.vertical = vertical;
      const res = await api.get('/reports/data', { params });
      const rows = res.data.data || [];
      setData(rows.length ? rows.map(r => ({ date: r.date, revenue: r.metrics?.revenue || 0, count: r.metrics?.count || 0 })) : MOCK_DATA[timeframe]);
      setSummary(res.data.summary || null);
    } catch {
      setData(MOCK_DATA[timeframe]);
      setSummary({ total_records: 0, summary_metrics: { total_revenue: MOCK_DATA[timeframe].reduce((a, b) => a + b.revenue, 0) } });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, [timeframe, vertical]);

  const handleExport = async (format) => {
    setExporting(format);
    try {
      const params = { timeframe };
      if (vertical !== 'all') params.vertical = vertical;
      const res = await api.get(`/reports/export/${format}`, { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${vertical}_${timeframe}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`${format.toUpperCase()} exported successfully`);
    } catch {
      toast.error(`Failed to export ${format.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  };

  const totalRevenue = summary?.summary_metrics?.total_revenue || data.reduce((a, b) => a + b.revenue, 0);
  const totalCount = summary?.total_records || data.reduce((a, b) => a + b.count, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            {userVertical ? `${userVertical.charAt(0).toUpperCase() + userVertical.slice(1)} vertical` : 'All verticals'}
          </p>
        </div>

        {/* Export buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting === 'csv'}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border text-sm text-gray-300 hover:text-white hover:border-primary rounded-lg transition-colors disabled:opacity-50"
          >
            <Download size={15} />
            {exporting === 'csv' ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting === 'pdf'}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm rounded-lg transition-colors disabled:opacity-50"
          >
            <FileText size={15} />
            {exporting === 'pdf' ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        {/* Period selector */}
        <div className="flex gap-1 bg-surface border border-border rounded-lg p-1">
          {['daily', 'monthly', 'yearly'].map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${timeframe === t ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Calendar size={13} />
              {t}
            </button>
          ))}
        </div>

        {/* Vertical filter (admin only) */}
        {!userVertical && (
          <div className="flex gap-1 bg-surface border border-border rounded-lg p-1">
            {['all', 'rental', 'piling', 'om'].map((v) => (
              <button
                key={v}
                onClick={() => setVertical(v)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${vertical === v ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white'}`}
              >
                {v === 'all' ? 'All Verticals' : v}
              </button>
            ))}
          </div>
        )}

        {/* View toggle */}
        <div className="flex gap-1 bg-surface border border-border rounded-lg p-1 ml-auto">
          <button
            onClick={() => setViewMode('graphical')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${viewMode === 'graphical' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <BarChart2 size={14} />
            Graph
          </button>
          <button
            onClick={() => setViewMode('tabular')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${viewMode === 'tabular' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <Filter size={14} />
            Table
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), color: 'text-healthy' },
          { label: 'Total Transactions', value: totalCount.toLocaleString(), color: 'text-primary' },
          { label: 'Avg per Period', value: formatCurrency(data.length ? totalRevenue / data.length : 0), color: 'text-warning' },
          { label: 'Period', value: timeframe.charAt(0).toUpperCase() + timeframe.slice(1), color: 'text-gray-300' },
        ].map((item, i) => (
          <div key={i} className="bg-surface border border-border rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">{item.label}</p>
            <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Main content */}
      {loading ? (
        viewMode === 'graphical' ? <SkeletonChart height={380} title /> : <SkeletonTable rows={8} cols={3} />
      ) : viewMode === 'graphical' ? (
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-medium text-white mb-6 capitalize">
              {vertical === 'all' ? 'All Verticals' : vertical} — {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} Revenue
            </h3>
            <div style={{ height: 360 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                  <XAxis dataKey="date" stroke="#A1A1AA" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#A1A1AA" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#27272A', color: '#FFF' }} formatter={(v, n) => [n === 'revenue' ? `$${v.toLocaleString()}` : v, n === 'revenue' ? 'Revenue' : 'Transactions']} />
                  <Legend wrapperStyle={{ color: '#A1A1AA' }} />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-medium text-white mb-6">Transaction Volume</h3>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                  <XAxis dataKey="date" stroke="#A1A1AA" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#A1A1AA" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#27272A', color: '#FFF' }} cursor={{ fill: '#27272A', opacity: 0.3 }} />
                  <Bar dataKey="count" name="Transactions" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-base font-medium text-white capitalize">{timeframe} Report Data</h3>
            <span className="text-xs text-gray-500">{data.length} periods</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background/40">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg per Transaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-3 font-mono text-xs text-gray-300">{row.date}</td>
                    <td className="px-6 py-3 font-semibold text-white">{formatCurrency(row.revenue)}</td>
                    <td className="px-6 py-3 text-gray-400">{row.count}</td>
                    <td className="px-6 py-3 text-gray-400">{row.count ? formatCurrency(row.revenue / row.count) : '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-background/40">
                  <td className="px-6 py-3 text-sm font-semibold text-gray-300">Total</td>
                  <td className="px-6 py-3 text-sm font-bold text-white">{formatCurrency(totalRevenue)}</td>
                  <td className="px-6 py-3 text-sm font-semibold text-gray-300">{totalCount}</td>
                  <td className="px-6 py-3 text-sm text-gray-400">{totalCount ? formatCurrency(totalRevenue / totalCount) : '—'}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
