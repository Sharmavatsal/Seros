import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Wrench, HardHat, Home, Settings, LogOut,
  DollarSign, FileBarChart2, Bell, Users, Shield, ChevronRight,
  AlertTriangle, Hammer
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useEffect, useState } from 'react';
import api from '../../lib/axios';

// ─── Nav item helper ─────────────────────────────────────────────────────────
const NavItem = ({ to, icon: Icon, label, badge }) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <Link
      to={to}
      className={`nav-link group ${isActive ? 'active' : ''}`}
    >
      <Icon size={18} className="shrink-0" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="ml-auto bg-alert text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  );
};

const NavSection = ({ title, children }) => (
  <div className="mb-4">
    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 px-3 mb-1">{title}</p>
    <div className="space-y-0.5">{children}</div>
  </div>
);

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const Sidebar = ({ alertCount }) => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const role = user?.role;

  const isAdmin = role === 'admin';
  const isRental = role === 'rental_manager';
  const isPiling = role === 'piling_manager';
  const isOM = role === 'om_manager';

  return (
    <div className="w-64 bg-surface border-r border-border h-full flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wider leading-none">
              SEROS<span className="text-gray-500 font-light">OPS</span>
            </h1>
            <p className="text-[10px] text-gray-600 mt-0.5">Operations Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">

        {/* Admin Section */}
        {isAdmin && (
          <NavSection title="Command Center">
            <NavItem to="/admin" icon={LayoutDashboard} label="Overview" />
            <NavItem to="/finance" icon={DollarSign} label="Finance" />
            <NavItem to="/reports" icon={FileBarChart2} label="Reports" />
            <NavItem to="/alerts" icon={Bell} label="Alerts" badge={alertCount} />
            <NavItem to="/maintenance" icon={Wrench} label="Maintenance" />
            <NavItem to="/users" icon={Users} label="User Management" />
          </NavSection>
        )}

        {/* Rental Section */}
        {(isAdmin || isRental) && (
          <NavSection title="Equipment Rental">
            <NavItem to="/rental" icon={Home} label="Rental Dashboard" />
            {isRental && (
              <>
                <NavItem to="/finance" icon={DollarSign} label="Finance" />
                <NavItem to="/reports" icon={FileBarChart2} label="Reports" />
                <NavItem to="/alerts" icon={Bell} label="Alerts" badge={alertCount} />
              </>
            )}
          </NavSection>
        )}

        {/* Piling Section */}
        {(isAdmin || isPiling) && (
          <NavSection title="Piling Operations">
            <NavItem to="/piling" icon={HardHat} label="Piling Dashboard" />
            {isPiling && (
              <>
                <NavItem to="/finance" icon={DollarSign} label="Finance" />
                <NavItem to="/reports" icon={FileBarChart2} label="Reports" />
                <NavItem to="/alerts" icon={Bell} label="Alerts" badge={alertCount} />
              </>
            )}
          </NavSection>
        )}

        {/* O&M Section */}
        {(isAdmin || isOM) && (
          <NavSection title="O&amp;M Services">
            <NavItem to="/om" icon={Hammer} label="O&amp;M Dashboard" />
            {isOM && (
              <>
                <NavItem to="/finance" icon={DollarSign} label="Finance" />
                <NavItem to="/reports" icon={FileBarChart2} label="Reports" />
                <NavItem to="/alerts" icon={Bell} label="Alerts" badge={alertCount} />
                <NavItem to="/maintenance" icon={Wrench} label="Maintenance" />
              </>
            )}
          </NavSection>
        )}
      </nav>

      {/* User Info + Logout */}
      <div className="px-3 py-3 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm uppercase shrink-0">
            {user?.username ? user.username.charAt(0) : '?'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.username || 'User'}</p>
            <p className="text-xs text-gray-500 capitalize truncate">{user?.role?.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="flex items-center gap-3 w-full px-2 py-2 rounded-md text-gray-500 hover:text-alert hover:bg-alert/10 transition-all text-sm"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

// ─── Top Nav ──────────────────────────────────────────────────────────────────
const TopNav = ({ alertCount }) => {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  const pageTitle = () => {
    const path = location.pathname;
    if (path === '/admin') return 'Company Overview';
    if (path === '/rental') return 'Rental Operations';
    if (path === '/piling') return 'Piling Operations';
    if (path === '/om') return 'O&M Operations';
    if (path === '/finance') return 'Finance & Revenue';
    if (path === '/reports') return 'Reports';
    if (path === '/alerts') return 'Alerts & Notifications';
    if (path === '/maintenance') return 'Maintenance';
    if (path === '/users') return 'User Management';
    return 'Dashboard';
  };

  return (
    <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <ChevronRight size={14} />
        <span className="text-white font-medium">{pageTitle()}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Alerts bell */}
        <Link to="/alerts" className="relative p-2 rounded-md text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
          <Bell size={18} />
          {alertCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-alert rounded-full" />
          )}
        </Link>

        {/* User badge */}
        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-200 leading-none">{user?.username || 'User'}</p>
            <p className="text-xs text-gray-500 capitalize mt-0.5">{user?.role?.replace(/_/g, ' ')}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold uppercase text-sm">
            {user?.username ? user.username.charAt(0) : '?'}
          </div>
        </div>
      </div>
    </header>
  );
};

// ─── Main Layout ──────────────────────────────────────────────────────────────
const MainLayout = () => {
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const fetchAlertCount = async () => {
      try {
        const res = await api.get('/alerts/');
        const data = res.data;
        const total =
          (data.equipment_alerts?.length || 0) +
          (data.rental_alerts?.length || 0) +
          (data.operations_alerts?.length || 0) +
          (data.om_alerts?.length || 0) +
          (data.finance_alerts?.length || 0);
        setAlertCount(total);
      } catch {
        // Non-critical — fail silently
      }
    };
    fetchAlertCount();
  }, []);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Sidebar alertCount={alertCount} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNav alertCount={alertCount} />
        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
