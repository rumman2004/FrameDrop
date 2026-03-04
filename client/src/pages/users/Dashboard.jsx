import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';
import Folder from '../../components/ui/Folder';
import UploadModal from '../../components/common/UploadModal';
import {
  Upload, FolderOpen, RefreshCw, LayoutGrid,
  List, Search, X, FolderX, Clock,
  Link2, Trash2, ChevronRight,
} from 'lucide-react';

// ── Stat pill ──────────────────────────────────────────────────────────────
function StatPill({ label, value, color, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 bg-zinc-900/60 border border-white/[0.05]
                    rounded-2xl px-5 py-4 flex-1 min-w-[110px]">
      <div className={`p-2 rounded-xl bg-zinc-800/80 flex-shrink-0 ${color}`}>
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className={`text-2xl font-bold tabular-nums leading-none ${color}`}>
          {value}
        </p>
        <p className="text-zinc-600 text-xs mt-1 font-medium uppercase tracking-wider truncate">
          {label}
        </p>
      </div>
    </div>
  );
}

// ── Inline countdown ───────────────────────────────────────────────────────
function ListTimer({ expiresAt }) {
  const [str,  setStr]  = useState('');
  const [diff, setDiff] = useState(0);

  useEffect(() => {
    const calc = () => {
      const d = new Date(expiresAt) - Date.now();
      setDiff(d);
      if (d <= 0) { setStr('Expired'); return; }
      const h = Math.floor(d / 3_600_000);
      const m = Math.floor((d % 3_600_000) / 60_000);
      const s = Math.floor((d % 60_000) / 1_000);
      setStr(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const color = diff <= 0           ? 'text-red-400'
    : diff < 30 * 60_000            ? 'text-red-400'
    : diff < 60 * 60_000            ? 'text-amber-400'
                                    : 'text-emerald-400';

  return (
    <span className={`text-xs font-semibold tabular-nums
                      flex items-center gap-1.5 ${color}`}>
      <Clock size={11} />
      {str}
    </span>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sessions,   setSessions]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [view,       setView]       = useState('grid');
  const [search,     setSearch]     = useState('');
  const [filterTab,  setFilterTab]  = useState('all');
  const [copied,     setCopied]     = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/share/my');
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (idOrToken) => {
    try {
      await api.delete(`/share/${idOrToken}`);
      setSessions(prev =>
        prev.filter(s => s._id !== idOrToken && s.token !== idOrToken)
      );
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }, []);

  const handleCopyLink = useCallback(async (token) => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/share/${token}`
      );
      setCopied(token);
      setTimeout(() => setCopied(null), 2000);
    } catch { /* silent */ }
  }, []);

  const handleOpen = useCallback((session) => {
    if (new Date(session.expiresAt) <= Date.now()) return;
    navigate(`/dashboard/session/${session._id}`);
  }, [navigate]);

  // ── Derived ────────────────────────────────────────────────────────────
  const now     = Date.now();
  const active  = sessions.filter(s => new Date(s.expiresAt) > now);
  const expired = sessions.filter(s => new Date(s.expiresAt) <= now);
  
  const filtered = sessions
    .filter(s => {
      if (filterTab === 'active')  return new Date(s.expiresAt) > now;
      if (filterTab === 'expired') return new Date(s.expiresAt) <= now;
      return true;
    })
    .filter(s =>
      !search ||
      (s.title || '').toLowerCase().includes(search.toLowerCase())
    );

  // ──────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="w-full min-h-full px-4 sm:px-6 lg:px-8 xl:px-10 py-8 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center
                        justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              My Shares
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Welcome back,{' '}
              <span className="text-zinc-300 font-medium">{user?.name}</span>
              {!loading && (
                <span className="text-zinc-600 ml-1">
                  · {sessions.length} total
                </span>
              )}
            </p>
          </div>

          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5
                       bg-violet-600 hover:bg-violet-500 active:bg-violet-700
                       rounded-xl text-sm font-semibold text-white
                       shadow-lg shadow-violet-900/30
                       transition-all duration-150 self-start sm:self-auto"
          >
            <Upload size={15} />
            New Share
          </button>
        </div>

        {/* Stat pills */}
        {!loading && sessions.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            <StatPill label="Total"   value={sessions.length}
                      color="text-white"       icon={FolderOpen} />
            <StatPill label="Active"  value={active.length}
                      color="text-emerald-400" icon={Clock}      />
            <StatPill label="Expired" value={expired.length}
                      color="text-red-400"     icon={FolderX}    />
          </div>
        )}

        {/* Toolbar */}
        {!loading && sessions.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch
                          sm:items-center gap-3">

            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500
                           pointer-events-none" />
              <input
                type="text"
                placeholder="Search by folder name…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-zinc-900/70 border border-white/[0.06]
                           rounded-xl pl-9 pr-8 py-2.5
                           text-sm text-white placeholder-zinc-600
                           focus:outline-none focus:border-violet-500/50
                           transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter */}
            <div className="flex rounded-xl overflow-hidden
                            border border-white/[0.06] flex-shrink-0">
              {[
                { key: 'all',     label: 'All'     },
                { key: 'active',  label: 'Active'  },
                { key: 'expired', label: 'Expired' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilterTab(key)}
                  className={`px-4 py-2.5 text-xs font-semibold transition-all
                    ${filterTab === key
                      ? 'bg-violet-600 text-white'
                      : 'bg-zinc-900/70 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* View toggle */}
            <div className="flex rounded-xl overflow-hidden
                            border border-white/[0.06] flex-shrink-0">
              {[
                { key: 'grid', Icon: LayoutGrid },
                { key: 'list', Icon: List       },
              ].map(({ key, Icon }) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  aria-label={`${key} view`}
                  className={`p-2.5 transition-colors
                    ${view === key
                      ? 'bg-violet-600 text-white'
                      : 'bg-zinc-900/70 text-zinc-400 hover:bg-zinc-800'
                    }`}
                >
                  <Icon size={15} />
                </button>
              ))}
            </div>

            {/* Refresh */}
            <button
              onClick={fetchSessions}
              disabled={loading}
              className="p-2.5 rounded-xl bg-zinc-900/70 border border-white/[0.06]
                         text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800
                         transition-colors disabled:opacity-50"
              aria-label="Refresh"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-28 gap-4">
            <div className="w-9 h-9 border-2 border-violet-500
                            border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-600 text-sm">Loading your shares…</p>
          </div>
        )}

        {/* Empty — no sessions */}
        {!loading && sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center
                          py-28 text-center gap-6">
            <div className="w-24 h-24 rounded-3xl bg-zinc-900/80
                            border border-white/[0.05]
                            flex items-center justify-center">
              <FolderOpen size={38} className="text-zinc-700" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">No shares yet</h3>
              <p className="text-zinc-500 text-sm max-w-xs">
                Create your first share — give it a name and add files for your client
              </p>
            </div>
            <button
              onClick={() => setUploadOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5
                         bg-violet-600 hover:bg-violet-500 rounded-xl
                         text-sm font-semibold text-white transition-all"
            >
              <Upload size={15} />
              Create First Share
            </button>
          </div>
        )}

        {/* Empty — no matches */}
        {!loading && sessions.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <FolderX size={32} className="text-zinc-700" />
            <p className="text-zinc-500 text-sm">
              No shares match{search ? ` "${search}"` : ' this filter'}
            </p>
            <button
              onClick={() => { setSearch(''); setFilterTab('all'); }}
              className="text-xs text-violet-400 hover:text-violet-300
                         underline underline-offset-2 transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Grid view */}
        {!loading && filtered.length > 0 && view === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
                          xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filtered.map(s => (
              <Folder
                key={s._id}
                session={s}
                onDelete={handleDelete}
                onOpen={handleOpen}
              />
            ))}
          </div>
        )}

        {/* List view */}
        {!loading && filtered.length > 0 && view === 'list' && (
          <div className="space-y-1.5">

            {/* Header row */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2
                            text-[11px] font-bold text-zinc-600
                            uppercase tracking-widest select-none">
              <div className="col-span-4">Folder</div>
              <div className="col-span-2">Files</div>
              <div className="col-span-2">Created</div>
              <div className="col-span-3">Time Left</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {filtered.map(s => {
              const isAct  = new Date(s.expiresAt) > now;
              const count  = s.files?.length ?? s.fileCount ?? 0;
              const crDate = new Date(s.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              });

              return (
                <div
                  key={s._id}
                  className={`grid grid-cols-12 gap-4 items-center
                               px-4 py-3.5 rounded-2xl border
                               transition-all duration-150 group
                               ${isAct
                                 ? 'bg-zinc-900/60 border-white/[0.06] hover:border-white/[0.12] hover:bg-zinc-900'
                                 : 'bg-zinc-900/30 border-white/[0.03] opacity-55'
                               }`}
                >
                  {/* Folder name */}
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex-shrink-0
                                     flex items-center justify-center
                                     ${isAct
                                       ? 'bg-violet-500/15 border border-violet-500/20'
                                       : 'bg-zinc-800 border border-white/[0.04]'
                                     }`}>
                      <FolderOpen size={15}
                        className={isAct ? 'text-violet-400' : 'text-zinc-600'} />
                    </div>

                    <button
                      onClick={() =>
                        isAct && navigate(`/dashboard/session/${s._id}`)
                      }
                      disabled={!isAct}
                      className={`text-sm font-semibold truncate text-left
                        ${isAct
                          ? 'text-white hover:text-violet-300 cursor-pointer transition-colors'
                          : 'text-zinc-500 cursor-not-allowed'
                        }`}
                    >
                      {s.title || 'Untitled Share'}
                    </button>

                    {isAct && (
                      <ChevronRight size={14}
                        className="flex-shrink-0 text-zinc-700
                                   group-hover:text-zinc-400 transition-colors" />
                    )}
                  </div>

                  {/* Files */}
                  <div className="col-span-2 text-sm text-zinc-500">
                    {count} {count === 1 ? 'file' : 'files'}
                  </div>

                  {/* Created */}
                  <div className="col-span-2 text-xs text-zinc-600 tabular-nums">
                    {crDate}
                  </div>

                  {/* Timer */}
                  <div className="col-span-3">
                    {isAct
                      ? <ListTimer expiresAt={s.expiresAt} />
                      : <span className="text-xs text-red-400/70 flex items-center gap-1">
                          <X size={10} /> Expired
                        </span>
                    }
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex justify-end items-center gap-1">
                    {isAct && (
                      <button
                        onClick={() => handleCopyLink(s.token)}
                        title="Copy share link"
                        className={`p-1.5 rounded-lg transition-colors
                          ${copied === s.token
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : 'text-zinc-600 hover:text-violet-400 hover:bg-violet-500/10'
                          }`}
                      >
                        <Link2 size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(s._id ?? s.token)}
                      title="Delete share"
                      className="p-1.5 rounded-lg text-zinc-600
                                 hover:text-red-400 hover:bg-red-500/10
                                 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      <UploadModal
        isOpen={uploadOpen}
        onClose={() => { setUploadOpen(false); fetchSessions(); }}
      />
    </>
  );
}