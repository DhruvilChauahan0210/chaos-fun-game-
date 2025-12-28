// Object creation and management
import Matter from 'matter-js';
import { OBJECTS, COLORS } from '../constants';

const { Bodies, Body } = Matter;

let objectIdCounter = 0;

/**
 * Generate unique object ID
 */
function generateId() {
    return `obj_${Date.now()}_${objectIdCounter++}`;
}

/**
 * Create a box body
 */
export function createBox(x, y, options = {}) {
    const config = { ...OBJECTS.BOX, ...options };
    const body = Bodies.rectangle(x, y, config.width, config.height, {
        friction: config.friction,
        restitution: config.restitution,
        density: config.density,
        render: {
            fillStyle: config.color,
            strokeStyle: '#ffffff22',
            lineWidth: 2,
        },
        label: 'box',
        customId: generateId(),
    });
    return body;
}

/**
 * Create a circle body
 */
export function createCircle(x, y, options = {}) {
    const config = { ...OBJECTS.CIRCLE, ...options };
    const body = Bodies.circle(x, y, config.radius, {
        friction: config.friction,
        restitution: config.restitution,
        density: config.density,
        render: {
            fillStyle: config.color,
            strokeStyle: '#ffffff22',
            lineWidth: 2,
        },
        label: 'circle',
        customId: generateId(),
    });
    return body;
}

/**
 * Create a triangle body
 */
export function createTriangle(x, y, options = {}) {
    const config = { ...OBJECTS.TRIANGLE, ...options };
    const body = Bodies.polygon(x, y, 3, config.size / 2, {
        friction: config.friction,
        restitution: config.restitution,
        density: config.density,
        render: {
            fillStyle: config.color,
            strokeStyle: '#ffffff22',
            lineWidth: 2,
        },
        label: 'triangle',
        customId: generateId(),
    });
    return body;
}

/**
 * Create a plank body
 */
export function createPlank(x, y, options = {}) {
    const config = { ...OBJECTS.PLANK, ...options };
    const body = Bodies.rectangle(x, y, config.width, config.height, {
        friction: config.friction,
        restitution: config.restitution,
        density: config.density,
        render: {
            fillStyle: config.color,
            strokeStyle: '#ffffff22',
            lineWidth: 2,
        },
        label: 'plank',
        customId: generateId(),
    });
    return body;
}

/**
 * Create a balloon body (floaty, light)
 */
export function createBalloon(x, y, options = {}) {
    const config = { ...OBJECTS.BALLOON, ...options };
    const body = Bodies.circle(x, y, config.radius, {
        friction: config.friction,
        restitution: config.restitution,
        density: config.density,
        render: {
            fillStyle: config.color,
            strokeStyle: '#ffffff44',
            lineWidth: 3,
        },
        label: 'balloon',
        customId: generateId(),
        isFloaty: true,
    });
    return body;
}

/**
 * Create an explosive barrel
 */
export function createExplosive(x, y, options = {}) {
    const config = { ...OBJECTS.EXPLOSIVE, ...options };
    const body = Bodies.rectangle(x, y, config.width, config.height, {
        friction: config.friction,
        restitution: config.restitution,
        density: config.density,
        render: {
            fillStyle: config.color,
            strokeStyle: '#ff000088',
            lineWidth: 4,
        },
        label: 'explosive',
        customId: generateId(),
        isExplosive: true,
        explosionForce: config.explosionForce,
        explosionRadius: config.explosionRadius,
    });
    return body;
}

/**
 * Create a jelly block (very bouncy)
 */
export function createJelly(x, y, options = {}) {
    const config = { ...OBJECTS.JELLY, ...options };
    const body = Bodies.rectangle(x, y, config.width, config.height, {
        friction: config.friction,
        restitution: config.restitution,
        density: config.density,
        chamfer: { radius: 10 }, // Rounded corners for jelly effect
        render: {
            fillStyle: config.color,
            strokeStyle: '#ffffff44',
            lineWidth: 2,
        },
        label: 'jelly',
        customId: generateId(),
    });
    return body;
}

/**
 * Create an anvil (very heavy) - BIG and DARK for cartoon look
 */
export function createAnvil(x, y, options = {}) {
    const config = { ...OBJECTS.ANVIL, ...options };

    // Create anvil shape using trapezoid - MUCH BIGGER!
    const width = config.width * 1.5 || 100;
    const height = config.height * 1.3 || 65;

    const body = Bodies.trapezoid(x, y, width, height, 0.4, {
        friction: config.friction,
        restitution: config.restitution,
        density: config.density || 0.015, // Even heavier!
        render: {
            fillStyle: '#2c3e50', // Dark metallic blue-gray
            strokeStyle: '#1a252f', // Even darker outline
            lineWidth: 5,
        },
        label: 'anvil',
        customId: generateId(),
    });
    return body;
}

/**
 * Create object by type
 * @param {string} type - Object type from OBJECTS
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {Object} options - Override options
 */
export function createObject(type, x, y, options = {}) {
    switch (type) {
        case 'box':
            return createBox(x, y, options);
        case 'circle':
            return createCircle(x, y, options);
        case 'triangle':
            return createTriangle(x, y, options);
        case 'plank':
            return createPlank(x, y, options);
        case 'balloon':
            return createBalloon(x, y, options);
        case 'explosive':
            return createExplosive(x, y, options);
        case 'jelly':
            return createJelly(x, y, options);
        case 'anvil':
            return createAnvil(x, y, options);
        default:
            return createBox(x, y, options);
    }
}

/**
 * Get random object type
 */
export function getRandomObjectType() {
    const types = Object.keys(OBJECTS).map((key) => OBJECTS[key].type);
    return types[Math.floor(Math.random() * types.length)];
}

/**
 * Serialize object for sync
 */
export function serializeObject(body) {
    return {
        id: body.customId,
        type: body.label,
        x: body.position.x,
        y: body.position.y,
        angle: body.angle,
        velocityX: body.velocity.x,
        velocityY: body.velocity.y,
    };
}
