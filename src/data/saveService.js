const SAVE_KEY = 'ultimate_team_save_v1';

export function loadGameSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return {};
    const save = JSON.parse(raw);
    console.log('%c📂 Save loaded', 'color: #60a5fa; font-weight: bold', {
      club: save.club?.name,
      formation: save.selectedFormation,
      formationSelected: save.formationSelected,
      hasOpenedStarterPack: save.hasOpenedStarterPack,
      clubPlayers: save.clubPlayers?.length ?? 0,
      squadSlots: Object.keys(save.selectedPlayers ?? {}).length,
    });
    return save;
  } catch {
    console.warn('%c📂 Save corrupted — returning empty', 'color: #f87171');
    return {};
  }
}

export function saveGameState(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    console.log('%c💾 Save written', 'color: #4ade80', {
      club: state.club?.name,
      formation: state.selectedFormation,
      formationSelected: state.formationSelected,
      hasOpenedStarterPack: state.hasOpenedStarterPack,
      clubPlayers: state.clubPlayers?.length ?? 0,
      squadSlots: Object.keys(state.selectedPlayers ?? {}).length,
      coins: state.coins ?? 0,
    });
  } catch (e) {
    console.error('💾 Save failed:', e);
  }
}

export function resetGameSave() {
  localStorage.removeItem(SAVE_KEY);
  console.log('%c🗑️ Save reset — reloading', 'color: #f87171; font-weight: bold');
}
