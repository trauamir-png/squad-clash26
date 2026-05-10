import { t } from '../i18n/index.js';

// Use ev.minute as a stable variation seed so text doesn't change on re-render.
function pick(arr, ev) {
  return arr[ev.minute % arr.length];
}

// Key pools — pick returns a key name, t() resolves the translated template.
const SHOT_SAVED_KEEPER_KEYS = [
  'shotSavedKeeper1',
  'shotSavedKeeper2',
  'shotSavedKeeper3',
  'shotSavedKeeper4',
  'shotSavedKeeper5',
];

const SHOT_SAVED_KEYS = [
  'shotSaved1',
  'shotSaved2',
  'shotSaved3',
  'shotSaved4',
];

const HIT_POST_KEYS = [
  'hitPost1',
  'hitPost2',
  'hitPost3',
  'hitPost4',
];

const BIG_CHANCE_MISS_KEYS = [
  'bigChanceMiss1',
  'bigChanceMiss2',
  'bigChanceMiss3',
  'bigChanceMiss4',
];

const DISPLAY_MAP = {
  goal: ev => ({
    icon: '⚽',
    text: `${ev.scorer} ${t('eventScores')}`,
    sub:  ev.assister ? `🅰️ ${ev.assister}` : null,
  }),

  shot_saved: ev => ({
    icon: '🧤',
    text: ev.keeper
      ? t(pick(SHOT_SAVED_KEEPER_KEYS, ev), { shooter: ev.player, keeper: ev.keeper })
      : t(pick(SHOT_SAVED_KEYS, ev),        { shooter: ev.player }),
    sub: null,
  }),

  hit_post: ev => ({
    icon: '🥅',
    text: t(pick(HIT_POST_KEYS, ev), { player: ev.player }),
    sub:  null,
  }),

  big_chance_miss: ev => ({
    icon: '❌',
    text: t(pick(BIG_CHANCE_MISS_KEYS, ev), { player: ev.player }),
    sub:  null,
  }),

  substitution: ev => ({
    icon: '🔁',
    text: `${ev.playerIn} ${t('eventOnFor')} ${ev.playerOut}`,
    sub:  null,
  }),

  commentary: ev => ({
    icon: '💬',
    text: ev.text ?? t('eventPossessionPlay'),
    sub:  null,
  }),

  yellow_card: ev => ({
    icon: '🟨',
    text: `${ev.player} ${t('eventYellowCard')}`,
    sub:  null,
  }),

  red_card: ev => ({
    icon: '🟥',
    text: `${ev.player} ${t('eventSentOff')}`,
    sub:  null,
  }),

  injury: ev => ({
    icon: '🚑',
    text: `${ev.player} ${t('eventInjured')}`,
    sub:  null,
  }),
};

const FALLBACK = () => ({ icon: '•', text: 'Event', sub: null });

export function getEventDisplay(ev) {
  return (DISPLAY_MAP[ev.type] ?? FALLBACK)(ev);
}
