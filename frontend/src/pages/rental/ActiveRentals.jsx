import { useState, useEffect, useMemo } from 'react';
import { Search, X, Filter } from 'lucide-react';
import api from '../../lib/axios';

const ActiveRentals = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState(null);
  const [clickFilter, setClickFilter] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: 1, limit: 100 });
      const [oRes, sRes] = await Promise.allSettled([
        api.get('/orders/?' + params.toString()),
        api.get('/orders/summary'),
      ]);

      if (oRes.status === 'fulfilled') {
        setOrders(oRes.value.data.orders);
      }
      if (sRes.status === 'fulfilled') {
        setSummary(sRes.value.data);
      }
    } catch { /* fallback */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const pageSize = 15;

  const filtered = useMemo(() => {
    let rows = orders;
    const q = search.trim().toLowerCase();

    if (clickFilter && clickFilter.value !== undefined && clickFilter.value !== null && clickFilter.value !== '') {
      const v = String(clickFilter.value);
      if (clickFilter.key === 'status') rows = rows.filter(r => String(r.status).toLowerCase() === v.toLowerCase());
      else if (clickFilter.key === 'po') rows = rows.filter(r => String(r.po_wo_number).toLowerCase().includes(v.toLowerCase()));
      else if (clickFilter.key === 'client') rows = rows.filter(r => String(r.client_name).toLowerCase().includes(v.toLowerCase()));
      else if (clickFilter.key === 'location') rows = rows.filter(r => String(r.location).toLowerCase().includes(v.toLowerCase()));
      else if (clickFilter.key === 'date') rows = rows.filter(r => String(r.start_date).toLowerCase().includes(v.toLowerCase()) || String(r.end_date).toLowerCase().includes(v.toLowerCase()));
    }

    if (q) {
      rows = rows.filter((r) =>
        String(r.po_wo_number || '').toLowerCase().includes(q) ||
        String(r.client_name || '').toLowerCase().includes(q) ||
        String(r.location || '').toLowerCase().includes(q) ||
        String(r.start_date || '').toLowerCase().includes(q) ||
        String(r.end_date || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter) rows = rows.filter(r => r.status === statusFilter);
    return rows;
  }, [orders, search, statusFilter, clickFilter]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleFilter = (key, value) => {
    if (value === undefined || value === null || value === '') return;
    setClickFilter({ key, value });
    setPage(1);
    if (key === 'status') { setStatusFilter(value); }
    else { setStatusFilter(''); }
    setSearch('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilter = () => {
    setClickFilter(null);
    setSearch('');
    setStatusFilter('');
    setPage(1);
  };

  const Cell = ({ value, filterKey, className }) => {
    if (value === undefined || value === null || value === '') {
      return <td className={className}>-</td>;
    }
    const active = clickFilter && clickFilter.key === filterKey && String(clickFilter.value).toLowerCase() === String(value).toLowerCase();
    return (
      <td
        title={`Click to show all matching "${value}"`}
        className={className + ' cursor-pointer transition-colors hover:text-primary'}
        style={active ? { color: '#3B82F6', fontWeight: 600 } : undefined}
        onClick={() => handleFilter(filterKey, value)}
      >
        {value}
      </td>
    );
  };

  const fmt = (v) => v ? '\u20B9' + Number(v).toLocaleString('en-IN') : '-';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Active Rentals / Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Click any value (client, PO/WO, location...) to filter and view all matching orders</p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface border border-border rounded-lg p-4">
            <p className="text-xs text-gray-500">Total Orders</p>
            <p className="text-2xl font-bold text-white">{summary.total}</p>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4">
            <p className="text-xs text-gray-500">Active</p>
            <p className="text-2xl font-bold text-healthy">{summary.active}</p>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4">
            <p className="text-xs text-gray-500">Monthly Billing Potential</p>
            <p className="text-2xl font-bold text-white">{fmt(summary.total_billing_potential)}</p>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4">
            <p className="text-xs text-gray-500">Collection Rate</p>
            <p className="text-2xl font-bold text-primary">{summary.collection_rate}%</p>
          </div>
        </div>
      )}

      <div className="bg-surface border border-border rounded-lg p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); setClickFilter(null); }}
            className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" placeholder="Search by PO/WO number, client, location..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-background border border-border rounded-md pl-8 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary" />
            </div>
            <button type="submit" className="px-3 py-2 bg-primary text-white text-sm rounded-md hover:bg-blue-600">Search</button>
          </form>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); setClickFilter(null); }}
            className="bg-background border border-border rounded-md px-3 py-2 text-sm text-gray-300">
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="On-Hold">On Hold</option>
            <option value="N/E">N/E</option>
          </select>
        </div>

        {clickFilter && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            <Filter size={13} className="text-primary" />
            <span className="text-gray-300">
              Showing all orders where <span className="text-primary font-medium capitalize">{clickFilter.key === 'po' ? 'PO/WO Number' : clickFilter.key}</span> ={' '}
              <span className="text-white font-semibold">&quot;{String(clickFilter.value)}&quot;</span>
            </span>
            <button onClick={clearFilter} className="flex items-center gap-1 ml-2 px-2 py-1 rounded-md bg-background border border-border text-gray-300 hover:text-white hover:border-primary transition-colors">
              <X size={12} /> Clear filter
            </button>
          </div>
        )}
      </div>

      <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background/50">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">PO/WO Number</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Client</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Location</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Start Date</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">End Date</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Billing Potential</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Billing Actual</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="py-8 text-center text-gray-500">Loading...</td></tr>
              ) : pageRows.length === 0 ? (
                <tr><td colSpan="8" className="py-8 text-center text-gray-500">No orders found. Upload data via Data Upload page.</td></tr>
              ) : pageRows.map((o) => (
                <tr key={o.id} className="border-b border-border/50 hover:bg-white/[0.03]">
                  <Cell filterKey="po" value={o.po_wo_number || '-'} className="py-3 px-4 text-white font-mono text-xs" />
                  <Cell filterKey="client" value={o.client_name || '-'} className="py-3 px-4 text-gray-300" />
                  <Cell filterKey="location" value={o.location || '-'} className="py-3 px-4 text-gray-400 text-xs" />
                  <Cell filterKey="date" value={o.start_date || '-'} className="py-3 px-4 text-gray-400 text-xs" />
                  <Cell filterKey="date" value={o.end_date || '-'} className="py-3 px-4 text-gray-400 text-xs" />
                  <td className="py-3 px-4 text-gray-300">{fmt(o.monthly_billing_potential)}</td>
                  <td className="py-3 px-4 text-gray-300">{fmt(o.monthly_billing_actual)}</td>
                  <td className="py-3 px-4">
                    <span
                      className={'px-2 py-0.5 rounded-full text-xs font-medium ' + (
                        o.status === 'Active' ? 'bg-healthy/20 text-healthy' :
                        o.status === 'Completed' ? 'bg-primary/20 text-primary' :
                        o.status === 'On-Hold' ? 'bg-warning/20 text-warning' :
                        'bg-gray-700 text-gray-400'
                      )}
                      style={clickFilter && clickFilter.key === 'status' && String(clickFilter.value).toLowerCase() === String(o.status).toLowerCase() ? { outline: '1px solid #3B82F6' } : undefined}
                    >{o.status || 'Unknown'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > pageSize && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-gray-500">Showing {(safePage-1)*pageSize+1}-{Math.min(safePage*pageSize, total)} of {total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={safePage === 1}
                className="px-3 py-1 bg-background border border-border rounded text-xs text-gray-300 hover:border-primary disabled:opacity-50">Prev</button>
              <button onClick={() => setPage(p => p+1)} disabled={safePage >= pageCount}
                className="px-3 py-1 bg-background border border-border rounded text-xs text-gray-300 hover:border-primary disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveRentals;
