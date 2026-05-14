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
});
