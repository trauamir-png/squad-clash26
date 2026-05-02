// Safe numeric rating extractor. Handles string ratings, NaN, null, undefined.
// ?? catches only null/undefined; || 0 collapses NaN to 0.
export function getPlayerRating(p) {
  return Number(p?.rating ?? p?.overall ?? p?.ovr ?? 0) || 0;
}

// Sorts a player array highest→lowest rating (safe: coerces to Number, falls back to name).
export function sortByRating(players) {
  return [...players].sort(
    (a, b) =>
      getPlayerRating(b) - getPlayerRating(a) ||
      String(a.name || '').localeCompare(String(b.name || ''))
  );
}

// Single source of truth for rating tier thresholds, colors, and card styles.
// Gold >= 75 | Silver 65–74 | Bronze <= 64 | Elite >= 85 (gold subclass)

export const RATING_COLORS = {
  gold:   '#ffd700', // used in non-card contexts (mini-cards, summary rows, etc.)
  silver: '#e2e8f0',
  bronze: '#cd7f32',
};

export function getRatingTier(rating) {
  if (rating >= 75) return 'gold';
  if (rating >= 65) return 'silver';
  return 'bronze';
}

export function getRatingColor(rating) {
  return RATING_COLORS[getRatingTier(rating)];
}

// Rating number text color when displayed ON a full card background.
// Gold/Silver cards are bright → dark text. Bronze is warm → white text.
export function getCardRatingColor(rating) {
  if (rating >= 75) return '#1a1a1a';
  if (rating >= 65) return '#111111';
  return '#ffffff';
}

// CSS class(es) to apply to a card root element for tier-based text theming.
export function getRatingCardClass(rating) {
  const base = rating >= 75 ? 'card-tier-gold' : rating >= 65 ? 'card-tier-silver' : 'card-tier-bronze';
  return rating >= 85 ? `${base} card-tier-elite` : base;
}

// Inline style for a full player card: background layers + border + glow.
// All tiers share a top→bottom dark overlay for depth and text contrast.
// Gold adds a diagonal shine layer for a metallic sheen.
// Elite (>= 85) gets a stronger glow and brighter border.
export function getRatingCardStyle(rating) {
  const elite = rating >= 85;

  // Top highlight (light-from-above) blending into a deep bottom shadow for card depth
  const overlay  = 'linear-gradient(to bottom, rgba(255,255,255,0.11) 0%, rgba(0,0,0,0.0) 30%, rgba(0,0,0,0.42) 72%, rgba(0,0,0,0.62) 100%)';
  // Subtle radial edge-darkening to separate card from background
  const vignette = 'radial-gradient(ellipse 110% 90% at 50% 10%, transparent 52%, rgba(0,0,0,0.26) 100%)';

  if (rating >= 75) {
    const shine = elite ? 0.30 : 0.19;
    return {
      background: [
        overlay,
        vignette,
        `linear-gradient(112deg, transparent 20%, rgba(255,255,255,${shine}) 39%, rgba(255,255,255,${(shine * 0.45).toFixed(2)}) 52%, transparent 70%)`,
        elite
          ? 'linear-gradient(158deg, #fff5a8 0%, #ffd700 16%, #e8a800 36%, #ffc800 55%, #c08800 74%, #7a5400 100%)'
          : 'linear-gradient(155deg, #ffe878 0%, #ffd700 20%, #eabb00 40%, #ffcb00 60%, #b89000 80%, #876400 100%)',
      ].join(', '),
      border: elite ? '1.5px solid rgba(255,222,0,0.92)' : '1px solid rgba(255,210,0,0.82)',
      boxShadow: elite
        ? '0 0 24px rgba(0,0,0,0.42) inset, 0 8px 36px rgba(0,0,0,0.68), 0 0 32px rgba(255,215,0,0.88), 0 0 12px rgba(255,215,0,0.55) inset'
        : '0 0 18px rgba(0,0,0,0.36) inset, 0 6px 28px rgba(0,0,0,0.58), 0 0 20px rgba(255,215,0,0.62)',
    };
  }
  if (rating >= 65) {
    return {
      background: [
        overlay,
        vignette,
        'linear-gradient(150deg, #e8f0fa 0%, #ccdaea 22%, #b0c4d8 46%, #c4d4e6 68%, #7890ac 100%)',
      ].join(', '),
      border: '1px solid rgba(136,162,194,0.88)',
      boxShadow: '0 0 18px rgba(0,0,0,0.36) inset, 0 6px 26px rgba(0,0,0,0.58), 0 0 14px rgba(136,162,194,0.48)',
    };
  }
  return {
    background: [
      overlay,
      vignette,
      `linear-gradient(112deg, transparent 28%, rgba(255,195,110,0.24) 46%, transparent 63%)`,
      'linear-gradient(155deg, #f8b85a 0%, #d4832a 17%, #c07030 38%, #a85a26 60%, #7c3e1c 80%, #562a10 100%)',
    ].join(', '),
    border: '1px solid rgba(198,118,48,0.82)',
    boxShadow: '0 0 18px rgba(0,0,0,0.42) inset, 0 6px 26px rgba(0,0,0,0.62), 0 0 14px rgba(175,96,36,0.48)',
  };
}
