import { useState } from 'react';
import { getCardRatingColor, getRatingCardClass, getRatingCardStyle } from './ratingUtils';
import { PlayerImage } from './PlayerImage';
import { getClubLogo } from './utils/imageResolvers';

const NATION_FLAGS = {
  'France':'🇫🇷','England':'🇬🇧','Spain':'🇪🇸','Germany':'🇩🇪',
  'Brazil':'🇧🇷','Argentina':'🇦🇷','Portugal':'🇵🇹','Norway':'🇳🇴',
  'Belgium':'🇧🇪','Italy':'🇮🇹','Netherlands':'🇳🇱','Holland':'🇳🇱',
  'Croatia':'🇭🇷','Poland':'🇵🇱','Denmark':'🇩🇰','Sweden':'🇸🇪',
  'United States':'🇺🇸','USA':'🇺🇸','Mexico':'🇲🇽','Colombia':'🇨🇴',
  'Uruguay':'🇺🇾','Chile':'🇨🇱','Ecuador':'🇪🇨','Peru':'🇵🇪',
  'Japan':'🇯🇵','South Korea':'🇰🇷','Australia':'🇦🇺','Canada':'🇨🇦',
  'Morocco':'🇲🇦','Senegal':'🇸🇳','Nigeria':'🇳🇬','Ghana':'🇬🇭',
  'Egypt':'🇪🇬','Ivory Coast':'🇨🇮','Cameroon':'🇨🇲',
  'Turkey':'🇹🇷','Serbia':'🇷🇸','Austria':'🇦🇹','Switzerland':'🇨🇭',
  'Scotland':'🏴󠁧󠁢󠁳󠁣󠁴󠁿','Wales':'🏴󠁧󠁢󠁷󠁬󠁳󠁿','Ireland':'🇮🇪',
  'Czech Republic':'🇨🇿','Czechia':'🇨🇿','Hungary':'🇭🇺',
  'Romania':'🇷🇴','Greece':'🇬🇷','Ukraine':'🇺🇦','Russia':'🇷🇺',
  'Slovakia':'🇸🇰','Slovenia':'🇸🇮','Finland':'🇫🇮','Iceland':'🇮🇸',
  'Bosnia and Herzegovina':'🇧🇦','Bosnia':'🇧🇦',
  'Albania':'🇦🇱','Montenegro':'🇲🇪','North Macedonia':'🇲🇰',
  'Kosovo':'🇽🇰','Bulgaria':'🇧🇬','Israel':'🇮🇱',
  'Saudi Arabia':'🇸🇦','Iran':'🇮🇷','China':'🇨🇳',
  'DR Congo':'🇨🇩','Congo':'🇨🇬','Mali':'🇲🇱',
  'Algeria':'🇩🇿','Tunisia':'🇹🇳','South Africa':'🇿🇦',
  'Jamaica':'🇯🇲','Costa Rica':'🇨🇷','Venezuela':'🇻🇪',
  'Paraguay':'🇵🇾','Bolivia':'🇧🇴','New Zealand':'🇳🇿',
  'Cape Verde':'🇨🇻','Gabon':'🇬🇦','Guinea':'🇬🇳','Zimbabwe':'🇿🇼','Panama':'🇵🇦',
};

const STATS = ['pac','sho','pas','dri','def','phy'];

function ClubBadge({ club, logoUrl }) {
  const [failed, setFailed] = useState(false);
  if (logoUrl && !failed) {
    return (
      <img
        className="fut-club-logo"
        src={logoUrl}
        alt={club || ''}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span className="fut-club-dot" title={club}>
      {(club || '?')[0].toUpperCase()}
    </span>
  );
}

export function FutCard({ player, size='md', index=0, overlayLabel, dimmed=false, extra, onClick, className='' }) {
  const tileColor = getCardRatingColor(player.rating);
  const flag = NATION_FLAGS[player.nationality] || NATION_FLAGS[player.country] || '';
  const leagueShort = (player.leagueName && player.leagueName !== 'Unknown')
    ? player.leagueName.replace(/EA SPORTS|SPORTS/gi,'').trim().slice(0,6)
    : '';
  const clubLogoUrl = player.clubLogo || player.clubLogoUrl || getClubLogo(player.club);

  return (
    <div
      className={`fut-card fut-card-${size} ${getRatingCardClass(player.rating)}${className ? ` ${className}` : ''}`}
      style={{ ...getRatingCardStyle(player.rating), '--i': index, opacity: dimmed ? 0.55 : 1 }}
      onClick={onClick}
    >
      <div className="fut-burst" aria-hidden="true" />

      <div className="fut-top-left">
        <span className="fut-rating" style={{ color: tileColor }}>{player.rating}</span>
        <span className="fut-pos" style={{ color: tileColor }}>{player.position}</span>
      </div>

      {extra && <div className="fut-extra-slot">{extra}</div>}

      <div className="fut-img-wrap">
        <PlayerImage player={player} className="fut-img" />
      </div>

      <div className="fut-name">{player.name}</div>

      {player.stats && (
        <div className="fut-stats">
          {STATS.map(s => (
            <div key={s} className="fut-stat">
              <span className="fut-stat-val" style={{ color: tileColor }}>{player.stats[s]}</span>
              <span className="fut-stat-key">{s.toUpperCase()}</span>
            </div>
          ))}
        </div>
      )}

      <div className="fut-badges">
        {flag
          ? <span className="fut-flag">{flag}</span>
          : player.nationality
            ? <span className="fut-badge-abbr">{player.nationality.slice(0,3).toUpperCase()}</span>
            : null}
        {leagueShort && <span className="fut-badge-abbr">{leagueShort}</span>}
        <ClubBadge club={player.club} logoUrl={clubLogoUrl} />
      </div>

      {/* Metallic frame rings + animated shimmer — rendered above content, below overlay */}
      <div className="fut-frame" aria-hidden="true" />

      {overlayLabel && <div className="fut-overlay">{overlayLabel}</div>}
    </div>
  );
}
