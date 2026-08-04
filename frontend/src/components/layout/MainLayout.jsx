import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Wrench, HardHat, Home, LogOut,
  IndianRupee, FileBarChart2, Bell, Users, Shield, ChevronRight,
  Hammer, Upload, Package, ClipboardCheck, FileText, Menu, X
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
            <NavItem to="/upload" icon={Upload} label="Data Upload" />
            <NavItem to="/equipment" icon={Package} label="Equipment" />
            <NavItem to="/orders" icon={FileText} label="Orders" />
            <NavItem to="/finance" icon={IndianRupee} label="Finance" />
            <NavItem to="/reports" icon={FileBarChart2} label="Reports" />
            <NavItem to="/alerts" icon={Bell} label="Alerts" badge={alertCount} />
            <NavItem to="/maintenance" icon={Wrench} label="Maintenance" />
            <NavItem to="/users" icon={Users} label="Users" />
          </NavSection>
        )}

        {/* Rental Section */}
        {(isAdmin || isRental) && (
          <NavSection title="Equipment Rental">
            <NavItem to="/rental" icon={Home} label="Rental Dashboard" />
            <NavItem to="/equipment" icon={Package} label="Equipment" />
            <NavItem to="/orders" icon={FileText} label="Active Rentals" />
            <NavItem to="/inspections" icon={ClipboardCheck} label="Inspections" />
            {isRental && (
              <>
                <NavItem to="/finance" icon={IndianRupee} label="Finance" />
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
            <NavItem to="/equipment" icon={Package} label="Equipment" />
            <NavItem to="/orders" icon={FileText} label="Active Orders" />
            {isPiling && (
              <>
                <NavItem to="/finance" icon={IndianRupee} label="Finance" />
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
            <NavItem to="/equipment" icon={Package} label="Equipment" />
            {isOM && (
              <>
                <NavItem to="/finance" icon={IndianRupee} label="Finance" />
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
const TopNav = ({ alertCount, onMenuToggle, sidebarOpen }) => {
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
    if (path === '/upload') return 'Data Upload';
    if (path === '/equipment') return 'Equipment Inventory';
    if (path === '/orders') return 'Active Rentals / Orders';
    if (path === '/inspections') return 'Pre-Rental Inspections';
    return 'Dashboard';
  };

  return (
    <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-3 md:px-6 shrink-0 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors shrink-0"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <ChevronRight size={14} className="hidden sm:block shrink-0 text-gray-500" />
        <span className="text-sm sm:text-base text-white font-medium truncate">{pageTitle()}</span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Alerts bell */}
        <Link to="/alerts" className="relative p-1.5 sm:p-2 rounded-md text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
          <Bell size={18} />
          {alertCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-alert rounded-full" />
          )}
        </Link>

        {/* User badge */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-gray-200 leading-none">{user?.username || 'User'}</p>
            <p className="text-xs text-gray-500 capitalize mt-0.5">{user?.role?.replace(/_/g, ' ')}</p>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold uppercase text-xs sm:text-sm">
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // Close sidebar on route change (mobile)
  const location = useLocation();
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 sidebar-overlay z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-surface border-r border-border
        transform transition-transform duration-200 ease-in-out
        lg:relative lg:translate-x-0 lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar alertCount={alertCount} />
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopNav alertCount={alertCount} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
        <main className="flex-1 overflow-y-auto p-3 md:p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
