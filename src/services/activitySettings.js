const ENABLED_KEY = 'activity-sharing-enabled';
const CUSTOM_GAMES_KEY = 'activity-custom-games';

const listeners = new Set();

function notify() {
    for (const fn of listeners) {
        try { fn(); } catch { /* ignore */ }
    }
}

export function getActivityEnabled() {
    const raw = localStorage.getItem(ENABLED_KEY);
    if (raw === null) return true; // default on
    return raw === 'true';
}

export function setActivityEnabled(enabled) {
    localStorage.setItem(ENABLED_KEY, enabled ? 'true' : 'false');
    notify();
}

// Custom games: array of { processName, displayName }
// processName is lowercased (matches gameDetection's catalog keys).
export function getCustomGames() {
    try {
        const raw = localStorage.getItem(CUSTOM_GAMES_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(g => g && typeof g.processName === 'string' && typeof g.displayName === 'string');
    } catch {
        return [];
    }
}

export function setCustomGames(games) {
    const cleaned = games
        .filter(g => g && g.processName && g.displayName)
        .map(g => ({
            processName: String(g.processName).toLowerCase(),
            displayName: String(g.displayName),
        }));
    localStorage.setItem(CUSTOM_GAMES_KEY, JSON.stringify(cleaned));
    notify();
}

export function addCustomGame(processName, displayName) {
    const existing = getCustomGames();
    const lower = String(processName).toLowerCase();
    if (existing.some(g => g.processName === lower)) return;
    setCustomGames([...existing, { processName: lower, displayName }]);
}

export function removeCustomGame(processName) {
    const lower = String(processName).toLowerCase();
    setCustomGames(getCustomGames().filter(g => g.processName !== lower));
}

export function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}