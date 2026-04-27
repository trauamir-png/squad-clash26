import { useState } from 'react';
import { openStarterPack } from './data/packService';
import { getCardRatingColor, getRatingTier, getRatingCardStyle, getRatingCardClass } from './ratingUtils';
import { PlayerImage } from './PlayerImage';
import { PackOpeningVisual, BestCardSpotlight } from './PackReveal';

const STATS = ['pac', 'sho', 'pas', 'dri', 'def', 'phy'];

function OnboardingPlayerCard({ player, index }) {
  return (
    <div
      className={`ob-player-card ${getRatingCardClass(player.rating)}`}
      style={{ ...getRatingCardStyle(player.rating), '--i': index }}
    >
      <div className="ob-card-top">
        <span className="ob-card-rating" style={{ color: getCardRatingColor(player.rating) }}>{player.rating}</span>
        <span className="ob-card-pos">{player.position}</span>
      </div>
      <PlayerImage player={player} className="ob-card-img" />
      <div className="ob-card-name">{player.name}</div>
      <div className="ob-card-club">{player.club}</div>
      {player.stats && (
        <div className="ob-card-stats">
          {STATS.map(s => (
            <div key={s} className="ob-card-stat">
              <span className="ob-stat-val">{player.stats[s]}</span>
              <span className="ob-stat-key">{s.toUpperCase()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function OnboardingPackScreen({ onComplete }) {
  // 'idle' | 'opening' | 'spotlight' | 'revealed'
  const [phase, setPhase]     = useState('idle');
  const [players, setPlayers] = useState([]);

  function handleOpenPack() {
    if (phase !== 'idle') return;
    const received = openStarterPack();
    setPlayers(received);
    setPhase('opening');
    setTimeout(() => setPhase('spotlight'), 900);
  }

  if (phase === 'idle') {
    return (
      <div className="ob-screen ob-screen-center">
        <div className="ob-intro">
          <h1 className="ob-title">Your Club is Ready!</h1>
          <p className="ob-subtitle">Open your Starter Pack to begin building your squad.</p>
        </div>
        <button className="ob-pack-btn" onClick={handleOpenPack} aria-label="Open starter pack">
          <PackOpeningVisual type="starter" opening={false} />
          <span className="ob-pack-cta">Tap to open</span>
        </button>
      </div>
    );
  }

  if (phase === 'opening') {
    return (
      <div className="ob-screen ob-screen-center">
        <PackOpeningVisual type="starter" opening={true} />
        <div className="ob-pack-flash" aria-hidden="true" />
      </div>
    );
  }

  if (phase === 'spotlight') {
    return (
      <BestCardSpotlight
        players={players}
        onDone={() => setPhase('revealed')}
      />
    );
  }

  const bronzeCount = players.filter(p => getRatingTier(p.rating) === 'bronze').length;
  const silverCount = players.filter(p => getRatingTier(p.rating) === 'silver').length;
  const goldCount   = players.filter(p => getRatingTier(p.rating) === 'gold').length;
  const btnDelay    = `${players.length * 70 + 600}ms`;

  return (
    <div className="ob-screen">
      <div className="ob-reveal-header">
        <h1 className="ob-title">Your Players!</h1>
        <div className="ob-tier-summary">
          {bronzeCount > 0 && <span className="ob-tier-badge ob-tier-bronze">{bronzeCount} Bronze</span>}
          {silverCount > 0 && <span className="ob-tier-badge ob-tier-silver">{silverCount} Silver</span>}
          {goldCount   > 0 && <span className="ob-tier-badge ob-tier-gold">{goldCount} Gold</span>}
        </div>
      </div>
      <div className="ob-player-grid">
        {players.map((p, i) => <OnboardingPlayerCard key={p.id} player={p} index={i} />)}
      </div>
      <button
        className="ob-continue-btn"
        style={{ animationDelay: btnDelay }}
        onClick={() => onComplete(players)}
      >
        Let's Play →
      </button>
    </div>
  );
}
