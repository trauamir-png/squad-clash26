const GROUPS = {
  GK:  ['GK'],
  DEF: ['CB', 'LB', 'RB', 'LWB', 'RWB'],
  MID: ['CDM', 'CM', 'CAM', 'LM', 'RM'],
  ATT: ['LW', 'RW', 'ST', 'CF'],
};

const LEFT  = new Set(['LB', 'LWB', 'LM', 'LW']);
const RIGHT = new Set(['RB', 'RWB', 'RM', 'RW']);

function getGroup(pos) {
  for (const [group, positions] of Object.entries(GROUPS)) {
    if (positions.includes(pos)) return group;
  }
  return null;
}

// Returns 100 | 85 | 70 | 50
export function getPositionFit(playerPos, slotPos) {
  if (!playerPos || !slotPos) return 50;
  if (playerPos === slotPos) return 100;

  const pg = getGroup(playerPos);
  const sg = getGroup(slotPos);

  if (pg === 'GK' || sg === 'GK') return 50;
  if (pg === sg) return 85;

  // Same lateral side across groups (e.g. LB ↔ LW)
  if ((LEFT.has(playerPos)  && LEFT.has(slotPos)) ||
      (RIGHT.has(playerPos) && RIGHT.has(slotPos))) return 70;

  return 50;
}

// Returns null (perfect) or { text, color } for badge display
export function getFitBadge(score) {
  if (score === 100) return null;
  if (score >= 85)   return { text: '85%', color: '#ca8a04' }; // amber
  if (score >= 70)   return { text: '70%', color: '#ea580c' }; // orange
  return                    { text: '50%', color: '#dc2626' }; // red
}
