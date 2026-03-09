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