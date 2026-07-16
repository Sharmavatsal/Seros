import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';

// Placeholder Pages
const Login = () => <div className="p-8 text-center text-white">Login Page</div>;
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
        
        {/* Protected Routes (RBAC will be implemented later) */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/admin" replace />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="rental" element={<RentalDashboard />} />
          <Route path="piling" element={<PilingDashboard />} />
          <Route path="om" element={<OMDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
