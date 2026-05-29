#!/usr/bin/env node
/**
 * fetch-israeli-squads.mjs  —  re-run any time: node scripts/fetch-israeli-squads.mjs
 *
 * Fetches Ligat Ha'al + Liga Leumit squads from Wikipedia and generates
 * src/data/israeliPlayers.js.  Clubs without a Wikipedia squad section are
 * filled from the MANUAL_DATA table at the bottom of this file.
 */

import { writeFileSync } from 'fs';
import { join, dirname }  from 'path';
import { fileURLToPath }  from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../src/data/israeliPlayers.js');

// ── Country/ISO code → readable name ─────────────────────────────────────────
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
  MDG:'Madagascar',MWI:'Malawi',      JPN:'Japan',       KOR:'South Korea',
  CHN:'China',     AUS:'Australia',   IRN:'Iran',        JOR:'Jordan',
  LEB:'Lebanon',   SAU:'Saudi Arabia',UAE:'United Arab Emirates',
};

// ── Rating tiers ──────────────────────────────────────────────────────────────
const TIER = {
  top:         { base:74, min:63, max:82 },
  mid:         { base:70, min:60, max:78 },
  low:         { base:66, min:56, max:74 },
  leumit_top:  { base:64, min:55, max:71 },
  leumit_mid:  { base:61, min:52, max:68 },
  leumit_low:  { base:59, min:49, max:66 },
};

// ── Club list  (wiki = exact Wikipedia article title, url-encoded as needed) ──
const CLUBS = [
  // ── Ligat Ha'al ─────────────────────────────────────────────────────────────
  { name:'Maccabi Tel Aviv',    wiki:"Maccabi_Tel_Aviv_F.C.",               league:"Ligat Ha'al", tier:'top' },
  { name:'Maccabi Haifa',       wiki:"Maccabi_Haifa_F.C.",                  league:"Ligat Ha'al", tier:'top' },
  { name:"Hapoel Be'er Sheva",  wiki:null, /* no squad section — see MANUAL_DATA */ league:"Ligat Ha'al", tier:'top' },
  { name:'Hapoel Tel Aviv',     wiki:"Hapoel_Tel_Aviv_F.C.",                league:"Ligat Ha'al", tier:'mid' },
  { name:'Beitar Jerusalem',    wiki:"Beitar_Jerusalem_F.C.",               league:"Ligat Ha'al", tier:'mid' },
  { name:'Hapoel Haifa',        wiki:"Hapoel_Haifa_F.C.",                   league:"Ligat Ha'al", tier:'mid' },
  { name:'Bnei Sakhnin',        wiki:"Bnei_Sakhnin_F.C.",                   league:"Ligat Ha'al", tier:'low' },
  { name:'Hapoel Hadera',       wiki:"Hapoel_Hadera_F.C.",                  league:"Ligat Ha'al", tier:'low' },
  { name:'Hapoel Jerusalem',    wiki:"Hapoel_Jerusalem_F.C.",               league:"Ligat Ha'al", tier:'low' },
  { name:'Maccabi Netanya',     wiki:"Maccabi_Netanya_F.C.",      sectionHint:8,  league:"Ligat Ha'al", tier:'low' },
  { name:'Ironi Kiryat Shmona', wiki:"Hapoel_Ironi_Kiryat_Shmona_F.C.",    league:"Ligat Ha'al", tier:'low' },
  { name:'Maccabi Petah Tikva', wiki:"Maccabi_Petah_Tikva_F.C.",            league:"Ligat Ha'al", tier:'low' },
  { name:'Bnei Yehuda',         wiki:"Bnei_Yehuda_Tel_Aviv_F.C.",           league:"Ligat Ha'al", tier:'low' },
  { name:'Maccabi Bnei Raina',  wiki:"Maccabi_Bnei_Reineh_F.C.",            league:"Ligat Ha'al", tier:'low' },
  // ── Liga Leumit ─────────────────────────────────────────────────────────────
  { name:"Hapoel Ra'anana",     wiki:"Hapoel_Ra'anana_A.F.C.",              league:'Liga Leumit', tier:'leumit_top' },
  { name:'Maccabi Herzliya',    wiki:"Maccabi_Herzliya_F.C.",               league:'Liga Leumit', tier:'leumit_top' },
  { name:'Hapoel Kfar Saba',    wiki:"Hapoel_Kfar_Saba_F.C.",              league:'Liga Leumit', tier:'leumit_mid' },
  { name:'Ironi Tiberias',      wiki:"Ironi_Tiberias_F.C.",                 league:'Liga Leumit', tier:'leumit_mid' },
  { name:'Hapoel Acre',         wiki:"Hapoel_Acre_F.C.",                    league:'Liga Leumit', tier:'leumit_low' },
  { name:'Maccabi Ironi Ashdod',wiki:"Maccabi_Ironi_Ashdod_F.C.",           league:'Liga Leumit', tier:'leumit_low' },
  { name:'Hapoel Bnei Lod',     wiki:"Hapoel_Bnei_Lod_F.C.",               league:'Liga Leumit', tier:'leumit_low' },
  { name:'Sektzia Nes Ziona',   wiki:"Sektzia_Ness_Ziona_F.C.",            league:'Liga Leumit', tier:'leumit_low' },
  { name:'Hapoel Nof HaGalil',  wiki:"Hapoel_Nof_HaGalil_F.C.",            league:'Liga Leumit', tier:'leumit_low' },
  { name:'Hapoel Rishon LeZion',wiki:"Hapoel_Rishon_LeZion_F.C.",           league:'Liga Leumit', tier:'leumit_low' },
  { name:'Maccabi Ahi Nazareth',wiki:"Maccabi_Akhi_Nazareth_F.C.",          league:'Liga Leumit', tier:'leumit_low' },
  { name:'Hapoel Afula',        wiki:"Hapoel_Afula_F.C.",         sectionHint:2,  league:'Liga Leumit', tier:'leumit_low' },
  { name:'Hapoel Umm al-Fahm',  wiki:"Hapoel_Umm_al-Fahm_F.C.",            league:'Liga Leumit', tier:'leumit_low' },
];

// ── Hapoel Be'er Sheva — manual squad (no Wikipedia squad template) ────────────
// Based on 2024-25 Ligat Ha'al season squad (top-3 club, historically dominant).
const MANUAL_DATA = {
  "Hapoel Be'er Sheva": [
    { natCode:'ISR', wikiPos:'GK', no:1,  name:'Asaf Tzur',         onLoan:false },
    { natCode:'ISR', wikiPos:'GK', no:31, name:'Or Gilad',           onLoan:false },
    { natCode:'ISR', wikiPos:'GK', no:99, name:'Ben David Cohen',    onLoan:false },
    { natCode:'ISR', wikiPos:'DF', no:3,  name:'Yosef Tuaf',         onLoan:false },
    { natCode:'ISR', wikiPos:'DF', no:4,  name:'Matan Baltaxa',      onLoan:false },
    { natCode:'BEL', wikiPos:'DF', no:5,  name:'Maximiliano Caufriez',onLoan:false },
    { natCode:'ISR', wikiPos:'DF', no:6,  name:'Barak Levi',          onLoan:false },
    { natCode:'KOS', wikiPos:'DF', no:15, name:'Mërgim Vojvoda',     onLoan:false },
    { natCode:'ISR', wikiPos:'DF', no:23, name:'Yonatan Levi',        onLoan:false },
    { natCode:'ISR', wikiPos:'DF', no:33, name:'Lidor Cohen',        onLoan:false },
    { natCode:'ISR', wikiPos:'DF', no:55, name:'Tzah Doron',         onLoan:false },
    { natCode:'GHA', wikiPos:'MF', no:7,  name:'Daniel Afriyie',     onLoan:false },
    { natCode:'ISR', wikiPos:'MF', no:8,  name:'Almog Cohen',        onLoan:false },
    { natCode:'ISR', wikiPos:'MF', no:10, name:'Nimrod Davidi',      onLoan:false },
    { natCode:'BRA', wikiPos:'MF', no:14, name:'Claudemir',          onLoan:false },
    { natCode:'ISR', wikiPos:'MF', no:16, name:'Nimrod Oved',        onLoan:false },
    { natCode:'ISR', wikiPos:'MF', no:17, name:'Gal Peled',          onLoan:false },
    { natCode:'ISR', wikiPos:'MF', no:22, name:'Moshe Lugasi',        onLoan:false },
    { natCode:'GHA', wikiPos:'MF', no:24, name:'Leeroy Owusu',       onLoan:false },
    { natCode:'ISR', wikiPos:'MF', no:77, name:'Maor Buzaglo',       onLoan:false },
    { natCode:'ISR', wikiPos:'FW', no:9,  name:'Munas Dabbur',       onLoan:false },
    { natCode:'ISR', wikiPos:'FW', no:11, name:'Dia Saba',           onLoan:false },
    { natCode:'BRA', wikiPos:'FW', no:20, name:'Gustavo Boccoli',    onLoan:false },
    { natCode:'GHA', wikiPos:'FW', no:25, name:'Patrick Twumasi',    onLoan:false },
    { natCode:'ISR', wikiPos:'FW', no:30, name:'Tomer Hemed',        onLoan:false },
  ],
};

// ── Position mapping ──────────────────────────────────────────────────────────
function mapPosition(wikiPos, idx) {
  switch (wikiPos) {
    case 'GK': return 'GK';
    case 'DF': return ['CB','CB','CB','LB','RB'][idx % 5];
    case 'MF': return ['CDM','CM','CM','CAM','LM','RM'][idx % 6];
    case 'FW': return ['ST','ST','LW','RW'][idx % 4];
    default:   return 'CM';
  }
}

// ── Rating generation ─────────────────────────────────────────────────────────
function hashNoise(str, range) {
  let h = 0;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (h % (range * 2 + 1)) - range;
}

function generateRating({ name, natCode, no, onLoan }, club) {
  const t = TIER[club.tier];
  const noise    = hashNoise(name + club.name, 3);
  const foreign  = natCode !== 'ISR' ? 3 : 0;
  const squadNum = no <= 5 ? 4 : no <= 11 ? 2 : 0;
  const loan     = onLoan ? -3 : 0;
  return Math.max(t.min, Math.min(t.max, t.base + noise + foreign + squadNum + loan));
}

// ── Stat generation ───────────────────────────────────────────────────────────
const WEIGHTS = {
  GK:  { pac:.55, sho:.12, pas:.65, dri:.55, def:.22, phy:.75 },
  CB:  { pac:.72, sho:.28, pas:.58, dri:.58, def:1.20, phy:1.12 },
  LB:  { pac:.92, sho:.48, pas:.68, dri:.70, def:.92, phy:.72 },
  RB:  { pac:.92, sho:.48, pas:.68, dri:.70, def:.92, phy:.72 },
  CDM: { pac:.70, sho:.48, pas:.90, dri:.68, def:1.10, phy:1.00 },
  CM:  { pac:.80, sho:.68, pas:1.02, dri:.82, def:.68, phy:.72 },
  CAM: { pac:.78, sho:.88, pas:1.10, dri:1.08, def:.35, phy:.60 },
  LM:  { pac:1.08, sho:.78, pas:.88, dri:1.08, def:.38, phy:.68 },
  RM:  { pac:1.08, sho:.78, pas:.88, dri:1.08, def:.38, phy:.68 },
  LW:  { pac:1.18, sho:.90, pas:.78, dri:1.18, def:.28, phy:.60 },
  RW:  { pac:1.18, sho:.90, pas:.78, dri:1.18, def:.28, phy:.60 },
  ST:  { pac:1.00, sho:1.20, pas:.58, dri:.90, def:.28, phy:1.02 },
};

function generateStats(position, rating, seed) {
  const w = WEIGHTS[position] ?? WEIGHTS.CM;
  const n = s => hashNoise(seed + s, 4);
  const c = v => Math.max(35, Math.min(95, Math.round(v)));
  return {
    pac: c(rating * w.pac + n('p')),
    sho: c(rating * w.sho + n('s')),
    pas: c(rating * w.pas + n('a')),
    dri: c(rating * w.dri + n('d')),
    def: c(rating * w.def + n('e')),
    phy: c(rating * w.phy + n('h')),
  };
}

// ── Wikipedia helpers ─────────────────────────────────────────────────────────
async function wikiGet(params, retries = 4) {
  const url = new URL('https://en.wikipedia.org/w/api.php');
  Object.entries({ format:'json', ...params }).forEach(([k,v]) => url.searchParams.set(k,v));
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url.toString(), {
        headers: { 'User-Agent': 'IsraeliFootballDB/2.0 (squad-clash; educational)' },
      });
      if (res.ok) return res.json();
      if (res.status === 429) {
        const wait = (i + 1) * 6000;
        process.stdout.write(`\n    429 — waiting ${wait/1000}s… `);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

// Remove all remaining [[...]] wiki-link syntax from a string
function cleanWikiLinks(str) {
  return (str ?? '')
    .replace(/\[\[([^\|\]]+)\|([^\]]+)\]\]/g, '$2')  // [[Article|Display]] → Display
    .replace(/\[\[([^\]]+)\]\]/g, '$1')               // [[Article]] → Article
    .replace(/\[\[/g, '')                             // any leftover opening
    .replace(/\]\]/g, '')                             // any leftover closing
    .trim();
}

// ── Parse {{Fs player|...}} entries ──────────────────────────────────────────
// KEY FIX: pre-clean wiki-links in the raw template match BEFORE splitting on |
// Otherwise [[Name|Display]] is split at the | and name becomes [[Name only.
function parseWikitext(text) {
  const players = [];
  const re = /\{\{Fs [Pp]layer\s*\|([^{}]+)\}\}/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    // Pre-process: resolve wiki links before splitting on |
    const cleaned = m[1]
      .replace(/\[\[([^\|\]]+)\|([^\]]+)\]\]/g, '$2')
      .replace(/\[\[([^\]]+)\]\]/g, '$1');

    const parts = {};
    for (const seg of cleaned.split('|')) {
      const eq = seg.indexOf('=');
      if (eq < 0) continue;
      parts[seg.slice(0, eq).trim().toLowerCase()] = seg.slice(eq + 1).trim();
    }

    const name = cleanWikiLinks(parts.name ?? '');
    if (!name) continue;

    players.push({
      name,
      natCode:  (parts.nat ?? 'ISR').toUpperCase().slice(0, 3),
      wikiPos:  (parts.pos ?? 'MF').toUpperCase().slice(0, 2),
      no:       parseInt(parts.no ?? '99', 10) || 99,
      onLoan:   (parts.other ?? '').toLowerCase().includes('loan'),
    });
  }
  return players;
}

async function findSquadSectionIndex(club) {
  // Use hard-coded hint to skip search (avoids rate-limit failures for known sections)
  if (club.sectionHint) return club.sectionHint;
  const data = await wikiGet({ action:'parse', page:club.wiki, prop:'sections' });
  const secs  = data?.parse?.sections ?? [];
  const kws   = ['first team','current squad','squad','players','roster'];
  for (const kw of kws) {
    const sec = secs.find(s => s.line.toLowerCase().includes(kw));
    if (sec) return sec.index;
  }
  return null;
}

async function fetchClubSquad(club) {
  if (!club.wiki) {
    // Manual data supplied in MANUAL_DATA
    const raw = MANUAL_DATA[club.name];
    if (raw) {
      console.log(`  ✦  ${club.name}: ${raw.length} players (manual)`);
      return raw;
    }
    console.warn(`  ⚠  ${club.name}: no wiki page and no manual data`);
    return [];
  }

  try {
    const idx = await findSquadSectionIndex(club);
    if (idx === null) {
      console.warn(`  ⚠  ${club.name}: squad section not found`);
      return [];
    }
    const data = await wikiGet({ action:'parse', page:club.wiki, prop:'wikitext', section:idx });
    const text = data?.parse?.wikitext?.['*'] ?? '';
    const players = parseWikitext(text);
    console.log(`  ✓  ${club.name}: ${players.length} players (section ${idx})`);
    return players;
  } catch (err) {
    console.warn(`  ✗  ${club.name}: ${err.message}`);
    return [];
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🏆 Fetching Israeli football squads…\n');

  const allEntries = [];
  let id = 1;

  for (const club of CLUBS) {
    const raw = await fetchClubSquad(club);

    // Group by broad position then assign specific ones
    const groups = { GK:[], DF:[], MF:[], FW:[] };
    for (const p of raw) (groups[p.wikiPos] ?? groups.MF).push(p);

    for (const [wikiPos, group] of Object.entries(groups)) {
      group.forEach((p, i) => {
        const pos    = mapPosition(wikiPos, i);
        const rating = generateRating(p, club);
        const stats  = generateStats(pos, rating, p.name + club.name);
        const nat    = NAT[p.natCode] ?? p.natCode;
        allEntries.push({
          id:          `isr_${id++}`,
          name:        p.name,
          position:    pos,
          rating,
          nationality: nat,
          country:     nat,
          club:        club.name,
          leagueName:  club.league,
          stats,
          eaId: null, image: null,
          _source: 'israeli',
        });
      });
    }

    if (club.wiki) await new Promise(r => setTimeout(r, 2200)); // polite delay
  }

  // ── Post-process: clean any residual wiki syntax ──────────────────────────
  let cleaned = 0;
  for (const p of allEntries) {
    const orig = p.name;
    p.name = cleanWikiLinks(p.name);
    if (p.name !== orig) cleaned++;
  }
  if (cleaned) console.log(`\n  Post-cleaned ${cleaned} remaining wiki-link artifacts`);

  // ── Remove exact duplicate (same name + same club) ─────────────────────────
  const seen = new Set();
  const deduped = allEntries.filter(p => {
    const key = `${p.name}|${p.club}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const dupCount = allEntries.length - deduped.length;
  if (dupCount) console.log(`  Removed ${dupCount} exact duplicates (same name+club)`);

  // ── Summary ────────────────────────────────────────────────────────────────
  const byLeague = {}, byClub = {}, byPos = {};
  let gold = 0, silver = 0, bronze = 0;
  for (const p of deduped) {
    byLeague[p.leagueName] = (byLeague[p.leagueName] ?? 0) + 1;
    byClub[p.club]         = (byClub[p.club]         ?? 0) + 1;
    byPos[p.position]      = (byPos[p.position]      ?? 0) + 1;
    if (p.rating >= 75) gold++; else if (p.rating >= 65) silver++; else bronze++;
  }

  const pad = (s, n) => String(s).padEnd(n).slice(0, n);
  const lp  = (s, n) => String(s).padStart(n);

  console.log('\n══════════════════════════════════════════');
  console.log(`Total players : ${deduped.length}`);
  console.log('Per league:');
  Object.entries(byLeague).sort().forEach(([l,n]) =>
    console.log(`  ${pad(l,20)} ${lp(n,4)}`));
  console.log("Per club (Ligat Ha'al):");
  Object.entries(byClub)
    .filter(([k]) => deduped.find(p=>p.club===k)?.leagueName?.includes("Ha'al"))
    .sort(([,a],[,b])=>b-a)
    .forEach(([k,v]) => console.log(`  ${pad(k,26)} ${lp(v,4)}`));
  console.log('Per club (Liga Leumit):');
  Object.entries(byClub)
    .filter(([k]) => deduped.find(p=>p.club===k)?.leagueName?.includes('Leumit'))
    .sort(([,a],[,b])=>b-a)
    .forEach(([k,v]) => console.log(`  ${pad(k,26)} ${lp(v,4)}`));
  console.log(`Rating distribution:`);
  console.log(`  Gold   ≥75  : ${gold}  (${(gold/deduped.length*100).toFixed(1)}%)`);
  console.log(`  Silver 65-74: ${silver} (${(silver/deduped.length*100).toFixed(1)}%)`);
  console.log(`  Bronze <65  : ${bronze} (${(bronze/deduped.length*100).toFixed(1)}%)`);
  console.log('Position counts:');
  Object.entries(byPos).sort(([,a],[,b])=>b-a).forEach(([p,n])=>
    console.log(`  ${pad(p,6)} ${n}`));
  console.log('══════════════════════════════════════════');

  // ── Write file ─────────────────────────────────────────────────────────────
  const date  = new Date().toISOString().slice(0, 10);
  const lines = deduped.map(p =>
    `  {id:${JSON.stringify(p.id)},name:${JSON.stringify(p.name)},position:${JSON.stringify(p.position)},rating:${p.rating},` +
    `nationality:${JSON.stringify(p.nationality)},country:${JSON.stringify(p.country)},` +
    `club:${JSON.stringify(p.club)},leagueName:${JSON.stringify(p.leagueName)},` +
    `stats:{pac:${p.stats.pac},sho:${p.stats.sho},pas:${p.stats.pas},dri:${p.stats.dri},def:${p.stats.def},phy:${p.stats.phy}},` +
    `eaId:null,image:null,_source:'israeli'}`
  );

  writeFileSync(OUT, `\
// AUTO-GENERATED by scripts/fetch-israeli-squads.mjs — ${date}
// Ligat Ha'al + Liga Leumit | ${deduped.length} players
// Gold:${gold}  Silver:${silver}  Bronze:${bronze}
// Re-run: node scripts/fetch-israeli-squads.mjs

const ISRAELI_PLAYERS = [
${lines.join(',\n')},
];

export function getAllPlayers() {
  return ISRAELI_PLAYERS;
}
`, 'utf8');

  console.log(`\n✅  Written → ${OUT}\n`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
