import { useState, useEffect } from "react";
import "./App.css";
import { openPack, openStarterPack } from "./data/packService";
import { PacksScreen } from "./PacksScreen";
import { FormationSelector } from "./FormationSelector";
import { getPositionFit, getFitBadge } from "./positionFit";
import { OnboardingPackScreen } from "./OnboardingPackScreen";
import { MatchResultScreen } from "./MatchResultScreen";
import { MatchLiveScreen } from "./MatchLiveScreen";
import { MatchPreviewScreen } from "./MatchPreviewScreen";
import { pickRandomOpponent } from "./data/opponents";
import { generateOpponentSquad, calculateOpponentPower } from "./data/opponentSquadService";
import { MyClubScreen } from "./MyClubScreen";
import { loadGameSave, saveGameState, resetGameSave } from "./data/saveService";
import { getRatingColor, getCardRatingColor, getRatingCardStyle, getRatingCardClass } from "./ratingUtils";
import { getClubLogo, getLeagueLogo } from "./utils/imageResolvers";
import { generateMatchEvents } from "./data/matchSimulator";
import { PlayerImage } from "./PlayerImage";
import { SplashScreen } from "./SplashScreen";

function getFormationAdjacency(formation) {
  const THRESHOLD = 40;
  const adj = {};
  formation.forEach((p) => { adj[p.id] = []; });
  for (let i = 0; i < formation.length; i++) {
    for (let j = i + 1; j < formation.length; j++) {
      const a = formation[i], b = formation[j];
      const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
      if (dist <= THRESHOLD) {
        adj[a.id].push(b.id);
        adj[b.id].push(a.id);
      }
    }
  }
  return adj;
}

function getLinkScore(a, b) {
  if (a.club && b.club && a.club === b.club) return 3;
  if (a.leagueName && b.leagueName && a.leagueName === b.leagueName) return 3;
  const natA = a.nationality || a.country;
  const natB = b.nationality || b.country;
  if (natA && natB && natA === natB) return 2;
  return 1;
}

function computeTeamChemistry(formation, selectedPlayers) {
  const adj = getFormationAdjacency(formation);
  let total = 0;
  formation.forEach((pos) => {
    const player = selectedPlayers[pos.id];
    if (!player) return;
    const filled = adj[pos.id].filter((id) => selectedPlayers[id]);
    if (filled.length === 0) return;
    const linkSum = filled.reduce(
      (sum, id) => sum + getLinkScore(player, selectedPlayers[id]),
      0
    );
    total += Math.min(3, Math.round(linkSum / filled.length));
  });
  return total;
}

const PACK_PRICES = { bronze: 400, silver: 1500, gold: 5000 };

function App() {
  const logos = [
    {
      id: "red-shield",
      name: "Red Shield",
      svg: (
        <svg viewBox="0 0 100 120" width="60" height="72">
          <defs>
            <linearGradient id="redGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop
                offset="0%"
                style={{ stopColor: "#dc2626", stopOpacity: 1 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "#991b1b", stopOpacity: 1 }}
              />
            </linearGradient>
          </defs>
          <path
            d="M 50 10 L 80 35 L 80 80 Q 50 110 50 110 Q 50 110 20 80 L 20 35 Z"
            fill="url(#redGrad)"
            stroke="#fff"
            strokeWidth="2"
          />
          <circle cx="50" cy="50" r="8" fill="#fff" />
          <path
            d="M 50 42 L 53 48 L 59 48 L 54 52 L 56 58 L 50 54 L 44 58 L 46 52 L 41 48 L 47 48 Z"
            fill="#fff"
          />
        </svg>
      ),
    },
    {
      id: "red-shield",
      name: "Red Shield",
      svg: (
        <svg viewBox="0 0 100 120" width="60" height="72">
          <defs>
            <linearGradient id="redGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop
                offset="0%"
                style={{ stopColor: "#dc2626", stopOpacity: 1 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "#991b1b", stopOpacity: 1 }}
              />
            </linearGradient>
          </defs>
          <path
            d="M 50 10 L 80 35 L 80 80 Q 50 110 50 110 Q 50 110 20 80 L 20 35 Z"
            fill="url(#redGrad)"
            stroke="#fff"
            strokeWidth="2"
          />
          <circle cx="50" cy="50" r="8" fill="#fff" />
          <path
            d="M 50 42 L 53 48 L 59 48 L 54 52 L 56 58 L 50 54 L 44 58 L 46 52 L 41 48 L 47 48 Z"
            fill="#fff"
          />
        </svg>
      ),
    },
    {
      id: "blue-gold",
      name: "Blue Gold",
      svg: (
        <svg viewBox="0 0 100 100" width="60" height="60">
          <defs>
            <linearGradient id="blueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop
                offset="0%"
                style={{ stopColor: "#1e40af", stopOpacity: 1 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "#1e3a8a", stopOpacity: 1 }}
              />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="url(#blueGrad)"
            stroke="#fbbf24"
            strokeWidth="2"
          />
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="1.5"
          />
          <circle
            cx="50"
            cy="50"
            r="20"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2"
          />
          <path
            d="M 50 35 L 54 44 L 64 44 L 56 50 L 59 59 L 50 54 L 41 59 L 44 50 L 36 44 L 46 44 Z"
            fill="#fbbf24"
          />
        </svg>
      ),
    },
    {
      id: "green-white",
      name: "Green White",
      svg: (
        <svg viewBox="0 0 100 120" width="60" height="72">
          <defs>
            <linearGradient id="greenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop
                offset="0%"
                style={{ stopColor: "#059669", stopOpacity: 1 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "#065f46", stopOpacity: 1 }}
              />
            </linearGradient>
          </defs>
          <path
            d="M 50 10 L 80 35 L 80 80 Q 50 110 50 110 Q 50 110 20 80 L 20 35 Z"
            fill="url(#greenGrad)"
            stroke="#fff"
            strokeWidth="2"
          />
          <line x1="50" y1="30" x2="50" y2="90" stroke="#fff" strokeWidth="3" />
          <line x1="30" y1="60" x2="70" y2="60" stroke="#fff" strokeWidth="3" />
        </svg>
      ),
    },
    {
      id: "purple-gold",
      name: "Purple Gold",
      svg: (
        <svg viewBox="0 0 100 120" width="60" height="72">
          <defs>
            <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop
                offset="0%"
                style={{ stopColor: "#7c3aed", stopOpacity: 1 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "#5b21b6", stopOpacity: 1 }}
              />
            </linearGradient>
          </defs>
          <path
            d="M 50 10 L 80 35 L 80 80 Q 50 110 50 110 Q 50 110 20 80 L 20 35 Z"
            fill="url(#purpleGrad)"
            stroke="#fbbf24"
            strokeWidth="2"
          />
          <polygon points="50,35 55,50 60,35 55,40" fill="#fbbf24" />
          <polygon points="50,60 55,75 60,60 55,65" fill="#fbbf24" />
          <polygon points="40,50 45,60 50,50 45,55" fill="#fbbf24" />
          <polygon points="60,50 65,60 70,50 65,55" fill="#fbbf24" />
        </svg>
      ),
    },
    {
      id: "black-gold",
      name: "Black Gold",
      svg: (
        <svg viewBox="0 0 100 120" width="60" height="72">
          <defs>
            <linearGradient id="blackGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop
                offset="0%"
                style={{ stopColor: "#1f2937", stopOpacity: 1 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "#000", stopOpacity: 1 }}
              />
            </linearGradient>
            <pattern
              id="diagonalHatch"
              patternUnits="userSpaceOnUse"
              width="8"
              height="8"
            >
              <line
                x1="0"
                y1="0"
                x2="8"
                y2="8"
                stroke="#fbbf24"
                strokeWidth="2"
              />
            </pattern>
          </defs>
          <path
            d="M 50 10 L 80 35 L 80 80 Q 50 110 50 110 Q 50 110 20 80 L 20 35 Z"
            fill="url(#blackGrad)"
            stroke="#fbbf24"
            strokeWidth="2"
          />
          <path
            d="M 30 30 L 70 90 M 40 30 L 80 90 M 20 30 L 60 90"
            stroke="#fbbf24"
            strokeWidth="1.5"
          />
        </svg>
      ),
    },
    {
      id: "orange-white",
      name: "Orange White",
      svg: (
        <svg viewBox="0 0 100 100" width="60" height="60">
          <defs>
            <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop
                offset="0%"
                style={{ stopColor: "#ea580c", stopOpacity: 1 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "#c2410c", stopOpacity: 1 }}
              />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="url(#orangeGrad)"
            stroke="#fff"
            strokeWidth="2"
          />
          <rect
            x="35"
            y="35"
            width="30"
            height="30"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
          />
          <line
            x1="50"
            y1="35"
            x2="50"
            y2="65"
            stroke="#fff"
            strokeWidth="1.5"
          />
          <line
            x1="35"
            y1="50"
            x2="65"
            y2="50"
            stroke="#fff"
            strokeWidth="1.5"
          />
        </svg>
      ),
    },
    {
      id: "navy-sky",
      name: "Navy Sky",
      svg: (
        <svg viewBox="0 0 100 100" width="60" height="60">
          <defs>
            <linearGradient id="navyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop
                offset="0%"
                style={{ stopColor: "#0369a1", stopOpacity: 1 }}
              />
              <stop
                offset="50%"
                style={{ stopColor: "#0369a1", stopOpacity: 1 }}
              />
              <stop
                offset="50%"
                style={{ stopColor: "#1e40af", stopOpacity: 1 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "#1e40af", stopOpacity: 1 }}
              />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="url(#navyGrad)"
            stroke="#fff"
            strokeWidth="2"
          />
          <circle
            cx="50"
            cy="50"
            r="30"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
          />
          <circle cx="50" cy="35" r="6" fill="#fff" />
          <polygon points="50,50 45,65 55,65" fill="#fff" />
        </svg>
      ),
    },
    {
      id: "forest-gold",
      name: "Forest Gold",
      svg: (
        <svg viewBox="0 0 100 120" width="60" height="72">
          <defs>
            <linearGradient id="forestGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop
                offset="0%"
                style={{ stopColor: "#15803d", stopOpacity: 1 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "#0f5132", stopOpacity: 1 }}
              />
            </linearGradient>
          </defs>
          <path
            d="M 50 10 L 80 35 L 80 80 Q 50 110 50 110 Q 50 110 20 80 L 20 35 Z"
            fill="url(#forestGrad)"
            stroke="#fbbf24"
            strokeWidth="2"
          />
          <line
            x1="30"
            y1="45"
            x2="70"
            y2="45"
            stroke="#fbbf24"
            strokeWidth="2"
          />
          <line
            x1="30"
            y1="60"
            x2="70"
            y2="60"
            stroke="#fbbf24"
            strokeWidth="2"
          />
          <line
            x1="30"
            y1="75"
            x2="70"
            y2="75"
            stroke="#fbbf24"
            strokeWidth="2"
          />
        </svg>
      ),
    },
  ];

  // Club and league logo resolvers are imported from utils/imageResolvers.js.
  // Call getClubLogo(clubName) or getLeagueLogo(leagueName) wherever needed.

  const [selectedPosition, setSelectedPosition] = useState(null);
  const [selectedPlayers, setSelectedPlayers] = useState(() => loadGameSave().selectedPlayers ?? {});
  const [expandedPlayer, setExpandedPlayer] = useState(null);
  const [activeRemoveId, setActiveRemoveId] = useState(null);
  const [selectedFormation, setSelectedFormation] = useState(() => loadGameSave().selectedFormation ?? "4-3-3");
  const [club, setClub] = useState(() => loadGameSave().club ?? null);
  const [clubForm, setClubForm] = useState({
    name: "",
    logo: "red-shield",
    country: "",
  });
  const [devMode, setDevMode] = useState(false);
  const [formationSelected, setFormationSelected] = useState(() => loadGameSave().formationSelected ?? false);
  const [clubPlayers, setClubPlayers] = useState(() => loadGameSave().clubPlayers ?? []);
  const [packOpenResult, setPackOpenResult] = useState(null);
  const [currentScreen, setCurrentScreen] = useState("squad");
  const [hasOpenedStarterPack, setHasOpenedStarterPack] = useState(() => loadGameSave().hasOpenedStarterPack ?? false);
  const [coins, setCoins] = useState(() => loadGameSave().coins ?? 0);
  const [packError, setPackError] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [selectedOpponent, setSelectedOpponent]           = useState(null);
  const [selectedOpponentSquad, setSelectedOpponentSquad] = useState([]);
  const [showSplash, setShowSplash] = useState(true);

  const addPackToClub = (type) => {
    const price = PACK_PRICES[type]; // undefined for starter (free)

    if (price !== undefined) {
      console.log(
        `%c💰 Pack purchase: ${type}`, 'color: #f7d774; font-weight: bold',
        '\n  Coins before:', coins,
        '\n  Pack cost:', price,
      );
      if (coins < price) {
        console.log(
          '%c❌ Purchase rejected — not enough coins', 'color: #f87171',
          `\n  Need: ${price.toLocaleString()}, Have: ${coins.toLocaleString()}`,
        );
        setPackError('Not enough coins');
        return;
      }
      const coinsAfter = coins - price;
      console.log('%c✅ Purchase approved', 'color: #4ade80', '\n  Coins after:', coinsAfter);
      setCoins(coinsAfter);
    }

    setPackError(null);
    const received = openPack(type);
    const ownedIds = new Set(clubPlayers.map(p => p.id));
    const newPlayers = received.filter(p => !ownedIds.has(p.id));
    const duplicateIds = new Set(
      received.filter(p => ownedIds.has(p.id)).map(p => p.id)
    );
    console.log(
      `%c🏟️ Club update — ${type} pack`, 'color: #f7d774; font-weight: bold',
      '\n  Received:', received.length,
      '\n  Club before:', clubPlayers.length,
      '\n  Duplicates skipped:', duplicateIds.size,
      '\n  Club after:', clubPlayers.length + newPlayers.length,
    );
    setClubPlayers(prev => [...prev, ...newPlayers]);
    setPackOpenResult({ type, players: received, duplicateIds });
  };

  const BASE_MATCH_REWARDS = { win: 800, draw: 400, loss: 250 };

  const simulateMatch = () => {
    // ── Team power calculation ──────────────────────────────────
    const ratingValue = typeof teamRating === 'number' ? teamRating : 70;

    const chemistryScore = (teamChemistry / 33) * 100;

    const xiFits = currentFormation
      .filter(pos => selectedPlayers[pos.id])
      .map(pos => {
        const slotPos = pos.id.replace(/\d+$/, '');
        return getPositionFit(selectedPlayers[pos.id].position, slotPos);
      });
    const avgPositionFit = xiFits.length > 0
      ? xiFits.reduce((s, f) => s + f, 0) / xiFits.length
      : 75;

    const teamPower     = ratingValue * 0.6 + chemistryScore * 0.3 + avgPositionFit * 0.1;
    const opponentPower = selectedOpponentSquad.length > 0
      ? calculateOpponentPower(selectedOpponentSquad, selectedOpponent)
      : selectedOpponent?.power ?? (60 + Math.random() * 30);

    // ── Goals: expected value shifted by power difference ───────
    // powerFactor in [-1, +1]; positive = team is stronger
    const pf = Math.max(-1, Math.min(1, (teamPower - opponentPower) / 30));
    const expGF = 1.5 + pf * 1.0;  // 0.5–2.5
    const expGA = 1.5 - pf * 1.0;  // 0.5–2.5

    const goalsFor     = Math.min(6, Math.max(0, Math.round(expGF + (Math.random() - 0.5) * 3)));
    const goalsAgainst = Math.min(6, Math.max(0, Math.round(expGA + (Math.random() - 0.5) * 3)));

    const resultType = goalsFor > goalsAgainst ? 'win' : goalsFor === goalsAgainst ? 'draw' : 'loss';

    // ── Match events with real XI players ──────────────────────
    const startingXI = currentFormation
      .map(pos => selectedPlayers[pos.id])
      .filter(Boolean);
    const events = generateMatchEvents(goalsFor, goalsAgainst, startingXI, selectedOpponentSquad, teamPower, opponentPower);
    const cleanSheet = goalsAgainst === 0;

    // ── Rewards (unchanged) ─────────────────────────────────────
    const baseReward      = BASE_MATCH_REWARDS[resultType];
    const goalsBonus      = goalsFor * 65;
    const cleanSheetBonus = cleanSheet ? 100 : 0;
    const total           = baseReward + goalsBonus + cleanSheetBonus;
    const coinsAfter      = coins + total;

    console.log(
      '%c⚽ Match simulation', 'color: #4ade80; font-weight: bold',
      '\n  Team Rating:', ratingValue,
      '\n  Chemistry:', teamChemistry, `→ score: ${chemistryScore.toFixed(1)}`,
      '\n  Avg Position Fit:', avgPositionFit.toFixed(1),
      '\n  teamPower:', teamPower.toFixed(1),
      '\n  opponentPower:', opponentPower.toFixed(1),
      '\n  Power diff:', (teamPower - opponentPower).toFixed(1),
      '\n  Final score:', `${goalsFor} – ${goalsAgainst}`,
      '\n  Result:', resultType.toUpperCase(),
      '\n  Clean sheet:', cleanSheet ? 'Yes ✅' : 'No',
      '\n  Coins before:', coins,
      '\n  Coins earned:', total,
      `\n    breakdown → base: ${baseReward}  goals: ${goalsBonus}  clean sheet: ${cleanSheetBonus}`,
      '\n  Coins after:', coinsAfter,
    );

    setCoins(coinsAfter);
    const benchPlayers = subSlots.map(slot => selectedPlayers[slot.id]).filter(Boolean);
    setMatchResult({
      goalsFor, goalsAgainst, resultType,
      baseReward, goalsBonus, cleanSheetBonus, total, coinsAfter,
      teamPower:       Math.round(teamPower),
      opponentPower:   Math.round(opponentPower),
      teamRating:      ratingValue,
      teamChemistry,
      avgPositionFit:  Math.round(avgPositionFit),
      events,
      startingXI,
      benchPlayers,
      formationName:   selectedFormation,
      clubName:        club?.name ?? null,
      opponentName:    selectedOpponent?.name ?? 'Opponent',
      opponentSquad:   selectedOpponentSquad,
    });
    setCurrentScreen('matchLive');
  };

  const handleFormationSelect = (formationName) => {
    setSelectedFormation(formationName);
    setFormationSelected(true);
  };


  // Dev mode: auto-create a club so the Create Club form is skipped.
  // Only sets `club` — formationSelected and hasOpenedStarterPack are left
  // as-is so the rest of the onboarding flow works normally.
  // Guard: do not fire while showSplash is true — this prevents devMode from
  // re-setting club immediately after a reset (which sets showSplash back to true).
  useEffect(() => {
    if (devMode && !club && !showSplash) {
      setClub({ name: "Dev Team", logo: "red-shield", country: "England" });
    }
  }, [devMode, club, showSplash]);

  // Log save state on first mount
  useEffect(() => {
    const save = loadGameSave();
    if (Object.keys(save).length === 0) {
      console.log('%c📂 No save found — fresh start', 'color: #9ca3af');
    }
  }, []);

  // Write save whenever persisted states change
  useEffect(() => {
    saveGameState({ club, selectedFormation, formationSelected, hasOpenedStarterPack, clubPlayers, selectedPlayers, coins });
  }, [club, selectedFormation, formationSelected, hasOpenedStarterPack, clubPlayers, selectedPlayers, coins]);

  const handleResetSave = () => {
    resetGameSave();
    window.location.reload();
  };

  const handleResetClubAndPack = () => {
    resetGameSave();
    setClub(null);
    setClubForm({ name: "", logo: "red-shield", country: "" });
    setShowSplash(true);
    setFormationSelected(false);
    setSelectedFormation("4-3-3");
    setHasOpenedStarterPack(false);
    setClubPlayers([]);
    setSelectedPlayers({});
    setCoins(0);
    setCurrentScreen("squad");
    setMatchResult(null);
    setPackOpenResult(null);
    setPackError(null);
    setSelectedOpponent(null);
    setSelectedOpponentSquad([]);
  };
  const formations = {
    "4-3-3": [
      { id: "GK",  x: 50, y: 90 },
      { id: "LB",  x: 14, y: 75 }, { id: "CB1", x: 36, y: 75 }, { id: "CB2", x: 64, y: 75 }, { id: "RB",  x: 86, y: 75 },
      { id: "CM1", x: 24, y: 50 }, { id: "CM2", x: 50, y: 50 }, { id: "CM3", x: 76, y: 50 },
      { id: "LW",  x: 18, y: 18 }, { id: "ST",  x: 50, y: 18 }, { id: "RW",  x: 82, y: 18 },
    ],
    "4-4-2": [
      { id: "GK",  x: 50, y: 90 },
      { id: "LB",  x: 14, y: 75 }, { id: "CB1", x: 36, y: 75 }, { id: "CB2", x: 64, y: 75 }, { id: "RB",  x: 86, y: 75 },
      { id: "LM",  x: 12, y: 50 }, { id: "CM1", x: 37, y: 50 }, { id: "CM2", x: 63, y: 50 }, { id: "RM",  x: 88, y: 50 },
      { id: "ST1", x: 35, y: 18 }, { id: "ST2", x: 65, y: 18 },
    ],
    "5-3-2": [
      { id: "GK",  x: 50, y: 90 },
      { id: "LWB", x: 10, y: 75 }, { id: "CB1", x: 28, y: 75 }, { id: "CB2", x: 50, y: 75 }, { id: "CB3", x: 72, y: 75 }, { id: "RWB", x: 90, y: 75 },
      { id: "CM1", x: 25, y: 50 }, { id: "CM2", x: 50, y: 50 }, { id: "CM3", x: 75, y: 50 },
      { id: "ST1", x: 35, y: 18 }, { id: "ST2", x: 65, y: 18 },
    ],
    "4-2-3-1": [
      { id: "GK",   x: 50, y: 90 },
      { id: "LB",   x: 14, y: 75 }, { id: "CB1",  x: 36, y: 75 }, { id: "CB2", x: 64, y: 75 }, { id: "RB",  x: 86, y: 75 },
      { id: "CDM1", x: 36, y: 60 }, { id: "CDM2", x: 64, y: 60 },
      { id: "LM",   x: 18, y: 40 }, { id: "CAM",  x: 50, y: 40 }, { id: "RM",  x: 82, y: 40 },
      { id: "ST",   x: 50, y: 16 },
    ],
    "4-1-4-1": [
      { id: "GK",  x: 50, y: 90 },
      { id: "LB",  x: 14, y: 75 }, { id: "CB1", x: 36, y: 75 }, { id: "CB2", x: 64, y: 75 }, { id: "RB",  x: 86, y: 75 },
      { id: "CDM", x: 50, y: 60 },
      { id: "LM",  x: 12, y: 40 }, { id: "CM1", x: 37, y: 40 }, { id: "CM2", x: 63, y: 40 }, { id: "RM",  x: 88, y: 40 },
      { id: "ST",  x: 50, y: 16 },
    ],
    "3-5-2": [
      { id: "GK",  x: 50, y: 90 },
      { id: "CB1", x: 25, y: 75 }, { id: "CB2", x: 50, y: 75 }, { id: "CB3", x: 75, y: 75 },
      { id: "LWB", x: 10, y: 50 }, { id: "CM1", x: 30, y: 50 }, { id: "CM2", x: 50, y: 50 }, { id: "CM3", x: 70, y: 50 }, { id: "RWB", x: 90, y: 50 },
      { id: "ST1", x: 35, y: 18 }, { id: "ST2", x: 65, y: 18 },
    ],
    "4-3-3 DM": [
      { id: "GK",  x: 50, y: 90 },
      { id: "LB",  x: 14, y: 75 }, { id: "CB1", x: 36, y: 75 }, { id: "CB2", x: 64, y: 75 }, { id: "RB",  x: 86, y: 75 },
      { id: "DM",  x: 50, y: 60 },
      { id: "CM1", x: 30, y: 42 }, { id: "CM2", x: 70, y: 42 },
      { id: "LW",  x: 18, y: 18 }, { id: "ST",  x: 50, y: 18 }, { id: "RW",  x: 82, y: 18 },
    ],
    "4-3-3 AM": [
      { id: "GK",  x: 50, y: 90 },
      { id: "LB",  x: 14, y: 75 }, { id: "CB1", x: 36, y: 75 }, { id: "CB2", x: 64, y: 75 }, { id: "RB",  x: 86, y: 75 },
      { id: "CM1", x: 28, y: 58 }, { id: "CM2", x: 72, y: 58 },
      { id: "AM",  x: 50, y: 40 },
      { id: "LW",  x: 18, y: 18 }, { id: "ST",  x: 50, y: 18 }, { id: "RW",  x: 82, y: 18 },
    ],
    "3-4-3": [
      { id: "GK",  x: 50, y: 90 },
      { id: "CB1", x: 25, y: 75 }, { id: "CB2", x: 50, y: 75 }, { id: "CB3", x: 75, y: 75 },
      { id: "LM",  x: 12, y: 50 }, { id: "CM1", x: 37, y: 50 }, { id: "CM2", x: 63, y: 50 }, { id: "RM",  x: 88, y: 50 },
      { id: "LW",  x: 18, y: 18 }, { id: "ST",  x: 50, y: 18 }, { id: "RW",  x: 82, y: 18 },
    ],
  };
  const currentFormation = formations[selectedFormation];

  const handlePositionClick = (position) => {
    setSelectedPosition(position);
    setExpandedPlayer(null);
  };

  const handlePlayerSelect = (player) => {
    setSelectedPlayers({
      ...selectedPlayers,
      [selectedPosition.id]: player,
    });
    setSelectedPosition(null);
  };
  const handleRemovePlayer = (positionId) => {
    const updatedPlayers = { ...selectedPlayers };
    delete updatedPlayers[positionId];
    setSelectedPlayers(updatedPlayers);
  };
  const subSlots = Array.from({ length: 7 }, (_, i) => ({
    id: `SUB${i + 1}`,
    isSub: true,
  }));

  const selectedStartingPlayers = currentFormation.reduce(
    (count, position) => (selectedPlayers[position.id] ? count + 1 : count),
    0,
  );

  const selectedStartingSquad = currentFormation
    .map((position) => ({
      slot: position,
      player: selectedPlayers[position.id],
    }))
    .filter(({ player }) => player);

  const selectedSubSquad = subSlots
    .map((slot) => ({ slot, player: selectedPlayers[slot.id] }))
    .filter(({ player }) => player);

  const selectedSquad = [...selectedStartingSquad, ...selectedSubSquad];

  const selectedPlayersLookup = new Set(
    Object.entries(selectedPlayers)
      .filter(([slotId]) => slotId !== selectedPosition?.id)
      .map(([, player]) => `${player.name}__${player.club}`),
  );

  const isStartingLineupComplete =
    selectedStartingPlayers === currentFormation.length;

  const teamChemistry = computeTeamChemistry(currentFormation, selectedPlayers);

  const teamRating = (() => {
    const all = selectedSquad.map(({ player }) => player.rating).filter(Boolean);
    return all.length === 0 ? "-" : Math.round(all.reduce((s, r) => s + r, 0) / all.length);
  })();

  // Show club players sorted by position fit (desc), then rating (desc).
  // Players already assigned to any XI or bench slot are excluded.
  const filteredPlayers = selectedPosition
    ? (() => {
        const usedIds = new Set(
          Object.values(selectedPlayers).map(p => p?.id).filter(Boolean)
        );
        const slotPos = selectedPosition.isSub
          ? null
          : selectedPosition.id.replace(/\d+$/, "");
        return [...clubPlayers]
          .filter(p => !usedIds.has(p.id))
          .map(p => ({ player: p, fit: getPositionFit(p.position, slotPos) }))
          .sort((a, b) => b.fit - a.fit || b.player.rating - a.player.rating)
          .map(({ player, fit }) => ({ ...player, _fit: fit }));
      })()
    : [];

  if (selectedPosition) {
    const slotPos = selectedPosition.isSub ? null : selectedPosition.id.replace(/\d+$/, "");
    console.log(
      `%c🔎 Position selected: ${selectedPosition.id}`, 'color: #60a5fa',
      '\n  Slot position:', slotPos,
      '\n  Club players total:', clubPlayers.length,
      '\n  Perfect fits (100%):', filteredPlayers.filter(p => p._fit === 100).length,
      '\n  Good fits (85%):', filteredPlayers.filter(p => p._fit === 85).length,
      '\n  OK fits (70%):', filteredPlayers.filter(p => p._fit === 70).length,
      '\n  Poor fits (50%):', filteredPlayers.filter(p => p._fit === 50).length,
    );
  }

  const handleCreateClub = () => {
    if (clubForm.name.trim() && clubForm.country) {
      setClub(clubForm);
    }
  };

  if (!club) {
    if (showSplash) {
      return <SplashScreen onStart={() => setShowSplash(false)} />;
    }
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "40px 20px",
          textAlign: "center",
          background:
            "linear-gradient(135deg, #000000 0%, #0a3d17 50%, #000000 100%)",
        }}
      >
        <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1000, display: "flex", gap: "8px" }}>
          <button
            onClick={() => setDevMode(!devMode)}
            style={{
              padding: "8px 16px",
              background: devMode ? "#ff4444" : "#4444ff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            Dev Mode: {devMode ? "ON" : "OFF"}
          </button>
          <button
            onClick={handleResetSave}
            style={{
              padding: "8px 16px",
              background: "#7f1d1d",
              color: "#fca5a5",
              border: "1px solid #991b1b",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            Reset Save
          </button>
        </div>
        <h1
          style={{
            marginBottom: "24px",
            color: "#f7d774",
            fontSize: "32px",
            fontWeight: 700,
          }}
        >
          Create Your Club
        </h1>

        <div
          style={{
            background: "rgba(8, 20, 12, 0.96)",
            border: "2px solid rgba(255, 214, 88, 0.35)",
            borderRadius: "24px",
            padding: "40px 36px",
            maxWidth: "500px",
            width: "100%",
            boxShadow: "0 40px 120px rgba(0, 0, 0, 0.35)",
          }}
        >
          <div style={{ marginBottom: "28px", textAlign: "left" }}>
            <label
              htmlFor="team-name"
              style={{
                display: "block",
                marginBottom: "10px",
                color: "#f7d774",
                fontWeight: 700,
                fontSize: "15px",
              }}
            >
              Team Name:
            </label>
            <input
              id="team-name"
              type="text"
              placeholder="Enter your team name"
              value={clubForm.name}
              onChange={(e) =>
                setClubForm({ ...clubForm, name: e.target.value })
              }
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1px solid rgba(255, 214, 88, 0.25)",
                borderRadius: "10px",
                background: "rgba(0, 0, 0, 0.5)",
                color: "#f8f0d4",
                fontSize: "14px",
                outline: "none",
                fontFamily: "Arial, sans-serif",
                boxSizing: "border-box",
                transition: "all 0.2s ease",
              }}
            />
          </div>

          <div style={{ marginBottom: "28px", textAlign: "left" }}>
            <label
              style={{
                display: "block",
                marginBottom: "10px",
                color: "#f7d774",
                fontWeight: 700,
                fontSize: "15px",
              }}
            >
              Logo:
            </label>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {logos.map((logo) => (
                <button
                  key={logo.id}
                  onClick={() => setClubForm({ ...clubForm, logo: logo.id })}
                  title={logo.name}
                  style={{
                    width: "70px",
                    height: "70px",
                    padding: "4px",
                    border:
                      clubForm.logo === logo.id
                        ? "2px solid rgba(255, 214, 88, 0.8)"
                        : "2px solid rgba(255, 214, 88, 0.2)",
                    borderRadius: "8px",
                    background:
                      clubForm.logo === logo.id
                        ? "rgba(255, 214, 88, 0.15)"
                        : "rgba(0, 0, 0, 0.3)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow:
                      clubForm.logo === logo.id
                        ? "0 0 0 2px rgba(255, 214, 88, 0.2)"
                        : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {logo.svg}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "28px", textAlign: "left" }}>
            <label
              htmlFor="country"
              style={{
                display: "block",
                marginBottom: "10px",
                color: "#f7d774",
                fontWeight: 700,
                fontSize: "15px",
              }}
            >
              Country:
            </label>
            <select
              id="country"
              value={clubForm.country}
              onChange={(e) =>
                setClubForm({ ...clubForm, country: e.target.value })
              }
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1px solid rgba(255, 214, 88, 0.25)",
                borderRadius: "10px",
                background: "rgba(0, 0, 0, 0.5)",
                color: "#f8f0d4",
                fontSize: "14px",
                outline: "none",
                fontFamily: "Arial, sans-serif",
                boxSizing: "border-box",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <option value="">-- Select Country --</option>
              <option value="England">England</option>
              <option value="Spain">Spain</option>
              <option value="Germany">Germany</option>
              <option value="Italy">Italy</option>
              <option value="France">France</option>
              <option value="Portugal">Portugal</option>
              <option value="Netherlands">Netherlands</option>
              <option value="Belgium">Belgium</option>
              <option value="Argentina">Argentina</option>
              <option value="Brazil">Brazil</option>
            </select>
          </div>

          <button
            onClick={handleCreateClub}
            style={{
              width: "100%",
              padding: "14px",
              background: "linear-gradient(135deg, #f7d774 0%, #e8c643 100%)",
              color: "#000",
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.3s ease",
              marginTop: "8px",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 12px 32px rgba(255, 214, 88, 0.25)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "none";
            }}
          >
            Create Club
          </button>
        </div>
      </div>
    );
  }

  if (!formationSelected) {
    return (
      <FormationSelector
        formations={formations}
        selectedFormation={selectedFormation}
        onSelectFormation={handleFormationSelect}
      />
    );
  }

  if (!hasOpenedStarterPack) {
    return (
      <OnboardingPackScreen
        onComplete={(players) => {
          setClubPlayers(players);
          setHasOpenedStarterPack(true);
        }}
      />
    );
  }

  if (currentScreen === "packs") {
    return (
      <PacksScreen
        packOpenResult={packOpenResult}
        onOpenPack={(type) => addPackToClub(type)}
        onBack={() => { setCurrentScreen("squad"); setPackError(null); }}
        onClearResult={() => setPackOpenResult(null)}
        coins={coins}
        packPrices={PACK_PRICES}
        errorMsg={packError}
        onClearError={() => setPackError(null)}
      />
    );
  }

  if (currentScreen === 'myClub') {
    return (
      <MyClubScreen
        clubPlayers={clubPlayers}
        selectedPlayers={selectedPlayers}
        currentFormation={currentFormation}
        subSlots={subSlots}
        clubName={club?.name}
        onBack={() => setCurrentScreen('squad')}
      />
    );
  }

  if (currentScreen === 'matchPreview' && selectedOpponent) {
    return (
      <MatchPreviewScreen
        clubName={club?.name}
        teamRating={teamRating}
        teamChemistry={teamChemistry}
        formation={selectedFormation}
        opponent={selectedOpponent}
        opponentSquad={selectedOpponentSquad}
        onStart={simulateMatch}
        onBack={() => setCurrentScreen('squad')}
      />
    );
  }

  if (currentScreen === 'matchLive' && matchResult) {
    return (
      <MatchLiveScreen
        matchData={matchResult}
        clubName={club?.name}
        opponentName={matchResult.opponentName}
        onComplete={() => setCurrentScreen('matchResult')}
      />
    );
  }

  if (currentScreen === 'matchResult' && matchResult) {
    return (
      <MatchResultScreen
        result={matchResult}
        onContinue={() => { setMatchResult(null); setCurrentScreen('squad'); }}
      />
    );
  }

  return (
    <div className="app">
      <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1000 }}>
        <button
          onClick={() => setDevMode(!devMode)}
          style={{
            padding: "8px 16px",
            background: devMode ? "#ff4444" : "#4444ff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          Dev Mode: {devMode ? "ON" : "OFF"}
        </button>
      </div>
      <div className="main-header">
        <img src="/logo.png" alt="Squad Clash 26" className="main-header-logo" />
        <span className="main-header-title">Squad Clash 26</span>
      </div>

      {/* ── Picker Drawer ── */}
      {selectedPosition && (
        <div
          className="picker-backdrop"
          onClick={() => { setSelectedPosition(null); setExpandedPlayer(null); }}
        />
      )}
      <div className={`picker-drawer${selectedPosition ? ' picker-drawer-open' : ''}`}>
        <div className="picker-drawer-header">
          <span className="picker-drawer-title">
            {selectedPosition
              ? selectedPosition.isSub
                ? `Pick Sub ${selectedPosition.id.replace('SUB', '')}`
                : `Choose ${selectedPosition.id}`
              : ''}
          </span>
          <button
            className="picker-drawer-close"
            onClick={() => { setSelectedPosition(null); setExpandedPlayer(null); }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="picker-drawer-body">
          {selectedPosition && (
            clubPlayers.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>
                No players in club. Open packs to get started.
              </p>
            ) : filteredPlayers.length > 0 ? (
              filteredPlayers.map((player) => {
                const playerKey = `${player.name}__${player.club}`;
                const alreadySelected = selectedPlayersLookup.has(playerKey);
                return (
                  <div
                    key={playerKey}
                    className={`picker-row ${alreadySelected ? 'picker-row-disabled' : ''}`}
                  >
                    <div
                      className={`picker-shield ${expandedPlayer === player.name ? 'picker-shield-active' : ''} ${getRatingCardClass(player.rating)}`}
                      style={getRatingCardStyle(player.rating)}
                      onClick={() => {
                        if (!alreadySelected) {
                          setExpandedPlayer(expandedPlayer === player.name ? null : player.name);
                        }
                      }}
                    >
                      <span className="picker-rating" style={{ color: getCardRatingColor(player.rating) }}>{player.rating}</span>
                      <span className="picker-pos">{player.position}</span>
                      {(() => {
                        const badge = getFitBadge(player._fit ?? 100);
                        return badge ? (
                          <span className="picker-fit-badge" style={{ background: badge.color }}>{badge.text}</span>
                        ) : null;
                      })()}
                      <PlayerImage player={player} className="picker-image" />
                      <span className="picker-name">{player.name}</span>
                      <span className="picker-club">{player.club}</span>
                      {alreadySelected && (
                        <span className="already-selected-label">Already selected</span>
                      )}
                    </div>
                    {expandedPlayer === player.name && (
                      <div className="picker-stats-panel">
                        <div className="picker-stats-grid">
                          {[
                            ['PAC', player.stats.pac],
                            ['SHO', player.stats.sho],
                            ['PAS', player.stats.pas],
                            ['DRI', player.stats.dri],
                            ['DEF', player.stats.def],
                            ['PHY', player.stats.phy],
                          ].map(([label, val]) => (
                            <div key={label} className="picker-stat-item">
                              <span className="picker-stat-value">{val}</span>
                              <span className="picker-stat-label">{label}</span>
                            </div>
                          ))}
                        </div>
                        <button
                          className={`select-player-btn ${alreadySelected ? 'disabled' : ''}`}
                          disabled={alreadySelected}
                          onClick={() => handlePlayerSelect(player)}
                        >
                          {alreadySelected ? 'Already selected' : 'Select player'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>
                No club players for this position. Open a pack to get some.
              </p>
            )
          )}
        </div>
      </div>

      <div className="game-area">
        <div className="field-section">
          <div className="field">
            <svg
              className="field-markings"
              viewBox="0 0 420 680"
              preserveAspectRatio="none"
            >
              {/* Top penalty area */}
              <rect
                x="85.5"
                y="0"
                width="249"
                height="107"
                fill="none"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="2"
              />
              {/* Top goal area */}
              <rect
                x="153.5"
                y="0"
                width="113"
                height="36"
                fill="none"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="2"
              />
              {/* Top penalty spot */}
              <circle cx="210" cy="71" r="3" fill="rgba(255,255,255,0.7)" />
              {/* Top D arc */}
              <path
                d="M 167.1 107 A 56 56 0 0 0 252.9 107"
                fill="none"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="2"
              />

              {/* Center line */}
              <line
                x1="0"
                y1="340"
                x2="420"
                y2="340"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="2"
              />
              {/* Center circle */}
              <circle
                cx="210"
                cy="340"
                r="56"
                fill="none"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="2"
              />
              {/* Center spot */}
              <circle cx="210" cy="340" r="3" fill="rgba(255,255,255,0.7)" />

              {/* Bottom penalty area */}
              <rect
                x="85.5"
                y="573"
                width="249"
                height="107"
                fill="none"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="2"
              />
              {/* Bottom goal area */}
              <rect
                x="153.5"
                y="644"
                width="113"
                height="36"
                fill="none"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="2"
              />
              {/* Bottom penalty spot */}
              <circle cx="210" cy="609" r="3" fill="rgba(255,255,255,0.7)" />
              {/* Bottom D arc */}
              <path
                d="M 167.1 573 A 56 56 0 0 1 252.9 573"
                fill="none"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="2"
              />

              {/* Corner arcs */}
              <path
                d="M 8 0 A 8 8 0 0 1 0 8"
                fill="none"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="2"
              />
              <path
                d="M 412 0 A 8 8 0 0 0 420 8"
                fill="none"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="2"
              />
              <path
                d="M 0 672 A 8 8 0 0 1 8 680"
                fill="none"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="2"
              />
              <path
                d="M 420 672 A 8 8 0 0 0 412 680"
                fill="none"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="2"
              />
            </svg>

            {currentFormation.map((position) => {
              const selectedPlayer = selectedPlayers[position.id];
              const slotPos = position.id.replace(/\d+$/, "");
              const fitScore = selectedPlayer ? getPositionFit(selectedPlayer.position, slotPos) : null;
              const fitBadge = fitScore !== null && fitScore < 100 ? getFitBadge(fitScore) : null;

              return (
                <button
                  key={position.id}
                  className={`position-button ${selectedPlayer ? `filled-card ${getRatingCardClass(selectedPlayer.rating)}` : ''}`}
                  style={{
                    top: `${position.y}%`,
                    left: `${position.x}%`,
                    ...(selectedPlayer ? getRatingCardStyle(selectedPlayer.rating) : {}),
                  }}
                  onClick={() => {
                    if (selectedPlayer) {
                      setActiveRemoveId(activeRemoveId === position.id ? null : position.id);
                    } else {
                      setActiveRemoveId(null);
                      handlePositionClick(position);
                    }
                  }}
                >
                  {selectedPlayer ? (
                    <div className="mini-card pitch-card">
                      <span className="mini-rating" style={{ color: getCardRatingColor(selectedPlayer.rating) }}>
                        {selectedPlayer.rating}
                      </span>
                      <span className="mini-position">
                        {selectedPlayer.position}
                      </span>
                      {fitBadge && (
                        <span className="mini-fit-badge" style={{ background: fitBadge.color }}>
                          {fitBadge.text}
                        </span>
                      )}

                      <PlayerImage
                        player={selectedPlayer}
                        className="mini-card-image"
                      />

                      <div className="mini-card-name">
                        {selectedPlayer.name}
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="position-label">
                        {position.id.replace(/\d+$/, "")}
                      </span>
                      <span className="player-name">Empty</span>
                    </>
                  )}
                </button>
              );
            })}

            {activeRemoveId && (() => {
              const pos = currentFormation.find(p => p.id === activeRemoveId);
              return pos ? (
                <button
                  className="floating-remove-btn"
                  style={{ top: `calc(${pos.y}% - 72px)`, left: `${pos.x}%` }}
                  onClick={() => { handleRemovePlayer(activeRemoveId); setActiveRemoveId(null); }}
                >
                  Remove
                </button>
              ) : null;
            })()}
          </div>

          <div className="bench">
            {subSlots.map((slot) => {
              const player = selectedPlayers[slot.id];
              const isActive = activeRemoveId === slot.id;
              return (
                <div key={slot.id} className="bench-slot-wrapper">
                  {isActive && (
                    <button
                      className="floating-remove-btn bench-floating-remove"
                      onClick={() => { handleRemovePlayer(slot.id); setActiveRemoveId(null); }}
                    >
                      Remove
                    </button>
                  )}
                  <button
                    className={`bench-slot ${player ? `filled-card ${getRatingCardClass(player.rating)}` : ""}`}
                    style={player ? getRatingCardStyle(player.rating) : undefined}
                    onClick={() => {
                      if (player) {
                        setActiveRemoveId(isActive ? null : slot.id);
                      } else {
                        setActiveRemoveId(null);
                        handlePositionClick(slot);
                      }
                    }}
                  >
                    {player ? (
                      <>
                        <div className="bench-card-top">
                          <span className="bench-card-rating" style={{ color: getCardRatingColor(player.rating) }}>{player.rating}</span>
                          <span className="bench-card-pos">{player.position}</span>
                        </div>
                        <PlayerImage player={player} className="bench-img" />
                        <div className="bench-card-name">{player.name}</div>
                      </>
                    ) : (
                      <>
                        <span className="position-label">SUB</span>
                        <span className="player-name">
                          {slot.id.replace("SUB", "")}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="side-panel">
          <div className="coins-display">
            <span className="coins-icon">🪙</span>
            <span className="coins-label">Coins:</span>
            <span className="coins-amount">{coins.toLocaleString()}</span>
          </div>

          <button className="open-packs-btn" onClick={() => { setPackOpenResult(null); setCurrentScreen("packs"); }}>
            🎴 Open Packs
          </button>

          <button
            className="open-packs-btn"
            style={{ background: "linear-gradient(135deg, #1e3a5f, #1e40af)" }}
            onClick={() => {
              const usedIds = new Set(Object.values(selectedPlayers).map(p => p?.id).filter(Boolean));
              const usedCount = clubPlayers.filter(p => usedIds.has(p.id)).length;
              const freeCount = clubPlayers.length - usedCount;
              console.log(
                '%c🏟️ My Club', 'color: #60a5fa; font-weight: bold',
                '\n  Total club players:', clubPlayers.length,
                '\n  In squad (XI + bench):', usedCount,
                '\n  Free players:', freeCount,
              );
              setCurrentScreen("myClub");
            }}
          >
            🏟️ My Club
          </button>

          {/* TEMP DEBUG PANEL — remove after verification */}
          <div style={{ background: "#0f1f0f", border: "1px solid #22c55e", borderRadius: 10, padding: "12px 14px", marginBottom: 16, fontSize: 12, fontFamily: "monospace", color: "#86efac" }}>
            <div style={{ color: "#4ade80", fontWeight: "bold", marginBottom: 6 }}>🔍 Club</div>

            <div>Club players: <span style={{ color: "#fbbf24" }}>{clubPlayers.length}</span></div>
            <div>Picker showing ({selectedPosition?.id ?? "none"}): <span style={{ color: "#fbbf24" }}>{filteredPlayers?.length ?? 0}</span></div>

            <div style={{ marginTop: 8, borderTop: "1px solid #166534", paddingTop: 8 }}>
              <span style={{ color: "#4ade80", fontWeight: "bold" }}>🏟️ Club inventory: </span>
              <span style={{ color: "#fbbf24" }}>{clubPlayers.length} players</span>
            </div>

            <div style={{ marginTop: 8, color: "#4ade80", fontWeight: "bold" }}>🎴 Open pack → adds to club</div>
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              {[
                { type: "bronze", bg: "#451a03", color: "#fcd34d" },
                { type: "silver", bg: "#374151", color: "#e2e8f0" },
                { type: "gold",   bg: "#78350f", color: "#ffd700" },
              ].map(({ type, bg, color }) => (
                <button
                  key={type}
                  onClick={() => addPackToClub(type)}
                  style={{ flex: 1, padding: "4px 0", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: "bold", fontSize: 11, background: bg, color }}
                >
                  {type}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 8, color: "#4ade80", fontWeight: "bold" }}>🪙 Add coins (debug)</div>
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              {[1000, 10000, 50000].map(amount => (
                <button
                  key={amount}
                  onClick={() => {
                    setCoins(c => c + amount);
                    console.log(`%c💰 +${amount.toLocaleString()} coins added`, 'color: #fbbf24; font-weight: bold');
                  }}
                  style={{ flex: 1, padding: "4px 0", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: "bold", fontSize: 11, background: "#1e3a5f", color: "#93c5fd" }}
                >
                  +{amount.toLocaleString()}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 8, borderTop: "1px solid #166534", paddingTop: 8 }}>
              <button
                onClick={handleResetClubAndPack}
                style={{ width: "100%", padding: "5px 0", borderRadius: 6, border: "1px solid #991b1b", cursor: "pointer", fontWeight: "bold", fontSize: 11, background: "#450a0a", color: "#fca5a5" }}
              >
                🔄 Reset Club + Starter Pack
              </button>
            </div>

            {packOpenResult && (
              <div style={{ marginTop: 8, borderTop: "1px solid #166534", paddingTop: 8 }}>
                <div style={{ color: "#6ee7b7" }}>
                  Last pack: <span style={{ color: "#fbbf24" }}>{packOpenResult.type}</span>
                  {" "}({packOpenResult.players.length - packOpenResult.duplicateIds.size} new,{" "}
                  {packOpenResult.duplicateIds.size} dupes)
                </div>
                {packOpenResult.players.map(p => (
                  <div key={p.id} style={{ paddingLeft: 8, color: packOpenResult.duplicateIds.has(p.id) ? "#4b5563" : "#d1fae5" }}>
                    {p.name} · {p.position} · {p.rating}
                    {packOpenResult.duplicateIds.has(p.id) ? " [dup]" : ""}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="summary-panel">
            <h2 className="summary-title">Selected Squad</h2>
            <div className="squad-stats">
              <div className="squad-stat-row">
                <span className="squad-stat-label">Starting XI</span>
                <span className="squad-stat-value">{selectedStartingPlayers} / 11</span>
              </div>
              <div className="squad-stat-row">
                <span className="squad-stat-label">Bench</span>
                <span className="squad-stat-value">{selectedSubSquad.length} / 7</span>
              </div>
              <div className="squad-stat-divider" />
              <div className="squad-stat-row">
                <span className="squad-stat-label">Team Rating</span>
                <span className="squad-stat-value squad-stat-highlight">{teamRating}</span>
              </div>
              <div className="squad-stat-row">
                <span className="squad-stat-label">Chemistry</span>
                <span className="squad-stat-value squad-stat-chem">{teamChemistry} / 33</span>
              </div>
            </div>
            {selectedSquad.length > 0 ? (
              selectedSquad.map(({ slot, player }) => (
                <div key={slot.id} className="summary-row">
                  <span className="summary-position">
                    {slot.id.replace(/\d+$/, "")}
                  </span>
                  <span className="summary-player">{player.name}</span>
                  <span className="summary-rating">{player.rating}</span>
                </div>
              ))
            ) : (
              <p className="summary-empty">No players selected yet.</p>
            )}
          </div>

          <button
            className="continue-button"
            disabled={!isStartingLineupComplete}
            onClick={() => {
              if (isStartingLineupComplete) {
                const opp   = pickRandomOpponent();
                const squad = generateOpponentSquad(opp);
                setSelectedOpponent(opp);
                setSelectedOpponentSquad(squad);
                setCurrentScreen('matchPreview');
              }
            }}
          >
            {isStartingLineupComplete ? "Start Match" : "Fill 11 starters"}
          </button>

          <p className="picker-hint">Click one of the positions on the field</p>
        </div>
      </div>
    </div>
  );
}

export default App;
