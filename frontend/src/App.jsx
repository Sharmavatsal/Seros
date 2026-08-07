import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ToastProvider } from './components/ui/ToastContext';
import Login from './pages/Login';

import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import DataUpload from './pages/admin/DataUpload';
import RentalDashboard from './pages/rental/RentalDashboard';
import EquipmentInventory from './pages/rental/EquipmentInventory';
import ActiveRentals from './pages/rental/ActiveRentals';
import PreRentalInspections from './pages/rental/PreRentalInspections';
import PilingDashboard from './pages/piling/PilingDashboard';
import OMDashboard from './pages/om/OMDashboard';
import FinancePage from './pages/finance/FinancePage';
import ReportsPage from './pages/reports/ReportsPage';
import AlertsPage from './pages/alerts/AlertsPage';
import MaintenancePage from './pages/maintenance/MaintenancePage';
import Settings from './pages/settings/Settings';

const Unauthorized = () => (
      <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="text-6xl font-bold text-alert mb-4">{'403'}</div>
      <h1 className="text-xl font-semibold text-white mb-2">Unauthorized Access</h1>
      <p className="text-gray-400 mb-6">You don&apos;t have permission to view this page.</p>
      <a href="/login" className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary-dark transition-colors">
        Go to Login
      </a>
    </div>
  </div>
);

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ToastProvider>
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            <Route path="/" element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route index element={<Navigate to="/rental" replace />} />

                {/* Admin-only */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                  <Route path="admin" element={<AdminDashboard />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="upload" element={<DataUpload />} />
                </Route>

                {/* Shared across verticals */}
                <Route element={<ProtectedRoute allowedRoles={['admin', 'rental_manager', 'piling_manager', 'om_manager']} />}>
                  <Route path="equipment" element={<EquipmentInventory />} />
                </Route>

              {/* Rental */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'rental_manager']} />}>
                <Route path="rental" element={<RentalDashboard />} />
                <Route path="inspections" element={<PreRentalInspections />} />
              </Route>

              {/* Orders (shared across verticals) */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'rental_manager', 'piling_manager', 'om_manager']} />}>
                <Route path="orders" element={<ActiveRentals />} />
              </Route>

                {/* Piling */}
                <Route element={<ProtectedRoute allowedRoles={['admin', 'piling_manager']} />}>
                  <Route path="piling" element={<PilingDashboard />} />
                </Route>

                {/* O&M */}
                <Route element={<ProtectedRoute allowedRoles={['admin', 'om_manager']} />}>
                  <Route path="om" element={<OMDashboard />} />
                </Route>

                {/* Maintenance */}
                <Route element={<ProtectedRoute allowedRoles={['admin', 'om_manager']} />}>
                  <Route path="maintenance" element={<MaintenancePage />} />
                </Route>

                {/* Finance */}
                <Route element={<ProtectedRoute allowedRoles={['admin', 'rental_manager', 'piling_manager', 'om_manager']} />}>
                  <Route path="finance" element={<FinancePage />} />
                </Route>

                {/* Reports */}
                <Route element={<ProtectedRoute allowedRoles={['admin', 'rental_manager', 'piling_manager', 'om_manager']} />}>
                  <Route path="reports" element={<ReportsPage />} />
                </Route>

                {/* Alerts */}
                <Route element={<ProtectedRoute allowedRoles={['admin', 'rental_manager', 'piling_manager', 'om_manager']} />}>
                  <Route path="alerts" element={<AlertsPage />} />
                </Route>

                {/* Settings (all authenticated roles) */}
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
      </ToastProvider>
    </Router>
  );
}

export default App;
