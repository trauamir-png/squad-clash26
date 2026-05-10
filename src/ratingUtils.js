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

// Inline style for a full player card: background layers + border + inset bevel.
// Outer glow is handled by filter:drop-shadow() in CSS — box-shadow is inset only
// (clip-path clips any outer box-shadow, making it invisible).
export function getRatingCardStyle(rating) {
  const elite = rating >= 85;

  // ── Shared overlay layers (painter's-algorithm: first = topmost) ──────────
  // Strong top catch-light — simulates overhead studio light hitting the card
  const topEdge = 'linear-gradient(to bottom, rgba(255,255,255,0.52) 0%, rgba(255,255,255,0.18) 8%, rgba(255,255,255,0.04) 22%, transparent 38%)';
  // Gentle body shading: very slight darkening toward the bottom only
  const overlay = 'linear-gradient(to bottom, rgba(255,255,255,0.04) 0%, transparent 30%, rgba(0,0,0,0.06) 62%, rgba(0,0,0,0.16) 100%)';
  // Soft edge vignette — subtle depth without eating readability
  const vignette = 'radial-gradient(ellipse 130% 105% at 50% 4%, transparent 52%, rgba(0,0,0,0.18) 100%)';

  if (rating >= 75) {
    // ── GOLD / ELITE ─────────────────────────────────────────────────────────
    const shineOpacity = elite ? 0.46 : 0.30;
    const shineHalf    = (shineOpacity * 0.42).toFixed(2);

    const goldBase = elite
      ? 'linear-gradient(156deg, #fffde8 0%, #ffe066 8%, #ffd700 20%, #f0a800 35%, #ffd000 52%, #e09000 68%, #b87000 84%, #8a5400 100%)'
      : 'linear-gradient(154deg, #fff8d4 0%, #ffd700 12%, #f5c200 26%, #ffc800 44%, #e8b000 60%, #c89000 76%, #a07200 90%, #7e5800 100%)';

    return {
      background: [
        topEdge,
        overlay,
        vignette,
        // Cross-diagonal shine stripe
        `linear-gradient(112deg, transparent 10%, rgba(255,255,255,${shineOpacity}) 30%, rgba(255,255,255,${shineHalf}) 50%, transparent 70%)`,
        // Counter-diagonal faint secondary shine
        'linear-gradient(248deg, transparent 30%, rgba(255,240,100,0.14) 50%, transparent 70%)',
        goldBase,
      ].join(', '),
      border: elite
        ? '2px solid rgba(255,234,0,0.98)'
        : '1.5px solid rgba(255,218,0,0.96)',
      boxShadow: [
        // Top catch-light — the brightest physical edge
        'inset 0 3px 0 rgba(255,255,210,0.90)',
        // Bottom shadow — opposite end, darkened
        'inset 0 -3px 0 rgba(100,55,0,0.75)',
        // Side rim highlights — subtle golden edge
        'inset 3px 0 0 rgba(255,242,120,0.30)',
        'inset -3px 0 0 rgba(255,242,120,0.30)',
        // Center luminance
        elite
          ? 'inset 0 0 56px rgba(255,210,0,0.22)'
          : 'inset 0 0 44px rgba(255,190,0,0.14)',
      ].join(', '),
    };
  }

  if (rating >= 65) {
    // ── SILVER ───────────────────────────────────────────────────────────────
    return {
      background: [
        topEdge,
        overlay,
        vignette,
        // Chrome cross-shine
        'linear-gradient(112deg, transparent 10%, rgba(220,238,255,0.32) 32%, rgba(200,225,255,0.18) 50%, transparent 72%)',
        // Cool secondary reflection
        'linear-gradient(248deg, transparent 32%, rgba(180,210,240,0.16) 50%, transparent 70%)',
        // Steel-chrome base
        'linear-gradient(152deg, #f8fbff 0%, #dde8f5 10%, #b8cee6 24%, #c4d8ee 40%, #9ab8d4 56%, #84a8c8 72%, #6892b4 86%, #5480a0 100%)',
      ].join(', '),
      border: '1.5px solid rgba(168,196,228,0.96)',
      boxShadow: [
        'inset 0 3px 0 rgba(246,252,255,0.92)',
        'inset 0 -3px 0 rgba(30,60,100,0.62)',
        'inset 3px 0 0 rgba(210,232,252,0.30)',
        'inset -3px 0 0 rgba(210,232,252,0.30)',
        'inset 0 0 44px rgba(160,210,255,0.12)',
      ].join(', '),
    };
  }

  // ── BRONZE ─────────────────────────────────────────────────────────────────
  return {
    background: [
      topEdge,
      overlay,
      vignette,
      // Warm copper cross-shine
      'linear-gradient(112deg, transparent 10%, rgba(255,200,100,0.36) 30%, rgba(255,180,60,0.20) 50%, transparent 72%)',
      // Secondary warm reflection
      'linear-gradient(248deg, transparent 30%, rgba(220,140,40,0.18) 50%, transparent 70%)',
      // Rich copper-rust base
      'linear-gradient(154deg, #ffd070 0%, #e08028 10%, #c86830 24%, #b05020 40%, #984018 56%, #7c3010 72%, #602208 86%, #4a1604 100%)',
    ].join(', '),
    border: '1.5px solid rgba(225,138,62,0.96)',
    boxShadow: [
      'inset 0 3px 0 rgba(255,224,152,0.82)',
      'inset 0 -3px 0 rgba(50,16,4,0.68)',
      'inset 3px 0 0 rgba(230,155,65,0.30)',
      'inset -3px 0 0 rgba(230,155,65,0.30)',
      'inset 0 0 44px rgba(225,115,22,0.18)',
    ].join(', '),
  };
}
