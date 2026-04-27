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

// Position groups for Starter Pack
const GK_POS  = ['GK'];
const DEF_POS = ['CB', 'LB', 'RB', 'LWB', 'RWB'];
const MID_POS = ['CDM', 'CM', 'CAM', 'LM', 'RM'];
const ATT_POS = ['LW', 'RW', 'ST', 'CF'];
const OUTFIELD = [...DEF_POS, ...MID_POS, ...ATT_POS];

export function openStarterPack() {
  const usedIds = new Set();
  const result = [];

  // Pick n players from positions, trying to hit ~8B / 8S / 9G per 25 proportionally.
  // bTarget = round(n * 8/25), sTarget = round(n * 8/25), gTarget = n - b - s
  function pickGroup(positions, n) {
    const pool = allPlayers.filter(p => positions.includes(p.position) && !usedIds.has(p.id));

    const bTarget = Math.round(n * 8 / 25);
    const sTarget = Math.round(n * 8 / 25);
    const gTarget = n - bTarget - sTarget;

    const bPool = [...pool.filter(p => p.rating <= 64)].sort(() => Math.random() - 0.5);
    const sPool = [...pool.filter(p => p.rating >= 65 && p.rating <= 74)].sort(() => Math.random() - 0.5);
    const gPool = [...pool.filter(p => p.rating >= 75)].sort(() => Math.random() - 0.5);

    const picks = [
      ...bPool.slice(0, bTarget),
      ...sPool.slice(0, sTarget),
      ...gPool.slice(0, Math.max(0, gTarget)),
    ];

    // Fill any shortfall (tier pool too small) from whatever is left
    if (picks.length < n) {
      const pickedIds = new Set(picks.map(p => p.id));
      const fallback = pool
        .filter(p => !pickedIds.has(p.id))
        .sort(() => Math.random() - 0.5);
      picks.push(...fallback.slice(0, n - picks.length));
    }

    const finalPicks = picks.slice(0, n);
    finalPicks.forEach(p => { usedIds.add(p.id); result.push(p); });
    return finalPicks;
  }

  // Guaranteed 1 true CAM (picked first so it's never blocked)
  const camPool = allPlayers.filter(p => p.position === 'CAM');
  const cam = camPool.length > 0
    ? camPool[Math.floor(Math.random() * camPool.length)]
    : null;
  if (cam) { usedIds.add(cam.id); result.push(cam); }

  // Pick groups: slot counts are (23 positional) + 1 CAM already picked
  pickGroup(GK_POS,  2);           // 2 GK
  pickGroup(DEF_POS, 7);           // 7 Defenders
  pickGroup(MID_POS, cam ? 6 : 7); // 6 more Midfielders (CAM already placed)
  pickGroup(ATT_POS, 7);           // 7 Attackers
  const extras = pickGroup(OUTFIELD, 2); // 2 extra random outfield

  // Safety fill in case any pool was exhausted
  while (result.length < 25) {
    const p = allPlayers.find(p => !usedIds.has(p.id));
    if (!p) break;
    usedIds.add(p.id);
    result.push(p);
  }

  // Debug log
  const gkCount  = result.filter(p => GK_POS.includes(p.position)).length;
  const defCount = result.filter(p => DEF_POS.includes(p.position)).length;
  const midCount = result.filter(p => MID_POS.includes(p.position)).length;
  const attCount = result.filter(p => ATT_POS.includes(p.position)).length;

  console.log(
    `%c📦 STARTER PACK OPENED (${result.length} players)`, 'color: #fff; font-weight: bold',
    `\n  GK: ${gkCount}`,
    `\n  Defenders: ${defCount}`,
    `\n  Midfielders: ${midCount}  (includes CAM + 2 extras if they landed in MID)`,
    `\n  Attackers: ${attCount}  (includes 2 extras if they landed in ATT/DEF)`,
    `\n  Extras (2 random outfield): ${extras.map(p => `${p.name} (${p.position})`).join(', ')}`,
    `\n  CAM included: ${cam ? `✅ ${cam.name} — ${cam.position}, OVR ${cam.rating}` : '❌ No CAM found in pool'}`,
    `\n  bronze=${result.filter(p => p.rating <= 64).length}`,
    `silver=${result.filter(p => p.rating >= 65 && p.rating <= 74).length}`,
    `gold=${result.filter(p => p.rating >= 75).length}`,
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
