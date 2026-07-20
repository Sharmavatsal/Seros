import React, { useState, useEffect } from 'react';
import { Wrench, Calendar, AlertTriangle, CheckCircle, Clock, Activity } from 'lucide-react';
import api from '../../lib/axios';
import { SkeletonKPIRow, SkeletonTable } from '../../components/ui/Skeletons';
import MetricCard from '../../components/ui/MetricCard';

const MOCK_SCHEDULES = [
  { id: 'SCH-001', asset_id: 'EQ-001', maintenance_type: 'Monthly Service', frequency_days: 30, next_due_date: '2026-07-22', last_completed_date: '2026-06-22', status: 'due_soon' },
  { id: 'SCH-002', asset_id: 'EQ-002', maintenance_type: 'Oil Change', frequency_days: 90, next_due_date: '2026-08-15', last_completed_date: '2026-05-17', status: 'ok' },
  { id: 'SCH-003', asset_id: 'EQ-003', maintenance_type: 'Filter Replacement', frequency_days: 60, next_due_date: '2026-07-10', last_completed_date: '2026-05-11', status: 'overdue' },
  { id: 'SCH-004', asset_id: 'EQ-004', maintenance_type: 'Hydraulic Check', frequency_days: 180, next_due_date: '2026-10-01', last_completed_date: '2026-04-04', status: 'ok' },
  { id: 'SCH-005', asset_id: 'EQ-005', maintenance_type: 'Annual Inspection', frequency_days: 365, next_due_date: '2026-12-20', last_completed_date: '2025-12-20', status: 'ok' },
];

const MOCK_LOGS = [
  { id: 'LOG-001', asset_id: 'EQ-001', action_taken: 'Oil change and filter replacement', parts_replaced: 'Oil filter, Air filter', cost: 1200, service_date: '2026-06-22' },
  { id: 'LOG-002', asset_id: 'EQ-003', action_taken: 'Hydraulic pump repair', parts_replaced: 'Hydraulic seal kit', cost: 3400, service_date: '2026-06-15' },
  { id: 'LOG-003', asset_id: 'EQ-002', action_taken: 'Engine tune-up and diagnostics', parts_replaced: 'Spark plugs, Belts', cost: 800, service_date: '2026-05-17' },
  { id: 'LOG-004', asset_id: 'EQ-004', action_taken: 'Brake system inspection and adjustment', parts_replaced: 'Brake pads', cost: 650, service_date: '2026-07-01' },
  { id: 'LOG-005', asset_id: 'EQ-007', action_taken: 'Breakdown repair — hydraulic cylinder', parts_replaced: 'Hydraulic cylinder assembly', cost: 8200, service_date: '2026-07-05' },
];

const StatusBadge = ({ status, nextDue }) => {
  const today = new Date();
  const due = nextDue ? new Date(nextDue) : null;
  const daysUntil = due ? Math.ceil((due - today) / (1000 * 60 * 60 * 24)) : null;

  let badge;
  if (status === 'overdue' || (daysUntil !== null && daysUntil < 0)) {
    badge = <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-alert/20 text-alert"><AlertTriangle size={11} /> Overdue</span>;
  } else if (daysUntil !== null && daysUntil <= 7) {
    badge = <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-alert/20 text-alert"><Clock size={11} /> Due in {daysUntil}d</span>;
  } else if (daysUntil !== null && daysUntil <= 14) {
    badge = <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-warning/20 text-warning"><Clock size={11} /> Due in {daysUntil}d</span>;
  } else {
    badge = <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-healthy/20 text-healthy"><CheckCircle size={11} /> On Track</span>;
  }
  return badge;
};

const MaintenancePage = () => {
  const [activeTab, setActiveTab] = useState('schedules');
  const [schedules, setSchedules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [schRes, logRes] = await Promise.all([
        api.get('/maintenance/schedules'),
        api.get('/maintenance/logs'),
      ]);
      setSchedules(schRes.data?.length ? schRes.data : MOCK_SCHEDULES);
      setLogs(logRes.data?.length ? logRes.data : MOCK_LOGS);
    } catch {
      setSchedules(MOCK_SCHEDULES);
      setLogs(MOCK_LOGS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const today = new Date();
  const overdueCount = schedules.filter(s => {
    const d = new Date(s.next_due_date);
    return d < today;
  }).length;
  const dueSoonCount = schedules.filter(s => {
    const d = new Date(s.next_due_date);
    const diff = Math.ceil((d - today) / 86400000);
    return diff >= 0 && diff <= 14;
  }).length;
  const totalCost = logs.reduce((sum, l) => sum + (l.cost || 0), 0);
  const avgCost = logs.length ? (totalCost / logs.length).toFixed(0) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Maintenance</h1>
        <p className="text-sm text-gray-500 mt-1">Preventive schedules, breakdown logs &amp; service history</p>
      </div>

      {/* KPIs */}
      {loading ? (
        <SkeletonKPIRow />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard title="Total Schedules" value={schedules.length} icon={Calendar} />
          <MetricCard title="Overdue PM" value={overdueCount} icon={AlertTriangle} trend={overdueCount > 0 ? overdueCount : 0} trendLabel="need immediate action" trendUpIsGood={false} />
          <MetricCard title="Due Within 14 Days" value={dueSoonCount} icon={Clock} />
          <MetricCard title="Avg Repair Cost" value={`$${Number(avgCost).toLocaleString()}`} icon={Activity} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-surface border border-border rounded-lg p-1 w-fit">
        {['schedules', 'logs'].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${activeTab === t ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
          >
            {t === 'schedules' ? <Calendar size={13} /> : <Wrench size={13} />}
            {t === 'schedules' ? 'PM Schedules' : 'Service Logs'}
          </button>
        ))}
      </div>

      {/* Tables */}
      {loading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : (
        <>
          {activeTab === 'schedules' && (
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-base font-medium text-white">Preventive Maintenance Schedules</h3>
                <span className="text-xs text-gray-500">{schedules.length} schedules</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background/40">
                      {['Asset', 'Maintenance Type', 'Frequency', 'Last Completed', 'Next Due', 'Status'].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {schedules.map((s, i) => (
                      <tr key={s.id || i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-3.5 font-mono text-xs text-gray-300">{s.asset_id}</td>
                        <td className="px-6 py-3.5 text-white">{s.maintenance_type}</td>
                        <td className="px-6 py-3.5 text-gray-400">Every {s.frequency_days}d</td>
                        <td className="px-6 py-3.5 text-gray-400">{s.last_completed_date || '—'}</td>
                        <td className="px-6 py-3.5 text-gray-300 font-medium">{s.next_due_date}</td>
                        <td className="px-6 py-3.5"><StatusBadge status={s.status} nextDue={s.next_due_date} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-base font-medium text-white">Service & Breakdown Logs</h3>
                <span className="text-xs text-gray-500">{logs.length} records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background/40">
                      {['Log ID', 'Asset', 'Action Taken', 'Parts Replaced', 'Cost', 'Date'].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {logs.map((l, i) => (
                      <tr key={l.id || i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-3.5 font-mono text-xs text-gray-400">{l.id}</td>
                        <td className="px-6 py-3.5 font-mono text-xs text-gray-300">{l.asset_id}</td>
                        <td className="px-6 py-3.5 text-gray-300 max-w-[200px] truncate">{l.action_taken}</td>
                        <td className="px-6 py-3.5 text-gray-400 max-w-[180px] truncate">{l.parts_replaced || '—'}</td>
                        <td className="px-6 py-3.5 font-semibold text-white">${Number(l.cost || 0).toLocaleString()}</td>
                        <td className="px-6 py-3.5 text-gray-400">{l.service_date || l.created_at || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 border-t border-border bg-background/30">
                <p className="text-sm text-gray-400">
                  Total maintenance cost: <span className="text-white font-semibold">${totalCost.toLocaleString()}</span>
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MaintenancePage;
