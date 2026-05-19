import { exec } from 'child_process';
import { GAME_CATALOG } from './gameCatalog.js';

const POLL_INTERVAL_MS = 12_000;
// Re-attempt failed icon extractions only after this cooldown so we don't
// hammer PowerShell every poll for protected games (Battlefield 6, Valorant,
// …) whose running process Path is blocked by anti-cheat.
const ICON_FAILURE_RETRY_MS = 5 * 60_000;

let intervalHandle = null;
let lastDetected = null; // { name, icon } | null
let onChange = null;
let enabled = true;
// Successful extractions only — keyed by lowercased exe name → data URI.
const iconCache = new Map();
// Last failure timestamp per exe name. Used to cooldown retries without
// permanently marking anti-cheat-blocked games as iconless.
const iconFailures = new Map();
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
//
// Anti-cheat-protected games (BF6 / EA Javelin, Valorant / Vanguard, …) deny
// $_.Path on the running process, so Get-Process returns no usable result.
// In that case we fall back to scanning known game install roots for the exe
// name — the on-disk file itself isn't protected, only the live process.
function extractIconViaPowerShell(processName) {
    return new Promise((resolve) => {
        const baseName = processName.replace(/\.exe$/i, '').replace(/'/g, "''");
        const exeName = processName.replace(/'/g, "''");
        const script = `
            $ErrorActionPreference='SilentlyContinue'
            # Suppress progress events: when PS runs headless (no console host),
            # module-autoload progress gets serialized to stdout as CLIXML and
            # pollutes the marker line the JS side parses.
            $ProgressPreference='SilentlyContinue'
            Add-Type -AssemblyName System.Drawing

            $path = $null
            $proc = Get-Process -Name '${baseName}' | Where-Object {$_.Path} | Select-Object -First 1
            if ($proc) { $path = $proc.Path }

            if (!$path) {
                $exe = '${exeName}'
                $roots = @(
                    "$env:ProgramFiles\\EA Games",
                    "$env:ProgramFiles\\Epic Games",
                    "$env:ProgramFiles\\Riot Games",
                    "$env:ProgramFiles\\Rockstar Games",
                    "$env:ProgramFiles\\WindowsApps",
                    "\${env:ProgramFiles(x86)}\\Origin Games",
                    "\${env:ProgramFiles(x86)}\\Steam\\steamapps\\common",
                    "\${env:ProgramFiles(x86)}\\Battle.net",
                    "\${env:ProgramFiles(x86)}\\Ubisoft\\Ubisoft Game Launcher\\games",
                    "$env:LOCALAPPDATA\\Programs"
                )
                foreach ($root in $roots) {
                    if (!(Test-Path -LiteralPath $root)) { continue }
                    $found = Get-ChildItem -LiteralPath $root -Filter $exe -Recurse -Depth 4 -File -Force -ErrorAction SilentlyContinue | Select-Object -First 1
                    if ($found) { $path = $found.FullName; break }
                }
            }

            if (!$path) { Write-Output 'NOPATH'; exit }
            try {
                $icon = [System.Drawing.Icon]::ExtractAssociatedIcon($path)
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
            // Defensive parser: even with $ProgressPreference suppressed, some
            // PS hosts still emit a CLIXML preamble. Find the OK:/NO*/ERR:
            // marker on its own line instead of relying on startsWith.
            const out = stdout.trim();
            const okMatch = out.match(/(?:^|\n)OK:([A-Za-z0-9+/=]+)\s*$/);
            if (okMatch) {
                resolve({ ok: true, dataUri: 'data:image/png;base64,' + okMatch[1] });
            } else {
                const reasonMatch = out.match(/(?:^|\n)(NOPATH|NOICON|ERR:.*?)\s*$/);
                resolve({ ok: false, reason: reasonMatch ? reasonMatch[1] : (out || 'empty') });
            }
        });
    });
}

async function extractIcon(processName) {
    // Successful extractions are cached for the lifetime of the process —
    // they don't change, and re-extraction costs a PowerShell spawn.
    if (iconCache.has(processName)) return iconCache.get(processName);

    // Failures get a cooldown rather than a permanent marker, so an
    // anti-cheat-protected game can pick up its icon later (e.g. after the
    // install-dir scan finds it) without needing an Electron restart.
    const lastFail = iconFailures.get(processName);
    if (lastFail && Date.now() - lastFail < ICON_FAILURE_RETRY_MS) return null;

    const result = await extractIconViaPowerShell(processName);
    if (!result.ok) {
        console.warn('[gameDetection] icon extraction failed for', processName, '→', result.reason);
        iconFailures.set(processName, Date.now());
        return null;
    }
    console.log('[gameDetection] extracted icon for', processName, '→', result.dataUri.length, 'bytes');
    iconFailures.delete(processName);
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