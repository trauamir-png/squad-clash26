import { useState } from 'react';
import { DATA_SOURCE, APP_VERSION } from './config/dataSource';
import { getAllPlayers } from './data/playerStore';

const SAVE_KEY   = 'ultimate_team_save_v1';
const LANG_KEY   = 'squad_clash_language';
const LOGOS_KEY  = 'sc26_club_logos_v2';

function readSave() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'); }
  catch { return {}; }
}

function listLocalStorageKeys() {
  const out = [];
  for (let i = 0; i < localStorage.length; i++) out.push(localStorage.key(i));
  return out.sort();
}

// ── Full Reset ────────────────────────────────────────────────────────────────
export function fullReset() {
  [SAVE_KEY, LANG_KEY, LOGOS_KEY].forEach(k => localStorage.removeItem(k));
  // Clear any other game-related keys
  const gameKeys = listLocalStorageKeys().filter(k =>
    k.startsWith('squad') || k.startsWith('sc26') || k.startsWith('ultimate')
  );
  gameKeys.forEach(k => localStorage.removeItem(k));
  window.location.reload();
}

// ── Debug Panel ───────────────────────────────────────────────────────────────
// Visible when ?debug=1 is in the URL, or when the version pill is tapped 5×.
// Shows data-source diagnostics + Full Reset button.
export function DebugPanel() {
  const [open, setOpen]   = useState(
    typeof window !== 'undefined' && window.location.search.includes('debug=1')
  );
  const [taps, setTaps]   = useState(0);

  const handleVersionTap = () => {
    const next = taps + 1;
    setTaps(next);
    if (next >= 5) { setOpen(true); setTaps(0); }
  };

  // Snapshot computed when panel is opened
  const players  = open ? getAllPlayers() : [];
  const save     = open ? readSave()      : {};
  const lsKeys   = open ? listLocalStorageKeys() : [];
  const club     = save.clubPlayers      ?? [];
  const xi       = save.selectedPlayers  ?? {};
  const sources  = open ? [...new Set(players.map(p => p._source))] : [];

  return (
    <>
      {/* Always-visible version pill ── bottom-right corner */}
      <button
        onClick={handleVersionTap}
        style={{
          position:   'fixed',
          bottom:     '6px',
          right:      '6px',
          zIndex:     9999,
          background: DATA_SOURCE === 'israel' ? 'rgba(22,180,100,0.85)' : 'rgba(200,60,60,0.85)',
          color:      '#fff',
          border:     'none',
          borderRadius: '4px',
          padding:    '2px 7px',
          fontSize:   '10px',
          fontWeight: '700',
          fontFamily: 'monospace',
          cursor:     'pointer',
          lineHeight: '1.5',
          backdropFilter: 'blur(4px)',
        }}
        aria-label="Debug panel toggle"
      >
        {APP_VERSION}
      </button>

      {/* Debug panel overlay */}
      {open && (
        <div style={{
          position:   'fixed',
          inset:      0,
          zIndex:     10000,
          background: 'rgba(0,0,0,0.92)',
          color:      '#e2e8f0',
          fontFamily: 'monospace',
          fontSize:   '12px',
          overflowY:  'auto',
          padding:    '16px',
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
            <strong style={{ color:'#4ade80', fontSize:'14px' }}>🛠 Debug Panel — {APP_VERSION}</strong>
            <button
              onClick={() => setOpen(false)}
              style={{ background:'#475569', color:'#fff', border:'none', borderRadius:'4px', padding:'4px 10px', cursor:'pointer' }}
            >
              ✕ Close
            </button>
          </div>

          <Section title="Data Source">
            <Row label="DATA_SOURCE"   value={DATA_SOURCE} highlight={DATA_SOURCE === 'israel' ? '#4ade80' : '#f87171'} />
            <Row label="APP_VERSION"   value={APP_VERSION} />
            <Row label="Player pool"   value={`${players.length} players`} />
            <Row label="_source values" value={sources.join(', ') || '—'} />
          </Section>

          <Section title={`First 10 active players (of ${players.length})`}>
            {players.slice(0, 10).map((p, i) => (
              <div key={p.id} style={{ color: p._source === 'israeli' ? '#86efac' : '#f87171', marginBottom:'2px' }}>
                {i + 1}. {p.name} | {p.position} | {p.rating} | {p.club} | {p.leagueName} | _src:{p._source}
              </div>
            ))}
          </Section>

          <Section title="localStorage save">
            <Row label="hasOpenedStarterPack" value={String(save.hasOpenedStarterPack ?? '—')} />
            <Row label="clubPlayers count"    value={club.length} />
            <Row label="selectedPlayers (XI)" value={Object.keys(xi).length} />
            <Row label="selectedFormation"    value={save.selectedFormation ?? '—'} />
            {club.length > 0 && (
              <div style={{ marginTop:'6px' }}>
                <div style={{ color:'#94a3b8', marginBottom:'3px' }}>Club player sources:</div>
                {[...new Set(club.map(p => p._source))].map(s => (
                  <div key={s} style={{ color: s === 'israeli' ? '#86efac' : '#f87171' }}>
                    {s}: {club.filter(p => p._source === s).length} players
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="All localStorage keys">
            {lsKeys.map(k => <div key={k} style={{ color:'#94a3b8' }}>{k}</div>)}
            {lsKeys.length === 0 && <div style={{ color:'#64748b' }}>— empty —</div>}
          </Section>

          <Section title="Actions">
            <button
              onClick={fullReset}
              style={{
                background: '#dc2626',
                color:      '#fff',
                border:     'none',
                borderRadius: '6px',
                padding:    '10px 20px',
                fontSize:   '13px',
                fontWeight: '700',
                cursor:     'pointer',
                width:      '100%',
                marginBottom: '8px',
              }}
            >
              🗑 Full Reset Data (clears save + reloads)
            </button>
            <div style={{ color:'#64748b', fontSize:'11px' }}>
              Clears: {SAVE_KEY}, {LANG_KEY}, {LOGOS_KEY} + any other game keys
            </div>
          </Section>
        </div>
      )}
    </>
  );
}

// ── Tiny helpers ──────────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ marginBottom:'16px' }}>
      <div style={{ color:'#60a5fa', fontWeight:'700', marginBottom:'6px', borderBottom:'1px solid #334155', paddingBottom:'3px' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div style={{ display:'flex', gap:'8px', marginBottom:'3px' }}>
      <span style={{ color:'#94a3b8', minWidth:'160px' }}>{label}:</span>
      <span style={{ color: highlight ?? '#e2e8f0' }}>{String(value)}</span>
    </div>
  );
}
