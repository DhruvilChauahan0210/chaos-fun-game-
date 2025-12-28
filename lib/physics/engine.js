// Matter.js Physics Engine Setup
import Matter from 'matter-js';
import { CANVAS, PHYSICS } from '../constants';

const { Engine, Render, Runner, World, Bodies, Mouse, MouseConstraint, Events } = Matter;

let engine = null;
let render = null;
let runner = null;
let mouseConstraint = null;

/**
 * Initialize the physics engine
 */
export function initEngine(canvas, onCollision = null) {
    engine = Engine.create({
        gravity: PHYSICS.GRAVITY,
    });

    const world = engine.world;

    render = Render.create({
        canvas: canvas,
        engine: engine,
        options: {
            width: CANVAS.WIDTH,
            height: CANVAS.HEIGHT,
            background: CANVAS.BACKGROUND,
            wireframes: false,
            showAngleIndicator: false,
            showCollisions: false,
            showVelocity: false,
        },
    });

    // Create ground and walls
    const ground = Bodies.rectangle(
        CANVAS.WIDTH / 2,
        CANVAS.HEIGHT + 30,
        CANVAS.WIDTH + 100,
        60,
        { isStatic: true, render: { fillStyle: '#1a1a2e' }, label: 'ground' }
    );

    const leftWall = Bodies.rectangle(
        -30,
        CANVAS.HEIGHT / 2,
        60,
        CANVAS.HEIGHT + 100,
        { isStatic: true, render: { fillStyle: '#1a1a2e' }, label: 'wall' }
    );

    const rightWall = Bodies.rectangle(
        CANVAS.WIDTH + 30,
        CANVAS.HEIGHT / 2,
        60,
        CANVAS.HEIGHT + 100,
        { isStatic: true, render: { fillStyle: '#1a1a2e' }, label: 'wall' }
    );

    const ceiling = Bodies.rectangle(
        CANVAS.WIDTH / 2,
        -30,
        CANVAS.WIDTH + 100,
        60,
        { isStatic: true, render: { fillStyle: '#1a1a2e' }, label: 'ceiling' }
    );

    World.add(world, [ground, leftWall, rightWall, ceiling]);

    // Add mouse control
    const mouse = Mouse.create(canvas);
    mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            stiffness: 0.2,
            render: {
                visible: false,
            },
        },
    });

    World.add(world, mouseConstraint);
    render.mouse = mouse;

    // Collision events
    if (onCollision) {
        Events.on(engine, 'collisionStart', (event) => {
            event.pairs.forEach((pair) => {
                onCollision(pair.bodyA, pair.bodyB);
            });
        });
    }

    runner = Runner.create();

    return {
        engine,
        world,
        render,
        runner,
        mouse,
        mouseConstraint,
    };
}

/**
 * Get the engine instance
 */
export function getEngine() {
    return engine;
}

/**
 * Start the physics simulation
 */
export function startEngine() {
    if (render && runner && engine) {
        Render.run(render);
        Runner.run(runner, engine);
    }
}

/**
 * Stop the physics simulation
 */
export function stopEngine() {
    if (render) {
        Render.stop(render);
    }
    if (runner) {
        Runner.stop(runner);
    }
}

/**
 * Clear the world of all non-static bodies
 */
export function clearWorld() {
    if (engine) {
        const bodies = Matter.Composite.allBodies(engine.world);
        const toRemove = bodies.filter((body) => !body.isStatic);
        World.remove(engine.world, toRemove);
    }
}

/**
 * Set world gravity
 */
export function setGravity(gravity) {
    if (engine) {
        engine.gravity.x = gravity.x;
        engine.gravity.y = gravity.y;
    }
}

/**
 * Flip gravity (invert Y)
 */
export function flipGravity() {
    if (engine) {
        engine.gravity.y *= -1;
        return { x: engine.gravity.x, y: engine.gravity.y };
    }
}

/**
 * Get current gravity
 */
export function getGravity() {
    if (engine) {
        return { x: engine.gravity.x, y: engine.gravity.y };
    }
    return PHYSICS.GRAVITY;
}

/**
 * Get all bodies in the world
 */
export function getAllBodies() {
    if (engine) {
        return Matter.Composite.allBodies(engine.world);
    }
    return [];
}

/**
 * Get body at position
 */
export function getBodyAtPosition(position) {
    if (engine) {
        const bodies = Matter.Composite.allBodies(engine.world);
        return bodies.find((body) => {
            if (body.isStatic) return false;
            return Matter.Bounds.contains(body.bounds, position);
        });
    }
    return null;
}

/**
 * Add body to world
 */
export function addBody(body) {
    if (engine) {
        World.add(engine.world, body);
    }
}

/**
 * Remove body from world
 */
export function removeBody(body) {
    if (engine) {
        World.remove(engine.world, body);
    }
}

/**
 * Apply force to a body
 */
export function applyForce(body, force) {
    if (body) {
        Matter.Body.applyForce(body, body.position, force);
    }
}

/**
 * Scale a body
 */
export function scaleBody(body, scaleX, scaleY) {
    if (body) {
        Matter.Body.scale(body, scaleX, scaleY);
    }
}

/**
 * Set time scale (for slow motion)
 */
export function setTimeScale(scale) {
    if (engine) {
        engine.timing.timeScale = scale;
    }
}

/**
 * Get current time scale
 */
export function getTimeScale() {
    if (engine) {
        return engine.timing.timeScale;
    }
    return 1;
}

export { Matter };
