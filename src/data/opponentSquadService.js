import { getAllPlayers } from './csvPlayerStore';

const GK_POS  = ['GK'];
const DEF_POS = ['CB', 'LB', 'RB', 'LWB', 'RWB'];
const MID_POS = ['CDM', 'CM', 'CAM', 'LM', 'RM'];
const ATT_POS = ['LW', 'RW', 'ST', 'CF'];

// Rating window per difficulty
const RATING_RANGE = {
  Easy:   { min: 55, max: 68 },
  Medium: { min: 65, max: 78 },
  Hard:   { min: 74, max: 99 },
};

function pickN(candidates, n, usedIds) {
  const available = candidates.filter(p => !usedIds.has(p.id));
  const shuffled  = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

// Pick n players from the given positions; fall back to any position in pool if needed.
function pickGroup(positions, n, ratingPool, usedIds) {
  const posPool = ratingPool.filter(p => positions.includes(p.position));
  const picks   = pickN(posPool, n, usedIds);
  picks.forEach(p => usedIds.add(p.id));

  if (picks.length < n) {
    const fallback = pickN(ratingPool, n - picks.length, usedIds);
    fallback.forEach(p => usedIds.add(p.id));
    picks.push(...fallback);
  }

  return picks;
}

export function generateOpponentSquad(opponent) {
  const allPlayers = getAllPlayers();
  const { min, max } = RATING_RANGE[opponent.difficulty] ?? RATING_RANGE.Medium;

  // Primary pool filtered by difficulty rating window
  let ratingPool = allPlayers.filter(p => p.rating >= min && p.rating <= max);

  // Widen window if the pool is too small to fill an XI
  if (ratingPool.length < 11) {
    ratingPool = allPlayers.filter(p => p.rating >= min - 5 && p.rating <= max + 5);
  }

  const usedIds = new Set();
  const squad   = [
    ...pickGroup(GK_POS,  1, ratingPool, usedIds),
    ...pickGroup(DEF_POS, 4, ratingPool, usedIds),
    ...pickGroup(MID_POS, 3, ratingPool, usedIds),
    ...pickGroup(ATT_POS, 3, ratingPool, usedIds),
  ];

  // Safety fill — should only trigger if rating pools are extremely small
  if (squad.length < 11) {
    const extra = pickN(allPlayers, 11 - squad.length, usedIds);
    extra.forEach(p => usedIds.add(p.id));
    squad.push(...extra);
  }

  return squad.slice(0, 11);
}

export function calculateOpponentTeamRating(squad) {
  if (!squad || squad.length === 0) return 70;
  return Math.round(squad.reduce((sum, p) => sum + p.rating, 0) / squad.length);
}

// Mirrors the user teamPower formula structure but uses opponent chemistry from the profile.
// opponentRating * 0.75 + chemistryScore * 0.25
export function calculateOpponentPower(squad, opponent) {
  const opponentRating        = calculateOpponentTeamRating(squad);
  const opponentChemistryScore = (opponent.chemistry / 33) * 100;
  return opponentRating * 0.75 + opponentChemistryScore * 0.25;
}
