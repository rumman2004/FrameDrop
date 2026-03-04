import { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api';
import {
  ChevronLeft, ChevronRight, ScrollText,
  Search, X, RefreshCw,
} from 'lucide-react';

const ALL_ACTIONS = [
  'ALL','REGISTER','LOGIN','LOGIN_FAILED','SHARE_CREATED',
  'SHARE_ACCESSED','SHARE_DELETED','SHARE_EXPIRED','ADMIN_LOGIN',
  'USER_DISABLED','USER_ENABLED',
];

const actionColors = {
  REGISTER:       'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
  LOGIN:          'bg-blue-500/10 text-blue-400 ring-blue-500/20',
  LOGIN_FAILED:   'bg-red-500/10 text-red-400 ring-red-500/20',
  SHARE_CREATED:  'bg-violet-500/10 text-violet-400 ring-violet-500/20',
  SHARE_ACCESSED: 'bg-cyan-500/10 text-cyan-400 ring-cyan-500/20',
  SHARE_DELETED:  'bg-rose-500/10 text-rose-400 ring-rose-500/20',
  SHARE_EXPIRED:  'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  ADMIN_LOGIN:    'bg-orange-500/10 text-orange-400 ring-orange-500/20',
  USER_DISABLED:  'bg-red-500/10 text-red-400 ring-red-500/20',
  USER_ENABLED:   'bg-green-500/10 text-green-400 ring-green-500/20',
};

function ActionBadge({ action }) {
  const cls = actionColors[action] || 'bg-zinc-700/50 text-zinc-300 ring-zinc-600/20';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full
                      text-[11px] font-semibold ring-1 whitespace-nowrap ${cls}`}>
      {action.replace(/_/g, ' ')}
    </span>
  );
}

export default function AdminLogs() {
  const [data,    setData]    = useState({ logs: [], total: 0, pages: 1 });
  const [page,    setPage]    = useState(1);
  const [action,  setAction]  = useState('');
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/admin/logs', {
        params: { page, limit: 30, action: action || undefined, search: search || undefined },
      });
      setData(res);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, action, search]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleActionFilter = (a) => {
    setAction(a === 'ALL' ? '' : a);
    setPage(1);
  };

  const handleSearch = (v) => {
    setSearch(v);
    setPage(1);
  };

  const formatMeta = (meta = {}) => {
    const keys = Object.keys(meta);
    if (!keys.length) return null;
    return keys.map(k => `${k}: ${JSON.stringify(meta[k])}`).join(' · ');
  };

  return (
    <div className="p-6 xl:p-8 space-y-6 min-h-full">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Activity Logs</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {data.total.toLocaleString()} total event{data.total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800/80
                     hover:bg-zinc-700 border border-white/5 rounded-xl
                     text-sm font-medium text-zinc-300 transition-all disabled:opacity-60"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Search + filters */}
      <div className="space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by email or IP…"
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

        {/* Action filter pills */}
        <div className="flex flex-wrap gap-2">
          {ALL_ACTIONS.map(a => {
            const active = (a === 'ALL' && !action) || a === action;
            return (
              <button
                key={a}
                onClick={() => handleActionFilter(a)}
                className={`px-3 py-1 rounded-full text-xs font-semibold
                            transition-all duration-150
                            ${active
                              ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30'
                              : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 border border-white/5'
                            }`}
              >
                {a.replace(/_/g, ' ')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-900/80 border border-white/[0.05] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.05] bg-zinc-800/40">
                {['Time', 'Action', 'User', 'IP Address', 'Details'].map(h => (
                  <th key={h}
                      className="px-5 py-3.5 text-left text-xs font-semibold
                                 text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-7 h-7 border-2 border-violet-500 border-t-transparent
                                      rounded-full animate-spin" />
                      <span className="text-zinc-600 text-xs">Loading logs…</span>
                    </div>
                  </td>
                </tr>
              ) : data.logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <ScrollText size={28} className="text-zinc-700" />
                      <span className="text-zinc-500 text-sm">No logs found</span>
                    </div>
                  </td>
                </tr>
              ) : data.logs.map((log, i) => {
                const meta = formatMeta(log.meta);
                return (
                  <tr
                    key={log._id ?? i}
                    className="hover:bg-zinc-800/30 transition-colors group"
                  >
                    <td className="px-5 py-3.5 text-zinc-500 text-xs whitespace-nowrap tabular-nums">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-5 py-3.5 text-zinc-300 max-w-[180px] truncate">
                      {log.user?.email || log.email || (
                        <span className="text-zinc-600 italic">system</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-500 font-mono text-xs">
                      {log.ip || <span className="text-zinc-700">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600 text-xs max-w-[260px] truncate">
                      {meta || <span className="text-zinc-700">—</span>}
                    </td>
                  </tr>
                );
              })}
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
            ({data.total.toLocaleString()} records)
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

          {/* Page number pills */}
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