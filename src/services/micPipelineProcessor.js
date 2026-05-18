import { RnnoiseWorkletNode } from '@sapphi-red/web-noise-suppressor';
import rnnoiseWasmUrl from '@sapphi-red/web-noise-suppressor/rnnoise.wasm?url';
import rnnoiseWorkletUrl from '@sapphi-red/web-noise-suppressor/rnnoiseWorklet.js?url';
import noiseGateWorkletUrl from './noiseGateWorklet.js?url';

let cachedWasm;
async function loadWasm() {
    if (!cachedWasm) {
        cachedWasm = await fetch(rnnoiseWasmUrl).then(r => r.arrayBuffer());
    }
    return cachedWasm;
}

/**
 * Audio pipeline: source → [rnnoise] → [noise-gate] → gain → destination.
 * Gain, rnnoise and threshold can be updated live without re-creating the chain
 * via setGain / setRnnoiseEnabled / setThreshold.
 * (Toggling rnnoise rewires the graph but keeps the AudioContext alive.)
 */
export function createMicPipelineProcessor({ initialGain = 1, initialRnnoise = false, initialThreshold = 0 } = {}) {
    let ctx, source, gain, worklet, gate, destination;
    let rnnoiseOn = initialRnnoise;
    let currentGain = initialGain;
    let currentThreshold = initialThreshold;
    let gateLoaded = false;

    function wire() {
        try { source?.disconnect(); } catch {}
        try { worklet?.disconnect(); } catch {}
        try { gate?.disconnect(); } catch {}
        try { gain?.disconnect(); } catch {}
        let chain = source;
        if (rnnoiseOn && worklet) {
            chain = chain.connect(worklet);
        }
        if (gate) {
            chain = chain.connect(gate);
        }
        chain.connect(gain).connect(destination);
    }

    async function ensureRnnoise() {
        if (worklet) return;
        await ctx.audioWorklet.addModule(rnnoiseWorkletUrl);
        const wasmBinary = await loadWasm();
        worklet = new RnnoiseWorkletNode(ctx, { wasmBinary, maxChannels: 1 });
    }

    async function ensureGate() {
        if (gate) return;
        if (!gateLoaded) {
            await ctx.audioWorklet.addModule(noiseGateWorkletUrl);
            gateLoaded = true;
        }
        gate = new AudioWorkletNode(ctx, 'noise-gate-processor');
        gate.parameters.get('threshold').value = currentThreshold;
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
            await ensureGate();
            wire();

            this.processedTrack = destination.stream.getAudioTracks()[0];
        },

        async restart({ track }) {
            await this.destroy();
            await this.init({ track });
        },

        async destroy() {
            try { worklet?.disconnect(); } catch {}
            try { gate?.disconnect(); } catch {}
            try { source?.disconnect(); } catch {}
            try { gain?.disconnect(); } catch {}
            if (ctx && ctx.state !== 'closed') await ctx.close();
            ctx = source = gain = worklet = gate = destination = undefined;
            gateLoaded = false;
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

        setThreshold(value) {
            currentThreshold = value;
            const param = gate?.parameters.get('threshold');
            if (param && ctx) {
                param.setTargetAtTime(value, ctx.currentTime, 0.02);
            }
        },
    };
}