const MIC_DEVICE_KEY = 'voice-mic-device';
const SPEAKER_DEVICE_KEY = 'voice-speaker-device';
const MIC_GAIN_KEY = 'voice-mic-gain';
const MIC_THRESHOLD_KEY = 'voice-mic-threshold';

export const DEFAULT_DEVICE = 'default';
export const DEFAULT_MIC_GAIN = 1;
export const MIN_MIC_GAIN = 0;
export const MAX_MIC_GAIN = 2;
export const DEFAULT_MIC_THRESHOLD = 0;
export const MIN_MIC_THRESHOLD = 0;
export const MAX_MIC_THRESHOLD = 0.5;

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

export function getMicThreshold() {
    const raw = localStorage.getItem(MIC_THRESHOLD_KEY);
    if (raw === null) return DEFAULT_MIC_THRESHOLD;
    const n = Number(raw);
    if (!Number.isFinite(n)) return DEFAULT_MIC_THRESHOLD;
    return Math.min(MAX_MIC_THRESHOLD, Math.max(MIN_MIC_THRESHOLD, n));
}

export function setMicThreshold(value) {
    const clamped = Math.min(MAX_MIC_THRESHOLD, Math.max(MIN_MIC_THRESHOLD, Number(value) || 0));
    localStorage.setItem(MIC_THRESHOLD_KEY, String(clamped));
}