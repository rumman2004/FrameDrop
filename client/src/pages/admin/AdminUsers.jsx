import { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api';
import {
  Search, UserX, UserCheck,
  ChevronLeft, ChevronRight, Users,
  RefreshCw, X, ShieldAlert, Calendar,
  Mail, BarChart2,
} from 'lucide-react';

export default function AdminUsers() {
  const [data,      setData]      = useState({ users: [], total: 0, pages: 1 });
  const [page,      setPage]      = useState(1);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('all'); // all | active | disabled
  const [loading,   setLoading]   = useState(false);
  const [toggling,  setToggling]  = useState(null);  // userId being toggled

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/admin/users', {
        params: {
          page,
          limit: 20,
          search:   search   || undefined,
          disabled: filter === 'disabled' ? true
                  : filter === 'active'   ? false
                  : undefined,
        },
      });
      setData(res);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, filter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleStatus = async (id) => {
    setToggling(id);
    try {
      await api.patch(`/admin/users/${id}/toggle`);
      await fetchUsers();
    } catch (err) {
      console.error('Toggle failed:', err);
    } finally {
      setToggling(null);
    }
  };

  const handleSearch = (v) => { setSearch(v); setPage(1); };
  const handleFilter = (v) => { setFilter(v); setPage(1); };

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Never';

  return (
    <div className="p-6 xl:p-8 space-y-6 min-h-full">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Users</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {data.total.toLocaleString()} registered user{data.total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800/80
                     hover:bg-zinc-700 border border-white/5 rounded-xl
                     text-sm font-medium text-zinc-300 transition-all disabled:opacity-60"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Search + Filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="w-full bg-zinc-900/80 border border-white/[0.06] rounded-xl
                       pl-10 pr-10 py-2.5 text-sm text-white placeholder-zinc-600
                       focus:outline-none focus:border-violet-500/50 focus:bg-zinc-900
                       transition-colors"
          />
          {search && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2
                         text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status filter */}
        <div className="flex rounded-xl overflow-hidden border border-white/[0.06] flex-shrink-0">
          {[
            { key: 'all',      label: 'All' },
            { key: 'active',   label: 'Active' },
            { key: 'disabled', label: 'Disabled' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleFilter(key)}
              className={`px-4 py-2.5 text-xs font-semibold transition-all
                ${filter === key
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div className="bg-zinc-900/80 border border-white/[0.05] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.05] bg-zinc-800/40">
                <th className="px-5 py-4 text-left">
                  <span className="flex items-center gap-1.5 text-xs font-semibold
                                   text-zinc-500 uppercase tracking-wider">
                    <Users size={12} /> User
                  </span>
                </th>
                <th className="px-5 py-4 text-left">
                  <span className="flex items-center gap-1.5 text-xs font-semibold
                                   text-zinc-500 uppercase tracking-wider">
                    <Mail size={12} /> Email
                  </span>
                </th>
                <th className="px-5 py-4 text-left">
                  <span className="flex items-center gap-1.5 text-xs font-semibold
                                   text-zinc-500 uppercase tracking-wider">
                    <BarChart2 size={12} /> Shares
                  </span>
                </th>
                <th className="px-5 py-4 text-left">
                  <span className="flex items-center gap-1.5 text-xs font-semibold
                                   text-zinc-500 uppercase tracking-wider">
                    <Calendar size={12} /> Last Login
                  </span>
                </th>
                <th className="px-5 py-4 text-left">
                  <span className="flex items-center gap-1.5 text-xs font-semibold
                                   text-zinc-500 uppercase tracking-wider">
                    <ShieldAlert size={12} /> Status
                  </span>
                </th>
                <th className="px-5 py-4 text-right">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Action
                  </span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.03]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-7 h-7 border-2 border-violet-500
                                      border-t-transparent rounded-full animate-spin" />
                      <span className="text-zinc-600 text-xs">Loading users…</span>
                    </div>
                  </td>
                </tr>
              ) : data.users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <Users size={28} className="text-zinc-700" />
                      <span className="text-zinc-500 text-sm">No users found</span>
                    </div>
                  </td>
                </tr>
              ) : data.users.map(user => (
                <tr
                  key={user._id}
                  className={`group transition-colors hover:bg-zinc-800/30
                    ${user.isDisabled ? 'opacity-60' : ''}`}
                >
                  {/* Name + avatar */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0
                                      bg-zinc-800 border border-white/5">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center
                                          bg-gradient-to-br from-violet-800 to-indigo-800
                                          text-white text-xs font-bold">
                            {user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || '?'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate text-sm leading-snug">
                          {user.name}
                        </p>
                        {user.isAdmin && (
                          <span className="text-[10px] text-orange-400 font-semibold
                                           uppercase tracking-wider">
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-5 py-4 text-zinc-400 text-sm max-w-[200px] truncate">
                    {user.email}
                  </td>

                  {/* Share count */}
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center justify-center
                                     w-8 h-7 rounded-lg bg-zinc-800/80
                                     text-zinc-300 text-xs font-bold tabular-nums">
                      {user.shareCount ?? 0}
                    </span>
                  </td>

                  {/* Last login */}
                  <td className="px-5 py-4 text-zinc-500 text-xs whitespace-nowrap">
                    {fmtDate(user.lastLogin)}
                  </td>

                  {/* Status badge */}
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1
                                      rounded-full text-xs font-semibold ring-1
                                      ${user.isDisabled
                                        ? 'bg-red-500/10 text-red-400 ring-red-500/20'
                                        : 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full
                        ${user.isDisabled ? 'bg-red-400' : 'bg-emerald-400'}`} />
                      {user.isDisabled ? 'Disabled' : 'Active'}
                    </span>
                  </td>

                  {/* Toggle button */}
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => toggleStatus(user._id)}
                      disabled={toggling === user._id || user.isAdmin}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5
                                  rounded-xl text-xs font-semibold
                                  transition-all disabled:opacity-40 disabled:cursor-not-allowed
                                  ${user.isDisabled
                                    ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                                  }`}
                    >
                      {toggling === user._id ? (
                        <div className="w-3 h-3 border border-current border-t-transparent
                                        rounded-full animate-spin" />
                      ) : user.isDisabled ? (
                        <><UserCheck size={12} /> Enable</>
                      ) : (
                        <><UserX size={12} /> Disable</>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-zinc-500 text-sm">
          Page <span className="text-white font-semibold">{page}</span> of{' '}
          <span className="text-white font-semibold">{data.pages}</span>
          <span className="text-zinc-600 ml-2">
            ({data.total.toLocaleString()} users)
          </span>
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl
                       bg-zinc-800/80 hover:bg-zinc-700 border border-white/5
                       text-zinc-400 hover:text-white text-sm font-medium
                       disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={15} /> Prev
          </button>

          <div className="flex gap-1">
            {Array.from({ length: Math.min(data.pages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all
                    ${p === page
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30'
                      : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 border border-white/5'
                    }`}
                >
                  {p}
                </button>
              );
            })}
            {data.pages > 5 && (
              <span className="w-9 h-9 flex items-center justify-center text-zinc-600 text-sm">
                …
              </span>
            )}
          </div>

          <button
            onClick={() => setPage(p => Math.min(data.pages, p + 1))}
            disabled={page === data.pages}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl
                       bg-zinc-800/80 hover:bg-zinc-700 border border-white/5
                       text-zinc-400 hover:text-white text-sm font-medium
                       disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Next <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}