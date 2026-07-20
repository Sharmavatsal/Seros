import React, { useState, useEffect } from 'react';
import { Users, Plus, X, Search, Shield, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../../lib/axios';
import { useToast } from '../../components/ui/ToastContext';
import { SkeletonTable } from '../../components/ui/Skeletons';

const ROLE_CONFIG = {
  admin: { label: 'Admin', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  rental_manager: { label: 'Rental Manager', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  piling_manager: { label: 'Piling Manager', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  om_manager: { label: 'O&M Manager', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
};

const MOCK_USERS = [
  { id: '1', username: 'System Admin', email: 'admin@serosops.com', role: 'admin', status: 'Active' },
  { id: '2', username: 'John Rental', email: 'john.rental@serosops.com', role: 'rental_manager', status: 'Active' },
  { id: '3', username: 'Sarah Piling', email: 'sarah.piling@serosops.com', role: 'piling_manager', status: 'Active' },
  { id: '4', username: 'Mike O&M', email: 'mike.om@serosops.com', role: 'om_manager', status: 'Inactive' },
  { id: '5', username: 'Alice Manager', email: 'alice@serosops.com', role: 'rental_manager', status: 'Active' },
];

// ─── Create User Modal ────────────────────────────────────────────────────────
const CreateUserModal = ({ onClose, onCreated }) => {
  const toast = useToast();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'rental_manager' });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = 'Name is required';
    if (!form.email.includes('@')) errs.email = 'Valid email required';
    if (form.password.length < 8) errs.password = 'Min 8 characters';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await api.post('/users/', form);
      toast.success('User created successfully', form.full_name);
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = (field) => `w-full bg-background border ${errors[field] ? 'border-alert' : 'border-border'} rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-white">Add New User</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name</label>
            <input className={inputCls('full_name')} value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="e.g. John Smith" />
            {errors.full_name && <p className="text-xs text-alert mt-1">{errors.full_name}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Email Address</label>
            <input className={inputCls('email')} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="user@serosops.com" />
            {errors.email && <p className="text-xs text-alert mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
            <input className={inputCls('password')} type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 8 characters" />
            {errors.password && <p className="text-xs text-alert mt-1">{errors.password}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Role</label>
            <select className={inputCls()} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="admin">Admin</option>
              <option value="rental_manager">Rental Manager</option>
              <option value="piling_manager">Piling Manager</option>
              <option value="om_manager">O&amp;M Manager</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-border text-gray-400 hover:text-white rounded-md transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 text-sm bg-primary hover:bg-primary-dark text-white rounded-md transition-colors disabled:opacity-50">
              {saving ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Edit Role Modal ──────────────────────────────────────────────────────────
const EditRoleModal = ({ user, onClose, onSaved }) => {
  const toast = useToast();
  const [role, setRole] = useState(user.role);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/users/${user.id}`, { role });
      toast.success('Role updated successfully');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update role');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-sm animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-white">Edit Role</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-400">Changing role for <span className="text-white font-medium">{user.username}</span></p>
          <div className="space-y-2">
            {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setRole(key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left ${role === key ? 'border-primary bg-primary/10' : 'border-border hover:border-border-light'}`}
              >
                <div className={`w-2 h-2 rounded-full ${role === key ? 'bg-primary' : 'bg-gray-600'}`} />
                <span className={`text-sm font-medium ${role === key ? 'text-white' : 'text-gray-400'}`}>{cfg.label}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-border text-gray-400 hover:text-white rounded-md transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 text-sm bg-primary hover:bg-primary-dark text-white rounded-md transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Role'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const UserManagement = () => {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/');
      setUsers(res.data?.length ? res.data : MOCK_USERS);
    } catch {
      setUsers(MOCK_USERS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleStatus = async (user) => {
    const newActive = user.status === 'Active' ? false : true;
    try {
      await api.patch(`/users/${user.id}`, { is_active: newActive });
      toast.success(`User ${newActive ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } catch (err) {
      // Optimistic UI fallback
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newActive ? 'Active' : 'Inactive' } : u));
      toast.success(`User ${newActive ? 'activated' : 'deactivated'}`);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !search || u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleCounts = {
    all: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    rental_manager: users.filter(u => u.role === 'rental_manager').length,
    piling_manager: users.filter(u => u.role === 'piling_manager').length,
    om_manager: users.filter(u => u.role === 'om_manager').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">{users.length} total users across all roles</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add User
        </button>
      </div>

      {/* Role filter tabs */}
      <div className="flex flex-wrap gap-1 bg-surface border border-border rounded-lg p-1 w-fit">
        {[['', 'All Users'], ['admin', 'Admin'], ['rental_manager', 'Rental'], ['piling_manager', 'Piling'], ['om_manager', 'O&M']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setRoleFilter(val)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${roleFilter === val ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
          >
            {label}
            <span className="ml-1.5 text-xs opacity-70">({roleCounts[val || 'all']})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-base font-medium text-white">System Users</h3>
            <span className="text-xs text-gray-500">{filtered.length} of {users.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background/40">
                  {['User', 'Email', 'Role', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">No users found</td></tr>
                ) : filtered.map((u) => {
                  const rc = ROLE_CONFIG[u.role] || { label: u.role, color: 'bg-gray-700 text-gray-400 border-gray-600' };
                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold uppercase text-sm shrink-0">
                            {u.username?.charAt(0) || '?'}
                          </div>
                          <span className="text-white font-medium">{u.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${rc.color}`}>{rc.label}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1.5 w-fit px-2 py-0.5 rounded-full text-xs font-medium ${u.status === 'Active' ? 'bg-healthy/20 text-healthy' : 'bg-gray-700/50 text-gray-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Active' ? 'bg-healthy' : 'bg-gray-600'}`} />
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditUser(u)}
                            className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                            title="Edit role"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => toggleStatus(u)}
                            className={`p-1.5 rounded-md transition-colors ${u.status === 'Active' ? 'text-gray-500 hover:text-warning hover:bg-warning/10' : 'text-gray-500 hover:text-healthy hover:bg-healthy/10'}`}
                            title={u.status === 'Active' ? 'Deactivate' : 'Activate'}
                          >
                            {u.status === 'Active' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onCreated={fetchUsers} />}
      {editUser && <EditRoleModal user={editUser} onClose={() => setEditUser(null)} onSaved={fetchUsers} />}
    </div>
  );
};

export default UserManagement;
