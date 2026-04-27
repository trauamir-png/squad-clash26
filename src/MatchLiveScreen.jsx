import { useState, useEffect, useRef } from 'react';
import { getEventDisplay } from './data/eventDisplay';
import { getClubLogo } from './utils/imageResolvers';
import { PlayerImage } from './PlayerImage';
import { getCardRatingColor } from './ratingUtils';
import { calculateMatchStats } from './data/matchStats';

// ── Timing constants ─────────────────────────────────────────────────
const BASE_TICK_MS = 500;  // 0.5s per simulated minute → ~48s full match at 1×
const FULLTIME_MS  = 4000; // linger on full-time before advancing to result
const MAX_SUBS     = 3;

const FORMATION_NAMES = [
  '4-3-3', '4-4-2', '4-2-3-1', '4-1-4-1',
  '3-5-2', '5-3-2', '4-3-3 DM', '4-3-3 AM', '3-4-3',
];

// ── Dramatic pacing ──────────────────────────────────────────────────
const DRAMATIC_WEIGHT = {
  goal: 3, red_card: 3, hit_post: 2, big_chance_miss: 2, yellow_card: 1, injury: 1,
};
const DRAMATIC_PAUSE_MS = { 1: 1500, 2: 2200, 3: 3000 };

const STATUS_LABEL = {
  first: 'First Half', halftime: 'Half Time', second: 'Second Half', fulltime: 'Full Time',
};

function pickRand(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Commentary pools ─────────────────────────────────────────────────
const HIGH_MOMENTUM_COMMENTARY = [
  'You are pushing hard now',
  'Wave after wave of attacks',
  'The pressure is building',
  'Momentum firmly in your favour',
  'Camped in the opposition half',
  'Relentless — they cannot get out',
];

const LOW_MOMENTUM_COMMENTARY = [
  'Under heavy pressure now',
  'Struggling to get out of your own half',
  'Opponent is controlling the game',
  'Pinned back — holding on',
  'Hard to breathe — wave after wave',
  'The game is slipping away',
];

const DEFENSIVE_COMMENTARY = [
  n => `${n} calmly keeping possession`,
  _  => `Back line recycling the ball`,
  _  => `Midfield battle slowing the tempo`,
  _  => `Cleared safely by the defense`,
  n => `${n} keeping it tight at the back`,
  n => `Patience from ${n}`,
  _  => `Ball recycled across the back line`,
  n => `${n} sitting deep and staying compact`,
];

// ── Momentum helpers ─────────────────────────────────────────────────
function momentumDelta(e) {
  const sign = e.team === 'user' ? 1 : -1;
  switch (e.type) {
    case 'goal':            return sign * 30;
    case 'shot_saved':      return sign * 5;
    case 'big_chance_miss': return sign * -5;
    case 'hit_post':        return sign * 8;
    case 'yellow_card':     return sign * -3;
    case 'red_card':        return sign * -20;
    default:                return 0;
  }
}

function getMomentumLabel(m) {
  if (m >  35) return 'You are dominating';
  if (m >  12) return 'Slight advantage';
  if (m > -12) return 'Even game';
  if (m > -35) return 'Under pressure';
  return 'Opponent dominating';
}

export function MatchLiveScreen({ matchData, clubName, opponentName, onComplete }) {
  const {
    events        = [],
    startingXI    = [],
    benchPlayers  = [],
    opponentSquad = [],
    formationName = '',
  } = matchData;

  // ── Match state ──────────────────────────────────────────────────
  const [minute, setMinute]               = useState(0);
  const [userScore, setUserScore]         = useState(0);
  const [oppScore, setOppScore]           = useState(0);
  const [visibleEvents, setVisibleEvents] = useState([]);
  const [status, setStatus]               = useState('first');
  const [isPaused, setIsPaused]           = useState(false);
  const [speed, setSpeed]                 = useState(1);
  const [dramaticEvent, setDramaticEvent] = useState(null);
  const [goalBanner, setGoalBanner]       = useState(null); // { team, minute, text, isLate }
  const [addedTime, setAddedTime]         = useState(0);
  const [fulltimeOverlay, setFulltimeOverlay] = useState(false);

  // ── Substitution state ───────────────────────────────────────────
  const [subsLeft, setSubsLeft]         = useState(MAX_SUBS);
  const [subPanelOpen, setSubPanelOpen] = useState(false);
  const [playerOut, setPlayerOut]       = useState(null);
  const [playerIn, setPlayerIn]         = useState(null);
  const [currentXI, setCurrentXI]       = useState(startingXI);
  const [currentBench, setCurrentBench] = useState(benchPlayers);

  // ── Halftime state ───────────────────────────────────────────────
  const [halftimePanelOpen, setHalftimePanelOpen] = useState(false);
  const [htFormation, setHtFormation]             = useState(formationName);

  // ── Tempo / momentum state ───────────────────────────────────────
  const [tempo, setTempo]       = useState('balanced');
  const [momentum, setMomentum] = useState(0);

  // ── Refs — readable inside timeout callbacks without stale closures ─
  const statusRef   = useRef('first');
  const minuteRef   = useRef(0);
  const isPausedRef = useRef(false);
  const speedRef    = useRef(1);
  const tempoRef    = useRef('balanced');
  const momentumRef = useRef(0);
  const clubNameRef = useRef(clubName);

  // Score refs — lets the tick closure read the current score without stale capture
  const userScoreRef = useRef(0);
  const oppScoreRef  = useRef(0);

  // Injury time ref — set once at minute 90
  const addedTimeRef = useRef(0);

  // Original formation — detect changes made at halftime
  const originalFormationRef = useRef(formationName);

  // Squad refs — updated on substitution
  const userXIRef   = useRef(startingXI);
  const oppSquadRef = useRef(opponentSquad);
  const userGKRef   = useRef(startingXI.find(p => p.position?.toUpperCase() === 'GK')?.name ?? null);
  const oppGKRef    = useRef(opponentSquad.find(p => p.position?.toUpperCase() === 'GK')?.name ?? null);

  const tickTimeoutRef        = useRef(null);
  const fulltimeRef           = useRef(null);
  const clearDramRef          = useRef(null);
  const clearBannerRef        = useRef(null);
  const scheduleRef           = useRef(null);
  const eventKeyRef           = useRef(0);
  const wasPausedBeforeSubRef = useRef(false);

  // ── Tick engine ──────────────────────────────────────────────────
  useEffect(() => {
    function schedule(ms) {
      clearTimeout(tickTimeoutRef.current);
      tickTimeoutRef.current = setTimeout(tick, ms ?? Math.round(BASE_TICK_MS / speedRef.current));
    }

    function tick() {
      if (isPausedRef.current) return;
      if (statusRef.current === 'halftime' || statusRef.current === 'fulltime') return;

      const next = minuteRef.current + 1;
      minuteRef.current = next;
      setMinute(next);

      // Decay momentum 1.5% per tick (half-life ≈ 46 ticks / ~23s)
      momentumRef.current *= 0.985;
      let mDelta = 0;

      const reached = events.filter(e => e.minute === next);
      let nextDelay = Math.round(BASE_TICK_MS / speedRef.current);

      if (reached.length > 0) {
        const keyed = reached.map(e => ({ ...e, _key: eventKeyRef.current++ }));
        setVisibleEvents(prev => [...prev, ...keyed]);

        // Update scores via refs so the tick closure always reads current values
        keyed.forEach(e => {
          if (e.type !== 'goal') return;
          if (e.team === 'user') { userScoreRef.current++; setUserScore(userScoreRef.current); }
          else                  { oppScoreRef.current++;  setOppScore(oppScoreRef.current);  }
        });

        // Goal banner — late goals get special text
        const goalEvent = keyed.find(e => e.type === 'goal');
        if (goalEvent) {
          const isLateGoal = next > 85;
          let bannerText  = 'GOAL!';
          let isLateDrama = false;
          if (isLateGoal) {
            // Was the scoring team behind or level before this goal?
            const su = goalEvent.team === 'user' ? userScoreRef.current - 1 : userScoreRef.current;
            const so = goalEvent.team === 'user' ? oppScoreRef.current     : oppScoreRef.current - 1;
            const wasWinning = goalEvent.team === 'user' ? su > so : so > su;
            bannerText  = wasWinning ? 'LAST MINUTE GOAL!' : 'LATE DRAMA!';
            isLateDrama = true;
          }
          clearTimeout(clearBannerRef.current);
          setGoalBanner({ team: goalEvent.team, minute: goalEvent.minute, text: bannerText, isLate: isLateDrama });
          clearBannerRef.current = setTimeout(
            () => setGoalBanner(null),
            Math.round(2800 / speedRef.current)
          );
        }

        // Dramatic pacing
        const maxWeight = Math.max(...keyed.map(e => DRAMATIC_WEIGHT[e.type] ?? 0));
        if (maxWeight > 0) {
          const scaled    = Math.round(DRAMATIC_PAUSE_MS[maxWeight] / speedRef.current);
          const highlight = keyed.find(e => (DRAMATIC_WEIGHT[e.type] ?? 0) === maxWeight);
          setDramaticEvent(highlight ?? null);
          clearTimeout(clearDramRef.current);
          clearDramRef.current = setTimeout(() => setDramaticEvent(null), Math.round(scaled * 0.72));
          nextDelay = scaled;
        }

        for (const e of keyed) mDelta += momentumDelta(e);

      } else {
        // Quiet minute — possibly inject a flavour event
        const t    = tempoRef.current;
        const m    = momentumRef.current; // ref — not stale
        const roll = Math.random();
        let inject = null;

        if (t === 'attacking') {
          const mFactor    = 1 + (m / 100) * 0.5;
          const userChance = Math.max(0.04, Math.min(0.12, 0.07 * mFactor));
          const totalRange = userChance + Math.max(0.01, 0.03 * (1 - m / 100 * 0.4));

          if (roll < userChance) {
            const outfield = userXIRef.current.filter(p => p.position?.toUpperCase() !== 'GK');
            inject = {
              minute: next, team: 'user',
              type:   Math.random() < 0.65 ? 'shot_saved' : 'big_chance_miss',
              player: pickRand(outfield)?.name ?? 'Unknown',
              keeper: oppGKRef.current,
            };
            mDelta += inject.type === 'shot_saved' ? 5 : -3;
          } else if (roll < totalRange) {
            const outfield = oppSquadRef.current.filter(p => p.position?.toUpperCase() !== 'GK');
            inject = {
              minute: next, team: 'opponent', type: 'shot_saved',
              player: pickRand(outfield)?.name ?? 'Opponent',
              keeper: userGKRef.current,
            };
            mDelta -= 5;
          }
        } else if (t === 'defensive' && roll < 0.04) {
          const name = clubNameRef.current ?? 'Your team';
          inject = {
            minute: next, type: 'commentary', team: 'user',
            text: DEFENSIVE_COMMENTARY[next % DEFENSIVE_COMMENTARY.length](name),
          };
          mDelta += 3;
        }

        // Late-match pressure — losing team pushes harder after min 80
        const isLate = next > 80 && statusRef.current === 'second';
        if (!inject && isLate) {
          const diff = userScoreRef.current - oppScoreRef.current;
          if (diff < 0 && Math.random() < 0.03) {
            const outfield = userXIRef.current.filter(p => p.position?.toUpperCase() !== 'GK');
            inject = {
              minute: next, team: 'user',
              type:   Math.random() < 0.7 ? 'shot_saved' : 'big_chance_miss',
              player: pickRand(outfield)?.name ?? 'Unknown',
              keeper: oppGKRef.current,
            };
            mDelta += 5;
          } else if (diff > 0 && Math.random() < 0.02) {
            const outfield = oppSquadRef.current.filter(p => p.position?.toUpperCase() !== 'GK');
            inject = {
              minute: next, team: 'opponent', type: 'shot_saved',
              player: pickRand(outfield)?.name ?? 'Opponent',
              keeper: userGKRef.current,
            };
            mDelta -= 5;
          }
        }

        // Momentum commentary — uses ref (not stale state)
        if (!inject && Math.abs(m) > 30 && Math.random() < 0.06) {
          inject = {
            minute: next, type: 'commentary',
            team:   m > 0 ? 'user' : 'opponent',
            text:   pickRand(m > 0 ? HIGH_MOMENTUM_COMMENTARY : LOW_MOMENTUM_COMMENTARY),
          };
        }

        if (inject) setVisibleEvents(prev => [...prev, { ...inject, _key: eventKeyRef.current++ }]);
      }

      // Commit momentum
      momentumRef.current = Math.max(-100, Math.min(100, momentumRef.current + mDelta));
      setMomentum(Math.round(momentumRef.current));

      // ── Phase transitions ────────────────────────────────────────
      if (next === 45) {
        statusRef.current = 'halftime';
        setStatus('halftime');
        setHalftimePanelOpen(true);  // user must click to start second half

      } else if (statusRef.current === 'second') {
        if (next === 90 && addedTimeRef.current === 0) {
          // Determine injury time on first reaching minute 90
          const added = 2 + Math.floor(Math.random() * 3); // 2–4 minutes
          addedTimeRef.current = added;
          setAddedTime(added);
          schedule(nextDelay);
        } else if (next >= 90 + addedTimeRef.current) {
          statusRef.current = 'fulltime';
          setStatus('fulltime');
          setFulltimeOverlay(true);
          setTimeout(() => setFulltimeOverlay(false), FULLTIME_MS - 600);
          fulltimeRef.current = setTimeout(onComplete, FULLTIME_MS);
        } else {
          schedule(nextDelay);
        }
      } else {
        schedule(nextDelay);
      }
    }

    scheduleRef.current = schedule;
    schedule();

    return () => {
      clearTimeout(tickTimeoutRef.current);
      clearTimeout(fulltimeRef.current);
      clearTimeout(clearDramRef.current);
      clearTimeout(clearBannerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — events/onComplete stable for match lifetime

  // ── Playback controls ────────────────────────────────────────────
  function handleTogglePause() {
    const next = !isPausedRef.current;
    isPausedRef.current = next;
    setIsPaused(next);
    if (next) {
      clearTimeout(tickTimeoutRef.current);
    } else if (statusRef.current !== 'halftime' && statusRef.current !== 'fulltime') {
      scheduleRef.current?.();
    }
  }

  function handleToggleSpeed() {
    const next = speedRef.current === 1 ? 2 : 1;
    speedRef.current = next;
    setSpeed(next);
    if (!isPausedRef.current && statusRef.current !== 'halftime' && statusRef.current !== 'fulltime') {
      scheduleRef.current?.();
    }
  }

  // ── Substitution handlers ────────────────────────────────────────
  function handleOpenSubs() {
    wasPausedBeforeSubRef.current = isPausedRef.current;
    if (!isPausedRef.current) {
      isPausedRef.current = true;
      setIsPaused(true);
      clearTimeout(tickTimeoutRef.current);
    }
    setSubPanelOpen(true);
  }

  function handleCloseSubs() {
    setPlayerOut(null);
    setPlayerIn(null);
    setSubPanelOpen(false);
    if (!wasPausedBeforeSubRef.current) {
      isPausedRef.current = false;
      setIsPaused(false);
      if (statusRef.current !== 'halftime' && statusRef.current !== 'fulltime') {
        scheduleRef.current?.();
      }
    }
  }

  function handleConfirmSub() {
    if (!playerOut || !playerIn || subsLeft <= 0) return;

    const newXI    = currentXI.map(p => p.id === playerOut.id ? playerIn : p);
    const newBench = currentBench.map(p => p.id === playerIn.id ? playerOut : p);
    setCurrentXI(newXI);
    setCurrentBench(newBench);
    userXIRef.current = newXI;
    const newGK = newXI.find(p => p.position?.toUpperCase() === 'GK');
    if (newGK) userGKRef.current = newGK.name;

    setVisibleEvents(prev => [...prev, {
      minute: minuteRef.current, type: 'substitution', team: 'user',
      playerIn: playerIn.name, playerOut: playerOut.name,
      _key: eventKeyRef.current++,
    }]);

    setSubsLeft(n => n - 1);
    setPlayerOut(null);
    setPlayerIn(null);
    setSubPanelOpen(false);

    if (!wasPausedBeforeSubRef.current) {
      isPausedRef.current = false;
      setIsPaused(false);
      if (statusRef.current !== 'halftime' && statusRef.current !== 'fulltime') {
        scheduleRef.current?.();
      }
    }
  }

  // ── Halftime handler ─────────────────────────────────────────────
  function handleStartSecondHalf() {
    // Emit a formation-change feed event if the user picked something different
    if (htFormation && htFormation !== originalFormationRef.current) {
      setVisibleEvents(prev => [...prev, {
        minute: 45, type: 'commentary', team: 'user',
        text: `Formation changed to ${htFormation}`,
        _key: eventKeyRef.current++,
      }]);
    }
    setHalftimePanelOpen(false);
    statusRef.current = 'second';
    setStatus('second');
    if (!isPausedRef.current) scheduleRef.current?.();
  }

  // ── Tempo handler ────────────────────────────────────────────────
  function handleTempoChange(t) {
    tempoRef.current = t;
    setTempo(t);
  }

  // ── Render helpers ───────────────────────────────────────────────
  const userLogo = getClubLogo(clubName);
  const oppLogo  = getClubLogo(opponentName);
  const isLive   = status === 'first' || status === 'second';
  const canSub   = status !== 'fulltime' && subsLeft > 0 && currentBench.length > 0;

  // Minute display: 90+X in injury time
  const dispMinute = minute > 90 ? `90+${minute - 90}` : `${minute}`;

  const { icon: dramIcon, text: dramText, sub: dramSub } = dramaticEvent
    ? getEventDisplay(dramaticEvent)
    : {};

  // Halftime stats — computed fresh from visible events
  const htStats = halftimePanelOpen
    ? calculateMatchStats(visibleEvents, userScore, oppScore)
    : null;

  // Momentum intensity classes
  const absMom    = Math.abs(momentum);
  const mSide     = momentum >= 0 ? 'user' : 'opp';
  const mIntensity = absMom > 60 ? 'intense' : absMom > 35 ? 'strong' : null;

  return (
    <div className="live-screen">

      {/* ── Header ── */}
      <div className="live-header">
        {userLogo && (
          <img src={userLogo} alt="" className="club-logo live-team-logo"
            onError={e => { e.currentTarget.style.display = 'none'; }} />
        )}
        <span className="live-team-name">{clubName ?? 'Your Team'}</span>
        <span className="live-vs">vs</span>
        <span className="live-team-name live-opp-name">{opponentName ?? 'Opponent'}</span>
        {oppLogo && (
          <img src={oppLogo} alt="" className="club-logo live-team-logo"
            onError={e => { e.currentTarget.style.display = 'none'; }} />
        )}
      </div>

      {/* ── Scoreboard ── */}
      <div className="live-scoreboard">
        <div className="live-score-row">
          <span className={`live-score-digit live-score-user${userScore > oppScore ? ' live-score-winning' : ''}`}>
            {userScore}
          </span>
          <span className="live-score-sep">–</span>
          <span className={`live-score-digit live-score-opp${oppScore > userScore ? ' live-score-winning' : ''}`}>
            {oppScore}
          </span>
        </div>
        <div className="live-clock-row">
          {isLive && (
            <span className="live-clock">
              {dispMinute}'
              {addedTime > 0 && minute === 90 && (
                <span className="injury-time-badge">+{addedTime}</span>
              )}
            </span>
          )}
          <span className={`live-status-badge live-status-${status}`}>
            {STATUS_LABEL[status]}
          </span>
        </div>
      </div>

      {/* ── Controls — hidden at full time ── */}
      {status !== 'fulltime' && !halftimePanelOpen && (
        <div className="live-controls">
          <div className="live-ctrl-row">
            <button
              className={`live-ctrl-btn${isPaused ? ' live-ctrl-paused' : ''}`}
              onClick={handleTogglePause}
              aria-label={isPaused ? 'Resume match' : 'Pause match'}
            >
              {isPaused ? '▶ Resume' : '⏸ Pause'}
            </button>
            <button
              className={`live-ctrl-btn live-ctrl-speed${speed === 2 ? ' live-ctrl-active' : ''}`}
              onClick={handleToggleSpeed}
              aria-label={`Speed: ${speed}×`}
            >
              {speed}×
            </button>
            <button
              className="live-ctrl-btn sub-btn"
              onClick={handleOpenSubs}
              disabled={!canSub}
              aria-label="Make a substitution"
            >
              🔁 Sub <span className="sub-counter">{subsLeft}</span>
            </button>
          </div>

          <div className="tempo-control" role="group" aria-label="Match tempo">
            {[
              { key: 'defensive', label: '🛡 Defensive' },
              { key: 'balanced',  label: '⚖ Balanced'  },
              { key: 'attacking', label: '⚡ Attacking' },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`tempo-btn${tempo === key ? ` tempo-active tempo-active-${key}` : ''}`}
                onClick={() => handleTempoChange(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {isLive && (
            <div className={`momentum-wrap${mIntensity ? ` momentum-${mIntensity}-${mSide}` : ''}`}>
              <div className="momentum-bar">
                <div
                  className={`momentum-fill momentum-${mSide}`}
                  style={{ width: `${absMom / 2}%` }}
                />
              </div>
              <span className="momentum-label">{getMomentumLabel(momentum)}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Goal banner ── */}
      {goalBanner && (
        <div
          key={`banner-${goalBanner.minute}-${goalBanner.team}`}
          className={`goal-banner goal-banner-${goalBanner.team}${goalBanner.isLate ? ' goal-banner-late' : ''}`}
          style={{ '--banner-dur': `${Math.round(2800 / speed)}ms` }}
        >
          <span className="goal-banner-text">{goalBanner.text ?? 'GOAL!'}</span>
          <span className="goal-banner-min">{goalBanner.minute > 90 ? `90+${goalBanner.minute - 90}` : goalBanner.minute}'</span>
        </div>
      )}

      {/* ── Full time overlay ── */}
      {fulltimeOverlay && (
        <div className="fulltime-overlay">
          <span className="fulltime-text">FULL TIME</span>
        </div>
      )}

      {/* ── Dramatic moment spotlight ── */}
      {dramaticEvent && (
        <div
          key={`${dramaticEvent.minute}-${dramaticEvent.type}`}
          className={`live-spotlight live-spotlight-${dramaticEvent.team} live-spotlight-weight-${DRAMATIC_WEIGHT[dramaticEvent.type] ?? 1}`}
        >
          <span className="live-spotlight-min">{dramaticEvent.minute}'</span>
          <span className="live-spotlight-icon">{dramIcon}</span>
          <div className="live-spotlight-body">
            <span className="live-spotlight-text">{dramText}</span>
            {dramSub && <span className="live-spotlight-sub">{dramSub}</span>}
          </div>
        </div>
      )}

      {/* ── Event feed ── */}
      <div className="live-feed">
        {visibleEvents.length === 0 ? (
          <p className="live-feed-empty">Match underway…</p>
        ) : (() => {
          const feedEvents = visibleEvents.filter(ev => ev !== dramaticEvent).reverse();
          return feedEvents.length === 0 ? null : feedEvents.map((ev, i) => {
            const { icon, text, sub } = getEventDisplay(ev);
            return (
              <div
                key={ev._key}
                className={`live-event live-event-${ev.team} live-event-type-${ev.type}${i === 0 ? ' live-event-latest' : ''}`}
              >
                <span className="live-event-min">{ev.minute > 90 ? `90+${ev.minute - 90}` : ev.minute}'</span>
                <div className="live-event-body">
                  <span className="live-event-text">{icon} {text}</span>
                  {sub && <span className="live-event-assist">{sub}</span>}
                </div>
              </div>
            );
          });
        })()}
      </div>

      {/* ── Substitution panel ── */}
      {subPanelOpen && (
        <>
          <div className="sub-overlay" onClick={handleCloseSubs} />
          <div className="sub-panel" role="dialog" aria-label="Make a substitution">
            <div className="sub-panel-header">
              <span className="sub-panel-title">Make a Substitution</span>
              <span className="sub-panel-counter">{subsLeft} sub{subsLeft !== 1 ? 's' : ''} left</span>
            </div>
            <div className="sub-columns">
              <div className="sub-col">
                <div className="sub-col-label">Coming Off</div>
                <div className="sub-col-list">
                  {currentXI.map(p => (
                    <button
                      key={p.id}
                      className={`sub-player-row${playerOut?.id === p.id ? ' sub-selected-out' : ''}`}
                      onClick={() => setPlayerOut(prev => prev?.id === p.id ? null : p)}
                    >
                      <PlayerImage player={p} className="sub-player-img" />
                      <div className="sub-player-info">
                        <span className="sub-player-rating" style={{ color: getCardRatingColor(p.rating) }}>{p.rating}</span>
                        <span className="sub-player-pos">{p.position}</span>
                      </div>
                      <span className="sub-player-name">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="sub-col">
                <div className="sub-col-label">Coming On</div>
                <div className="sub-col-list">
                  {currentBench.length === 0 ? (
                    <p className="sub-empty">No bench players</p>
                  ) : currentBench.map(p => (
                    <button
                      key={p.id}
                      className={`sub-player-row${playerIn?.id === p.id ? ' sub-selected-in' : ''}`}
                      onClick={() => setPlayerIn(prev => prev?.id === p.id ? null : p)}
                    >
                      <PlayerImage player={p} className="sub-player-img" />
                      <div className="sub-player-info">
                        <span className="sub-player-rating" style={{ color: getCardRatingColor(p.rating) }}>{p.rating}</span>
                        <span className="sub-player-pos">{p.position}</span>
                      </div>
                      <span className="sub-player-name">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="sub-actions">
              <button className="sub-cancel-btn" onClick={handleCloseSubs}>Cancel</button>
              <button className="sub-confirm-btn" onClick={handleConfirmSub} disabled={!playerOut || !playerIn}>
                ✓ Confirm Sub
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Halftime panel ── */}
      {halftimePanelOpen && (
        <div className="ht-overlay">
          <div className="ht-panel">
            <div className="ht-header">
              <span className="ht-title">HALF TIME</span>
            </div>

            <div className="ht-score-row">
              <span className="ht-team-name">{clubName ?? 'You'}</span>
              <span className="ht-scoreline">{userScore} – {oppScore}</span>
              <span className="ht-team-name ht-team-opp">{opponentName ?? 'Opponent'}</span>
            </div>

            {htStats && (
              <div className="ht-stats">
                <div className="ht-stat-row">
                  <span className="ht-stat-val ht-stat-user">{htStats.user.shotsOnTarget}</span>
                  <span className="ht-stat-label">Shots on target</span>
                  <span className="ht-stat-val ht-stat-opp">{htStats.opponent.shotsOnTarget}</span>
                </div>
                <div className="ht-stat-row">
                  <span className="ht-stat-val ht-stat-user">{htStats.user.saves}</span>
                  <span className="ht-stat-label">Saves</span>
                  <span className="ht-stat-val ht-stat-opp">{htStats.opponent.saves}</span>
                </div>
                <div className="ht-stat-row">
                  <span className="ht-stat-val ht-stat-user">{htStats.user.shots}</span>
                  <span className="ht-stat-label">Total shots</span>
                  <span className="ht-stat-val ht-stat-opp">{htStats.opponent.shots}</span>
                </div>
              </div>
            )}

            <div className="ht-section">
              <div className="ht-section-label">TEAM CHANGES</div>
              <button
                className="ht-sub-btn"
                onClick={handleOpenSubs}
                disabled={subsLeft <= 0 || currentBench.length === 0}
              >
                🔁 Make Substitution
                <span className="sub-counter">{subsLeft}</span>
              </button>
            </div>

            <div className="ht-section">
              <div className="ht-section-label">FORMATION</div>
              <div className="ht-formation-pills">
                {FORMATION_NAMES.map(f => (
                  <button
                    key={f}
                    className={`ht-pill${htFormation === f ? ' ht-pill-active' : ''}`}
                    onClick={() => setHtFormation(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <button className="ht-start-btn" onClick={handleStartSecondHalf}>
              ▶ Start Second Half
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
