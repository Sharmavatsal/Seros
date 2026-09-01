import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ToastProvider } from './components/ui/ToastContext';
import Login from './pages/Login';

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const DataUpload = lazy(() => import('./pages/admin/DataUpload'));
const RentalDashboard = lazy(() => import('./pages/rental/RentalDashboard'));
const EquipmentInventory = lazy(() => import('./pages/rental/EquipmentInventory'));
const ActiveRentals = lazy(() => import('./pages/rental/ActiveRentals'));
const PreRentalInspections = lazy(() => import('./pages/rental/PreRentalInspections'));
const PilingDashboard = lazy(() => import('./pages/piling/PilingDashboard'));
const OMDashboard = lazy(() => import('./pages/om/OMDashboard'));
const FinancePage = lazy(() => import('./pages/finance/FinancePage'));
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'));
const AlertsPage = lazy(() => import('./pages/alerts/AlertsPage'));
const MaintenancePage = lazy(() => import('./pages/maintenance/MaintenancePage'));
const Settings = lazy(() => import('./pages/settings/Settings'));

const PageLoader = () => (
  <div className="flex items-center justify-center w-full h-full min-h-[50vh]">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

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
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
      </ToastProvider>
    </Router>
  );
}

export default App;
