import { useEffect, useRef, useState } from 'react';
import { getCardRatingColor, getRatingCardStyle, getRatingCardClass, getRatingTier } from './ratingUtils';
import { PlayerImage } from './PlayerImage';

// ── Per-type pack visual configs ─────────────────────────────────────────────
const PACK_CONFIGS = {
  starter: {
    label: 'STARTER', sub: 'PACK',
    bg: 'linear-gradient(160deg, #c47c08 0%, #f5d060 20%, #ffe88a 38%, #f0c030 52%, #fce870 65%, #d49010 80%, #a06008 100%)',
    border: 'rgba(255,255,255,0.45)',
    shadow: '0 0 0 1px rgba(200,140,20,0.4), 0 24px 64px rgba(180,120,0,0.55), 0 6px 20px rgba(0,0,0,0.5)',
    glow: 'rgba(247,200,60,0.5)',
    strip: 'linear-gradient(90deg, #704800 0%, #b87800 25%, #fcd050 50%, #b87800 75%, #704800 100%)',
    nameColor: '#1a0a00',
  },
  bronze: {
    label: 'BRONZE', sub: 'PACK',
    bg: 'linear-gradient(160deg, #3d1100 0%, #7c2d00 28%, #b84500 52%, #7c2d00 72%, #3d1100 100%)',
    border: 'rgba(255,160,80,0.4)',
    shadow: '0 0 0 1px rgba(180,80,20,0.35), 0 24px 64px rgba(100,30,0,0.65), 0 6px 20px rgba(0,0,0,0.5)',
    glow: 'rgba(180,80,20,0.5)',
    strip: 'linear-gradient(90deg, #2a0800 0%, #6b2000 30%, #b83800 50%, #6b2000 70%, #2a0800 100%)',
    nameColor: '#fff5ed',
  },
  silver: {
    label: 'SILVER', sub: 'PACK',
    bg: 'linear-gradient(160deg, #1e293b 0%, #3f5068 28%, #8899b0 50%, #3f5068 72%, #1e293b 100%)',
    border: 'rgba(200,220,240,0.35)',
    shadow: '0 0 0 1px rgba(80,100,130,0.3), 0 24px 64px rgba(20,30,50,0.7), 0 6px 20px rgba(0,0,0,0.5)',
    glow: 'rgba(100,130,160,0.5)',
    strip: 'linear-gradient(90deg, #0f172a 0%, #2d3f55 30%, #6080a0 50%, #2d3f55 70%, #0f172a 100%)',
    nameColor: '#e8f0f8',
  },
  gold: {
    label: 'GOLD', sub: 'PACK',
    bg: 'linear-gradient(160deg, #5c2800 0%, #a85000 22%, #e88820 38%, #ffd050 50%, #e88820 62%, #a85000 78%, #5c2800 100%)',
    border: 'rgba(255,220,80,0.55)',
    shadow: '0 0 0 1px rgba(220,150,20,0.45), 0 24px 64px rgba(140,60,0,0.65), 0 6px 20px rgba(0,0,0,0.5)',
    glow: 'rgba(255,180,30,0.55)',
    strip: 'linear-gradient(90deg, #3d1800 0%, #8a3800 25%, #e8a000 50%, #8a3800 75%, #3d1800 100%)',
    nameColor: '#1a0500',
  },
};

// ── Per-tier spotlight glow ───────────────────────────────────────────────────
const TIER_GLOW = {
  gold:    { ring: 'rgba(251,191,36,0.7)',  glow: '0 0 100px 30px rgba(251,191,36,0.6)'  },
  silver:  { ring: 'rgba(148,163,184,0.65)', glow: '0 0 90px 24px rgba(148,163,184,0.55)' },
  bronze:  { ring: 'rgba(180,83,9,0.65)',   glow: '0 0 90px 24px rgba(180,83,9,0.55)'   },
  unknown: { ring: 'rgba(100,140,100,0.5)', glow: '0 0 70px 18px rgba(100,140,100,0.45)' },
};

const STATS = ['pac', 'sho', 'pas', 'dri', 'def', 'phy'];

// ── Animated pack visual — accepts any pack type ──────────────────────────────
export function PackOpeningVisual({ type, opening }) {
  const cfg = PACK_CONFIGS[type] ?? PACK_CONFIGS.bronze;
  return (
    <div className={`ob-pack-wrapper${opening ? ' ob-pack-opening' : ''}`}>
      <div
        className="ob-pack-glow"
        style={{ background: `radial-gradient(ellipse at 50% 60%, ${cfg.glow} 0%, transparent 68%)` }}
      />
      <div
        className="ob-pack"
        style={{ background: cfg.bg, borderColor: cfg.border, boxShadow: cfg.shadow }}
      >
        <div className="ob-pack-sheen" />
        <div className="ob-pack-content">
          <div className="ob-pack-emblem">⚽</div>
          <div className="ob-pack-wordmark">
            <span className="ob-pack-name" style={{ color: cfg.nameColor }}>{cfg.label}</span>
            <span className="ob-pack-name-sub" style={{ color: cfg.nameColor, opacity: 0.68 }}>{cfg.sub}</span>
          </div>
        </div>
        <div className="ob-pack-bottom-strip" style={{ background: cfg.strip }} />
      </div>
    </div>
  );
}

// ── Spotlight card (rendered at scale inside BestCardSpotlight) ───────────────
function SpotlightCard({ player }) {
  const tier    = getRatingTier(player.rating);
  const glowCfg = TIER_GLOW[tier] ?? TIER_GLOW.unknown;
  return (
    <div className="spotlight-card-outer">
      <div className="spotlight-card-glow" style={{ boxShadow: glowCfg.glow, background: glowCfg.ring }} />
      <div
        className={`spotlight-inner-card ${getRatingCardClass(player.rating)}`}
        style={getRatingCardStyle(player.rating)}
      >
        <div className="spotlight-inner-header">
          <span className="spotlight-inner-rating" style={{ color: getCardRatingColor(player.rating) }}>
            {player.rating}
          </span>
          <span className="spotlight-inner-pos">{player.position}</span>
        </div>
        <PlayerImage player={player} className="pack-card-img" />
        <div className="spotlight-inner-name">{player.name}</div>
        <div className="spotlight-inner-meta">{player.club}</div>
        {player.stats && (
          <div className="spotlight-inner-stats">
            {STATS.map(s => (
              <div key={s} className="spotlight-inner-stat">
                <span className="spotlight-inner-stat-val">{player.stats[s]}</span>
                <span className="spotlight-inner-stat-key">{s.toUpperCase()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Best card spotlight overlay ───────────────────────────────────────────────
export function BestCardSpotlight({ players, onDone }) {
  const [exiting, setExiting] = useState(false);
  const [skipReady, setSkipReady] = useState(false);
  const exitingRef = useRef(false);

  const best = [...(players ?? [])].sort((a, b) => b.rating - a.rating)[0];

  useEffect(() => {
    if (!best) { onDone(); return; }
    const t1 = setTimeout(() => setSkipReady(true), 350);
    const t2 = setTimeout(handleExit, 2300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleExit() {
    if (exitingRef.current) return;
    exitingRef.current = true;
    setExiting(true);
    setTimeout(onDone, 380);
  }

  if (!best) return null;

  return (
    <div
      className={`spotlight-overlay${exiting ? ' spotlight-exiting' : ''}`}
      onClick={skipReady ? handleExit : undefined}
      role="button"
      aria-label="Continue to full pack"
    >
      <div className="spotlight-rays" aria-hidden="true" />
      <p className="spotlight-label">⭐ BEST PLAYER</p>
      <SpotlightCard player={best} />
      {skipReady && <p className="spotlight-skip">Tap to continue</p>}
    </div>
  );
}
