import { useState, useEffect, useMemo } from 'react';
import { Search, X, Filter } from 'lucide-react';
import api from '../../lib/axios';

const EquipmentInventory = () => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState(null);
  const [clickFilter, setClickFilter] = useState(null);
  const [showFilterNote, setShowFilterNote] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: 1, limit: 100 });
      const [eqRes, sumRes] = await Promise.allSettled([
        api.get('/equipment/?' + params.toString()),
        api.get('/equipment/summary'),
      ]);

      if (eqRes.status === 'fulfilled') {
        setEquipment(eqRes.value.data.equipment);
      }
      if (sumRes.status === 'fulfilled') {
        setSummary(sumRes.value.data);
      }
    } catch { /* fallback */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const pageSize = 15;

  const filtered = useMemo(() => {
    let rows = equipment;
    const q = search.trim().toLowerCase();

    const applyClick = (rows) => {
      if (!clickFilter || clickFilter.value === undefined || clickFilter.value === null || clickFilter.value === '') return rows;
      const v = String(clickFilter.value).toLowerCase();
      const exact = (val) => String(val ?? '').toLowerCase() === v;
      const cellValue = (key, r) => {
        switch (key) {
          case 'reg': return r.registration_no || r.asset_code;
          case 'type': return r.equipment_type;
          case 'make': return (r.make || '') + (r.model ? ' ' + r.model : '');
          case 'capacity': return r.capacity;
          case 'location': return r.location;
          case 'status': return r.status;
          case 'category': return r.category;
          default: return undefined;
        }
      };
      return rows.filter(r => exact(cellValue(clickFilter.key, r)));
    };

    rows = applyClick(rows);

    if (q) {
      rows = rows.filter((r) =>
        String(r.registration_no || '').toLowerCase().includes(q) ||
        String(r.equipment_type || '').toLowerCase().includes(q) ||
        String(r.make || '').toLowerCase().includes(q) ||
        String(r.model || '').toLowerCase().includes(q) ||
        String(r.location || '').toLowerCase().includes(q) ||
        String(r.capacity || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter) rows = rows.filter(r => r.status === statusFilter);
    if (categoryFilter) rows = rows.filter(r => String(r.category).toLowerCase().includes(categoryFilter.toLowerCase()));
    return rows;
  }, [equipment, search, statusFilter, categoryFilter, clickFilter]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleFilter = (key, value) => {
    if (value === undefined || value === null || value === '') return;
    setClickFilter({ key, value });
    setPage(1);
    if (key === 'status') { setStatusFilter(value); setCategoryFilter(''); }
    else if (key === 'category') { setCategoryFilter(value); setStatusFilter(''); }
    else { setStatusFilter(''); setCategoryFilter(''); }
    setSearch('');
    setShowFilterNote(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilter = () => {
    setClickFilter(null);
    setSearch('');
    setStatusFilter('');
    setCategoryFilter('');
    setPage(1);
    setShowFilterNote(false);
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
  const badgeCls = 'px-2 py-0.5 rounded-full text-xs font-medium inline-block ';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Equipment Inventory</h1>
        <p className="text-sm text-gray-500 mt-1">Click any value (reg no, type, make, location...) to filter and view all matching equipment</p>
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
          <form onSubmit={(e) => { e.preventDefault(); setPage(1); setClickFilter(null); }}
            className="flex items-center gap-2 flex-1 min-w-[200px]">
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

          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); setClickFilter(null); }}
            className="bg-background border border-border rounded-md px-3 py-2 text-sm text-gray-300">
            <option value="">All Status</option>
            <option value="Available">Available</option>
            <option value="In Operation">In Operation</option>
            <option value="Rented">Rented</option>
            <option value="Maintenance">Maintenance</option>
          </select>

          <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); setClickFilter(null); }}
            className="bg-background border border-border rounded-md px-3 py-2 text-sm text-gray-300">
            <option value="">All Categories</option>
            <option value="Aerial Equipment">Aerial Equipment</option>
            <option value="Earth Moving">Earth Moving</option>
            <option value="Material Handling">Material Handling</option>
            <option value="Piling">Piling</option>
            <option value="Power">Power</option>
          </select>
        </div>

        {clickFilter && (
          <div className="mt-3 flex items-center gap-2 text-xs" onClick={() => setShowFilterNote(true)}>
            <Filter size={13} className="text-primary" />
            <span className="text-gray-300">
              Showing all equipment where <span className="text-primary font-medium capitalize">{clickFilter.key}</span> ={' '}
              <span className="text-white font-semibold">&quot;{String(clickFilter.value)}&quot;</span>
            </span>
            <button onClick={clearFilter} className="flex items-center gap-1 ml-2 px-2 py-1 rounded-md bg-background border border-border text-gray-300 hover:text-white hover:border-primary transition-colors">
              <X size={12} /> Clear filter
            </button>
          </div>
        )}
        {showFilterNote && !clickFilter && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
            <Filter size={13} /> Click any value in the table to filter for all matching records.
          </div>
        )}
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
              ) : pageRows.length === 0 ? (
                <tr><td colSpan="7" className="py-8 text-center text-gray-500">No equipment found. Upload data via Data Upload page.</td></tr>
              ) : pageRows.map((eq) => (
                <tr key={eq.id} className="border-b border-border/50 hover:bg-white/[0.03]">
                  <Cell filterKey="reg" value={eq.registration_no || eq.asset_code || '-'} className="py-3 px-4 text-white font-mono text-xs" />
                  <Cell filterKey="type" value={eq.equipment_type || '-'} className="py-3 px-4 text-gray-300" />
                  <Cell filterKey="make" value={(eq.make ? eq.make : '') + (eq.model ? ' ' + eq.model : '') || '-'} className="py-3 px-4 text-gray-300" />
                  <Cell filterKey="capacity" value={eq.capacity || '-'} className="py-3 px-4 text-gray-400 text-xs" />
                  <Cell filterKey="location" value={eq.location || '-'} className="py-3 px-4 text-gray-400 text-xs" />
                  <td className="py-3 px-4 text-gray-300">{fmt(eq.monthly_rental)}</td>
                  <td className="py-3 px-4">
                    <span className={badgeCls + (
                      eq.status === 'Available' ? 'bg-healthy/20 text-healthy' :
                      eq.status === 'In Operation' || eq.status === 'Rented' ? 'bg-primary/20 text-primary' :
                      eq.status === 'Maintenance' ? 'bg-alert/20 text-alert' :
                      'bg-gray-700 text-gray-400'
                    )}
                      style={clickFilter && clickFilter.key === 'status' && String(clickFilter.value).toLowerCase() === String(eq.status).toLowerCase() ? { outline: '1px solid #3B82F6' } : undefined}
                    >{eq.status || 'Unknown'}</span>
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

export default EquipmentInventory;
