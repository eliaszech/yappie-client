import { exec } from 'child_process';
import { GAME_CATALOG } from './gameCatalog.js';

const POLL_INTERVAL_MS = 12_000;

let intervalHandle = null;
let lastDetected = null; // string | null
let onChange = null;

function listProcessesWindows() {
    return new Promise((resolve) => {
        // /fo csv → "name","pid","sessionname","session#","memUsage"
        // /nh    → no header row
        exec('tasklist /fo csv /nh', { windowsHide: true, maxBuffer: 4 * 1024 * 1024 }, (err, stdout) => {
            if (err) {
                resolve([]);
                return;
            }
            const names = new Set();
            for (const line of stdout.split(/\r?\n/)) {
                const m = line.match(/^"([^"]+)"/);
                if (m) names.add(m[1].toLowerCase());
            }
            resolve([...names]);
        });
    });
}

async function detectOnce() {
    const names = await listProcessesWindows();
    for (const n of names) {
        const game = GAME_CATALOG[n];
        if (game) return game;
    }
    return null;
}

async function tick() {
    try {
        const game = await detectOnce();
        if (game !== lastDetected) {
            lastDetected = game;
            if (onChange) onChange(game);
        }
    } catch {
        // ignore — next tick will retry
    }
}

export function startGameDetection(callback) {
    if (process.platform !== 'win32') return; // detection currently Windows-only
    onChange = callback;
    if (intervalHandle) return;
    // Fire once immediately so the first detection doesn't wait a full interval.
    tick();
    intervalHandle = setInterval(tick, POLL_INTERVAL_MS);
}

export function stopGameDetection() {
    if (intervalHandle) {
        clearInterval(intervalHandle);
        intervalHandle = null;
    }
    onChange = null;
    lastDetected = null;
}
