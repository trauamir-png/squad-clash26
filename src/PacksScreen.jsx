import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { getPlayerRating } from './ratingUtils';
import { PackOpeningVisual, BestCardSpotlight } from './PackReveal';
import { FutCard } from './FutCard';
import { t } from './i18n/index.js';

function getPackMeta() {
  return {
    starter: {
      label: t('starterPack'),
      desc: t('starterPackDesc'),
      headerColor: "#ffffff",
      border: "#6b7280",
    },
    bronze: {
      label: t('bronzePack'),
      desc: t('bronzePackDesc'),
      headerColor: "#fcd34d",
      border: "#92400e",
    },
    silver: {
      label: t('silverPack'),
      desc: t('silverPackDesc'),
      headerColor: "#e2e8f0",
      border: "#475569",
    },
    gold: {
      label: t('goldPack'),
      desc: t('goldPackDesc'),
      headerColor: "#ffd700",
      border: "#d97706",
    },
  };
}

function PurchaseModal({ packType, price, onConfirm, onCancel }) {
  const meta = getPackMeta()[packType];
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-pack-visual" aria-hidden="true">
          <PackOpeningVisual type={packType} opening={false} />
        </div>
        <h2 className="modal-title" style={{ color: meta.headerColor }}>{meta.label}</h2>
        <p className="modal-body">
          {t('purchaseFor')} <span className="modal-price">🪙 {price.toLocaleString()}</span>?
        </p>
        <div className="modal-actions">
          <button className="modal-confirm-btn" onClick={onConfirm}>{t('confirmPurchase')}</button>
          <button className="modal-cancel-btn" onClick={onCancel}>{t('cancel')}</button>
        </div>
      </div>
    </div>
  );
}

export function PacksScreen({ packOpenResult, onOpenPack, onBack, onClearResult, coins = 0, packPrices = {}, errorMsg, onClearError }) {
  const [pendingPackType, setPendingPackType] = useState(null);
  const [notEnoughCoins, setNotEnoughCoins] = useState(false);
  const notEnoughTimerRef = useRef(null);

  useEffect(() => {
    return () => { if (notEnoughTimerRef.current) clearTimeout(notEnoughTimerRef.current); };
  }, []);

  // 'idle' | 'sealed' | 'opening' | 'spotlight' | 'revealed'
  const [packPhase, setPackPhase] = useState('idle');

  // Initialised to the current packOpenResult so that a re-mounted existing
  // result is recognised as "already seen" and goes straight to 'revealed'.
  const prevResultRef = useRef(packOpenResult);

  // useLayoutEffect fires before the browser paints, preventing the
  // one-frame flash of the revealed card grid that useEffect would cause.
  useLayoutEffect(() => {
    if (!packOpenResult) {
      setPackPhase('idle');
      prevResultRef.current = null;
      return;
    }
    if (packOpenResult === prevResultRef.current) {
      // Re-mount with the same result — skip straight to revealed
      setPackPhase('revealed');
      return;
    }
    // New result — show the sealed pack so the user can tap to open it
    prevResultRef.current = packOpenResult;
    setPackPhase('sealed');
  }, [packOpenResult]);

  function handleOpenSealed() {
    setPackPhase('opening');
    setTimeout(() => setPackPhase('spotlight'), 900);
  }

  // ── Sealed pack — tap to open ─────────────────────────────────────────────
  if (packOpenResult && packPhase === 'sealed') {
    return (
      <div className="ob-screen ob-screen-center" onClick={handleOpenSealed}>
        <PackOpeningVisual type={packOpenResult.type} opening={false} />
        <span className="ob-pack-cta">{t('tapToOpen')}</span>
      </div>
    );
  }

  // ── Pack opening animation ─────────────────────────────────────────────────
  if (packOpenResult && packPhase === 'opening') {
    return (
      <div className="ob-screen ob-screen-center">
        <PackOpeningVisual type={packOpenResult.type} opening={true} />
        <div className="ob-pack-flash" aria-hidden="true" />
      </div>
    );
  }

  // ── Best card spotlight ────────────────────────────────────────────────────
  if (packOpenResult && packPhase === 'spotlight') {
    return (
      <BestCardSpotlight
        players={packOpenResult.players}
        onDone={() => setPackPhase('revealed')}
      />
    );
  }

  // ── Pack selection screen ──────────────────────────────────────────────────
  const handlePackClick = (type) => {
    const price = packPrices[type];
    if (coins < price) {
      if (notEnoughTimerRef.current) clearTimeout(notEnoughTimerRef.current);
      setNotEnoughCoins(true);
      notEnoughTimerRef.current = setTimeout(() => setNotEnoughCoins(false), 2800);
      return;
    }
    setNotEnoughCoins(false);
    setPendingPackType(type);
  };

  const confirmPurchase = () => {
    onOpenPack(pendingPackType);
    setPendingPackType(null);
  };

  const coinDisplay = (
    <div className="packs-coin-display">
      <span className="packs-coin-icon">🪙</span>
      <span className="packs-coin-amount">{coins.toLocaleString()}</span>
    </div>
  );

  if (!packOpenResult) {
    return (
      <div className="packs-screen">
        <div className="packs-topbar">
          <button className="packs-back-btn" onClick={onBack}>{t('backToSquad')}</button>
          <h1 className="packs-title">{t('openPacks')}</h1>
          {coinDisplay}
        </div>

        {errorMsg && (
          <div className="packs-error-banner" onClick={onClearError}>
            ⚠️ {errorMsg}
          </div>
        )}

        {notEnoughCoins && (
          <div className="packs-not-enough" onClick={() => setNotEnoughCoins(false)}>
            {t('notEnoughCoins')}
          </div>
        )}

        {pendingPackType && (
          <PurchaseModal
            packType={pendingPackType}
            price={packPrices[pendingPackType]}
            onConfirm={confirmPurchase}
            onCancel={() => setPendingPackType(null)}
          />
        )}

        <div className="packs-selection">
          {["bronze", "silver", "gold"].map(type => {
            const meta = getPackMeta()[type];
            const price = packPrices[type];
            const canAfford = coins >= price;
            return (
              <button
                key={type}
                className={`pack-choice-card ${!canAfford ? "pack-choice-locked" : ""}`}
                style={{ borderColor: meta.border }}
                onClick={() => handlePackClick(type)}
              >
                <div className="pack-choice-visual" aria-hidden="true">
                  <PackOpeningVisual type={type} opening={false} />
                </div>
                <span className="pack-choice-label" style={{ color: meta.headerColor }}>
                  {meta.label}
                </span>
                <span className="pack-choice-desc">{meta.desc}</span>
                <span className="pack-choice-price" style={{ color: canAfford ? "#fbbf24" : "#ef4444" }}>
                  🪙 {price.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Revealed state: staggered result grid ─────────────────────────────────
  const { type, players, duplicateIds } = packOpenResult;
  const meta = getPackMeta()[type];
  const newCount = players.length - duplicateIds.size;
  const btnDelay = `${players.length * 60 + 500}ms`;

  return (
    <div className="packs-screen">
      <div className="packs-topbar" style={{ animation: 'ob-fadein 0.4s ease both' }}>
        <h1 className="packs-title" style={{ color: meta.headerColor }}>
          {meta.label} {t('packOpened')}
        </h1>
        <div className="packs-result-summary">
          <span className="packs-new-badge">{newCount} {t('newPlayers')}</span>
          {duplicateIds.size > 0 && (
            <span className="packs-dup-badge">{duplicateIds.size} {t('duplicateCount')}</span>
          )}
        </div>
        {coinDisplay}
      </div>

      <div className="pack-cards-grid">
        {[...players].sort((a, b) => getPlayerRating(b) - getPlayerRating(a)).map((player, i) => (
          <FutCard
            key={player.id}
            player={player}
            size="lg"
            index={i}
            dimmed={duplicateIds.has(player.id)}
            overlayLabel={duplicateIds.has(player.id) ? t('alreadyOwned') : null}
          />
        ))}
      </div>

      <div className="packs-actions" style={{ animationDelay: btnDelay, animation: 'ob-fadein 0.4s ease both' }}>
        <button className="pack-open-another-btn" onClick={onClearResult}>
          {t('openAnotherPack')}
        </button>
        <button className="packs-back-btn" onClick={onBack}>
          {t('backToSquad')}
        </button>
      </div>
    </div>
  );
}
