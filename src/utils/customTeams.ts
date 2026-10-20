export function getCustomOwnTeam(playerId: string): string | null {
  try {
    const raw = localStorage.getItem('caa_custom_own_teams');
    if (!raw) return null;
    const map = JSON.parse(raw);
    return map[playerId] || null;
  } catch {
    return null;
  }
}

export function setCustomOwnTeam(playerId: string, teamName: string | null) {
  try {
    const raw = localStorage.getItem('caa_custom_own_teams');
    const map = raw ? JSON.parse(raw) : {};
    if (teamName && teamName.trim()) {
      map[playerId] = teamName.trim();
    } else {
      delete map[playerId];
    }
    localStorage.setItem('caa_custom_own_teams', JSON.stringify(map));
  } catch (e) {
    console.error('Failed to save custom own team', e);
  }
}
