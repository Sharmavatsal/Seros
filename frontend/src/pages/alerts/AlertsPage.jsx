import { useState, useEffect } from 'react';
import { AlertTriangle, Shield, FileText, Wrench, IndianRupee, RefreshCw, CheckCircle, X, Filter } from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import { SkeletonTable } from '../../components/ui/Skeletons';

const MOCK_ALERTS = {
  equipment_alerts: [
    { asset_id: 'a1', asset_code: 'EQ-001', alert_type: 'Insurance', expiry_date: '2026-08-01', days_remaining: 12 },
    { asset_id: 'a2', asset_code: 'EQ-003', alert_type: 'Fitness', expiry_date: '2026-08-10', days_remaining: 21 },
    { asset_id: 'a3', asset_code: 'EQ-005', alert_type: 'Insurance', expiry_date: '2026-07-28', days_remaining: 8 },
  ],
  rental_alerts: [
    { contract_id: 'c1', contract_no: 'RC-2026-042', client_name: 'Alpha Construction', expiry_date: '2026-07-24', days_remaining: 4 },
    { contract_id: 'c2', contract_no: 'RC-2026-039', client_name: 'BuildRight LLC', expiry_date: '2026-07-26', days_remaining: 6 },
  ],
  operations_alerts: [
    { asset_id: 'a4', asset_code: 'EQ-007', log_date: '2026-07-18', remarks: 'Hydraulic system failure reported at Site C' },
    { asset_id: 'a5', asset_code: 'EQ-002', log_date: '2026-07-19', remarks: 'Engine overheating — awaiting inspection' },
  ],
  om_alerts: [
    { alert_type: 'SLA Breach', details: 'Ticket #TK-0192 breached SLA - HVAC repair', asset_id: 'a6', reference_id: 'tk1' },
    { alert_type: 'Missed PM', details: 'Missed PM (Monthly Service) due on 2026-07-10', asset_id: 'a7', reference_id: 'sch1' },
  ],
  finance_alerts: [
    { invoice_id: 'INV-2026-017', vertical: 'rental', amount: 45000, days_overdue: 52 },
    { invoice_id: 'INV-2026-009', vertical: 'piling', amount: 28000, days_overdue: 67 },
  ],
};

const SeverityBadge = ({ days }) => {
  if (days === undefined) return null;
  const cls = days <= 7
    ? 'bg-alert/20 text-alert'
    : days <= 15
    ? 'bg-warning/20 text-warning'
    : 'bg-yellow-700/20 text-yellow-400';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {days}d remaining
    </span>
  );
};

const AlertTable = ({ columns, data, emptyMessage = 'No alerts', onFilter, activeField, activeValue }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border bg-background/40">
          {columns.map((col, i) => (
            <th key={i} className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {data.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="px-3 md:px-6 py-12 text-center">
              <div className="flex flex-col items-center gap-2">
                <CheckCircle size={32} className="text-healthy/50" />
                <p className="text-gray-500">{emptyMessage}</p>
              </div>
            </td>
          </tr>
        ) : (
          data.map((row, ri) => (
            <tr key={ri} className="hover:bg-white/[0.02] transition-colors">
              {columns.map((col, ci) => {
                const field = col.field || col.accessor;
                const raw = col.render ? null : row[col.accessor];
                const value = col.render ? (typeof col.getFilterValue === 'function' ? col.getFilterValue(row) : row[col.accessor]) : raw;
                const active = activeField === field && value !== undefined && value !== null && String(activeValue).toLowerCase() === String(value).toLowerCase();
                return (
                  <td
                    key={ci}
                    className="px-3 md:px-6 py-3 md:py-3.5 text-gray-300"
                    style={active ? { color: '#3B82F6', fontWeight: 600 } : undefined}
                  >
                    {col.render ? (
                      <span className="inline-block cursor-pointer transition-colors hover:text-primary" onClick={() => onFilter && value !== undefined && value !== null && value !== '' && onFilter(field, value)} title={value !== undefined && value !== null && value !== '' ? `Click to show all matching "${value}"` : undefined}>
                        {col.render(row)}
                      </span>
                    ) : (
                      <span className="inline-block cursor-pointer transition-colors hover:text-primary" onClick={() => onFilter && value !== undefined && value !== null && value !== '' && onFilter(field, value)} title={value !== undefined && value !== null && value !== '' ? `Click to show all matching "${value}"` : undefined}>
                        {row[col.accessor]}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

const TABS = [
  { key: 'equipment', label: 'Equipment', icon: Shield, roles: ['admin', 'rental_manager', 'piling_manager', 'om_manager'] },
  { key: 'rental', label: 'Rental', icon: FileText, roles: ['admin', 'rental_manager'] },
  { key: 'operations', label: 'Operations', icon: AlertTriangle, roles: ['admin', 'rental_manager', 'piling_manager', 'om_manager'] },
  { key: 'om', label: 'O&M', icon: Wrench, roles: ['admin', 'om_manager'] },
  { key: 'finance', label: 'Finance', icon: IndianRupee, roles: ['admin', 'rental_manager', 'piling_manager', 'om_manager'] },
];

const AlertsPage = () => {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('equipment');
  const [refreshing, setRefreshing] = useState(false);
  const [clickFilter, setClickFilter] = useState(null);

  const fetchAlerts = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await api.get('/alerts/');
      setAlerts(res.data);
    } catch {
      setAlerts(MOCK_ALERTS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, []);

  const visibleTabs = TABS.filter(t => t.roles.includes(role));

  const getCounts = () => ({
    equipment: alerts?.equipment_alerts?.length || 0,
    rental: alerts?.rental_alerts?.length || 0,
    operations: alerts?.operations_alerts?.length || 0,
    om: alerts?.om_alerts?.length || 0,
    finance: alerts?.finance_alerts?.length || 0,
  });

  const counts = getCounts();
  const totalAlerts = Object.values(counts).reduce((a, b) => a + b, 0);

  const eqColumns = [
    { header: 'Asset Code', field: 'asset_code', accessor: 'asset_code' },
    { header: 'Alert Type', field: 'alert_type', render: (r) => <span className="px-2 py-1 rounded-full text-xs font-medium bg-warning/20 text-warning">{r.alert_type}</span>, getFilterValue: (r) => r.alert_type },
    { header: 'Expiry Date', field: 'expiry_date', accessor: 'expiry_date' },
    { header: 'Status', field: 'days_remaining', render: (r) => <SeverityBadge days={r.days_remaining} />, getFilterValue: (r) => r.days_remaining },
  ];

  const rentalColumns = [
    { header: 'Contract No', field: 'contract_no', accessor: 'contract_no' },
    { header: 'Client', field: 'client_name', accessor: 'client_name' },
    { header: 'Expiry Date', field: 'expiry_date', accessor: 'expiry_date' },
    { header: 'Status', field: 'days_remaining', render: (r) => <SeverityBadge days={r.days_remaining} />, getFilterValue: (r) => r.days_remaining },
  ];

  const opsColumns = [
    { header: 'Asset Code', field: 'asset_code', accessor: 'asset_code' },
    { header: 'Log Date', field: 'log_date', accessor: 'log_date' },
    { header: 'Type', field: 'type', render: () => <span className="px-2 py-1 rounded-full text-xs bg-alert/20 text-alert">Breakdown</span>, getFilterValue: () => 'Breakdown' },
    { header: 'Remarks', field: 'remarks', accessor: 'remarks' },
  ];

  const omColumns = [
    { header: 'Alert Type', field: 'alert_type', render: (r) => <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.alert_type === 'SLA Breach' ? 'bg-alert/20 text-alert' : 'bg-warning/20 text-warning'}`}>{r.alert_type}</span>, getFilterValue: (r) => r.alert_type },
    { header: 'Details', field: 'details', accessor: 'details' },
    { header: 'Reference ID', field: 'reference_id', accessor: 'reference_id' },
  ];

  const financeColumns = [
    { header: 'Invoice ID', field: 'invoice_id', accessor: 'invoice_id' },
    { header: 'Vertical', field: 'vertical', render: (r) => <span className="capitalize text-gray-300">{r.vertical}</span>, getFilterValue: (r) => r.vertical },
    { header: 'Amount', field: 'amount', render: (r) => <span className="font-semibold text-white">\u20B9{Number(r.amount).toLocaleString()}</span>, getFilterValue: (r) => r.amount },
    { header: 'Overdue', field: 'days_overdue', render: (r) => <span className="px-2 py-0.5 rounded-full text-xs bg-alert/20 text-alert font-medium">{r.days_overdue} days</span>, getFilterValue: (r) => r.days_overdue },
  ];

  const tableConfig = {
    equipment: { columns: eqColumns, data: alerts?.equipment_alerts || [], empty: 'No equipment alerts — all documents are current' },
    rental: { columns: rentalColumns, data: alerts?.rental_alerts || [], empty: 'No rental alerts — all contracts are active' },
    operations: { columns: opsColumns, data: alerts?.operations_alerts || [], empty: 'No breakdown alerts — all equipment operational' },
    om: { columns: omColumns, data: alerts?.om_alerts || [], empty: 'No O&M alerts — SLA and PM on track' },
    finance: { columns: financeColumns, data: alerts?.finance_alerts || [], empty: 'No finance alerts — all invoices current' },
  };

  const resolveValue = (col, row) =>
    col.getFilterValue ? col.getFilterValue(row) : row[col.field || col.accessor];

  const visibleData = clickFilter
    ? tableConfig[activeTab].data.filter((row) => {
        const col = tableConfig[activeTab].columns.find((c) => (c.field || c.accessor) === clickFilter.field);
        if (!col) return true;
        const raw = resolveValue(col, row);
        const v = String(clickFilter.value).toLowerCase();
        return String(raw ?? '').toLowerCase() === v || String(raw ?? '').toLowerCase().includes(v);
      })
    : tableConfig[activeTab].data;

  const handleFilter = (field, value) => {
    if (value === undefined || value === null || value === '') return;
    setClickFilter({ field, value });
  };
  const clearFilter = () => setClickFilter(null);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Alerts & Notifications</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
            {totalAlerts > 0 ? (
              <span className="text-warning">{totalAlerts} active alert{totalAlerts !== 1 ? 's' : ''} require attention</span>
            ) : (
              'All systems nominal'
            )}
          </p>
        </div>
        <button
          onClick={() => fetchAlerts(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-surface border border-border text-xs md:text-sm text-gray-300 hover:text-white rounded-lg transition-colors disabled:opacity-50 shrink-0"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
        {visibleTabs.map((tab) => {
          const count = counts[tab.key];
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setClickFilter(null); }}
              className={`flex flex-col items-start p-3 md:p-4 rounded-lg border transition-all ${
                activeTab === tab.key
                  ? 'bg-primary/10 border-primary/40'
                  : 'bg-surface border-border hover:border-border-light'
              }`}
            >
              <tab.icon size={16} className={count > 0 ? 'text-warning' : 'text-gray-500'} />
              <p className="text-[10px] md:text-xs text-gray-500 mt-1.5 md:mt-2">{tab.label}</p>
              <p className={`text-lg md:text-2xl font-bold mt-0.5 ${count > 0 ? 'text-white' : 'text-gray-600'}`}>{count}</p>
            </button>
          );
        })}
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-0.5 bg-surface border border-border rounded-lg p-1">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setClickFilter(null); }}
            className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all ${
              activeTab === tab.key ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon size={13} />
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-alert/20 text-alert'}`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm md:text-base font-medium text-white capitalize">
            {TABS.find(t => t.key === activeTab)?.label} Alerts
          </h3>
          {clickFilter ? (
            <button onClick={clearFilter} className="flex items-center gap-1 px-2 py-1 rounded-md bg-background border border-border text-xs text-gray-300 hover:text-white hover:border-primary transition-colors">
              <X size={12} /> Clear filter
            </button>
          ) : (
            <span className="text-xs text-gray-500">{visibleData.length} records</span>
          )}
        </div>
        {clickFilter && (
          <div className="px-4 md:px-6 py-2 bg-background/30 border-b border-border flex items-center gap-2 text-xs text-gray-300">
            <Filter size={13} className="text-primary" />
            Showing all where <span className="text-primary font-medium">{clickFilter.field.replace(/_/g, ' ')}</span> ={' '}
            <span className="text-white font-semibold">&quot;{String(clickFilter.value)}&quot;</span>
          </div>
        )}
        {loading ? (
          <div className="p-6"><SkeletonTable rows={4} cols={4} /></div>
        ) : (
          tableConfig[activeTab] && (
            <AlertTable
              columns={tableConfig[activeTab].columns}
              data={visibleData}
              emptyMessage={tableConfig[activeTab].empty}
              onFilter={handleFilter}
              activeField={clickFilter?.field}
              activeValue={clickFilter?.value}
            />
          )
        )}
      </div>
    </div>
  );
};

export default AlertsPage;
