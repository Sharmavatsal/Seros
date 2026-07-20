import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ToastProvider } from './components/ui/ToastContext';
import Login from './pages/Login';

import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import RentalDashboard from './pages/rental/RentalDashboard';
import PilingDashboard from './pages/piling/PilingDashboard';
import OMDashboard from './pages/om/OMDashboard';
import FinancePage from './pages/finance/FinancePage';
import ReportsPage from './pages/reports/ReportsPage';
import AlertsPage from './pages/alerts/AlertsPage';
import MaintenancePage from './pages/maintenance/MaintenancePage';

const Unauthorized = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="text-6xl font-bold text-alert mb-4">403</div>
      <h1 className="text-xl font-semibold text-white mb-2">Unauthorized Access</h1>
      <p className="text-gray-400 mb-6">You don't have permission to view this page.</p>
      <a href="/login" className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary-dark transition-colors">
        Go to Login
      </a>
    </div>
  </div>
);

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* All protected routes under MainLayout */}
          <Route path="/" element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              {/* Default redirect based on role — handled in login */}
              <Route index element={<Navigate to="/admin" replace />} />

              {/* Admin-only */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="admin" element={<AdminDashboard />} />
                <Route path="users" element={<UserManagement />} />
              </Route>

              {/* Rental */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'rental_manager']} />}>
                <Route path="rental" element={<RentalDashboard />} />
              </Route>

              {/* Piling */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'piling_manager']} />}>
                <Route path="piling" element={<PilingDashboard />} />
              </Route>

              {/* O&M */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'om_manager']} />}>
                <Route path="om" element={<OMDashboard />} />
              </Route>

              {/* Maintenance — admin + om_manager */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'om_manager']} />}>
                <Route path="maintenance" element={<MaintenancePage />} />
              </Route>

              {/* Finance — all roles (vertical-scoped) */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'rental_manager', 'piling_manager', 'om_manager']} />}>
                <Route path="finance" element={<FinancePage />} />
              </Route>

              {/* Reports — all roles (vertical-scoped) */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'rental_manager', 'piling_manager', 'om_manager']} />}>
                <Route path="reports" element={<ReportsPage />} />
              </Route>

              {/* Alerts — all roles */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'rental_manager', 'piling_manager', 'om_manager']} />}>
                <Route path="alerts" element={<AlertsPage />} />
              </Route>
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
