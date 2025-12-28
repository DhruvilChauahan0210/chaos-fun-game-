// Event synchronization for multiplayer
import { broadcast } from './peer';
import { SYNC_EVENTS } from '../constants';

/**
 * Sync event schema
 * All events follow this structure:
 * {
 *   type: SYNC_EVENTS.*,
 *   timestamp: number,
 *   senderId: string,
 *   data: { ... event-specific data }
 * }
 */

let localPlayerId = null;

/**
 * Set local player ID
 * @param {string} id - Player ID
 */
export function setPlayerId(id) {
    localPlayerId = id;
}

/**
 * Get local player ID
 */
export function getPlayerId() {
    return localPlayerId || `player_${Date.now()}`;
}

/**
 * Create a sync event object
 * @param {string} type - Event type from SYNC_EVENTS
 * @param {Object} data - Event data
 */
function createEvent(type, data) {
    return {
        type,
        timestamp: Date.now(),
        senderId: getPlayerId(),
        data,
    };
}

/**
 * Sync object spawn event
 * @param {string} objectType - Type of object spawned
 * @param {Object} position - { x, y } spawn position
 * @param {number} rotation - Initial rotation
 * @param {Object} options - Additional options (size, color, etc.)
 */
export function syncSpawn(objectType, position, rotation = 0, options = {}) {
    const event = createEvent(SYNC_EVENTS.SPAWN, {
        objectType,
        position,
        rotation,
        options,
    });
    broadcast(event);
    return event;
}

/**
 * Sync force application event
 * @param {string} objectId - ID of object to apply force to (or null for area)
 * @param {Object} position - { x, y } position
 * @param {Object} direction - { x, y } force direction
 * @param {number} strength - Force magnitude
 */
export function syncForce(objectId, position, direction, strength) {
    const event = createEvent(SYNC_EVENTS.FORCE, {
        objectId,
        position,
        direction,
        strength,
    });
    broadcast(event);
    return event;
}

/**
 * Sync tool usage event
 * @param {string} toolType - Tool ID
 * @param {Object} position - { x, y } position where tool was used
 * @param {Object} params - Tool-specific parameters
 */
export function syncTool(toolType, position, params = {}) {
    const event = createEvent(SYNC_EVENTS.TOOL, {
        toolType,
        position,
        params,
    });
    broadcast(event);
    return event;
}

/**
 * Sync gravity change event
 * @param {Object} gravity - { x, y } new gravity vector
 */
export function syncGravity(gravity) {
    const event = createEvent(SYNC_EVENTS.GRAVITY, {
        gravity,
    });
    broadcast(event);
    return event;
}

/**
 * Sync cursor position (for showing other players' cursors)
 * @param {Object} position - { x, y } cursor position
 * @param {string} toolId - Currently selected tool
 */
export function syncCursor(position, toolId) {
    const event = createEvent(SYNC_EVENTS.CURSOR, {
        position,
        toolId,
    });
    broadcast(event);
    return event;
}

/**
 * Handle received sync event
 * @param {Object} event - Received event
 * @param {Object} handlers - Event handlers { onSpawn, onForce, onTool, onGravity, onCursor }
 */
export function handleSyncEvent(event, handlers) {
    // Ignore our own events
    if (event.senderId === getPlayerId()) {
        return;
    }

    switch (event.type) {
        case SYNC_EVENTS.SPAWN:
            if (handlers.onSpawn) {
                handlers.onSpawn(event.data, event.senderId);
            }
            break;

        case SYNC_EVENTS.FORCE:
            if (handlers.onForce) {
                handlers.onForce(event.data, event.senderId);
            }
            break;

        case SYNC_EVENTS.TOOL:
            if (handlers.onTool) {
                handlers.onTool(event.data, event.senderId);
            }
            break;

        case SYNC_EVENTS.GRAVITY:
            if (handlers.onGravity) {
                handlers.onGravity(event.data, event.senderId);
            }
            break;

        case SYNC_EVENTS.CURSOR:
            if (handlers.onCursor) {
                handlers.onCursor(event.data, event.senderId);
            }
            break;

        default:
            console.warn('Unknown sync event type:', event.type);
    }
}

/**
 * Create deterministic random based on seed
 * Useful for synchronizing random events across clients
 * @param {number} seed - Random seed
 */
export function createSeededRandom(seed) {
    let s = seed;
    return function () {
        s = Math.sin(s) * 10000;
        return s - Math.floor(s);
    };
}

/**
 * Generate room seed from room ID
 * @param {string} roomId - Room ID
 */
export function getRoomSeed(roomId) {
    let hash = 0;
    for (let i = 0; i < roomId.length; i++) {
        const char = roomId.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}
