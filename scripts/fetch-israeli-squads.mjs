#!/usr/bin/env node
/**
 * fetch-israeli-squads.mjs  —  re-run any time: node scripts/fetch-israeli-squads.mjs
 *
 * Fetches Ligat Ha'al + Liga Leumit squads from Wikipedia and generates
 * src/data/israeliPlayers.js + src/fc_data_players/israeli_players.csv
 * Clubs without a Wikipedia squad section are filled from MANUAL_DATA.
 * League structure: 2025-26 season (14 Ha'al clubs, 16 Liga Leumit clubs)
 */

import { writeFileSync } from 'fs';
import { join, dirname }  from 'path';
import { fileURLToPath }  from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT     = join(__dirname, '../src/data/israeliPlayers.js');
const OUT_CSV = join(__dirname, '../src/fc_data_players/israeli_players.csv');

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

// ── Rating model v3 — Israeli football universe ───────────────────────────────
// Philosophy: this is a closed Israeli football universe, not global FIFA.
//   Active players cap at 90. 91+ is reserved for future Icons / Legends.
//
// Target bands (active players):
//   Ligat Ha'al  top stars   : 86–90
//   Ligat Ha'al  very good   : 81–85
//   Ligat Ha'al  starters    : 75–80
//   Ligat Ha'al  squad        : 68–74
//   Liga Leumit  top stars   : 74–76  (capped at 70)
//   Liga Leumit  starters    : 69–73  (capped at 70)
//   Liga Leumit  regular     : 63–68
//
// Formula:
//   leagueBase + clubBonus + posBonus + foreignBonus + squadBonus + noise(±6)
//   Hard cap: Ha'al ≤ 90, Leumit ≤ 70.

const TOP3_CLUBS  = new Set(["Maccabi Tel Aviv", "Maccabi Haifa", "Hapoel Be'er Sheva"]);
const MID_CLUBS   = new Set(["Hapoel Tel Aviv", "Beitar Jerusalem"]);
const LEUMIT_TOP  = new Set(["Hapoel Ra'anana", "Maccabi Herzliya"]);
const LEUMIT_MID  = new Set(["Hapoel Kfar Saba"]); // Ironi Tiberias promoted to Ha'al 2025-26

function getClubBonus(clubName, tier, isHaal) {
  // Ha'al clubs
  if (clubName === 'Maccabi Tel Aviv' || clubName === 'Maccabi Haifa') return 13;
  if (clubName === "Hapoel Be'er Sheva") return 12;
  if (MID_CLUBS.has(clubName))           return 10;
  if (clubName === 'Hapoel Haifa')        return 9;
  if (isHaal) return 5;                   // other Ha'al clubs
  // Leumit clubs
  if (LEUMIT_TOP.has(clubName)) return 5;
  if (LEUMIT_MID.has(clubName)) return 3;
  return 1;
}

// Attackers and wingers are the visible stars of Israeli football.
// GKs are premium recruits. Midfielders valuable. Defenders less so in card terms.
function getPosBonus(position) {
  if (['ST', 'LW', 'RW'].includes(position)) return 5;
  if (position === 'GK')                      return 3;
  if (['CM', 'CAM', 'LM', 'RM'].includes(position)) return 2;
  return 0; // CB, LB, RB, CDM
}

// Foreign players at top clubs are targeted quality recruits.
function getForeignBonus(natCode, clubName, isHaal) {
  if (natCode === 'ISR') return 0;
  if (!isHaal) return LEUMIT_TOP.has(clubName) ? 2 : 1;  // top Leumit gets +2 to reach 74-76
  return TOP3_CLUBS.has(clubName) ? 4 : 2;
}

// Squad number from Wikipedia: ≤5 = captain band, 6-11 = regular XI.
// Kept as a minor modifier only — position + club must dominate.
function getSquadBonus(no) {
  if (no <= 5)  return 3;
  if (no <= 11) return 1;
  if (no >= 20) return -2;
  return 0;
}

// ── Club list  (wiki = exact Wikipedia article title, url-encoded as needed) ──
// 2025-26 season: 14 Ligat Ha'al clubs + 16 Liga Leumit clubs
const CLUBS = [
  // ── Ligat Ha'al (14 clubs) ───────────────────────────────────────────────────
  { name:'Maccabi Tel Aviv',    wiki:"Maccabi_Tel_Aviv_F.C.",    sectionHint:32, league:"Ligat Ha'al", tier:'top' },
  { name:'Maccabi Haifa',       wiki:"Maccabi_Haifa_F.C.",       sectionHint:22, league:"Ligat Ha'al", tier:'top' },
  { name:"Hapoel Be'er Sheva",  wiki:null,                                       league:"Ligat Ha'al", tier:'top' }, // no squad section — MANUAL_DATA
  { name:'Hapoel Tel Aviv',     wiki:"Hapoel_Tel_Aviv_F.C.",     sectionHint:12, league:"Ligat Ha'al", tier:'mid' },
  { name:'Beitar Jerusalem',    wiki:"Beitar_Jerusalem_F.C.",    sectionHint:44, league:"Ligat Ha'al", tier:'mid' },
  { name:'Hapoel Haifa',        wiki:"Hapoel_Haifa_F.C.",        sectionHint:17, league:"Ligat Ha'al", tier:'mid' },
  { name:'Bnei Sakhnin',        wiki:"Bnei_Sakhnin_F.C.",        sectionHint:7,  league:"Ligat Ha'al", tier:'low' },
  { name:'Hapoel Jerusalem',    wiki:"Hapoel_Jerusalem_F.C.",    sectionHint:4,  league:"Ligat Ha'al", tier:'low' },
  { name:'Maccabi Netanya',     wiki:"Maccabi_Netanya_F.C.",     sectionHint:8,  league:"Ligat Ha'al", tier:'low' },
  { name:'Ironi Kiryat Shmona', wiki:"Hapoel_Ironi_Kiryat_Shmona_F.C.", sectionHint:3, league:"Ligat Ha'al", tier:'low' },
  { name:'Maccabi Bnei Raina',  wiki:"Maccabi_Bnei_Reineh_F.C.", sectionHint:3, league:"Ligat Ha'al", tier:'low' },
  { name:'Ironi Tiberias',      wiki:"Ironi_Tiberias_F.C.",      sectionHint:2,  league:"Ligat Ha'al", tier:'low' }, // promoted from Leumit 2025-26
  { name:'Hapoel Petah Tikva',  wiki:"Hapoel_Petah_Tikva_F.C.", sectionHint:9,  league:"Ligat Ha'al", tier:'low' }, // promoted from Leumit 2025-26
  { name:'F.C. Ashdod',         wiki:"F.C._Ashdod",             sectionHint:3,  league:"Ligat Ha'al", tier:'low' },
  // ── Liga Leumit (16 clubs) ───────────────────────────────────────────────────
  { name:"Hapoel Ra'anana",     wiki:"Hapoel_Ra'anana_A.F.C.",  sectionHint:3,  league:'Liga Leumit', tier:'leumit_top' },
  { name:'Maccabi Herzliya',    wiki:"Maccabi_Herzliya_F.C.",   sectionHint:2,  league:'Liga Leumit', tier:'leumit_top' },
  { name:'Hapoel Kfar Saba',    wiki:"Hapoel_Kfar_Saba_F.C.",  sectionHint:3,  league:'Liga Leumit', tier:'leumit_mid' },
  { name:'Maccabi Petah Tikva', wiki:"Maccabi_Petah_Tikva_F.C.", sectionHint:13, league:'Liga Leumit', tier:'leumit_mid' }, // relegated from Ha'al 2025-26
  { name:'Hapoel Acre',         wiki:"Hapoel_Acre_F.C.",        sectionHint:3,  league:'Liga Leumit', tier:'leumit_low' },
  { name:'Hapoel Nof HaGalil',  wiki:"Hapoel_Nof_HaGalil_F.C.", sectionHint:2, league:'Liga Leumit', tier:'leumit_low' },
  { name:'Hapoel Rishon LeZion',wiki:"Hapoel_Rishon_LeZion_F.C.", sectionHint:2, league:'Liga Leumit', tier:'leumit_low' },
  { name:'Hapoel Afula',        wiki:"Hapoel_Afula_F.C.",       sectionHint:2,  league:'Liga Leumit', tier:'leumit_low' },
  { name:'Hapoel Hadera',       wiki:"Hapoel_Hadera_F.C.",      sectionHint:3,  league:'Liga Leumit', tier:'leumit_low' }, // relegated from Ha'al 2025-26
  { name:'Bnei Yehuda',         wiki:"Bnei_Yehuda_Tel_Aviv_F.C.", sectionHint:6, league:'Liga Leumit', tier:'leumit_low' }, // relegated from Ha'al 2025-26
  { name:'F.C. Kiryat Yam',     wiki:"F.C._Kiryat_Yam",        sectionHint:2,  league:'Liga Leumit', tier:'leumit_low' }, // promoted from Liga Alef 2025-26
  { name:'Hapoel Kfar Shalem',  wiki:"Hapoel_Kfar_Shalem_F.C.", sectionHint:2, league:'Liga Leumit', tier:'leumit_low' },
  { name:'F.C. Kafr Qasim',     wiki:"F.C._Kafr_Qasim",        sectionHint:3,  league:'Liga Leumit', tier:'leumit_low' },
  { name:'Maccabi Jaffa',       wiki:"Maccabi_Jaffa_F.C.",      sectionHint:9,  league:'Liga Leumit', tier:'leumit_low' },
  { name:"Ironi Modi'in",       wiki:"Ironi_Modi'in_F.C.",      sectionHint:2,  league:'Liga Leumit', tier:'leumit_low' }, // promoted from Liga Alef 2025-26
  { name:'Hapoel Ramat Gan',    wiki:null,                                       league:'Liga Leumit', tier:'leumit_low' }, // no squad section — MANUAL_DATA
];

// ── Manual squads for clubs whose Wikipedia pages use non-standard formats ───────
const MANUAL_DATA = {
  // Hapoel Be'er Sheva — 2025-26 squad (Wikipedia page has no {{Fs player}} templates).
  // Sources: Transfermarkt + AiScore verified May 2026.
  "Hapoel Be'er Sheva": [
    { natCode:'ISR', wikiPos:'GK', no:1,  name:'Ofir Marciano',      onLoan:false },
    { natCode:'ISR', wikiPos:'GK', no:16, name:'Yonatan Shani',       onLoan:false },
    // Ben Gordin removed — now at Hapoel Jerusalem (correctly scraped from Wikipedia)
    { natCode:'ISR', wikiPos:'DF', no:2,  name:'Itay Kanarik',        onLoan:false },
    { natCode:'ISR', wikiPos:'DF', no:3,  name:'Or Blorian',          onLoan:false }, // pre-contract signed with Sporting KC (MLS), departs June 2026
    { natCode:'ISR', wikiPos:'DF', no:4,  name:'Matan Baltaxa',       onLoan:false },
    { natCode:'ISR', wikiPos:'DF', no:5,  name:'Roy Levy',            onLoan:false },
    { natCode:'ISR', wikiPos:'DF', no:6,  name:'Guy Mizrahi',         onLoan:false },
    { natCode:'ISR', wikiPos:'DF', no:20, name:'Ofir Davidzada',      onLoan:false },
    { natCode:'POR', wikiPos:'DF', no:21, name:'Miguel Vitor',        onLoan:false },
    { natCode:'POR', wikiPos:'DF', no:33, name:'Helder Lopes',        onLoan:false },
    { natCode:'SEN', wikiPos:'DF', no:22, name:'Djibril Diop',        onLoan:false },
    // MF order matters: mapPosition('MF', idx) → ['CDM','CM','CM','CAM','LM','RM'][idx%6]
    // idx 0→CDM, 1→CM, 2→CM, 3→CAM, 4→LM, 5→RM, 6→CDM, 7→CM
    { natCode:'GHA', wikiPos:'MF', no:8,  name:'Emmanuel Osai',       onLoan:false }, // idx 0 → CDM
    { natCode:'ZAM', wikiPos:'MF', no:17, name:'Kings Kangwa',        onLoan:false }, // idx 1 → CM (box-to-box CM)
    { natCode:'ISR', wikiPos:'MF', no:10, name:"Mohammad Kna'an",     onLoan:false }, // idx 2 → CM
    { natCode:'ISR', wikiPos:'MF', no:9,  name:'Eliel Peretz',        onLoan:false }, // idx 3 → CAM
    { natCode:'ISR', wikiPos:'MF', no:14, name:'Shay Elias',          onLoan:false }, // idx 4 → LM
    { natCode:'ISR', wikiPos:'MF', no:23, name:'Itay Hazut',          onLoan:false }, // idx 5 → RM
    { natCode:'BRA', wikiPos:'MF', no:11, name:'Lucas Ventura',       onLoan:false }, // idx 6 → CDM
    { natCode:'BUL', wikiPos:'MF', no:26, name:'Yoan Stoyanov',       onLoan:false }, // idx 7 → CM
    { natCode:'ISR', wikiPos:'FW', no:7,  name:'Dan Biton',           onLoan:false },
    { natCode:'ISR', wikiPos:'FW', no:19, name:'Zahi Ahmed',          onLoan:false },
    { natCode:'ISR', wikiPos:'FW', no:24, name:'Amir Ganah',          onLoan:false },
    { natCode:'JAM', wikiPos:'FW', no:18, name:'Javon East',          onLoan:false },
    { natCode:'ISR', wikiPos:'FW', no:27, name:'Muhammad Abu Rumi',   onLoan:false },
    { natCode:'SRB', wikiPos:'FW', no:25, name:'Igor Zlatanovic',     onLoan:false },
    { natCode:'ISR', wikiPos:'FW', no:29, name:'Samir Farhud',        onLoan:false },
    { natCode:'ISR', wikiPos:'FW', no:32, name:'Amit Ohana',          onLoan:false },
  ],
  // Hapoel Ramat Gan — Wikipedia page has no current squad section.
  // Sources: Transfermarkt squad 25/26, verified May 2026.
  'Hapoel Ramat Gan': [
    { natCode:'ISR', wikiPos:'GK', no:22, name:'Itamar Israeli',      onLoan:false },
    { natCode:'ISR', wikiPos:'GK', no:55, name:'Amit Reif',           onLoan:false },
    { natCode:'ISR', wikiPos:'GK', no:25, name:'Ben Parduaro',        onLoan:false },
    { natCode:'ISR', wikiPos:'DF', no:96, name:'Nir Bardea',          onLoan:false },
    { natCode:'GHA', wikiPos:'DF', no:4,  name:'Mohammed Adams',      onLoan:false },
    { natCode:'ISR', wikiPos:'DF', no:6,  name:'Moshe Meir',          onLoan:false },
    { natCode:'ISR', wikiPos:'DF', no:44, name:'Amit Banay',          onLoan:false },
    { natCode:'ISR', wikiPos:'DF', no:36, name:'Dudu Twitto',         onLoan:false },
    { natCode:'ISR', wikiPos:'DF', no:3,  name:'Fares Agbaria',       onLoan:false },
    { natCode:'ISR', wikiPos:'DF', no:2,  name:'Or Dadia',            onLoan:false },
    { natCode:'ISR', wikiPos:'DF', no:18, name:'Niv Sardal',          onLoan:false },
    { natCode:'ISR', wikiPos:'MF', no:12, name:'Jay Livne',           onLoan:false },
    { natCode:'ISR', wikiPos:'MF', no:8,  name:'Amit Meir',           onLoan:false },
    { natCode:'ISR', wikiPos:'MF', no:21, name:'Degats Worko',        onLoan:false },
    { natCode:'ISR', wikiPos:'MF', no:37, name:'Ido Mizrahi',         onLoan:false },
    { natCode:'ISR', wikiPos:'MF', no:24, name:'Nadav Markovitch',    onLoan:false },
    { natCode:'ISR', wikiPos:'MF', no:26, name:'Gidi Kanyuk',         onLoan:false },
    { natCode:'ISR', wikiPos:'MF', no:15, name:'Moti Barshazky',      onLoan:false },
    { natCode:'ISR', wikiPos:'MF', no:7,  name:'Ollie Cohen Bergman', onLoan:false },
    { natCode:'ISR', wikiPos:'FW', no:10, name:'Ravid Abergil',       onLoan:false },
    { natCode:'NGA', wikiPos:'FW', no:77, name:'Sodiq Fatai',         onLoan:false },
    { natCode:'ISR', wikiPos:'FW', no:14, name:'Hod Messika',         onLoan:false },
    { natCode:'ISR', wikiPos:'FW', no:9,  name:'Yuval Sason',         onLoan:false },
    { natCode:'NGA', wikiPos:'FW', no:13, name:'Ezekiel Henty',       onLoan:false },
    { natCode:'ISR', wikiPos:'FW', no:11, name:'David Asanka',        onLoan:false },
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

// position must be the resolved specific position (ST, CB, GK…).
// Noise ±6 creates spread within the same club/position band — necessary
// since Wikipedia squad numbers are the only quality proxy we have.
function generateRating({ name, natCode, no, onLoan }, club, position) {
  const isHaal = club.league?.includes("Ha'al");

  const leagueBase = isHaal ? 65 : 60;  // Ha'al base raised so top stars hit 86-90
  const clubBonus  = getClubBonus(club.name, club.tier, isHaal);
  const posBonus   = getPosBonus(position);
  const foreignBon = getForeignBonus(natCode, club.name, isHaal);
  const squadBonus = getSquadBonus(no);
  const loan       = onLoan ? -3 : 0;
  const noise      = hashNoise(name + club.name, 6); // ±6 for within-club spread

  const raw    = leagueBase + clubBonus + posBonus + foreignBon + squadBonus + loan + noise;
  const maxOvr = isHaal ? 90 : 76;  // active cap 90 (Ha'al), 76 (Leumit); icons 91+
  const minOvr = isHaal ? 58 : 50;
  return Math.max(minOvr, Math.min(maxOvr, raw));
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
        const rating = generateRating(p, club, pos);  // pos drives rating now
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
          _source:   'israeli',
          cardType:  'active',
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

  // ── Remove stale Wikipedia entries (player confirmed at a different club) ────
  // Format: 'PlayerName|ClubName' — removes the stale entry without touching the
  // correct entry at the player's actual current club.
  const STALE_EXCLUSIONS = new Set([
    'Mansour Badjie|Maccabi Jaffa',  // confirmed at Ironi Tiberias (Sofascore/BeSoccer May 2026)
  ]);
  const withoutStale = allEntries.filter(p => !STALE_EXCLUSIONS.has(`${p.name}|${p.club}`));
  const staleCount = allEntries.length - withoutStale.length;
  if (staleCount) console.log(`  Removed ${staleCount} stale entries (player at wrong club)`);

  // ── Remove exact duplicate (same name + same club) ─────────────────────────
  const seen = new Set();
  const deduped = withoutStale.filter(p => {
    const key = `${p.name}|${p.club}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const dupCount = withoutStale.length - deduped.length;
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
    `eaId:null,image:null,_source:'israeli',cardType:'active'}`
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

  console.log(`✅  JS  Written → ${OUT}`);

  // ── Write CSV ──────────────────────────────────────────────────────────────
  const CSV_HEADER = 'id,name,age,nationality,country,club,leagueName,position,alternativePositions,preferredFoot,marketValue,OVR,PAC,SHO,PAS,DRI,DEF,PHY,cardType,source';
  function escCsv(v) {
    const s = v == null ? '' : String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }
  const csvRows = deduped.map(p =>
    [p.id, p.name, '', p.nationality, p.country, p.club, p.leagueName, p.position,
     '', '', '', p.rating, p.stats.pac, p.stats.sho, p.stats.pas, p.stats.dri, p.stats.def, p.stats.phy,
     p.cardType, p._source].map(escCsv).join(',')
  );
  writeFileSync(OUT_CSV, [CSV_HEADER, ...csvRows].join('\n') + '\n', 'utf8');
  console.log(`✅  CSV Written → ${OUT_CSV}\n`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
