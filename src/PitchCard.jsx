import { PlayerImage } from './PlayerImage';
import { getCardRatingColor, getRatingCardStyle, getRatingCardClass } from './ratingUtils';

function lastName(fullName) {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(' ') : fullName;
}

/**
 * PitchCard — unified card for all pitch positions and bench slots.
 * Empty: shows position label + subtle glowing border.
 * Filled: shows rating, position, player photo, and last name.
 */
export function PitchCard({
  player,
  label,
  isBench = false,
  slotId,
  isDragSrc = false,
  isDragTgt = false,
  justDropped = false,
  showRemove = false,
  onRemove,
  onClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}) {
  const isEmpty = !player;
  const tierClass = player ? getRatingCardClass(player.rating) : '';

  const classes = [
    'spc',
    isBench ? 'spc-bench' : 'spc-pitch',
    isEmpty ? 'spc-empty' : `spc-filled ${tierClass}`,
    isDragSrc ? 'spc-drag-src' : '',
    isDragTgt ? 'spc-drag-tgt' : '',
    justDropped ? 'spc-just-dropped' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={`spc-wrap${isBench ? ' spc-wrap-bench' : ''}`}>
      {showRemove && (
        <button className="spc-remove-btn" onClick={onRemove}>
          Remove
        </button>
      )}
      <button
        data-slot-id={slotId}
        className={classes}
        style={isEmpty ? undefined : getRatingCardStyle(player.rating)}
        onClick={isEmpty ? onClick : undefined}
        onPointerDown={isEmpty ? undefined : onPointerDown}
        onPointerMove={isEmpty ? undefined : onPointerMove}
        onPointerUp={isEmpty ? undefined : onPointerUp}
        onPointerCancel={isEmpty ? undefined : onPointerCancel}
      >
        {isEmpty ? (
          <span className="spc-label">{label}</span>
        ) : (
          <>
            {/* Rating + position stacked in top-left */}
            <div className="spc-header">
              <span className="spc-rating" style={{ color: getCardRatingColor(player.rating) }}>
                {player.rating}
              </span>
              <span className="spc-position">{player.position}</span>
            </div>

            {/* Player photo — fills all available middle space */}
            <div className="spc-img-zone">
              <PlayerImage player={player} className="spc-img" />
            </div>

            {/* Last name — bottom strip with gradient scrim behind it */}
            <div className="spc-name">{lastName(player.name)}</div>

            {/* Metallic frame rings */}
            <div className="spc-frame" aria-hidden="true" />
          </>
        )}
      </button>
    </div>
  );
}
