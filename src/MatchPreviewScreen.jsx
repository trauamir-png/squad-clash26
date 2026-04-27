import { calculateOpponentTeamRating, calculateOpponentPower } from './data/opponentSquadService';
import { OpponentPitch } from './components/OpponentPitch';
import { getClubLogo } from './utils/imageResolvers';

const DIFFICULTY_CLASS = { Easy: 'easy', Medium: 'medium', Hard: 'hard' };

export function MatchPreviewScreen({ clubName, teamRating, teamChemistry, formation, opponent, opponentSquad, onStart, onBack }) {
  const diffClass = DIFFICULTY_CLASS[opponent.difficulty] ?? 'medium';

  const hasSquad       = opponentSquad && opponentSquad.length > 0;
  const displayRating  = hasSquad ? calculateOpponentTeamRating(opponentSquad) : opponent.rating;
  const displayPower   = hasSquad ? Math.round(calculateOpponentPower(opponentSquad, opponent)) : opponent.power;

  const userLogo = getClubLogo(clubName);
  const oppLogo  = getClubLogo(opponent.name);

  return (
    <div className="preview-screen">
      <p className="preview-label">Match Preview</p>

      {/* Matchup header */}
      <div className="preview-matchup">
        <div className="preview-team preview-team-user">
          {userLogo && (
            <img
              src={userLogo}
              alt=""
              className="club-logo preview-team-logo"
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
          )}
          <span className="preview-team-name">{clubName ?? 'Your Team'}</span>
          <span className="preview-team-tag preview-tag-user">You</span>
        </div>
        <span className="preview-matchup-vs">VS</span>
        <div className="preview-team preview-team-opp">
          {oppLogo ? (
            <img
              src={oppLogo}
              alt=""
              className="club-logo preview-team-logo"
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <span className="preview-opp-badge">{opponent.badge}</span>
          )}
          <span className="preview-team-name preview-opp-name">{opponent.name}</span>
          <span className={`preview-difficulty-badge preview-diff-${diffClass}`}>
            {opponent.difficulty}
          </span>
        </div>
      </div>

      {/* Opponent description */}
      <p className="preview-opp-desc">{opponent.description}</p>

      {/* Stats comparison */}
      <div className="preview-stats-row">
        <div className="preview-stats-card">
          <h3 className="preview-stats-title preview-stats-title-user">Your Team</h3>
          <div className="preview-stat">
            <span className="preview-stat-label">Rating</span>
            <span className="preview-stat-value">{teamRating}</span>
          </div>
          <div className="preview-stat">
            <span className="preview-stat-label">Chemistry</span>
            <span className="preview-stat-value">
              {teamChemistry} <span className="preview-stat-max">/ 33</span>
            </span>
          </div>
          <div className="preview-stat">
            <span className="preview-stat-label">Formation</span>
            <span className="preview-stat-value">{formation}</span>
          </div>
        </div>

        <div className="preview-stats-card preview-stats-opp">
          <h3 className="preview-stats-title preview-stats-title-opp">Opponent</h3>
          <div className="preview-stat">
            <span className="preview-stat-label">Rating</span>
            <span className="preview-stat-value">{displayRating}</span>
          </div>
          <div className="preview-stat">
            <span className="preview-stat-label">Chemistry</span>
            <span className="preview-stat-value">
              {opponent.chemistry} <span className="preview-stat-max">/ 33</span>
            </span>
          </div>
          <div className="preview-stat">
            <span className="preview-stat-label">Power</span>
            <span className="preview-stat-value">{displayPower}</span>
          </div>
        </div>
      </div>

      {/* Opponent lineup */}
      {opponentSquad && opponentSquad.length > 0 && (
        <div className="preview-lineup">
          <h3 className="preview-lineup-title">Opponent Starting XI</h3>
          <OpponentPitch opponentSquad={opponentSquad} />
        </div>
      )}

      {/* Actions */}
      <div className="preview-actions">
        <button className="preview-start-btn" onClick={onStart}>
          ▶ Start Match
        </button>
        <button className="preview-back-btn" onClick={onBack}>
          ← Back
        </button>
      </div>
    </div>
  );
}
