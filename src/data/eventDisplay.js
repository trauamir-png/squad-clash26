// Use ev.minute as a stable variation seed so text doesn't change on re-render.
function pick(arr, ev) {
  return arr[ev.minute % arr.length];
}

const SHOT_SAVED_WITH_KEEPER = [
  ev => `${ev.player} shoots — SAVED by ${ev.keeper}`,
  ev => `${ev.player} fires, ${ev.keeper} tips it over!`,
  ev => `${ev.player} forces a save from ${ev.keeper}`,
  ev => `${ev.player} shoots — brilliant stop from ${ev.keeper}!`,
  ev => `${ev.player} tries his luck — ${ev.keeper} holds it!`,
];

const SHOT_SAVED_NO_KEEPER = [
  ev => `${ev.player} shoots — saved!`,
  ev => `${ev.player} fires — keeper holds it!`,
  ev => `${ev.player} forces a good save`,
  ev => `${ev.player} shoots — keeper tips it over!`,
];

const HIT_POST = [
  ev => `${ev.player} hits the post!`,
  ev => `${ev.player} rattles the woodwork!`,
  ev => `So close! ${ev.player} clips the bar!`,
  ev => `${ev.player} — off the post and away!`,
];

const BIG_CHANCE_MISS = [
  ev => `${ev.player} misses a big chance!`,
  ev => `${ev.player} blazes over from close range!`,
  ev => `${ev.player} can't believe it — misses a sitter!`,
  ev => `Huge miss from ${ev.player}!`,
];

const DISPLAY_MAP = {
  goal: ev => ({
    icon: '⚽',
    text: `${ev.scorer} scores!`,
    sub:  ev.assister ? `🅰️ ${ev.assister}` : null,
  }),
  shot_saved: ev => ({
    icon: '🧤',
    text: ev.keeper
      ? pick(SHOT_SAVED_WITH_KEEPER, ev)(ev)
      : pick(SHOT_SAVED_NO_KEEPER,   ev)(ev),
    sub: null,
  }),
  hit_post: ev => ({
    icon: '🥅',
    text: pick(HIT_POST, ev)(ev),
    sub:  null,
  }),
  big_chance_miss: ev => ({
    icon: '❌',
    text: pick(BIG_CHANCE_MISS, ev)(ev),
    sub:  null,
  }),
  substitution: ev => ({ icon: '🔁', text: `${ev.playerIn} on for ${ev.playerOut}`,   sub: null }),
  commentary:   ev => ({ icon: '💬', text: ev.text ?? 'Possession play',             sub: null }),
  yellow_card:  ev => ({ icon: '🟨', text: `${ev.player} shown a yellow card`,    sub: null }),
  red_card:    ev => ({ icon: '🟥', text: `${ev.player} sent off!`,           sub: null }),
  injury:      ev => ({ icon: '🚑', text: `${ev.player} goes down injured`,   sub: null }),
};

const FALLBACK = () => ({ icon: '•', text: 'Event', sub: null });

export function getEventDisplay(ev) {
  return (DISPLAY_MAP[ev.type] ?? FALLBACK)(ev);
}
