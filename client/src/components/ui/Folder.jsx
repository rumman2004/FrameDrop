import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MoreVertical, Link2, Trash2, Images,
  Lock, CheckCircle, XCircle, Clock,
} from 'lucide-react';

// ── Colour helpers ─────────────────────────────────────────────────────────
const darkenColor = (hex, pct) => {
  let c = hex.startsWith('#') ? hex.slice(1) : hex;
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const n  = parseInt(c, 16);
  const ch = v => Math.max(0, Math.min(255, Math.floor(v * (1 - pct))));
  const r  = ch((n >> 16) & 0xff);
  const g  = ch((n >> 8)  & 0xff);
  const b  = ch(n         & 0xff);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

// ── Colour palette ─────────────────────────────────────────────────────────
const COLORS = ['#5227FF', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

// ── Countdown hook ─────────────────────────────────────────────────────────
function useCountdown(expiresAt) {
  const calc = () => {
    const diff = new Date(expiresAt) - Date.now();
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1_000);
    return { diff, h, m, s };
  };
  const [left, setLeft] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setLeft(calc()), 1_000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return left;
}

// ── 3-dot context menu ─────────────────────────────────────────────────────
function FolderMenu({ onCopyLink, onDelete, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-8 right-0 z-50 w-52
                 bg-zinc-900 border border-white/[0.09]
                 rounded-2xl shadow-2xl shadow-black/60
                 overflow-hidden"
    >
      <button
        onClick={e => { e.stopPropagation(); onCopyLink(); onClose(); }}
        className="w-full flex items-center gap-3 px-4 py-3
                   text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white
                   transition-colors"
      >
        <Link2 size={14} className="text-violet-400" />
        Copy share link
      </button>

      <div className="border-t border-white/[0.05]" />

      <button
        onClick={e => { e.stopPropagation(); onDelete(); onClose(); }}
        className="w-full flex items-center gap-3 px-4 py-3
                   text-sm text-red-400 hover:bg-red-500/10
                   transition-colors"
      >
        <Trash2 size={14} />
        Delete share
      </button>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function Folder({ session, onDelete, onOpen }) {
  const navigate  = useNavigate();
  const countdown = useCountdown(session.expiresAt);
  const isActive  = Boolean(countdown);

  const [menuOpen,   setMenuOpen]   = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);

  // Deterministic colour from session id
  const colorIdx   = session._id
    ? session._id.charCodeAt(session._id.length - 1) % COLORS.length
    : 0;
  const color      = COLORS[colorIdx];
  const folderBack = darkenColor(color, 0.15);
  const paper1     = darkenColor('#ffffff', 0.10);
  const paper2     = darkenColor('#ffffff', 0.05);
  const paper3     = '#ffffff';

  // Derived
  const fileCount   = session.files?.length ?? session.fileCount ?? 0;
  const shareUrl    = `${window.location.origin}/share/${session.token}`;
  const createdDate = new Date(session.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  const expiresDate = new Date(session.expiresAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  // Timer string
  const timerStr = countdown
    ? countdown.h > 0
      ? `${countdown.h}h ${countdown.m}m ${countdown.s}s`
      : `${countdown.m}m ${countdown.s}s`
    : null;

  // Timer colour
  const timerColor = !countdown
    ? 'text-red-400'
    : countdown.diff < 30 * 60_000
    ? 'text-red-400'
    : countdown.diff < 60 * 60_000
    ? 'text-amber-400'
    : 'text-emerald-400';

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silent */ }
  };

  const handleFolderClick = () => {
    if (!isActive) return;
    setFolderOpen(true);
    setTimeout(() => {
      if (onOpen) onOpen(session);
      else navigate(`/dashboard/session/${session._id}`);
    }, 260);
  };

  const handleDelete = () => {
    if (!confirm(`Delete "${session.title || 'this share'}" and all its files?`)) return;
    onDelete(session._id ?? session.token);
  };

  // Folder animation paper transforms
  const paperSizes      = [
    { w: '70%', h: '80%' },
    { w: '80%', h: '70%' },
    { w: '90%', h: '60%' },
  ];
  const openTransforms  = [
    'translate(-120%, -70%) rotate(-15deg)',
    'translate(10%,   -70%) rotate(15deg)',
    'translate(-50%, -100%) rotate(5deg)',
  ];

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div
      className={`
        group relative bg-zinc-900/80 border rounded-2xl overflow-hidden
        transition-all duration-200
        ${isActive
          ? 'border-white/[0.07] hover:border-white/[0.14] hover:shadow-xl hover:shadow-black/40 hover:-translate-y-0.5 cursor-pointer'
          : 'border-white/[0.04] opacity-65 cursor-default'
        }
      `}
    >

      {/* ── 3-dot menu ────────────────────────────────────────────────── */}
      <div className="absolute top-3 right-3 z-20">
        <button
          onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }}
          className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300
                     hover:bg-zinc-800/80 transition-colors
                     opacity-0 group-hover:opacity-100"
          aria-label="Options"
        >
          <MoreVertical size={15} />
        </button>

        {menuOpen && (
          <FolderMenu
            onCopyLink={handleCopyLink}
            onDelete={handleDelete}
            onClose={() => setMenuOpen(false)}
          />
        )}
      </div>

      {/* ── Copied toast ──────────────────────────────────────────────── */}
      {copied && (
        <div className="absolute top-3 left-3 right-12 z-30
                        flex items-center gap-1.5 pointer-events-none
                        bg-emerald-500/15 border border-emerald-500/30
                        text-emerald-400 text-xs font-semibold
                        px-3 py-1.5 rounded-xl">
          <CheckCircle size={12} />
          Link copied!
        </div>
      )}

      {/* ── Clickable body ────────────────────────────────────────────── */}
      <div
        role={isActive ? 'button' : undefined}
        tabIndex={isActive ? 0 : undefined}
        onClick={handleFolderClick}
        onKeyDown={e => e.key === 'Enter' && handleFolderClick()}
        aria-label={isActive
          ? `Open ${session.title || 'share'}`
          : `${session.title || 'Share'} — expired`
        }
        className="w-full"
      >

        {/* ── Folder SVG visual ──────────────────────────────────────── */}
        <div className="px-6 pt-6 pb-2 flex justify-center select-none">
          <div
            className={`relative transition-all duration-300 ease-out
              ${isActive ? 'group-hover:-translate-y-1.5' : 'grayscale opacity-60'}
              ${folderOpen ? '-translate-y-2' : ''}
            `}
            style={{ width: 100, height: 80 }}
          >
            {/* Back */}
            <div
              className="absolute inset-0 rounded-tr-[10px] rounded-br-[10px] rounded-bl-[10px]"
              style={{ backgroundColor: folderBack }}
            >
              {/* Tab */}
              <span
                className="absolute bottom-full left-0 w-[30px] h-[10px]
                           rounded-tl-[5px] rounded-tr-[5px]"
                style={{ backgroundColor: folderBack }}
              />

              {/* Papers */}
              {[paper1, paper2, paper3].map((bg, i) => (
                <div
                  key={i}
                  className="absolute z-20 bottom-[10%] left-1/2
                             transition-all duration-300"
                  style={{
                    width:           paperSizes[i].w,
                    height:          paperSizes[i].h,
                    backgroundColor: bg,
                    borderRadius:    10,
                    transform:       folderOpen
                      ? openTransforms[i]
                      : 'translateX(-50%) translateY(10%)',
                  }}
                />
              ))}

              {/* Front flap left */}
              <div
                className="absolute z-30 w-full h-full origin-bottom transition-all duration-300"
                style={{
                  backgroundColor: color,
                  borderRadius:    '5px 10px 10px 10px',
                  transform:       folderOpen ? 'skew(15deg) scaleY(0.6)' : undefined,
                }}
              />
              {/* Front flap right */}
              <div
                className="absolute z-30 w-full h-full origin-bottom transition-all duration-300"
                style={{
                  backgroundColor: color,
                  borderRadius:    '5px 10px 10px 10px',
                  transform:       folderOpen ? 'skew(-15deg) scaleY(0.6)' : undefined,
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Info ──────────────────────────────────────────────────── */}
        <div className="px-4 pb-4 pt-1 space-y-2.5">

          {/* Title + badge */}
          <div className="flex items-start justify-between gap-2 pr-6">
            <p className="text-sm font-semibold text-white truncate leading-snug">
              {session.title || 'Untitled Share'}
            </p>
            <span className={`flex-shrink-0 inline-flex items-center gap-1
                              text-[10px] font-bold uppercase tracking-wider
                              px-2 py-0.5 rounded-full ring-1
                              ${isActive
                                ? 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20'
                                : 'text-red-400 bg-red-500/10 ring-red-500/20'
                              }`}>
              {isActive
                ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Active</>
                : <><XCircle size={9} />Expired</>
              }
            </span>
          </div>

          {/* File count */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Images size={12} className="text-zinc-600" />
            {fileCount} {fileCount === 1 ? 'file' : 'files'}
          </div>

          {/* Created */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-600">
            <Clock size={11} />
            Created {createdDate}
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-1.5 text-xs font-semibold
                           tabular-nums ${timerColor}`}>
            <Clock size={11} />
            {isActive
              ? `Expires in ${timerStr}`
              : `Expired ${expiresDate}`
            }
          </div>

          {/* Expired lock notice */}
          {!isActive && (
            <div className="flex items-center gap-1.5 text-[11px] text-red-400/60
                            bg-red-500/5 border border-red-500/10
                            rounded-xl px-2.5 py-1.5">
              <Lock size={11} />
              Gallery locked · share expired
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom action bar ─────────────────────────────────────────── */}
      {isActive ? (
        <div className="border-t border-white/[0.04] flex">
          <button
            onClick={e => { e.stopPropagation(); handleCopyLink(); }}
            className="flex-1 flex items-center justify-center gap-1.5
                       py-2.5 text-xs text-zinc-500 hover:text-violet-400
                       hover:bg-violet-500/5 transition-colors"
          >
            <Link2 size={12} />
            Copy link
          </button>
          <div className="w-px bg-white/[0.04]" />
          <button
            onClick={e => { e.stopPropagation(); handleDelete(); }}
            className="flex-1 flex items-center justify-center gap-1.5
                       py-2.5 text-xs text-zinc-500 hover:text-red-400
                       hover:bg-red-500/5 transition-colors"
          >
            <Trash2 size={12} />
            Delete
          </button>
        </div>
      ) : (
        <div className="border-t border-white/[0.04]">
          <button
            onClick={e => { e.stopPropagation(); handleDelete(); }}
            className="w-full flex items-center justify-center gap-1.5
                       py-2.5 text-xs text-zinc-600 hover:text-red-400
                       hover:bg-red-500/5 transition-colors"
          >
            <Trash2 size={12} />
            Delete expired share
          </button>
        </div>
      )}
    </div>
  );
}