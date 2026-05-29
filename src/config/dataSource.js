// ── Active player dataset ─────────────────────────────────────────────────────
// Switch between 'israel' (Israeli football) and 'fifa' (global CSV dataset).
// This is the single source of truth — change it here to swap the entire game's
// player population: packs, opponents, squad generation, ratings, positions.
//
// To add new Israeli players: edit src/data/israeliPlayers.js
// To revert to FIFA data:     set DATA_SOURCE = 'fifa'
export const DATA_SOURCE = 'israel';

// Bump this string every time you deploy a meaningful data/logic change.
// It appears in the on-screen debug panel so you can verify the live build
// is actually the latest deployment.
export const APP_VERSION = 'Israel-v3';
