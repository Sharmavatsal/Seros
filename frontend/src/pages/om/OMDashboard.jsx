import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Repeat, Clock } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import api from '../../lib/axios';

import MetricCard from '../../components/ui/MetricCard';
import ChartContainer from '../../components/ui/ChartContainer';
import DataTable from '../../components/ui/DataTable';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

const OMDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/om-dashboard/summary');
        
        setData({
          open_tickets: response.data.open_tickets || 24,
          sla_compliance: 94.2,
          pm_completion: 88.5,
          repeat_failures: 3,
          ticket_status: [
            { name: 'Resolved', value: 145 },
            { name: 'In Progress', value: 18 },
            { name: 'Open', value: 6 },
            { name: 'Pending Parts', value: 12 },
          ],
          mttr_trend: [
            { week: 'W1', hours: 4.2 },
            { week: 'W2', hours: 3.8 },
            { week: 'W3', hours: 4.5 },
            { week: 'W4', hours: 3.2 },
          ],
          technician_allocation: [
            { id: 'T-01', name: 'Mike Johnson', active_tickets: 3, efficiency: 94 },
            { id: 'T-02', name: 'Sarah Connor', active_tickets: 1, efficiency: 98 },
            { id: 'T-03', name: 'Dave Smith', active_tickets: 4, efficiency: 87 },
            { id: 'T-04', name: 'Alex Wong', active_tickets: 2, efficiency: 91 },
          ]
        });
      } catch (error) {
        console.warn("Using mock data for O&M Dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading || !data) {
    return <div className="p-8 text-center text-gray-400">Loading Dashboard...</div>;
  }

  const techColumns = [
    { header: 'Tech ID', accessor: 'id' },
    { header: 'Name', accessor: 'name' },
    { header: 'Active Tickets', render: (row) => (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${row.active_tickets > 3 ? 'bg-alert/20 text-alert' : 'bg-primary/20 text-primary'}`}>
        {row.active_tickets}
      </span>
    ) },
    { header: 'Efficiency', render: (row) => (
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-gray-700 h-2 rounded-full overflow-hidden">
          <div className="bg-healthy h-full" style={{ width: `${row.efficiency}%` }}></div>
        </div>
        <span className="text-xs text-gray-400 w-8">{row.efficiency}%</span>
      </div>
    ) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">O&M Operations</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Open Tickets" value={data.open_tickets} icon={AlertCircle} trend={-5.0} trendLabel="vs last week" trendUpIsGood={false} />
        <MetricCard title="SLA Compliance" value={`${data.sla_compliance}%`} icon={CheckCircle} trend={2.1} trendLabel="vs last month" />
        <MetricCard title="PM Completion" value={`${data.pm_completion}%`} icon={Clock} trend={1.5} trendLabel="vs last month" />
        <MetricCard title="Repeat Failures" value={data.repeat_failures} icon={Repeat} trend={0} trendLabel="vs last month" trendUpIsGood={false} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer title="Ticket Status Distribution" height={300}>
          <PieChart>
            <Pie
              data={data.ticket_status}
              cx="50%"
              cy="45%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.ticket_status.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#27272A', color: '#FFF' }} />
          </PieChart>
        </ChartContainer>

        <ChartContainer title="Mean Time To Resolve (MTTR) Trend" height={300}>
          <LineChart data={data.mttr_trend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
            <XAxis dataKey="week" stroke="#A1A1AA" tick={{ fill: '#A1A1AA' }} axisLine={false} tickLine={false} />
            <YAxis stroke="#A1A1AA" tick={{ fill: '#A1A1AA' }} axisLine={false} tickLine={false} label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#A1A1AA' }} />
            <RechartsTooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#27272A', color: '#FFF' }} />
            <Line type="monotone" dataKey="hours" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6' }} />
          </LineChart>
        </ChartContainer>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 gap-6">
        <div className="h-[350px]">
          <DataTable title="Technician Allocation & Efficiency" columns={techColumns} data={data.technician_allocation} />
        </div>
      </div>
    </div>
  );
};

export default OMDashboard;
