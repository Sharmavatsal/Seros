import { useState, useEffect, useMemo } from 'react';
import { Wrench, Calendar, AlertTriangle, CheckCircle, Clock, Activity, X, Filter } from 'lucide-react';
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

const fmtCost = (v) => v ? '\u20B9' + Number(v).toLocaleString('en-IN') : '\u2014';

const MaintenancePage = () => {
  const [activeTab, setActiveTab] = useState('schedules');
  const [schedules, setSchedules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clickFilter, setClickFilter] = useState(null);

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

  const getStatusLabel = (s) => {
    if (s.status === 'overdue') return 'Overdue';
    const today = new Date();
    const due = s.next_due_date ? new Date(s.next_due_date) : null;
    const daysUntil = due ? Math.ceil((due - today) / 86400000) : null;
    if (daysUntil !== null && daysUntil < 0) return 'Overdue';
    if (daysUntil !== null && daysUntil <= 14) return 'Due Soon';
    return 'On Track';
  };

  const clearFilter = () => setClickFilter(null);
  const handleFilter = (field, value) => {
    if (value === undefined || value === null || value === '') return;
    setClickFilter({ field, value });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredSchedules = useMemo(() => {
    if (!clickFilter) return schedules;
    const { field, value } = clickFilter;
    const v = String(value).toLowerCase();
    return schedules.filter(s => {
      if (field === 'status') return getStatusLabel(s).toLowerCase() === v;
      if (field === 'frequency_days') return String(s.frequency_days ?? '').toLowerCase() === v;
      const raw = s[field];
      return String(raw ?? '').toLowerCase().includes(v);
    });
  }, [schedules, clickFilter]);

  const filteredLogs = useMemo(() => {
    if (!clickFilter) return logs;
    const { field, value } = clickFilter;
    const v = String(value).toLowerCase();
    return logs.filter(l => String(l[field] ?? '').toLowerCase().includes(v));
  }, [logs, clickFilter]);

  const isSchedActive = (field, value) => clickFilter && clickFilter.field === field && String(clickFilter.value).toLowerCase() === String(value).toLowerCase();
  const isLogActive = (field, value) => clickFilter && clickFilter.field === field && String(clickFilter.value).toLowerCase() === String(value).toLowerCase();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">Maintenance</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-0.5">Preventive schedules, breakdown logs &amp; service history</p>
      </div>

      {/* KPIs */}
      {loading ? (
        <SkeletonKPIRow />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard title="Total Schedules" value={schedules.length} icon={Calendar} />
          <MetricCard title="Overdue PM" value={overdueCount} icon={AlertTriangle} trend={overdueCount > 0 ? overdueCount : 0} trendLabel="need immediate action" trendUpIsGood={false} />
          <MetricCard title="Due Within 14 Days" value={dueSoonCount} icon={Clock} />
          <MetricCard title="Avg Repair Cost" value={fmtCost(avgCost)} icon={Activity} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-surface border border-border rounded-lg p-1">
        {['schedules', 'logs'].map((t) => (
          <button
            key={t}
            onClick={() => { setActiveTab(t); setClickFilter(null); }}
            className={`flex items-center gap-1.5 px-3 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-medium capitalize transition-all ${activeTab === t ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
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
              <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-sm md:text-base font-medium text-white">Preventive Maintenance Schedules</h3>
                <div className="flex items-center gap-2">
                  {clickFilter && (
                    <button onClick={clearFilter} className="flex items-center gap-1 px-2 py-1 rounded-md bg-background border border-border text-xs text-gray-300 hover:text-white hover:border-primary transition-colors">
                      <X size={12} /> Clear filter
                    </button>
                  )}
                  <span className="text-xs text-gray-500">{filteredSchedules.length} schedules</span>
                </div>
              </div>
              {clickFilter && (
                <div className="px-4 md:px-6 py-2 bg-background/30 border-b border-border flex items-center gap-2 text-xs text-gray-300">
                  <Filter size={13} className="text-primary" />
                  Showing all <span className="text-primary font-medium">{clickFilter.field.replace(/_/g, ' ')}</span> ={' '}
                  <span className="text-white font-semibold">&quot;{String(clickFilter.value)}&quot;</span>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background/40">
                      {['Asset', 'Maintenance Type', 'Frequency', 'Last Completed', 'Next Due', 'Status'].map((h) => (
                        <th key={h} className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredSchedules.length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">No schedules found</td></tr>
                    ) : filteredSchedules.map((s, i) => (
                      <tr key={s.id || i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-3 md:px-6 py-3 md:py-3.5 font-mono text-xs text-gray-300 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleFilter('asset_id', s.asset_id)} title="Click to show all matching asset" style={isSchedActive('asset_id', s.asset_id) ? { color: '#3B82F6' } : undefined}>{s.asset_id}</td>
                        <td className="px-3 md:px-6 py-3 md:py-3.5 text-white cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleFilter('maintenance_type', s.maintenance_type)} title="Click to show all matching type" style={isSchedActive('maintenance_type', s.maintenance_type) ? { color: '#3B82F6' } : undefined}>{s.maintenance_type}</td>
                        <td className="px-3 md:px-6 py-3 md:py-3.5 text-gray-400 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleFilter('frequency_days', s.frequency_days)} title="Click to show all matching frequency" style={isSchedActive('frequency_days', s.frequency_days) ? { color: '#3B82F6' } : undefined}>Every {s.frequency_days}d</td>
                        <td className="px-3 md:px-6 py-3 md:py-3.5 text-gray-400 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleFilter('last_completed_date', s.last_completed_date)} title="Click to show all matching date" style={isSchedActive('last_completed_date', s.last_completed_date) ? { color: '#3B82F6' } : undefined}>{s.last_completed_date || '—'}</td>
                        <td className="px-3 md:px-6 py-3 md:py-3.5 text-gray-300 font-medium cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleFilter('next_due_date', s.next_due_date)} title="Click to show all matching date" style={isSchedActive('next_due_date', s.next_due_date) ? { color: '#3B82F6' } : undefined}>{s.next_due_date}</td>
                        <td className="px-3 md:px-6 py-3 md:py-3.5">
                          <div onClick={() => handleFilter('status', getStatusLabel(s))} title="Click to show all matching status" className="inline-block cursor-pointer" style={clickFilter?.field === 'status' && String(clickFilter.value).toLowerCase() === getStatusLabel(s).toLowerCase() ? { outline: '1px solid #3B82F6', borderRadius: '9999px' } : undefined}>
                            <StatusBadge status={s.status} nextDue={s.next_due_date} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-sm md:text-base font-medium text-white">Service & Breakdown Logs</h3>
                <div className="flex items-center gap-2">
                  {clickFilter && (
                    <button onClick={clearFilter} className="flex items-center gap-1 px-2 py-1 rounded-md bg-background border border-border text-xs text-gray-300 hover:text-white hover:border-primary transition-colors">
                      <X size={12} /> Clear filter
                    </button>
                  )}
                  <span className="text-xs text-gray-500">{filteredLogs.length} records</span>
                </div>
              </div>
              {clickFilter && (
                <div className="px-4 md:px-6 py-2 bg-background/30 border-b border-border flex items-center gap-2 text-xs text-gray-300">
                  <Filter size={13} className="text-primary" />
                  Showing all <span className="text-primary font-medium">{clickFilter.field.replace(/_/g, ' ')}</span> ={' '}
                  <span className="text-white font-semibold">&quot;{String(clickFilter.value)}&quot;</span>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background/40">
                      {['Log ID', 'Asset', 'Action Taken', 'Parts Replaced', 'Cost', 'Date'].map((h) => (
                        <th key={h} className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredLogs.length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">No logs found</td></tr>
                    ) : filteredLogs.map((l, i) => (
                      <tr key={l.id || i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-3 md:px-6 py-3 md:py-3.5 font-mono text-xs text-gray-400 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleFilter('id', l.id)} title="Click to show all matching log" style={isLogActive('id', l.id) ? { color: '#3B82F6' } : undefined}>{l.id}</td>
                        <td className="px-3 md:px-6 py-3 md:py-3.5 font-mono text-xs text-gray-300 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleFilter('asset_id', l.asset_id)} title="Click to show all matching asset" style={isLogActive('asset_id', l.asset_id) ? { color: '#3B82F6' } : undefined}>{l.asset_id}</td>
                        <td className="px-3 md:px-6 py-3 md:py-3.5 text-gray-300 max-w-[120px] md:max-w-[200px] truncate cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleFilter('action_taken', l.action_taken)} title="Click to show all matching action" style={isLogActive('action_taken', l.action_taken) ? { color: '#3B82F6' } : undefined}>{l.action_taken}</td>
                        <td className="px-3 md:px-6 py-3 md:py-3.5 text-gray-400 max-w-[100px] md:max-w-[180px] truncate cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleFilter('parts_replaced', l.parts_replaced)} title="Click to show all matching parts" style={isLogActive('parts_replaced', l.parts_replaced) ? { color: '#3B82F6' } : undefined}>{l.parts_replaced || '—'}</td>
                        <td className="px-3 md:px-6 py-3 md:py-3.5 font-semibold text-white">{fmtCost(l.cost)}</td>
                        <td className="px-3 md:px-6 py-3 md:py-3.5 text-gray-400 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleFilter('service_date', l.service_date || l.date_completed?.split('T')[0])} title="Click to show all matching date" style={isLogActive('service_date', l.service_date || l.date_completed?.split('T')[0]) ? { color: '#3B82F6' } : undefined}>{l.service_date || l.date_completed?.split('T')[0] || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 md:px-6 py-3 border-t border-border bg-background/30">
                <p className="text-xs md:text-sm text-gray-400">
                  Total maintenance cost: <span className="text-white font-semibold">{fmtCost(totalCost)}</span>
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
