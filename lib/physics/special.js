// Special Objects - Black Holes, Ragdolls, Magnets, Time Control
// Using direct Matter.js access for reliable physics manipulation
import Matter from 'matter-js';
import { CANVAS } from '../constants';
import { getEngine } from './engine';

const { Bodies, Body, Constraint, Vector, World, Composite } = Matter;

let objectIdCounter = 0;
function generateId() {
    return `special_${Date.now()}_${objectIdCounter++}`;
}

// Helper to get world from engine
function getWorld() {
    const engine = getEngine();
    return engine ? engine.world : null;
}

// Helper to get all bodies
function getAllBodiesInternal() {
    const engine = getEngine();
    if (!engine) return [];
    return Composite.allBodies(engine.world);
}

// Helper to add body
function addBodyInternal(body) {
    const world = getWorld();
    if (world && body) {
        World.add(world, body);
        return true;
    }
    return false;
}

// Helper to remove body
function removeBodyInternal(body) {
    const world = getWorld();
    if (world && body) {
        World.remove(world, body);
    }
}

// ============================================
// BLACK HOLE
// ============================================

let activeBlackHoles = [];

/**
 * Create a black hole that TRULY sucks in nearby objects
 */
export function createBlackHole(x, y, options = {}) {
    const world = getWorld();
    if (!world) {
        console.error('Black hole: No physics world available');
        return null;
    }

    const radius = options.radius || 40;
    const pullRadius = options.pullRadius || 350;
    const pullStrength = options.pullStrength || 0.008; // Much stronger pull!
    const lifetime = options.lifetime || 6000;

    const body = Bodies.circle(x, y, radius, {
        isStatic: true,
        isSensor: true,
        render: {
            fillStyle: '#0a0a1a',
            strokeStyle: '#9b59b6',
            lineWidth: 10,
        },
        label: 'blackhole',
        customId: generateId(),
    });

    World.add(world, body);

    const blackHole = {
        body,
        pullRadius,
        pullStrength,
        createdAt: Date.now(),
        lifetime,
        x,
        y,
        consumedBodies: [], // Track bodies that got sucked in
        eventHorizon: 60, // Distance at which objects get consumed
    };

    activeBlackHoles.push(blackHole);

    // Status
    if (window.showChaosStatus) {
        window.showChaosStatus('🕳️ BLACK HOLE SPAWNED!');
    }
    if (window.triggerScreenShake) {
        window.triggerScreenShake(0.8);
    }
    if (window.spawnParticles) {
        window.spawnParticles(x, y, 30, '#9b59b6');
    }

    // Explode at end of lifetime
    setTimeout(() => {
        explodeBlackHole(blackHole);
    }, lifetime);

    return blackHole;
}

/**
 * Update all black holes - POWERFUL gravitational pull!
 * Uses direct velocity manipulation for visible effect
 */
export function updateBlackHoles() {
    const now = Date.now();
    const bodies = getAllBodiesInternal();

    if (!bodies.length) return;

    activeBlackHoles = activeBlackHoles.filter((bh) => {
        if (!bh.body || !bh.body.position) return false;

        // Check if lifetime expired - if so, explode it!
        if (now - bh.createdAt > bh.lifetime) {
            explodeBlackHole(bh);
            return false;
        }

        const bhPos = bh.body.position;

        // Apply POWERFUL gravitational pull to ALL objects!
        bodies.forEach((body) => {
            // Skip static objects and other special objects, but NOT ragdoll parts
            if (body.isStatic || body.label === 'blackhole') return;

            const direction = Vector.sub(bhPos, body.position);
            const distance = Vector.magnitude(direction);

            // Skip if already at center
            if (distance < 20) {
                // Objects at center get frozen in place
                Body.setVelocity(body, { x: 0, y: 0 });
                if (!bh.consumedBodies.includes(body)) {
                    bh.consumedBodies.push(body);
                }
                return;
            }

            const normalizedDir = Vector.normalise(direction);

            // MUCH STRONGER PULL - directly add velocity toward black hole!
            // Closer = faster pull
            const pullStrength = Math.min(8, 400 / distance); // Max speed of 8, stronger when closer

            // Get current velocity
            const vel = body.velocity;

            // Add velocity toward the black hole
            const newVelX = vel.x + normalizedDir.x * pullStrength * 0.3;
            const newVelY = vel.y + normalizedDir.y * pullStrength * 0.3;

            Body.setVelocity(body, {
                x: newVelX,
                y: newVelY,
            });

            // Track objects that get very close for the explosion
            if (distance < 80 && !bh.consumedBodies.includes(body)) {
                bh.consumedBodies.push(body);
            }

            // Add spin as objects get sucked in
            if (distance < 250) {
                Body.setAngularVelocity(body, body.angularVelocity + (Math.random() - 0.5) * 0.15);
            }
        });

        return true;
    });
}

/**
 * Explode a black hole - CHAOTIC EXPLOSION!
 */
function explodeBlackHole(blackHole) {
    if (!blackHole.body) return;

    const pos = { x: blackHole.x, y: blackHole.y };
    const bodies = getAllBodiesInternal();

    // CHAOTIC EXPLOSION - throw everything violently in random directions!
    bodies.forEach((body) => {
        if (body.isStatic || body.label === 'blackhole') return;

        const wasConsumed = blackHole.consumedBodies.includes(body);

        // Random explosion angle for true chaos
        const randomAngle = Math.random() * Math.PI * 2;
        const randomDir = {
            x: Math.cos(randomAngle),
            y: Math.sin(randomAngle),
        };

        const direction = Vector.sub(body.position, pos);
        const distance = Vector.magnitude(direction);

        if (wasConsumed || distance < blackHole.pullRadius * 2) {
            // Consumed objects explode with MAXIMUM chaos
            const explosionPower = wasConsumed ? 0.25 : 0.15 * (1 - distance / (blackHole.pullRadius * 2));

            // Mix random direction with outward direction for semi-random explosion
            const outwardDir = distance > 0 ? Vector.normalise(direction) : randomDir;
            const chaosDir = {
                x: outwardDir.x * 0.3 + randomDir.x * 0.7,
                y: outwardDir.y * 0.3 + randomDir.y * 0.7,
            };

            Body.applyForce(body, body.position, {
                x: chaosDir.x * explosionPower,
                y: chaosDir.y * explosionPower,
            });

            // WILD spinning
            Body.setAngularVelocity(body, (Math.random() - 0.5) * 4);

            // If consumed, scatter them around the explosion point first
            if (wasConsumed) {
                const scatterDist = 50 + Math.random() * 100;
                Body.setPosition(body, {
                    x: pos.x + randomDir.x * scatterDist,
                    y: pos.y + randomDir.y * scatterDist,
                });

                // Give them a massive velocity boost too
                Body.setVelocity(body, {
                    x: chaosDir.x * 30,
                    y: chaosDir.y * 30,
                });
            }
        }
    });

    // MASSIVE visual feedback
    if (window.triggerScreenShake) {
        window.triggerScreenShake(5);
    }
    if (window.spawnParticles) {
        // Multiple particle bursts for epic explosion
        window.spawnParticles(pos.x, pos.y, 60, '#9b59b6');
        setTimeout(() => window.spawnParticles(pos.x, pos.y, 40, '#e056fd'), 50);
        setTimeout(() => window.spawnParticles(pos.x, pos.y, 30, '#ff6b6b'), 100);
    }
    if (window.showChaosStatus) {
        window.showChaosStatus('💥💥 SUPERNOVA EXPLOSION! 💥💥');
    }

    // Remove the black hole body
    removeBodyInternal(blackHole.body);
    activeBlackHoles = activeBlackHoles.filter((bh) => bh !== blackHole);
}

// ============================================
// RAGDOLL
// ============================================

/**
 * Create a ragdoll stick figure - Properly positioned and falls with gravity!
 */
export function createRagdoll(x, y, scale = 1) {
    const world = getWorld();
    if (!world) {
        console.error('Ragdoll: No physics world available');
        return null;
    }

    const parts = [];

    // Scale factor - keep reasonable size
    const s = scale * 1.5;

    // Position body parts CENTERED around y (not above it)
    // Head at top
    const head = Bodies.circle(x, y - 40 * s, 15 * s, {
        render: {
            fillStyle: '#ffe66d',
            strokeStyle: '#f1c40f',
            lineWidth: 3,
        },
        label: 'ragdoll-head',
        restitution: 0.5,
        friction: 0.4,
        density: 0.001,
    });

    // Torso in middle
    const torso = Bodies.rectangle(x, y, 18 * s, 40 * s, {
        render: {
            fillStyle: '#e74c3c',
            strokeStyle: '#c0392b',
            lineWidth: 2,
        },
        label: 'ragdoll-torso',
        restitution: 0.4,
        friction: 0.4,
        density: 0.001,
    });

    // Arms at shoulder level
    const leftArm = Bodies.rectangle(x - 25 * s, y - 12 * s, 25 * s, 10 * s, {
        render: {
            fillStyle: '#1abc9c',
            strokeStyle: '#16a085',
            lineWidth: 2,
        },
        label: 'ragdoll-arm',
        restitution: 0.4,
        density: 0.001,
    });
    const rightArm = Bodies.rectangle(x + 25 * s, y - 12 * s, 25 * s, 10 * s, {
        render: {
            fillStyle: '#1abc9c',
            strokeStyle: '#16a085',
            lineWidth: 2,
        },
        label: 'ragdoll-arm',
        restitution: 0.4,
        density: 0.001,
    });

    // Legs at bottom
    const leftLeg = Bodies.rectangle(x - 8 * s, y + 35 * s, 10 * s, 35 * s, {
        render: {
            fillStyle: '#9b59b6',
            strokeStyle: '#8e44ad',
            lineWidth: 2,
        },
        label: 'ragdoll-leg',
        restitution: 0.4,
        density: 0.001,
    });
    const rightLeg = Bodies.rectangle(x + 8 * s, y + 35 * s, 10 * s, 35 * s, {
        render: {
            fillStyle: '#9b59b6',
            strokeStyle: '#8e44ad',
            lineWidth: 2,
        },
        label: 'ragdoll-leg',
        restitution: 0.4,
        density: 0.001,
    });

    parts.push(head, torso, leftArm, rightArm, leftLeg, rightLeg);

    // Constraints to connect body parts - looser for floppy ragdoll effect
    const constraints = [
        // Head to torso
        Constraint.create({
            bodyA: head,
            bodyB: torso,
            pointA: { x: 0, y: 15 * s },
            pointB: { x: 0, y: -20 * s },
            stiffness: 0.8,
            length: 2,
            render: { visible: false },
        }),
        // Left arm to torso
        Constraint.create({
            bodyA: leftArm,
            bodyB: torso,
            pointA: { x: 12 * s, y: 0 },
            pointB: { x: -9 * s, y: -15 * s },
            stiffness: 0.5,
            length: 3,
            render: { visible: false },
        }),
        // Right arm to torso
        Constraint.create({
            bodyA: rightArm,
            bodyB: torso,
            pointA: { x: -12 * s, y: 0 },
            pointB: { x: 9 * s, y: -15 * s },
            stiffness: 0.5,
            length: 3,
            render: { visible: false },
        }),
        // Left leg to torso
        Constraint.create({
            bodyA: leftLeg,
            bodyB: torso,
            pointA: { x: 0, y: -17 * s },
            pointB: { x: -5 * s, y: 20 * s },
            stiffness: 0.6,
            length: 2,
            render: { visible: false },
        }),
        // Right leg to torso
        Constraint.create({
            bodyA: rightLeg,
            bodyB: torso,
            pointA: { x: 0, y: -17 * s },
            pointB: { x: 5 * s, y: 20 * s },
            stiffness: 0.6,
            length: 2,
            render: { visible: false },
        }),
    ];

    // Add all to world
    World.add(world, parts);
    World.add(world, constraints);

    // Apply velocity to ALL parts so they fall together!
    const velX = (Math.random() - 0.5) * 8;
    const velY = 8 + Math.random() * 6; // Strong downward velocity
    const angVel = (Math.random() - 0.5) * 0.3;

    parts.forEach(part => {
        Body.setVelocity(part, { x: velX + (Math.random() - 0.5) * 2, y: velY });
        Body.setAngularVelocity(part, angVel + (Math.random() - 0.5) * 0.1);
    });

    return { parts, constraints };
}

/**
 * Spawn multiple ragdolls
 */
export function ragdollRain(count = 5) {
    const world = getWorld();
    if (!world) {
        console.error('Ragdoll rain: No physics world available');
        return;
    }

    if (window.showChaosStatus) {
        window.showChaosStatus('🎭 RAGDOLL RAIN!');
    }
    if (window.triggerScreenShake) {
        window.triggerScreenShake(0.4);
    }

    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const x = 100 + Math.random() * (CANVAS.WIDTH - 200);
            // Spawn at y=150 so entire ragdoll is visible on screen
            createRagdoll(x, 150, 1.0 + Math.random() * 0.3);
        }, i * 200);
    }
}

// ============================================
// TIME CONTROL
// ============================================

let isSlowMo = false;
let isFrozen = false;

/**
 * Toggle slow motion
 */
export function toggleSlowMotion() {
    const engine = getEngine();
    if (!engine) {
        console.error('Time control: No physics engine available');
        return false;
    }

    if (isSlowMo) {
        engine.timing.timeScale = 1;
        isSlowMo = false;
        if (window.showChaosStatus) {
            window.showChaosStatus('⏩ NORMAL SPEED');
        }
    } else {
        engine.timing.timeScale = 0.2;
        isSlowMo = true;
        if (window.showChaosStatus) {
            window.showChaosStatus('⏰ SLOW MOTION!');
        }
    }
    return isSlowMo;
}

/**
 * Toggle freeze
 */
export function toggleFreeze() {
    const engine = getEngine();
    if (!engine) return false;

    if (isFrozen) {
        engine.timing.timeScale = 1;
        isFrozen = false;
        if (window.showChaosStatus) {
            window.showChaosStatus('▶️ UNFROZEN');
        }
    } else {
        engine.timing.timeScale = 0;
        isFrozen = true;
        if (window.showChaosStatus) {
            window.showChaosStatus('⏸️ FROZEN!');
        }
    }
    return isFrozen;
}

/**
 * Dramatic slow-mo for a duration
 */
export function dramaticSlowMo(durationMs = 2000) {
    const engine = getEngine();
    if (!engine) return;

    engine.timing.timeScale = 0.1;
    isSlowMo = true;

    if (window.showChaosStatus) {
        window.showChaosStatus('⏰ DRAMATIC MOMENT...');
    }

    setTimeout(() => {
        const eng = getEngine();
        if (eng) {
            eng.timing.timeScale = 1;
        }
        isSlowMo = false;
    }, durationMs);
}

// ============================================
// MAGNET OBJECTS
// ============================================

let activeMagnets = [];

/**
 * Create a magnet that attracts/repels objects
 */
export function createMagnet(x, y, polarity = 1) {
    const world = getWorld();
    if (!world) {
        console.error('Magnet: No physics world available');
        return null;
    }

    // Make magnet STATIC and BIGGER so it stays in place!
    const body = Bodies.rectangle(x, y, 80, 40, {
        isStatic: true, // IMPORTANT: stays in place!
        render: {
            fillStyle: polarity > 0 ? '#e74c3c' : '#3498db',
            strokeStyle: '#fff',
            lineWidth: 4,
        },
        label: 'magnet',
        customId: generateId(),
    });

    World.add(world, body);

    const magnet = {
        body,
        polarity, // positive = attract, negative = repel
        strength: 0.008, // Much stronger!
        range: 400, // Much larger range!
    };

    activeMagnets.push(magnet);

    if (window.spawnParticles) {
        window.spawnParticles(x, y, 10, polarity > 0 ? '#e74c3c' : '#3498db');
    }

    return magnet;
}

/**
 * Update all magnets - POWERFUL magnetic force!
 * Uses direct velocity manipulation for visible effect
 */
export function updateMagnets() {
    const bodies = getAllBodiesInternal();
    if (!bodies.length) return;

    activeMagnets = activeMagnets.filter((magnet) => {
        if (!magnet.body || !magnet.body.position) return false;

        const magnetPos = magnet.body.position;

        bodies.forEach((body) => {
            // Skip static objects and other magnets, but NOT ragdoll parts
            if (body.isStatic || body.label === 'magnet' || body.label === 'blackhole') return;

            const direction = Vector.sub(magnetPos, body.position);
            const distance = Vector.magnitude(direction);

            if (distance < magnet.range && distance > 30) {
                const normalizedDir = Vector.normalise(direction);

                // MUCH STRONGER - directly modify velocity!
                // Polarity: positive = attract (toward magnet), negative = repel (away from magnet)
                const pullStrength = Math.min(5, 200 / distance) * magnet.polarity;

                // Get current velocity
                const vel = body.velocity;

                // Add velocity toward/away from the magnet
                Body.setVelocity(body, {
                    x: vel.x + normalizedDir.x * pullStrength * 0.25,
                    y: vel.y + normalizedDir.y * pullStrength * 0.25,
                });

                // Add some spin for fun
                Body.setAngularVelocity(body, body.angularVelocity + (Math.random() - 0.5) * 0.1);
            }
        });

        return true;
    });
}

/**
 * Spawn attract and repel magnets
 */
export function magnetMadness() {
    const world = getWorld();
    if (!world) {
        console.error('Magnet madness: No physics world available');
        return;
    }

    createMagnet(150, CANVAS.HEIGHT / 2, 1);  // Left side - attract
    createMagnet(CANVAS.WIDTH - 150, CANVAS.HEIGHT / 2, -1);  // Right side - repel

    if (window.showChaosStatus) {
        window.showChaosStatus('🧲 MAGNET MADNESS!');
    }
    if (window.triggerScreenShake) {
        window.triggerScreenShake(0.4);
    }
}

// Clean up function
export function clearSpecialObjects() {
    const world = getWorld();

    activeBlackHoles.forEach((bh) => {
        if (bh.body && world) {
            World.remove(world, bh.body);
        }
    });
    activeBlackHoles = [];

    activeMagnets.forEach((m) => {
        if (m.body && world) {
            World.remove(world, m.body);
        }
    });
    activeMagnets = [];
}

// Master update - call in game loop
export function updateSpecialObjects() {
    updateBlackHoles();
    updateMagnets();
}
