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
  const overlay = 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.5) 100%)';

  if (rating >= 75) {
    const shine = elite ? 0.22 : 0.14;
    return {
      background: [
        overlay,
        `linear-gradient(105deg, transparent 28%, rgba(255,255,255,${shine}) 43%, rgba(255,255,255,${(shine * 0.65).toFixed(2)}) 53%, transparent 68%)`,
        'linear-gradient(135deg, #fff3a0 0%, #ffd700 25%, #ffcc00 50%, #ffdb4d 75%, #b38f00 100%)',
      ].join(', '),
      border: elite ? '1.5px solid #ffd700' : '1px solid #ffd700',
      boxShadow: elite
        ? '0 0 22px rgba(255,215,0,0.7), 0 0 10px rgba(255,215,0,0.35) inset, 0 4px 16px rgba(0,0,0,0.4)'
        : '0 0 12px rgba(255,215,0,0.5), 0 4px 12px rgba(0,0,0,0.3)',
    };
  }
  if (rating >= 65) {
    return {
      background: [
        overlay,
        'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 25%, #cbd5e1 50%, #e5e7eb 75%, #94a3b8 100%)',
      ].join(', '),
      border: '1px solid #94a3b8',
      boxShadow: '0 0 8px rgba(148,163,184,0.35), 0 4px 12px rgba(0,0,0,0.3)',
    };
  }
  return {
    background: [
      overlay,
      'linear-gradient(135deg, #e6a15a 0%, #cd7f32 25%, #b87333 50%, #a97142 75%, #7a4e2d 100%)',
    ].join(', '),
    border: '1px solid #cd7f32',
    boxShadow: '0 0 8px rgba(205,127,50,0.35), 0 4px 12px rgba(0,0,0,0.4)',
  };
}
