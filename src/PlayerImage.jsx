import { useState } from 'react';
import { getPlayerImage } from './data/playerImages';

const FALLBACK_SRC = '/default-player.svg';

function getInitials(name) {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function getTierClass(rating) {
  if (rating >= 80) return 'player-fallback-gold';
  if (rating >= 65) return 'player-fallback-silver';
  if (rating > 0)   return 'player-fallback-bronze';
  return 'player-fallback-unknown';
}

/**
 * Renders the best available image for a player with a two-level fallback:
 *   getPlayerImage(player)  →  /default-player.svg  →  initials avatar
 *
 * getPlayerImage() checks PLAYER_IMAGE_MAP first (real CDN photo), then
 * player.image (auto-generated avatar), then returns null.
 *
 * The same className is applied in all states so caller CSS sizing is preserved.
 */
export function PlayerImage({ player, className }) {
  const initial = getPlayerImage(player);
  const [src, setSrc]       = useState(initial ?? FALLBACK_SRC);
  const [useCss, setUseCss] = useState(!initial);

  if (useCss) {
    return (
      <div
        className={`player-img-fallback${className ? ` ${className}` : ''}`}
        aria-hidden="true"
      >
        <span className={`player-img-initials ${getTierClass(player?.rating)}`}>
          {getInitials(player?.name)}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      className={className}
      onError={() => {
        if (src !== FALLBACK_SRC) {
          setSrc(FALLBACK_SRC);         // first error: try local SVG
        } else {
          setUseCss(true);              // second error: initials avatar
        }
      }}
    />
  );
}
