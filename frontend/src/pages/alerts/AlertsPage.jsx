import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, FileText, Wrench, DollarSign, RefreshCw, CheckCircle } from 'lucide-react';
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

const AlertTable = ({ columns, data, emptyMessage = 'No alerts' }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border bg-background/40">
          {columns.map((col, i) => (
            <th key={i} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {data.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="px-6 py-12 text-center">
              <div className="flex flex-col items-center gap-2">
                <CheckCircle size={32} className="text-healthy/50" />
                <p className="text-gray-500">{emptyMessage}</p>
              </div>
            </td>
          </tr>
        ) : (
          data.map((row, ri) => (
            <tr key={ri} className="hover:bg-white/[0.02] transition-colors">
              {columns.map((col, ci) => (
                <td key={ci} className="px-6 py-3.5 text-gray-300">
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
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
  { key: 'finance', label: 'Finance', icon: DollarSign, roles: ['admin', 'rental_manager', 'piling_manager', 'om_manager'] },
];

const AlertsPage = () => {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('equipment');
  const [refreshing, setRefreshing] = useState(false);

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
    { header: 'Asset Code', accessor: 'asset_code' },
    { header: 'Alert Type', render: (r) => <span className="px-2 py-1 rounded-full text-xs font-medium bg-warning/20 text-warning">{r.alert_type}</span> },
    { header: 'Expiry Date', accessor: 'expiry_date' },
    { header: 'Status', render: (r) => <SeverityBadge days={r.days_remaining} /> },
  ];

  const rentalColumns = [
    { header: 'Contract No', accessor: 'contract_no' },
    { header: 'Client', accessor: 'client_name' },
    { header: 'Expiry Date', accessor: 'expiry_date' },
    { header: 'Status', render: (r) => <SeverityBadge days={r.days_remaining} /> },
  ];

  const opsColumns = [
    { header: 'Asset Code', accessor: 'asset_code' },
    { header: 'Log Date', accessor: 'log_date' },
    { header: 'Type', render: () => <span className="px-2 py-1 rounded-full text-xs bg-alert/20 text-alert">Breakdown</span> },
    { header: 'Remarks', accessor: 'remarks' },
  ];

  const omColumns = [
    { header: 'Alert Type', render: (r) => <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.alert_type === 'SLA Breach' ? 'bg-alert/20 text-alert' : 'bg-warning/20 text-warning'}`}>{r.alert_type}</span> },
    { header: 'Details', accessor: 'details' },
    { header: 'Reference ID', accessor: 'reference_id' },
  ];

  const financeColumns = [
    { header: 'Invoice ID', accessor: 'invoice_id' },
    { header: 'Vertical', render: (r) => <span className="capitalize text-gray-300">{r.vertical}</span> },
    { header: 'Amount', render: (r) => <span className="font-semibold text-white">${Number(r.amount).toLocaleString()}</span> },
    { header: 'Overdue', render: (r) => <span className="px-2 py-0.5 rounded-full text-xs bg-alert/20 text-alert font-medium">{r.days_overdue} days</span> },
  ];

  const tableConfig = {
    equipment: { columns: eqColumns, data: alerts?.equipment_alerts || [], empty: 'No equipment alerts — all documents are current' },
    rental: { columns: rentalColumns, data: alerts?.rental_alerts || [], empty: 'No rental alerts — all contracts are active' },
    operations: { columns: opsColumns, data: alerts?.operations_alerts || [], empty: 'No breakdown alerts — all equipment operational' },
    om: { columns: omColumns, data: alerts?.om_alerts || [], empty: 'No O&M alerts — SLA and PM on track' },
    finance: { columns: financeColumns, data: alerts?.finance_alerts || [], empty: 'No finance alerts — all invoices current' },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Alerts & Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
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
          className="flex items-center gap-2 px-4 py-2 bg-surface border border-border text-sm text-gray-300 hover:text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {visibleTabs.map((tab) => {
          const count = counts[tab.key];
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-col items-start p-4 rounded-lg border transition-all ${
                activeTab === tab.key
                  ? 'bg-primary/10 border-primary/40'
                  : 'bg-surface border-border hover:border-border-light'
              }`}
            >
              <tab.icon size={18} className={count > 0 ? 'text-warning' : 'text-gray-500'} />
              <p className="text-xs text-gray-500 mt-2">{tab.label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${count > 0 ? 'text-white' : 'text-gray-600'}`}>{count}</p>
            </button>
          );
        })}
      </div>

      {/* Tab bar */}
      <div className="flex gap-0.5 bg-surface border border-border rounded-lg p-1 w-fit">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
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
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-base font-medium text-white capitalize">
            {TABS.find(t => t.key === activeTab)?.label} Alerts
          </h3>
        </div>
        {loading ? (
          <div className="p-6"><SkeletonTable rows={4} cols={4} /></div>
        ) : (
          tableConfig[activeTab] && (
            <AlertTable
              columns={tableConfig[activeTab].columns}
              data={tableConfig[activeTab].data}
              emptyMessage={tableConfig[activeTab].empty}
            />
          )
        )}
      </div>
    </div>
  );
};

export default AlertsPage;
