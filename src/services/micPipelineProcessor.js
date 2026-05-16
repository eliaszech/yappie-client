import { RnnoiseWorkletNode } from '@sapphi-red/web-noise-suppressor';
import rnnoiseWasmUrl from '@sapphi-red/web-noise-suppressor/rnnoise.wasm?url';
import rnnoiseWorkletUrl from '@sapphi-red/web-noise-suppressor/rnnoiseWorklet.js?url';

let cachedWasm;
async function loadWasm() {
    if (!cachedWasm) {
        cachedWasm = await fetch(rnnoiseWasmUrl).then(r => r.arrayBuffer());
    }
    return cachedWasm;
}

/**
 * Audio pipeline: source → [rnnoise] → gain → destination.
 * Gain and rnnoise can be updated live without re-creating the chain via setGain / setRnnoiseEnabled.
 * (Toggling rnnoise rewires the graph but keeps the AudioContext alive.)
 */
export function createMicPipelineProcessor({ initialGain = 1, initialRnnoise = false } = {}) {
    let ctx, source, gain, worklet, destination;
    let rnnoiseOn = initialRnnoise;
    let currentGain = initialGain;

    function wire() {
        try { source?.disconnect(); } catch {}
        try { worklet?.disconnect(); } catch {}
        try { gain?.disconnect(); } catch {}
        if (rnnoiseOn && worklet) {
            source.connect(worklet).connect(gain).connect(destination);
        } else {
            source.connect(gain).connect(destination);
        }
    }

    async function ensureRnnoise() {
        if (worklet) return;
        await ctx.audioWorklet.addModule(rnnoiseWorkletUrl);
        const wasmBinary = await loadWasm();
        worklet = new RnnoiseWorkletNode(ctx, { wasmBinary, maxChannels: 1 });
    }

    return {
        name: 'mic-pipeline',
        processedTrack: undefined,

        async init({ track }) {
            ctx = new AudioContext();
            source = ctx.createMediaStreamSource(new MediaStream([track]));
            gain = ctx.createGain();
            gain.gain.value = currentGain;
            destination = ctx.createMediaStreamDestination();

            if (rnnoiseOn) await ensureRnnoise();
            wire();

            this.processedTrack = destination.stream.getAudioTracks()[0];
        },

        async restart({ track }) {
            await this.destroy();
            await this.init({ track });
        },

        async destroy() {
            try { worklet?.disconnect(); } catch {}
            try { source?.disconnect(); } catch {}
            try { gain?.disconnect(); } catch {}
            if (ctx && ctx.state !== 'closed') await ctx.close();
            ctx = source = gain = worklet = destination = undefined;
            this.processedTrack = undefined;
        },

        setGain(value) {
            currentGain = value;
            if (gain && ctx) {
                gain.gain.setTargetAtTime(value, ctx.currentTime, 0.02);
            }
        },

        async setRnnoiseEnabled(enabled) {
            rnnoiseOn = enabled;
            if (!ctx) return;
            if (enabled) await ensureRnnoise();
            wire();
        },
    };
}