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

export function createRnnoiseProcessor() {
    let ctx, source, worklet, destination;

    return {
        name: 'rnnoise',
        processedTrack: undefined,

        async init({ track }) {
            ctx = new AudioContext();
            await ctx.audioWorklet.addModule(rnnoiseWorkletUrl);
            const wasmBinary = await loadWasm();

            source = ctx.createMediaStreamSource(new MediaStream([track]));
            worklet = new RnnoiseWorkletNode(ctx, { wasmBinary, maxChannels: 1 });
            destination = ctx.createMediaStreamDestination();

            source.connect(worklet).connect(destination);
            this.processedTrack = destination.stream.getAudioTracks()[0];
        },

        async restart({ track }) {
            await this.destroy();
            await this.init({ track });
        },

        async destroy() {
            try { worklet?.disconnect(); } catch {}
            try { source?.disconnect(); } catch {}
            if (ctx && ctx.state !== 'closed') await ctx.close();
            ctx = source = worklet = destination = undefined;
            this.processedTrack = undefined;
        },
    };
}