import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Camera, LayoutDashboard, User, LogOut,
  Menu, X, Upload, ChevronDown,
  Settings, Shield, Info, CreditCard,
  Home, Users, BarChart3, FolderOpen,
  Bell, HelpCircle,
} from 'lucide-react';
import UploadModal from '../common/UploadModal';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const isActive = (pathname, to) =>
  to === '/' ? pathname === '/' : pathname.startsWith(to);

// ─────────────────────────────────────────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────────────────────────────────────────
function Avatar({ user, size = 'sm' }) {
  const initials =
    user?.name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? '?';

  const dim = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-10 h-10 text-sm';

  return (
    <div
      className={`${dim} rounded-full overflow-hidden flex-shrink-0
                   ring-2 bg-zinc-800
                   ${user?.isAdmin
                     ? 'ring-orange-500/40'
                     : 'ring-violet-500/30'
                   }`}
    >
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={user.name}
          className="w-full h-full object-cover object-top"
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center
                      text-white font-bold select-none
                      bg-gradient-to-br
                      ${user?.isAdmin
                        ? 'from-orange-600 to-red-700'
                        : 'from-violet-700 to-indigo-700'
                      }`}
        >
          {initials}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NAV LINK — reusable desktop link pill
// ─────────────────────────────────────────────────────────────────────────────
function NavLink({ to, label, icon: Icon, accent = 'default', onClick }) {
  const location = useLocation();
  const active   = isActive(location.pathname, to);

  const styles = {
    default: {
      active:   'bg-zinc-800 text-white',
      inactive: 'text-zinc-400 hover:text-white hover:bg-zinc-800/60',
      dot:      'bg-violet-400',
    },
    admin: {
      active:   'bg-orange-500/10 text-orange-400',
      inactive: 'text-zinc-400 hover:text-orange-400 hover:bg-orange-500/5',
      dot:      'bg-orange-400',
    },
  }[accent] ?? {};

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl
                  text-sm font-medium transition-all duration-150
                  ${active ? styles.active : styles.inactive}`}
    >
      <Icon size={15} />
      {label}
      {active && (
        <span className={`w-1.5 h-1.5 rounded-full ml-0.5 ${styles.dot}`} />
      )}
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DROPDOWN LINK
// ─────────────────────────────────────────────────────────────────────────────
function DropdownLink({ to, icon: Icon, label, onClick, accent = 'default' }) {
  const location = useLocation();
  const active   = isActive(location.pathname, to);

  const styles = {
    default: {
      active:   'bg-violet-500/10 text-violet-400',
      inactive: 'text-zinc-400 hover:bg-zinc-800 hover:text-white',
    },
    admin: {
      active:   'bg-orange-500/10 text-orange-400',
      inactive: 'text-zinc-400 hover:bg-orange-500/5 hover:text-orange-400',
    },
    danger: {
      active:   'text-red-400',
      inactive: 'text-red-400 hover:bg-red-500/10',
    },
  }[accent] ?? {};

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl
                  text-sm transition-colors font-medium
                  ${active ? styles.active : styles.inactive}`}
    >
      <Icon size={15} />
      {label}
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE LINK
// ─────────────────────────────────────────────────────────────────────────────
function MobileLink({ to, icon: Icon, label, onClick, accent = 'default' }) {
  const location = useLocation();
  const active   = isActive(location.pathname, to);

  const styles = {
    default: {
      active:   'bg-zinc-800 text-white',
      inactive: 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white',
      dot:      'bg-violet-400',
    },
    admin: {
      active:   'bg-orange-500/10 text-orange-400',
      inactive: 'text-zinc-400 hover:bg-orange-500/5 hover:text-orange-400',
      dot:      'bg-orange-400',
    },
  }[accent] ?? {};

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl
                  text-sm font-medium transition-colors
                  ${active ? styles.active : styles.inactive}`}
    >
      <Icon size={16} />
      {label}
      {active && (
        <span className={`ml-auto w-1.5 h-1.5 rounded-full ${styles.dot}`} />
      )}
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// USER DROPDOWN
// ─────────────────────────────────────────────────────────────────────────────
function UserDropdown({ user, onLogout, onClose }) {
  const dropRef = useRef(null);

  useEffect(() => {
    const handler = e => {
      if (dropRef.current && !dropRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={dropRef}
      className="absolute top-[calc(100%+10px)] right-0 z-50
                 w-64 bg-zinc-900 border border-white/[0.07]
                 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
    >
      {/* User info */}
      <div className="px-4 py-4 border-b border-white/[0.05]
                      flex items-center gap-3">
        <Avatar user={user} size="lg" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {user?.name}
          </p>
          <p className="text-xs text-zinc-500 truncate mt-0.5">
            {user?.email}
          </p>
          {user?.isAdmin ? (
            <span className="inline-flex items-center gap-1 text-[10px]
                             font-bold text-orange-400 uppercase tracking-wider mt-1">
              <Shield size={9} />
              Admin
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px]
                             font-bold text-violet-400 uppercase tracking-wider mt-1">
              <User size={9} />
              User
            </span>
          )}
        </div>
      </div>

      {/* Links */}
      <div className="p-2 space-y-0.5">
        <DropdownLink
          to="/dashboard"
          icon={LayoutDashboard}
          label="Dashboard"
          onClick={onClose}
        />
        <DropdownLink
          to="/profile"
          icon={User}
          label="Profile"
          onClick={onClose}
        />

        {/* Admin-only items */}
        {user?.isAdmin && (
          <>
            <div className="my-1 border-t border-white/[0.05]" />
            <p className="px-3 py-1 text-[10px] font-bold text-orange-400/60
                          uppercase tracking-widest">
              Admin
            </p>
            <DropdownLink
              to="/admin"
              icon={Settings}
              label="Admin Panel"
              onClick={onClose}
              accent="admin"
            />
            <DropdownLink
              to="/admin/users"
              icon={Users}
              label="Manage Users"
              onClick={onClose}
              accent="admin"
            />
            <DropdownLink
              to="/admin/analytics"
              icon={BarChart3}
              label="Analytics"
              onClick={onClose}
              accent="admin"
            />
          </>
        )}
      </div>

      {/* Sign out */}
      <div className="p-2 border-t border-white/[0.05]">
        <button
          onClick={() => { onLogout(); onClose(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                     text-sm text-red-400 hover:bg-red-500/10
                     transition-colors font-medium"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLE BADGE — small pill shown in the navbar bar itself
// ─────────────────────────────────────────────────────────────────────────────
function RoleBadge({ user }) {
  if (!user) return null;
  if (user.isAdmin) {
    return (
      <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5
                       rounded-full text-[10px] font-bold uppercase tracking-wider
                       bg-orange-500/15 text-orange-400 border border-orange-500/20">
        <Shield size={9} />
        Admin
      </span>
    );
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN NAVBAR
// ─────────────────────────────────────────────────────────────────────────────
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropOpen,   setDropOpen]   = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setDropOpen(false);
    setMobileOpen(false);
    navigate('/');                    // always land on home after logout
  };

  const closeMobile = () => setMobileOpen(false);

  // ── Role-based nav definitions ──────────────────────────────────────────

  // Shown to everyone (logged in or not)
  const publicLinks = [
    { to: '/about',   label: 'About',   icon: Info       },
    { to: '/pricing', label: 'Pricing', icon: CreditCard },
  ];

  // Only shown when logged in (regular user)
  const userLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/profile',   label: 'Profile',   icon: User            },
  ];

  // Only shown to admins (replaces userLinks for admins)
  const adminLinks = [
    { to: '/dashboard',        label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin',            label: 'Admin',     icon: Settings, accent: 'admin' },
    { to: '/admin/users',      label: 'Users',     icon: Users,    accent: 'admin' },
    { to: '/admin/analytics',  label: 'Analytics', icon: BarChart3, accent: 'admin' },
  ];

  // What links to show in centre nav
  const centreLinks = user
    ? user.isAdmin
      ? [...adminLinks, ...publicLinks]
      : [...userLinks, ...publicLinks]
    : publicLinks;

  // ────────────────────────────────────────────────────────────────────────
  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50
                    backdrop-blur-xl border-b
                    ${user?.isAdmin
                      ? 'bg-zinc-950/90 border-orange-500/10'
                      : 'bg-zinc-950/80 border-white/[0.06]'
                    }`}
      >
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between h-14 gap-4">

            {/* ── Logo ────────────────────────────────────────────── */}
            <Link
              to={
                !user
                  ? '/'
                  : user.isAdmin
                  ? '/admin'
                  : '/dashboard'
              }
              className="flex items-center gap-2.5 flex-shrink-0 group"
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center
                             shadow-lg transition-colors duration-150
                             ${user?.isAdmin
                               ? 'bg-orange-600 group-hover:bg-orange-500 shadow-orange-900/30'
                               : 'bg-violet-600 group-hover:bg-violet-500 shadow-violet-900/30'
                             }`}
              >
                <Camera size={16} className="text-white" />
              </div>
              <span className="font-bold text-base tracking-tight text-white hidden sm:block">
                Frame
                <span
                  className={user?.isAdmin ? 'text-orange-400' : 'text-violet-400'}
                >
                  Drop
                </span>
              </span>

              {/* Admin mode indicator next to logo */}
              {user?.isAdmin && (
                <span className="hidden sm:inline-flex items-center gap-1
                                 px-2 py-0.5 rounded-lg text-[10px] font-bold
                                 uppercase tracking-wider
                                 bg-orange-500/15 text-orange-400
                                 border border-orange-500/20">
                  <Shield size={9} />
                  Admin
                </span>
              )}
            </Link>

            {/* ── Desktop centre links ─────────────────────────── */}
            <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
              {centreLinks.map(({ to, label, icon, accent }) => (
                <NavLink
                  key={to}
                  to={to}
                  label={label}
                  icon={icon}
                  accent={accent ?? 'default'}
                />
              ))}
            </div>

            {/* ── Desktop right side ───────────────────────────── */}
            <div className="hidden md:flex items-center gap-3 flex-shrink-0">

              {/* Public — not logged in */}
              {!user && (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-xl text-sm font-medium
                               text-zinc-300 hover:text-white hover:bg-zinc-800
                               transition-colors border border-white/[0.06]"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center gap-2 px-4 py-2
                               bg-violet-600 hover:bg-violet-500
                               rounded-xl text-sm font-semibold text-white
                               shadow-lg shadow-violet-900/20 transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              )}

              {/* Logged-in user — upload button */}
              {user && !user.isAdmin && (
                <button
                  onClick={() => setUploadOpen(true)}
                  className="flex items-center gap-2 px-4 py-2
                             bg-violet-600 hover:bg-violet-500 active:bg-violet-700
                             rounded-xl text-sm font-semibold text-white
                             shadow-lg shadow-violet-900/20
                             transition-all duration-150"
                >
                  <Upload size={14} />
                  Share Files
                </button>
              )}

              {/* Admin — no upload button, shows admin-specific action */}
              {user?.isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-2 px-4 py-2
                             bg-orange-600/20 hover:bg-orange-600/30
                             border border-orange-500/30
                             rounded-xl text-sm font-semibold text-orange-300
                             transition-all duration-150"
                >
                  <Shield size={14} />
                  Admin Panel
                </Link>
              )}

              {/* User avatar dropdown */}
              {user && (
                <div className="relative">
                  <button
                    onClick={() => setDropOpen(o => !o)}
                    className={`flex items-center gap-2 px-2.5 py-1.5
                                 rounded-xl border transition-all duration-150
                                 ${dropOpen
                                   ? 'bg-zinc-800 border-white/[0.1]'
                                   : 'bg-zinc-800/50 border-white/[0.05] hover:bg-zinc-800 hover:border-white/[0.08]'
                                 }`}
                    aria-label="User menu"
                    aria-expanded={dropOpen}
                  >
                    <Avatar user={user} size="sm" />
                    <span className="text-sm text-zinc-300 font-medium
                                     max-w-[100px] truncate hidden lg:block">
                      {user?.name?.split(' ')[0]}
                    </span>
                    <RoleBadge user={user} />
                    <ChevronDown
                      size={14}
                      className={`text-zinc-500 transition-transform duration-200
                                  ${dropOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {dropOpen && (
                    <UserDropdown
                      user={user}
                      onLogout={handleLogout}
                      onClose={() => setDropOpen(false)}
                    />
                  )}
                </div>
              )}
            </div>

            {/* ── Mobile right side ────────────────────────────── */}
            <div className="flex md:hidden items-center gap-2">

              {/* Public — not logged in on mobile */}
              {!user && (
                <>
                  <Link
                    to="/login"
                    className="px-3 py-2 rounded-xl text-xs font-semibold
                               text-zinc-300 border border-white/[0.06]
                               hover:bg-zinc-800 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="px-3 py-2 rounded-xl text-xs font-semibold
                               text-white bg-violet-600 hover:bg-violet-500
                               transition-colors"
                  >
                    Join
                  </Link>
                </>
              )}

              {/* Regular user on mobile — upload button */}
              {user && !user.isAdmin && (
                <button
                  onClick={() => setUploadOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2
                             bg-violet-600 hover:bg-violet-500
                             rounded-xl text-xs font-semibold text-white
                             transition-colors"
                >
                  <Upload size={13} />
                  Share
                </button>
              )}

              {/* Burger */}
              {user && (
                <button
                  onClick={() => setMobileOpen(o => !o)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white
                             hover:bg-zinc-800 transition-colors"
                  aria-label="Toggle menu"
                >
                  {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
              )}
            </div>

          </div>
        </div>

        {/* ── Mobile drawer ────────────────────────────────────────── */}
        {user && (
          <div
            className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out
                        ${mobileOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
          >
            <div
              className={`border-t px-4 py-4 space-y-1
                          ${user.isAdmin
                            ? 'bg-zinc-950/98 border-orange-500/10'
                            : 'bg-zinc-950/95 border-white/[0.05]'
                          }`}
            >
              {/* User info strip */}
              <div
                className={`flex items-center gap-3 px-3 py-3 mb-3
                             rounded-2xl border
                             ${user.isAdmin
                               ? 'bg-orange-500/5 border-orange-500/15'
                               : 'bg-zinc-900/60 border-white/[0.05]'
                             }`}
              >
                <Avatar user={user} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {user?.email}
                  </p>
                </div>
                {user.isAdmin && (
                  <span className="flex-shrink-0 flex items-center gap-1
                                   px-2 py-0.5 rounded-lg text-[10px]
                                   font-bold uppercase tracking-wider
                                   bg-orange-500/15 text-orange-400
                                   border border-orange-500/20">
                    <Shield size={9} />
                    Admin
                  </span>
                )}
              </div>

              {/* ── Admin-specific mobile links ─────────────────────── */}
              {user.isAdmin && (
                <>
                  <p className="px-4 pt-1 pb-0.5 text-[10px] font-bold
                                text-orange-400/60 uppercase tracking-widest">
                    Admin
                  </p>
                  <MobileLink
                    to="/admin"
                    icon={Settings}
                    label="Admin Panel"
                    onClick={closeMobile}
                    accent="admin"
                  />
                  <MobileLink
                    to="/admin/users"
                    icon={Users}
                    label="Manage Users"
                    onClick={closeMobile}
                    accent="admin"
                  />
                  <MobileLink
                    to="/admin/analytics"
                    icon={BarChart3}
                    label="Analytics"
                    onClick={closeMobile}
                    accent="admin"
                  />
                  <div className="my-2 border-t border-white/[0.05]" />
                </>
              )}

              {/* ── Regular user mobile links ────────────────────────── */}
              {!user.isAdmin && (
                <>
                  <MobileLink
                    to="/dashboard"
                    icon={LayoutDashboard}
                    label="Dashboard"
                    onClick={closeMobile}
                  />
                  <MobileLink
                    to="/profile"
                    icon={User}
                    label="Profile"
                    onClick={closeMobile}
                  />
                </>
              )}

              {/* ── Shared public links ──────────────────────────────── */}
              <MobileLink
                to="/about"
                icon={Info}
                label="About"
                onClick={closeMobile}
              />
              <MobileLink
                to="/pricing"
                icon={CreditCard}
                label="Pricing"
                onClick={closeMobile}
              />

              {/* ── Profile for admin too ────────────────────────────── */}
              {user.isAdmin && (
                <MobileLink
                  to="/profile"
                  icon={User}
                  label="Profile"
                  onClick={closeMobile}
                />
              )}

              {/* Sign out */}
              <div className="pt-2 border-t border-white/[0.05] mt-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                             text-sm font-medium text-red-400
                             hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Spacer */}
      <div className="h-14" aria-hidden="true" />

      {/* Upload modal — only for regular users */}
      {user && !user.isAdmin && (
        <UploadModal
          isOpen={uploadOpen}
          onClose={() => setUploadOpen(false)}
        />
      )}
    </>
  );
}