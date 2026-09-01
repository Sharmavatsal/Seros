import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, CheckCircle, XCircle, History, RefreshCw, X, Filter } from 'lucide-react';
import api from '../../lib/axios';
import { useToast } from '../../components/ui/ToastContext';

const UPLOAD_SECTIONS = [
  {
    key: 'vendors',
    title: 'Vendor Master',
    description: 'Upload vendor list with codes, services, and contact details',
    endpoint: '/data-upload/vendors',
    expectedColumns: 'Vendor Code | Vendor Name | Services | Description',
  },
  {
    key: 'equipment',
    title: 'Assets Register',
    description: 'Upload equipment inventory with registration, category, status',
    endpoint: '/data-upload/equipment',
    expectedColumns: 'Registration No | Category | Equipment Type | Make | Capacity | Status | Location | service_type',
  },
  {
    key: 'orders',
    title: 'Order Book & Client Master',
    description: 'Upload orders/POs with client details, billing amounts',
    endpoint: '/data-upload/orders',
    expectedColumns: 'PO/WO Number | Customer Name | Status | Location | Start Date | Monthly Billing Potential | Monthly Billing Actual',
  },
  {
    key: 'pre-rental',
    title: 'Equipment Pre-Rental',
    description: 'Upload pre-rental inspection records',
    endpoint: '/data-upload/pre-rental',
    expectedColumns: 'Inspection Date | Duration Days | Rental Rate | Status | Equipment Condition | Functionality | Safety',
  },
];

const UploadCard = ({ section, onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);
  const toast = useToast();

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post(section.endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      toast.success(`${section.title}: ${res.data.rows_inserted || 0} rows inserted`);
      onUploadComplete?.();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Upload failed';
      setResult({ status: 'failed', errors: [msg] });
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <FileText size={20} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-white">{section.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{section.description}</p>
          <p className="text-[10px] text-gray-600 mt-1 font-mono">{section.expectedColumns}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-md text-sm text-gray-300 hover:border-primary transition-colors"
        >
          <Upload size={14} />
          {file ? file.name : 'Choose .xlsx file'}
        </button>
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Upload & Parse'}
        </button>
      </div>

      {result && (
        <div className={`mt-4 p-3 rounded-md text-sm ${
          result.status === 'success' ? 'bg-healthy/10 border border-healthy/30 text-healthy' :
          result.status === 'partial' ? 'bg-warning/10 border border-warning/30 text-warning' :
          'bg-alert/10 border border-alert/30 text-alert'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            {result.status === 'failed' ? <XCircle size={14} /> : <CheckCircle size={14} />}
            <span className="font-medium capitalize">{result.status}</span>
          </div>
          {result.rows_inserted !== undefined && (
            <p className="text-xs text-gray-400">Inserted: {result.rows_inserted} | Updated: {result.rows_updated || 0} | Total: {result.total_rows}</p>
          )}
          {result.orders_inserted !== undefined && (
            <p className="text-xs text-gray-400">Orders: {result.orders_inserted} | Clients: {result.clients_inserted} | Total: {result.total_rows}</p>
          )}
          {result.errors?.length > 0 && (
            <div className="mt-2 text-xs text-gray-500 max-h-24 overflow-y-auto">
              {result.errors.slice(0, 10).map((e, i) => <p key={i}>{e}</p>)}
              {result.errors.length > 10 && <p>...and {result.errors.length - 10} more</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const DataUploadPage = () => {
  const [history, setHistory] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [clickFilter, setClickFilter] = useState(null);
  const toast = useToast();

  const filteredHistory = clickFilter
    ? history.filter(h => String(h[clickFilter.key] ?? '').toLowerCase() === String(clickFilter.value).toLowerCase())
    : history;

  const clearFilter = () => setClickFilter(null);

  const fetchHistory = async () => {
    try {
      const params = historyFilter ? `?file_type=${historyFilter}` : '';
      const res = await api.get(`/data-upload/history${params}`);
      setHistory(res.data);
    } catch {
      toast.error('Failed to load upload history');
    }
  };

  useEffect(() => {
    if (showHistory) fetchHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHistory, historyFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Data Upload</h1>
          <p className="text-sm text-gray-500 mt-1">Upload Excel files to populate the system with real data</p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-md text-sm text-gray-300 hover:border-primary transition-colors"
        >
          <History size={14} />
          {showHistory ? 'Hide History' : 'Upload History'}
        </button>
      </div>

      {showHistory && (
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Upload History</h3>
            <div className="flex items-center gap-2">
              <select
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                className="bg-background border border-border rounded-md px-2 py-1 text-xs text-gray-300"
              >
                <option value="">All Types</option>
                <option value="vendor">Vendors</option>
                <option value="equipment">Equipment</option>
                <option value="order">Orders</option>
                <option value="inspection">Inspections</option>
              </select>
              <button onClick={fetchHistory} className="p-1.5 rounded-md hover:bg-white/5 text-gray-400">
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-gray-500">No uploads yet</p>
          ) : (
            <>
              {clickFilter && (
                <div className="mb-3 flex items-center gap-2 text-xs bg-background border border-border rounded-lg px-3 py-2 w-fit">
                  <Filter size={13} className="text-primary" />
                  <span className="text-gray-300">
                    Showing all where <span className="text-primary font-medium capitalize">{clickFilter.key.replace(/_/g, ' ')}</span> ={' '}
                    <span className="text-white font-semibold">&quot;{String(clickFilter.value)}&quot;</span>
                  </span>
                  <button onClick={clearFilter} className="flex items-center gap-1 ml-1 px-2 py-1 rounded-md bg-background border border-border text-gray-300 hover:text-white hover:border-primary transition-colors">
                    <X size={12} /> Clear filter
                  </button>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Type</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">File</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Rows</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Status</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.length === 0 ? (
                      <tr><td colSpan={5} className="py-6 text-center text-sm text-gray-500">No matching uploads</td></tr>
                    ) : filteredHistory.map((h) => (
                      <tr key={h.id} className="border-b border-border/50">
                        <td className="py-2 px-3 text-gray-300 capitalize cursor-pointer hover:text-primary transition-colors"
                          onClick={() => setClickFilter({ key: 'file_type', value: h.file_type })}
                          title="Click to show all matching type"
                          style={clickFilter?.key === 'file_type' && String(clickFilter.value).toLowerCase() === String(h.file_type).toLowerCase() ? { color: '#3B82F6' } : undefined}>{h.file_type}</td>
                        <td className="py-2 px-3 text-gray-400 text-xs cursor-pointer hover:text-primary transition-colors"
                          onClick={() => setClickFilter({ key: 'file_name', value: h.file_name })}
                          title="Click to show all matching file"
                          style={clickFilter?.key === 'file_name' && String(clickFilter.value).toLowerCase() === String(h.file_name).toLowerCase() ? { color: '#3B82F6' } : undefined}>{h.file_name}</td>
                        <td className="py-2 px-3 text-gray-300">{h.row_count} ins / {h.rows_updated} upd</td>
                        <td className="py-2 px-3">
                          <span
                            onClick={() => setClickFilter({ key: 'status', value: h.status })}
                            className={`px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-opacity hover:opacity-80 ${
                              h.status === 'Success' ? 'bg-healthy/20 text-healthy' :
                              h.status === 'Partial' ? 'bg-warning/20 text-warning' :
                              'bg-alert/20 text-alert'
                            }`}
                            style={clickFilter?.key === 'status' && String(clickFilter.value).toLowerCase() === String(h.status).toLowerCase() ? { outline: '1px solid #3B82F6' } : undefined}
                            title="Click to show all matching status">{h.status}</span>
                        </td>
                        <td className="py-2 px-3 text-gray-500 text-xs cursor-pointer hover:text-primary transition-colors"
                          onClick={() => setClickFilter({ key: 'uploaded_at', value: h.uploaded_at })}
                          title="Click to show all matching date"
                          style={clickFilter?.key === 'uploaded_at' && String(clickFilter.value).toLowerCase() === String(h.uploaded_at).toLowerCase() ? { color: '#3B82F6' } : undefined}>
                          {h.uploaded_at ? new Date(h.uploaded_at).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {UPLOAD_SECTIONS.map((section) => (
          <UploadCard key={section.key} section={section} onUploadComplete={showHistory ? fetchHistory : null} />
        ))}
      </div>
    </div>
  );
};

export default DataUploadPage;
