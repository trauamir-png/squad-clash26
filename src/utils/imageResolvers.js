import { getAllPlayers } from '../data/csvPlayerStore';

// ─── Shared normalisation ─────────────────────────────────────────────────────

const CHAR_MAP = [
  [/[øØ]/g, 'o'],
  [/[æÆ]/g, 'ae'],
  [/ß/g,    'ss'],
];

export function normalizeKey(str) {
  if (!str) return '';
  let s = str;
  for (const [re, sub] of CHAR_MAP) s = s.replace(re, sub);
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // strip combining diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ');
}

export const normalizePlayerName = normalizeKey;


// ─── Player images ────────────────────────────────────────────────────────────

function buildPlayerCdnUrl(eaId) {
  return `https://cdn.futbin.com/content/fifa24/img/players/${eaId}.png`;
}

const PLAYER_IMAGE_MAP = {};

let _eaIdByPlayerId = null;
function getEaIdIndex() {
  if (!_eaIdByPlayerId) {
    _eaIdByPlayerId = new Map(getAllPlayers().map(p => [p.id, p.eaId]));
  }
  return _eaIdByPlayerId;
}

export function getPlayerImage(player) {
  if (!player) return null;
  const key = normalizeKey(player.name);
  if (PLAYER_IMAGE_MAP[key]) return PLAYER_IMAGE_MAP[key];
  const eaId = player.eaId || getEaIdIndex().get(player.id);
  if (eaId) return buildPlayerCdnUrl(eaId);
  return player.image ?? null;
}


// ─── Club logos — static FUTBin map ──────────────────────────────────────────
// Keys are normalizeKey(clubName). Values are EA Sports club IDs for FUTBin CDN.
// Includes CSV-exact name aliases so short/abbreviated names in the dataset match.

function buildClubLogoUrl(eaClubId) {
  return `https://cdn.futbin.com/content/fifa24/img/clubs/${eaClubId}.png`;
}

const CLUB_ID_MAP = {
  // ── Premier League ───────────────────────────────────────────────────────────
  'arsenal':                    1,
  'tottenham hotspur':          5,
  'tottenham':                  5,
  'spurs':                      5,    // CSV: "Spurs"
  'everton':                    6,
  'liverpool':                  9,
  'manchester city':            10,
  'manchester united':          11,
  'man utd':                    11,   // CSV: "Man Utd"
  'chelsea':                    18,
  'southampton':                20,
  'newcastle united':           4,
  'newcastle utd':              4,    // CSV: "Newcastle Utd"
  'nottingham forest':          12,
  'nottm forest':               12,
  'nott m forest':              12,   // normalizeKey("Nott'm Forest")
  'leicester city':             13,
  'ipswich town':               14,
  'ipswich':                    14,   // CSV: "Ipswich"
  'west ham united':            37,
  'west ham':                   37,
  'wolverhampton wanderers':    415,
  'wolves':                     415,
  'aston villa':                420,
  'bournemouth':                416,
  'afc bournemouth':            416,
  'brighton hove albion':       405,
  'brighton':                   405,
  'fulham':                     423,
  'crystal palace':             457,
  'brentford':                  456,

  // ── La Liga ──────────────────────────────────────────────────────────────────
  'real madrid':                243,
  'fc barcelona':               241,
  'barcelona':                  241,
  'atletico de madrid':         240,
  'atletico madrid':            240,
  'sevilla fc':                 58,
  'sevilla':                    58,
  'real sociedad':              148,
  'real betis':                 95,
  'villarreal cf':              449,
  'villarreal':                 449,
  'athletic club':              102,
  'athletic bilbao':            102,
  'valencia cf':                97,
  'valencia':                   97,
  'rayo vallecano':             460,
  'ca osasuna':                 162,
  'osasuna':                    162,
  'celta de vigo':              149,
  'rc celta':                   149,  // CSV: "RC Celta"
  'rcd espanyol':               93,   // CSV: "RCD Espanyol"
  // Getafe, Girona, Alavés, Mallorca, Las Palmas, Leganés, Valladolid → API

  // ── Bundesliga ───────────────────────────────────────────────────────────────
  'fc bayern munchen':          21,
  'fc bayern münchen':          21,
  'borussia dortmund':          73,
  'bayer 04 leverkusen':        80,
  'leverkusen':                 80,   // CSV: "Leverkusen"
  'rb leipzig':                 81,
  'eintracht frankfurt':        82,
  'frankfurt':                  82,   // CSV: "Frankfurt"
  'vfb stuttgart':              22,
  'borussia monchengladbach':   24,
  'mgladbach':                  24,   // normalizeKey("M'gladbach")
  'm gladbach':                 24,
  'sv werder bremen':           23,   // CSV: "SV Werder Bremen"
  'werder bremen':              23,
  'tsg hoffenheim':             2764,
  'vfl wolfsburg':              2761,
  'fc augsburg':                2762,
  '1 fsv mainz 05':             2765, // CSV: "1. FSV Mainz 05"
  'vfl bochum 1848':            2766, // CSV: "VfL Bochum 1848"
  'fc st pauli':                3007, // CSV: "FC St. Pauli"
  'sc freiburg':                85,
  // Union Berlin, Heidenheim, Holstein Kiel → API

  // ── Bundesliga 2 ─────────────────────────────────────────────────────────────
  'hamburger sv':               76,
  'hertha bsc':                 79,
  '1 fc koln':                  78,   // normalizeKey("1. FC Köln")
  'fc schalke 04':              75,
  'hannover 96':                77,
  // Remaining Bundesliga 2 clubs → API

  // ── Serie A ──────────────────────────────────────────────────────────────────
  'ac milan':                   44,
  'milano fc':                  44,   // CSV EA placeholder for AC Milan
  'ssc napoli':                 50,
  'as roma':                    55,
  'ss lazio':                   111,
  'latium':                     111,  // CSV EA placeholder for SS Lazio
  'atalanta bc':                60,
  'bergamo calcio':             60,   // CSV EA placeholder for Atalanta
  'acf fiorentina':             54,
  'fiorentina':                 54,   // CSV: "Fiorentina"
  'fc internazionale':          47,
  'inter':                      47,
  'lombardia fc':               47,   // CSV EA placeholder for Inter Milan
  'juventus':                   57,
  'bologna':                    108,
  'udinese calcio':             89,
  'udinese':                    89,   // CSV: "Udinese"
  'cagliari':                   110,
  'genoa':                      109,
  'parma':                      112,
  // Torino, Empoli, Lecce, Monza, Como, Hellas Verona, Venezia → API

  // ── Ligue 1 ──────────────────────────────────────────────────────────────────
  'paris sg':                   45,
  'paris saint germain':        45,
  'olympique lyonnais':         244,
  'ol':                         244,  // CSV: "OL"
  'olympique de marseille':     210,
  'marseille':                  210,
  'om':                         210,  // CSV: "OM"
  'as monaco':                  213,
  'ogc nice':                   214,
  'stade rennais fc':           161,  // CSV: "Stade Rennais FC"
  'rc lens':                    245,
  'losc lille':                 130,  // CSV: "LOSC Lille"
  'lille osc':                  130,
  // Brest, Reims, Toulouse, Montpellier, Nantes, Auxerre, etc. → API

  // ── Liga Portugal ────────────────────────────────────────────────────────────
  'sl benfica':                 523,
  'benfica':                    523,
  'sporting cp':                573,
  'fc porto':                   534,
  'porto':                      534,
  // Braga, Vitória, Guimarães, etc. → API

  // ── Eredivisie ───────────────────────────────────────────────────────────────
  'afc ajax':                   217,
  'ajax':                       217,
  'psv':                        29,
  'az':                         219,
  // Feyenoord, FC Twente, Utrecht, etc. → API (Feyenoord removed: conflicted with Union Berlin at 27)
};

// ─── Club logos — API enrichment ─────────────────────────────────────────────
// football-data.org free-tier competitions that cover the dataset's main leagues.
const API_COMPETITIONS = ['PL', 'PD', 'BL1', 'SA', 'FL1', 'DED', 'PPL', 'ELC', 'CLI'];
const LOGO_CACHE_KEY  = 'sc26_club_logos_v2';
const LOGO_CACHE_TTL  = 7 * 24 * 60 * 60 * 1000; // 7 days

// Pre-populate from localStorage at module init so first render uses cached data.
let _apiCache = (() => {
  try {
    const raw = localStorage.getItem(LOGO_CACHE_KEY);
    if (!raw) return null;
    const { ts, entries } = JSON.parse(raw);
    if (Date.now() - ts > LOGO_CACHE_TTL) return null;
    return new Map(entries);
  } catch { return null; }
})();

let _initPromise = null;

function _saveCache(map) {
  try {
    localStorage.setItem(LOGO_CACHE_KEY, JSON.stringify({
      ts: Date.now(),
      entries: [...map.entries()],
    }));
  } catch { /* storage full / unavailable — silently skip */ }
}

async function _fetchApiLogos() {
  const results = await Promise.allSettled(
    API_COMPETITIONS.map(code =>
      fetch(`/api/football-data/competitions/${code}/teams`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null)
    )
  );

  const map = new Map();
  for (const { value } of results) {
    if (!value?.teams) continue;
    for (const team of value.teams) {
      if (!team.crest) continue;
      if (team.name)      map.set(normalizeKey(team.name),      team.crest);
      if (team.shortName) map.set(normalizeKey(team.shortName), team.crest);
    }
  }
  console.log(`[ClubLogos] API cache built: ${map.size} clubs`);
  return map;
}

/**
 * Call once at app startup. onReady fires when the API cache is available.
 * If localStorage already has fresh data, onReady fires on the next microtask.
 * Safe to call multiple times — the fetch only happens once.
 */
export function initClubLogos(onReady) {
  if (_apiCache !== null) {
    // Already loaded (from localStorage at module init, or prior fetch)
    Promise.resolve().then(() => onReady?.());
    return;
  }

  if (!_initPromise) {
    _initPromise = _fetchApiLogos()
      .then(map => { _apiCache = map; _saveCache(map); })
      .catch(() => { _apiCache = new Map(); }); // graceful failure
  }

  _initPromise.then(() => onReady?.());
}

export function getClubLogo(clubName) {
  if (!clubName) return null;
  const key = normalizeKey(clubName);

  // 1. Static FUTBin map (fast, offline-capable)
  const id = CLUB_ID_MAP[key];
  if (id) return buildClubLogoUrl(id);

  // 2. API cache (populated async after startup; pre-loaded from localStorage on repeat visits)
  return _apiCache?.get(key) ?? null;
}


// ─── League logos ─────────────────────────────────────────────────────────────

const LEAGUE_LOGO_MAP = {
  'premier league':
    'https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg',
  'laliga ea sports':
    'https://upload.wikimedia.org/wikipedia/commons/5/54/LaLiga_EA_Sports_Logo_2023.svg',
  'laliga':
    'https://upload.wikimedia.org/wikipedia/commons/5/54/LaLiga_EA_Sports_Logo_2023.svg',
  'bundesliga':
    'https://upload.wikimedia.org/wikipedia/en/d/df/Bundesliga_logo_%282017%29.svg',
  'bundesliga 2':
    'https://upload.wikimedia.org/wikipedia/en/f/f3/2._Bundesliga_logo.svg',
  'serie a enilive':
    'https://upload.wikimedia.org/wikipedia/commons/e/e9/Serie_A_logo_2022.svg',
  'serie a':
    'https://upload.wikimedia.org/wikipedia/commons/e/e9/Serie_A_logo_2022.svg',
  'ligue 1 mcdonalds':
    'https://upload.wikimedia.org/wikipedia/commons/a/ad/Ligue_1_Uber_Eats.png',
  'ligue 1':
    'https://upload.wikimedia.org/wikipedia/commons/a/ad/Ligue_1_Uber_Eats.png',
  'eredivisie':
    'https://upload.wikimedia.org/wikipedia/commons/0/0f/Eredivisie_nieuw_logo_2017-.svg',
  'liga portugal':
    'https://upload.wikimedia.org/wikipedia/commons/0/0b/Liga_Portugal_2021.svg',
  'efl championship':
    'https://upload.wikimedia.org/wikipedia/en/c/c9/EFL_Championship.svg',
  'efl league one':
    'https://upload.wikimedia.org/wikipedia/en/f/f9/EFL_League_One.svg',
  'efl league two':
    'https://upload.wikimedia.org/wikipedia/en/1/12/EFL_League_Two_logo.svg',
  'laliga hypermotion':
    'https://upload.wikimedia.org/wikipedia/commons/d/d4/LaLiga_Hypermotion_Logo.svg',
  'mls':
    'https://upload.wikimedia.org/wikipedia/commons/9/9e/MLS_crest_logo_RGB_gradient.svg',
  'serie bkt':
    'https://upload.wikimedia.org/wikipedia/en/9/95/Serie_B_logo.svg',
  'scottish prem':
    'https://upload.wikimedia.org/wikipedia/en/8/83/Scottish_Premiership_logo.svg',
  'k league 1':
    'https://upload.wikimedia.org/wikipedia/commons/e/e7/K_League_1_logo.svg',
};

export function getLeagueLogo(leagueName) {
  if (!leagueName) return null;
  const key = normalizeKey(leagueName);
  return LEAGUE_LOGO_MAP[key] ?? null;
}
