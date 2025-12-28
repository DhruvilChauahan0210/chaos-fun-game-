// Tool implementations with visual effects
import Matter from 'matter-js';
import { TOOLS, CANVAS } from '../constants';
import { flipGravity, getAllBodies, applyForce, scaleBody, getBodyAtPosition, addBody, removeBody } from './engine';
import { createObject } from './objects';

const { Body, Vector } = Matter;

/**
 * Apply push force at position with visual feedback
 */
export function toolPush(position, direction, force = TOOLS.PUSH.force) {
    const bodies = getAllBodies();
    const radius = 120;
    let affectedCount = 0;

    bodies.forEach((body) => {
        if (body.isStatic) return;

        const distance = Vector.magnitude(Vector.sub(body.position, position));
        if (distance < radius) {
            const falloff = 1 - distance / radius;
            const pushForce = {
                x: direction.x * force * falloff * 1.5,
                y: direction.y * force * falloff * 1.5,
            };
            applyForce(body, pushForce);
            affectedCount++;
        }
    });

    // Visual feedback
    if (affectedCount > 0) {
        if (window.spawnParticles) {
            window.spawnParticles(position.x, position.y, 8, '#6c5ce7');
        }
        if (window.triggerScreenShake) {
            window.triggerScreenShake(0.2);
        }
    }

    return { position, direction, force, affectedCount };
}

/**
 * Explode at position with visual effects
 */
export function toolExplode(position, force = TOOLS.EXPLODE.force, radius = TOOLS.EXPLODE.radius) {
    const bodies = getAllBodies();
    let affectedCount = 0;

    bodies.forEach((body) => {
        if (body.isStatic) return;

        const direction = Vector.sub(body.position, position);
        const distance = Vector.magnitude(direction);

        if (distance < radius && distance > 0) {
            const falloff = 1 - distance / radius;
            const normalizedDir = Vector.normalise(direction);
            const explosionForce = {
                x: normalizedDir.x * force * falloff * 1.2,
                y: normalizedDir.y * force * falloff * 1.2,
            };
            applyForce(body, explosionForce);
            Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.8 * falloff);
            affectedCount++;
        }
    });

    // Visual feedback - always show explosion
    if (window.spawnParticles) {
        window.spawnParticles(position.x, position.y, 25, '#ff6b6b');
    }
    if (window.triggerScreenShake) {
        window.triggerScreenShake(1.2);
    }

    return { position, force, radius, affectedCount };
}

/**
 * Flip world gravity with visual feedback
 */
export function toolGravityFlip() {
    const newGravity = flipGravity();

    // Visual feedback
    if (window.triggerScreenShake) {
        window.triggerScreenShake(0.8);
    }
    if (window.showChaosStatus) {
        window.showChaosStatus(newGravity.y < 0 ? '⬆️ GRAVITY UP!' : '⬇️ GRAVITY DOWN!');
    }
    if (window.spawnParticles) {
        window.spawnParticles(CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2, 15, '#ffeaa7');
    }

    return newGravity;
}

/**
 * Scale object at position with visual feedback
 */
export function toolScale(position, grow = true) {
    const body = getBodyAtPosition(position);

    if (body && !body.isStatic) {
        const factor = grow ? TOOLS.SCALE.scaleFactor : 1 / TOOLS.SCALE.scaleFactor;
        const currentScale = body.customScale || 1;
        const newScale = currentScale * factor;

        if (newScale >= 0.3 && newScale <= 3) {
            scaleBody(body, factor, factor);
            body.customScale = newScale;

            // Visual feedback
            if (window.spawnParticles) {
                window.spawnParticles(body.position.x, body.position.y, 8, grow ? '#00cec9' : '#ff9ff3');
            }

            return { bodyId: body.customId, scale: newScale, grow };
        }
    }

    return null;
}

/**
 * Spawn object at position with visual feedback
 */
export function toolSpawn(type, position, options = {}) {
    const body = createObject(type, position.x, position.y, options);
    addBody(body);

    // Visual feedback
    if (window.spawnParticles) {
        const color = body.render?.fillStyle || '#4ecdc4';
        window.spawnParticles(position.x, position.y, 5, color);
    }

    return {
        type,
        position,
        id: body.customId,
    };
}

/**
 * Trigger explosion for explosive objects on collision
 */
export function handleExplosiveCollision(bodyA, bodyB) {
    const explosive = bodyA.isExplosive ? bodyA : bodyB.isExplosive ? bodyB : null;

    if (explosive) {
        const relativeVelocity = Vector.sub(bodyA.velocity, bodyB.velocity);
        const impactForce = Vector.magnitude(relativeVelocity);

        if (impactForce > 5) {
            const pos = { ...explosive.position };

            toolExplode(
                pos,
                explosive.explosionForce || TOOLS.EXPLODE.force,
                explosive.explosionRadius || TOOLS.EXPLODE.radius
            );

            removeBody(explosive);

            // Extra visual feedback for chain explosions
            if (window.spawnParticles) {
                window.spawnParticles(pos.x, pos.y, 30, '#ff4757');
            }

            return {
                position: pos,
                force: explosive.explosionForce,
                radius: explosive.explosionRadius,
            };
        }
    }

    return null;
}

/**
 * Apply upward force to floaty objects (balloons)
 */
export function updateFloatyObjects() {
    const bodies = getAllBodies();

    bodies.forEach((body) => {
        if (body.isFloaty && !body.isStatic) {
            applyForce(body, { x: 0, y: -0.00015 });
            // Add slight wobble
            if (Math.random() < 0.1) {
                applyForce(body, { x: (Math.random() - 0.5) * 0.0001, y: 0 });
            }
        }
    });
}

/**
 * Get tool by ID
 */
export function getTool(toolId) {
    return Object.values(TOOLS).find((tool) => tool.id === toolId);
}

/**
 * Execute tool action with visual effects
 */
export function executeTool(toolId, params) {
    switch (toolId) {
        case 'spawn':
            return toolSpawn(params.objectType || 'box', params.position);
        case 'push':
            return toolPush(params.position, params.direction || { x: 0, y: -1 });
        case 'explode':
            return toolExplode(params.position);
        case 'gravity':
            return toolGravityFlip();
        case 'scale':
            return toolScale(params.position, params.grow);
        default:
            return null;
    }
}
