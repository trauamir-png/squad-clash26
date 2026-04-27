const ATTACKER_POS   = new Set(['ST', 'CF', 'LW', 'RW']);
const MIDFIELDER_POS = new Set(['CAM', 'CM', 'CDM', 'LM', 'RM']);
const DEFENDER_POS   = new Set(['CB', 'LB', 'RB', 'LWB', 'RWB']);

function categorize(players) {
  const attackers   = [];
  const midfielders = [];
  const defenders   = [];
  for (const p of (players ?? [])) {
    const pos = (p.position ?? '').toUpperCase();
    if (ATTACKER_POS.has(pos))        attackers.push(p);
    else if (MIDFIELDER_POS.has(pos)) midfielders.push(p);
    else if (DEFENDER_POS.has(pos))   defenders.push(p);
  }
  return { attackers, midfielders, defenders };
}

function weightedPick(pools, weights) {
  const total = weights.reduce((s, w, i) => s + (pools[i].length > 0 ? w : 0), 0);
  if (total === 0) return null;
  let r = Math.random() * total;
  for (let i = 0; i < pools.length; i++) {
    if (pools[i].length === 0) continue;
    r -= weights[i];
    if (r <= 0) return pools[i][Math.floor(Math.random() * pools[i].length)];
  }
  const last = pools[pools.length - 1];
  return last.length > 0 ? last[Math.floor(Math.random() * last.length)] : null;
}

function pickScorer(cats) {
  return weightedPick(
    [cats.attackers, cats.midfielders, cats.defenders],
    [60, 30, 10],
  );
}

function pickAssister(cats, scorerId) {
  const atk = cats.attackers.filter(p => p.id !== scorerId);
  const mid  = cats.midfielders.filter(p => p.id !== scorerId);
  const def  = cats.defenders.filter(p => p.id !== scorerId);
  return weightedPick([mid, atk, def], [50, 35, 15]);
}

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function randMinute() {
  return 1 + Math.floor(Math.random() * 90);
}

function pickAny(squad) {
  if (!squad || squad.length === 0) return null;
  return squad[Math.floor(Math.random() * squad.length)];
}

function pickOutfield(squad) {
  if (!squad || squad.length === 0) return null;
  const out = squad.filter(p => (p.position ?? '').toUpperCase() !== 'GK');
  return out.length > 0 ? out[Math.floor(Math.random() * out.length)] : pickAny(squad);
}

export function generateAdditionalMatchEvents(goalsFor, goalsAgainst, startingXI, opponentSquad, _teamPower, _opponentPower) {
  const userCats = categorize(startingXI);
  const oppCats  = categorize(opponentSquad);
  const events   = [];

  const userGK = (startingXI    ?? []).find(p => (p.position ?? '').toUpperCase() === 'GK');
  const oppGK  = (opponentSquad ?? []).find(p => (p.position ?? '').toUpperCase() === 'GK');

  // shots on target — each resolved with an outcome (saved)
  for (let i = 0, n = randInt(2, 4); i < n; i++) {
    const shooter = weightedPick([userCats.attackers, userCats.midfielders, userCats.defenders], [65, 30, 5]);
    events.push({
      minute: randMinute(), type: 'shot_saved', team: 'user',
      player: shooter?.name ?? 'Unknown', keeper: oppGK?.name ?? null,
    });
  }
  for (let i = 0, n = randInt(2, 4); i < n; i++) {
    const shooter = weightedPick([oppCats.attackers, oppCats.midfielders, oppCats.defenders], [65, 30, 5]) ?? pickAny(opponentSquad);
    events.push({
      minute: randMinute(), type: 'shot_saved', team: 'opponent',
      player: shooter?.name ?? 'Opponent', keeper: userGK?.name ?? null,
    });
  }

  // big chance misses
  for (let i = 0, n = randInt(1, 2); i < n; i++) {
    const player = weightedPick([userCats.attackers, userCats.midfielders], [70, 30]);
    events.push({ minute: randMinute(), type: 'big_chance_miss', team: 'user', player: player?.name ?? 'Unknown' });
  }
  for (let i = 0, n = randInt(1, 2); i < n; i++) {
    const player = weightedPick([oppCats.attackers, oppCats.midfielders], [70, 30]) ?? pickAny(opponentSquad);
    events.push({ minute: randMinute(), type: 'big_chance_miss', team: 'opponent', player: player?.name ?? 'Opponent' });
  }

  // hit post (0–2 total)
  for (let i = 0, n = randInt(0, 2); i < n; i++) {
    const isUser = Math.random() < 0.5;
    const player = isUser
      ? weightedPick([userCats.attackers, userCats.midfielders], [70, 30])
      : (weightedPick([oppCats.attackers, oppCats.midfielders], [70, 30]) ?? pickAny(opponentSquad));
    events.push({ minute: randMinute(), type: 'hit_post', team: isUser ? 'user' : 'opponent', player: player?.name ?? (isUser ? 'Unknown' : 'Opponent') });
  }

  // yellow cards (1–3 total)
  for (let i = 0, n = randInt(1, 3); i < n; i++) {
    const isUser = Math.random() < 0.5;
    const player = isUser ? pickOutfield(startingXI) : pickOutfield(opponentSquad);
    events.push({ minute: randMinute(), type: 'yellow_card', team: isUser ? 'user' : 'opponent', player: player?.name ?? (isUser ? 'Unknown' : 'Opponent') });
  }

  // red card (~10% chance)
  if (Math.random() < 0.10) {
    const isUser = Math.random() < 0.5;
    const player = isUser ? pickOutfield(startingXI) : pickOutfield(opponentSquad);
    events.push({ minute: randMinute(), type: 'red_card', team: isUser ? 'user' : 'opponent', player: player?.name ?? (isUser ? 'Unknown' : 'Opponent') });
  }

  // injury (~30% chance of 1)
  if (Math.random() < 0.30) {
    const isUser = Math.random() < 0.5;
    const player = isUser ? pickAny(startingXI) : pickAny(opponentSquad);
    events.push({ minute: randMinute(), type: 'injury', team: isUser ? 'user' : 'opponent', player: player?.name ?? (isUser ? 'Unknown' : 'Opponent') });
  }

  return events;
}

export function generateMatchEvents(goalsFor, goalsAgainst, startingXI, opponentSquad = [], teamPower = 70, opponentPower = 70) {
  const userCats = categorize(startingXI);
  const oppCats  = categorize(opponentSquad);
  const events   = [];

  for (let i = 0; i < goalsFor; i++) {
    const scorer   = pickScorer(userCats);
    const assister = Math.random() < 0.65 ? pickAssister(userCats, scorer?.id) : null;
    events.push({
      minute:   1 + Math.floor(Math.random() * 90),
      type:     'goal',
      team:     'user',
      scorer:   scorer?.name   ?? 'Unknown',
      assister: assister?.name ?? null,
    });
  }

  for (let i = 0; i < goalsAgainst; i++) {
    const scorer = pickScorer(oppCats) ?? pickAny(opponentSquad);
    events.push({
      minute:   1 + Math.floor(Math.random() * 90),
      type:     'goal',
      team:     'opponent',
      scorer:   scorer?.name ?? 'Opponent',
      assister: null,
    });
  }

  const extra = generateAdditionalMatchEvents(goalsFor, goalsAgainst, startingXI, opponentSquad, teamPower, opponentPower);
  events.push(...extra);
  events.sort((a, b) => a.minute - b.minute);
  return events;
}
