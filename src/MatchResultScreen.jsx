import { getEventDisplay } from './data/eventDisplay';
import { calculateMatchStats, getPlayerOfTheMatch } from './data/matchStats';
import { getClubLogo } from './utils/imageResolvers';

const RESULT_LABEL = { win: 'WIN', draw: 'DRAW', loss: 'LOSS' };
const RESULT_COLOR = { win: '#4ade80', draw: '#facc15', loss: '#f87171' };
const RESULT_BG    = { win: 'rgba(74,222,128,0.08)', draw: 'rgba(250,204,21,0.08)', loss: 'rgba(248,113,113,0.08)' };

// ── Sub-components ────────────────────────────────────────────────

function EventFeed({ events }) {
  if (!events || events.length === 0) return null;
  return (
    <div className="match-event-feed">
      <h2 className="match-event-title">Match Events</h2>
      <div className="match-event-list">
        {events.map((ev, i) => {
          const { icon, text, sub } = getEventDisplay(ev);
          return (
            <div key={i} className={`match-event-row match-event-${ev.team} match-event-type-${ev.type}`}>
              <span className="match-event-minute">{ev.minute}'</span>
              <div className="match-event-body">
                <span className="match-event-text">{icon} {text}</span>
                {sub && <span className="match-event-assist">{sub}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RewardRow({ label, amount, highlight }) {
  return (
    <div className={`reward-row ${highlight ? 'reward-row-total' : ''}`}>
      <span className="reward-label">{label}</span>
      <span className="reward-amount" style={{ color: highlight ? '#fbbf24' : '#86efac' }}>
        +{amount.toLocaleString()}
      </span>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="match-stat-row">
      <span className="match-stat-label">{label}</span>
      <span className="match-stat-value">{value}</span>
    </div>
  );
}

function PowerBar({ label, power, maxPower, color }) {
  const pct = Math.min(100, Math.round((power / maxPower) * 100));
  return (
    <div className="power-bar-row">
      <span className="power-bar-label">{label}</span>
      <div className="power-bar-track">
        <div className="power-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="power-bar-value" style={{ color }}>{power}</span>
    </div>
  );
}

function StatsComparison({ stats, clubName, opponentName, userLogo, oppLogo }) {
  const u = stats.user;
  const o = stats.opponent;

  const rows = [
    { label: 'Goals',           u: u.goals,       o: o.goals       },
    { label: 'Shots',           u: u.shots,       o: o.shots       },
    { label: 'Shots on Target', u: u.shotsOnTarget, o: o.shotsOnTarget },
    { label: 'Saves',           u: u.saves,       o: o.saves       },
    { label: 'Big Chances',     u: u.bigChances,  o: o.bigChances  },
    { label: 'Hit Post',        u: u.hitPost,     o: o.hitPost     },
    { label: 'Yellow Cards',    u: u.yellowCards, o: o.yellowCards },
    { label: 'Red Cards',       u: u.redCards,    o: o.redCards    },
    { label: 'Injuries',        u: u.injuries,    o: o.injuries    },
  ];

  return (
    <div className="stats-comparison">
      <div className="stats-comp-header">
        <div className="stats-comp-team-block stats-comp-team-block-user">
          {userLogo && (
            <img
              src={userLogo}
              alt=""
              className="club-logo result-team-logo"
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
          )}
          <span className="stats-comp-team-label stats-comp-team-user">{clubName ?? 'My Team'}</span>
        </div>
        <span className="stats-comp-title">Match Stats</span>
        <div className="stats-comp-team-block stats-comp-team-block-opp">
          <span className="stats-comp-team-label stats-comp-team-opp">{opponentName ?? 'Opponent'}</span>
          {oppLogo && (
            <img
              src={oppLogo}
              alt=""
              className="club-logo result-team-logo"
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
          )}
        </div>
      </div>
      {rows.map(({ label, u: uv, o: ov }) => {
        const uLower = uv < ov;
        const oLower = ov < uv;
        return (
          <div key={label} className="stats-comp-row">
            <span className={`stats-comp-val stats-comp-val-user${uLower ? ' stats-comp-val-lower' : ''}`}>
              {uv}
            </span>
            <span className="stats-comp-lbl">{label}</span>
            <span className={`stats-comp-val stats-comp-val-opp${oLower ? ' stats-comp-val-lower' : ''}`}>
              {ov}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function PlayerOfTheMatch({ potm }) {
  if (!potm) return null;
  const teamLabel = potm.team === 'user' ? 'My Team' : 'Opponent';
  return (
    <div className="potm-card">
      <span className="potm-icon">⭐</span>
      <div className="potm-body">
        <div className="potm-label">Player of the Match</div>
        <div className="potm-name">{potm.name}</div>
        <div className="potm-meta">
          {potm.club && <span>{potm.club} · </span>}
          <span>{teamLabel}</span>
          {potm.fallback && <span> · (best rated)</span>}
        </div>
      </div>
      {potm.score !== null && (
        <div className="potm-score">{potm.score > 0 ? '+' : ''}{potm.score} pts</div>
      )}
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────

export function MatchResultScreen({ result, onContinue }) {
  const {
    goalsFor, goalsAgainst, resultType,
    baseReward, goalsBonus, cleanSheetBonus, total, coinsAfter,
    teamPower, opponentPower, teamRating, teamChemistry, avgPositionFit,
    events, startingXI, opponentSquad,
    opponentName,
  } = result;

  const label    = RESULT_LABEL[resultType];
  const color    = RESULT_COLOR[resultType];
  const maxPower = Math.max(teamPower, opponentPower, 90);
  const stats    = calculateMatchStats(events, goalsFor, goalsAgainst);
  const potm     = getPlayerOfTheMatch(events, startingXI, opponentSquad);
  const clubName = result.clubName ?? null;

  const userLogo = getClubLogo(clubName);
  const oppLogo  = getClubLogo(opponentName);

  return (
    <div className="match-result-screen">
      {/* Score */}
      <div className="match-score-card" style={{ borderColor: color, background: RESULT_BG[resultType] }}>
        {/* Teams row */}
        <div className="match-teams-row">
          {userLogo && (
            <img
              src={userLogo}
              alt=""
              className="club-logo result-team-logo"
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
          )}
          <span className="match-team-name match-team-name-user">{clubName ?? 'My Team'}</span>
          <span className="match-teams-sep">vs</span>
          <span className="match-team-name">{opponentName ?? 'Opponent'}</span>
          {oppLogo && (
            <img
              src={oppLogo}
              alt=""
              className="club-logo result-team-logo"
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
          )}
        </div>
        <div className="match-score-line">
          <span className="match-goals-for">{goalsFor}</span>
          <span className="match-score-sep">—</span>
          <span className="match-goals-against">{goalsAgainst}</span>
        </div>
        <div className="match-result-label" style={{ color }}>{label}</div>
        {goalsAgainst === 0 && (
          <div className="match-clean-sheet-badge">🧤 Clean Sheet</div>
        )}
      </div>

      {/* Match stats comparison */}
      <StatsComparison stats={stats} clubName={clubName} opponentName={opponentName} userLogo={userLogo} oppLogo={oppLogo} />

      {/* Player of the match */}
      <PlayerOfTheMatch potm={potm} />

      {/* Event feed */}
      <EventFeed events={events} />

      <div className="match-bottom-row">
        {/* Team power stats */}
        <div className="match-stats-card">
          <h2 className="match-stats-title">Team Stats</h2>

          <PowerBar
            label="Your Team"
            power={teamPower}
            maxPower={maxPower}
            color="#4ade80"
          />
          <PowerBar
            label="Opponent"
            power={opponentPower}
            maxPower={maxPower}
            color="#f87171"
          />

          <div className="match-stat-divider" />

          <StatRow label="Team Rating"      value={teamRating} />
          <StatRow label="Chemistry"        value={`${teamChemistry} / 33`} />
          <StatRow label="Avg Position Fit" value={`${avgPositionFit}%`} />
        </div>

        {/* Coin reward */}
        <div className="match-reward-card">
          <h2 className="match-reward-title">🪙 Coins Earned</h2>

          <RewardRow label={`${label} reward`}               amount={baseReward} />
          <RewardRow label={`Goals bonus (${goalsFor} × 65)`} amount={goalsBonus} />
          {cleanSheetBonus > 0 && (
            <RewardRow label="Clean sheet bonus" amount={cleanSheetBonus} />
          )}

          <div className="reward-divider" />
          <RewardRow label="Total earned" amount={total} highlight />

          <div className="reward-balance">
            <span className="reward-balance-label">New balance</span>
            <span className="reward-balance-amount">🪙 {coinsAfter.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <button className="match-continue-btn" onClick={onContinue}>
        Continue →
      </button>
    </div>
  );
}
