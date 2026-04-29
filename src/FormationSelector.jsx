import "./FormationSelector.css";

// ── Preview-only dot coordinates ─────────────────────────────────────────────
// SVG viewBox 0 0 100 130  •  pitch rect x=5 y=5 w=90 h=120
// own goal at bottom (y≈120), opponent goal at top (y≈10)
// center circle cx=50 cy=65 r=8  →  keep dots outside y 57–73 to avoid overlap
const PREVIEW_DOTS = {
  "4-3-3": [
    { cx: 50, cy: 115 },                                                   // GK
    { cx: 14, cy: 100 }, { cx: 36, cy: 100 }, { cx: 64, cy: 100 }, { cx: 86, cy: 100 }, // DEF
    { cx: 24, cy: 76 },  { cx: 50, cy: 76 },  { cx: 76, cy: 76 },          // MID
    { cx: 14, cy: 38 },  { cx: 50, cy: 34 },  { cx: 86, cy: 38 },          // ATT
  ],
  "4-4-2": [
    { cx: 50, cy: 115 },
    { cx: 14, cy: 100 }, { cx: 36, cy: 100 }, { cx: 64, cy: 100 }, { cx: 86, cy: 100 },
    { cx: 11, cy: 76 },  { cx: 36, cy: 75 },  { cx: 64, cy: 75 },  { cx: 89, cy: 76 },
    { cx: 36, cy: 36 },  { cx: 64, cy: 36 },
  ],
  "4-2-3-1": [
    { cx: 50, cy: 115 },
    { cx: 14, cy: 100 }, { cx: 36, cy: 100 }, { cx: 64, cy: 100 }, { cx: 86, cy: 100 },
    { cx: 36, cy: 85 },  { cx: 64, cy: 85 },                                // DM
    { cx: 14, cy: 55 },  { cx: 50, cy: 53 },  { cx: 86, cy: 55 },          // AM
    { cx: 50, cy: 33 },                                                    // ST
  ],
  "4-1-4-1": [
    { cx: 50, cy: 115 },
    { cx: 14, cy: 100 }, { cx: 36, cy: 100 }, { cx: 64, cy: 100 }, { cx: 86, cy: 100 },
    { cx: 50, cy: 85 },                                                    // DM
    { cx: 11, cy: 76 },  { cx: 36, cy: 75 },  { cx: 64, cy: 75 },  { cx: 89, cy: 76 },
    { cx: 50, cy: 33 },
  ],
  "3-5-2": [
    { cx: 50, cy: 115 },
    { cx: 25, cy: 101 }, { cx: 50, cy: 101 }, { cx: 75, cy: 101 },         // CB
    { cx: 10, cy: 80 },  { cx: 30, cy: 76 },  { cx: 50, cy: 75 },  { cx: 70, cy: 76 }, { cx: 90, cy: 80 },
    { cx: 36, cy: 36 },  { cx: 64, cy: 36 },
  ],
  "5-3-2": [
    { cx: 50, cy: 115 },
    { cx: 9,  cy: 100 }, { cx: 27, cy: 103 }, { cx: 50, cy: 104 }, { cx: 73, cy: 103 }, { cx: 91, cy: 100 },
    { cx: 25, cy: 76 },  { cx: 50, cy: 74 },  { cx: 75, cy: 76 },
    { cx: 36, cy: 36 },  { cx: 64, cy: 36 },
  ],
  "4-3-3 DM": [
    { cx: 50, cy: 115 },
    { cx: 14, cy: 100 }, { cx: 36, cy: 100 }, { cx: 64, cy: 100 }, { cx: 86, cy: 100 },
    { cx: 50, cy: 85 },                                                    // DM
    { cx: 28, cy: 75 },  { cx: 72, cy: 75 },                               // CM ×2
    { cx: 14, cy: 38 },  { cx: 50, cy: 34 },  { cx: 86, cy: 38 },
  ],
  "4-3-3 AM": [
    { cx: 50, cy: 115 },
    { cx: 14, cy: 100 }, { cx: 36, cy: 100 }, { cx: 64, cy: 100 }, { cx: 86, cy: 100 },
    { cx: 24, cy: 79 },  { cx: 76, cy: 79 },                               // CM ×2
    { cx: 50, cy: 54 },                                                    // AM
    { cx: 14, cy: 38 },  { cx: 50, cy: 34 },  { cx: 86, cy: 38 },
  ],
  "3-4-3": [
    { cx: 50, cy: 115 },
    { cx: 25, cy: 101 }, { cx: 50, cy: 101 }, { cx: 75, cy: 101 },
    { cx: 11, cy: 76 },  { cx: 36, cy: 75 },  { cx: 64, cy: 75 },  { cx: 89, cy: 76 },
    { cx: 14, cy: 38 },  { cx: 50, cy: 34 },  { cx: 86, cy: 38 },
  ],
};

export function FormationSelector({ formations, selectedFormation, onSelectFormation }) {
  const formationsList = [
    "4-3-3",
    "4-4-2",
    "4-2-3-1",
    "4-1-4-1",
    "3-5-2",
    "5-3-2",
    "4-3-3 DM",
    "4-3-3 AM",
    "3-4-3",
  ];

  return (
    <div className="formation-selector-container">
      <h1 className="formation-selector-title">Choose Your Formation</h1>
      <p className="formation-selector-subtitle">
        Select a formation to build your squad around
      </p>

      <div className="formations-grid">
        {formationsList.map((formationName) => (
          <FormationCard
            key={formationName}
            formationName={formationName}
            isSelected={selectedFormation === formationName}
            onSelect={() => onSelectFormation(formationName)}
          />
        ))}
      </div>
    </div>
  );
}

function FormationCard({ formationName, isSelected, onSelect }) {
  const dots = PREVIEW_DOTS[formationName] ?? [];
  return (
    <button
      className={`formation-card ${isSelected ? "selected" : ""}`}
      onClick={onSelect}
    >
      <div className="formation-pitch">
        <svg viewBox="0 0 100 130" preserveAspectRatio="xMidYMid meet">
          {/* Pitch */}
          <rect x="5" y="5" width="90" height="120" fill="#0a4d0a" stroke="#fff" strokeWidth="0.8" />

          {/* Penalty areas */}
          <rect x="28" y="5"  width="44" height="16" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.35" />
          <rect x="28" y="109" width="44" height="16" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.35" />

          {/* Halfway line */}
          <line x1="5" y1="65" x2="95" y2="65" stroke="#fff" strokeWidth="0.5" opacity="0.35" />

          {/* Center circle */}
          <circle cx="50" cy="65" r="9" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.35" />
          <circle cx="50" cy="65" r="1.2" fill="#fff" opacity="0.35" />

          {/* Top goal */}
          <rect x="36" y="5" width="28" height="5" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.5" />

          {/* Bottom goal */}
          <rect x="36" y="120" width="28" height="5" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.5" />

          {/* GK dot (index 0) — gold */}
          {dots[0] && (
            <circle cx={dots[0].cx} cy={dots[0].cy} r="3.5" fill="#fbbf24" />
          )}
          {/* Outfield dots */}
          {dots.slice(1).map((d, i) => (
            <circle key={i} cx={d.cx} cy={d.cy} r="3" fill="#ffffff" />
          ))}
        </svg>
      </div>

      <div className="formation-info">
        <h3 className="formation-name">{formationName}</h3>
        <p className="formation-count">11 Players</p>
      </div>
    </button>
  );
}
