// Points awarded per event type for Player of the Match scoring
const POTM_PTS = {
  goal:            5,
  assist:          3,
  big_chance_miss: -1,
  yellow_card:     -1,
  red_card:        -3,
  injury:          0,
};

// Placeholder names that should not accumulate POTM points
const GENERIC_NAMES = new Set(['Unknown', 'Opponent', 'Goalkeeper']);

export function calculateMatchStats(events, goalsFor, goalsAgainst) {
  const user = {
    goals: goalsFor, shots: 0, shotsOnTarget: 0,
    saves: 0, bigChances: 0, hitPost: 0,
    yellowCards: 0, redCards: 0, injuries: 0,
  };
  const opp = {
    goals: goalsAgainst, shots: 0, shotsOnTarget: 0,
    saves: 0, bigChances: 0, hitPost: 0,
    yellowCards: 0, redCards: 0, injuries: 0,
  };

  for (const ev of (events ?? [])) {
    const me    = ev.team === 'user' ? user : opp;
    const other = ev.team === 'user' ? opp  : user;

    switch (ev.type) {
      case 'goal':
        me.shots++;
        me.shotsOnTarget++;
        break;
      case 'shot_saved':
        me.shots++;
        me.shotsOnTarget++;
        other.saves++;
        break;
      case 'big_chance_miss':
        me.shots++;
        me.bigChances++;
        break;
      case 'hit_post':
        me.shots++;
        me.hitPost++;
        break;
      case 'yellow_card':
        me.yellowCards++;
        break;
      case 'red_card':
        me.redCards++;
        break;
      case 'injury':
        me.injuries++;
        break;
    }
  }

  return { user, opponent: opp };
}

export function getPlayerOfTheMatch(events, userXI, opponentSquad) {
  const scores = {}; // name → { score, team }

  const add = (name, team, pts) => {
    if (!name || GENERIC_NAMES.has(name)) return;
    if (!scores[name]) scores[name] = { score: 0, team };
    scores[name].score += pts;
  };

  for (const ev of (events ?? [])) {
    if (ev.type === 'goal') {
      add(ev.scorer,   ev.team, POTM_PTS.goal);
      if (ev.assister) add(ev.assister, ev.team, POTM_PTS.assist);
    } else if (ev.type === 'shot_saved') {
      add(ev.player, ev.team, 1); // shooter: shot on target
      if (ev.keeper) {
        const keeperTeam = ev.team === 'user' ? 'opponent' : 'user';
        add(ev.keeper, keeperTeam, 3); // keeper: save
      }
    } else {
      add(ev.player, ev.team, POTM_PTS[ev.type] ?? 0);
    }
  }

  // Find highest scorer with a positive total
  const entries = Object.entries(scores);
  if (entries.length > 0) {
    const [name, { score, team }] = entries.reduce((a, b) =>
      b[1].score > a[1].score ? b : a
    );
    if (score > 0) {
      const allPlayers = [...(userXI ?? []), ...(opponentSquad ?? [])];
      const player     = allPlayers.find(p => p.name === name);
      return { name, score, team, club: player?.club ?? null, rating: player?.rating ?? null, image: player?.image ?? null };
    }
  }

  // Fallback: best-rated player from the user's XI
  const best = (userXI ?? []).reduce(
    (acc, p) => (!acc || (p?.rating ?? 0) > (acc?.rating ?? 0)) ? p : acc,
    null
  );
  if (best) {
    return { name: best.name, score: null, team: 'user', club: best.club ?? null, rating: best.rating ?? null, image: best.image ?? null, fallback: true };
  }

  return null;
}
