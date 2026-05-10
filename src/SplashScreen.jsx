import { useState } from 'react';
import { setLanguage, t } from './i18n/index.js';

export function SplashScreen({ onStart }) {
  // If a language is already saved, skip straight to the tap-to-start screen
  const [picked, setPicked] = useState(() => {
    const saved = localStorage.getItem('squad_clash_language');
    if (import.meta.env.DEV) {
      console.log('[SplashScreen] squad_clash_language =', saved);
      console.log('[SplashScreen] showing:', saved ? 'start screen' : 'language picker');
    }
    return !!saved;
  });

  function handleLanguagePick(lang) {
    setLanguage(lang);
    setPicked(true);
  }

  if (!picked) {
    return (
      <div className="splash-screen">
        <div className="splash-content">
          <img
            src="/logo.png"
            alt="Squad Clash 26"
            className="splash-logo"
            draggable="false"
          />
          <p className="splash-tagline" style={{ marginBottom: '32px' }}>
            Build. Play. Clash. · בנה. שחק. התנגש.
          </p>
          <p className="splash-lang-label">Select Language / בחר שפה</p>
          <div className="splash-lang-picker">
            <button
              className="splash-lang-btn"
              onClick={() => handleLanguagePick('en')}
            >
              🇬🇧 English
            </button>
            <button
              className="splash-lang-btn"
              onClick={() => handleLanguagePick('he')}
            >
              🇮🇱 עברית
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="splash-screen" onClick={onStart}>
      <div className="splash-content">
        <img
          src="/logo.png"
          alt="Squad Clash 26"
          className="splash-logo"
          draggable="false"
        />
        <p className="splash-tagline">{t('tagline')}</p>
        <button
          className="splash-btn"
          onClick={e => { e.stopPropagation(); onStart(); }}
        >
          {t('tapToStart')}
        </button>
      </div>
    </div>
  );
}
