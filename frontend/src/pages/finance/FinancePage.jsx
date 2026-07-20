import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Plus, X, Search, ChevronDown } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from 'recharts';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/ToastContext';
import { SkeletonKPIRow, SkeletonChart, SkeletonTable } from '../../components/ui/Skeletons';
import MetricCard from '../../components/ui/MetricCard';

const ROLE_VERTICAL = {
  admin: null,
  rental_manager: 'rental',
  piling_manager: 'piling',
  om_manager: 'om',
};

const STATUS_COLORS = {
  paid: 'bg-healthy/20 text-healthy',
  pending: 'bg-warning/20 text-warning',
  overdue: 'bg-alert/20 text-alert',
};

const CATEGORY_COLORS = {
  fuel: 'bg-blue-500/20 text-blue-400',
  maintenance: 'bg-purple-500/20 text-purple-400',
  equipment: 'bg-primary/20 text-primary',
  vendor: 'bg-orange-500/20 text-orange-400',
  other: 'bg-gray-600/20 text-gray-400',
};

const formatCurrency = (val) => `$${Number(val || 0).toLocaleString()}`;

// ─── Create Invoice Modal ─────────────────────────────────────────────────────
const InvoiceModal = ({ onClose, onCreated, userVertical }) => {
  const toast = useToast();
  const [form, setForm] = useState({
    client_id: '',
    project_id: '',
    vertical: userVertical || 'rental',
    amount: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    status: 'pending',
    description: '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/finance/invoices', { ...form, amount: parseFloat(form.amount) });
      toast.success('Invoice created successfully');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-lg animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-white">Create Invoice</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Amount ($)</label>
              <input name="amount" type="number" step="0.01" required className={inputCls} value={form.amount} onChange={handleChange} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Vertical</label>
              <select name="vertical" className={inputCls} value={form.vertical} onChange={handleChange} disabled={!!userVertical}>
                {!userVertical && <option value="rental">Rental</option>}
                {!userVertical && <option value="piling">Piling</option>}
                {!userVertical && <option value="om">O&amp;M</option>}
                {userVertical && <option value={userVertical}>{userVertical.charAt(0).toUpperCase() + userVertical.slice(1)}</option>}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Issue Date</label>
              <input name="issue_date" type="date" required className={inputCls} value={form.issue_date} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Due Date</label>
              <input name="due_date" type="date" className={inputCls} value={form.due_date} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Status</label>
              <select name="status" className={inputCls} value={form.status} onChange={handleChange}>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
            <textarea name="description" rows={2} className={inputCls + ' resize-none'} value={form.description} onChange={handleChange} placeholder="Invoice description..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-border text-gray-400 hover:text-white rounded-md transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 text-sm bg-primary hover:bg-primary-dark text-white rounded-md transition-colors disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Finance Page ─────────────────────────────────────────────────────────────
const FinancePage = () => {
  const user = useAuthStore((s) => s.user);
  const toast = useToast();
  const userVertical = ROLE_VERTICAL[user?.role] || null;

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const MOCK_INVOICES = [
    { id: 'INV-001', vertical: userVertical || 'rental', amount: 45000, status: 'paid', issue_date: '2026-01-15', due_date: '2026-02-15', description: 'Equipment rental - Excavator' },
    { id: 'INV-002', vertical: userVertical || 'rental', amount: 28500, status: 'pending', issue_date: '2026-06-01', due_date: '2026-07-01', description: 'Crane hire - Project Alpha' },
    { id: 'INV-003', vertical: userVertical || 'rental', amount: 15000, status: 'overdue', issue_date: '2026-03-01', due_date: '2026-04-01', description: 'Generator rental' },
    { id: 'INV-004', vertical: userVertical || 'rental', amount: 62000, status: 'paid', issue_date: '2026-05-10', due_date: '2026-06-10', description: 'Bulldozer - Site B' },
  ];

  const MOCK_EXPENSES = [
    { id: 'EXP-001', vertical: userVertical || 'rental', amount: 8200, category: 'fuel', description: 'Diesel - Fleet', date: '2026-06-10' },
    { id: 'EXP-002', vertical: userVertical || 'rental', amount: 4500, category: 'maintenance', description: 'Service - Excavator 20T', date: '2026-06-15' },
    { id: 'EXP-003', vertical: userVertical || 'rental', amount: 12000, category: 'equipment', description: 'Spare parts purchase', date: '2026-07-01' },
    { id: 'EXP-004', vertical: userVertical || 'rental', amount: 3200, category: 'vendor', description: 'Third-party crane operator', date: '2026-07-05' },
  ];

  const MOCK_SUMMARY = {
    total_revenue: 150500,
    outstanding_receivables: 43500,
    total_expenses: 27900,
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = userVertical ? { vertical: userVertical } : {};
      const [invRes, expRes, sumRes] = await Promise.all([
        api.get('/finance/invoices', { params }),
        api.get('/finance/expenses', { params }),
        api.get('/finance/dashboard', { params }),
      ]);
      setInvoices(invRes.data.length ? invRes.data : MOCK_INVOICES);
      setExpenses(expRes.data.length ? expRes.data : MOCK_EXPENSES);
      setSummary(sumRes.data || MOCK_SUMMARY);
    } catch {
      setInvoices(MOCK_INVOICES);
      setExpenses(MOCK_EXPENSES);
      setSummary(MOCK_SUMMARY);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const filteredInvoices = invoices.filter((inv) => {
    const matchSearch = !search || inv.description?.toLowerCase().includes(search.toLowerCase()) || inv.id?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const revenueChartData = [
    { month: 'Jan', revenue: 85000, expenses: 18000 },
    { month: 'Feb', revenue: 102000, expenses: 22000 },
    { month: 'Mar', revenue: 95000, expenses: 19500 },
    { month: 'Apr', revenue: 120000, expenses: 25000 },
    { month: 'May', revenue: 135000, expenses: 27000 },
    { month: 'Jun', revenue: 150500, expenses: 27900 },
  ];

  const tabs = ['overview', 'invoices', 'expenses'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Finance & Revenue</h1>
          <p className="text-sm text-gray-500 mt-1">
            {userVertical ? `${userVertical.charAt(0).toUpperCase() + userVertical.slice(1)} vertical` : 'All verticals'}
          </p>
        </div>
        {activeTab === 'invoices' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={16} />
            New Invoice
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface border border-border rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${activeTab === t ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-6">
          <SkeletonKPIRow />
          <SkeletonChart height={300} />
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard title="Total Revenue (YTD)" value={formatCurrency(summary?.total_revenue)} icon={DollarSign} trend={12.5} trendLabel="vs last year" />
                <MetricCard title="Outstanding Receivables" value={formatCurrency(summary?.outstanding_receivables)} icon={TrendingDown} trend={-8.3} trendLabel="vs last month" trendUpIsGood={false} />
                <MetricCard title="Total Expenses (YTD)" value={formatCurrency(summary?.total_expenses)} icon={TrendingUp} trend={5.2} trendLabel="vs last month" trendUpIsGood={false} />
              </div>

              <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-medium text-white mb-6">Revenue vs Expenses</h3>
                <div style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                      <XAxis dataKey="month" stroke="#A1A1AA" tick={{ fill: '#A1A1AA' }} axisLine={false} tickLine={false} />
                      <YAxis stroke="#A1A1AA" tick={{ fill: '#A1A1AA' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#27272A', color: '#FFF' }} formatter={(v) => `$${v.toLocaleString()}`} cursor={{ fill: '#27272A', opacity: 0.3 }} />
                      <Legend wrapperStyle={{ color: '#A1A1AA' }} />
                      <Bar dataKey="revenue" name="Revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Profitability line */}
              <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-medium text-white mb-6">Net Profitability Trend</h3>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueChartData.map(d => ({ ...d, profit: d.revenue - d.expenses }))} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                      <XAxis dataKey="month" stroke="#A1A1AA" tick={{ fill: '#A1A1AA' }} axisLine={false} tickLine={false} />
                      <YAxis stroke="#A1A1AA" tick={{ fill: '#A1A1AA' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#27272A', color: '#FFF' }} formatter={(v) => `$${v.toLocaleString()}`} />
                      <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                    placeholder="Search invoices..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-primary appearance-none pr-8"
                  >
                    <option value="">All Status</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>

              <div className="bg-surface border border-border rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="text-base font-medium text-white">Invoices</h3>
                  <span className="text-xs text-gray-500">{filteredInvoices.length} records</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-background/40">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vertical</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredInvoices.length === 0 ? (
                        <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-500">No invoices found</td></tr>
                      ) : filteredInvoices.map((inv, i) => (
                        <tr key={inv.id || i} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-gray-300">{inv.id}</td>
                          <td className="px-6 py-4"><span className="capitalize text-gray-300">{inv.vertical}</span></td>
                          <td className="px-6 py-4 font-semibold text-white">{formatCurrency(inv.amount)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[inv.status] || 'bg-gray-700 text-gray-400'}`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-400">{inv.issue_date}</td>
                          <td className="px-6 py-4 text-gray-400">{inv.due_date || '—'}</td>
                          <td className="px-6 py-4 text-gray-400 max-w-[200px] truncate">{inv.description || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Expenses Tab */}
          {activeTab === 'expenses' && (
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-base font-medium text-white">Expenses</h3>
                <span className="text-xs text-gray-500">{expenses.length} records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background/40">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vertical</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {expenses.map((exp, i) => (
                      <tr key={exp.id || i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-gray-300">{exp.id}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${CATEGORY_COLORS[exp.category] || 'bg-gray-700 text-gray-400'}`}>
                            {exp.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-white">{formatCurrency(exp.amount)}</td>
                        <td className="px-6 py-4 capitalize text-gray-400">{exp.vertical}</td>
                        <td className="px-6 py-4 text-gray-400">{exp.date}</td>
                        <td className="px-6 py-4 text-gray-400 max-w-[200px] truncate">{exp.description || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {showModal && (
        <InvoiceModal
          onClose={() => setShowModal(false)}
          onCreated={fetchAll}
          userVertical={userVertical}
        />
      )}
    </div>
  );
};

export default FinancePage;
