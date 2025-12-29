import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import LayoutDashboard from './pages/userPage/LayoutDashboard';
import Dashboard from './pages/userPage/Dashboard';
import Laporan from './pages/userPage/Laporan';
import AdminDashboard from './pages/adminPage/AdminDashboard';
import Tantangan from './pages/userPage/Tantangan';
import Forum from './pages/userPage/Forum';
import ResetPassword from './pages/ResetPassword';
import Artikel from './pages/userPage/Artikel';
import VerifyEmail from './pages/VerifyEmail';

function App() {
  return (
    <div className="font-[poppins]">
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/Register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/AdminDashboard" element={<AdminDashboard />} />
          <Route path="/" element={<LayoutDashboard />}>
            <Route path="Dashboard" element={<Dashboard />} />
            <Route path="Laporan" element={<Laporan />} />
            <Route path="Tantangan" element={<Tantangan />} />
            <Route path="Forum" element={<Forum />} />
            <Route path="Artikel" element={<Artikel />} />
          </Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
