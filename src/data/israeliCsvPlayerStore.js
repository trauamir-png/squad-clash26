import csvRaw from '../fc_data_players/israeli_players.csv?raw';

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(text) {
  const lines = text.split('\n');
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((h, idx) => { row[h] = values[idx] ?? ''; });
    rows.push(row);
  }
  return rows;
}

const allPlayers = parseCSV(csvRaw)
  .filter(r => r.id && r.OVR && !isNaN(parseInt(r.OVR, 10)))
  .map(r => ({
    id:           r.id,
    name:         r.name,
    age:          r.age ? parseInt(r.age, 10) : null,
    position:     r.position || 'CM',
    rating:       parseInt(r.OVR, 10),
    nationality:  r.nationality || 'Unknown',
    country:      r.country    || r.nationality || 'Unknown',
    club:         r.club       || 'Unknown',
    leagueName:   r.leagueName || 'Unknown',
    alternativePositions: r.alternativePositions || null,
    preferredFoot:        r.preferredFoot        || null,
    marketValue:          r.marketValue ? parseInt(r.marketValue, 10) : null,
    stats: {
      pac: parseInt(r.PAC, 10) || 50,
      sho: parseInt(r.SHO, 10) || 50,
      pas: parseInt(r.PAS, 10) || 50,
      dri: parseInt(r.DRI, 10) || 50,
      def: parseInt(r.DEF, 10) || 50,
      phy: parseInt(r.PHY, 10) || 50,
    },
    eaId:     null,
    image:    null,
    cardType: r.cardType || 'active',
    _source:  'israeli',
  }));

const ratings = allPlayers.map(p => p.rating);
const dist = { '≤60': 0, '61-74': 0, '75-84': 0, '85+': 0 };
ratings.forEach(r => {
  if (r <= 60)       dist['≤60']++;
  else if (r <= 74)  dist['61-74']++;
  else if (r <= 84)  dist['75-84']++;
  else               dist['85+']++;
});
console.log(
  '%c📊 Israeli CSV Player Store loaded', 'color: #4ade80; font-weight: bold',
  '\n  Total players:', allPlayers.length,
  '\n  OVR range:', Math.min(...ratings), '–', Math.max(...ratings),
  '\n  Distribution:', dist,
  '\n  First player:', allPlayers[0]?.name, '|', allPlayers[0]?.position, '|', allPlayers[0]?.rating,
);

export function getAllPlayers() {
  return allPlayers;
}
