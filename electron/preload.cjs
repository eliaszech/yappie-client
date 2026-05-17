const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    isElectron: true,

    // Called immediately when getDisplayMedia() is intercepted — open the modal now
    onShowSourcePicker: (callback) => {
        ipcRenderer.removeAllListeners('electron:show-source-picker');
        ipcRenderer.on('electron:show-source-picker', () => callback());
    },

    // Called once sources have been fetched — populate the modal
    onSourcePickerSources: (callback) => {
        ipcRenderer.removeAllListeners('electron:source-picker-sources');
        ipcRenderer.on('electron:source-picker-sources', (_event, sources) => callback(sources));
    },

    // Confirm the user's source selection
    pickSource: (sourceId) => ipcRenderer.send('electron:source-picked', sourceId),

    // Signal that the user cancelled the picker
    cancelSourcePicker: () => ipcRenderer.send('electron:source-cancelled'),

    // Per-window audio capture (Windows-only). PCM chunks: 16-bit signed, stereo, 48000 Hz.
    onWindowAudioStarted: (callback) => {
        ipcRenderer.removeAllListeners('electron:window-audio-started');
        ipcRenderer.on('electron:window-audio-started', () => callback());
    },
    onWindowAudioStopped: (callback) => {
        ipcRenderer.removeAllListeners('electron:window-audio-stopped');
        ipcRenderer.on('electron:window-audio-stopped', () => callback());
    },
    onWindowAudioUnavailable: (callback) => {
        ipcRenderer.removeAllListeners('electron:window-audio-unavailable');
        ipcRenderer.on('electron:window-audio-unavailable', () => callback());
    },
    onWindowAudioChunk: (callback) => {
        ipcRenderer.removeAllListeners('electron:window-audio-chunk');
        ipcRenderer.on('electron:window-audio-chunk', (_event, chunk) => callback(chunk));
    },
    stopWindowAudio: () => ipcRenderer.send('electron:stop-window-audio'),

    // Game / Rich Presence
    onGameDetected: (callback) => {
        ipcRenderer.removeAllListeners('electron:game-detected');
        ipcRenderer.on('electron:game-detected', (_event, game) => callback(game));
    },
    getCurrentGame: () => ipcRenderer.invoke('electron:get-current-game'),

    // Updater
    onUpdateStatus: (callback) => {
        ipcRenderer.removeAllListeners('update:status');
        ipcRenderer.on('update:status', (_event, payload) => callback(payload));
    },
    installUpdate: () => ipcRenderer.invoke('update:install-now'),
    checkForUpdates: () => ipcRenderer.invoke('update:check'),
});
