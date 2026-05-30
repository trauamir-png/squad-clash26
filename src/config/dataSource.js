// ── Active player dataset ─────────────────────────────────────────────────────
// 'israel'     — JS module (israeliPlayers.js) — original, always available as fallback
// 'israel-csv' — CSV file  (israeli_players.csv) — same data, ready for enrichment
// 'fifa'       — global EA FC CSV (male_players.csv)
//
// To revert to JS fallback: set DATA_SOURCE = 'israel'
// To revert to FIFA data:   set DATA_SOURCE = 'fifa'
export const DATA_SOURCE = 'israel-csv';

// Bump this string every time you deploy a meaningful data/logic change.
// It appears in the on-screen debug panel so you can verify the live build
// is actually the latest deployment.
export const APP_VERSION = 'Israel-v5';
