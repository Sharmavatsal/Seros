import { Link, Outlet } from 'react-router-dom';
import { Home, HardHat, Wrench, Settings, LogOut } from 'lucide-react';

const Sidebar = () => {
  return (
    <div className="w-64 bg-surface border-r border-border h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold text-primary tracking-wider">SEROS<span className="text-gray-400 font-light">OPS</span></h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <Link to="/admin" className="flex items-center space-x-3 p-3 rounded-md hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">
          <Settings size={20} />
          <span>Admin Dashboard</span>
        </Link>
        <Link to="/rental" className="flex items-center space-x-3 p-3 rounded-md hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">
          <Home size={20} />
          <span>Rental Ops</span>
        </Link>
        <Link to="/piling" className="flex items-center space-x-3 p-3 rounded-md hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">
          <HardHat size={20} />
          <span>Piling Ops</span>
        </Link>
        <Link to="/om" className="flex items-center space-x-3 p-3 rounded-md hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">
          <Wrench size={20} />
          <span>O&M Ops</span>
        </Link>
      </nav>
      
      <div className="p-4 border-t border-border">
        <button className="flex items-center space-x-3 p-3 w-full rounded-md hover:bg-red-900/20 text-alert transition-colors">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

const TopNav = () => {
  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-end px-6">
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-200">Test User</p>
          <p className="text-xs text-gray-400">Administrator</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center font-bold text-white">
          T
        </div>
      </div>
    </header>
  );
};

const MainLayout = () => {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
