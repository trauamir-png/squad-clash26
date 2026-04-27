import { getAllPlayers } from '../data/csvPlayerStore';

/**
 * Image resolver — the single source of truth for all image URLs.
 *
 * Provider contract
 * ─────────────────
 * UI components call getPlayerImage / getClubLogo / getLeagueLogo and receive
 * a URL string or null.  They must not contain any CDN or path logic themselves.
 *
 * To switch providers, edit the private builder functions below.
 * The public API (function signatures and null-on-miss contract) never changes.
 */

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

// Backward-compatible alias used by playerImages.js
export const normalizePlayerName = normalizeKey;


// ─── Player images ────────────────────────────────────────────────────────────

// Change ONLY this function to switch the player photo CDN / local path.
function buildPlayerCdnUrl(eaId) {
  return `https://cdn.futbin.com/content/fifa24/img/players/${eaId}.png`;
}

// Manual overrides — normalizeKey(name) → explicit URL.
// Takes priority over eaId CDN lookup.
const PLAYER_IMAGE_MAP = {
  // Example: 'cristiano ronaldo': '/assets/players/ronaldo.png',
};

// Lazy index: player.id → eaId, built once from the CSV store on first use.
// Lets getPlayerImage recover the eaId for players whose snapshot was saved
// before eaId was added to the schema (stale localStorage saves).
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

  // 1. Manual override
  if (PLAYER_IMAGE_MAP[key]) return PLAYER_IMAGE_MAP[key];

  // 2. CDN via eaId — prefer field on object, fall back to CSV index for
  //    players saved before eaId was added to the schema (stale localStorage).
  const eaId = player.eaId || getEaIdIndex().get(player.id);
  if (eaId) return buildPlayerCdnUrl(eaId);

  // 3. Legacy ui-avatars field (non-CSV / fictional opponent players)
  return player.image ?? null;
}


// ─── Club logos ───────────────────────────────────────────────────────────────

// Change ONLY this function to switch the club badge CDN / local path.
function buildClubLogoUrl(eaClubId) {
  // Same CDN as player images — consistent, reliable, no CORS issues.
  // To switch: return `https://api-football.com/clubs/${eaClubId}.png`;
  // To use local: return `/assets/clubs/${eaClubId}.png`;
  return `https://cdn.futbin.com/content/fifa24/img/clubs/${eaClubId}.png`;
}

// Maps normalizeKey(clubName) → EA club ID.
// All IDs verified against the FUTBin CDN (FIFA 24).
// Unknown clubs return null — callers must handle missing logos gracefully.
const CLUB_ID_MAP = {
  // ── Premier League ──────────────────────────────────────────────────────────
  'arsenal':                   1,
  'tottenham hotspur':         5,
  'tottenham':                 5,
  'liverpool':                 9,
  'manchester city':           10,
  'manchester united':         11,
  'chelsea':                   18,
  'everton':                   6,
  'newcastle united':          4,
  'aston villa':               420,
  'brentford':                 456,
  'crystal palace':            457,
  'brighton hove albion':      405,
  'brighton':                  405,
  'fulham':                    423,
  'nottingham forest':         12,
  'nottm forest':              12,
  'wolverhampton wanderers':   415,
  'wolves':                    415,
  'leicester city':            13,
  'ipswich town':              14,
  'west ham united':           37,
  'west ham':                  37,
  'bournemouth':               416,
  'afc bournemouth':           416,

  // ── La Liga ─────────────────────────────────────────────────────────────────
  'real madrid':               243,
  'fc barcelona':              241,
  'barcelona':                 241,
  'atletico de madrid':        240,
  'sevilla fc':                58,
  'sevilla':                   58,
  'real sociedad':             148,
  'real betis':                95,
  'villarreal cf':             449,
  'athletic club':             102,
  'athletic bilbao':           102,
  'valencia cf':               97,
  'valencia':                  97,
  'getafe cf':                 456,
  'celta de vigo':             149,
  'rayo vallecano':            460,
  'osasuna':                   162,
  'ca osasuna':                162,

  // ── Bundesliga ───────────────────────────────────────────────────────────────
  'fc bayern munchen':         21,
  'fc bayern münchen':         21,
  'borussia dortmund':         73,
  'leverkusen':                80,
  'bayer 04 leverkusen':       80,
  'rb leipzig':                81,
  'eintracht frankfurt':       82,
  'vfb stuttgart':             22,
  'borussia monchengladbach':  24,
  'sc freiburg':               85,
  'werder bremen':             23,
  'union berlin':              27,
  '1 fc union berlin':         27,

  // ── Serie A ───────────────────────────────────────────────────────────────────
  'ac milan':                  44,
  'ssc napoli':                50,
  'as roma':                   55,
  'ss lazio':                  111,
  'atalanta bc':               60,
  'acf fiorentina':            54,
  'fc internazionale':         47,
  'inter':                     47,
  'lombardia fc':              47,  // EA placeholder for Inter
  'juventus':                  57,
  'torino fc':                 85,
  'udinese calcio':            89,

  // ── Ligue 1 ───────────────────────────────────────────────────────────────────
  'paris sg':                  45,
  'paris saint germain':       45,
  'olympique lyonnais':        244,
  'rc lens':                   245,
  'olympique de marseille':    210,
  'marseille':                 210,
  'as monaco':                 213,
  'ogc nice':                  214,
  'stade rennais fc':          161,
  'lille osc':                 130,

  // ── Liga Portugal ──────────────────────────────────────────────────────────────
  'sl benfica':                523,
  'benfica':                   523,
  'sporting cp':               573,
  'fc porto':                  534,
  'porto':                     534,

  // ── Eredivisie ────────────────────────────────────────────────────────────────
  'afc ajax':                  217,
  'ajax':                      217,
  'psv':                       29,
  'feyenoord':                 27,
  'az':                        219,
};

export function getClubLogo(clubName) {
  if (!clubName) return null;
  const key = normalizeKey(clubName);
  const id = CLUB_ID_MAP[key];
  if (!id) return null;
  return buildClubLogoUrl(id);
}


// ─── League logos ─────────────────────────────────────────────────────────────

// Using direct Wikimedia SVG URLs (no /thumb/ — those return HTTP 400 for SVGs).
// Change buildLeagueLogoUrl or the map values to switch providers.
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
