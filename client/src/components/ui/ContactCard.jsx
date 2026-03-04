import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { safeAvatarUrl } from '../../lib/avatarUrl';

// ── Constants ──────────────────────────────────────────────────────────────
const ANIMATION_CONFIG = {
  INITIAL_DURATION:    1000,
  INITIAL_X_OFFSET:    60,
  INITIAL_Y_OFFSET:    50,
  ENTER_TRANSITION_MS: 180,
};

const clamp  = (v, min = 0, max = 100) => Math.min(Math.max(v, min), max);
const round  = (v, p = 3)              => parseFloat(v.toFixed(p));
const adjust = (v, fMin, fMax, tMin, tMax) =>
  round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin));

// ── Inject keyframes once ──────────────────────────────────────────────────
const KF_ID = 'cc-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(KF_ID)) {
  const s = document.createElement('style');
  s.id = KF_ID;
  s.textContent = `
    @keyframes cc-glare-sweep {
      0%   { transform: translate3d(-120%,-60%,2px) rotate(-25deg); opacity: 0;   }
      25%  { opacity: 0.55; }
      50%  { transform: translate3d( 120%, 60%,2px) rotate(-25deg); opacity: 0.5; }
      75%  { opacity: 0.25; }
      100% { transform: translate3d(-120%,-60%,2px) rotate(-25deg); opacity: 0;   }
    }
    @keyframes cc-fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0);    }
    }
    @keyframes cc-dot-pulse {
      0%, 100% { box-shadow: 0 0 0 0   rgba(74,222,128,0.8); }
      50%       { box-shadow: 0 0 0 5px rgba(74,222,128,0);   }
    }
  `;
  document.head.appendChild(s);
}

// ── Helpers ────────────────────────────────────────────────────────────────
function InitialsAvatar({ name = '', size = 80 }) {
  const initials =
    name.split(' ').map(n => n[0] ?? '').join('').toUpperCase().slice(0, 2) || '?';
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #3b1f6a 0%, #1a1a4e 100%)',
      fontSize: size * 0.32, fontWeight: 700,
      color: 'rgba(255,255,255,0.9)', fontFamily: 'system-ui, sans-serif',
      userSelect: 'none', letterSpacing: '-0.02em',
    }}>
      {initials}
    </div>
  );
}

function MiniInitials({ name = '' }) {
  const initials =
    name.split(' ').map(n => n[0] ?? '').join('').toUpperCase().slice(0, 2) || '?';
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #3b1f6a, #1a1a4e)',
      fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)',
    }}>
      {initials}
    </div>
  );
}

function StatPill({ label, value, color = 'rgba(255,255,255,0.8)' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 3, padding: '6px 10px',
      background: 'rgba(255,255,255,0.05)',
      borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', flex: 1,
    }}>
      <span style={{ fontSize: '0.95rem', fontWeight: 700, color, lineHeight: 1 }}>
        {value ?? '—'}
      </span>
      <span style={{
        fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1,
        whiteSpace: 'nowrap', letterSpacing: '0.05em', textTransform: 'uppercase',
      }}>
        {label}
      </span>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      <span style={{ fontSize: '0.75rem', opacity: 0.4, flexShrink: 0, width: 16 }}>{icon}</span>
      <span style={{
        fontSize: '0.67rem', color: 'rgba(255,255,255,0.35)',
        flexShrink: 0, minWidth: 38, letterSpacing: '0.02em',
      }}>
        {label}
      </span>
      <span style={{
        fontSize: '0.7rem', color: 'rgba(255,255,255,0.82)', fontWeight: 500,
        overflow: 'hidden', textOverflow: 'ellipsis',
        whiteSpace: 'nowrap', flex: 1, textAlign: 'right',
      }}>
        {value}
      </span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
const ContactCardComponent = ({
  name         = 'Photographer',
  handle       = '',
  email        = '',
  role         = 'Photographer',
  avatarUrl    = '',
  isAdmin      = false,
  shareTitle   = '',
  shareCount   = 0,
  activeShares = 0,
  expiresAt    = null,
  createdAt    = null,
  photoCount   = 0,
  className         = '',
  enableTilt        = true,
  behindGlowEnabled = true,
  behindGlowColor,
  onViewGallery,
  onContact,
  contactText       = 'Contact',
  showStats         = true,
  showInfoRows      = true,
}) => {
  const wrapRef       = useRef(null);
  const shellRef      = useRef(null);
  const cardRef       = useRef(null);
  const enterTimerRef = useRef(null);
  const leaveRafRef   = useRef(null);

  // ── Safe avatar URL with fallback state ──────────────────────────────
  const [mainImgFailed, setMainImgFailed] = React.useState(false);
  const [miniImgFailed, setMiniImgFailed] = React.useState(false);

  React.useEffect(() => { setMainImgFailed(false); }, [avatarUrl]);

  const safeMain  = safeAvatarUrl(avatarUrl);
  const hasAvatar = Boolean(safeMain) && !mainImgFailed;
  const hasMini   = Boolean(safeMain) && !miniImgFailed;

  // ── Tilt engine ────────────────────────────────────────────────────────
  const tiltEngine = useMemo(() => {
    if (!enableTilt) return null;
    let rafId = null, running = false, lastTs = 0;
    let cx = 0, cy = 0, tx = 0, ty = 0;
    const TAU = 0.13, ITAU = 0.55;
    let initUntil = 0;

    const setVars = (x, y) => {
      const shell = shellRef.current, wrap = wrapRef.current;
      if (!shell || !wrap) return;
      const w  = shell.clientWidth  || 1;
      const h  = shell.clientHeight || 1;
      const px = clamp((100 / w) * x);
      const py = clamp((100 / h) * y);
      const props = {
        '--pointer-x':           `${px}%`,
        '--pointer-y':           `${py}%`,
        '--background-x':        `${adjust(px, 0, 100, 35, 65)}%`,
        '--background-y':        `${adjust(py, 0, 100, 35, 65)}%`,
        '--pointer-from-center': `${clamp(Math.hypot(py - 50, px - 50) / 50, 0, 1)}`,
        '--pointer-from-top':    `${py / 100}`,
        '--pointer-from-left':   `${px / 100}`,
        '--rotate-x':            `${round(-((px - 50) / 5))}deg`,
        '--rotate-y':            `${round((py - 50) / 4)}deg`,
      };
      for (const [k, v] of Object.entries(props)) wrap.style.setProperty(k, v);
    };

    const step = (ts) => {
      if (!running) return;
      if (lastTs === 0) lastTs = ts;
      const dt = (ts - lastTs) / 1000; lastTs = ts;
      const k  = 1 - Math.exp(-dt / (ts < initUntil ? ITAU : TAU));
      cx += (tx - cx) * k; cy += (ty - cy) * k;
      setVars(cx, cy);
      const far = Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05;
      if (far || document.hasFocus()) { rafId = requestAnimationFrame(step); }
      else { running = false; lastTs = 0; if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }
    };

    const start = () => {
      if (running) return; running = true; lastTs = 0;
      rafId = requestAnimationFrame(step);
    };

    return {
      setImmediate(x, y) { cx = x; cy = y; setVars(x, y); },
      setTarget(x, y)    { tx = x; ty = y; start(); },
      toCenter() {
        const s = shellRef.current;
        if (s) this.setTarget(s.clientWidth / 2, s.clientHeight / 2);
      },
      beginInitial(ms) { initUntil = performance.now() + ms; start(); },
      getCurrent()     { return { x: cx, y: cy, tx, ty }; },
      cancel() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null; running = false; lastTs = 0;
      },
    };
  }, [enableTilt]);

  // ── Pointer events ─────────────────────────────────────────────────────
  const offs = (e, el) => {
    const r = el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onEnter = useCallback((e) => {
    const shell = shellRef.current, card = cardRef.current;
    if (!shell || !tiltEngine) return;
    shell.classList.add('active', 'entering');
    if (card) card.style.transition = 'none';
    if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    enterTimerRef.current = setTimeout(
      () => shell.classList.remove('entering'),
      ANIMATION_CONFIG.ENTER_TRANSITION_MS
    );
    const { x, y } = offs(e, shell); tiltEngine.setTarget(x, y);
  }, [tiltEngine]);

  const onMove = useCallback((e) => {
    const shell = shellRef.current, card = cardRef.current;
    if (!shell || !tiltEngine) return;
    if (card)
      card.style.transform = 'translateZ(0) rotateX(var(--rotate-y)) rotateY(var(--rotate-x))';
    const { x, y } = offs(e, shell); tiltEngine.setTarget(x, y);
  }, [tiltEngine]);

  const onLeave = useCallback(() => {
    const shell = shellRef.current, card = cardRef.current;
    if (!shell || !tiltEngine) return;
    if (card) {
      card.style.transition = shell.classList.contains('entering')
        ? 'transform 180ms ease-out'
        : 'transform 1s ease';
      card.style.transform = 'translateZ(0) rotateX(0deg) rotateY(0deg)';
    }
    tiltEngine.toCenter();
    const check = () => {
      const { x, y, tx: ttx, ty: tty } = tiltEngine.getCurrent();
      if (Math.hypot(ttx - x, tty - y) < 0.6) {
        shell.classList.remove('active'); leaveRafRef.current = null;
      } else {
        leaveRafRef.current = requestAnimationFrame(check);
      }
    };
    if (leaveRafRef.current) cancelAnimationFrame(leaveRafRef.current);
    leaveRafRef.current = requestAnimationFrame(check);
  }, [tiltEngine]);

  useEffect(() => {
    if (!enableTilt || !tiltEngine) return;
    const shell = shellRef.current;
    if (!shell) return;
    shell.addEventListener('pointerenter', onEnter);
    shell.addEventListener('pointermove',  onMove);
    shell.addEventListener('pointerleave', onLeave);
    const ix = (shell.clientWidth || 0) - ANIMATION_CONFIG.INITIAL_X_OFFSET;
    tiltEngine.setImmediate(ix, ANIMATION_CONFIG.INITIAL_Y_OFFSET);
    tiltEngine.toCenter();
    tiltEngine.beginInitial(ANIMATION_CONFIG.INITIAL_DURATION);
    return () => {
      shell.removeEventListener('pointerenter', onEnter);
      shell.removeEventListener('pointermove',  onMove);
      shell.removeEventListener('pointerleave', onLeave);
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
      if (leaveRafRef.current)   cancelAnimationFrame(leaveRafRef.current);
      tiltEngine.cancel();
      shell.classList.remove('entering', 'active');
    };
  }, [enableTilt, tiltEngine, onEnter, onMove, onLeave]);

  // ── Derived values ─────────────────────────────────────────────────────
  const displayHandle = handle || email?.split('@')[0] || 'user';
  const displayRole   = isAdmin ? 'Administrator' : role;
  const accentColor   = isAdmin ? '#fb923c'               : '#a78bfa';
  const accentDim     = isAdmin ? 'rgba(251,146,60,0.28)' : 'rgba(139,92,246,0.28)';
  const accentBorder  = isAdmin ? 'rgba(251,146,60,0.45)' : 'rgba(139,92,246,0.45)';
  const glowColor     = behindGlowColor ?? (isAdmin
    ? 'rgba(251,146,60,0.4)'
    : 'rgba(139,92,246,0.4)');
  const CARD_RADIUS   = '22px';

  const wrapStyle = {
    '--pointer-x': '50%', '--pointer-y': '50%',
    '--pointer-from-center': '0', '--pointer-from-top': '0.5',
    '--pointer-from-left': '0.5', '--rotate-x': '0deg',
    '--rotate-y': '0deg', '--background-x': '50%', '--background-y': '50%',
  };

  const fmtDate = (d) => {
    if (!d) return null;
    const dt = new Date(d);
    return isNaN(dt) ? null
      : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isExpired   = expiresAt ? new Date(expiresAt) <= new Date() : false;
  const expireLabel = expiresAt
    ? (isExpired ? `Expired ${fmtDate(expiresAt)}` : `Expires ${fmtDate(expiresAt)}`)
    : null;

  return (
    <div
      ref={wrapRef}
      className={`relative touch-none select-none ${className}`.trim()}
      style={{
        perspective: '600px', transform: 'translate3d(0,0,0.1px)',
        width: '100%', ...wrapStyle,
      }}
    >
      {/* Behind glow */}
      {behindGlowEnabled && (
        <div aria-hidden="true" style={{
          position: 'absolute', inset: '-28px', zIndex: 0, pointerEvents: 'none',
          background: `radial-gradient(circle at var(--pointer-x) var(--pointer-y),
                        ${glowColor} 0%, transparent 65%)`,
          filter: 'blur(55px) saturate(1.4)', opacity: 0.85, borderRadius: CARD_RADIUS,
        }} />
      )}

      <div ref={shellRef} style={{ position: 'relative', zIndex: 1 }}>
        <div
          ref={cardRef}
          style={{
            position: 'relative', width: '100%', borderRadius: CARD_RADIUS,
            transform: 'translateZ(0) rotateX(0deg) rotateY(0deg)',
            transition: 'transform 1s ease, box-shadow 0.4s ease',
            willChange: 'transform', overflow: 'hidden',
            animation: 'cc-fade-in 0.4s ease-out both',
            background: 'linear-gradient(160deg, #0f0620 0%, #0a0a1a 55%, #060610 100%)',
            boxShadow: `
              0 28px 65px rgba(0,0,0,0.65),
              0 0 0 1px rgba(255,255,255,0.07),
              rgba(0,0,0,0.5)
              calc((var(--pointer-from-left) * 14px) - 5px)
              calc((var(--pointer-from-top)  * 28px) - 10px)
              28px -8px
            `,
            display: 'flex', flexDirection: 'column',
          }}
        >
          {/* ══════════════════════════════════════════════════════
              TOP — avatar photo
          ══════════════════════════════════════════════════════ */}
          <div style={{
            position: 'relative', height: 220, flexShrink: 0,
            overflow: 'hidden', borderRadius: `${CARD_RADIUS} ${CARD_RADIUS} 0 0`,
          }}>
            {hasAvatar ? (
              <img
                src={safeMain}
                alt={`${name} avatar`}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setMainImgFailed(true)}
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%',
                  objectFit: 'cover', objectPosition: 'center',
                  display: 'block', mixBlendMode: 'normal', filter: 'none',
                  transform: `
                    translateX(calc((var(--pointer-from-left) - 0.5) * 8px))
                    translateY(calc((var(--pointer-from-top)  - 0.5) * 5px))
                    translateZ(0)
                  `,
                  transition: 'transform 120ms ease-out', willChange: 'transform',
                }}
              />
            ) : (
              <InitialsAvatar name={name} size={100} />
            )}

            {/* Fade overlay */}
            <div aria-hidden="true" style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
              background: 'linear-gradient(to top, rgba(8,4,20,0.95) 0%, rgba(8,4,20,0.4) 60%, transparent 100%)',
              pointerEvents: 'none',
            }} />

            {/* Vignette */}
            <div aria-hidden="true" style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: `radial-gradient(ellipse at center,
                transparent 45%, rgba(0,0,0,0.12) 70%, rgba(0,0,0,0.4) 100%)`,
            }} />

            {/* Accent stripe */}
            <div aria-hidden="true" style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              height: 3, pointerEvents: 'none',
              background: `linear-gradient(90deg,
                transparent 0%, ${accentColor} 35%, ${accentColor} 65%, transparent 100%)`,
              opacity: 0.9,
            }} />

            {/* Role badge */}
            <div style={{
              position: 'absolute', top: 12, right: 12,
              padding: '3px 10px', borderRadius: 20,
              background: accentDim, border: `1px solid ${accentBorder}`,
              fontSize: '0.6rem', fontWeight: 700, color: accentColor,
              letterSpacing: '0.07em', textTransform: 'uppercase',
              backdropFilter: 'blur(10px)', whiteSpace: 'nowrap',
            }}>
              {displayRole}
            </div>

            {/* Name + handle */}
            <div style={{
              position: 'absolute', bottom: 12, left: 14, right: 14,
              pointerEvents: 'none',
            }}>
              <h3 style={{
                margin: 0, fontSize: 'clamp(1rem, 4vw, 1.18rem)',
                fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2,
                backgroundImage: 'linear-gradient(to bottom, #ffffff 0%, #d4bcff 100%)',
                backgroundClip: 'text', WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.9))',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {name}
              </h3>
              <p style={{
                margin: '3px 0 0', fontSize: '0.7rem',
                color: accentColor, fontWeight: 500, opacity: 0.95,
                filter: 'drop-shadow(0 1px 5px rgba(0,0,0,0.8))',
              }}>
                @{displayHandle}
              </p>
            </div>

            {/* Glass shine */}
            <div aria-hidden="true" style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              overflow: 'hidden', borderRadius: `${CARD_RADIUS} ${CARD_RADIUS} 0 0`,
            }}>
              <div style={{
                position: 'absolute', inset: 0, mixBlendMode: 'screen',
                background: `radial-gradient(
                  ellipse 55% 45% at var(--pointer-x) var(--pointer-y),
                  rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 45%, transparent 70%
                )`,
              }} />
              <div style={{
                position: 'absolute', top: '-20%', left: '-60%',
                width: '38%', height: '140%',
                background: 'linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.14) 50%, transparent 75%)',
                animation: 'cc-glare-sweep 7s ease-in-out infinite', mixBlendMode: 'screen',
              }} />
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              BOTTOM — info panel
          ══════════════════════════════════════════════════════ */}
          <div style={{
            flex: 1, padding: '14px',
            background: 'linear-gradient(to bottom, rgba(8,4,20,0.98) 0%, rgba(10,5,25,1) 100%)',
            borderRadius: `0 0 ${CARD_RADIUS} ${CARD_RADIUS}`,
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            {/* Stats */}
            {showStats && (
              <div style={{ display: 'flex', gap: 6 }}>
                <StatPill label="Photos"  value={photoCount}   color="rgba(255,255,255,0.85)" />
                <StatPill label="Shares"  value={shareCount}   color={accentColor} />
                <StatPill label="Active"  value={activeShares} color="#4ade80" />
              </div>
            )}

            {/* Glass info panel */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, padding: '10px 12px',
              display: 'flex', flexDirection: 'column', gap: 0,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
            }}>
              {/* Mini avatar row */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                paddingBottom: 9, marginBottom: 8,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  overflow: 'hidden', flexShrink: 0,
                  border: `2px solid ${accentBorder}`, background: '#1a0a2e',
                }}>
                  {hasMini ? (
                    <img
                      src={safeMain}
                      alt={name}
                      referrerPolicy="no-referrer"
                      onError={() => setMiniImgFailed(true)}
                      style={{
                        width: '100%', height: '100%',
                        objectFit: 'cover', display: 'block',
                        mixBlendMode: 'normal', filter: 'none',
                      }}
                    />
                  ) : (
                    <MiniInitials name={name} />
                  )}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{
                    margin: 0, fontSize: '0.7rem',
                    color: 'rgba(255,255,255,0.8)', fontWeight: 500,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {email || '—'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#4ade80', flexShrink: 0,
                      animation: 'cc-dot-pulse 2s ease-in-out infinite',
                    }} />
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
                      Online
                    </span>
                  </div>
                </div>
              </div>

              {/* Info rows */}
              {showInfoRows && (
                <>
                  <InfoRow icon="🎭" label="Role"    value={displayRole} />
                  <InfoRow icon="📅" label="Joined"  value={fmtDate(createdAt)} />
                  {shareTitle && <InfoRow icon="🖼️" label="Gallery" value={shareTitle} />}
                  {expireLabel && (
                    <InfoRow
                      icon={isExpired ? '⛔' : '⏳'}
                      label="Access"
                      value={expireLabel}
                    />
                  )}
                </>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              {onContact && (
                <button
                  type="button" onClick={onContact}
                  aria-label={`Contact ${name}`}
                  style={{
                    flex: 1, padding: '9px 12px',
                    fontSize: '0.73rem', fontWeight: 600,
                    color: 'rgba(255,255,255,0.92)',
                    background: accentDim, border: `1px solid ${accentBorder}`,
                    borderRadius: 10, cursor: 'pointer',
                    transition: 'all 0.2s ease', backdropFilter: 'blur(8px)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = accentDim.replace('0.28', '0.52');
                    e.currentTarget.style.transform  = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow  = `0 6px 20px ${accentDim}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = accentDim;
                    e.currentTarget.style.transform  = 'translateY(0)';
                    e.currentTarget.style.boxShadow  = 'none';
                  }}
                >
                  {contactText}
                </button>
              )}
              {onViewGallery && (
                <button
                  type="button" onClick={onViewGallery}
                  aria-label={`View ${name}'s gallery`}
                  style={{
                    flex: onContact ? 1 : undefined,
                    padding: '9px 14px', fontSize: '0.73rem', fontWeight: 600,
                    color: 'rgba(255,255,255,0.85)',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, cursor: 'pointer',
                    transition: 'all 0.2s ease', backdropFilter: 'blur(8px)',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.11)';
                    e.currentTarget.style.transform  = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.transform  = 'translateY(0)';
                  }}
                >
                  View Gallery
                </button>
              )}
            </div>
          </div>

          {/* Rim border */}
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0, borderRadius: CARD_RADIUS,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)',
            mixBlendMode: 'screen', pointerEvents: 'none', zIndex: 10,
          }} />
        </div>
      </div>
    </div>
  );
};

const ContactCard = React.memo(ContactCardComponent);
export default ContactCard;