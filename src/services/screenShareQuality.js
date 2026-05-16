import { ScreenSharePresets } from 'livekit-client';

const STORAGE_KEY = 'screen-share-quality';

export const QUALITY_PRESETS = [
    { id: 'h720fps15',  label: '720p · 15 FPS',  preset: ScreenSharePresets.h720fps15 },
    { id: 'h720fps30',  label: '720p · 30 FPS',  preset: ScreenSharePresets.h720fps30 },
    { id: 'h1080fps15', label: '1080p · 15 FPS', preset: ScreenSharePresets.h1080fps15 },
    { id: 'h1080fps30', label: '1080p · 30 FPS', preset: ScreenSharePresets.h1080fps30 },
];

export const DEFAULT_QUALITY_ID = 'h1080fps30';

export function getQualityId() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && QUALITY_PRESETS.some(q => q.id === stored)) return stored;
    return DEFAULT_QUALITY_ID;
}

export function setQualityId(id) {
    if (!QUALITY_PRESETS.some(q => q.id === id)) return;
    localStorage.setItem(STORAGE_KEY, id);
}

export function getQualityPreset() {
    return QUALITY_PRESETS.find(q => q.id === getQualityId()) ?? QUALITY_PRESETS[0];
}

export function buildScreenShareOptions() {
    const { preset } = getQualityPreset();
    return {
        capture: { resolution: preset.resolution },
        publish: { screenShareEncoding: preset.encoding },
    };
}