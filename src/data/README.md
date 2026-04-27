# Game Data Stores

## Overview

The game maintains two interconnected data stores that form the foundation of the gameplay system:

1. **Premier League Store** (`premierLeagueStore.js`) - Club database
2. **Player Store** (`playerStore.js`) - Player database

These stores are automatically loaded when the app starts and provide a centralized, reusable database for all gameplay systems.

---

## Premier League Store

### Data Location
**Module:** `src/data/premierLeagueStore.js`
**Storage:** In-memory cache (loaded from football-data.org API on app startup)
**Size:** 20 Premier League clubs

### Data Structure

Each club:
```javascript
{
  id: 57,                    // football-data.org ID
  name: "Arsenal FC",        // Full club name
  shortName: "Arsenal",      // Short name
  country: "England",        // Country from area
  logo: "https://...",       // Official crest URL
  founded: 1886,             // Year founded
  venue: "Emirates Stadium",  // Home stadium
  website: "http://...",     // Official website
  clubColors: "Red / White"  // Club colors
}
```

### API Reference

```javascript
import { 
  loadPremierLeagueClubs,  // Load clubs
  getPremierLeagueClubs,   // Get all clubs
  getClubById,             // Find club by ID
  getClubByName,           // Find club by name
  searchClubs,             // Search clubs
  getAllClubs,             // Get all clubs
  areClubsLoaded,          // Check if loaded
  isClubsLoading           // Check if loading
} from '@/data/premierLeagueStore';

// Get all clubs
const clubs = getPremierLeagueClubs();

// Find specific club
const arsenal = getClubById(57);
const liverpool = getClubByName('Liverpool');

// Search clubs
const results = searchClubs('man');
```

---

## Player Store - The Game's Player Database

### Data Location
**Module:** `src/data/playerStore.js`
**Storage:** In-memory indexed database
**Size:** ~500+ players from 20 Premier League clubs

### Data Structure

Each player is normalized with complete linking information:

```javascript
{
  id: 3189,                              // football-data.org player ID
  name: "Kepa Arrizabalaga",             // Player full name
  position: "Goalkeeper",                // Position (GK, CB, LB, RB, CM, LM, RM, LW, RW, ST)
  nationality: "Spain",                  // Player nationality
  dateOfBirth: "1994-10-03",            // Date of birth
  
  // Club Link
  clubId: 57,                            // Links to club in premierLeagueStore
  clubName: "Arsenal FC",                // Club name (denormalized for quick access)
  clubShortName: "Arsenal",              // Club short name
  
  // League Link
  leagueId: 2021,                        // League ID (2021 = Premier League)
  leagueName: "Premier League",          // League name
  
  // Quick Access Fields
  country: "Spain",                      // Duplicate of nationality for consistency
  _source: "premierLeague"                // Data source identifier
}
```

### Data Linking Architecture

```
Game Database
│
├─ All Players
│  └─ Indexed by: ID, Club, Nationality, Position
│
├─ Players by Club (playersByClub)
│  └─ Key: clubId
│  └─ Value: [player1, player2, ...]
│
├─ Players by Nationality (playersByNationality)
│  └─ Key: "Spain"
│  └─ Value: [player1, player2, ...]
│
└─ Players by ID (playersById)
   └─ Key: playerId
   └─ Value: player object
```

### API Reference

```javascript
import {
  loadPlayers,               // Load all players from all clubs
  getAllPlayers,             // Get all loaded players
  getPlayersByClub,          // Get players in specific club
  getPlayerById,             // Get single player by ID
  getPlayersByNationality,   // Get players from country
  getPlayersByPosition,      // Get players in position
  searchPlayers,             // Search players by name
  getRandomPlayers,          // Get random players with optional filters
  getPlayerStats,            // Get statistics
  arePlayersLoaded,          // Check if loaded
  isPlayersLoading           // Check if loading
} from '@/data/playerStore';

// Get all players
const allPlayers = getAllPlayers();

// Get Liverpool's squad
const liverpoolSquad = getPlayersByClub(10); // 10 = Liverpool's ID

// Get Spanish players
const spanishPlayers = getPlayersByNationality('Spain');

// Get all forwards
const forwards = getPlayersByPosition('Forward');

// Search for a player
const mbappe = searchPlayers('mbappé');

// Get random players for packs
const randomCard = getRandomPlayers(1); // 1 random player
const packPlayers = getRandomPlayers(5, { position: 'Forward' }); // 5 random forwards

// Get random players from specific club
const arsenalCard = getRandomPlayers(3, { clubId: 57 });

// Get statistics
const stats = getPlayerStats();
// Returns: {
//   totalPlayers: 487,
//   clubCount: 20,
//   nationalityCount: 25,
//   byPosition: { Goalkeeper: 20, Defender: 145, ... }
// }
```

---

## Loading Flow

When the app starts, this happens automatically:

```javascript
// App.jsx useEffect
useEffect(() => {
  const loadGameData = async () => {
    // Step 1: Load clubs
    await loadPremierLeagueClubs();
    
    // Step 2: Load players (which uses club data internally)
    await loadPlayers();
  };
  
  loadGameData();
}, []);
```

**Console Output:**
```
✅ Loaded 20 Premier League clubs
✅ Loaded 487 players from 20 Premier League clubs
```

---

## Usage Examples

### Example 1: Pack Opening System
```javascript
import { getRandomPlayers } from '@/data/playerStore';

function openPack() {
  // Get 5 random players
  const pack = getRandomPlayers(5);
  
  return pack.map(player => ({
    name: player.name,
    club: player.clubName,
    position: player.position,
    nationality: player.nationality
  }));
}
```

### Example 2: Squad Building - Get Club Players
```javascript
import { getPlayersByClub } from '@/data/playerStore';
import { getClubById } from '@/data/premierLeagueStore';

function buildSquad(clubId) {
  const club = getClubById(clubId);
  const players = getPlayersByClub(clubId);
  
  return {
    clubName: club.name,
    clubLogo: club.logo,
    squad: players.map(p => ({
      name: p.name,
      position: p.position,
      nationality: p.nationality
    }))
  };
}
```

### Example 3: Filtering Players by Multiple Criteria
```javascript
import { getAllPlayers } from '@/data/playerStore';

function getDefendersByNationality(nationality) {
  const allPlayers = getAllPlayers();
  return allPlayers.filter(p => 
    p.position === 'Defender' && 
    p.nationality === nationality
  );
}
```

### Example 4: Player Search with Lookup
```javascript
import { searchPlayers } from '@/data/playerStore';
import { getClubById } from '@/data/premierLeagueStore';

function searchPlayerWithClub(name) {
  const matches = searchPlayers(name);
  
  return matches.map(player => ({
    name: player.name,
    position: player.position,
    club: getClubById(player.clubId),
    nationality: player.nationality
  }));
}
```

### Example 5: League-Wide Statistics
```javascript
import { getPlayerStats } from '@/data/playerStore';

function getLeagueStats() {
  const stats = getPlayerStats();
  
  return {
    totalPlayers: stats.totalPlayers,
    totalClubs: stats.clubCount,
    countries: stats.nationalityCount,
    positionBreakdown: stats.byPosition
  };
}
```

---

## Gameplay Systems Ready to Use

### Pack Opening
```javascript
// Simulate opening a 5-player pack
const pack = getRandomPlayers(5);
```

### Squad Building with Filters
```javascript
// Build team with specific criteria
const squad = getRandomPlayers(11, {
  clubId: 57,           // All from Arsenal
  position: 'Defender'  // All defenders
});
```

### Player Lookup
```javascript
// Quick player search and club info
const player = getPlayerById(playerId);
const club = getClubById(player.clubId);
```

### Filtering and Sorting
```javascript
// Get players by position for formations
const gks = getPlayersByPosition('Goalkeeper');
const defenders = getPlayersByPosition('Defender');
const midfielders = getPlayersByPosition('Midfielder');
const forwards = getPlayersByPosition('Forward');
```

### League Analysis
```javascript
// Analyze league composition
const stats = getPlayerStats();
// Use for UI stats, comparisons, etc.
```

---

## Data Consistency

### How Players Link to Clubs
Every player object contains:
- `clubId` - Reference to club in premierLeagueStore
- `clubName` - Denormalized club name for quick display
- `leagueId` - Reference to Premier League (2021)
- `leagueName` - "Premier League"

### How to Access Related Data
```javascript
// Get a player
const player = getPlayerById(playerId);

// Get their club details
import { getClubById } from '@/data/premierLeagueStore';
const club = getClubById(player.clubId);

// Full linked data
const fullPlayer = {
  ...player,
  clubLogo: club.logo,
  clubVenue: club.venue,
  clubColors: club.clubColors
};
```

---

## Performance Characteristics

| Operation | Time | Memory |
|-----------|------|--------|
| Load all data | ~2-3s | ~50KB |
| Get all players | O(1) | Return cached array |
| Get players by club | O(1) | Index lookup |
| Get player by ID | O(1) | Hash lookup |
| Get players by nationality | O(1) | Index lookup |
| Search by name | O(n) | Filter all players |
| Get random players | O(1) | Shuffle + slice |
| Get stats | O(n) | Aggregate on demand |

---

## Troubleshooting

### Players not loading?
Check browser console. If club loading fails, player loading won't start.

### Missing player data?
Some players may not have all fields populated by the API (e.g., dateOfBirth). Fallbacks are provided.

### Slow player search?
Search performs full-text filtering. For large apps, consider adding elasticsearch-like indexing.

### Need to add other leagues?
Create similar stores:
- `laLigaStore.js` (competition ID: 2014)
- `bundesligaStore.js` (competition ID: 2002)
- `serieAStore.js` (competition ID: 2019)
