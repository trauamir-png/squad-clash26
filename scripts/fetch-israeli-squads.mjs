#!/usr/bin/env node
/**
 * fetch-israeli-squads.mjs
 * Fetches Ligat Ha'al + Liga Leumit squads from Wikipedia and
 * generates src/data/israeliPlayers.js
 *
 * Run:  node scripts/fetch-israeli-squads.mjs
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../src/data/israeliPlayers.js');

// ── Wikipedia country/nationality code → readable name ───────────────────────
const NAT = {
  ISR:'Israel',    BRA:'Brazil',      ARG:'Argentina',   URU:'Uruguay',
  COL:'Colombia',  VEN:'Venezuela',   CHI:'Chile',       ECU:'Ecuador',
  PAR:'Paraguay',  PER:'Peru',        BOL:'Bolivia',     FRA:'France',
  ENG:'England',   ESP:'Spain',       ITA:'Italy',       GER:'Germany',
  NED:'Netherlands', POR:'Portugal',  BEL:'Belgium',     AUT:'Austria',
  SUI:'Switzerland', DEN:'Denmark',   SWE:'Sweden',      NOR:'Norway',
  FIN:'Finland',   POL:'Poland',      CZE:'Czech Republic', SVK:'Slovakia',
  HUN:'Hungary',   ROM:'Romania',     BUL:'Bulgaria',    GRE:'Greece',
  TUR:'Turkey',    CRO:'Croatia',     SRB:'Serbia',      BIH:'Bosnia',
  MNE:'Montenegro',ALB:'Albania',     KOS:'Kosovo',      MKD:'North Macedonia',
  RUS:'Russia',    UKR:'Ukraine',     GEO:'Georgia',     ARM:'Armenia',
  AZE:'Azerbaijan',KAZ:'Kazakhstan',  MDA:'Moldova',     BLR:'Belarus',
  EST:'Estonia',   LAT:'Latvia',      LTU:'Lithuania',   SCO:'Scotland',
  WAL:'Wales',     IRL:'Ireland',     NIR:'Northern Ireland',
  USA:'United States', MEX:'Mexico',  CRC:'Costa Rica',  HON:'Honduras',
  PAN:'Panama',    JAM:'Jamaica',     TRI:'Trinidad and Tobago',
  NGA:'Nigeria',   NGR:'Nigeria',     GHA:'Ghana',       CMR:'Cameroon',
  SEN:'Senegal',   CIV:"Côte d'Ivoire", MLI:'Mali',     BFA:'Burkina Faso',
  GUI:'Guinea',    GNB:'Guinea-Bissau', GAM:'Gambia',   BEN:'Benin',
  TOG:'Togo',      GAB:'Gabon',       COD:'DR Congo',    ANG:'Angola',
  MOZ:'Mozambique',ZIM:'Zimbabwe',    ZAM:'Zambia',      KEN:'Kenya',
  ETH:'Ethiopia',  TAN:'Tanzania',    MAR:'Morocco',     TUN:'Tunisia',
  ALG:'Algeria',   EGY:'Egypt',       CPV:'Cape Verde',  GNE:'Equatorial Guinea',
  MDG:'Madagascar',MWI:'Malawi',      LBA:'Libya',       SLE:'Sierra Leone',
  LBR:'Liberia',   JPN:'Japan',       KOR:'South Korea', CHN:'China',
  AUS:'Australia', NZL:'New Zealand', IRN:'Iran',        JOR:'Jordan',
  LEB:'Lebanon',   SYR:'Syria',       IRQ:'Iraq',        SAU:'Saudi Arabia',
  UAE:'United Arab Emirates', QAT:'Qatar',
};

// ── Rating tiers ──────────────────────────────────────────────────────────────
// Rating tiers — tuned so packs have a playable distribution:
//   Gold ≥75 ~15%, Silver 65-74 ~55%, Bronze ≤64 ~30%
const TIER = {
  top:         { base:74, min:63, max:82 },  // Maccabi TA / Haifa / Beer Sheva
  mid:         { base:70, min:60, max:78 },  // Hapoel TA / Beitar / Hapoel Haifa
  low:         { base:66, min:56, max:74 },  // Rest of Ligat Ha'al
  leumit_top:  { base:64, min:55, max:71 },  // Top Liga Leumit clubs
  leumit_mid:  { base:61, min:52, max:68 },
  leumit_low:  { base:59, min:49, max:66 },
};

// ── Club list ─────────────────────────────────────────────────────────────────
const CLUBS = [
  // Ligat Ha'al
  { name:'Maccabi Tel Aviv',    wiki:'Maccabi_Tel_Aviv_F.C.',              league:"Ligat Ha'al", tier:'top' },
  { name:'Maccabi Haifa',       wiki:'Maccabi_Haifa_F.C.',                 league:"Ligat Ha'al", tier:'top' },
  { name:'Hapoel Beer Sheva',   wiki:'Hapoel_Beer_Sheva_F.C.',             league:"Ligat Ha'al", tier:'top' },
  { name:'Hapoel Tel Aviv',     wiki:'Hapoel_Tel_Aviv_F.C.',               league:"Ligat Ha'al", tier:'mid' },
  { name:'Beitar Jerusalem',    wiki:'Beitar_Jerusalem_F.C.',              league:"Ligat Ha'al", tier:'mid' },
  { name:'Hapoel Haifa',        wiki:'Hapoel_Haifa_F.C.',                  league:"Ligat Ha'al", tier:'mid' },
  { name:'Bnei Sakhnin',        wiki:'Bnei_Sakhnin_F.C.',                  league:"Ligat Ha'al", tier:'low' },
  { name:'Hapoel Hadera',       wiki:'Hapoel_Hadera_F.C.',                 league:"Ligat Ha'al", tier:'low' },
  { name:'Hapoel Jerusalem',    wiki:'Hapoel_Jerusalem_F.C.',              league:"Ligat Ha'al", tier:'low' },
  { name:'Maccabi Netanya',     wiki:'Maccabi_Netanya_F.C.',               league:"Ligat Ha'al", tier:'low' },
  { name:'Ironi Kiryat Shmona', wiki:'Hapoel_Ironi_Kiryat_Shmona_F.C.',   league:"Ligat Ha'al", tier:'low' },
  { name:'Maccabi Petah Tikva', wiki:'Maccabi_Petah_Tikva_F.C.',           league:"Ligat Ha'al", tier:'low' },
  { name:'Bnei Yehuda',         wiki:'Bnei_Yehuda_Tel_Aviv_F.C.',          league:"Ligat Ha'al", tier:'low' },
  { name:'Maccabi Bnei Raina',  wiki:'Maccabi_Bnei_Raina_F.C.',            league:"Ligat Ha'al", tier:'low' },
  // Liga Leumit
  { name:"Hapoel Ra'anana",     wiki:"Hapoel_Ra'anana_F.C.",               league:'Liga Leumit', tier:'leumit_top' },
  { name:'Maccabi Herzliya',    wiki:'Maccabi_Herzliya_F.C.',              league:'Liga Leumit', tier:'leumit_top' },
  { name:'Hapoel Kfar Saba',    wiki:'Hapoel_Kfar_Saba_F.C.',             league:'Liga Leumit', tier:'leumit_mid' },
  { name:'Ironi Tiberias',      wiki:'Ironi_Tiberias_F.C.',                league:'Liga Leumit', tier:'leumit_mid' },
  { name:'Hapoel Acre',         wiki:'Hapoel_Acre_F.C.',                   league:'Liga Leumit', tier:'leumit_low' },
  { name:'Maccabi Ironi Ashdod',wiki:'Maccabi_Ironi_Ashdod_F.C.',          league:'Liga Leumit', tier:'leumit_low' },
  { name:'Bnei Lod',            wiki:'Bnei_Lod_F.C.',                      league:'Liga Leumit', tier:'leumit_low' },
  { name:'Sektzia Nes Ziona',   wiki:'Sektzia_Nes_Ziona_F.C.',            league:'Liga Leumit', tier:'leumit_low' },
  { name:'Hapoel Nof HaGalil',  wiki:'Hapoel_Nof_HaGalil_F.C.',           league:'Liga Leumit', tier:'leumit_low' },
  { name:'Hapoel Rishon LeZion',wiki:'Hapoel_Rishon_LeZion_F.C.',          league:'Liga Leumit', tier:'leumit_low' },
  { name:'Maccabi Ahi Nazareth',wiki:'Maccabi_Ahi_Nazareth_F.C.',          league:'Liga Leumit', tier:'leumit_low' },
  { name:'Hapoel Afula',        wiki:'Hapoel_Afula_F.C.',                  league:'Liga Leumit', tier:'leumit_low' },
  { name:'Hapoel Umm al-Fahm',  wiki:'Hapoel_Umm_al-Fahm_F.C.',           league:'Liga Leumit', tier:'leumit_low' },
];

// ── Position mapping ──────────────────────────────────────────────────────────
// Wikipedia gives broad positions (GK/DF/MF/FW).
// We assign specific game positions deterministically based on the player's
// index within their positional group.
function mapPosition(wikiPos, groupIndex) {
  switch (wikiPos) {
    case 'GK': return 'GK';
    case 'DF': {
      const map = ['CB','CB','CB','LB','RB'];   // 60% CB, 20% LB, 20% RB
      return map[groupIndex % map.length];
    }
    case 'MF': {
      const map = ['CDM','CM','CM','CAM','LM','RM'];  // 17/33/17/17/8/8%
      return map[groupIndex % map.length];
    }
    case 'FW': {
      const map = ['ST','ST','LW','RW'];         // 50% ST, 25% LW, 25% RW
      return map[groupIndex % map.length];
    }
    default: return 'CM';
  }
}

// ── Rating generation ─────────────────────────────────────────────────────────
// Deterministic "random" from a string seed — same name always gives same noise.
function hashNoise(str, range) {
  let h = 0;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (h % (range * 2 + 1)) - range;   // −range … +range
}

function generateRating(player, club) {
  const t     = TIER[club.tier];
  const noise = hashNoise(player.name + club.name, 3);         // ±3
  const foreign  = player.natCode !== 'ISR' ? 3 : 0;
  const squadNum = (player.no || 99) <= 5 ? 4 : (player.no || 99) <= 11 ? 2 : 0;
  const loanMalus = player.onLoan ? -3 : 0;
  const raw = t.base + noise + foreign + squadNum + loanMalus;
  return Math.max(t.min, Math.min(t.max, raw));
}

// ── Stat generation ───────────────────────────────────────────────────────────
const POS_WEIGHTS = {
  GK:  { pac:0.55, sho:0.12, pas:0.65, dri:0.55, def:0.22, phy:0.75 },
  CB:  { pac:0.72, sho:0.28, pas:0.58, dri:0.58, def:1.20, phy:1.12 },
  LB:  { pac:0.92, sho:0.48, pas:0.68, dri:0.70, def:0.92, phy:0.72 },
  RB:  { pac:0.92, sho:0.48, pas:0.68, dri:0.70, def:0.92, phy:0.72 },
  CDM: { pac:0.70, sho:0.48, pas:0.90, dri:0.68, def:1.10, phy:1.00 },
  CM:  { pac:0.80, sho:0.68, pas:1.02, dri:0.82, def:0.68, phy:0.72 },
  CAM: { pac:0.78, sho:0.88, pas:1.10, dri:1.08, def:0.35, phy:0.60 },
  LM:  { pac:1.08, sho:0.78, pas:0.88, dri:1.08, def:0.38, phy:0.68 },
  RM:  { pac:1.08, sho:0.78, pas:0.88, dri:1.08, def:0.38, phy:0.68 },
  LW:  { pac:1.18, sho:0.90, pas:0.78, dri:1.18, def:0.28, phy:0.60 },
  RW:  { pac:1.18, sho:0.90, pas:0.78, dri:1.18, def:0.28, phy:0.60 },
  ST:  { pac:1.00, sho:1.20, pas:0.58, dri:0.90, def:0.28, phy:1.02 },
};

function generateStats(position, rating) {
  const w = POS_WEIGHTS[position] ?? POS_WEIGHTS.CM;
  const clamp = v => Math.max(35, Math.min(95, Math.round(v)));
  const n = s => hashNoise(position + rating + s, 4);  // ±4 per stat
  return {
    pac: clamp(rating * w.pac + n('p')),
    sho: clamp(rating * w.sho + n('s')),
    pas: clamp(rating * w.pas + n('a')),
    dri: clamp(rating * w.dri + n('d')),
    def: clamp(rating * w.def + n('e')),
    phy: clamp(rating * w.phy + n('h')),
  };
}

// ── Wikipedia fetch helpers ───────────────────────────────────────────────────
async function wikiGet(params, retries = 3) {
  const url = new URL('https://en.wikipedia.org/w/api.php');
  Object.entries({ format:'json', ...params }).forEach(([k,v]) => url.searchParams.set(k,v));
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'IsraeliFootballDB/1.0 (squad-clash game; educational)' },
    });
    if (res.ok) return res.json();
    if (res.status === 429) {
      const wait = (attempt + 1) * 4000;
      console.log(`    rate-limited, waiting ${wait/1000}s…`);
      await new Promise(r => setTimeout(r, wait));
      continue;
    }
    throw new Error(`HTTP ${res.status}`);
  }
  throw new Error('Max retries exceeded');
}

async function findSquadSection(wikiPage) {
  const data = await wikiGet({ action:'parse', page:wikiPage, prop:'sections' });
  const secs = data?.parse?.sections ?? [];
  // Look for "First team", "Current squad", "Squad" etc.
  const keywords = ['first team','current squad','squad','first-team'];
  for (const kw of keywords) {
    const sec = secs.find(s => s.line.toLowerCase().includes(kw));
    if (sec) return sec.index;
  }
  return null;
}

async function fetchSquadWikitext(wikiPage, sectionIdx) {
  const data = await wikiGet({ action:'parse', page:wikiPage, prop:'wikitext', section:sectionIdx });
  return data?.parse?.wikitext?.['*'] ?? '';
}

// Parse {{Fs player|no=N|nat=XX|name=Name|pos=POS|other=...}} entries
function parseWikitext(text) {
  const players = [];
  const re = /\{\{Fs [Pp]layer\s*\|([^}]+)\}\}/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const parts = Object.fromEntries(
      m[1].split('|').map(p => {
        const [k, ...v] = p.trim().split('=');
        return [k.trim().toLowerCase(), v.join('=').trim()];
      })
    );
    // Prefer display text (after pipe) in wiki links: [[Article|Display]] → Display
    // Falls back to article title: [[Article]] → Article
    const rawName = parts.name ?? '';
    const name = rawName
      .replace(/\[\[([^\|\]]+)\|([^\]]+)\]\]/g, '$2')   // [[Article|Display]] → Display
      .replace(/\[\[([^\]]+)\]\]/g, '$1')                // [[Article]] → Article
      .trim();
    if (!name) continue;

    players.push({
      name,
      natCode: (parts.nat ?? 'ISR').toUpperCase(),
      wikiPos: (parts.pos ?? 'MF').toUpperCase(),
      no:      parseInt(parts.no ?? '99', 10) || 99,
      onLoan:  (parts.other ?? '').toLowerCase().includes('loan'),
    });
  }
  return players;
}

async function fetchClubSquad(club) {
  try {
    const sectionIdx = await findSquadSection(club.wiki);
    if (sectionIdx === null) {
      console.warn(`  ⚠  ${club.name}: no squad section found on Wikipedia`);
      return [];
    }
    const text = await fetchSquadWikitext(club.wiki, sectionIdx);
    const players = parseWikitext(text);
    console.log(`  ✓  ${club.name}: ${players.length} players (section ${sectionIdx})`);
    return players;
  } catch (err) {
    console.warn(`  ✗  ${club.name}: ${err.message}`);
    return [];
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🏆 Fetching Israeli football squads from Wikipedia...\n');

  const allEntries = [];
  let idCounter = 1;

  for (const club of CLUBS) {
    const rawPlayers = await fetchClubSquad(club);

    // Group players by broad position, then assign specific positions
    const byPos = { GK:[], DF:[], MF:[], FW:[] };
    for (const p of rawPlayers) {
      (byPos[p.wikiPos] ?? byPos.MF).push(p);
    }

    for (const [wikiPos, group] of Object.entries(byPos)) {
      group.forEach((p, i) => {
        const position = mapPosition(wikiPos, i);
        const rating   = generateRating(p, club);
        const stats    = generateStats(position, rating);
        const natName  = NAT[p.natCode] ?? p.natCode;

        allEntries.push({
          id:          `isr_${idCounter++}`,
          name:        p.name,
          position,
          rating,
          nationality: natName,
          country:     natName,
          club:        club.name,
          leagueName:  club.league,
          stats,
          eaId:        null,
          image:       null,
          _source:     'israeli',
        });
      });
    }

    // Polite delay — Wikipedia allows ~1 req/sec for anonymous users; 2s is safe
    await new Promise(r => setTimeout(r, 2000));
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const byLeague   = {};
  const byClub     = {};
  const byPos      = {};
  const ratingDist = { bronze:0, silver:0, gold:0 };

  for (const p of allEntries) {
    byLeague[p.leagueName] = (byLeague[p.leagueName] ?? 0) + 1;
    byClub[p.club]         = (byClub[p.club]         ?? 0) + 1;
    byPos[p.position]      = (byPos[p.position]      ?? 0) + 1;
    if      (p.rating >= 75) ratingDist.gold++;
    else if (p.rating >= 65) ratingDist.silver++;
    else                     ratingDist.bronze++;
  }

  console.log('\n──────────────────────────────────────────');
  console.log(`Total players: ${allEntries.length}`);
  console.log('\nPer league:');
  Object.entries(byLeague).sort().forEach(([k,v]) => console.log(`  ${k}: ${v}`));
  console.log('\nPer club (Ligat Ha\'al):');
  Object.entries(byClub)
    .filter(([k]) => allEntries.find(p=>p.club===k)?.leagueName?.includes("Ha'al"))
    .sort(([,a],[,b])=>b-a)
    .forEach(([k,v]) => console.log(`  ${k}: ${v}`));
  console.log('\nPer club (Liga Leumit):');
  Object.entries(byClub)
    .filter(([k]) => allEntries.find(p=>p.club===k)?.leagueName?.includes('Leumit'))
    .sort(([,a],[,b])=>b-a)
    .forEach(([k,v]) => console.log(`  ${k}: ${v}`));
  console.log('\nRating distribution:');
  console.log(`  Gold   (≥75): ${ratingDist.gold}`);
  console.log(`  Silver (65-74): ${ratingDist.silver}`);
  console.log(`  Bronze (≤64): ${ratingDist.bronze}`);
  console.log('\nPosition distribution:');
  Object.entries(byPos).sort().forEach(([k,v]) => console.log(`  ${k}: ${v}`));
  console.log('──────────────────────────────────────────');

  // ── Write output file ───────────────────────────────────────────────────────
  const generated = new Date().toISOString().slice(0,10);
  const lines = allEntries.map(p => `  {
    id:${JSON.stringify(p.id)}, name:${JSON.stringify(p.name)}, position:${JSON.stringify(p.position)}, rating:${p.rating},
    nationality:${JSON.stringify(p.nationality)}, country:${JSON.stringify(p.country)},
    club:${JSON.stringify(p.club)}, leagueName:${JSON.stringify(p.leagueName)},
    stats:{pac:${p.stats.pac},sho:${p.stats.sho},pas:${p.stats.pas},dri:${p.stats.dri},def:${p.stats.def},phy:${p.stats.phy}},
    eaId:null, image:null, _source:'israeli',
  }`);

  const fileContent = `// AUTO-GENERATED by scripts/fetch-israeli-squads.mjs — ${generated}
// Ligat Ha'al + Liga Leumit player database
// ${allEntries.length} players | Gold:${ratingDist.gold} Silver:${ratingDist.silver} Bronze:${ratingDist.bronze}
// Re-run: node scripts/fetch-israeli-squads.mjs

${Object.entries(byLeague).map(([l,n])=>`// ${l}: ${n} players`).join('\n')}

const ISRAELI_PLAYERS = [
${lines.join(',\n')},
];

export function getAllPlayers() {
  return ISRAELI_PLAYERS;
}
`;

  writeFileSync(OUT, fileContent, 'utf8');
  console.log(`\n✅ Written to ${OUT}\n`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
