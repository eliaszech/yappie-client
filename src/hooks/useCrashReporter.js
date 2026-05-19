import { useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Bridges Electron's crashReporter to the renderer:
// - flushes any pending main-process crash reports on first mount
// - records uncaught renderer errors and rejections so they get sent next boot
export function useCrashReporter() {
    useEffect(() => {
        const api = typeof window !== 'undefined' ? window.electronAPI : null;
        if (!api?.flushCrashes) return;

        // Flush pending crashes from previous run(s). Fire and forget.
        api.flushCrashes(API_URL).catch(() => { /* ignored */ });

        function safeRecord(payload) {
            try { api.recordCrash?.(payload); } catch { /* ignored */ }
        }

        function onError(event) {
            safeRecord({
                message: event.message ?? String(event.error ?? 'unknown error'),
                stack: event.error?.stack ?? null,
                filename: event.filename ?? null,
                lineno: event.lineno ?? null,
                colno: event.colno ?? null,
                url: window.location.href,
            });
        }

        function onRejection(event) {
            const reason = event.reason;
            const err = reason instanceof Error ? reason : new Error(String(reason));
            safeRecord({
                type: 'renderer:unhandledrejection',
                message: err.message,
                stack: err.stack ?? null,
                url: window.location.href,
            });
        }

        window.addEventListener('error', onError);
        window.addEventListener('unhandledrejection', onRejection);
        return () => {
            window.removeEventListener('error', onError);
            window.removeEventListener('unhandledrejection', onRejection);
        };
    }, []);
}
