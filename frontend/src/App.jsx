import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';

// Placeholder Pages
const AdminDashboard = () => <div className="p-8 text-white">Admin Dashboard</div>;
const RentalDashboard = () => <div className="p-8 text-white">Rental Dashboard</div>;
const PilingDashboard = () => <div className="p-8 text-white">Piling Dashboard</div>;
const OMDashboard = () => <div className="p-8 text-white">O&M Dashboard</div>;
const Unauthorized = () => <div className="p-8 text-center text-alert">Unauthorized Access</div>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        {/* Protected Routes with RBAC */}
        <Route path="/" element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route index element={<Navigate to="/admin" replace />} />
            
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="admin" element={<AdminDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin', 'rental_manager']} />}>
              <Route path="rental" element={<RentalDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin', 'piling_manager']} />}>
              <Route path="piling" element={<PilingDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin', 'om_manager']} />}>
              <Route path="om" element={<OMDashboard />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
