// ── Unified Player Store ──────────────────────────────────────────────────────
// Single getAllPlayers() export consumed by packService, opponentSquadService,
// imageResolvers, and MyClubScreen. Routes to the correct dataset based on
// DATA_SOURCE in src/config/dataSource.js.
//
// To switch datasets: set DATA_SOURCE = 'israel' | 'israel-csv' | 'fifa'
//   'israel'     — JS module (israeliPlayers.js), fallback / source of truth
//   'israel-csv' — CSV file  (israeli_players.csv), same data + future enrichment
//   'fifa'       — global EA FC CSV (male_players.csv)
// ─────────────────────────────────────────────────────────────────────────────

import { DATA_SOURCE } from '../config/dataSource';
import { getAllPlayers as getIsraeliPlayers }    from './israeliPlayers';
import { getAllPlayers as getIsraeliCsvPlayers } from './israeliCsvPlayerStore';
import { getAllPlayers as getFifaPlayers }       from './csvPlayerStore';

// Resolve the active pool once at module-load time so every consumer
// (packService module-level const, opponentSquadService, imageResolvers)
// sees the same snapshot.
const _activePlayers =
  DATA_SOURCE === 'israel'     ? getIsraeliPlayers()    :
  DATA_SOURCE === 'israel-csv' ? getIsraeliCsvPlayers() :
  getFifaPlayers();

// ── Diagnostic log — visible in browser console and terminal ─────────────────
console.log(
  `%c🗂️  Player Store — source: "${DATA_SOURCE}"`, 'color: #60a5fa; font-weight: bold',
  `\n  Total players : ${_activePlayers.length}`,
  `\n  First 5 names : ${_activePlayers.slice(0, 5).map(p => p.name).join(', ')}`,
  `\n  Rating range  : ${Math.min(..._activePlayers.map(p => p.rating))}–${Math.max(..._activePlayers.map(p => p.rating))}`,
);

export function getAllPlayers() {
  return _activePlayers;
}
