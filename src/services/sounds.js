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

export function playMessageSound() {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
}