// Safe numeric rating extractor. Handles string ratings, NaN, null, undefined.
export function getPlayerRating(p) {
  return Number(p?.rating ?? p?.overall ?? p?.ovr ?? 0) || 0;
}

// Sorts a player array highest→lowest rating.
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
  gold:   '#ffd700',
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

export function getCardRatingColor(rating) {
  if (rating >= 75) return '#1a1a1a';
  if (rating >= 65) return '#111111';
  return '#ffffff';
}

export function getRatingCardClass(rating) {
  const base = rating >= 75 ? 'card-tier-gold' : rating >= 65 ? 'card-tier-silver' : 'card-tier-bronze';
  return rating >= 85 ? `${base} card-tier-elite` : base;
}

// Inline style: background (card face material) + border + inset directional lighting.
// Outer glow via filter:drop-shadow() in CSS. Metallic frame rings via .fut-frame CSS.
// Inset box-shadows here are directional edge lighting only (not the frame — that's CSS).
export function getRatingCardStyle(rating) {
  const elite = rating >= 85;

  // ── Shared surface layers (painter's-algorithm: first = topmost) ─────────
  // Soft white bloom at top — reduced so tier highlight colors show through
  const topBloom = 'linear-gradient(to bottom, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.07) 11%, transparent 30%)';
  // Very gentle darkening toward bottom only
  const bodyShade = 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.03) 45%, rgba(0,0,0,0.12) 75%, rgba(0,0,0,0.22) 100%)';

  if (rating >= 75) {
    // ── GOLD / ELITE ─────────────────────────────────────────────────────────
    // Metallic gold uses a dual-highlight pattern:
    //   1. Tight bright peak near 0% (specular reflection of overhead light)
    //   2. Secondary softer peak around 44–48% (card surface curve)
    // Between and around these peaks: amber/honey mid-tones and deep brown shadows.
    const shine = elite ? 0.50 : 0.34;
    const shineB = (shine * 0.38).toFixed(2);

    const goldBase = elite
      ? 'linear-gradient(157deg, #fffef0 0%, #fff6b0 3%, #ffd700 12%, #e09800 26%, #ffc800 44%, #d89400 60%, #b47200 74%, #8a5400 87%, #624000 98%, #482e00 100%)'
      : 'linear-gradient(155deg, #fffee8 0%, #fff4a0 4%, #ffd700 14%, #e8a400 28%, #ffd200 46%, #dfa000 62%, #ba8000 76%, #8e6200 88%, #6c4800 100%)';

    return {
      background: [
        topBloom,
        bodyShade,
        // Primary diagonal gloss shine
        `linear-gradient(114deg, transparent 8%, rgba(255,255,255,${shine}) 28%, rgba(255,255,255,${shineB}) 50%, transparent 74%)`,
        goldBase,
      ].join(', '),
      border: elite
        ? '2px solid rgba(255,238,0,0.99)'
        : '1.5px solid rgba(255,224,0,0.98)',
      boxShadow: [
        // Directional edge lighting — NOT the frame rings (those are in CSS .fut-frame)
        'inset 0 7px 0 rgba(255,255,218,0.96)',   // top: bright overhead catch-light
        'inset 0 -7px 0 rgba(82,40,0,0.92)',       // bottom: deep shadow
        elite
          ? 'inset 0 0 80px rgba(255,210,0,0.28)'
          : 'inset 0 0 64px rgba(255,185,0,0.18)',
      ].join(', '),
    };
  }

  if (rating >= 65) {
    // ── SILVER — polished steel/chrome ────────────────────────────────────
    // Cold, clean steel: white specular peak at top, secondary reflection at ~40%
    return {
      background: [
        topBloom,
        bodyShade,
        // Cold chrome diagonal shine
        'linear-gradient(114deg, transparent 8%, rgba(230,246,255,0.38) 28%, rgba(248,254,255,0.22) 50%, transparent 74%)',
        // Steel base: pure white highlight → blue-steel mid → slate shadow
        'linear-gradient(153deg, #ffffff 0%, #f0f7ff 4%, #c2d8f0 16%, #d8ecf8 34%, #a6c4de 50%, #bcd2e8 64%, #8eacc4 78%, #6e8ea4 90%, #566e84 100%)',
      ].join(', '),
      border: '1.5px solid rgba(174,206,238,0.98)',
      boxShadow: [
        'inset 0 7px 0 rgba(250,255,255,0.97)',
        'inset 0 -7px 0 rgba(18,48,88,0.82)',
        'inset 0 0 64px rgba(150,208,255,0.16)',
      ].join(', '),
    };
  }

  // ── BRONZE — rich copper / oxidized brass ─────────────────────────────────
  // Warm, rough-edged metal: amber highlight peak → deep copper → secondary reflection
  return {
    background: [
      topBloom,
      bodyShade,
      // Warm copper diagonal shine
      'linear-gradient(114deg, transparent 8%, rgba(255,215,120,0.42) 28%, rgba(255,200,80,0.26) 50%, transparent 74%)',
      // Copper-brass base: bright amber highlight → deep copper-rust → dark shadow
      'linear-gradient(155deg, #ffe898 0%, #ffc860 5%, #df7e28 14%, #c86430 26%, #df8038 44%, #ad4c1c 60%, #8a3812 74%, #662a0c 86%, #4c1c06 100%)',
    ].join(', '),
    border: '1.5px solid rgba(232,146,70,0.98)',
    boxShadow: [
      'inset 0 7px 0 rgba(255,234,160,0.94)',
      'inset 0 -7px 0 rgba(44,12,4,0.90)',
      'inset 0 0 64px rgba(228,118,28,0.22)',
    ].join(', '),
  };
}
