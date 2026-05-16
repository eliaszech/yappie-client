import { app, BrowserWindow, shell, desktopCapturer, ipcMain, session } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === 'development';

// Windows Graphics Capture crasht auf manchen GPU/Treiber-Kombis beim
// Start des Captures (E_INVALIDARG → Access Violation im GPU-Prozess).
// Fallback auf den alten DXGI/GDI-Capturer erzwingen.
app.commandLine.appendSwitch(
    'disable-features',
    'AllowWgcScreenCapturer,AllowWgcWindowCapturer,WebRtcAllowWgcDesktopCapturer',
);

let mainWindow = null;

function setupAutoUpdater() {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    function send(status, payload = {}) {
        if (!mainWindow || mainWindow.isDestroyed()) return;
        mainWindow.webContents.send('update:status', { status, ...payload });
    }

    autoUpdater.on('checking-for-update', () => send('checking'));
    autoUpdater.on('update-available', info => send('available', { version: info?.version }));
    autoUpdater.on('update-not-available', info => send('not-available', { version: info?.version }));
    autoUpdater.on('download-progress', p => send('downloading', { percent: p?.percent ?? 0 }));
    autoUpdater.on('update-downloaded', info => send('downloaded', { version: info?.version }));
    autoUpdater.on('error', err => send('error', { message: err?.message || String(err) }));

    ipcMain.handle('update:install-now', () => {
        autoUpdater.quitAndInstall(true, true);
    });

    ipcMain.handle('update:check', async () => {
        try {
            await autoUpdater.checkForUpdates();
        } catch (err) {
            send('error', { message: err?.message || String(err) });
        }
    });

    function check() {
        autoUpdater.checkForUpdates().catch(err => {
            send('error', { message: err?.message || String(err) });
        });
    }

    check();
    setInterval(check, 15 * 60 * 1000);
}

function setupIpc() {
    // Renderer asks for available screen/window sources (for thumbnail preview)
    ipcMain.handle('get-display-sources', async () => {
        const sources = await desktopCapturer.getSources({
            types: ['screen', 'window'],
            thumbnailSize: { width: 320, height: 180 },
            fetchWindowIcons: true,
        });
        return sources.map(s => ({
            id: s.id,
            name: s.name,
            thumbnail: s.thumbnail.toDataURL(),
        }));
    });

    // Intercept getDisplayMedia() calls from the renderer (LiveKit screen share)
    session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
        try {
            // Open the picker modal immediately — don't wait for sources
            mainWindow.webContents.send('electron:show-source-picker');

            // Auf Multi-Monitor-Setups crasht WGC, wenn Thumbnails für alle
            // Fenster gleichzeitig gefangen werden. Screens sind stabil
            // (max 1-2 Surfaces), also Thumbnails nur für Screens; für
            // Fenster reichen Name + Icon (Icon kommt über ExtractIcon, nicht WGC).
            const [screenSources, windowSources] = await Promise.all([
                desktopCapturer.getSources({
                    types: ['screen'],
                    thumbnailSize: { width: 320, height: 180 },
                    fetchWindowIcons: false,
                }),
                desktopCapturer.getSources({
                    types: ['window'],
                    thumbnailSize: { width: 0, height: 0 },
                    fetchWindowIcons: true,
                }),
            ]);

            const serialized = [
                ...screenSources.map(s => ({
                    id: s.id,
                    name: s.name,
                    thumbnail: s.thumbnail.toDataURL(),
                    icon: null,
                })),
                ...windowSources.map(s => ({
                    id: s.id,
                    name: s.name,
                    thumbnail: null,
                    icon: s.appIcon ? s.appIcon.toDataURL() : null,
                })),
            ];

            mainWindow.webContents.send('electron:source-picker-sources', serialized);

            // Wait for renderer to respond with a selection or cancel
            const sourceId = await new Promise((resolve, reject) => {
                function onPick(event, id) {
                    cleanup();
                    resolve(id);
                }
                function onCancel() {
                    cleanup();
                    reject(new Error('cancelled'));
                }
                function cleanup() {
                    ipcMain.removeListener('electron:source-picked', onPick);
                    ipcMain.removeListener('electron:source-cancelled', onCancel);
                }
                ipcMain.once('electron:source-picked', onPick);
                ipcMain.once('electron:source-cancelled', onCancel);
            });

            const source = [...screenSources, ...windowSources].find(s => s.id === sourceId);
            if (!source) {
                callback({});
                return;
            }
            // Pass system audio loopback through only when the renderer asked for it
            // (Windows-only; on other platforms Electron ignores this and you just get video)
            const response = { video: source };
            if (request.audioRequested) response.audio = 'loopback';
            callback(response);
        } catch {
            callback({});
        }
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 940,
        minHeight: 560,
        backgroundColor: '#1c1f26',
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    mainWindow.once('ready-to-show', () => mainWindow.show());

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
    }
}

app.whenReady().then(() => {
    if (process.platform === 'win32') app.setAppUserModelId('com.yappie.client');
    setupIpc();
    createWindow();
    if (!isDev) setupAutoUpdater();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
