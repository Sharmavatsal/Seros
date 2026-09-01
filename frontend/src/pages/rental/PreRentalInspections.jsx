import { useState, useEffect, useMemo } from 'react';
import { Plus, CheckCircle, XCircle, Clock, X, Filter } from 'lucide-react';
import api from '../../lib/axios';
import { useToast } from '../../components/ui/ToastContext';

const InspectionForm = ({ onClose, onCreated }) => {
  const toast = useToast();
  const [form, setForm] = useState({
    inspection_date: new Date().toISOString().split('T')[0],
    duration_days: 30,
    rental_rate: '',
    inspection_status: 'Pending',
    checklist_equipment_condition: 'OK',
    checklist_functionality: 'OK',
    checklist_safety: 'OK',
    inspection_notes: '',
  });
  const [errors, setErrors] = useState({});
  const [equipment, setEquipment] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/equipment/?page=1&limit=100')
      .then((res) => setEquipment(res.data?.equipment || []))
      .catch(() => setEquipment([]));
  }, []);

  const validate = () => {
    const e = {};
    if (!form.inspection_date) e.inspection_date = 'Inspection date is required';
    const days = parseInt(form.duration_days, 10);
    if (form.duration_days === '' || isNaN(days) || days < 1) {
      e.duration_days = 'Duration must be a positive number of days';
    }
    if (form.rental_rate !== '' && (isNaN(parseFloat(form.rental_rate)) || parseFloat(form.rental_rate) < 0)) {
      e.rental_rate = 'Rental rate cannot be negative';
    }
    setErrors(e);
    return Object.keys(e).filter((k) => e[k]).length === 0;
  };

  const handleChange = (field) => (ev) => {
    setForm({ ...form, [field]: ev.target.value });
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.post('/inspections/', {
        ...form,
        equipment_id: form.equipment_id || null,
        rental_rate: form.rental_rate !== '' ? parseFloat(form.rental_rate) : null,
        duration_days: form.duration_days !== '' ? parseInt(form.duration_days, 10) : null,
      });
      toast.success('Inspection created successfully');
      onCreated?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create inspection');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors";
  const inputErr = "border-alert/60";
  const labelCls = "block text-xs font-medium text-gray-400 mb-1.5";
  const errText = "block mt-1 text-xs text-alert";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-surface z-10">
          <h2 className="text-lg font-semibold text-white">New Pre-Rental Inspection</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5" noValidate>
          {/* Equipment & Schedule */}
          <div>
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">Equipment & Schedule</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Equipment</label>
                <select
                  value={form.equipment_id || ''}
                  onChange={handleChange('equipment_id')}
                  className={`${inputCls} ${errors.equipment_id ? inputErr : ''}`}
                >
                  <option value="">Select equipment (optional)</option>
                  {equipment.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.registration_no || eq.asset_code || eq.equipment_type || eq.id}
                    </option>
                  ))}
                </select>
                {errors.equipment_id && <span className={errText}>{errors.equipment_id}</span>}
              </div>
              <div>
                <label className={labelCls}>Inspection Date <span className="text-alert">*</span></label>
                <input type="date" value={form.inspection_date} onChange={handleChange('inspection_date')} className={`${inputCls} ${errors.inspection_date ? inputErr : ''}`} />
                {errors.inspection_date && <span className={errText}>{errors.inspection_date}</span>}
              </div>
              <div>
                <label className={labelCls}>Duration (Days) <span className="text-alert">*</span></label>
                <input type="number" min="1" value={form.duration_days} onChange={handleChange('duration_days')} className={`${inputCls} ${errors.duration_days ? inputErr : ''}`} />
                {errors.duration_days && <span className={errText}>{errors.duration_days}</span>}
              </div>
            </div>
          </div>

          {/* Financials & Status */}
          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">Financials & Status</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Rental Rate / Month</label>
                <input type="number" min="0" step="0.01" value={form.rental_rate} onChange={handleChange('rental_rate')} placeholder="e.g. 38000" className={`${inputCls} ${errors.rental_rate ? inputErr : ''}`} />
                {errors.rental_rate && <span className={errText}>{errors.rental_rate}</span>}
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select value={form.inspection_status} onChange={handleChange('inspection_status')} className={inputCls}>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">Inspection Checklist</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {['checklist_equipment_condition', 'checklist_functionality', 'checklist_safety'].map((field) => (
                <div key={field}>
                  <label className={labelCls}>{field.replace('checklist_', '').toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())}</label>
                  <select value={form[field]} onChange={handleChange(field)} className={inputCls}>
                    <option value="OK">OK</option>
                    <option value="Damage">Damage</option>
                    <option value="Issue">Issue</option>
                    <option value="Minor Issue">Minor Issue</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <label className={labelCls}>Inspection Notes</label>
            <textarea value={form.inspection_notes} onChange={handleChange('inspection_notes')}
              rows={3} className={inputCls} placeholder="Describe any observations..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-border text-gray-400 hover:text-white rounded-md transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 text-sm bg-primary hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-50">
              {submitting ? 'Creating...' : 'Submit Inspection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PreRentalInspections = () => {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [clickFilter, setClickFilter] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchInspections = async () => {
    setLoading(true);
    try {
      const res = await api.get('/inspections/');
      setInspections(res.data.inspections);
    } catch { /* fallback */ }
    setLoading(false);
  };

  useEffect(() => { fetchInspections(); }, []);

  const filtered = useMemo(() => {
    let rows = inspections;
    if (statusFilter) rows = rows.filter(i => i.inspection_status === statusFilter);
    if (clickFilter && clickFilter.value !== undefined && clickFilter.value !== null) {
      const v = String(clickFilter.value);
      if (clickFilter.key === 'status') {
        rows = rows.filter(i => String(i.inspection_status).toLowerCase() === v.toLowerCase());
      } else if (clickFilter.key === 'checklist') {
        rows = rows.filter(i =>
          String(i.checklist_equipment_condition).toLowerCase() === v.toLowerCase() ||
          String(i.checklist_functionality).toLowerCase() === v.toLowerCase() ||
          String(i.checklist_safety).toLowerCase() === v.toLowerCase()
        );
      } else {
        const keyMap = { date: 'inspection_date', equipment: 'equipment_id', duration: 'duration_days', rate: 'rental_rate' };
        const field = keyMap[clickFilter.key];
        if (field) rows = rows.filter(i => String(i[field]).toLowerCase().includes(v.toLowerCase()));
      }
    }
    return rows;
  }, [inspections, statusFilter, clickFilter]);

  const handleFilter = (key, value) => {
    if (value === undefined || value === null || value === '') return;
    setClickFilter({ key, value });
    if (key === 'status') setStatusFilter(value);
    else setStatusFilter('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilter = () => {
    setClickFilter(null);
    setStatusFilter('');
  };

  const StatusIcon = ({ status }) => {
    if (status === 'Approved') return <CheckCircle size={14} className="text-healthy" />;
    if (status === 'Rejected') return <XCircle size={14} className="text-alert" />;
    return <Clock size={14} className="text-warning" />;
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Pre-Rental Inspections</h1>
          <p className="text-sm text-gray-500 mt-1">Click any value to filter and view all matching inspections</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-blue-600">
          <Plus size={16} /> New Inspection
        </button>
      </div>

      <div className="bg-surface border border-border rounded-lg p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setClickFilter(null); }}
            className="bg-background border border-border rounded-md px-3 py-2 text-sm text-gray-300">
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          <span className="text-xs text-gray-500">{filtered.length} inspections</span>
          {clickFilter && (
            <button onClick={clearFilter} className="flex items-center gap-1 ml-auto px-2 py-1 rounded-md bg-background border border-border text-xs text-gray-300 hover:text-white hover:border-primary transition-colors">
              <X size={12} /> Clear filter
            </button>
          )}
        </div>
        {clickFilter && (
          <p className="mt-2 flex items-center gap-2 text-xs text-gray-300">
            <Filter size={13} className="text-primary" />
            Showing all inspections where <span className="text-primary font-medium capitalize">{clickFilter.key}</span> ={' '}
            <span className="text-white font-semibold">&quot;{String(clickFilter.value)}&quot;</span>
          </p>
        )}
      </div>

      <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background/50">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Date</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Equipment</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Duration</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Rate / Month</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Condition</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Functionality</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Safety</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="py-8 text-center text-gray-500">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="8" className="py-8 text-center text-gray-500">No inspections found. Click &quot;New Inspection&quot; to create one.</td></tr>
              ) : filtered.map((i) => (
                <tr key={i.id} className="border-b border-border/50 hover:bg-white/[0.03]">
                  <Cell filterKey="date" value={i.inspection_date || '-'} className="py-3 px-4 text-gray-300 text-xs" />
                  <Cell filterKey="equipment" value={i.equipment_id ? i.equipment_id.substring(0, 8) + '...' : '-'} className="py-3 px-4 text-gray-400 text-xs font-mono" />
                  <Cell filterKey="duration" value={i.duration_days ? i.duration_days + ' days' : '-'} className="py-3 px-4 text-gray-300" />
                  <Cell filterKey="rate" value={i.rental_rate ? '\u20B9' + Number(i.rental_rate).toLocaleString('en-IN') : '-'} className="py-3 px-4 text-gray-300" />
                  <Cell filterKey="checklist" value={i.checklist_equipment_condition || '-'} className="py-3 px-4" />
                  <Cell filterKey="checklist" value={i.checklist_functionality || '-'} className="py-3 px-4" />
                  <Cell filterKey="checklist" value={i.checklist_safety || '-'} className="py-3 px-4" />
                  <td className="py-3 px-4">
                    <div
                      className="flex items-center gap-1.5 cursor-pointer transition-opacity hover:opacity-80"
                      style={clickFilter && clickFilter.key === 'status' && String(clickFilter.value).toLowerCase() === String(i.inspection_status).toLowerCase() ? { color: '#3B82F6' } : undefined}
                      onClick={() => handleFilter('status', i.inspection_status)}
                      title="Click to show all matching status"
                    >
                      <StatusIcon status={i.inspection_status} />
                      <span className={'px-2 py-0.5 rounded-full text-xs font-medium ' + (
                        i.inspection_status === 'Approved' ? 'bg-healthy/20 text-healthy' :
                        i.inspection_status === 'Rejected' ? 'bg-alert/20 text-alert' :
                        'bg-warning/20 text-warning'
                      )}>{i.inspection_status}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && <InspectionForm onClose={() => setShowForm(false)} onCreated={fetchInspections} />}
    </div>
  );
};

export default PreRentalInspections;
