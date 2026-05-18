import { useEffect, useRef, useState } from "react";
import { DEFAULT_DEVICE, MAX_MIC_THRESHOLD } from "../../../services/voiceSettings.js";

const SEGMENTS = 18;

export default function MicLevelMeter({ deviceId, gain = 1, threshold = 0, active = true }) {
    const [level, setLevel] = useState(0);
    const ctxRef = useRef(null);
    const gainNodeRef = useRef(null);
    const animRef = useRef(0);
    const peakRef = useRef(0);

    useEffect(() => {
        if (!active) return;

        let stream;
        let cancelled = false;

        async function start() {
            try {
                const constraints = deviceId && deviceId !== DEFAULT_DEVICE
                    ? { audio: { deviceId: { exact: deviceId }, echoCancellation: false, autoGainControl: false, noiseSuppression: false } }
                    : { audio: { echoCancellation: false, autoGainControl: false, noiseSuppression: false } };

                stream = await navigator.mediaDevices.getUserMedia(constraints);
                if (cancelled) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }

                const ctx = new AudioContext();
                ctxRef.current = ctx;

                const source = ctx.createMediaStreamSource(stream);
                const gainNode = ctx.createGain();
                gainNode.gain.value = gain;
                gainNodeRef.current = gainNode;

                const analyser = ctx.createAnalyser();
                analyser.fftSize = 1024;
                analyser.smoothingTimeConstant = 0.6;

                source.connect(gainNode).connect(analyser);

                const data = new Uint8Array(analyser.fftSize);
                function tick() {
                    analyser.getByteTimeDomainData(data);
                    let peak = 0;
                    for (let i = 0; i < data.length; i++) {
                        const v = Math.abs(data[i] - 128) / 128;
                        if (v > peak) peak = v;
                    }
                    // Smoothed decay so the bar doesn't flicker between syllables.
                    peakRef.current = Math.max(peak, peakRef.current * 0.85);
                    setLevel(peakRef.current);
                    animRef.current = requestAnimationFrame(tick);
                }
                tick();
            } catch {
                // Permissions denied or device unavailable — meter stays at 0.
            }
        }

        start();

        return () => {
            cancelled = true;
            cancelAnimationFrame(animRef.current);
            try { ctxRef.current?.close(); } catch {}
            ctxRef.current = null;
            gainNodeRef.current = null;
            stream?.getTracks().forEach(t => t.stop());
        };
    }, [deviceId, active]);

    useEffect(() => {
        const gainNode = gainNodeRef.current;
        const ctx = ctxRef.current;
        if (gainNode && ctx) {
            gainNode.gain.setTargetAtTime(gain, ctx.currentTime, 0.02);
        }
    }, [gain]);

    const filled = Math.round(Math.min(level, 1) * SEGMENTS);
    const thresholdPct = Math.min(1, threshold / MAX_MIC_THRESHOLD) * 100;
    const aboveThreshold = level >= threshold && threshold > 0;

    return (
        <div className="relative">
            <div className="flex items-center gap-[3px] h-3" role="meter" aria-valuenow={Math.round(level * 100)} aria-valuemin="0" aria-valuemax="100">
                {Array.from({ length: SEGMENTS }).map((_, i) => {
                    const isOn = i < filled;
                    const ratio = i / (SEGMENTS - 1);
                    let color = 'bg-emerald-500';
                    if (ratio > 0.75) color = 'bg-red-500';
                    else if (ratio > 0.55) color = 'bg-yellow-400';
                    const dimmed = isOn && threshold > 0 && !aboveThreshold;
                    return (
                        <span
                            key={i}
                            className={`flex-1 h-full rounded-[2px] transition-opacity duration-75 ${color} ${isOn ? (dimmed ? 'opacity-40' : 'opacity-100') : 'opacity-15'}`}
                        />
                    );
                })}
            </div>
            {threshold > 0 && (
                <div
                    className="absolute top-[-2px] bottom-[-2px] w-[2px] bg-foreground/80 pointer-events-none rounded-full"
                    style={{ left: `calc(${thresholdPct}% - 1px)` }}
                    aria-hidden="true"
                />
            )}
        </div>
    );
}