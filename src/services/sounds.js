const joinSound = new Audio('/sounds/voice-join.wav');
const leaveSound = new Audio('/sounds/voice-leave.wav');

export function playJoinSound() {
    joinSound.currentTime = 0;
    joinSound.volume = 0.5;
    joinSound.play();
}

export function playLeaveSound() {
    leaveSound.currentTime = 0;
    leaveSound.volume = 0.5;
    leaveSound.play();
}

export function playMessageSound() {
    const ctx = new AudioContext();

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