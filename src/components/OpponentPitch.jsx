import { PlayerImage } from '../PlayerImage';

const GK_POS  = pos => pos === 'GK';
const DEF_POS = pos => ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos);
const MID_POS = pos => ['CM', 'CDM', 'CAM', 'LM', 'RM', 'DM'].includes(pos);
const ATT_POS = pos => ['ST', 'CF', 'LW', 'RW', 'SS'].includes(pos);

function categorize(squad) {
  const gk  = squad.filter(p => GK_POS(p.position)).slice(0, 1);
  const def = squad.filter(p => DEF_POS(p.position)).slice(0, 4);
  const mid = squad.filter(p => MID_POS(p.position)).slice(0, 4);
  const att = squad.filter(p => ATT_POS(p.position)).slice(0, 3);

  // Absorb any uncategorized players into the nearest line so all 11 show
  const placed = new Set([...gk, ...def, ...mid, ...att].map(p => p.id));
  const extras = squad.filter(p => !placed.has(p.id));
  for (const p of extras) {
    if (mid.length < 4) mid.push(p);
    else if (att.length < 3) att.push(p);
    else if (def.length < 4) def.push(p);
  }

  return { gk, def, mid, att };
}

function PitchPlayer({ player }) {
  const shortName = player.name.split(' ').pop();
  return (
    <div className="pitch-player">
      <PlayerImage player={player} className="pitch-player-img" />
      <span className="pitch-player-rating">{player.rating}</span>
      <span className="pitch-player-name">{shortName}</span>
    </div>
  );
}

function PitchRow({ players }) {
  if (!players.length) return null;
  return (
    <div className="pitch-row">
      {players.map(p => <PitchPlayer key={p.id} player={p} />)}
    </div>
  );
}

export function OpponentPitch({ opponentSquad }) {
  if (!opponentSquad || opponentSquad.length === 0) return null;

  const { gk, def, mid, att } = categorize(opponentSquad);

  return (
    <div className="opponent-pitch">
      <PitchRow players={att} />
      <PitchRow players={mid} />
      <PitchRow players={def} />
      <PitchRow players={gk}  />
    </div>
  );
}
