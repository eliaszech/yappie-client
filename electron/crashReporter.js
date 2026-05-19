import { app } from 'electron';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

// Persistent dir for crash reports the renderer hasn't been able to flush yet
// (e.g. the previous run crashed before login). Reports are JSON files; we
// re-read them on next boot when the renderer hands us the API URL.
let pendingDir = null;

function getPendingDir() {
    if (!pendingDir) {
        pendingDir = path.join(app.getPath('userData'), 'pending-crashes');
        try { fsSync.mkdirSync(pendingDir, { recursive: true }); } catch { /* noop */ }
    }
    return pendingDir;
}

async function writeReport(payload) {
    try {
        const dir = getPendingDir();
        const file = path.join(dir, `${Date.now()}-${randomUUID()}.json`);
        const body = JSON.stringify({
            ...payload,
            appVersion: app.getVersion(),
            platform: process.platform,
            arch: process.arch,
            electronVersion: process.versions.electron,
            recordedAt: new Date().toISOString(),
        });
        await fs.writeFile(file, body, 'utf8');
    } catch (err) {
        // Last-resort: write to stderr; nothing else we can do.
        console.error('crash reporter write failed:', err?.message ?? err);
    }
}

export function setupCrashReporter() {
    process.on('uncaughtException', (err) => {
        writeReport({
            type: 'main:uncaughtException',
            message: err?.message ?? String(err),
            stack: err?.stack ?? null,
        });
    });

    process.on('unhandledRejection', (reason) => {
        const err = reason instanceof Error ? reason : new Error(String(reason));
        writeReport({
            type: 'main:unhandledRejection',
            message: err.message,
            stack: err.stack ?? null,
        });
    });

    app.on('web-contents-created', (_event, contents) => {
        contents.on('render-process-gone', (_e, details) => {
            writeReport({
                type: 'renderer:render-process-gone',
                reason: details?.reason,
                exitCode: details?.exitCode,
                url: contents.getURL?.() ?? null,
            });
        });
        contents.on('unresponsive', () => {
            writeReport({ type: 'renderer:unresponsive', url: contents.getURL?.() ?? null });
        });
    });

    app.on('child-process-gone', (_event, details) => {
        if (details?.reason === 'clean-exit') return;
        writeReport({
            type: `child:${details?.type ?? 'unknown'}`,
            reason: details?.reason,
            exitCode: details?.exitCode,
            name: details?.name,
        });
    });
}

// Called from the renderer (via IPC) once it knows the API URL.
export async function recordRendererCrash(payload) {
    await writeReport({
        type: 'renderer:js-error',
        ...payload,
    });
}

// Flushes all pending crash reports to the backend. Returns the number sent.
// Renderer hands us apiUrl so we don't need to know it at main-startup time —
// crashes are kept on disk until then.
export async function flushPendingCrashes(apiUrl) {
    if (!apiUrl) return 0;
    const dir = getPendingDir();
    let files = [];
    try {
        files = await fs.readdir(dir);
    } catch {
        return 0;
    }

    const endpoint = apiUrl.endsWith('/') ? `${apiUrl}crash-reports` : `${apiUrl}/crash-reports`;
    let sent = 0;
    for (const name of files) {
        if (!name.endsWith('.json')) continue;
        const full = path.join(dir, name);
        let body;
        try { body = await fs.readFile(full, 'utf8'); } catch { continue; }
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body,
            });
            if (res.ok) {
                await fs.unlink(full).catch(() => {});
                sent += 1;
            }
            // On non-2xx we keep the file for the next run.
        } catch {
            // Network error — keep file, will retry next boot.
        }
    }
    return sent;
}
