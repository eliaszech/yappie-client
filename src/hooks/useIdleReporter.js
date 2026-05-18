import { useEffect, useRef } from "react";
import { getSocket } from "../services/socket.js";
import { useVoice } from "./useVoice.jsx";

const REPORT_INTERVAL_MS = 15_000;
const BROWSER_IDLE_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel'];

// Reports the user's OS idle time to the backend every 15s so the AFK worker
// can decide whether to move them. In Electron we use powerMonitor; in the
// browser we maintain a per-tab idle timer derived from input events.
// We also piggy-back the current voice presence on each report so the backend
// can recover its in-memory presence map after a restart without any extra
// handshake.
export function useIdleReporter() {
    const voice = useVoice();
    const voiceChannelId = voice?.channelId ?? null;
    const voiceServerId = voice?.serverId ?? null;
    const browserIdleStartRef = useRef(Date.now());
    const presenceRef = useRef({ channelId: null, serverId: null });
    presenceRef.current = { channelId: voiceChannelId, serverId: voiceServerId };

    useEffect(() => {
        const isElectron = !!window.electronAPI?.getIdleSeconds;

        let cancelled = false;

        function resetBrowserIdle() {
            browserIdleStartRef.current = Date.now();
        }

        if (!isElectron) {
            for (const ev of BROWSER_IDLE_EVENTS) {
                window.addEventListener(ev, resetBrowserIdle, { passive: true });
            }
        }

        async function report() {
            const socket = getSocket();
            if (!socket || !socket.connected) return;

            let idleSeconds;
            if (isElectron) {
                try {
                    idleSeconds = await window.electronAPI.getIdleSeconds();
                } catch {
                    idleSeconds = 0;
                }
            } else {
                idleSeconds = Math.max(0, Math.floor((Date.now() - browserIdleStartRef.current) / 1000));
            }

            if (cancelled) return;
            socket.emit('presence:idle', {
                idleSeconds,
                voiceChannelId: presenceRef.current.channelId,
                voiceServerId: presenceRef.current.serverId,
            });
        }

        report();
        const interval = setInterval(report, REPORT_INTERVAL_MS);

        return () => {
            cancelled = true;
            clearInterval(interval);
            if (!isElectron) {
                for (const ev of BROWSER_IDLE_EVENTS) {
                    window.removeEventListener(ev, resetBrowserIdle);
                }
            }
        };
    }, []);

    // Fire an immediate report whenever voice presence changes so the backend
    // sees the new channel right away (otherwise it waits up to 15s for the
    // next periodic report).
    useEffect(() => {
        const socket = getSocket();
        if (!socket || !socket.connected) return;
        socket.emit('presence:idle', {
            idleSeconds: 0,
            voiceChannelId,
            voiceServerId,
        });
    }, [voiceChannelId, voiceServerId]);
}
