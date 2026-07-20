import React, { useEffect, useState } from 'react';
import { Activity, FileText, DollarSign, Fuel, AlertTriangle, Wrench } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';
import api from '../../lib/axios';
import MetricCard from '../../components/ui/MetricCard';
import ChartContainer from '../../components/ui/ChartContainer';
import DataTable from '../../components/ui/DataTable';
import { SkeletonKPIRow, SkeletonChart, SkeletonTable } from '../../components/ui/Skeletons';

const MOCK_DATA = {
  utilization_pct: 72.4,
  active_contracts: 18,
  monthly_revenue: 145000,
  fuel_consumption: 4200,
  revenue_trend: [
    { month: 'Jan', revenue: 110000 },
    { month: 'Feb', revenue: 125000 },
    { month: 'Mar', revenue: 120000 },
    { month: 'Apr', revenue: 135000 },
    { month: 'May', revenue: 140000 },
    { month: 'Jun', revenue: 145000 },
  ],
  fuel_trend: [
    { month: 'Jan', liters: 5100 },
    { month: 'Feb', liters: 4800 },
    { month: 'Mar', liters: 5300 },
    { month: 'Apr', liters: 4600 },
    { month: 'May', liters: 4400 },
    { month: 'Jun', liters: 4200 },
  ],
  breakdown_trend: [
    { month: 'Jan', incidents: 12 },
    { month: 'Feb', incidents: 8 },
    { month: 'Mar', incidents: 15 },
    { month: 'Apr', incidents: 6 },
    { month: 'May', incidents: 9 },
    { month: 'Jun', incidents: 5 },
  ],
  equipment_list: [
    { id: 'EQ-001', name: 'Excavator 20T', status: 'Rented', location: 'Site A', utilization: 94, insurance_exp: '2026-08-01' },
    { id: 'EQ-002', name: 'Crane 50T', status: 'Available', location: 'Yard', utilization: 0, insurance_exp: '2026-12-15' },
    { id: 'EQ-003', name: 'Bulldozer D8', status: 'Maintenance', location: 'Workshop', utilization: 0, insurance_exp: '2026-09-20' },
    { id: 'EQ-004', name: 'Generator 500kVA', status: 'Rented', location: 'Site B', utilization: 88, insurance_exp: '2026-07-28' },
    { id: 'EQ-005', name: 'Forklift 5T', status: 'Rented', location: 'Site C', utilization: 75, insurance_exp: '2026-10-10' },
  ],
  alerts: [
    { id: 1, type: 'Warning', message: 'EQ-001 Insurance expires in 12 days' },
    { id: 2, type: 'Alert', message: 'EQ-003 reported breakdown at Site A — awaiting repair' },
    { id: 3, type: 'Warning', message: 'RC-2026-042 contract expiry in 4 days' },
    { id: 4, type: 'Info', message: 'EQ-002 utilization below 40% — consider redeployment' },
  ]
};

// Utilization Gauge using RadialBar
const UtilizationGauge = ({ value }) => {
  const data = [{ value, fill: value >= 80 ? '#10B981' : value >= 60 ? '#F59E0B' : '#EF4444' }];
  return (
    <div className="relative flex items-center justify-center" style={{ height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%" cy="60%"
          innerRadius="60%" outerRadius="90%"
          barSize={16}
          data={data}
          startAngle={180} endAngle={0}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" background={{ fill: '#27272A' }} cornerRadius={8} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute flex flex-col items-center" style={{ bottom: '28%' }}>
        <span className="text-3xl font-bold text-white">{value}%</span>
        <span className="text-xs text-gray-500">Utilization</span>
      </div>
    </div>
  );
};

const RentalDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [dashRes, alertRes] = await Promise.allSettled([
          api.get('/rental-dashboard/summary'),
          api.get('/alerts/'),
        ]);

        let activeContracts = MOCK_DATA.active_contracts;
        if (dashRes.status === 'fulfilled') {
          activeContracts = dashRes.value.data.active_contracts || activeContracts;
        }

        let liveAlerts = MOCK_DATA.alerts;
        if (alertRes.status === 'fulfilled') {
          const a = alertRes.value.data;
          const combined = [
            ...(a.equipment_alerts || []).map(x => ({ id: x.asset_id, type: 'Warning', message: `${x.asset_code} ${x.alert_type} expires in ${x.days_remaining} days` })),
            ...(a.rental_alerts || []).map(x => ({ id: x.contract_id, type: 'Alert', message: `Contract ${x.contract_no} (${x.client_name}) expires in ${x.days_remaining} days` })),
            ...(a.operations_alerts || []).map(x => ({ id: x.asset_id, type: 'Alert', message: `${x.asset_code} breakdown — ${x.remarks}` })),
          ];
          if (combined.length) liveAlerts = combined;
        }

        setData({ ...MOCK_DATA, active_contracts: activeContracts, alerts: liveAlerts });
      } catch {
        setData(MOCK_DATA);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const equipmentColumns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Equipment', accessor: 'name' },
    { header: 'Location', accessor: 'location' },
    {
      header: 'Utilization',
      render: (row) => (
        <div className="flex items-center gap-2 min-w-[100px]">
          <div className="flex-1 bg-gray-700 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${row.utilization >= 80 ? 'bg-healthy' : row.utilization >= 40 ? 'bg-warning' : 'bg-gray-600'}`}
              style={{ width: `${row.utilization}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 w-8 text-right">{row.utilization}%</span>
        </div>
      )
    },
    {
      header: 'Status',
      render: (row) => {
        const c = { Rented: 'bg-primary/20 text-primary', Available: 'bg-healthy/20 text-healthy', Maintenance: 'bg-alert/20 text-alert' };
        return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c[row.status] || 'bg-gray-700 text-gray-400'}`}>{row.status}</span>;
      }
    },
    {
      header: 'Insurance Exp.',
      render: (row) => {
        const days = Math.ceil((new Date(row.insurance_exp) - new Date()) / 86400000);
        return (
          <span className={`text-xs ${days < 14 ? 'text-alert font-semibold' : days < 30 ? 'text-warning' : 'text-gray-400'}`}>
            {row.insurance_exp} {days < 30 ? `(${days}d)` : ''}
          </span>
        );
      }
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonKPIRow />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonChart height={220} title />
          <SkeletonChart height={220} title />
          <SkeletonChart height={220} title />
        </div>
        <SkeletonTable rows={5} cols={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Rental Operations</h1>
        <p className="text-sm text-gray-500 mt-1">Equipment fleet status &amp; rental performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Utilization Rate" value={`${data.utilization_pct}%`} icon={Activity} trend={4.2} trendLabel="vs last month" />
        <MetricCard title="Active Contracts" value={data.active_contracts} icon={FileText} trend={2} trendLabel="new this week" />
        <MetricCard title="Monthly Revenue" value={`$${(data.monthly_revenue / 1000).toFixed(0)}k`} icon={DollarSign} trend={8.5} trendLabel="vs last month" />
        <MetricCard title="Fuel Consumption (L)" value={data.fuel_consumption.toLocaleString()} icon={Fuel} trend={-5.4} trendLabel="vs last month" trendUpIsGood={false} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gauge */}
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-white mb-2">Fleet Utilization</h3>
          <UtilizationGauge value={data.utilization_pct} />
          <div className="flex justify-between text-xs text-gray-500 mt-2 px-4">
            <span>Low (&lt;40%)</span>
            <span>Good (&gt;80%)</span>
          </div>
        </div>

        {/* Monthly Revenue bar */}
        <ChartContainer title="Monthly Revenue" height={220}>
          <BarChart data={data.revenue_trend} margin={{ top: 5, right: 0, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
            <XAxis dataKey="month" stroke="#A1A1AA" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#A1A1AA" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
            <RechartsTooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#27272A', color: '#FFF' }} cursor={{ fill: '#27272A', opacity: 0.3 }} formatter={(v) => `$${v.toLocaleString()}`} />
            <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>

        {/* Fuel trend */}
        <ChartContainer title="Fuel Consumption (L)" height={220}>
          <LineChart data={data.fuel_trend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
            <XAxis dataKey="month" stroke="#A1A1AA" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#A1A1AA" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} />
            <RechartsTooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#27272A', color: '#FFF' }} />
            <Line type="monotone" dataKey="liters" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3, fill: '#F59E0B' }} />
          </LineChart>
        </ChartContainer>
      </div>

      {/* Breakdown trend */}
      <ChartContainer title="Breakdown Incidents Trend" height={240}>
        <LineChart data={data.breakdown_trend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
          <XAxis dataKey="month" stroke="#A1A1AA" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis stroke="#A1A1AA" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} />
          <RechartsTooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#27272A', color: '#FFF' }} />
          <Line type="monotone" dataKey="incidents" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4, fill: '#EF4444' }} activeDot={{ r: 6 }} />
        </LineChart>
      </ChartContainer>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DataTable title="Equipment Availability" columns={equipmentColumns} data={data.equipment_list} />
        </div>

        {/* Alerts Panel */}
        <div className="bg-surface border border-border rounded-lg shadow-sm flex flex-col">
          <div className="px-6 py-4 border-b border-border flex justify-between items-center">
            <h3 className="text-base font-medium text-white">Active Alerts</h3>
            <span className="bg-alert/20 text-alert text-xs px-2 py-0.5 rounded-full font-medium">{data.alerts.length} Active</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {data.alerts.map((alert) => (
              <div key={alert.id} className={`p-3 rounded-lg border flex items-start gap-3 ${alert.type === 'Alert' ? 'bg-alert/5 border-alert/20' : alert.type === 'Warning' ? 'bg-warning/5 border-warning/20' : 'bg-primary/5 border-primary/20'}`}>
                <AlertTriangle size={16} className={`mt-0.5 shrink-0 ${alert.type === 'Alert' ? 'text-alert' : alert.type === 'Warning' ? 'text-warning' : 'text-primary'}`} />
                <p className="text-xs text-gray-300 leading-relaxed">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentalDashboard;
