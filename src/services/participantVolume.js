const STORAGE_KEY = 'participant-volumes';

function loadAll() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveAll(map) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch {
        // ignore quota / serialization errors
    }
}

export function getStoredVolume(identity, fallback = 1) {
    const map = loadAll();
    const v = map[identity];
    return typeof v === 'number' ? v : fallback;
}

export function setStoredVolume(identity, volume) {
    const map = loadAll();
    map[identity] = volume;
    saveAll(map);
}