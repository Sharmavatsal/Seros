import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import api from '../../lib/axios';

const EquipmentInventory = () => {
  const [equipment, setEquipment] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (categoryFilter) params.set('category', categoryFilter);

      const [eqRes, sumRes] = await Promise.allSettled([
        api.get('/equipment/?' + params.toString()),
        api.get('/equipment/summary'),
      ]);

      if (eqRes.status === 'fulfilled') {
        setEquipment(eqRes.value.data.equipment);
        setTotal(eqRes.value.data.total_count);
      }
      if (sumRes.status === 'fulfilled') {
        setSummary(sumRes.value.data);
      }
    } catch { /* fallback */ }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, [page, statusFilter, categoryFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const fmt = (v) => v ? '\u20B9' + Number(v).toLocaleString('en-IN') : '-';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Equipment Inventory</h1>
        <p className="text-sm text-gray-500 mt-1">View and manage all equipment across locations</p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface border border-border rounded-lg p-4">
            <p className="text-xs text-gray-500">Total Equipment</p>
            <p className="text-2xl font-bold text-white">{summary.total}</p>
          </div>
          {Object.entries(summary.by_status || {}).map(([st, count]) => (
            <div key={st} className="bg-surface border border-border rounded-lg p-4">
              <p className="text-xs text-gray-500">{st}</p>
              <p className="text-2xl font-bold text-white">{count}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-surface border border-border rounded-lg p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search by reg no, type, make..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-background border border-border rounded-md pl-8 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              />
            </div>
            <button type="submit" className="px-3 py-2 bg-primary text-white text-sm rounded-md hover:bg-blue-600">Search</button>
          </form>

          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-background border border-border rounded-md px-3 py-2 text-sm text-gray-300">
            <option value="">All Status</option>
            <option value="Available">Available</option>
            <option value="In Operation">In Operation</option>
            <option value="Rented">Rented</option>
            <option value="Maintenance">Maintenance</option>
          </select>

          <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="bg-background border border-border rounded-md px-3 py-2 text-sm text-gray-300">
            <option value="">All Categories</option>
            <option value="Aerial Equipment">Aerial Equipment</option>
            <option value="Earth Moving">Earth Moving</option>
            <option value="Material Handling">Material Handling</option>
            <option value="Piling">Piling</option>
            <option value="Power">Power</option>
          </select>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background/50">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Reg No</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Type</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Make / Model</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Capacity</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Location</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Monthly Rate</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="py-8 text-center text-gray-500">Loading...</td></tr>
              ) : equipment.length === 0 ? (
                <tr><td colSpan="7" className="py-8 text-center text-gray-500">No equipment found. Upload data via Data Upload page.</td></tr>
              ) : equipment.map((eq) => (
                <tr key={eq.id} className="border-b border-border/50 hover:bg-white/[0.02]">
                  <td className="py-3 px-4 text-white font-mono text-xs">{eq.registration_no || eq.asset_code || '-'}</td>
                  <td className="py-3 px-4 text-gray-300">{eq.equipment_type || '-'}</td>
                  <td className="py-3 px-4 text-gray-300">{eq.make || '-'} {eq.model || ''}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{eq.capacity || '-'}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{eq.location || '-'}</td>
                  <td className="py-3 px-4 text-gray-300">{fmt(eq.monthly_rental)}</td>
                  <td className="py-3 px-4">
                    <span className={'px-2 py-0.5 rounded-full text-xs font-medium ' + (
                      eq.status === 'Available' ? 'bg-healthy/20 text-healthy' :
                      eq.status === 'In Operation' || eq.status === 'Rented' ? 'bg-primary/20 text-primary' :
                      eq.status === 'Maintenance' ? 'bg-alert/20 text-alert' :
                      'bg-gray-700 text-gray-400'
                    )}>{eq.status || 'Unknown'}</span>
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

export default EquipmentInventory;
