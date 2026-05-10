import { useState } from 'react';
import { openStarterPack } from './data/packService';
import { getRatingTier, getPlayerRating } from './ratingUtils';
import { PackOpeningVisual, BestCardSpotlight } from './PackReveal';
import { FutCard } from './FutCard';
import { t } from './i18n/index.js';

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
          <h1 className="ob-title">{t('clubIsReady')}</h1>
          <p className="ob-subtitle">{t('openStarterPackDesc')}</p>
        </div>
        <button className="ob-pack-btn" onClick={handleOpenPack} aria-label="Open starter pack">
          <PackOpeningVisual type="starter" opening={false} />
          <span className="ob-pack-cta">{t('tapToOpen')}</span>
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
        <h1 className="ob-title">{t('yourPlayers')}</h1>
        <div className="ob-tier-summary">
          {bronzeCount > 0 && <span className="ob-tier-badge ob-tier-bronze">{bronzeCount} {t('bronze')}</span>}
          {silverCount > 0 && <span className="ob-tier-badge ob-tier-silver">{silverCount} {t('silver')}</span>}
          {goldCount   > 0 && <span className="ob-tier-badge ob-tier-gold">{goldCount} {t('gold')}</span>}
        </div>
      </div>
      <div className="ob-player-grid">
        {[...players].sort((a, b) => getPlayerRating(b) - getPlayerRating(a)).map((p, i) => (
          <FutCard key={p.id} player={p} size="lg" index={i} />
        ))}
      </div>
      <button
        className="ob-continue-btn"
        style={{ animationDelay: btnDelay }}
        onClick={() => onComplete(players)}
      >
        {t('letsPlay')}
      </button>
    </div>
  );
}
