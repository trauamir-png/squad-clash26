import "./FormationSelector.css";

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
            formation={formations[formationName]}
            isSelected={selectedFormation === formationName}
            onSelect={() => onSelectFormation(formationName)}
          />
        ))}
      </div>
    </div>
  );
}

function FormationCard({ formationName, formation, isSelected, onSelect }) {
  return (
    <button
      className={`formation-card ${isSelected ? "selected" : ""}`}
      onClick={onSelect}
    >
      <div className="formation-pitch">
        <svg viewBox="0 0 100 130" preserveAspectRatio="xMidYMid meet">
          {/* Field background - vertical pitch (top = opponent goal, bottom = own goal) */}
          <rect x="5" y="5" width="90" height="120" fill="#0a4d0a" stroke="#fff" strokeWidth="0.8" />

          {/* Halfway line - HORIZONTAL across the middle */}
          <line x1="5" y1="65" x2="95" y2="65" stroke="#fff" strokeWidth="0.5" opacity="0.4" />

          {/* Center circle */}
          <circle cx="50" cy="65" r="8" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.4" />
          <circle cx="50" cy="65" r="1.5" fill="#fff" opacity="0.4" />

          {/* Top goal (opponent's goal) */}
          <g opacity="0.5">
            <line x1="28" y1="5" x2="28" y2="10" stroke="#fff" strokeWidth="1" />
            <line x1="72" y1="5" x2="72" y2="10" stroke="#fff" strokeWidth="1" />
            <line x1="28" y1="10" x2="72" y2="10" stroke="#fff" strokeWidth="1" />
          </g>

          {/* Bottom goal (own goal) */}
          <g opacity="0.5">
            <line x1="28" y1="120" x2="28" y2="125" stroke="#fff" strokeWidth="1" />
            <line x1="72" y1="120" x2="72" y2="125" stroke="#fff" strokeWidth="1" />
            <line x1="28" y1="120" x2="72" y2="120" stroke="#fff" strokeWidth="1" />
          </g>

          {/* Player positions as white dots */}
          {formation.map((position) => (
            <circle
              key={position.id}
              cx={position.x}
              cy={position.y}
              r="3"
              fill="#ffffff"
              opacity="1"
            />
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
