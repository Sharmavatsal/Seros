import { useState, useEffect } from 'react';
import { IndianRupee, Plus, TrendingUp, TrendingDown, X, Search, ChevronDown, Filter } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/ToastContext';
import MetricCard from '../../components/ui/MetricCard';
import { SkeletonKPIRow, SkeletonChart } from '../../components/ui/Skeletons';

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

const formatCurrency = (val) => `\u20B9${Number(val || 0).toLocaleString()}`;

const normalizeInvoice = (inv) => ({
  id: inv.id || inv.invoice_number,
  vertical: inv.vertical,
  amount: inv.amount,
  status: inv.status || inv.payment_status || 'pending',
  issue_date: inv.issue_date || inv.invoice_date,
  due_date: inv.due_date,
  invoice_number: inv.invoice_number,
  description: inv.description || inv.invoice_number || '',
});

const normalizeExpense = (exp) => ({
  id: exp.id,
  category: exp.category || exp.expense_type || 'other',
  amount: exp.amount,
  vertical: exp.vertical,
  date: exp.date || exp.expense_date,
  description: exp.description || exp.remarks || '',
});

// ─── Create Invoice Modal ─────────────────────────────────────────────────────
const InvoiceModal = ({ onClose, onCreated, userVertical }) => {
  const toast = useToast();
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    vertical: userVertical || 'rental',
    amount: '',
    invoice_date: today,
    due_date: '',
    payment_status: 'pending',
    invoice_number: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => {
      const updated = { ...f, [name]: value };
      if (name === 'invoice_date' && f.due_date && f.due_date <= value) {
        updated.due_date = '';
      }
      return updated;
    });
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (form.amount === '' || form.amount === null || isNaN(parseFloat(form.amount))) {
      e.amount = 'Amount is required';
    } else if (parseFloat(form.amount) <= 0) {
      e.amount = 'Amount must be greater than zero';
    }
    if (!form.invoice_date) {
      e.invoice_date = 'Invoice date is required';
    } else if (form.invoice_date > today) {
      e.invoice_date = 'Invoice date cannot be in the future';
    }
    if (!form.due_date) {
      e.due_date = 'Due date is required';
    } else if (form.due_date <= today) {
      e.due_date = 'Due date must be a future date';
    } else if (form.invoice_date && form.due_date <= form.invoice_date) {
      e.due_date = 'Due date must be after invoice date';
    }
    if (!form.vertical) e.vertical = 'Vertical is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await api.post('/finance/invoices', {
        vertical: form.vertical,
        amount: parseFloat(form.amount),
        invoice_date: form.invoice_date || null,
        due_date: form.due_date,
        payment_status: form.payment_status,
        invoice_number: form.invoice_number || null,
      });
      toast.success('Invoice created successfully');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  const labelCls = 'block text-xs font-medium text-gray-400 mb-1.5';
  const inputCls = 'w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors';
  const inputErr = 'border-alert/60';
  const errCls = 'block mt-1 text-xs text-alert';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-lg animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-white">Create Invoice</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className={labelCls}>Invoice Number</label>
              <input name="invoice_number" className={inputCls} value={form.invoice_number} onChange={handleChange} placeholder="e.g. INV-2026-001" />
            </div>
            <div>
              <label className={labelCls}>Vertical <span className="text-alert">*</span></label>
              <select name="vertical" className={inputCls} value={form.vertical} onChange={handleChange} disabled={!!userVertical}>
                {!userVertical && <option value="rental">Rental</option>}
                {!userVertical && <option value="piling">Piling</option>}
                {!userVertical && <option value="om">O&amp;M</option>}
                {userVertical && <option value={userVertical}>{userVertical.charAt(0).toUpperCase() + userVertical.slice(1)}</option>}
              </select>
              {errors.vertical && <span className={errCls}>{errors.vertical}</span>}
            </div>
            <div>
              <label className={labelCls}>Amount (₹) <span className="text-alert">*</span></label>
              <input name="amount" type="number" step="0.01" min="0" className={`${inputCls} ${errors.amount ? inputErr : ''}`} value={form.amount} onChange={handleChange} placeholder="0.00" />
              {errors.amount && <span className={errCls}>{errors.amount}</span>}
            </div>
            <div>
              <label className={labelCls}>Payment Status</label>
              <select name="payment_status" className={inputCls} value={form.payment_status} onChange={handleChange}>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Invoice Date <span className="text-alert">*</span></label>
              <input name="invoice_date" type="date" max={today} className={`${inputCls} ${errors.invoice_date ? inputErr : ''}`} value={form.invoice_date} onChange={handleChange} />
              {errors.invoice_date && <span className={errCls}>{errors.invoice_date}</span>}
            </div>
            <div>
              <label className={labelCls}>Due Date <span className="text-alert">*</span></label>
              <input name="due_date" type="date" min={form.invoice_date ? new Date(new Date(form.invoice_date).getTime() + 86400000).toISOString().split('T')[0] : today} className={`${inputCls} ${errors.due_date ? inputErr : ''}`} value={form.due_date} onChange={handleChange} />
              {errors.due_date && <span className={errCls}>{errors.due_date}</span>}
            </div>
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
  const userVertical = ROLE_VERTICAL[user?.role] || null;

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clickFilter, setClickFilter] = useState(null);

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
      const [invRes, expRes, sumRes] = await Promise.allSettled([
        api.get('/finance/invoices', { params }),
        api.get('/finance/expenses', { params }),
        api.get('/finance/dashboard', { params }),
      ]);
      if (invRes.status === 'fulfilled') setInvoices(invRes.data.length ? invRes.data.map(normalizeInvoice) : MOCK_INVOICES);
      else setInvoices(MOCK_INVOICES);
      if (expRes.status === 'fulfilled') setExpenses(expRes.data.length ? expRes.data.map(normalizeExpense) : MOCK_EXPENSES);
      else setExpenses(MOCK_EXPENSES);
      if (sumRes.status === 'fulfilled') setSummary(sumRes.data || MOCK_SUMMARY);
      else setSummary(MOCK_SUMMARY);
    } catch {
      setInvoices(MOCK_INVOICES);
      setExpenses(MOCK_EXPENSES);
      setSummary(MOCK_SUMMARY);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchAll(); }, []);

  const filteredInvoices = invoices.filter((inv) => {
    const matchSearch = !search || inv.description?.toLowerCase().includes(search.toLowerCase()) || inv.id?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || inv.status === statusFilter;
    const matchClick = !clickFilter || String(inv[clickFilter.key]).toLowerCase() === String(clickFilter.value).toLowerCase();
    return matchSearch && matchStatus && matchClick;
  });

  const filteredExpenses = expenses.filter((exp) => {
    if (!clickFilter) return true;
    const v = String(clickFilter.value).toLowerCase();
    if (clickFilter.key === 'category') return String(exp.category).toLowerCase() === v;
    if (clickFilter.key === 'vertical') return String(exp.vertical).toLowerCase() === v;
    if (clickFilter.key === 'id') return String(exp.id).toLowerCase() === v;
    if (clickFilter.key === 'date') return String(exp.date).toLowerCase() === v;
    if (clickFilter.key === 'description') return String(exp.description || '').toLowerCase().includes(v);
    return true;
  });

  const handleInvFilter = (key, value) => {
    if (value === undefined || value === null || value === '') return;
    setClickFilter({ key, value });
    if (key === 'status') setStatusFilter(value);
  };

  const handleExpFilter = (key, value) => {
    if (value === undefined || value === null || value === '') return;
    setClickFilter({ key, value });
  };

  const clearFilter = () => {
    setClickFilter(null);
    setStatusFilter('');
    setSearch('');
  };

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Finance & Revenue</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
            {userVertical ? `${userVertical.charAt(0).toUpperCase() + userVertical.slice(1)} vertical` : 'All verticals'}
          </p>
        </div>
        {activeTab === 'invoices' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-primary hover:bg-primary-dark text-white text-xs md:text-sm font-medium rounded-lg transition-colors shrink-0"
          >
            <Plus size={16} />
            New Invoice
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-surface border border-border rounded-lg p-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => { setActiveTab(t); setClickFilter(null); setStatusFilter(''); setSearch(''); }}
            className={`px-3 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-medium capitalize transition-all ${activeTab === t ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
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
                <MetricCard title="Total Revenue (YTD)" value={formatCurrency(summary?.total_revenue)} icon={IndianRupee} trend={12.5} trendLabel="vs last year" />
                <MetricCard title="Outstanding Receivables" value={formatCurrency(summary?.outstanding_receivables)} icon={TrendingDown} trend={-8.3} trendLabel="vs last month" trendUpIsGood={false} />
                <MetricCard title="Total Expenses (YTD)" value={formatCurrency(summary?.total_expenses)} icon={TrendingUp} trend={5.2} trendLabel="vs last month" trendUpIsGood={false} />
              </div>

              <div className="bg-surface border border-border rounded-lg p-4 md:p-6 shadow-sm">
                <h3 className="text-sm md:text-lg font-medium text-white mb-4 md:mb-6">Revenue vs Expenses</h3>
                <div style={{ height: 260 }} className="md:min-h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                      <XAxis dataKey="month" stroke="#A1A1AA" tick={{ fill: '#A1A1AA' }} axisLine={false} tickLine={false} />
                      <YAxis stroke="#A1A1AA" tick={{ fill: '#A1A1AA' }} axisLine={false} tickLine={false} tickFormatter={(v) => `\u20B9${v / 1000}k`} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#27272A', color: '#FFF' }} formatter={(v) => `\u20B9${v.toLocaleString()}`} cursor={{ fill: '#27272A', opacity: 0.3 }} />
                      <Legend wrapperStyle={{ color: '#A1A1AA' }} />
                      <Bar dataKey="revenue" name="Revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Profitability line */}
              <div className="bg-surface border border-border rounded-lg p-4 md:p-6 shadow-sm">
                <h3 className="text-sm md:text-lg font-medium text-white mb-4 md:mb-6">Net Profitability Trend</h3>
                <div style={{ height: 220 }} className="md:min-h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueChartData.map(d => ({ ...d, profit: d.revenue - d.expenses }))} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                      <XAxis dataKey="month" stroke="#A1A1AA" tick={{ fill: '#A1A1AA' }} axisLine={false} tickLine={false} />
                      <YAxis stroke="#A1A1AA" tick={{ fill: '#A1A1AA' }} axisLine={false} tickLine={false} tickFormatter={(v) => `\u20B9${v / 1000}k`} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#27272A', color: '#FFF' }} formatter={(v) => `\u20B9${v.toLocaleString()}`} />
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
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className="relative flex-1 max-w-full sm:max-w-sm">
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
                    onChange={(e) => { setStatusFilter(e.target.value); setClickFilter(null); }}
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

              {clickFilter && (
                <div className="flex items-center gap-2 text-xs bg-surface border border-border rounded-lg px-3 py-2 w-fit">
                  <Filter size={13} className="text-primary" />
                  <span className="text-gray-300">
                    Showing all invoices where <span className="text-primary font-medium capitalize">{clickFilter.key}</span> ={' '}
                    <span className="text-white font-semibold">&quot;{String(clickFilter.value)}&quot;</span>
                  </span>
                  <button onClick={clearFilter} className="flex items-center gap-1 ml-1 px-2 py-1 rounded-md bg-background border border-border text-gray-300 hover:text-white hover:border-primary transition-colors">
                    <X size={12} /> Clear filter
                  </button>
                </div>
              )}

              <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-sm md:text-base font-medium text-white">Invoices</h3>
                <span className="text-xs text-gray-500">{filteredInvoices.length} records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background/40">
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vertical</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    </tr>
                  </thead>
                    <tbody className="divide-y divide-border">
                      {filteredInvoices.length === 0 ? (
                        <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-500">No invoices found</td></tr>
                      ) : filteredInvoices.map((inv, i) => (
                        <tr key={inv.id || i} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-3 md:px-6 py-3 md:py-4 font-mono text-xs text-gray-300 cursor-pointer hover:text-primary transition-colors"
                            onClick={() => handleInvFilter('id', inv.id)} title="Click to show all matching invoice"
                            style={clickFilter?.key === 'id' && String(clickFilter.value).toLowerCase() === String(inv.id).toLowerCase() ? { color: '#3B82F6' } : undefined}>{inv.id}</td>
                          <td className="px-3 md:px-6 py-3 md:py-4 cursor-pointer hover:text-primary transition-colors"
                            onClick={() => handleInvFilter('vertical', inv.vertical)} title="Click to show all matching vertical"
                            style={clickFilter?.key === 'vertical' && String(clickFilter.value).toLowerCase() === String(inv.vertical).toLowerCase() ? { color: '#3B82F6' } : undefined}><span className="capitalize text-gray-300">{inv.vertical}</span></td>
                          <td className="px-3 md:px-6 py-3 md:py-4 font-semibold text-white">{formatCurrency(inv.amount)}</td>
                          <td className="px-3 md:px-6 py-3 md:py-4">
                            <span
                              onClick={() => handleInvFilter('status', inv.status)}
                              className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-medium capitalize cursor-pointer transition-opacity hover:opacity-80 ${STATUS_COLORS[inv.status] || 'bg-gray-700 text-gray-400'}`}
                              style={clickFilter?.key === 'status' && String(clickFilter.value).toLowerCase() === String(inv.status).toLowerCase() ? { outline: '1px solid #3B82F6' } : undefined}
                              title="Click to show all matching status"
                            >{inv.status}</span>
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-gray-400 cursor-pointer hover:text-primary transition-colors"
                            onClick={() => handleInvFilter('issue_date', inv.issue_date)} title="Click to show all matching issue date"
                            style={clickFilter?.key === 'issue_date' && String(clickFilter.value).toLowerCase() === String(inv.issue_date).toLowerCase() ? { color: '#3B82F6' } : undefined}>{inv.issue_date}</td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-gray-400 cursor-pointer hover:text-primary transition-colors"
                            onClick={() => handleInvFilter('due_date', inv.due_date)} title="Click to show all matching due date"
                            style={clickFilter?.key === 'due_date' && String(clickFilter.value).toLowerCase() === String(inv.due_date).toLowerCase() ? { color: '#3B82F6' } : undefined}>{inv.due_date || '—'}</td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-gray-400 max-w-[120px] md:max-w-[200px] truncate cursor-pointer hover:text-primary transition-colors"
                            onClick={() => handleInvFilter('description', inv.description)} title="Click to show all matching description"
                            style={clickFilter?.key === 'description' && String(clickFilter.value || '').toLowerCase() === String(inv.description || '').toLowerCase() ? { color: '#3B82F6' } : undefined}>{inv.description || '—'}</td>
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
            <div className="space-y-4">
              {clickFilter && (
                <div className="flex items-center gap-2 text-xs bg-surface border border-border rounded-lg px-3 py-2 w-fit">
                  <Filter size={13} className="text-primary" />
                  <span className="text-gray-300">
                    Showing all expenses where <span className="text-primary font-medium capitalize">{clickFilter.key}</span> ={' '}
                    <span className="text-white font-semibold">&quot;{String(clickFilter.value)}&quot;</span>
                  </span>
                  <button onClick={clearFilter} className="flex items-center gap-1 ml-1 px-2 py-1 rounded-md bg-background border border-border text-gray-300 hover:text-white hover:border-primary transition-colors">
                    <X size={12} /> Clear filter
                  </button>
                </div>
              )}
              <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-sm md:text-base font-medium text-white">Expenses</h3>
                <span className="text-xs text-gray-500">{filteredExpenses.length} records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background/40">
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vertical</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredExpenses.length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">No expenses found</td></tr>
                    ) : filteredExpenses.map((exp, i) => (
                      <tr key={exp.id || i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-3 md:px-6 py-3 md:py-4 font-mono text-xs text-gray-300 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleExpFilter('id', exp.id)} title="Click to show all matching expense ID"
                          style={clickFilter?.key === 'id' && String(clickFilter.value).toLowerCase() === String(exp.id).toLowerCase() ? { color: '#3B82F6' } : undefined}>{exp.id}</td>
                        <td className="px-3 md:px-6 py-3 md:py-4">
                          <span
                            onClick={() => handleExpFilter('category', exp.category)}
                            className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-medium capitalize cursor-pointer transition-opacity hover:opacity-80 ${CATEGORY_COLORS[exp.category] || 'bg-gray-700 text-gray-400'}`}
                            style={clickFilter?.key === 'category' && String(clickFilter.value).toLowerCase() === String(exp.category).toLowerCase() ? { outline: '1px solid #3B82F6' } : undefined}
                            title="Click to show all matching category">{exp.category}</span>
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 font-semibold text-white">{formatCurrency(exp.amount)}</td>
                        <td className="px-3 md:px-6 py-3 md:py-4 capitalize text-gray-400 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleExpFilter('vertical', exp.vertical)} title="Click to show all matching vertical"
                          style={clickFilter?.key === 'vertical' && String(clickFilter.value).toLowerCase() === String(exp.vertical).toLowerCase() ? { color: '#3B82F6' } : undefined}>{exp.vertical}</td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-gray-400 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleExpFilter('date', exp.date)} title="Click to show all matching date"
                          style={clickFilter?.key === 'date' && String(clickFilter.value).toLowerCase() === String(exp.date).toLowerCase() ? { color: '#3B82F6' } : undefined}>{exp.date}</td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-gray-400 max-w-[120px] md:max-w-[200px] truncate cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleExpFilter('description', exp.description)} title="Click to show all matching description"
                          style={clickFilter?.key === 'description' && String(clickFilter.value || '').toLowerCase() === String(exp.description || '').toLowerCase() ? { color: '#3B82F6' } : undefined}>{exp.description || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
