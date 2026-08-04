import { useState, useEffect } from 'react';
import { Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
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
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/inspections/', {
        ...form,
        rental_rate: form.rental_rate ? parseFloat(form.rental_rate) : null,
        duration_days: parseInt(form.duration_days) || null,
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

  const inputCls = "w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-primary";
  const labelCls = "block text-xs font-medium text-gray-400 mb-1";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface border border-border rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-white">New Pre-Rental Inspection</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Inspection Date</label>
              <input type="date" value={form.inspection_date} onChange={(e) => setForm({ ...form, inspection_date: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Duration (Days)</label>
              <input type="number" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Rental Rate / Month</label>
              <input type="number" value={form.rental_rate} onChange={(e) => setForm({ ...form, rental_rate: e.target.value })} placeholder="e.g. 38000" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={form.inspection_status} onChange={(e) => setForm({ ...form, inspection_status: e.target.value })} className={inputCls}>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">Inspection Checklist</p>
            <div className="grid grid-cols-3 gap-4">
              {['checklist_equipment_condition', 'checklist_functionality', 'checklist_safety'].map((field) => (
                <div key={field}>
                  <label className={labelCls}>{field.replace('checklist_', '').replace(/_/g, ' ')}</label>
                  <select value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} className={inputCls}>
                    <option value="OK">OK</option>
                    <option value="Damage">Damage</option>
                    <option value="Issue">Issue</option>
                    <option value="Minor Issue">Minor Issue</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>Inspection Notes</label>
            <textarea value={form.inspection_notes} onChange={(e) => setForm({ ...form, inspection_notes: e.target.value })}
              rows={3} className={inputCls} placeholder="Describe any observations..." />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-background border border-border rounded-md text-sm text-gray-300 hover:border-primary">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-blue-600 disabled:opacity-50">
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
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);

  const fetchInspections = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await api.get('/inspections/' + params);
      setInspections(res.data.inspections);
      setTotal(res.data.total_count);
    } catch { /* fallback */ }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchInspections(); }, [statusFilter]);

  const StatusIcon = ({ status }) => {
    if (status === 'Approved') return <CheckCircle size={14} className="text-healthy" />;
    if (status === 'Rejected') return <XCircle size={14} className="text-alert" />;
    return <Clock size={14} className="text-warning" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Pre-Rental Inspections</h1>
          <p className="text-sm text-gray-500 mt-1">Manage equipment inspections before rental dispatch</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-blue-600">
          <Plus size={16} /> New Inspection
        </button>
      </div>

      <div className="bg-surface border border-border rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-background border border-border rounded-md px-3 py-2 text-sm text-gray-300">
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          <span className="text-xs text-gray-500">{total} inspections</span>
        </div>
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
              ) : inspections.length === 0 ? (
                <tr><td colSpan="8" className="py-8 text-center text-gray-500">No inspections found. Click &quot;New Inspection&quot; to create one.</td></tr>
              ) : inspections.map((i) => (
                <tr key={i.id} className="border-b border-border/50 hover:bg-white/[0.02]">
                  <td className="py-3 px-4 text-gray-300 text-xs">{i.inspection_date || '-'}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs font-mono">{i.equipment_id ? i.equipment_id.substring(0, 8) + '...' : '-'}</td>
                  <td className="py-3 px-4 text-gray-300">{i.duration_days || '-'} days</td>
                  <td className="py-3 px-4 text-gray-300">{i.rental_rate ? '\u20B9' + Number(i.rental_rate).toLocaleString('en-IN') : '-'}</td>
                  <td className="py-3 px-4">
                    <span className={'text-xs ' + (i.checklist_equipment_condition === 'OK' ? 'text-healthy' : 'text-warning')}>
                      {i.checklist_equipment_condition || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={'text-xs ' + (i.checklist_functionality === 'OK' ? 'text-healthy' : 'text-warning')}>
                      {i.checklist_functionality || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={'text-xs ' + (i.checklist_safety === 'OK' ? 'text-healthy' : 'text-warning')}>
                      {i.checklist_safety || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
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
