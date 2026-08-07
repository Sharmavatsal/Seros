import { useState, useEffect } from 'react';
import { User, KeyRound, Save, Mail } from 'lucide-react';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/ToastContext';

const ROLE_LABELS = {
  admin: 'Admin',
  rental_manager: 'Rental Manager',
  piling_manager: 'Piling Manager',
  om_manager: 'O&M Manager',
};

const inputCls = (error) =>
  `w-full bg-background border ${error ? 'border-alert' : 'border-border'} rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors`;

const Settings = () => {
  const toast = useToast();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ full_name: '', email: '' });
  const [profileErrors, setProfileErrors] = useState({});

  const [pw, setPw] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/me');
      setProfile(res.data);
      setProfileForm({ full_name: res.data.username || '', email: res.data.email || '' });
    } catch {
      const user = useAuthStore.getState().user;
      if (user) {
        setProfile(user);
        setProfileForm({ full_name: user.username || '', email: user.email || '' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!profileForm.full_name.trim()) errs.full_name = 'Name is required';
    if (!profileForm.email.includes('@')) errs.email = 'Valid email required';
    setProfileErrors(errs);
    if (Object.keys(errs).length) return;

    setSavingProfile(true);
    try {
      const res = await api.put('/users/me', {
        full_name: profileForm.full_name.trim(),
        email: profileForm.email.trim(),
      });
      const updated = res.data;
      setProfile(updated);
      setAuth(useAuthStore.getState().token, {
        ...useAuthStore.getState().user,
        username: updated.username,
        email: updated.email,
      });
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (pw.current_password.length < 8) errs.current_password = 'Current password required';
    if (pw.new_password.length < 8) errs.new_password = 'Min 8 characters';
    if (pw.confirm !== pw.new_password) errs.confirm = 'Passwords do not match';
    setPwErrors(errs);
    if (Object.keys(errs).length) return;

    setSavingPassword(true);
    try {
      await api.post('/users/me/password', {
        current_password: pw.current_password,
        new_password: pw.new_password,
      });
      toast.success('Password changed successfully');
      setPw({ current_password: '', new_password: '', confirm: '' });
      setPwErrors({});
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-48 bg-surface border border-border rounded-lg animate-pulse" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64 bg-surface border border-border rounded-lg animate-pulse" />
          <div className="h-64 bg-surface border border-border rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">Settings</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-0.5">Manage your profile and password</p>
      </div>

      {/* Profile card */}
      <div className="bg-surface border border-border rounded-lg p-5 md:p-6">
        <div className="flex items-center gap-4 pb-5 border-b border-border">
          <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-xl uppercase shrink-0">
            {profile?.username?.charAt(0) || '?'}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{profile?.username}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium border border-primary/30 bg-primary/10 text-primary capitalize">
                {ROLE_LABELS[profile?.role] || profile?.role?.replace(/_/g, ' ')}
              </span>
              <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${profile?.status === 'Active' ? 'bg-healthy/20 text-healthy' : 'bg-gray-700/50 text-gray-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${profile?.status === 'Active' ? 'bg-healthy' : 'bg-gray-600'}`} />
                {profile?.status || 'Active'}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="grid gap-4 md:grid-cols-2 pt-5">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-1.5">
              <User size={13} /> Full Name
            </label>
            <input
              className={inputCls(profileErrors.full_name)}
              value={profileForm.full_name}
              onChange={(e) => setProfileForm((f) => ({ ...f, full_name: e.target.value }))}
              placeholder="e.g. John Smith"
            />
            {profileErrors.full_name && <p className="text-xs text-alert mt-1">{profileErrors.full_name}</p>}
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-1.5">
              <Mail size={13} /> Email Address
            </label>
            <input
              className={inputCls(profileErrors.email)}
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="user@serosops.com"
            />
            {profileErrors.email && <p className="text-xs text-alert mt-1">{profileErrors.email}</p>}
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <Save size={15} />
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Password card */}
      <div className="bg-surface border border-border rounded-lg p-5 md:p-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
            <KeyRound size={15} className="text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Change Password</h2>
            <p className="text-xs text-gray-500">Use at least 8 characters</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="grid gap-4 md:grid-cols-3 pt-5">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Current Password</label>
            <input
              className={inputCls(pwErrors.current_password)}
              type="password"
              value={pw.current_password}
              onChange={(e) => setPw((p) => ({ ...p, current_password: e.target.value }))}
              placeholder="••••••••"
            />
            {pwErrors.current_password && <p className="text-xs text-alert mt-1">{pwErrors.current_password}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">New Password</label>
            <input
              className={inputCls(pwErrors.new_password)}
              type="password"
              value={pw.new_password}
              onChange={(e) => setPw((p) => ({ ...p, new_password: e.target.value }))}
              placeholder="Min. 8 characters"
            />
            {pwErrors.new_password && <p className="text-xs text-alert mt-1">{pwErrors.new_password}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Confirm New Password</label>
            <input
              className={inputCls(pwErrors.confirm)}
              type="password"
              value={pw.confirm}
              onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
              placeholder="Re-enter new password"
            />
            {pwErrors.confirm && <p className="text-xs text-alert mt-1">{pwErrors.confirm}</p>}
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={savingPassword}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <KeyRound size={15} />
              {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
