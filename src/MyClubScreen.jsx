import { useState } from 'react';
import { getCardRatingColor, getRatingCardStyle, getRatingCardClass, sortByRating } from './ratingUtils';
import { PlayerImage } from './PlayerImage';
import { getClubLogo } from './utils/imageResolvers';
import { getAllPlayers } from './data/csvPlayerStore';

const STAT_KEYS = ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'];

// Lazy index for recovering stats from stale saves that predate the stats field.
let _statsById = null;
function getStatsIndex() {
  if (!_statsById) {
    _statsById = new Map(getAllPlayers().map(p => [p.id, p.stats]));
  }
  return _statsById;
}

// Resolve stats for a player: prefer player.stats (always present on fresh saves),
// fall back to CSV index for any stale save that was serialized without stats.
function resolveStats(player) {
  if (player.stats && typeof player.stats.pac === 'number') return player.stats;
  return getStatsIndex().get(player.id) ?? { pac: 50, sho: 50, pas: 50, dri: 50, def: 50, phy: 50 };
}

function statBarColor(val) {
  if (val >= 80) return '#4ade80';
  if (val >= 65) return '#facc15';
  return '#f87171';
}

function StatusBadge({ status }) {
  if (status === 'xi')    return <span className="mc-badge mc-badge-xi">XI</span>;
  if (status === 'bench') return <span className="mc-badge mc-badge-bench">Bench</span>;
  return null;
}

export function MyClubScreen({ clubPlayers, selectedPlayers, currentFormation, subSlots, clubName, onBack }) {
  const [flippedId, setFlippedId] = useState(null);

  const xiIds    = new Set(currentFormation.map(pos => selectedPlayers[pos.id]?.id).filter(Boolean));
  const benchIds = new Set(subSlots.map(slot => selectedPlayers[slot.id]?.id).filter(Boolean));

  const usedCount = xiIds.size + benchIds.size;

  const players = sortByRating(
    clubPlayers.map(p => ({
      ...p,
      status: xiIds.has(p.id) ? 'xi' : benchIds.has(p.id) ? 'bench' : 'free',
    }))
  );

  const clubLogo = getClubLogo(clubName);

  function handleCardClick(playerId) {
    setFlippedId(prev => prev === playerId ? null : playerId);
  }

  return (
    <div className="mc-screen">
      <div className="mc-topbar">
        <button className="mc-back-btn" onClick={onBack}>← Back to Squad</button>
        <div className="mc-club-title-group">
          {clubLogo && (
            <img
              src={clubLogo}
              alt=""
              className="club-logo mc-club-logo"
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
          )}
          <h1 className="mc-title">{clubName ? `${clubName}` : 'My Club'}</h1>
        </div>
        <div className="mc-summary-badges">
          <span className="mc-summary-item mc-summary-xi">{xiIds.size} XI</span>
          <span className="mc-summary-item mc-summary-bench">{usedCount - xiIds.size} Bench</span>
          <span className="mc-summary-item mc-summary-total">{clubPlayers.length} Total</span>
        </div>
      </div>

      {clubPlayers.length === 0 ? (
        <p className="mc-empty">No players in club. Open packs to get started.</p>
      ) : (
        <div className="mc-grid">
          {players.map(player => {
            const faceClass = `mc-card mc-card-${player.status} ${getRatingCardClass(player.rating)}`;
            const faceStyle = getRatingCardStyle(player.rating);
            const isFlipped = flippedId === player.id;

            return (
              <div
                key={player.id}
                className={`mc-card-wrapper${isFlipped ? ' is-flipped' : ''}`}
                onClick={() => handleCardClick(player.id)}
                title="Click to see stats"
              >
                <div className="mc-card-inner">

                  {/* ── Front ── */}
                  <div className={`${faceClass} mc-card-front`} style={faceStyle}>
                    <div className="mc-card-top">
                      <div className="mc-card-top-left">
                        <span className="mc-card-rating" style={{ color: getCardRatingColor(player.rating) }}>
                          {player.rating}
                        </span>
                        <span className="mc-card-pos">{player.position}</span>
                      </div>
                      <StatusBadge status={player.status} />
                    </div>
                    <PlayerImage player={player} className="mc-card-img" />
                    <div className="mc-card-name">{player.name}</div>
                    <div className="mc-card-meta">{player.club}</div>
                  </div>

                  {/* ── Back ── */}
                  <div className={`${faceClass} mc-card-back`} style={faceStyle}>
                    <div className="mc-back-header">
                      <div className="mc-card-top">
                        <div className="mc-card-top-left">
                          <span className="mc-card-rating" style={{ color: getCardRatingColor(player.rating) }}>
                            {player.rating}
                          </span>
                          <span className="mc-card-pos">{player.position}</span>
                        </div>
                        <StatusBadge status={player.status} />
                      </div>
                      <div className="mc-back-player-name">{player.name}</div>
                    </div>

                    <div className="mc-back-stats">
                      {STAT_KEYS.map(key => {
                        const val = resolveStats(player)[key.toLowerCase()];
                        const fill = statBarColor(val);
                        return (
                          <div key={key} className="mc-stat-row">
                            <span className="mc-stat-label">{key}</span>
                            <span className="mc-stat-val">{val}</span>
                            <div className="mc-stat-bar-track">
                              <div
                                className="mc-stat-bar-fill"
                                style={{ width: `${Math.round((val / 99) * 100)}%`, background: fill }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
