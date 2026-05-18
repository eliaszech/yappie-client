import { exec } from 'child_process';
import { GAME_CATALOG } from './gameCatalog.js';

const POLL_INTERVAL_MS = 12_000;

let intervalHandle = null;
let lastDetected = null; // { name, icon } | null
let onChange = null;
let enabled = true;
// Cache extracted icons keyed by lowercased exe name → data URI (or '' if extraction failed).
const iconCache = new Map();
// User-defined games merged with the built-in catalog. Keys are lowercased exe names.
const customGames = new Map();

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

// Look up the running process's exe path and extract the embedded icon
// resource (NOT the shell icon, which often resolves to the generic .exe icon
// for signed/packaged games). Uses Get-Process for the path lookup because
// wmic is no longer shipped by default on Windows 11 24H2+.
function extractIconViaPowerShell(processName) {
    return new Promise((resolve) => {
        const baseName = processName.replace(/\.exe$/i, '').replace(/'/g, "''");
        const script = `
            $ErrorActionPreference='SilentlyContinue'
            Add-Type -AssemblyName System.Drawing
            $proc = Get-Process -Name '${baseName}' | Where-Object {$_.Path} | Select-Object -First 1
            if (!$proc) { Write-Output 'NOPATH'; exit }
            try {
                $icon = [System.Drawing.Icon]::ExtractAssociatedIcon($proc.Path)
                if (!$icon) { Write-Output 'NOICON'; exit }
                $bmp = $icon.ToBitmap()
                $ms = New-Object System.IO.MemoryStream
                $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
                Write-Output ('OK:' + [Convert]::ToBase64String($ms.ToArray()))
            } catch {
                Write-Output ('ERR:' + $_.Exception.Message)
            }
        `.trim();
        const encoded = Buffer.from(script, 'utf16le').toString('base64');
        const cmd = `powershell.exe -NoProfile -NonInteractive -EncodedCommand ${encoded}`;
        exec(cmd, { windowsHide: true, maxBuffer: 4 * 1024 * 1024 }, (err, stdout) => {
            if (err) {
                resolve({ ok: false, reason: 'spawn:' + err.message });
                return;
            }
            const out = stdout.trim();
            if (out.startsWith('OK:')) {
                resolve({ ok: true, dataUri: 'data:image/png;base64,' + out.slice(3) });
            } else {
                resolve({ ok: false, reason: out || 'empty' });
            }
        });
    });
}

async function extractIcon(processName) {
    if (iconCache.has(processName)) return iconCache.get(processName) || null;

    const result = await extractIconViaPowerShell(processName);
    if (!result.ok) {
        console.warn('[gameDetection] icon extraction failed for', processName, '→', result.reason);
        iconCache.set(processName, '');
        return null;
    }
    console.log('[gameDetection] extracted icon for', processName, '→', result.dataUri.length, 'bytes');
    iconCache.set(processName, result.dataUri);
    return result.dataUri;
}

async function detectOnce() {
    const names = await listProcessesWindows();
    for (const n of names) {
        const name = GAME_CATALOG[n] ?? customGames.get(n);
        if (name) {
            const icon = await extractIcon(n);
            return { name, icon };
        }
    }
    return null;
}

function sameDetection(a, b) {
    if (a === b) return true;
    if (!a || !b) return false;
    return a.name === b.name && a.icon === b.icon;
}

async function tick() {
    if (!enabled) return;
    try {
        const game = await detectOnce();
        // Re-check after async work: detection + icon extraction takes time,
        // and the user may have disabled sharing in the meantime.
        if (!enabled) return;
        if (!sameDetection(game, lastDetected)) {
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

export function setCustomGames(games) {
    customGames.clear();
    for (const g of games) {
        if (!g || typeof g.processName !== 'string' || typeof g.displayName !== 'string') continue;
        customGames.set(g.processName.toLowerCase(), g.displayName);
    }
    // Trigger a re-detect so a freshly-added game shows up without waiting
    // for the next poll cycle (no-op when sharing is off).
    if (enabled) tick();
}

export function setDetectionEnabled(value) {
    const next = Boolean(value);
    if (next === enabled) return;
    enabled = next;
    if (!enabled) {
        // Clear current detection so subscribers see "no activity" right away.
        if (lastDetected !== null) {
            lastDetected = null;
            if (onChange) onChange(null);
        }
    } else {
        tick();
    }
}