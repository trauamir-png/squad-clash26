import { useState, useEffect, useRef } from "react";
import "./App.css";
import { t } from "./i18n/index.js";
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
import { getClubLogo, getLeagueLogo, initClubLogos } from "./utils/imageResolvers";
import { generateMatchEvents } from "./data/matchSimulator";
import { PlayerImage } from "./PlayerImage";
import { SplashScreen } from "./SplashScreen";
import { FutCard } from "./FutCard";
import { PitchCard } from "./PitchCard";
import "./SquadPitch.css";

// Extracts a display-safe short name for a pitch card (last name, or full if single-word).
function cardName(fullName) {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(' ') : fullName;
}

// Groups a flat formation array into ordered rows for flex-layout rendering.
// Returns rows sorted top→bottom (lowest y first = forwards, highest y last = GK).
function groupFormationRows(formation) {
  const groups = {};
  formation.forEach(pos => {
    if (!groups[pos.y]) groups[pos.y] = [];
    groups[pos.y].push({ ...pos });
  });
  return Object.entries(groups)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([y, positions]) => ({ y: Number(y), positions: positions.sort((a, b) => a.x - b.x) }));
}

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
  const [, setLogoVersion] = useState(0);
  const [dragState, setDragState] = useState(null); // { fromId, isDragging, toId }
  const [droppedIds, setDroppedIds] = useState(new Set());
  const dragRef = useRef(null);
  const ghostRef = useRef(null);

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

  // Kick off club logo enrichment from football-data.org API (7-day localStorage cache).
  // onReady triggers a re-render so FutCard picks up API-sourced logos for clubs
  // not covered by the static FUTBin map.
  useEffect(() => {
    initClubLogos(() => setLogoVersion(v => v + 1));
  }, []);

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

  const handleFullDevReset = () => {
    ['ultimate_team_save_v1', 'squad_clash_language', 'sc26_club_logos_v2'].forEach(k => localStorage.removeItem(k));
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
      { id: "GK",  x: 50, y: 87 },
      { id: "LB",  x: 14, y: 75 }, { id: "CB1", x: 36, y: 75 }, { id: "CB2", x: 64, y: 75 }, { id: "RB",  x: 86, y: 75 },
      { id: "CM1", x: 24, y: 50 }, { id: "CM2", x: 50, y: 50 }, { id: "CM3", x: 76, y: 50 },
      { id: "LW",  x: 18, y: 18 }, { id: "ST",  x: 50, y: 18 }, { id: "RW",  x: 82, y: 18 },
    ],
    "4-4-2": [
      { id: "GK",  x: 50, y: 87 },
      { id: "LB",  x: 14, y: 75 }, { id: "CB1", x: 36, y: 75 }, { id: "CB2", x: 64, y: 75 }, { id: "RB",  x: 86, y: 75 },
      { id: "LM",  x: 12, y: 50 }, { id: "CM1", x: 37, y: 50 }, { id: "CM2", x: 63, y: 50 }, { id: "RM",  x: 88, y: 50 },
      { id: "ST1", x: 35, y: 18 }, { id: "ST2", x: 65, y: 18 },
    ],
    "5-3-2": [
      { id: "GK",  x: 50, y: 87 },
      { id: "LWB", x: 10, y: 75 }, { id: "CB1", x: 28, y: 75 }, { id: "CB2", x: 50, y: 75 }, { id: "CB3", x: 72, y: 75 }, { id: "RWB", x: 90, y: 75 },
      { id: "CM1", x: 25, y: 50 }, { id: "CM2", x: 50, y: 50 }, { id: "CM3", x: 75, y: 50 },
      { id: "ST1", x: 35, y: 18 }, { id: "ST2", x: 65, y: 18 },
    ],
    "4-2-3-1": [
      { id: "GK",   x: 50, y: 87 },
      { id: "LB",   x: 14, y: 75 }, { id: "CB1",  x: 36, y: 75 }, { id: "CB2", x: 64, y: 75 }, { id: "RB",  x: 86, y: 75 },
      { id: "CDM1", x: 36, y: 60 }, { id: "CDM2", x: 64, y: 60 },
      { id: "LM",   x: 18, y: 40 }, { id: "CAM",  x: 50, y: 40 }, { id: "RM",  x: 82, y: 40 },
      { id: "ST",   x: 50, y: 16 },
    ],
    "4-1-4-1": [
      { id: "GK",  x: 50, y: 87 },
      { id: "LB",  x: 14, y: 75 }, { id: "CB1", x: 36, y: 75 }, { id: "CB2", x: 64, y: 75 }, { id: "RB",  x: 86, y: 75 },
      { id: "CDM", x: 50, y: 60 },
      { id: "LM",  x: 12, y: 40 }, { id: "CM1", x: 37, y: 40 }, { id: "CM2", x: 63, y: 40 }, { id: "RM",  x: 88, y: 40 },
      { id: "ST",  x: 50, y: 16 },
    ],
    "3-5-2": [
      { id: "GK",  x: 50, y: 87 },
      { id: "CB1", x: 25, y: 75 }, { id: "CB2", x: 50, y: 75 }, { id: "CB3", x: 75, y: 75 },
      { id: "LWB", x: 10, y: 50 }, { id: "CM1", x: 30, y: 50 }, { id: "CM2", x: 50, y: 50 }, { id: "CM3", x: 70, y: 50 }, { id: "RWB", x: 90, y: 50 },
      { id: "ST1", x: 35, y: 18 }, { id: "ST2", x: 65, y: 18 },
    ],
    "4-3-3 DM": [
      { id: "GK",  x: 50, y: 87 },
      { id: "LB",  x: 14, y: 75 }, { id: "CB1", x: 36, y: 75 }, { id: "CB2", x: 64, y: 75 }, { id: "RB",  x: 86, y: 75 },
      { id: "DM",  x: 50, y: 60 },
      { id: "CM1", x: 30, y: 42 }, { id: "CM2", x: 70, y: 42 },
      { id: "LW",  x: 18, y: 18 }, { id: "ST",  x: 50, y: 18 }, { id: "RW",  x: 82, y: 18 },
    ],
    "4-3-3 AM": [
      { id: "GK",  x: 50, y: 87 },
      { id: "LB",  x: 14, y: 75 }, { id: "CB1", x: 36, y: 75 }, { id: "CB2", x: 64, y: 75 }, { id: "RB",  x: 86, y: 75 },
      { id: "CM1", x: 28, y: 58 }, { id: "CM2", x: 72, y: 58 },
      { id: "AM",  x: 50, y: 40 },
      { id: "LW",  x: 18, y: 18 }, { id: "ST",  x: 50, y: 18 }, { id: "RW",  x: 82, y: 18 },
    ],
    "3-4-3": [
      { id: "GK",  x: 50, y: 87 },
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

  const handleSlotPointerDown = (e, positionId) => {
    if (!selectedPlayers[positionId]) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    const rect = e.currentTarget.getBoundingClientRect();

    // Build a floating ghost that visually represents the dragged card.
    // Direct DOM so position updates bypass React re-renders entirely.
    const ghost = e.currentTarget.cloneNode(true);
    ghost.removeAttribute('data-slot-id');
    Object.assign(ghost.style, {
      position: 'fixed',
      pointerEvents: 'none',
      zIndex: '9999',
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      transform: 'scale(1)',
      transformOrigin: 'center center',
      margin: '0',
      willChange: 'left, top, transform',
      transition: 'transform 0.13s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.13s ease',
      boxShadow: '0 18px 56px rgba(0,0,0,0.78), 0 0 28px rgba(255,215,0,0.5)',
      filter: 'brightness(1.18)',
      opacity: '0.96',
    });
    document.body.appendChild(ghost);
    ghostRef.current = ghost;

    // Peel-off: ramp scale up on next frame so the transition fires
    requestAnimationFrame(() => {
      if (ghostRef.current === ghost) ghost.style.transform = 'scale(1.07)';
    });

    dragRef.current = {
      fromId: positionId,
      startX: e.clientX,
      startY: e.clientY,
      originLeft: rect.left,
      originTop: rect.top,
      isDragging: false,
      toId: null,
    };
    setDragState({ fromId: positionId, isDragging: false, toId: null });
  };

  const handleSlotPointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.isDragging && Math.sqrt(dx * dx + dy * dy) < 6) return;
    if (!drag.isDragging) {
      drag.isDragging = true;
      // Disable transition so ghost tracks pointer without lag
      if (ghostRef.current) ghostRef.current.style.transition = 'box-shadow 0.1s ease';
      setDragState(prev => prev ? { ...prev, isDragging: true } : null);
    }

    // Move ghost via direct DOM — zero re-render overhead
    if (ghostRef.current) {
      ghostRef.current.style.left = `${drag.originLeft + dx}px`;
      ghostRef.current.style.top  = `${drag.originTop  + dy}px`;
    }

    // Detect drop target (ghost has pointer-events:none so elementFromPoint skips it)
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const slotEl = el?.closest('[data-slot-id]');
    const toId = slotEl?.dataset.slotId ?? null;
    if (toId !== drag.toId) {
      drag.toId = toId;
      setDragState(prev => prev ? { ...prev, toId } : null);
    }
  };

  const handleSlotPointerUp = (e, positionId) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (ghostRef.current) { ghostRef.current.remove(); ghostRef.current = null; }
    if (!drag) return;

    if (!drag.isDragging) {
      setDragState(null);
      setActiveRemoveId(activeRemoveId === positionId ? null : positionId);
      return;
    }

    setDragState(null);

    if (drag.toId && drag.toId !== drag.fromId) {
      const updated = { ...selectedPlayers };
      const fromPlayer = updated[drag.fromId];
      const toPlayer = updated[drag.toId] ?? null;
      const landed = new Set([drag.toId]);
      if (toPlayer) { updated[drag.fromId] = toPlayer; landed.add(drag.fromId); }
      else          { delete updated[drag.fromId]; }
      updated[drag.toId] = fromPlayer;
      setSelectedPlayers(updated);
      setActiveRemoveId(null);
      setDroppedIds(landed);
      setTimeout(() => setDroppedIds(new Set()), 420);
    }
  };

  const handleSlotPointerCancel = () => {
    dragRef.current = null;
    if (ghostRef.current) { ghostRef.current.remove(); ghostRef.current = null; }
    setDragState(null);
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

  if (showSplash) {
    return <SplashScreen onStart={() => setShowSplash(false)} />;
  }

  if (!club) {
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
          {t('createYourClub')}
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
              {t('teamName')}
            </label>
            <input
              id="team-name"
              type="text"
              placeholder={t('teamNamePlaceholder')}
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
              {t('logo')}
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
              {t('country')}
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
              <option value="">{t('selectCountry')}</option>
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
            {t('createClub')}
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
                ? `${t('pickSub')} ${selectedPosition.id.replace('SUB', '')}`
                : `${t('choose')} ${String(selectedPosition.id).replace(/\d+$/, '')}`
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

        {/* Scrollable card grid */}
        <div className="picker-drawer-body">
          {selectedPosition && (
            clubPlayers.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>
                {t('noPlayersInClubMsg')}
              </p>
            ) : filteredPlayers.length > 0 ? (
              <div className="picker-grid">
                {filteredPlayers.map((player) => {
                  const playerKey = `${player.name}__${player.club}`;
                  const alreadySelected = selectedPlayersLookup.has(playerKey);
                  return (
                    <FutCard
                      key={playerKey}
                      player={player}
                      size="sm"
                      className={expandedPlayer === player.name ? 'fut-card-active' : ''}
                      extra={(() => {
                        const badge = getFitBadge(player._fit ?? 100);
                        return badge ? <span className="picker-fit-badge" style={{ background: badge.color }}>{badge.text}</span> : null;
                      })()}
                      overlayLabel={alreadySelected ? t('inXI') : null}
                      onClick={() => {
                        if (!alreadySelected) setExpandedPlayer(expandedPlayer === player.name ? null : player.name);
                      }}
                    />
                  );
                })}
              </div>
            ) : (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>
                {t('noClubPlayersForPosition')}
              </p>
            )
          )}
        </div>

        {/* Select panel — sticky footer, outside scroll area */}
        {expandedPlayer && selectedPosition && (() => {
          const p = filteredPlayers.find(pl => pl.name === expandedPlayer);
          if (!p) return null;
          const playerKey = `${p.name}__${p.club}`;
          const alreadySelected = selectedPlayersLookup.has(playerKey);
          return (
            <div className="picker-select-panel">
              <div className="picker-select-info">
                <span className="picker-select-name">{p.name}</span>
                <span className="picker-select-meta">OVR {p.rating} · {p.position}</span>
              </div>
              <button
                className={`select-player-btn${alreadySelected ? ' disabled' : ''}`}
                disabled={alreadySelected}
                onClick={() => handlePlayerSelect(p)}
              >
                {alreadySelected ? t('inXI') : t('selectArrow')}
              </button>
            </div>
          );
        })()}
      </div>

      <div className="game-area">
        {/* ── Pitch + bench (full rebuild) ── */}
        <div className="sb-field-section">
          <div className="sb-field">
            {/* Grass stripes + vignette */}
            <div className="sb-field-bg" aria-hidden="true" />

            {/* SVG pitch markings */}
            <svg
              className="sb-field-markings"
              viewBox="0 0 390 520"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {/* ── Top penalty area ── */}
              <rect x="88" y="0" width="214" height="88"
                fill="none" stroke="rgba(255,255,255,0.70)" strokeWidth="1.5" />
              <rect x="137" y="0" width="116" height="30"
                fill="none" stroke="rgba(255,255,255,0.70)" strokeWidth="1.5" />
              <circle cx="195" cy="58" r="2.5"
                fill="rgba(255,255,255,0.70)" />
              <path d="M 155 88 A 46 46 0 0 0 235 88"
                fill="none" stroke="rgba(255,255,255,0.70)" strokeWidth="1.5" />

              {/* ── Halfway line + centre circle ── */}
              <line x1="0" y1="260" x2="390" y2="260"
                stroke="rgba(255,255,255,0.70)" strokeWidth="1.5" />
              <circle cx="195" cy="260" r="46"
                fill="none" stroke="rgba(255,255,255,0.70)" strokeWidth="1.5" />
              <circle cx="195" cy="260" r="2.5"
                fill="rgba(255,255,255,0.70)" />

              {/* ── Bottom penalty area ── */}
              <rect x="88" y="432" width="214" height="88"
                fill="none" stroke="rgba(255,255,255,0.70)" strokeWidth="1.5" />
              <rect x="137" y="490" width="116" height="30"
                fill="none" stroke="rgba(255,255,255,0.70)" strokeWidth="1.5" />
              <circle cx="195" cy="462" r="2.5"
                fill="rgba(255,255,255,0.70)" />
              <path d="M 155 432 A 46 46 0 0 1 235 432"
                fill="none" stroke="rgba(255,255,255,0.70)" strokeWidth="1.5" />
            </svg>

            {/* Formation rows */}
            <div className="sb-rows">
              {groupFormationRows(currentFormation).map((row) => (
                <div key={row.y} className="sb-row">
                  {row.positions.map((pos) => {
                    const player = selectedPlayers[pos.id];
                    const label  = pos.id.replace(/\d+$/, '');
                    return (
                      <PitchCard
                        key={pos.id}
                        player={player}
                        label={label}
                        slotId={pos.id}
                        isDragSrc={dragState?.fromId === pos.id}
                        isDragTgt={dragState?.isDragging && dragState?.toId === pos.id && dragState?.fromId !== pos.id}
                        justDropped={droppedIds.has(pos.id)}
                        showRemove={activeRemoveId === pos.id}
                        onRemove={() => { handleRemovePlayer(pos.id); setActiveRemoveId(null); }}
                        onClick={() => { setActiveRemoveId(null); handlePositionClick(pos); }}
                        onPointerDown={player ? (e) => handleSlotPointerDown(e, pos.id) : undefined}
                        onPointerMove={player ? handleSlotPointerMove : undefined}
                        onPointerUp={player ? (e) => handleSlotPointerUp(e, pos.id) : undefined}
                        onPointerCancel={player ? handleSlotPointerCancel : undefined}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Bench */}
          <div className="sb-bench">
            {subSlots.map((slot) => {
              const player = selectedPlayers[slot.id];
              const label  = `${slot.id.replace('SUB', '')}`;
              return (
                <PitchCard
                  key={slot.id}
                  player={player}
                  label={label}
                  slotId={slot.id}
                  isBench
                  isDragSrc={dragState?.fromId === slot.id}
                  isDragTgt={dragState?.isDragging && dragState?.toId === slot.id && dragState?.fromId !== slot.id}
                  justDropped={droppedIds.has(slot.id)}
                  showRemove={activeRemoveId === slot.id}
                  onRemove={() => { handleRemovePlayer(slot.id); setActiveRemoveId(null); }}
                  onClick={() => { setActiveRemoveId(null); handlePositionClick(slot); }}
                  onPointerDown={player ? (e) => handleSlotPointerDown(e, slot.id) : undefined}
                  onPointerMove={player ? handleSlotPointerMove : undefined}
                  onPointerUp={player ? (e) => handleSlotPointerUp(e, slot.id) : undefined}
                  onPointerCancel={player ? handleSlotPointerCancel : undefined}
                />
              );
            })}
          </div>
        </div>

        <div className="side-panel">
          <div className="coins-display">
            <span className="coins-icon">🪙</span>
            <span className="coins-label">{t('coins')}</span>
            <span className="coins-amount">{coins.toLocaleString()}</span>
          </div>

          <button className="open-packs-btn" onClick={() => { setPackOpenResult(null); setCurrentScreen("packs"); }}>
            {t('openPacksBtn')}
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
            {t('myClubBtn')}
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

            <div style={{ marginTop: 8, borderTop: "1px solid #166534", paddingTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              <button
                onClick={handleResetClubAndPack}
                style={{ width: "100%", padding: "5px 0", borderRadius: 6, border: "1px solid #991b1b", cursor: "pointer", fontWeight: "bold", fontSize: 11, background: "#450a0a", color: "#fca5a5" }}
              >
                🔄 Reset Club + Starter Pack
              </button>
              <button
                onClick={handleFullDevReset}
                style={{ width: "100%", padding: "6px 0", borderRadius: 6, border: "2px solid #f97316", cursor: "pointer", fontWeight: "bold", fontSize: 12, background: "#431407", color: "#fb923c" }}
              >
                💥 Full Dev Reset (clears all)
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
            <h2 className="summary-title">{t('selectedSquad')}</h2>
            <div className="squad-stats">
              <div className="squad-stat-row">
                <span className="squad-stat-label">{t('startingXI')}</span>
                <span className="squad-stat-value">{selectedStartingPlayers} / 11</span>
              </div>
              <div className="squad-stat-row">
                <span className="squad-stat-label">{t('bench')}</span>
                <span className="squad-stat-value">{selectedSubSquad.length} / 7</span>
              </div>
              <div className="squad-stat-divider" />
              <div className="squad-stat-row">
                <span className="squad-stat-label">{t('teamRatingLabel')}</span>
                <span className="squad-stat-value squad-stat-highlight">{teamRating}</span>
              </div>
              <div className="squad-stat-row">
                <span className="squad-stat-label">{t('chemistryLabel')}</span>
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
              <p className="summary-empty">{t('noPlayersSelected')}</p>
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
            {isStartingLineupComplete ? t('startMatchBtn') : t('fill11Starters')}
          </button>

          <p className="picker-hint">{t('clickPosition')}</p>
        </div>
      </div>
    </div>
  );
}

export default App;
