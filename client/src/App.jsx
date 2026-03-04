import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Layouts
import UserLayout from './components/layout/UserLayout';
import AdminLayout from './components/layout/AdminLayout';

// Common
import Landing from './components/common/Landing';

// Auth
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// User pages
import Dashboard from './pages/users/Dashboard';
import Profile from './pages/users/Profile';
import About from './pages/users/About';
import Pricing from './pages/users/Pricing';
import FolderInside from './components/sections/FolderInside'
// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminLogs from './pages/admin/AdminLogs';

// Gallery (public share page)
import SharedGallery from './components/gallery/SharedGallery';

// ── Route Guards ────────────────────────────────────────────────────
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  return !user ? children : <Navigate to={user.isAdmin ? '/admin' : '/dashboard'} replace />;
}

function FullPageLoader() {
  return (
    <div className="flex items-center justify-center h-screen bg-zinc-950">
      <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ── App ─────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/share/:token" element={<SharedGallery />} />

      {/* Guest only */}
      <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      {/* User routes */}
      <Route path="/" element={<PrivateRoute><UserLayout /></PrivateRoute>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile"   element={<Profile />} />
        <Route path="about"     element={<About />} />
        <Route path="pricing"   element={<Pricing />} />
        <Route path="/dashboard/session/:id" element={<FolderInside />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index           element={<AdminDashboard />} />
        <Route path="users"    element={<AdminUsers />} />
        <Route path="logs"     element={<AdminLogs />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}