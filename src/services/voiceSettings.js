const MIC_DEVICE_KEY = 'voice-mic-device';
const SPEAKER_DEVICE_KEY = 'voice-speaker-device';
const MIC_GAIN_KEY = 'voice-mic-gain';

export const DEFAULT_DEVICE = 'default';
export const DEFAULT_MIC_GAIN = 1;
export const MIN_MIC_GAIN = 0;
export const MAX_MIC_GAIN = 2;

export function getMicDeviceId() {
    return localStorage.getItem(MIC_DEVICE_KEY) || DEFAULT_DEVICE;
}

export function setMicDeviceId(id) {
    localStorage.setItem(MIC_DEVICE_KEY, id || DEFAULT_DEVICE);
}

export function getSpeakerDeviceId() {
    return localStorage.getItem(SPEAKER_DEVICE_KEY) || DEFAULT_DEVICE;
}

export function setSpeakerDeviceId(id) {
    localStorage.setItem(SPEAKER_DEVICE_KEY, id || DEFAULT_DEVICE);
}

export function getMicGain() {
    const raw = localStorage.getItem(MIC_GAIN_KEY);
    if (raw === null) return DEFAULT_MIC_GAIN;
    const n = Number(raw);
    if (!Number.isFinite(n)) return DEFAULT_MIC_GAIN;
    return Math.min(MAX_MIC_GAIN, Math.max(MIN_MIC_GAIN, n));
}

export function setMicGain(value) {
    const clamped = Math.min(MAX_MIC_GAIN, Math.max(MIN_MIC_GAIN, Number(value) || 0));
    localStorage.setItem(MIC_GAIN_KEY, String(clamped));
}