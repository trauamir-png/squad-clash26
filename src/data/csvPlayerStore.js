import csvRaw from '../fc_data_players/male_players.csv?raw';

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
  .filter(r => r.Name && r.OVR && !isNaN(parseInt(r.OVR, 10)))
  .map((r, idx) => ({
    id: `csv_${r['Unnamed: 0'] || idx}`,
    name: r.Name,
    position: r.Position || 'CM',
    rating: parseInt(r.OVR, 10),
    nationality: r.Nation || 'Unknown',
    country: r.Nation || 'Unknown',
    club: r.Team || 'Unknown',
    leagueName: r.League || 'Unknown',
    stats: {
      pac: parseInt(r.PAC, 10) || 50,
      sho: parseInt(r.SHO, 10) || 50,
      pas: parseInt(r.PAS, 10) || 50,
      dri: parseInt(r.DRI, 10) || 50,
      def: parseInt(r.DEF, 10) || 50,
      phy: parseInt(r.PHY, 10) || 50,
    },
    image: `https://ui-avatars.com/api/?name=${encodeURIComponent(r.Name)}&size=40&background=random`,
    eaId:  (r.url || '').split('/').pop() || null,
    _source: 'csv',
  }));

// Report on load
const ratings = allPlayers.map(p => p.rating);
const dist = { '0-60': 0, '61-70': 0, '71-80': 0, '81-90': 0, '91+': 0 };
ratings.forEach(r => {
  if (r <= 60) dist['0-60']++;
  else if (r <= 70) dist['61-70']++;
  else if (r <= 80) dist['71-80']++;
  else if (r <= 90) dist['81-90']++;
  else dist['91+']++;
});
console.log(
  '%c📊 CSV Player Store loaded', 'color: #4ade80; font-weight: bold',
  '\n  Total players:', allPlayers.length,
  '\n  Lowest OVR:', Math.min(...ratings),
  '\n  Highest OVR:', Math.max(...ratings),
  '\n  Distribution:', dist,
);
console.table(
  allPlayers.slice(0, 5).map(p => ({
    name: p.name,
    position: p.position,
    rating: p.rating,
    club: p.club,
    league: p.leagueName,
    nationality: p.nationality,
  }))
);

export function getAllPlayers() {
  return allPlayers;
}
