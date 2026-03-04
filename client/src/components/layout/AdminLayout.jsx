import { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard, Users, ScrollText,
  LogOut, Shield,
} from 'lucide-react';

const navItems = [
  { to: '/admin',       label: 'Dashboard',     icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users',          icon: Users },
  { to: '/admin/logs',  label: 'Activity Logs',  icon: ScrollText },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !user.isAdmin) navigate('/dashboard');
  }, [user]);

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
          <div className="p-2 bg-violet-600 rounded-lg">
            <Shield size={20} />
          </div>
          <div>
            <p className="font-bold text-sm">Admin Panel</p>
            <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all
                ${isActive
                  ? 'bg-violet-600 text-white font-medium'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm
                       text-zinc-400 hover:bg-zinc-800 hover:text-red-400 w-full transition-all"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}