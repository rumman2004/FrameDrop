import { useEffect, useState } from 'react';
import api from '../../lib/api';
import {
  Users, FolderOpen, HardDrive, Cpu,
  Clock, Activity, TrendingUp, RefreshCw,
  ScrollText, Zap, Database,
} from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────
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
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px]
                      font-semibold ring-1 ${cls}`}>
      {action.replace(/_/g, ' ')}
    </span>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = 'violet', trend }) {
  const palette = {
    violet: { wrap: 'bg-violet-500/8 border-violet-500/15', icon: 'text-violet-400', glow: 'shadow-violet-900/20' },
    blue:   { wrap: 'bg-blue-500/8 border-blue-500/15',     icon: 'text-blue-400',   glow: 'shadow-blue-900/20'   },
    emerald:{ wrap: 'bg-emerald-500/8 border-emerald-500/15',icon: 'text-emerald-400',glow: 'shadow-emerald-900/20'},
    amber:  { wrap: 'bg-amber-500/8 border-amber-500/15',   icon: 'text-amber-400',  glow: 'shadow-amber-900/20'  },
    rose:   { wrap: 'bg-rose-500/8 border-rose-500/15',     icon: 'text-rose-400',   glow: 'shadow-rose-900/20'   },
  };
  const p = palette[color] ?? palette.violet;

  return (
    <div className={`relative bg-zinc-900/80 border rounded-2xl p-5
                     shadow-lg ${p.glow} hover:shadow-xl
                     transition-all duration-200 group overflow-hidden`}
         style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      {/* Subtle background tint */}
      <div className={`absolute inset-0 ${p.wrap} rounded-2xl opacity-0
                       group-hover:opacity-100 transition-opacity duration-300`} />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-2">
            {label}
          </p>
          <p className="text-3xl font-bold text-white leading-none tracking-tight">
            {value}
          </p>
          {sub && (
            <p className="text-zinc-500 text-xs mt-2 font-medium">{sub}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-zinc-800/60 border border-white/5 ${p.icon} flex-shrink-0`}>
          <Icon size={20} />
        </div>
      </div>

      {trend !== undefined && (
        <div className="relative mt-4 pt-4 border-t border-white/5 flex items-center gap-1.5">
          <TrendingUp size={12} className="text-emerald-400" />
          <span className="text-emerald-400 text-xs font-semibold">{trend}</span>
        </div>
      )}
    </div>
  );
}

// ── Progress Bar ───────────────────────────────────────────────────────────
function ProgressBar({ label, used, total, unit = '%', sublabel }) {
  const pct     = Math.min(total > 0 ? (used / total) * 100 : 0, 100);
  const barCls  = pct > 85 ? 'bg-rose-500' : pct > 65 ? 'bg-amber-500' : 'bg-violet-500';
  const textCls = pct > 85 ? 'text-rose-400' : pct > 65 ? 'text-amber-400' : 'text-violet-400';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-300">{label}</span>
        <span className={`text-xs font-bold tabular-nums ${textCls}`}>
          {pct.toFixed(1)}%
        </span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barCls}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-600">{sublabel}</span>
        <span className="text-xs text-zinc-500 tabular-nums">
          {used} / {total} {unit}
        </span>
      </div>
    </div>
  );
}

// ── Sessions Ring ──────────────────────────────────────────────────────────
function SessionRing({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const colorMap = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    rose:    'text-rose-400 bg-rose-500/10 border-rose-500/20',
    white:   'text-white bg-white/5 border-white/10',
  };
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl p-5
                     border ${colorMap[color]}`}>
      <span className="text-4xl font-bold tabular-nums leading-none">{value}</span>
      <span className="text-xs font-semibold mt-2 opacity-70 uppercase tracking-wider">
        {label}
      </span>
      {total > 0 && (
        <span className="text-xs mt-1 opacity-50 tabular-nums">{pct}%</span>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats,     setStats]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchStats = async (silent = false) => {
    if (!silent) setLoading(true);
    else         setRefreshing(true);
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data);
      setLastFetch(new Date());
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const id = setInterval(() => fetchStats(true), 30_000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent
                        rounded-full animate-spin" />
        <p className="text-zinc-500 text-sm">Loading dashboard…</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-zinc-500">Failed to load stats.</p>
      </div>
    );
  }

  const { users, sessions, storage, serverLoad, recentLogs } = stats;

  return (
    <div className="p-6 xl:p-8 space-y-8 min-h-full">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Real-time platform overview
            {lastFetch && (
              <span className="ml-2 text-zinc-600">
                · updated {lastFetch.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2
                     bg-zinc-800/80 hover:bg-zinc-700 border border-white/5
                     rounded-xl text-sm font-medium text-zinc-300
                     transition-all disabled:opacity-60"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}     color="violet"
          label="Total Users"
          value={users.total}
          sub={`${users.disabled} account${users.disabled !== 1 ? 's' : ''} disabled`}
        />
        <StatCard
          icon={FolderOpen} color="blue"
          label="Active Shares"
          value={sessions.active}
          sub={`${sessions.expired} expired · ${sessions.total} total`}
        />
        <StatCard
          icon={HardDrive} color="emerald"
          label="Storage Used"
          value={`${storage.usedGB} GB`}
          sub={`of ${storage.limitGB} GB · Cloudinary`}
        />
        <StatCard
          icon={Clock}     color="amber"
          label="Uptime"
          value={serverLoad.uptimeFormatted}
          sub={`CPU ${serverLoad.cpuPercent}% · Mem ${serverLoad.memPercent}%`}
        />
      </div>

      {/* ── Storage + Server Load ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Cloudinary */}
        <div className="bg-zinc-900/80 border border-white/[0.05] rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <Database size={16} className="text-violet-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">Cloudinary Storage</h2>
              <p className="text-zinc-600 text-xs">Media hosting & delivery</p>
            </div>
          </div>

          <div className="space-y-5">
            <ProgressBar
              label="Storage"
              used={parseFloat(storage.usedGB)}
              total={parseFloat(storage.limitGB)}
              unit="GB"
              sublabel={`${storage.usedGB} GB used`}
            />
            <ProgressBar
              label="Bandwidth"
              used={parseFloat(storage.bandwidth?.usedGB ?? 0)}
              total={parseFloat(storage.bandwidth?.limitGB ?? 1)}
              unit="GB"
              sublabel={`${storage.bandwidth?.usedGB ?? 0} GB transferred`}
            />
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center
                          justify-between text-sm">
            <span className="text-zinc-500 flex items-center gap-1.5">
              <Zap size={13} className="text-amber-400" />
              Transformations
            </span>
            <span className="text-white font-semibold">
              {storage.transformations?.usage?.toLocaleString() ?? 'N/A'}
            </span>
          </div>
        </div>

        {/* Server */}
        <div className="bg-zinc-900/80 border border-white/[0.05] rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Cpu size={16} className="text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">Server Resources</h2>
              <p className="text-zinc-600 text-xs">Live system metrics</p>
            </div>
          </div>

          <div className="space-y-5">
            <ProgressBar
              label="CPU Usage"
              used={serverLoad.cpuPercent}
              total={100}
              unit="%"
              sublabel="Processor load"
            />
            <ProgressBar
              label="Memory"
              used={parseFloat(serverLoad.memUsedGB)}
              total={parseFloat(serverLoad.memTotalGB)}
              unit="GB"
              sublabel={`${serverLoad.memUsedGB} GB / ${serverLoad.memTotalGB} GB`}
            />
          </div>

          <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-0.5">
              <p className="text-zinc-600 text-xs uppercase tracking-wider">Uptime</p>
              <p className="text-white font-semibold">{serverLoad.uptimeFormatted}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-zinc-600 text-xs uppercase tracking-wider">Memory %</p>
              <p className="text-white font-semibold">{serverLoad.memPercent}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sessions overview ────────────────────────────────────────── */}
      <div className="bg-zinc-900/80 border border-white/[0.05] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Activity size={16} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white text-sm">Share Sessions</h2>
            <p className="text-zinc-600 text-xs">Overview of all active & expired shares</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <SessionRing label="Total"   value={sessions.total}   total={sessions.total}  color="white"   />
          <SessionRing label="Active"  value={sessions.active}  total={sessions.total}  color="emerald" />
          <SessionRing label="Expired" value={sessions.expired} total={sessions.total}  color="rose"    />
        </div>

        {/* Visual bar */}
        {sessions.total > 0 && (
          <div className="mt-5 h-2 bg-zinc-800 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-700"
              style={{ width: `${(sessions.active / sessions.total) * 100}%` }}
            />
            <div
              className="h-full bg-rose-500 transition-all duration-700"
              style={{ width: `${(sessions.expired / sessions.total) * 100}%` }}
            />
          </div>
        )}
        <div className="flex items-center gap-4 mt-2.5">
          <span className="flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Active
          </span>
          <span className="flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            Expired
          </span>
        </div>
      </div>

      {/* ── Recent activity ──────────────────────────────────────────── */}
      <div className="bg-zinc-900/80 border border-white/[0.05] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <ScrollText size={16} className="text-amber-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white text-sm">Recent Activity</h2>
            <p className="text-zinc-600 text-xs">Latest platform events</p>
          </div>
        </div>

        {recentLogs?.length ? (
          <div className="space-y-1.5">
            {recentLogs.map((log, i) => (
              <div
                key={log._id ?? i}
                className="flex items-center justify-between gap-3
                           px-4 py-3 rounded-xl bg-zinc-800/50
                           hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ActionBadge action={log.action} />
                  <span className="text-zinc-300 text-sm truncate">
                    {log.user?.email || log.email || 'system'}
                  </span>
                  {log.ip && (
                    <span className="text-zinc-600 text-xs font-mono hidden sm:inline">
                      {log.ip}
                    </span>
                  )}
                </div>
                <span className="text-zinc-600 text-xs flex-shrink-0 tabular-nums">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-zinc-600 text-sm text-center py-6">No recent activity</p>
        )}
      </div>

    </div>
  );
}