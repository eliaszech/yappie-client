// Sounds are generated on demand via Web Audio so we ship no audio assets and
// can tweak timbre/pitch without re-encoding files.

let sharedCtx = null;
function getCtx() {
    if (sharedCtx && sharedCtx.state !== 'closed') return sharedCtx;
    sharedCtx = new (window.AudioContext || window.webkitAudioContext)();
    return sharedCtx;
}

// Plays a quick sine "blip" with a short attack and exponential release. The
// short attack avoids the click you get from instantly opening the gain.
function blip(ctx, freq, startTime, duration, peak = 0.18) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(peak, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
}

// Major-triad sweep — pleasant "someone arrived" feel without being chirpy.
export function playJoinSound() {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const t = ctx.currentTime;
    blip(ctx, 523.25, t,        0.15);  // C5
    blip(ctx, 659.25, t + 0.07, 0.16);  // E5
    blip(ctx, 783.99, t + 0.14, 0.22);  // G5
}

// Same triad in reverse — soft "someone left" cue.
export function playLeaveSound() {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const t = ctx.currentTime;
    blip(ctx, 659.25, t,        0.14);  // E5
    blip(ctx, 523.25, t + 0.07, 0.16);  // C5
    blip(ctx, 392.00, t + 0.14, 0.22);  // G4
}

// Weicher Sinus-Ton mit dezenter Sub-Oktav-Schicht für Wärme. Längerer Attack
// vermeidet Click, langes exponentielles Decay lässt den Ton sanft ausschweben.
function softTone(ctx, freq, startTime, duration, peak = 0.11) {
    const main = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const gain = ctx.createGain();
    const subGain = ctx.createGain();

    main.type = 'sine';
    main.frequency.value = freq;
    sub.type = 'sine';
    sub.frequency.value = freq / 2;
    subGain.gain.value = 0.35;

    main.connect(gain);
    sub.connect(subGain);
    subGain.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(peak, startTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    main.start(startTime);
    main.stop(startTime + duration + 0.05);
    sub.start(startTime);
    sub.stop(startTime + duration + 0.05);
}

// Zwei sanfte Töne mit kleiner Terz aufwärts (F5 → A5) — wirkt warm und
// gemütlich, kein hartes "Notification!"-Gefühl. Beide schweben länger aus.
export function playMessageSound() {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const t = ctx.currentTime;

    softTone(ctx, 698.46, t,         0.45, 0.10);  // F5
    softTone(ctx, 880,    t + 0.11,  0.55, 0.11);  // A5
}

// Mute toggle cues: zwei schnelle Blips. Hoch→tief = aus (mute on),
// tief→hoch = an (mute off). Kurz und dezent, damit man sie auch oft hören kann.
export function playMuteOnSound() {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const t = ctx.currentTime;
    blip(ctx, 660, t,        0.08, 0.16);  // E5
    blip(ctx, 440, t + 0.05, 0.10, 0.16);  // A4
}

export function playMuteOffSound() {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const t = ctx.currentTime;
    blip(ctx, 440, t,        0.08, 0.16);  // A4
    blip(ctx, 660, t + 0.05, 0.10, 0.16);  // E5
}

// Deafen klingt fülliger und tiefer (Kopfhörer-aus-Gefühl) — gleicher
// Richtungs-Code wie Mute (runter = aus, hoch = an).
export function playDeafenOnSound() {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const t = ctx.currentTime;
    softTone(ctx, 392.00, t,        0.18, 0.10);  // G4
    softTone(ctx, 261.63, t + 0.08, 0.22, 0.10);  // C4
}

export function playDeafenOffSound() {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const t = ctx.currentTime;
    softTone(ctx, 261.63, t,        0.18, 0.10);  // C4
    softTone(ctx, 392.00, t + 0.08, 0.22, 0.10);  // G4
}