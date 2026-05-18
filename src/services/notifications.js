const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;

let permissionRequested = false;
const clickHandlers = new Map();
let nextClickId = 1;
let electronListenerAttached = false;

function ensureElectronClickListener() {
    if (!isElectron || electronListenerAttached) return;
    window.electronAPI.onNotificationClick((clickId) => {
        const handler = clickHandlers.get(clickId);
        if (handler) {
            clickHandlers.delete(clickId);
            try { handler(); } catch {}
        }
    });
    electronListenerAttached = true;
}

export async function ensureNotificationPermission() {
    if (isElectron) return true;
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    if (permissionRequested) return Notification.permission === 'granted';
    permissionRequested = true;
    try {
        const result = await Notification.requestPermission();
        return result === 'granted';
    } catch {
        return false;
    }
}

export function isFocused() {
    return typeof document !== 'undefined'
        && document.visibilityState === 'visible'
        && document.hasFocus();
}

export function fireNotification({ title, body, icon, tag, onClick }) {
    if (isElectron) {
        ensureElectronClickListener();
        const clickId = nextClickId++;
        if (onClick) clickHandlers.set(clickId, onClick);
        window.electronAPI.showNotification({
            title,
            body: (body || '').slice(0, 200),
            icon: icon || undefined,
            tag: tag || undefined,
            clickId,
        }).catch(() => clickHandlers.delete(clickId));
        try { window.electronAPI.flashFrame(true); } catch {}
        return null;
    }

    if (typeof Notification === 'undefined') return null;
    if (Notification.permission !== 'granted') return null;

    try {
        const n = new Notification(title, {
            body: (body || '').slice(0, 200),
            icon: icon || undefined,
            tag: tag || undefined,
            silent: false,
        });
        n.onclick = () => {
            try {
                if (onClick) onClick();
                window.focus();
            } catch {}
            n.close();
        };
        return n;
    } catch {
        return null;
    }
}

export function setBadgeCount(count) {
    const n = Math.max(0, Math.floor(Number(count) || 0));
    if (isElectron) {
        try { window.electronAPI.setBadgeCount(n); } catch {}
    }
    if (typeof navigator !== 'undefined' && typeof navigator.setAppBadge === 'function') {
        if (n > 0) navigator.setAppBadge(n).catch(() => {});
        else navigator.clearAppBadge?.().catch(() => {});
    }
}
