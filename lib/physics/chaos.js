// Chaos Mode Manager - The Fun Part!
import { toolExplode, toolSpawn, toolGravityFlip } from './tools';
import { getAllBodies, getGravity, setGravity, applyForce, removeBody } from './engine';
import { getRandomObjectType, createObject } from './objects';
import { CANVAS, OBJECTS } from '../constants';
import Matter from 'matter-js';

const { Body, Vector } = Matter;

// Chaos state
let chaosEnabled = false;
let objectFloodEnabled = false;
let suddenRulesEnabled = false;
let autoExplodeEnabled = false;

let floodInterval = null;
let rulesInterval = null;
let explosionCheckInterval = null;

let screenShakeCallback = null;
let particleCallback = null;
let statusCallback = null;

// Effects
let currentRule = null;
const RULES = [
    { name: '🔄 GRAVITY FLIP!', action: () => { const g = getGravity(); setGravity({ x: g.x, y: -g.y }); } },
    { name: '🌀 SIDEWAYS GRAVITY!', action: () => setGravity({ x: 1, y: 0.2 }) },
    { name: '🪐 LOW GRAVITY!', action: () => setGravity({ x: 0, y: 0.2 }) },
    { name: '💪 HEAVY GRAVITY!', action: () => setGravity({ x: 0, y: 3 }) },
    { name: '🌪️ CHAOS SPIN!', action: spinAllObjects },
    { name: '💥 EVERYTHING EXPLODES!', action: explodeRandomObject },
    { name: '🎈 FLOATY TIME!', action: makeEverythingFloaty },
    { name: '🏀 SUPER BOUNCY!', action: makeEverythingBouncy },
    { name: '🧊 FRICTION OFF!', action: removeFriction },
    { name: '⬆️ LAUNCH PARTY!', action: launchEverythingUp },
];

/**
 * Register callbacks for effects
 */
export function registerEffectCallbacks(onShake, onParticle, onStatus) {
    screenShakeCallback = onShake;
    particleCallback = onParticle;
    statusCallback = onStatus;
}

/**
 * Trigger screen shake
 */
export function triggerScreenShake(intensity = 1) {
    if (screenShakeCallback) {
        screenShakeCallback(intensity);
    }
}

/**
 * Show status message
 */
function showStatus(message) {
    if (statusCallback) {
        statusCallback(message);
    }
}

/**
 * Spawn particles at position
 */
export function spawnParticles(x, y, count = 10, color = '#ff6b6b') {
    if (particleCallback) {
        particleCallback(x, y, count, color);
    }
}

// ============================================
// OBJECT FLOOD MODE
// ============================================

/**
 * Start object flood - random objects rain from sky
 */
export function startObjectFlood(intensity = 5, intervalMs = 2000) {
    if (floodInterval) clearInterval(floodInterval);

    objectFloodEnabled = true;
    showStatus('🌊 OBJECT FLOOD ACTIVATED!');

    floodInterval = setInterval(() => {
        for (let i = 0; i < intensity; i++) {
            // Spawn at visible position near top (y=50-80)
            const x = 50 + Math.random() * (CANVAS.WIDTH - 100);
            const y = 50 + Math.random() * 30;
            const type = getRandomObjectType();

            const result = toolSpawn(type, { x, y });

            // Add random initial velocity for chaos
            const bodies = getAllBodies();
            const newBody = bodies.find(b => b.customId === result.id);
            if (newBody) {
                Body.setVelocity(newBody, {
                    x: (Math.random() - 0.5) * 12,
                    y: 3 + Math.random() * 8,
                });
                Body.setAngularVelocity(newBody, (Math.random() - 0.5) * 0.5);
            }
        }
    }, intervalMs);
}

/**
 * Stop object flood
 */
export function stopObjectFlood() {
    if (floodInterval) {
        clearInterval(floodInterval);
        floodInterval = null;
    }
    objectFloodEnabled = false;
}

// ============================================
// SUDDEN RULES MODE
// ============================================

/**
 * Start sudden rules - physics changes every N seconds
 */
export function startSuddenRules(intervalMs = 10000) {
    if (rulesInterval) clearInterval(rulesInterval);

    suddenRulesEnabled = true;
    showStatus('🎲 SUDDEN RULES MODE!');

    // Apply first rule immediately
    applyRandomRule();

    rulesInterval = setInterval(() => {
        applyRandomRule();
        triggerScreenShake(0.5);
    }, intervalMs);
}

/**
 * Apply a random physics rule
 */
function applyRandomRule() {
    const rule = RULES[Math.floor(Math.random() * RULES.length)];
    currentRule = rule;
    showStatus(rule.name);
    rule.action();
}

/**
 * Stop sudden rules
 */
export function stopSuddenRules() {
    if (rulesInterval) {
        clearInterval(rulesInterval);
        rulesInterval = null;
    }
    suddenRulesEnabled = false;
    // Reset gravity to normal
    setGravity({ x: 0, y: 1 });
}

// ============================================
// CHAIN REACTION EXPLOSIONS
// ============================================

/**
 * Start checking for explosive chain reactions
 */
export function startExplosionChain() {
    if (explosionCheckInterval) clearInterval(explosionCheckInterval);

    autoExplodeEnabled = true;

    explosionCheckInterval = setInterval(() => {
        const bodies = getAllBodies();

        bodies.forEach(body => {
            if (body.isExplosive && !body.isStatic) {
                // Check velocity - explode on high velocity impact
                const speed = Vector.magnitude(body.velocity);
                if (speed > 15) {
                    explodeBody(body);
                }
            }
        });
    }, 100);
}

/**
 * Explode a specific body with full effects
 */
export function explodeBody(body) {
    const pos = body.position;
    const force = body.explosionForce || 0.5;
    const radius = body.explosionRadius || 200;

    // Visual effects
    triggerScreenShake(force * 2);
    spawnParticles(pos.x, pos.y, 20, '#ff4757');

    // Apply explosion force
    toolExplode(pos, force, radius);

    // Remove the explosive
    removeBody(body);

    // Chain reaction - check for nearby explosives after a delay
    setTimeout(() => {
        const nearbyBodies = getAllBodies();
        nearbyBodies.forEach(other => {
            if (other.isExplosive && !other.isStatic) {
                const dist = Vector.magnitude(Vector.sub(other.position, pos));
                if (dist < radius * 0.8) {
                    // Trigger chain explosion!
                    setTimeout(() => explodeBody(other), 100 + Math.random() * 200);
                }
            }
        });
    }, 50);
}

/**
 * Stop explosion chain checking
 */
export function stopExplosionChain() {
    if (explosionCheckInterval) {
        clearInterval(explosionCheckInterval);
        explosionCheckInterval = null;
    }
    autoExplodeEnabled = false;
}

// ============================================
// RULE ACTIONS
// ============================================

function spinAllObjects() {
    const bodies = getAllBodies();
    bodies.forEach(body => {
        if (!body.isStatic) {
            Body.setAngularVelocity(body, (Math.random() - 0.5) * 1);
        }
    });
}

function explodeRandomObject() {
    const bodies = getAllBodies().filter(b => !b.isStatic);
    if (bodies.length > 0) {
        const randomBody = bodies[Math.floor(Math.random() * bodies.length)];
        toolExplode(randomBody.position, 0.3, 150);
        triggerScreenShake(1);
        spawnParticles(randomBody.position.x, randomBody.position.y, 15, '#ffeaa7');
    }
}

function makeEverythingFloaty() {
    const bodies = getAllBodies();
    bodies.forEach(body => {
        if (!body.isStatic) {
            applyForce(body, { x: 0, y: -0.01 });
        }
    });
}

function makeEverythingBouncy() {
    const bodies = getAllBodies();
    bodies.forEach(body => {
        if (!body.isStatic) {
            body.restitution = 0.95;
        }
    });
}

function removeFriction() {
    const bodies = getAllBodies();
    bodies.forEach(body => {
        if (!body.isStatic) {
            body.friction = 0;
            body.frictionAir = 0;
        }
    });
}

function launchEverythingUp() {
    const bodies = getAllBodies();
    bodies.forEach(body => {
        if (!body.isStatic) {
            Body.setVelocity(body, { x: body.velocity.x, y: -15 - Math.random() * 10 });
        }
    });
    triggerScreenShake(1.5);
}

// ============================================
// MASTER CHAOS TOGGLE
// ============================================

/**
 * Enable all chaos features
 */
export function enableChaos() {
    chaosEnabled = true;
    startObjectFlood(3, 3000);
    startSuddenRules(12000);
    startExplosionChain();
    showStatus('🔥 CHAOS MODE ENABLED!');
}

/**
 * Disable all chaos features
 */
export function disableChaos() {
    chaosEnabled = false;
    stopObjectFlood();
    stopSuddenRules();
    stopExplosionChain();
    showStatus('Chaos disabled');
}

/**
 * Toggle chaos mode
 */
export function toggleChaos() {
    if (chaosEnabled) {
        disableChaos();
    } else {
        enableChaos();
    }
    return chaosEnabled;
}

/**
 * Check if chaos is enabled
 */
export function isChaosEnabled() {
    return chaosEnabled;
}

/**
 * Get current chaos state
 */
export function getChaosState() {
    return {
        chaos: chaosEnabled,
        flood: objectFloodEnabled,
        rules: suddenRulesEnabled,
        explosions: autoExplodeEnabled,
        currentRule: currentRule?.name,
    };
}

/**
 * Spawn a bunch of explosives - DRAMATIC BOMB RAIN!
 */
export function spawnExplosiveRain(count = 10) {
    showStatus('💣 EXPLOSIVE RAIN!');
    triggerScreenShake(0.5);

    for (let i = 0; i < count; i++) {
        // Stagger the spawning for dramatic effect
        setTimeout(() => {
            const x = 100 + Math.random() * (CANVAS.WIDTH - 200);
            const y = 50; // Start visible at top
            const result = toolSpawn('explosive', { x, y });

            // Give them downward velocity
            const bodies = getAllBodies();
            const bomb = bodies.find(b => b.customId === result.id);
            if (bomb) {
                Body.setVelocity(bomb, {
                    x: (Math.random() - 0.5) * 8,
                    y: 5 + Math.random() * 8
                });
                Body.setAngularVelocity(bomb, (Math.random() - 0.5) * 0.2);
            }
        }, i * 100);
    }
}

/**
 * Create a mega explosion at center - MASSIVE BOOM!
 */
export function megaExplosion() {
    const center = { x: CANVAS.WIDTH / 2, y: CANVAS.HEIGHT / 2 };

    // Triple explosion for drama!
    toolExplode(center, 1.5, 600);
    triggerScreenShake(5); // MASSIVE shake

    // Multiple particle bursts
    spawnParticles(center.x, center.y, 60, '#ff6b6b');
    setTimeout(() => {
        spawnParticles(center.x, center.y, 40, '#ffeaa7');
        triggerScreenShake(2);
    }, 100);
    setTimeout(() => {
        spawnParticles(center.x, center.y, 30, '#ff9ff3');
    }, 200);

    showStatus('💥💥 MEGA EXPLOSION!!! 💥💥');
}

/**
 * Spawn balloon party - BALLOONS FLOAT UP!
 */
export function balloonParty(count = 20) {
    showStatus('🎈 BALLOON PARTY!');

    for (let i = 0; i < count; i++) {
        // Stagger for wave effect
        setTimeout(() => {
            const x = 50 + Math.random() * (CANVAS.WIDTH - 100);
            const y = CANVAS.HEIGHT - 100; // Start visible near bottom
            const result = toolSpawn('balloon', { x, y });

            const bodies = getAllBodies();
            const balloon = bodies.find(b => b.customId === result.id);
            if (balloon) {
                // Strong upward velocity!
                Body.setVelocity(balloon, {
                    x: (Math.random() - 0.5) * 8,
                    y: -12 - Math.random() * 8
                });
            }
        }, i * 80);
    }
}

/**
 * Anvil drop from sky - SLAM DOWN!
 */
export function anvilDrop(count = 5) {
    showStatus('🔨 ANVIL DROP!');
    triggerScreenShake(0.6);

    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const x = 100 + Math.random() * (CANVAS.WIDTH - 200);
            const y = 50; // Start visible at top
            const result = toolSpawn('anvil', { x, y });

            // Give them downward velocity for dramatic impact
            const bodies = getAllBodies();
            const anvil = bodies.find(b => b.customId === result.id);
            if (anvil) {
                Body.setVelocity(anvil, {
                    x: (Math.random() - 0.5) * 3,
                    y: 10 + Math.random() * 5
                });
            }

            triggerScreenShake(0.8);
        }, i * 400);
    }
}

