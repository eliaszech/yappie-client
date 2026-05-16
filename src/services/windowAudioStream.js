// Bridges per-window PCM chunks from Electron (application-loopback)
// into a MediaStreamTrack we can publish via LiveKit.
//
// PCM format from main: interleaved 16-bit signed PCM, stereo, 48000 Hz.

const SAMPLE_RATE = 48000;
const CHANNELS = 2;
const BYTES_PER_FRAME = CHANNELS * 2; // 2 channels * 16-bit

export function createWindowAudioStream() {
    if (typeof MediaStreamTrackGenerator === 'undefined' || typeof AudioData === 'undefined') {
        return null;
    }

    const generator = new MediaStreamTrackGenerator({ kind: 'audio' });
    const writer = generator.writable.getWriter();
    let totalFrames = 0;
    let closed = false;
    let unsubscribe = null;

    function onChunk(chunk) {
        if (closed) return;
        const byteLength = chunk.byteLength;
        if (byteLength === 0 || byteLength % BYTES_PER_FRAME !== 0) return;

        const numberOfFrames = byteLength / BYTES_PER_FRAME;
        const timestamp = Math.round((totalFrames * 1_000_000) / SAMPLE_RATE);

        try {
            const buffer = chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + byteLength);
            const audioData = new AudioData({
                format: 's16',
                sampleRate: SAMPLE_RATE,
                numberOfFrames,
                numberOfChannels: CHANNELS,
                timestamp,
                data: buffer,
            });
            writer.write(audioData).catch(() => {});
            totalFrames += numberOfFrames;
        } catch {
            // Malformed frame — skip
        }
    }

    function start() {
        if (!window.electronAPI?.onWindowAudioChunk) return;
        window.electronAPI.onWindowAudioChunk(onChunk);
        unsubscribe = () => {
            // No remove API surfaced; preload re-binds with removeAllListeners on next call
        };
    }

    function close() {
        if (closed) return;
        closed = true;
        try {
            writer.close().catch(() => {});
        } catch {}
        unsubscribe?.();
    }

    start();

    return { track: generator, close };
}
