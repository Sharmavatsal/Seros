import { useState, useEffect } from 'react';
import api from '../../lib/axios';

const ActiveRentals = () => {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const [oRes, sRes] = await Promise.allSettled([
        api.get('/orders/?' + params.toString()),
        api.get('/orders/summary'),
      ]);

      if (oRes.status === 'fulfilled') {
        setOrders(oRes.value.data.orders);
        setTotal(oRes.value.data.total_count);
      }
      if (sRes.status === 'fulfilled') {
        setSummary(sRes.value.data);
      }
    } catch { /* fallback */ }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, [page, statusFilter]);

  const fmt = (v) => v ? '\u20B9' + Number(v).toLocaleString('en-IN') : '-';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Active Rentals / Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Track all active orders, POs, and billing status</p>
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
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchData(); }}
            className="flex items-center gap-2 flex-1 min-w-[200px]">
            <input type="text" placeholder="Search by PO/WO number, location..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary" />
            <button type="submit" className="px-3 py-2 bg-primary text-white text-sm rounded-md hover:bg-blue-600">Search</button>
          </form>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-background border border-border rounded-md px-3 py-2 text-sm text-gray-300">
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="On-Hold">On Hold</option>
            <option value="N/E">N/E</option>
          </select>
        </div>
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
              ) : orders.length === 0 ? (
                <tr><td colSpan="8" className="py-8 text-center text-gray-500">No orders found. Upload data via Data Upload page.</td></tr>
              ) : orders.map((o) => (
                <tr key={o.id} className="border-b border-border/50 hover:bg-white/[0.02]">
                  <td className="py-3 px-4 text-white font-mono text-xs">{o.po_wo_number || '-'}</td>
                  <td className="py-3 px-4 text-gray-300">{o.client_name || '-'}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{o.location || '-'}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{o.start_date || '-'}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{o.end_date || '-'}</td>
                  <td className="py-3 px-4 text-gray-300">{fmt(o.monthly_billing_potential)}</td>
                  <td className="py-3 px-4 text-gray-300">{fmt(o.monthly_billing_actual)}</td>
                  <td className="py-3 px-4">
                    <span className={'px-2 py-0.5 rounded-full text-xs font-medium ' + (
                      o.status === 'Active' ? 'bg-healthy/20 text-healthy' :
                      o.status === 'Completed' ? 'bg-primary/20 text-primary' :
                      o.status === 'On-Hold' ? 'bg-warning/20 text-warning' :
                      'bg-gray-700 text-gray-400'
                    )}>{o.status || 'Unknown'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > 15 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-gray-500">Showing {(page-1)*15+1}-{Math.min(page*15, total)} of {total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="px-3 py-1 bg-background border border-border rounded text-xs text-gray-300 hover:border-primary disabled:opacity-50">Prev</button>
              <button onClick={() => setPage(p => p+1)} disabled={page*15 >= total}
                className="px-3 py-1 bg-background border border-border rounded text-xs text-gray-300 hover:border-primary disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveRentals;
