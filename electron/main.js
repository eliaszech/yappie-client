import { app, BrowserWindow, shell, desktopCapturer, ipcMain, session } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === 'development';

let mainWindow = null;

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

            const sources = await desktopCapturer.getSources({
                types: ['screen', 'window'],
                thumbnailSize: { width: 320, height: 180 },
                fetchWindowIcons: true,
            });

            const serialized = sources.map(s => ({
                id: s.id,
                name: s.name,
                thumbnail: s.thumbnail.toDataURL(),
            }));

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

            const source = sources.find(s => s.id === sourceId);
            callback(source ? { video: source } : {});
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
    setupIpc();
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
