export function SplashScreen({ onStart }) {
  return (
    <div className="splash-screen" onClick={onStart}>
      <div className="splash-content">
        <img
          src="/logo.png"
          alt="Squad Clash 26"
          className="splash-logo"
          draggable="false"
        />
        <p className="splash-tagline">Build. Play. Clash.</p>
        <button className="splash-btn" onClick={e => { e.stopPropagation(); onStart(); }}>
          Tap to Start
        </button>
      </div>
    </div>
  );
}
