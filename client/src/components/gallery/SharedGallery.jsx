import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Camera, Clock, Download, AlertTriangle,
  Loader2, FileX, ChevronDown, ChevronUp, Images,
} from 'lucide-react';
import api from '../../lib/api';
import PinModal from '../ui/PinModal';
import MasonryGrid from './MasonryGrid';
import ContactCard from '../../components/ui/ContactCard';

const HEADER_H = 56;

export default function SharedGallery() {
  const { token } = useParams();

  const [files,        setFiles]        = useState(null);
  const [shareData,    setShareData]    = useState(null);
  const [expiresAt,    setExpiresAt]    = useState(null);
  const [pinOpen,      setPinOpen]      = useState(false);
  const [pinLoading,   setPinLoading]   = useState(false);
  const [pinError,     setPinError]     = useState('');
  const [expired,      setExpired]      = useState(false);
  const [notFound,     setNotFound]     = useState(false);
  const [timeLeft,     setTimeLeft]     = useState('');
  const [checking,     setChecking]     = useState(true);
  const [downloading,  setDownloading]  = useState(false);
  const [cardExpanded, setCardExpanded] = useState(false);

  // ── Step 1: Verify link ───────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const { data } = await api.get(`/share/${token}`);
        setExpiresAt(data.expiresAt);
        setShareData(data);
        setPinOpen(true);
      } catch (err) {
        const s = err.response?.status;
        if (s === 410) setExpired(true);
        else           setNotFound(true);
      } finally {
        setChecking(false);
      }
    })();
  }, [token]);

  // ── Step 2: Countdown ─────────────────────────────────────────────────
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = new Date(expiresAt) - Date.now();
      if (diff <= 0) { setExpired(true); setFiles(null); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000)    / 1_000);
      setTimeLeft(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  // ── Step 3: PIN ───────────────────────────────────────────────────────
  const handlePin = useCallback(async (pin) => {
    setPinLoading(true);
    setPinError('');
    try {
      const { data } = await api.post(`/share/${token}/verify`, { pin });
      setFiles(data.files);
      setExpiresAt(data.expiresAt);
      setShareData(prev => ({ ...prev, ...data }));
      setPinOpen(false);
    } catch (err) {
      const status  = err.response?.status;
      const message = err.response?.data?.message || 'Something went wrong';
      if (status === 410)      { setExpired(true); setPinOpen(false); }
      else if (status === 401) setPinError('Incorrect PIN. Please try again.');
      else                     setPinError(message);
    } finally {
      setPinLoading(false);
    }
  }, [token]);

  // ── Step 4: Download all ──────────────────────────────────────────────
  const downloadAll = useCallback(async () => {
    if (!files?.length || downloading) return;
    setDownloading(true);
    try {
      for (const f of files) {
        const blob = await fetch(f.url).then(r => r.blob());
        const url  = URL.createObjectURL(blob);
        const a    = Object.assign(document.createElement('a'), {
          href: url, download: f.originalName || `file-${Date.now()}`,
        });
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        await new Promise(r => setTimeout(r, 300));
      }
    } catch (e) {
      console.error('Download error:', e);
    } finally {
      setDownloading(false);
    }
  }, [files, downloading]);

  // ── ContactCard props ─────────────────────────────────────────────────
  const owner = shareData?.user ?? shareData?.owner ?? null;
  const contactProps = {
    name:         owner?.name                 ?? 'Photographer',
    handle:       owner?.email?.split('@')[0] ?? '',
    email:        owner?.email                ?? '',
    isAdmin:      owner?.isAdmin              ?? false,
    avatarUrl:    owner?.avatar               ?? '',
    role:         owner?.isAdmin ? 'Administrator' : 'Photographer',
    shareTitle:   shareData?.title            ?? '',
    shareCount:   owner?.totalShares          ?? 0,
    activeShares: owner?.activeShares         ?? 0,
    photoCount:   files?.length ?? shareData?.photoCount ?? 0,
    expiresAt,
    createdAt:    owner?.createdAt            ?? null,
    onContact:    owner?.email
      ? () => { window.location.href = `mailto:${owner.email}`; }
      : undefined,
    showStats:    true,
    showInfoRows: true,
  };

  // ── Interstitial screens ──────────────────────────────────────────────
  if (checking) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 size={44} className="animate-spin text-violet-400 mx-auto" />
        <p className="text-zinc-400 text-sm tracking-wide">Checking link…</p>
      </div>
    </div>
  );

  if (expired) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="text-center space-y-5 max-w-sm">
        <div className="w-24 h-24 bg-red-500/10 border border-red-500/20
                        rounded-3xl flex items-center justify-center mx-auto">
          <AlertTriangle size={36} className="text-red-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Link Expired</h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            This share link has expired and the files are no longer available.
          </p>
        </div>
      </div>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="text-center space-y-5 max-w-sm">
        <div className="w-24 h-24 bg-zinc-800 border border-zinc-700
                        rounded-3xl flex items-center justify-center mx-auto">
          <FileX size={36} className="text-zinc-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Link Not Found</h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            This share link doesn't exist or has already been deleted.
          </p>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen bg-zinc-950 flex flex-col overflow-hidden">

      {/* ══════════════════════════════════════════════════════════════════
          HEADER — full width, fixed height, sticky
      ══════════════════════════════════════════════════════════════════ */}
      <header
        className="flex-shrink-0 w-full sticky top-0 z-50
                   bg-zinc-950/95 backdrop-blur-xl
                   border-b border-white/[0.06]"
        style={{ height: HEADER_H }}
      >
        <div className="h-full w-full px-4 lg:px-8
                        flex items-center justify-between gap-4">

          {/* ── Logo ── */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 bg-violet-600 rounded-xl
                            flex items-center justify-center shadow-lg shadow-violet-900/40">
              <Camera size={16} className="text-white" />
            </div>
            <span className="font-bold text-white text-base tracking-tight">
              Frame<span className="text-violet-400">Drop</span>
            </span>
          </div>

          {/* ── Centre: title + file count (desktop) ── */}
          <div className="hidden lg:flex flex-col items-center leading-none gap-0.5">
            {shareData?.title ? (
              <p className="text-sm font-semibold text-white tracking-tight truncate max-w-sm">
                {shareData.title}
              </p>
            ) : null}
            {files && (
              <p className="text-xs text-zinc-500">
                {files.length} {files.length === 1 ? 'file' : 'files'}
              </p>
            )}
          </div>

          {/* ── Right: timer + download ── */}
          <div className="flex items-center gap-3 flex-shrink-0">

            {/* Timer pill */}
            {timeLeft && (
              <div className="flex items-center gap-1.5 px-3 py-1.5
                              bg-amber-500/10 border border-amber-500/20
                              rounded-full text-amber-400">
                <Clock size={12} />
                <span className="tabular-nums text-xs font-semibold">{timeLeft}</span>
              </div>
            )}

            {/* Download button */}
            {files && (
              <button
                onClick={downloadAll}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2
                           bg-violet-600 hover:bg-violet-500 active:bg-violet-700
                           disabled:opacity-50 disabled:cursor-not-allowed
                           rounded-xl text-sm font-semibold text-white
                           shadow-lg shadow-violet-900/30
                           transition-all duration-150"
              >
                {downloading
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Download size={14} />
                }
                <span className="hidden sm:inline">
                  {downloading ? 'Saving…' : 'Download All'}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════
          BODY  —  fills remaining viewport height, no outer scroll
      ══════════════════════════════════════════════════════════════════ */}
      <div
        className="flex-1 flex overflow-hidden"
        style={{ height: `calc(100vh - ${HEADER_H}px)` }}
      >

        {/* ────────────────────────────────────────────────────────────────
            GALLERY COLUMN  — full width on mobile/tablet, ~75vw on desktop
        ──────────────────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">

          {/* ── Mobile / Tablet contact accordion (hidden on lg+) ──────── */}
          <div className="lg:hidden flex-shrink-0 border-b border-zinc-800/60">

            {/* Collapsed summary pill */}
            <button
              onClick={() => setCardExpanded(o => !o)}
              aria-expanded={cardExpanded}
              className="w-full flex items-center gap-3 px-4 py-3
                         bg-zinc-950 hover:bg-zinc-900/70 transition-colors"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0
                              ring-2 ring-violet-500/40 bg-zinc-800">
                {contactProps.avatarUrl ? (
                  <img
                    src={contactProps.avatarUrl}
                    alt={contactProps.name}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center
                                  bg-gradient-to-br from-violet-900 to-indigo-900
                                  text-white text-xs font-bold">
                    {contactProps.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || '?'}
                  </div>
                )}
              </div>

              {/* Name / meta */}
              <div className="flex-1 text-left min-w-0">
                <p className="text-white text-sm font-semibold truncate leading-snug">
                  {contactProps.name}
                </p>
                <p className="text-zinc-500 text-xs truncate">
                  {contactProps.email || `@${contactProps.handle}`}
                </p>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {files && (
                  <span className="text-xs font-medium text-zinc-400
                                   bg-zinc-800 rounded-full px-2.5 py-0.5">
                    {files.length} files
                  </span>
                )}
                {timeLeft && (
                  <span className="text-xs font-semibold text-amber-400
                                   bg-amber-500/10 rounded-full px-2.5 py-0.5 tabular-nums">
                    {timeLeft}
                  </span>
                )}
                {cardExpanded
                  ? <ChevronUp   size={15} className="text-zinc-500" />
                  : <ChevronDown size={15} className="text-zinc-500" />
                }
              </div>
            </button>

            {/* Expanded ContactCard */}
            <div className={`
              overflow-hidden transition-all duration-300 ease-in-out
              ${cardExpanded ? 'max-h-[760px] opacity-100' : 'max-h-0 opacity-0'}
            `}>
              <div className="px-4 pt-2 pb-5 bg-zinc-950/90">
                <ContactCard
                  {...contactProps}
                  enableTilt={false}
                  behindGlowEnabled
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* ── Scrollable gallery area ─────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {files ? (
              <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-7">

                {/* Gallery header bar */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-violet-600/15
                                    border border-violet-500/20
                                    flex items-center justify-center">
                      <Images size={15} className="text-violet-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold leading-none">
                        {shareData?.title || 'Shared Gallery'}
                      </p>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        {files.length} {files.length === 1 ? 'file' : 'files'} · shared with you
                      </p>
                    </div>
                  </div>

                  {/* Download shortcut inline */}
                  <button
                    onClick={downloadAll}
                    disabled={downloading}
                    className="lg:hidden flex items-center gap-1.5 px-3 py-1.5
                               bg-zinc-800 hover:bg-zinc-700
                               disabled:opacity-50 disabled:cursor-not-allowed
                               rounded-lg text-xs font-medium text-zinc-300
                               transition-colors"
                  >
                    {downloading
                      ? <Loader2 size={12} className="animate-spin" />
                      : <Download size={12} />
                    }
                    {downloading ? 'Saving…' : 'Download'}
                  </button>
                </div>

                {/* THE GRID — uses every pixel of available width */}
                <MasonryGrid files={files} />
              </div>
            ) : (
              /* Pre-unlock placeholder */
              <div className="flex flex-col items-center justify-center
                              h-full min-h-[50vh] gap-5 px-6">
                <div className="w-20 h-20 rounded-3xl bg-zinc-900
                                border border-zinc-800
                                flex items-center justify-center">
                  <Camera size={30} className="text-zinc-600" />
                </div>
                <div className="text-center space-y-1.5">
                  <p className="text-zinc-300 text-sm font-semibold">Gallery locked</p>
                  <p className="text-zinc-600 text-xs">
                    Enter the PIN to unlock and view the files
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* ────────────────────────────────────────────────────────────────
            RIGHT PANEL  —  desktop only (lg+)
            Sticky, independent scroll, never compresses the gallery
        ──────────────────────────────────────────────────────────────── */}
        <aside
          className="
            hidden lg:flex flex-col flex-shrink-0
            w-[300px] xl:w-[340px] 2xl:w-[360px]
            border-l border-white/[0.05]
            bg-zinc-950
            overflow-y-auto overscroll-contain
          "
        >
          {/* Panel label */}
          <div className="flex-shrink-0 px-5 pt-5 pb-3">
            <p className="text-[10px] font-bold tracking-[0.15em]
                          text-zinc-600 uppercase">
              Shared by
            </p>
          </div>

          {/* ContactCard */}
          <div className="px-4 pb-4">
            <ContactCard
              {...contactProps}
              enableTilt
              behindGlowEnabled
              className="w-full"
            />
          </div>

          {/* Divider */}
          <div className="mx-4 border-t border-zinc-800/60" />

          {/* Gallery meta */}
          {files && (
            <div className="px-4 py-4 space-y-3">
              <p className="text-[10px] font-bold tracking-[0.15em]
                            text-zinc-600 uppercase">
                Gallery Info
              </p>

              {/* Stat row */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Files',   value: files.length,              color: 'text-white'       },
                  { label: 'Expires', value: timeLeft || '—',           color: 'text-amber-400'   },
                  { label: 'Status',  value: timeLeft ? 'Active' : 'Exp', color: 'text-emerald-400' },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-1 py-3
                               bg-zinc-900/60 rounded-xl
                               border border-zinc-800/60"
                  >
                    <span className={`text-sm font-bold tabular-nums ${color}`}>
                      {value}
                    </span>
                    <span className="text-[10px] text-zinc-600 uppercase tracking-wider">
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Detail rows */}
              {shareData?.title && (
                <div className="flex justify-between items-start
                                text-sm py-2.5 border-b border-zinc-800/50 gap-4">
                  <span className="text-zinc-500 flex-shrink-0">Title</span>
                  <span className="text-white font-medium text-right break-words">
                    {shareData.title}
                  </span>
                </div>
              )}

              {owner?.email && (
                <div className="flex justify-between items-center
                                text-sm py-2.5 border-b border-zinc-800/50">
                  <span className="text-zinc-500">Contact</span>
                  <a
                    href={`mailto:${owner.email}`}
                    className="text-violet-400 hover:text-violet-300
                               text-xs font-medium truncate max-w-[160px]
                               transition-colors"
                  >
                    {owner.email}
                  </a>
                </div>
              )}

              {expiresAt && (
                <div className="flex justify-between items-center text-sm py-2.5">
                  <span className="text-zinc-500">Link expires</span>
                  <span className={`font-semibold tabular-nums text-xs ${
                    timeLeft ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {timeLeft || 'Expired'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Branding footer */}
          <div className="mt-auto px-5 py-4 border-t border-zinc-800/40
                          flex items-center gap-2">
            <div className="w-5 h-5 bg-violet-600 rounded-md
                            flex items-center justify-center">
              <Camera size={11} className="text-white" />
            </div>
            <span className="text-xs text-zinc-600 font-medium">
              Powered by <span className="text-zinc-500">FrameDrop</span>
            </span>
          </div>
        </aside>

      </div>{/* end body */}

      {/* PIN Modal */}
      <PinModal
        isOpen={pinOpen}
        onSubmit={handlePin}
        onClose={() => {}}
        loading={pinLoading}
        error={pinError}
      />
    </div>
  );
}