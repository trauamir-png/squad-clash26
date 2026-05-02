import { getAllPlayers } from './csvPlayerStore';

const allPlayers = getAllPlayers();

const bronzePlayers = allPlayers.filter(p => p.rating <= 64);
const silverPlayers = allPlayers.filter(p => p.rating >= 65 && p.rating <= 74);
const goldPlayers   = allPlayers.filter(p => p.rating >= 75);

console.log('🎴 Pack Service ready:',
  `bronze=${bronzePlayers.length}`,
  `silver=${silverPlayers.length}`,
  `gold=${goldPlayers.length}`,
);

const PACKS = {
  bronze: { pool: bronzePlayers, size: 12 },
  silver: { pool: silverPlayers, size: 12 },
  gold:   { pool: goldPlayers,   size: 12 },
};

function pickRandom(pool, count) {
  if (pool.length < count) {
    console.warn(`Pool has only ${pool.length} players, requested ${count}`);
  }
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, pool.length));
}

// Starter Pack: exactly 24 players covering all positions so users can
// switch formations freely.
// Positions without dataset entries (LWB, RWB) fall back to LB/RB.
const STARTER_SLOTS = [
  { pos: 'GK',  count: 2, fallback: [] },
  { pos: 'LB',  count: 2, fallback: [] },
  { pos: 'CB',  count: 4, fallback: [] },
  { pos: 'RB',  count: 2, fallback: [] },
  { pos: 'LWB', count: 1, fallback: ['LB'] },
  { pos: 'RWB', count: 1, fallback: ['RB'] },
  { pos: 'CDM', count: 2, fallback: [] },
  { pos: 'CM',  count: 2, fallback: [] },
  { pos: 'CAM', count: 1, fallback: ['AM'] },
  { pos: 'LM',  count: 1, fallback: ['LW'] },
  { pos: 'RM',  count: 1, fallback: ['RW'] },
  { pos: 'LW',  count: 1, fallback: ['LM'] },
  { pos: 'RW',  count: 1, fallback: ['RM'] },
  { pos: 'ST',  count: 3, fallback: ['CF'] },
]; // total: 24

export function openStarterPack() {
  const usedIds = new Set();
  const result = [];

  for (const { pos, count, fallback } of STARTER_SLOTS) {
    const positions = [pos, ...fallback];
    const pool = allPlayers
      .filter(p => positions.includes(p.position) && !usedIds.has(p.id))
      .sort(() => Math.random() - 0.5);
    pool.slice(0, count).forEach(p => { usedIds.add(p.id); result.push(p); });
  }

  // Safety fill if any pool was exhausted
  while (result.length < 24) {
    const p = allPlayers.find(p => !usedIds.has(p.id));
    if (!p) break;
    usedIds.add(p.id);
    result.push(p);
  }

  // Guarantee at least one 87+ rated player
  if (!result.some(p => p.rating >= 87)) {
    const elite = allPlayers
      .filter(p => p.rating >= 87 && !usedIds.has(p.id))
      .sort(() => Math.random() - 0.5)[0];
    if (elite) {
      result.sort((a, b) => a.rating - b.rating);
      const removed = result.shift();
      usedIds.delete(removed.id);
      usedIds.add(elite.id);
      result.push(elite);
    }
  }

  const byPos = {};
  result.forEach(p => { byPos[p.position] = (byPos[p.position] || 0) + 1; });
  console.log(
    `%c📦 STARTER PACK OPENED (${result.length} players)`, 'color: #fff; font-weight: bold',
    '\n  By position:', JSON.stringify(byPos),
    `\n  bronze=${result.filter(p => p.rating <= 64).length}`,
    `  silver=${result.filter(p => p.rating >= 65 && p.rating <= 74).length}`,
    `  gold=${result.filter(p => p.rating >= 75).length}`,
    `\n  87+ guaranteed: ${result.some(p => p.rating >= 87) ? '✅' : '❌'}`,
  );

  return result;
}

export function openPack(type) {
  const config = PACKS[type];
  if (!config) {
    throw new Error(`Unknown pack type: "${type}". Valid types: bronze, silver, gold`);
  }

  const players = pickRandom(config.pool, config.size);

  console.log(`%c📦 ${type.toUpperCase()} PACK OPENED (${players.length} players)`, 'color: #f7d774; font-weight: bold');
  console.table(players.map(p => ({
    name:     p.name,
    rating:   p.rating,
    position: p.position,
    club:     p.club,
  })));

  return players;
}
