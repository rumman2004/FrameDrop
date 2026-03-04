import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { safeAvatarUrl } from '../../lib/avatarUrl';

// ── Constants ──────────────────────────────────────────────────────────────
const DEFAULT_INNER_GRADIENT =
  'linear-gradient(145deg, #1a0a2e99 0%, #0d1f3c88 50%, #0a0a1a66 100%)';

const ANIMATION_CONFIG = {
  INITIAL_DURATION:    1200,
  INITIAL_X_OFFSET:    70,
  INITIAL_Y_OFFSET:    60,
  DEVICE_BETA_OFFSET:  20,
  ENTER_TRANSITION_MS: 180,
};

const clamp  = (v, min = 0, max = 100) => Math.min(Math.max(v, min), max);
const round  = (v, precision = 3)      => parseFloat(v.toFixed(precision));
const adjust = (v, fMin, fMax, tMin, tMax) =>
  round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin));

// ── Inject keyframes once ──────────────────────────────────────────────────
const KEYFRAMES_ID = 'pc-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(KEYFRAMES_ID)) {
  const style = document.createElement('style');
  style.id = KEYFRAMES_ID;
  style.textContent = `
    @keyframes pc-glare-move {
      0%   { opacity: 0.0; transform: translate3d(-60%,-60%,2px) rotate(-20deg) scaleX(0.5); }
      30%  { opacity: 0.55; }
      50%  { opacity: 0.7;  transform: translate3d(60%, 60%,2px) rotate(-20deg) scaleX(0.5); }
      80%  { opacity: 0.45; }
      100% { opacity: 0.0;  transform: translate3d(-60%,-60%,2px) rotate(-20deg) scaleX(0.5); }
    }
    @keyframes pc-shimmer {
      0%   { background-position: -200% center; }
      100% { background-position:  200% center; }
    }
  `;
  document.head.appendChild(style);
}

// ── Initials fallback ──────────────────────────────────────────────────────
function InitialsAvatar({ name, size = 120 }) {
  const initials =
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #3b1f6a 0%, #1a1a4e 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700,
      color: 'rgba(255,255,255,0.88)', fontFamily: 'system-ui, sans-serif',
      userSelect: 'none', flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
const ProfileCardComponent = ({
  avatarUrl             = '',
  iconUrl               = '',
  grainUrl              = '',
  innerGradient,
  behindGlowEnabled     = true,
  behindGlowColor,
  behindGlowSize,
  className             = '',
  enableTilt            = true,
  enableMobileTilt      = false,
  mobileTiltSensitivity = 5,
  miniAvatarUrl,
  name                  = 'User',
  title                 = 'Photographer',
  handle                = 'user',
  status                = 'Online',
  contactText           = 'Contact',
  showUserInfo          = true,
  onContactClick,
}) => {
  const wrapRef       = useRef(null);
  const shellRef      = useRef(null);
  const enterTimerRef = useRef(null);
  const leaveRafRef   = useRef(null);

  // ── Safe URLs — computed once per render ──────────────────────────────
  const [mainImgFailed, setMainImgFailed] = React.useState(false);
  const [miniImgFailed, setMiniImgFailed] = React.useState(false);

  // Reset failed flags when URLs change (e.g. after avatar upload)
  React.useEffect(() => { setMainImgFailed(false); }, [avatarUrl]);
  React.useEffect(() => { setMiniImgFailed(false); }, [miniAvatarUrl]);

  const safeMain = safeAvatarUrl(avatarUrl);
  const safeMini = safeAvatarUrl(miniAvatarUrl) ?? safeMain;

  const hasAvatar     = Boolean(safeMain) && !mainImgFailed;
  const hasMiniAvatar = Boolean(safeMini) && !miniImgFailed;

  // ── Tilt engine ────────────────────────────────────────────────────────
  const tiltEngine = useMemo(() => {
    if (!enableTilt) return null;

    let rafId = null, running = false, lastTs = 0;
    let currentX = 0, currentY = 0, targetX = 0, targetY = 0;
    const DEFAULT_TAU = 0.14, INITIAL_TAU = 0.6;
    let initialUntil = 0;

    const setVarsFromXY = (x, y) => {
      const shell = shellRef.current;
      const wrap  = wrapRef.current;
      if (!shell || !wrap) return;
      const w        = shell.clientWidth  || 1;
      const h        = shell.clientHeight || 1;
      const percentX = clamp((100 / w) * x);
      const percentY = clamp((100 / h) * y);
      const centerX  = percentX - 50;
      const centerY  = percentY - 50;
      const props = {
        '--pointer-x':           `${percentX}%`,
        '--pointer-y':           `${percentY}%`,
        '--background-x':        `${adjust(percentX, 0, 100, 35, 65)}%`,
        '--background-y':        `${adjust(percentY, 0, 100, 35, 65)}%`,
        '--pointer-from-center': `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`,
        '--pointer-from-top':    `${percentY / 100}`,
        '--pointer-from-left':   `${percentX / 100}`,
        '--rotate-x':            `${round(-(centerX / 5))}deg`,
        '--rotate-y':            `${round(centerY / 4)}deg`,
      };
      for (const [k, v] of Object.entries(props)) wrap.style.setProperty(k, v);
    };

    const step = (ts) => {
      if (!running) return;
      if (lastTs === 0) lastTs = ts;
      const dt  = (ts - lastTs) / 1000;
      lastTs    = ts;
      const tau = ts < initialUntil ? INITIAL_TAU : DEFAULT_TAU;
      const k   = 1 - Math.exp(-dt / tau);
      currentX += (targetX - currentX) * k;
      currentY += (targetY - currentY) * k;
      setVarsFromXY(currentX, currentY);
      const stillFar =
        Math.abs(targetX - currentX) > 0.05 ||
        Math.abs(targetY - currentY) > 0.05;
      if (stillFar || document.hasFocus()) {
        rafId = requestAnimationFrame(step);
      } else {
        running = false; lastTs = 0;
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      }
    };

    const start = () => {
      if (running) return;
      running = true; lastTs = 0;
      rafId = requestAnimationFrame(step);
    };

    return {
      setImmediate(x, y) { currentX = x; currentY = y; setVarsFromXY(x, y); },
      setTarget(x, y)    { targetX  = x; targetY  = y; start(); },
      toCenter() {
        const shell = shellRef.current;
        if (shell) this.setTarget(shell.clientWidth / 2, shell.clientHeight / 2);
      },
      beginInitial(ms) { initialUntil = performance.now() + ms; start(); },
      getCurrent()     { return { x: currentX, y: currentY, tx: targetX, ty: targetY }; },
      cancel() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null; running = false; lastTs = 0;
      },
    };
  }, [enableTilt]);

  // ── Event handlers ─────────────────────────────────────────────────────
  const getOffsets = (evt, el) => {
    const r = el.getBoundingClientRect();
    return { x: evt.clientX - r.left, y: evt.clientY - r.top };
  };

  const handlePointerMove = useCallback((e) => {
    const shell = shellRef.current;
    if (!shell || !tiltEngine) return;
    tiltEngine.setTarget(...Object.values(getOffsets(e, shell)));
  }, [tiltEngine]);

  const handlePointerEnter = useCallback((e) => {
    const shell = shellRef.current;
    if (!shell || !tiltEngine) return;
    shell.classList.add('active', 'entering');
    if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
    enterTimerRef.current = window.setTimeout(
      () => shell.classList.remove('entering'),
      ANIMATION_CONFIG.ENTER_TRANSITION_MS
    );
    const { x, y } = getOffsets(e, shell);
    tiltEngine.setTarget(x, y);
  }, [tiltEngine]);

  const handlePointerLeave = useCallback(() => {
    const shell = shellRef.current;
    if (!shell || !tiltEngine) return;
    tiltEngine.toCenter();
    const check = () => {
      const { x, y, tx, ty } = tiltEngine.getCurrent();
      if (Math.hypot(tx - x, ty - y) < 0.6) {
        shell.classList.remove('active');
        leaveRafRef.current = null;
      } else {
        leaveRafRef.current = requestAnimationFrame(check);
      }
    };
    if (leaveRafRef.current) cancelAnimationFrame(leaveRafRef.current);
    leaveRafRef.current = requestAnimationFrame(check);
  }, [tiltEngine]);

  const handleDeviceOrientation = useCallback((e) => {
    const shell = shellRef.current;
    if (!shell || !tiltEngine) return;
    const { beta, gamma } = e;
    if (beta == null || gamma == null) return;
    const cx = shell.clientWidth / 2, cy = shell.clientHeight / 2;
    tiltEngine.setTarget(
      clamp(cx + gamma * mobileTiltSensitivity, 0, shell.clientWidth),
      clamp(cy + (beta - ANIMATION_CONFIG.DEVICE_BETA_OFFSET) * mobileTiltSensitivity, 0, shell.clientHeight)
    );
  }, [tiltEngine, mobileTiltSensitivity]);

  useEffect(() => {
    if (!enableTilt || !tiltEngine) return;
    const shell = shellRef.current;
    if (!shell) return;

    shell.addEventListener('pointerenter', handlePointerEnter);
    shell.addEventListener('pointermove',  handlePointerMove);
    shell.addEventListener('pointerleave', handlePointerLeave);

    const handleClick = () => {
      if (!enableMobileTilt || location.protocol !== 'https:') return;
      const ME = window.DeviceMotionEvent;
      if (ME && typeof ME.requestPermission === 'function') {
        ME.requestPermission()
          .then((s) => {
            if (s === 'granted')
              window.addEventListener('deviceorientation', handleDeviceOrientation);
          })
          .catch(console.error);
      } else {
        window.addEventListener('deviceorientation', handleDeviceOrientation);
      }
    };
    shell.addEventListener('click', handleClick);

    const initX = (shell.clientWidth || 0) - ANIMATION_CONFIG.INITIAL_X_OFFSET;
    tiltEngine.setImmediate(initX, ANIMATION_CONFIG.INITIAL_Y_OFFSET);
    tiltEngine.toCenter();
    tiltEngine.beginInitial(ANIMATION_CONFIG.INITIAL_DURATION);

    return () => {
      shell.removeEventListener('pointerenter', handlePointerEnter);
      shell.removeEventListener('pointermove',  handlePointerMove);
      shell.removeEventListener('pointerleave', handlePointerLeave);
      shell.removeEventListener('click',        handleClick);
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
      if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
      if (leaveRafRef.current)   cancelAnimationFrame(leaveRafRef.current);
      tiltEngine.cancel();
      shell.classList.remove('entering', 'active');
    };
  }, [
    enableTilt, enableMobileTilt, tiltEngine,
    handlePointerMove, handlePointerEnter,
    handlePointerLeave, handleDeviceOrientation,
  ]);

  // ── Styles ─────────────────────────────────────────────────────────────
  const CARD_RADIUS = '24px';

  const cardStyle = useMemo(() => ({
    '--icon':              iconUrl  ? `url(${iconUrl})`  : 'none',
    '--grain':             grainUrl ? `url(${grainUrl})` : 'none',
    '--inner-gradient':    innerGradient ?? DEFAULT_INNER_GRADIENT,
    '--behind-glow-color': behindGlowColor ?? 'rgba(139,92,246,0.55)',
    '--behind-glow-size':  behindGlowSize  ?? '60%',
    '--pointer-x':           '50%',
    '--pointer-y':           '50%',
    '--pointer-from-center': '0',
    '--pointer-from-top':    '0.5',
    '--pointer-from-left':   '0.5',
    '--rotate-x':            '0deg',
    '--rotate-y':            '0deg',
    '--background-x':        '50%',
    '--background-y':        '50%',
    '--card-radius':         CARD_RADIUS,
  }), [iconUrl, grainUrl, innerGradient, behindGlowColor, behindGlowSize]);

  const handleContactClick = useCallback(() => onContactClick?.(), [onContactClick]);

  return (
    <div
      ref={wrapRef}
      className={`relative touch-none select-none ${className}`.trim()}
      style={{ perspective: '600px', transform: 'translate3d(0,0,0.1px)', width: '100%', ...cardStyle }}
    >
      {/* ── Behind glow ───────────────────────────────────────────── */}
      {behindGlowEnabled && (
        <div aria-hidden="true" style={{
          position: 'absolute', inset: '-20px', zIndex: 0, pointerEvents: 'none',
          background: `radial-gradient(circle at var(--pointer-x) var(--pointer-y),
                        var(--behind-glow-color) 0%, transparent var(--behind-glow-size))`,
          filter: 'blur(55px) saturate(1.3)', opacity: 0.85, borderRadius: CARD_RADIUS,
        }} />
      )}

      {/* ── Shell ─────────────────────────────────────────────────── */}
      <div ref={shellRef} style={{ position: 'relative', zIndex: 1 }}>
        <section
          style={{
            position: 'relative', overflow: 'hidden',
            width: '100%', maxWidth: '320px', height: '440px',
            margin: '0 auto', aspectRatio: '0.718', borderRadius: CARD_RADIUS,
            boxShadow: `
              0 30px 70px rgba(0,0,0,0.65),
              0 0 0 1px rgba(255,255,255,0.07),
              rgba(0,0,0,0.6)
              calc((var(--pointer-from-left) * 14px) - 5px)
              calc((var(--pointer-from-top)  * 28px) - 10px)
              28px -8px
            `,
            transition: 'transform 1s ease, box-shadow 0.4s ease',
            transform:  'translateZ(0) rotateX(0deg) rotateY(0deg)',
            background: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transition = 'none';
            e.currentTarget.style.transform  =
              'translateZ(0) rotateX(var(--rotate-y)) rotateY(var(--rotate-x))';
          }}
          onMouseLeave={(e) => {
            const entering = shellRef.current?.classList.contains('entering');
            e.currentTarget.style.transition = entering
              ? 'transform 180ms ease-out'
              : 'transform 1s ease';
            e.currentTarget.style.transform = 'translateZ(0) rotateX(0deg) rotateY(0deg)';
          }}
        >
          {/* ── Layer 0: Avatar ───────────────────────────────────── */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 1,
            borderRadius: CARD_RADIUS, overflow: 'hidden',
            background: 'linear-gradient(160deg, #1a0a2e 0%, #0d0d20 60%, #080810 100%)',
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
                  objectFit: 'cover', objectPosition: 'top center',
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
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <InitialsAvatar name={name} size={130} />
              </div>
            )}
          </div>

          {/* ── Layer 1: Vignette ─────────────────────────────────── */}
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0, zIndex: 2,
            borderRadius: CARD_RADIUS, pointerEvents: 'none',
            background: `radial-gradient(ellipse at center,
              transparent 40%, rgba(0,0,0,0.18) 70%, rgba(0,0,0,0.48) 100%)`,
          }} />

          {/* ── Layer 2: Top gradient ─────────────────────────────── */}
          <div aria-hidden="true" style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: '45%', zIndex: 3,
            borderRadius: `${CARD_RADIUS} ${CARD_RADIUS} 0 0`,
            pointerEvents: 'none',
            background: 'linear-gradient(to bottom, rgba(10,5,25,0.72) 0%, transparent 100%)',
          }} />

          {/* ── Layer 3: Bottom gradient ──────────────────────────── */}
          <div aria-hidden="true" style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '50%', zIndex: 3,
            borderRadius: `0 0 ${CARD_RADIUS} ${CARD_RADIUS}`,
            pointerEvents: 'none',
            background: 'linear-gradient(to top, rgba(8,4,20,0.82) 0%, rgba(8,4,20,0.3) 60%, transparent 100%)',
          }} />

          {/* ── Layer 4: Glass shine ──────────────────────────────── */}
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0, zIndex: 5,
            borderRadius: CARD_RADIUS, pointerEvents: 'none', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0, mixBlendMode: 'screen', pointerEvents: 'none',
              background: `radial-gradient(
                ellipse 60% 50% at var(--pointer-x) var(--pointer-y),
                rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.04) 40%, transparent 70%
              )`,
            }} />
            <div style={{
              position: 'absolute', top: '-20%', left: '-60%',
              width: '45%', height: '140%',
              background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)',
              transform: 'translate3d(-60%,-60%,2px) rotate(-20deg) scaleX(0.5)',
              animation: 'pc-glare-move 5s ease-in-out infinite',
              pointerEvents: 'none', mixBlendMode: 'screen',
            }} />
            <div style={{
              position: 'absolute', inset: 0, borderRadius: CARD_RADIUS,
              border: '1px solid rgba(255,255,255,0.12)',
              background: `linear-gradient(135deg,
                rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 40%,
                rgba(255,255,255,0.00) 60%, rgba(139,92,246,0.08) 100%
              )`,
              mixBlendMode: 'screen', pointerEvents: 'none',
            }} />
          </div>

          {/* ── Layer 5: Name + title ─────────────────────────────── */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            zIndex: 6, textAlign: 'center',
            padding: '24px 16px 0', pointerEvents: 'none',
            transform: `translate3d(
              calc((var(--pointer-from-left) - 0.5) * -5px),
              calc((var(--pointer-from-top)  - 0.5) * -5px),
              0.1px
            )`,
          }}>
            <h3 style={{
              margin: 0,
              fontSize: 'clamp(1.15rem, 3.5svh, 1.7rem)',
              fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2,
              backgroundImage: 'linear-gradient(to bottom, #ffffff 0%, #d4bcff 70%, #a78bfa 100%)',
              backgroundClip: 'text', WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.7))',
            }}>
              {name}
            </h3>
            <p style={{
              margin: '5px 0 0',
              fontSize: 'clamp(0.72rem, 1.8svh, 0.88rem)',
              fontWeight: 500, letterSpacing: '0.04em',
              backgroundImage: 'linear-gradient(to bottom, #c4b5fd 0%, #818cf8 100%)',
              backgroundClip: 'text', WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 1px 6px rgba(0,0,0,0.6))', opacity: 0.95,
            }}>
              {title}
            </p>
          </div>

          {/* ── Layer 6: User info bar ────────────────────────────── */}
          {showUserInfo && (
            <div style={{
              position: 'absolute', bottom: 14, left: 14, right: 14, zIndex: 7,
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: 10,
              background: 'rgba(8,4,22,0.52)',
              backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
              border: '1px solid rgba(255,255,255,0.11)',
              borderRadius: '14px', padding: '10px 12px',
              boxShadow: `
                0 4px 24px rgba(0,0,0,0.45),
                inset 0 1px 0 rgba(255,255,255,0.09),
                inset 0 -1px 0 rgba(0,0,0,0.2)
              `,
              pointerEvents: 'auto',
            }}>
              {/* Mini avatar + handle + status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  overflow: 'hidden',
                  border: '1.5px solid rgba(167,139,250,0.5)',
                  flexShrink: 0, background: '#1a0a2e',
                }}>
                  {hasMiniAvatar ? (
                    <img
                      src={safeMini}
                      alt={`${name} avatar`}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={() => setMiniImgFailed(true)}
                      style={{
                        width: '100%', height: '100%',
                        objectFit: 'cover', display: 'block',
                        mixBlendMode: 'normal', filter: 'none',
                      }}
                    />
                  ) : (
                    <InitialsAvatar name={name} size={38} />
                  )}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.78rem', fontWeight: 600,
                    color: 'rgba(255,255,255,0.93)', lineHeight: 1,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    @{handle}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#4ade80', flexShrink: 0,
                      boxShadow: '0 0 5px #4ade80aa',
                    }} />
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.52)', lineHeight: 1 }}>
                      {status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact button */}
              <button
                type="button"
                onClick={handleContactClick}
                aria-label={`Contact ${name}`}
                style={{
                  flexShrink: 0, padding: '7px 13px',
                  fontSize: '0.73rem', fontWeight: 600,
                  color: 'rgba(255,255,255,0.92)',
                  background: 'rgba(139,92,246,0.22)',
                  border: '1px solid rgba(139,92,246,0.38)',
                  borderRadius: '9px', cursor: 'pointer',
                  transition: 'all 0.2s ease', whiteSpace: 'nowrap',
                  backdropFilter: 'blur(8px)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background  = 'rgba(139,92,246,0.5)';
                  e.currentTarget.style.borderColor = 'rgba(139,92,246,0.75)';
                  e.currentTarget.style.transform   = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow   = '0 4px 16px rgba(139,92,246,0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background  = 'rgba(139,92,246,0.22)';
                  e.currentTarget.style.borderColor = 'rgba(139,92,246,0.38)';
                  e.currentTarget.style.transform   = 'translateY(0)';
                  e.currentTarget.style.boxShadow   = 'none';
                }}
              >
                {contactText}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const ProfileCard = React.memo(ProfileCardComponent);
export default ProfileCard;