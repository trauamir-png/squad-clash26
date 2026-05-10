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

  // Shared overlay layers (painter's-algorithm order, first = topmost)
  const topEdge  = 'linear-gradient(to bottom, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.08) 14%, transparent 30%)';
  // Gentle footer shade only — bottom must stay readable for stats/badges
  const overlay  = 'linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, transparent 35%, rgba(0,0,0,0.08) 68%, rgba(0,0,0,0.18) 100%)';
  // Very soft edge separation — not a darkening vignette
  const vignette = 'radial-gradient(ellipse 120% 98% at 50% 6%, transparent 58%, rgba(0,0,0,0.13) 100%)';

  if (rating >= 75) {
    const shine = elite ? 0.40 : 0.27;
    return {
      background: [
        topEdge,
        overlay,
        vignette,
        `linear-gradient(110deg, transparent 14%, rgba(255,255,255,${shine}) 34%, rgba(255,255,255,${(shine * 0.38).toFixed(2)}) 52%, transparent 68%)`,
        elite
          ? 'linear-gradient(158deg, #fffac0 0%, #ffd700 13%, #e8a000 30%, #ffd000 50%, #c48000 70%, #a07400 100%)'
          : 'linear-gradient(155deg, #ffee82 0%, #ffd700 18%, #ecb800 37%, #ffcc00 57%, #c09800 77%, #a07800 100%)',
      ].join(', '),
      border: elite ? '1.5px solid rgba(255,232,0,0.96)' : '1px solid rgba(255,216,0,0.92)',
      boxShadow: [
        'inset 0 2px 0 rgba(255,255,185,0.65)',
        'inset 0 -2px 0 rgba(115,72,0,0.56)',
        'inset 2px 0 0 rgba(255,245,130,0.22)',
        'inset -2px 0 0 rgba(255,245,130,0.22)',
        elite
          ? 'inset 0 0 44px rgba(255,200,0,0.16)'
          : 'inset 0 0 36px rgba(255,185,0,0.10)',
      ].join(', '),
    };
  }
  if (rating >= 65) {
    return {
      background: [
        topEdge,
        overlay,
        vignette,
        'linear-gradient(110deg, transparent 22%, rgba(200,228,255,0.28) 40%, transparent 58%)',
        'linear-gradient(150deg, #f4f9ff 0%, #c8dcf2 18%, #a2bad8 42%, #bccede 66%, #8aaabf 100%)',
      ].join(', '),
      border: '1px solid rgba(152,182,218,0.94)',
      boxShadow: [
        'inset 0 2px 0 rgba(240,250,255,0.78)',
        'inset 0 -2px 0 rgba(44,76,116,0.52)',
        'inset 2px 0 0 rgba(200,224,248,0.24)',
        'inset -2px 0 0 rgba(200,224,248,0.24)',
        'inset 0 0 36px rgba(165,210,252,0.09)',
      ].join(', '),
    };
  }
  return {
    background: [
      topEdge,
      overlay,
      vignette,
      'linear-gradient(110deg, transparent 22%, rgba(255,208,124,0.32) 40%, transparent 58%)',
      'linear-gradient(155deg, #ffca66 0%, #d88026 14%, #c07030 36%, #a85826 57%, #8c4a22 77%, #72361a 100%)',
    ].join(', '),
    border: '1px solid rgba(220,134,58,0.94)',
    boxShadow: [
      'inset 0 2px 0 rgba(255,218,142,0.68)',
      'inset 0 -2px 0 rgba(44,18,4,0.40)',
      'inset 2px 0 0 rgba(225,148,58,0.26)',
      'inset -2px 0 0 rgba(225,148,58,0.26)',
      'inset 0 0 36px rgba(225,110,18,0.13)',
    ].join(', '),
  };
}
