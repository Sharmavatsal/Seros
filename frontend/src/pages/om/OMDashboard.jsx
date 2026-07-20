import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Repeat, Clock, Calendar, Briefcase, User } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import api from '../../lib/axios';

import MetricCard from '../../components/ui/MetricCard';
import ChartContainer from '../../components/ui/ChartContainer';
import DataTable from '../../components/ui/DataTable';
import { SkeletonKPIRow, SkeletonChart, SkeletonTable } from '../../components/ui/Skeletons';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

const MOCK_OM_DATA = {
  open_tickets: 14,
  sla_compliance: 94.2,
  pm_completion: 88.5,
  repeat_failures: 2,
  ticket_status: [
    { name: 'Closed', value: 145 },
    { name: 'In Progress', value: 18 },
    { name: 'Open', value: 6 },
    { name: 'Pending Parts', value: 12 },
  ],
  sla_compliance_by_client: [
    { client: 'Alpha Const.', compliance: 96 },
    { client: 'BuildRight', compliance: 92 },
    { client: 'Horizon Infra', compliance: 95 },
    { client: 'Gulf Projects', compliance: 88 },
    { client: 'Prime Piling', compliance: 94 },
  ],
  mttr_trend: [
    { week: 'W1', hours: 4.2 },
    { week: 'W2', hours: 3.8 },
    { week: 'W3', hours: 4.5 },
    { week: 'W4', hours: 3.2 },
    { week: 'W5', hours: 3.5 },
    { week: 'W6', hours: 2.9 },
  ],
  technician_allocation: [
    { id: 'T-01', name: 'Mike Johnson', active_tickets: 3, efficiency: 94, status: 'On Site' },
    { id: 'T-02', name: 'Sarah Connor', active_tickets: 1, efficiency: 98, status: 'On Site' },
    { id: 'T-03', name: 'Dave Smith', active_tickets: 4, efficiency: 87, status: 'Standby' },
    { id: 'T-04', name: 'Alex Wong', active_tickets: 2, efficiency: 91, status: 'On Site' },
  ],
  amc_renewals: [
    { client_name: 'Alpha Construction', equipment: 'Excavator Fleet', end_date: '2026-08-15', value: 45000, days_remaining: 26 },
    { client_name: 'BuildRight LLC', equipment: 'Batching Plant', end_date: '2026-09-01', value: 68000, days_remaining: 43 },
    { client_name: 'Horizon Infra', equipment: 'Transit Mixer Fleet', end_date: '2026-07-28', value: 35000, days_remaining: 8 },
    { client_name: 'Gulf Projects', equipment: 'Tower Crane 50T', end_date: '2026-10-10', value: 55000, days_remaining: 82 },
  ],
};

const OMDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const response = await api.get('/om-dashboard/summary');
        
        setData({
          open_tickets: response.data.open_tickets !== undefined ? response.data.open_tickets : MOCK_OM_DATA.open_tickets,
          sla_compliance: response.data.sla_compliance_percent !== undefined ? response.data.sla_compliance_percent : MOCK_OM_DATA.sla_compliance,
          pm_completion: response.data.pm_completion_percent !== undefined ? response.data.pm_completion_percent : MOCK_OM_DATA.pm_completion,
          repeat_failures: response.data.repeat_failures !== undefined ? response.data.repeat_failures : MOCK_OM_DATA.repeat_failures,
          ticket_status: MOCK_OM_DATA.ticket_status,
          sla_compliance_by_client: MOCK_OM_DATA.sla_compliance_by_client,
          mttr_trend: MOCK_OM_DATA.mttr_trend,
          technician_allocation: MOCK_OM_DATA.technician_allocation,
          amc_renewals: MOCK_OM_DATA.amc_renewals,
        });
      } catch (error) {
        console.warn("Using mock data for O&M Dashboard", error);
        setData(MOCK_OM_DATA);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton rounded mb-6" />
        <SkeletonKPIRow />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart height={300} title />
          <SkeletonChart height={300} title />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonTable rows={5} cols={4} />
          <SkeletonTable rows={5} cols={4} />
        </div>
      </div>
    );
  }

  const techColumns = [
    { header: 'Tech ID', accessor: 'id' },
    { 
      header: 'Name', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <User size={14} className="text-gray-400" />
          <span className="text-gray-200">{row.name}</span>
        </div>
      )
    },
    { 
      header: 'Active Tickets', 
      render: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${row.active_tickets > 3 ? 'bg-alert/20 text-alert' : 'bg-primary/20 text-primary'}`}>
          {row.active_tickets} Tickets
        </span>
      ) 
    },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${row.status === 'On Site' ? 'bg-healthy/20 text-healthy' : 'bg-gray-700 text-gray-400'}`}>
          {row.status}
        </span>
      ) 
    },
    { 
      header: 'Efficiency', 
      render: (row) => (
        <div className="flex items-center space-x-2 min-w-[120px]">
          <div className="flex-1 bg-gray-700 h-2 rounded-full overflow-hidden">
            <div className="bg-healthy h-full" style={{ width: `${row.efficiency}%` }}></div>
          </div>
          <span className="text-xs text-gray-400 w-8">{row.efficiency}%</span>
        </div>
      ) 
    },
  ];

  const amcColumns = [
    { header: 'Client', accessor: 'client_name' },
    { header: 'Equipment', accessor: 'equipment' },
    { 
      header: 'Renewal Date', 
      render: (row) => (
        <span className="text-gray-300 font-mono text-xs">{row.end_date}</span>
      ) 
    },
    { 
      header: 'Contract Value', 
      render: (row) => (
        <span className="text-white font-medium">${row.value.toLocaleString()}</span>
      ) 
    },
    { 
      header: 'Timeline', 
      render: (row) => {
        const isCritical = row.days_remaining <= 10;
        const isWarning = row.days_remaining <= 30;
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            isCritical ? 'bg-alert/20 text-alert animate-pulse' : isWarning ? 'bg-warning/20 text-warning' : 'bg-healthy/20 text-healthy'
          }`}>
            {row.days_remaining} Days left
          </span>
        );
      } 
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">O&amp;M Operations</h1>
          <p className="text-sm text-gray-500 mt-1">SLA Compliance, ticket statistics &amp; maintenance tracker</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Open Tickets" value={data.open_tickets} icon={AlertCircle} trend={-5.0} trendLabel="vs last week" trendUpIsGood={false} />
        <MetricCard title="SLA Compliance" value={`${data.sla_compliance}%`} icon={CheckCircle} trend={2.1} trendLabel="vs last month" />
        <MetricCard title="PM Completion" value={`${data.pm_completion}%`} icon={Clock} trend={1.5} trendLabel="vs last month" />
        <MetricCard title="Repeat Failures" value={data.repeat_failures} icon={Repeat} trend={0} trendLabel="vs last month" trendUpIsGood={false} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Status Donut */}
        <ChartContainer title="Ticket Status" height={300}>
          <PieChart>
            <Pie
              data={data.ticket_status}
              cx="50%"
              cy="45%"
              innerRadius={70}
              outerRadius={95}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.ticket_status.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#27272A', color: '#FFF' }} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ color: '#A1A1AA', fontSize: 12 }} />
          </PieChart>
        </ChartContainer>

        {/* SLA Compliance by Client Bar */}
        <ChartContainer title="SLA Compliance per Client (%)" height={300}>
          <BarChart data={data.sla_compliance_by_client} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
            <XAxis dataKey="client" stroke="#A1A1AA" tick={{ fill: '#A1A1AA', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis domain={[80, 100]} stroke="#A1A1AA" tick={{ fill: '#A1A1AA', fontSize: 10 }} axisLine={false} tickLine={false} />
            <RechartsTooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#27272A', color: '#FFF' }} formatter={(v) => [`${v}%`, 'SLA Compliance']} cursor={{ fill: '#27272A', opacity: 0.3 }} />
            <Bar dataKey="compliance" fill="#3B82F6" radius={[4, 4, 0, 0]}>
              {data.sla_compliance_by_client.map((entry, idx) => (
                <Cell key={idx} fill={entry.compliance >= 95 ? '#10B981' : entry.compliance >= 90 ? '#3B82F6' : '#EF4444'} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>

        {/* MTTR Trend Line */}
        <ChartContainer title="Mean Time To Resolve (MTTR) Trend" height={300}>
          <LineChart data={data.mttr_trend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
            <XAxis dataKey="week" stroke="#A1A1AA" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#A1A1AA" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#A1A1AA', style: { textAnchor: 'middle' } }} />
            <RechartsTooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#27272A', color: '#FFF' }} formatter={(v) => [`${v} hours`, 'MTTR']} />
            <Line type="monotone" dataKey="hours" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4, fill: '#8B5CF6' }} activeDot={{ r: 6 }} />
          </LineChart>
        </ChartContainer>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <DataTable title="Technician Allocation & Efficiency" columns={techColumns} data={data.technician_allocation} />
        </div>
        <div>
          <DataTable title="AMC Renewal Timeline" columns={amcColumns} data={data.amc_renewals} />
        </div>
      </div>
    </div>
  );
};

export default OMDashboard;
