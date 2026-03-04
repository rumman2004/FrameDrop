import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import {
  ArrowLeft, Download, Images, Clock,
  FileX, Loader2, Lock, ZoomIn, X,
  ChevronLeft, ChevronRight, FolderOpen,
  Copy, CheckCircle, Calendar, Info,
  AlertTriangle, Film, File as FileIcon,
  LayoutGrid, LayoutList, SlidersHorizontal,
  ShieldAlert,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// COUNTDOWN — null-safe
// ─────────────────────────────────────────────────────────────────────────────
function useCountdown(expiresAt) {
  const calc = useCallback(() => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt) - Date.now();
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1_000);
    return { diff, h, m, s };
  }, [expiresAt]);

  const [left, setLeft] = useState(calc);

  useEffect(() => {
    setLeft(calc());
    if (!expiresAt) return;
    const id = setInterval(() => setLeft(calc()), 1_000);
    return () => clearInterval(id);
  }, [calc, expiresAt]);

  return left;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function fmtBytes(bytes = 0) {
  if (!bytes || bytes < 0) return '—';
  if (bytes < 1_024)       return `${bytes} B`;
  if (bytes < 1_048_576)   return `${(bytes / 1_024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(2)} MB`;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// Correctly handles your DB schema where type is "image" or "video" (not "image/jpeg")
function getFileType(file) {
  // Primary — DB field stored as "image" | "video"
  if (file.type === 'image') return 'image';
  if (file.type === 'video') return 'video';

  // Secondary — mimeType string like "image/jpeg"
  const mime = file.mimeType || '';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';

  // Tertiary — URL extension
  const ext = (file.url || '').split('?')[0].split('.').pop().toLowerCase();
  if (['jpg','jpeg','png','gif','webp','avif','svg','bmp'].includes(ext)) return 'image';
  if (['mp4','webm','ogg','mov','avi','mkv','m4v'].includes(ext))         return 'video';

  return 'other';
}

async function triggerDownload(url, filename) {
  try {
    const blob = await fetch(url).then(r => r.blob());
    const bUrl = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), {
      href: bUrl, download: filename,
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(bUrl);
  } catch (e) {
    // Fallback — open in new tab if blob fetch is blocked by CORS
    window.open(url, '_blank');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LIGHTBOX
// ─────────────────────────────────────────────────────────────────────────────
function Lightbox({ files, startIndex, onClose }) {
  const [idx,       setIdx]       = useState(startIndex);
  const [imgLoaded, setImgLoaded] = useState(false);
  const stripRef                  = useRef(null);

  const file = files[idx];
  const type = getFileType(file);

  useEffect(() => {
    const handler = e => {
      if (e.key === 'Escape')     onClose();
      if (e.key === 'ArrowRight') setIdx(i => Math.min(i + 1, files.length - 1));
      if (e.key === 'ArrowLeft')  setIdx(i => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [files.length, onClose]);

  useEffect(() => { setImgLoaded(false); }, [idx]);

  useEffect(() => {
    if (!stripRef.current) return;
    const el = stripRef.current.querySelector('[data-active="true"]');
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [idx]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/97 backdrop-blur-md
                 flex flex-col select-none"
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className="flex-shrink-0 flex items-center justify-between
                   px-4 sm:px-6 py-3.5 border-b border-white/[0.07]
                   bg-black/50 backdrop-blur-sm"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-zinc-800/80 flex-shrink-0
                          border border-white/[0.06] flex items-center justify-center">
            {type === 'image'
              ? <Images   size={14} className="text-violet-400" />
              : type === 'video'
              ? <Film     size={14} className="text-blue-400"   />
              : <FileIcon size={14} className="text-zinc-400"   />
            }
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate leading-none">
              {file.originalName || file.name || `File ${idx + 1}`}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {idx + 1} of {files.length}
              {file.size > 0 ? ` · ${fmtBytes(file.size)}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href={file.url}
            download={file.originalName || `file-${idx + 1}`}
            target="_blank"
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5
                       bg-zinc-800/80 hover:bg-zinc-700
                       border border-white/[0.07] rounded-xl
                       text-xs font-medium text-zinc-300 hover:text-white
                       transition-colors"
          >
            <Download size={12} />
            Download
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700
                       border border-white/[0.06]
                       text-zinc-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Media area */}
      <div
        className="flex-1 flex items-center justify-center
                   relative overflow-hidden px-14 py-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Prev */}
        <button
          onClick={() => setIdx(i => Math.max(i - 1, 0))}
          disabled={idx === 0}
          className="absolute left-2 sm:left-3 z-20 p-3 rounded-2xl
                     bg-zinc-900/70 border border-white/[0.07]
                     text-zinc-400 hover:text-white
                     disabled:opacity-15 disabled:cursor-not-allowed
                     transition-all backdrop-blur-sm hover:bg-zinc-800"
        >
          <ChevronLeft size={22} />
        </button>

        {/* Content */}
        <div className="w-full h-full flex items-center justify-center">
          {type === 'image' ? (
            <div className="relative max-w-full max-h-[72vh]
                            flex items-center justify-center">
              {!imgLoaded && (
                <Loader2 size={32} className="animate-spin text-zinc-600 absolute" />
              )}
              <img
                key={file.url}
                src={file.url}
                alt={file.originalName || 'Image'}
                onLoad={() => setImgLoaded(true)}
                className={`max-w-full max-h-[72vh] object-contain
                             rounded-2xl shadow-2xl shadow-black/80
                             transition-opacity duration-300
                             ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                draggable={false}
              />
            </div>
          ) : type === 'video' ? (
            <video
              key={file.url}
              src={file.url}
              controls
              autoPlay
              className="max-w-full max-h-[72vh] rounded-2xl
                         shadow-2xl shadow-black/80 outline-none"
            />
          ) : (
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="w-20 h-20 rounded-3xl bg-zinc-800/80
                              border border-white/[0.06]
                              flex items-center justify-center">
                <FileIcon size={32} className="text-zinc-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-zinc-400">
                  Preview not available
                </p>
                <p className="text-xs text-zinc-600">
                  {file.originalName || 'This file type cannot be previewed'}
                </p>
              </div>
              <a
                href={file.url}
                download={file.originalName}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-5 py-2.5
                           bg-violet-600 hover:bg-violet-500
                           rounded-xl text-sm font-semibold text-white
                           transition-colors"
              >
                <Download size={15} />
                Download File
              </a>
            </div>
          )}
        </div>

        {/* Next */}
        <button
          onClick={() => setIdx(i => Math.min(i + 1, files.length - 1))}
          disabled={idx === files.length - 1}
          className="absolute right-2 sm:right-3 z-20 p-3 rounded-2xl
                     bg-zinc-900/70 border border-white/[0.07]
                     text-zinc-400 hover:text-white
                     disabled:opacity-15 disabled:cursor-not-allowed
                     transition-all backdrop-blur-sm hover:bg-zinc-800"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Thumbnail strip */}
      {files.length > 1 && (
        <div
          ref={stripRef}
          className="flex-shrink-0 border-t border-white/[0.06]
                     bg-black/50 backdrop-blur-sm
                     px-4 py-3 flex gap-2 overflow-x-auto"
          onClick={e => e.stopPropagation()}
        >
          {files.map((f, i) => {
            const t = getFileType(f);
            return (
              <button
                key={f._id ?? i}
                data-active={i === idx ? 'true' : 'false'}
                onClick={() => setIdx(i)}
                className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden
                             border-2 transition-all duration-150
                             ${i === idx
                               ? 'border-violet-500 opacity-100 scale-105'
                               : 'border-transparent opacity-40 hover:opacity-75'
                             }`}
              >
                {t === 'image' ? (
                  <img src={f.url} alt="" loading="lazy"
                       className="w-full h-full object-cover" draggable={false} />
                ) : t === 'video' ? (
                  <div className="w-full h-full bg-zinc-800 relative
                                  flex items-center justify-center">
                    <video src={f.url} preload="metadata"
                           className="absolute inset-0 w-full h-full
                                      object-cover opacity-60" />
                    <Film size={14} className="relative z-10 text-white" />
                  </div>
                ) : (
                  <div className="w-full h-full bg-zinc-800
                                  flex items-center justify-center">
                    <FileIcon size={14} className="text-zinc-500" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FILE CARD — grid view
// ─────────────────────────────────────────────────────────────────────────────
function FileCard({ file, index, onPreview, downloading, onDownload }) {
  const [thumbErr, setThumbErr] = useState(false);
  const type   = getFileType(file);
  const isImg  = type === 'image';
  const isVid  = type === 'video';
  const canPre = isImg || isVid;

  return (
    <div className="group relative bg-zinc-900/80 border border-white/[0.06]
                    rounded-2xl overflow-hidden
                    hover:border-white/[0.16] hover:shadow-2xl hover:shadow-black/60
                    hover:-translate-y-1 transition-all duration-200">

      {/* Thumbnail */}
      <div
        className={`relative overflow-hidden bg-zinc-800 aspect-square
                    ${canPre ? 'cursor-zoom-in' : ''}`}
        onClick={() => canPre && onPreview(index)}
      >
        {isImg && !thumbErr ? (
          <img
            src={file.url}
            alt={file.originalName || `Image ${index + 1}`}
            onError={() => setThumbErr(true)}
            className="w-full h-full object-cover
                       transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            draggable={false}
          />
        ) : isImg && thumbErr ? (
          <div className="w-full h-full flex flex-col items-center
                          justify-center gap-2">
            <Images size={24} className="text-zinc-600" />
            <span className="text-[10px] text-zinc-600">Failed to load</span>
          </div>
        ) : isVid ? (
          <div className="w-full h-full relative">
            <video
              src={file.url}
              preload="metadata"
              className="absolute inset-0 w-full h-full object-cover opacity-70"
            />
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="w-11 h-11 rounded-full bg-black/55
                              backdrop-blur-sm border border-white/25
                              flex items-center justify-center
                              group-hover:scale-110 transition-transform">
                <div className="w-0 h-0 border-y-[8px] border-y-transparent
                                border-l-[13px] border-l-white ml-0.5" />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center
                          justify-center gap-2.5">
            <FileIcon size={26} className="text-zinc-600" />
            <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">
              {(file.mimeType || '').split('/')[1] || 'file'}
            </span>
          </div>
        )}

        {/* Hover overlay */}
        {canPre && (
          <div className="absolute inset-0 bg-black/55 opacity-0
                          group-hover:opacity-100 transition-opacity duration-200
                          flex items-center justify-center">
            <div className="flex items-center gap-1.5 px-3 py-1.5
                            bg-white/15 backdrop-blur-sm rounded-full
                            text-white text-xs font-semibold border border-white/20">
              <ZoomIn size={12} />
              {isImg ? 'View' : 'Play'}
            </div>
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-2 left-2 z-10">
          <span className={`inline-flex items-center gap-1 text-[9px] font-bold
                            uppercase tracking-widest px-2 py-0.5 rounded-full
                            border backdrop-blur-sm
                            ${isImg
                              ? 'bg-violet-500/25 text-violet-300 border-violet-500/40'
                              : isVid
                              ? 'bg-blue-500/25 text-blue-300 border-blue-500/40'
                              : 'bg-zinc-700/60 text-zinc-400 border-zinc-600/40'
                            }`}>
            {isImg ? 'Photo' : isVid ? 'Video' : 'File'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="px-3 pt-2.5 pb-3 space-y-2">
        <p
          className="text-xs font-semibold text-zinc-300 truncate"
          title={file.originalName || file.name}
        >
          {file.originalName || file.name || `File ${index + 1}`}
        </p>
        <div className="flex items-center justify-between gap-2">
          {file.size > 0 && (
            <span className="text-[10px] text-zinc-600 tabular-nums">
              {fmtBytes(file.size)}
            </span>
          )}
          <button
            onClick={() => onDownload(file)}
            disabled={downloading === file._id}
            className="ml-auto flex items-center gap-1 px-2.5 py-1
                       bg-zinc-800 hover:bg-violet-600
                       border border-white/[0.07] hover:border-violet-500
                       rounded-lg text-[11px] font-semibold
                       text-zinc-400 hover:text-white
                       disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all duration-150"
          >
            {downloading === file._id
              ? <Loader2 size={10} className="animate-spin" />
              : <Download size={10} />
            }
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FILE ROW — list view
// ─────────────────────────────────────────────────────────────────────────────
function FileRow({ file, index, onPreview, downloading, onDownload }) {
  const type   = getFileType(file);
  const isImg  = type === 'image';
  const isVid  = type === 'video';
  const canPre = isImg || isVid;

  return (
    <div className="group flex items-center gap-4 px-4 py-3
                    bg-zinc-900/60 border border-white/[0.05]
                    hover:border-white/[0.11] hover:bg-zinc-900
                    rounded-2xl transition-all duration-150">
      {/* Thumb */}
      <div
        className={`flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden
                    bg-zinc-800 border border-white/[0.05]
                    ${canPre ? 'cursor-pointer' : ''}`}
        onClick={() => canPre && onPreview(index)}
      >
        {isImg ? (
          <img src={file.url} alt="" loading="lazy"
               className="w-full h-full object-cover" draggable={false} />
        ) : isVid ? (
          <div className="w-full h-full relative flex items-center justify-center">
            <video src={file.url} preload="metadata"
                   className="absolute inset-0 w-full h-full object-cover opacity-60" />
            <Film size={14} className="relative z-10 text-blue-400" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileIcon size={16} className="text-zinc-600" />
          </div>
        )}
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-300 truncate"
           title={file.originalName || file.name}>
          {file.originalName || file.name || `File ${index + 1}`}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[10px] font-bold uppercase tracking-wider
            ${isImg ? 'text-violet-400' : isVid ? 'text-blue-400' : 'text-zinc-600'}`}>
            {isImg ? 'Photo' : isVid ? 'Video' : 'File'}
          </span>
          {file.size > 0 && (
            <>
              <span className="text-zinc-700">·</span>
              <span className="text-[10px] text-zinc-600 tabular-nums">
                {fmtBytes(file.size)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {canPre && (
          <button
            onClick={() => onPreview(index)}
            className="p-1.5 rounded-lg text-zinc-600
                       hover:text-violet-400 hover:bg-violet-500/10
                       opacity-0 group-hover:opacity-100 transition-all"
          >
            <ZoomIn size={14} />
          </button>
        )}
        <button
          onClick={() => onDownload(file)}
          disabled={downloading === file._id}
          className="flex items-center gap-1.5 px-3 py-1.5
                     bg-zinc-800 hover:bg-violet-600
                     border border-white/[0.06] hover:border-violet-500
                     rounded-xl text-xs font-semibold
                     text-zinc-400 hover:text-white
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-all duration-150"
        >
          {downloading === file._id
            ? <Loader2 size={11} className="animate-spin" />
            : <Download size={11} />
          }
          Save
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function FolderInside() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [session,     setSession]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);   // 'notfound' | 'generic' | null
  const [isExpired,   setIsExpired]   = useState(false);  // separate flag — doesn't block rendering
  const [lightbox,    setLightbox]    = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [dlAll,       setDlAll]       = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [viewMode,    setViewMode]    = useState('grid');
  const [filter,      setFilter]      = useState('all');

  // ── Fetch ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    setLoading(true);
    setError(null);
    setSession(null);
    setIsExpired(false);

    api.get(`/share/session/${id}`)
      .then(({ data }) => {
        if (cancelled) return;
        setSession(data);
        // Check expiry on load
        if (new Date(data.expiresAt) <= new Date()) {
          setIsExpired(true);
        }
      })
      .catch(err => {
        if (cancelled) return;
        const s = err.response?.status;
        // 410 from server means expired but we still want to try to show data
        // For 404 and others we show the error screen
        if (s === 404) setError('notfound');
        else if (s !== 410) setError('generic');
        // For 410 (expired) we set isExpired but don't block render
        else setIsExpired(true);
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [id]);

  // ── Countdown ──────────────────────────────────────────────────────────
  const countdown = useCountdown(session?.expiresAt ?? null);
  const isActive  = Boolean(session && countdown);

  // Watch for expiry while viewing
  useEffect(() => {
    if (!session || loading) return;
    if (!isActive) setIsExpired(true);
  }, [session, loading, isActive]);

  // ── Download single ────────────────────────────────────────────────────
  const downloadFile = useCallback(async file => {
    if (downloading) return;
    setDownloading(file._id);
    try {
      await triggerDownload(
        file.url,
        file.originalName || file.name || `file-${file._id}`
      );
    } catch (e) {
      console.error('Download failed:', e);
    } finally {
      setDownloading(null);
    }
  }, [downloading]);

  // ── Download all ───────────────────────────────────────────────────────
  const downloadAll = useCallback(async () => {
    const files = session?.files;
    if (!files?.length || dlAll) return;
    setDlAll(true);
    try {
      for (const f of files) {
        await triggerDownload(
          f.url,
          f.originalName || f.name || `file-${f._id}`
        );
        await new Promise(r => setTimeout(r, 350));
      }
    } finally {
      setDlAll(false);
    }
  }, [session, dlAll]);

  // ── Copy link ──────────────────────────────────────────────────────────
  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/share/${session?.token}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silent */ }
  }, [session?.token]);

  // ── Timer display ──────────────────────────────────────────────────────
  const timerColor = !countdown
    ? 'text-red-400'
    : countdown.diff < 30 * 60_000
    ? 'text-red-400'
    : countdown.diff < 60 * 60_000
    ? 'text-amber-400'
    : 'text-emerald-400';

  const timerStr = countdown
    ? countdown.h > 0
      ? `${countdown.h}h ${countdown.m}m ${countdown.s}s`
      : `${countdown.m}m ${countdown.s}s`
    : 'Expired';

  // ── File lists ─────────────────────────────────────────────────────────
  const allFiles   = session?.files ?? [];
  const imgCount   = allFiles.filter(f => getFileType(f) === 'image').length;
  const vidCount   = allFiles.filter(f => getFileType(f) === 'video').length;
  const otherCount = allFiles.filter(f => getFileType(f) === 'other').length;

  const displayed = filter === 'all'
    ? allFiles
    : allFiles.filter(f => getFileType(f) === filter);

  // ── LOADING ────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-violet-500/10
                        border border-violet-500/20
                        flex items-center justify-center">
          <FolderOpen size={24} className="text-violet-400" />
        </div>
        <div className="absolute -inset-1.5 rounded-3xl border-2
                        border-violet-500/20 border-t-violet-500 animate-spin" />
      </div>
      <p className="text-zinc-500 text-sm">Loading shared files…</p>
    </div>
  );

  // ── HARD ERROR (not found / server error) ──────────────────────────────
  if (error) {
    const cfg = {
      notfound: {
        icon:  <FileX size={32} className="text-zinc-500" />,
        ring:  'bg-zinc-800/80 border-zinc-700',
        title: 'Not Found',
        desc:  'This share does not exist or has been permanently deleted.',
      },
      generic: {
        icon:  <AlertTriangle size={32} className="text-amber-400" />,
        ring:  'bg-amber-500/10 border-amber-500/20',
        title: 'Something Went Wrong',
        desc:  "We couldn't load this share. Please try again.",
      },
    }[error] ?? {};

    return (
      <div className="flex flex-col items-center justify-center
                      min-h-[70vh] gap-6 p-8 text-center">
        <div className={`w-24 h-24 rounded-3xl border-2 flex items-center
                         justify-center ${cfg.ring}`}>
          {cfg.icon}
        </div>
        <div className="space-y-2 max-w-sm">
          <h2 className="text-xl font-bold text-white">{cfg.title}</h2>
          <p className="text-zinc-500 text-sm leading-relaxed">{cfg.desc}</p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-5 py-2.5
                     bg-zinc-800 hover:bg-zinc-700
                     border border-white/[0.07] rounded-xl
                     text-sm font-semibold text-zinc-300 hover:text-white
                     transition-all"
        >
          <ArrowLeft size={15} />
          Back to Dashboard
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN RENDER — shows files regardless of expiry state
  // Expiry is shown as an inline banner, not a blocking error screen
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {lightbox !== null && allFiles.length > 0 && (
        <Lightbox
          files={allFiles}
          startIndex={lightbox}
          onClose={() => setLightbox(null)}
        />
      )}

      <div className="w-full min-h-full
                      px-4 sm:px-6 lg:px-8 xl:px-10 py-8 space-y-6">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start
                        justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-shrink-0 p-2.5 rounded-xl
                         bg-zinc-900/80 border border-white/[0.07]
                         text-zinc-400 hover:text-white hover:bg-zinc-800
                         transition-colors"
            >
              <ArrowLeft size={17} />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-white
                               tracking-tight truncate">
                  {session?.title || 'Untitled Share'}
                </h1>
                {/* Active / Expired badge */}
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1
                                  rounded-full text-[10px] font-bold uppercase
                                  tracking-widest ring-1 flex-shrink-0
                                  ${isActive
                                    ? 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20'
                                    : 'text-red-400 bg-red-500/10 ring-red-500/20'
                                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                    ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                  {isActive ? 'Active' : 'Expired'}
                </span>
              </div>

              <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-zinc-500">
                  <Images size={11} className="text-zinc-600" />
                  {allFiles.length} {allFiles.length === 1 ? 'file' : 'files'}
                </span>
                <span className="text-zinc-700 text-xs">·</span>
                <span className="flex items-center gap-1 text-xs text-zinc-500">
                  <Calendar size={11} className="text-zinc-600" />
                  {fmtDate(session?.createdAt)}
                </span>
                {session?.token && (
                  <>
                    <span className="text-zinc-700 text-xs">·</span>
                    <span className="text-[11px] text-zinc-600 font-mono">
                      #{session.token.slice(0, 8)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            {isActive && (
              <button
                onClick={copyLink}
                className={`flex items-center gap-2 px-3.5 py-2 border
                             rounded-xl text-xs font-semibold transition-all
                             ${copied
                               ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                               : 'bg-zinc-900/80 border-white/[0.07] text-zinc-400 hover:text-white hover:bg-zinc-800'
                             }`}
              >
                {copied
                  ? <><CheckCircle size={13} />Copied!</>
                  : <><Copy size={13} />Copy Link</>
                }
              </button>
            )}
            {allFiles.length > 0 && (
              <button
                onClick={downloadAll}
                disabled={dlAll}
                className="flex items-center gap-2 px-4 py-2
                           bg-violet-600 hover:bg-violet-500 active:bg-violet-700
                           disabled:opacity-50 disabled:cursor-not-allowed
                           rounded-xl text-xs sm:text-sm font-semibold text-white
                           shadow-lg shadow-violet-900/25 transition-all duration-150"
              >
                {dlAll
                  ? <><Loader2 size={13} className="animate-spin" />Saving…</>
                  : <><Download size={13} />Download All</>
                }
              </button>
            )}
          </div>
        </div>

        {/* ── Expired banner (inline — does NOT block file display) ──── */}
        {isExpired && (
          <div className="flex items-start gap-3 px-4 py-4
                          bg-red-500/8 border border-red-500/20 rounded-2xl">
            <ShieldAlert size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-300">
                This share has expired
              </p>
              <p className="text-xs text-red-400/70 mt-0.5 leading-relaxed">
                The public share link is no longer active. As the owner,
                you can still view and download your files below.
              </p>
            </div>
          </div>
        )}

        {/* ── Expiry warning (approaching) ──────────────────────────── */}
        {isActive && countdown && countdown.diff < 30 * 60_000 && (
          <div className="flex items-start gap-3 px-4 py-3.5
                          bg-amber-500/8 border border-amber-500/25 rounded-2xl">
            <AlertTriangle size={15}
              className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-300/80 leading-relaxed">
              <span className="font-semibold">Expiring soon.</span>{' '}
              Download your files before the timer runs out.
            </p>
          </div>
        )}

        {/* ── Timer bar ─────────────────────────────────────────────── */}
        <div className={`flex items-center justify-between gap-4 px-5 py-4
                         rounded-2xl border
                         ${isActive
                           ? 'bg-zinc-900/50 border-white/[0.05]'
                           : 'bg-zinc-900/30 border-white/[0.03]'
                         }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border
              ${isActive && countdown && countdown.diff >= 30 * 60_000
                ? 'bg-emerald-500/10 border-emerald-500/20'
                : isActive
                ? 'bg-amber-500/10 border-amber-500/20'
                : 'bg-zinc-800 border-zinc-700'
              }`}>
              <Clock size={16} className={timerColor} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                {isActive ? 'Time Remaining' : 'Session Ended'}
              </p>
              <p className={`text-lg font-bold tabular-nums leading-none mt-0.5
                             ${timerColor}`}>
                {timerStr}
              </p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-zinc-700 uppercase tracking-widest font-bold">
              {isActive ? 'Expires' : 'Expired'}
            </p>
            <p className="text-sm font-semibold text-zinc-500 mt-0.5">
              {fmtDate(session?.expiresAt)}
            </p>
          </div>
        </div>

        {/* ── Files ─────────────────────────────────────────────────── */}
        {allFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center
                          min-h-[35vh] gap-6">
            <div className="w-24 h-24 rounded-3xl bg-zinc-900/80
                            border border-white/[0.05]
                            flex items-center justify-center">
              <FolderOpen size={36} className="text-zinc-700" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-zinc-400 font-semibold">No files in this folder</p>
              <p className="text-zinc-600 text-sm">
                Files may have been removed or failed to upload
              </p>
            </div>
          </div>

        ) : (
          <div className="space-y-4">

            {/* Filter + view toggle toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center
                            justify-between gap-3">

              {/* Filter tabs */}
              <div className="flex items-center gap-1 bg-zinc-900/60
                              border border-white/[0.05] rounded-xl p-1">
                {[
                  { key: 'all',   label: `All (${allFiles.length})` },
                  imgCount   > 0 && { key: 'image', label: `Photos (${imgCount})`   },
                  vidCount   > 0 && { key: 'video', label: `Videos (${vidCount})`   },
                  otherCount > 0 && { key: 'other', label: `Other (${otherCount})`  },
                ].filter(Boolean).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold
                                transition-all duration-150
                                ${filter === key
                                  ? 'bg-violet-600 text-white shadow-sm'
                                  : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Count + view toggle */}
              <div className="flex items-center gap-3">
                <p className="text-xs text-zinc-600">
                  {displayed.length} {displayed.length === 1 ? 'item' : 'items'}
                </p>
                <div className="flex rounded-xl overflow-hidden border border-white/[0.06]">
                  {[
                    { key: 'grid', Icon: LayoutGrid },
                    { key: 'list', Icon: LayoutList },
                  ].map(({ key, Icon }) => (
                    <button
                      key={key}
                      onClick={() => setViewMode(key)}
                      className={`p-2 transition-colors
                        ${viewMode === key
                          ? 'bg-violet-600 text-white'
                          : 'bg-zinc-900/70 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                        }`}
                    >
                      <Icon size={14} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Section heading */}
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-violet-500 rounded-full" />
              <p className="text-sm font-bold text-zinc-300">
                {session?.title || 'Shared Files'}
              </p>
              <SlidersHorizontal size={13} className="text-zinc-600 ml-1" />
            </div>

            {/* Empty filter result */}
            {displayed.length === 0 && (
              <div className="flex flex-col items-center justify-center
                              py-16 gap-4 text-center">
                <Images size={28} className="text-zinc-700" />
                <p className="text-zinc-500 text-sm">
                  No {filter}s in this folder
                </p>
                <button
                  onClick={() => setFilter('all')}
                  className="text-xs text-violet-400 hover:text-violet-300
                             underline underline-offset-2 transition-colors"
                >
                  Show all files
                </button>
              </div>
            )}

            {/* Grid */}
            {viewMode === 'grid' && displayed.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4
                              lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7
                              gap-3 sm:gap-4">
                {displayed.map((file, i) => {
                  const globalIdx = allFiles.findIndex(f =>
                    (f._id && f._id === file._id) || f.url === file.url
                  );
                  return (
                    <FileCard
                      key={file._id ?? i}
                      file={file}
                      index={globalIdx !== -1 ? globalIdx : i}
                      onPreview={setLightbox}
                      downloading={downloading}
                      onDownload={downloadFile}
                    />
                  );
                })}
              </div>
            )}

            {/* List */}
            {viewMode === 'list' && displayed.length > 0 && (
              <div className="space-y-2">
                {displayed.map((file, i) => {
                  const globalIdx = allFiles.findIndex(f =>
                    (f._id && f._id === file._id) || f.url === file.url
                  );
                  return (
                    <FileRow
                      key={file._id ?? i}
                      file={file}
                      index={globalIdx !== -1 ? globalIdx : i}
                      onPreview={setLightbox}
                      downloading={downloading}
                      onDownload={downloadFile}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Session details footer ───────────────────────────────── */}
        <div className="border-t border-white/[0.04] pt-8">
          <div className="flex items-center gap-2 mb-4">
            <Info size={13} className="text-zinc-700" />
            <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">
              Session Details
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Folder Name', value: session?.title || 'Untitled' },
              { label: 'Files',       value: `${allFiles.length} file${allFiles.length !== 1 ? 's' : ''}` },
              { label: 'Created',     value: fmtDate(session?.createdAt)  },
              { label: 'Expires',     value: fmtDate(session?.expiresAt)  },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="bg-zinc-900/50 border border-white/[0.04]
                           rounded-2xl px-4 py-3.5"
              >
                <p className="text-[9px] font-bold text-zinc-700
                              uppercase tracking-widest mb-1.5">
                  {label}
                </p>
                <p className="text-sm font-semibold text-zinc-300 truncate">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}