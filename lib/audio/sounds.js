// Sound Effects Manager
// Uses Web Audio API for satisfying game sounds

let audioContext = null;
let soundsEnabled = true;

/**
 * Initialize audio context (must be called after user interaction)
 */
export function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

/**
 * Toggle sounds on/off
 */
export function toggleSounds() {
    soundsEnabled = !soundsEnabled;
    return soundsEnabled;
}

/**
 * Play a simple tone
 */
function playTone(frequency, duration = 0.1, type = 'sine', volume = 0.3) {
    if (!soundsEnabled || !audioContext) return;

    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
        // Audio not available
    }
}

/**
 * Play noise burst (for explosions)
 */
function playNoise(duration = 0.2, volume = 0.5) {
    if (!soundsEnabled || !audioContext) return;

    try {
        const bufferSize = audioContext.sampleRate * duration;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const noise = audioContext.createBufferSource();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();

        noise.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);

        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        noise.start();
    } catch (e) {
        // Audio not available
    }
}

// ============================================
// GAME SOUNDS
// ============================================

/**
 * Object spawn sound - soft pop
 */
export function playSpawnSound() {
    playTone(400, 0.08, 'sine', 0.2);
    setTimeout(() => playTone(600, 0.05, 'sine', 0.15), 30);
}

/**
 * Collision sound - thump based on impact force
 */
export function playCollisionSound(impactForce = 1) {
    const volume = Math.min(0.4, impactForce * 0.1);
    const frequency = 100 + Math.random() * 50;
    playTone(frequency, 0.1, 'triangle', volume);
}

/**
 * Explosion sound - dramatic boom
 */
export function playExplosionSound(intensity = 1) {
    playNoise(0.3 * intensity, 0.6);
    playTone(60, 0.2, 'sawtooth', 0.4);
    setTimeout(() => playTone(40, 0.3, 'sine', 0.3), 50);
}

/**
 * Balloon pop sound
 */
export function playPopSound() {
    playNoise(0.05, 0.3);
    playTone(800, 0.05, 'square', 0.2);
}

/**
 * Gravity flip sound - whoosh
 */
export function playGravityFlipSound() {
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            playTone(200 + i * 100, 0.1, 'sine', 0.15);
        }, i * 40);
    }
}

/**
 * Black hole sound - ominous drone
 */
export function playBlackHoleSound() {
    playTone(50, 0.5, 'sawtooth', 0.3);
    playTone(55, 0.5, 'sawtooth', 0.25);
    setTimeout(() => playTone(100, 0.3, 'sine', 0.2), 300);
}

/**
 * Time slow sound - descending tone
 */
export function playTimeSlowSound() {
    for (let i = 0; i < 8; i++) {
        setTimeout(() => {
            playTone(600 - i * 60, 0.15, 'sine', 0.2);
        }, i * 60);
    }
}

/**
 * Chaos mode activated sound
 */
export function playChaosSound() {
    playTone(200, 0.1, 'square', 0.3);
    setTimeout(() => playTone(300, 0.1, 'square', 0.3), 100);
    setTimeout(() => playTone(400, 0.1, 'square', 0.3), 200);
    setTimeout(() => playTone(600, 0.2, 'square', 0.4), 300);
}

/**
 * Anvil drop sound - heavy clang
 */
export function playAnvilSound() {
    playTone(80, 0.3, 'triangle', 0.5);
    playNoise(0.1, 0.3);
}

/**
 * Ragdoll sound - silly boing
 */
export function playBoingSound() {
    playTone(300, 0.1, 'sine', 0.2);
    setTimeout(() => playTone(400, 0.1, 'sine', 0.2), 50);
    setTimeout(() => playTone(350, 0.15, 'sine', 0.15), 100);
}

/**
 * UI click sound
 */
export function playClickSound() {
    playTone(800, 0.03, 'sine', 0.15);
}

/**
 * Rule change sound - alert
 */
export function playRuleChangeSound() {
    playTone(500, 0.1, 'square', 0.2);
    setTimeout(() => playTone(700, 0.15, 'square', 0.25), 100);
}
