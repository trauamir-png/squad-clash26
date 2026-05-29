import { getAllPlayers } from './playerStore';
import { DATA_SOURCE }  from '../config/dataSource';

// ── Israeli safety filter ─────────────────────────────────────────────────────
// When DATA_SOURCE='israel' this filter is a HARD REQUIREMENT.
// Players that do not satisfy ANY of these criteria are rejected.
// There is no silent fallback to FIFA data — an empty pool produces a console
// error and an empty pack rather than returning global players.
function applySourceFilter(players) {
  if (DATA_SOURCE !== 'israel') return players;

  return players.filter(p =>
    p._source        === 'israeli'     ||
    p.country        === 'Israel'      ||
    p.nationality    === 'Israel'      ||
    (typeof p.leagueName === 'string' && p.leagueName.includes("Ha'al"))
  );
}

// ── Pool builder — called fresh inside every pack function ────────────────────
// Never cached at module level: avoids stale data from HMR or browser cache.
function buildPool() {
  const raw      = getAllPlayers();
  const filtered = applySourceFilter(raw);

  console.log(
    `%c🎴 packService.buildPool()`, 'color: #4ade80; font-weight: bold',
    `\n  DATA_SOURCE      : ${DATA_SOURCE}`,
    `\n  getAllPlayers()  : ${raw.length} players`,
    `\n  After filter     : ${filtered.length} players`,
    `\n  First 10 names   : ${filtered.slice(0, 10).map(p => p.name).join(', ')}`,
    `\n  Sources present  : ${[...new Set(filtered.map(p => p._source))].join(', ')}`,
  );

  if (DATA_SOURCE === 'israel' && filtered.length === 0) {
    console.error(
      '❌ CRITICAL — Israeli player pool is EMPTY after filtering.',
      '\n  Raw pool had:', raw.length, 'players.',
      '\n  _source values in raw pool:', [...new Set(raw.map(p => p._source))],
      '\n  Check: src/config/dataSource.js  (DATA_SOURCE should be "israel")',
      '\n  Check: src/data/israeliPlayers.js (players need _source:"israeli")',
      '\n  Check: src/data/playerStore.js   (should import israeliPlayers)',
    );
  }

  return filtered;
}

// ── pickRandom: pick n random items from pool ─────────────────────────────────
function pickRandom(pool, count) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const picked   = shuffled.slice(0, Math.min(count, shuffled.length));
  if (picked.length < count) {
    console.warn(
      `pickRandom: requested ${count} but pool only has ${pool.length} players.`,
    );
  }
  return picked;
}

// ── STARTER_SLOTS: 24-player starter pack position coverage ──────────────────
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
]; // total requested: 24

export function openStarterPack() {
  // Fresh pool — no module-level caching
  const pool    = buildPool();
  const usedIds = new Set();
  const result  = [];

  for (const { pos, count, fallback } of STARTER_SLOTS) {
    const positions = [pos, ...fallback];
    const eligible  = pool
      .filter(p => positions.includes(p.position) && !usedIds.has(p.id))
      .sort(() => Math.random() - 0.5);
    eligible.slice(0, count).forEach(p => { usedIds.add(p.id); result.push(p); });
  }

  // Safety fill — top-up to 24 if any position pool was exhausted
  while (result.length < 24) {
    const extra = pool.find(p => !usedIds.has(p.id));
    if (!extra) break;
    usedIds.add(extra.id);
    result.push(extra);
  }

  // 87+ guarantee is skipped silently when no such player exists in the pool
  // (Israeli dataset tops out at ~80)
  if (!result.some(p => p.rating >= 87)) {
    const elite = pool
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
    `\n  DATA_SOURCE : ${DATA_SOURCE}`,
    `\n  By position : ${JSON.stringify(byPos)}`,
    `\n  bronze=${result.filter(p => p.rating <= 64).length}`,
    `  silver=${result.filter(p => p.rating >= 65 && p.rating <= 74).length}`,
    `  gold=${result.filter(p => p.rating >= 75).length}`,
    `\n  Selected players:`,
    result.map(p => `    ${p.name} | ${p.position} | ${p.rating} | ${p.club} | ${p.leagueName} | ${p.nationality} | _source:${p._source}`).join('\n'),
  );

  return result;
}

export function openPack(type) {
  // Fresh pool — no module-level caching
  const pool = buildPool();

  const tierPool = {
    bronze: pool.filter(p => p.rating <= 64),
    silver: pool.filter(p => p.rating >= 65 && p.rating <= 74),
    gold:   pool.filter(p => p.rating >= 75),
  }[type];

  if (tierPool === undefined) {
    throw new Error(`Unknown pack type: "${type}". Valid: bronze, silver, gold`);
  }

  const players = pickRandom(tierPool, 12);

  console.log(
    `%c📦 ${type.toUpperCase()} PACK OPENED (${players.length} players)`, 'color: #f7d774; font-weight: bold',
    `\n  DATA_SOURCE : ${DATA_SOURCE}`,
    `\n  Tier pool size: ${tierPool.length}`,
    `\n  Selected players:`,
    players.map(p => `    ${p.name} | ${p.position} | ${p.rating} | ${p.club} | ${p.leagueName} | ${p.nationality} | _source:${p._source}`).join('\n'),
  );

  return players;
}
