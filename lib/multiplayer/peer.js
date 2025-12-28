// PeerJS Connection Manager
import { ROOM, SYNC_EVENTS } from '../constants';

let peer = null;
let connections = [];
let roomId = null;
let isHost = false;
let onMessageCallback = null;
let onConnectionCallback = null;
let onDisconnectCallback = null;

/**
 * Generate a random room ID
 */
function generateRoomId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < ROOM.ID_LENGTH; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

/**
 * Initialize PeerJS and create a new room
 * @param {Function} onMessage - Callback for received messages
 * @param {Function} onConnection - Callback when a peer connects
 * @param {Function} onDisconnect - Callback when a peer disconnects
 * @returns {Promise<string>} - Room ID
 */
export async function createRoom(onMessage, onConnection, onDisconnect) {
    return new Promise((resolve, reject) => {
        roomId = generateRoomId();
        isHost = true;
        onMessageCallback = onMessage;
        onConnectionCallback = onConnection;
        onDisconnectCallback = onDisconnect;

        // Dynamic import to avoid SSR issues
        import('peerjs').then(({ default: Peer }) => {
            peer = new Peer(`chaos-${roomId}`, {
                debug: 1,
            });

            peer.on('open', (id) => {
                console.log('Room created with ID:', roomId);
                resolve(roomId);
            });

            peer.on('connection', (conn) => {
                handleConnection(conn);
            });

            peer.on('error', (err) => {
                console.error('Peer error:', err);
                if (err.type === 'unavailable-id') {
                    // Room ID already taken, generate new one
                    roomId = generateRoomId();
                    peer.destroy();
                    createRoom(onMessage, onConnection, onDisconnect).then(resolve).catch(reject);
                } else {
                    reject(err);
                }
            });
        });
    });
}

/**
 * Join an existing room
 * @param {string} targetRoomId - Room ID to join
 * @param {Function} onMessage - Callback for received messages
 * @param {Function} onConnection - Callback when connected
 * @param {Function} onDisconnect - Callback when disconnected
 * @returns {Promise<void>}
 */
export async function joinRoom(targetRoomId, onMessage, onConnection, onDisconnect) {
    return new Promise((resolve, reject) => {
        roomId = targetRoomId.toUpperCase();
        isHost = false;
        onMessageCallback = onMessage;
        onConnectionCallback = onConnection;
        onDisconnectCallback = onDisconnect;

        const peerId = `chaos-${roomId}-${Date.now()}`;

        import('peerjs').then(({ default: Peer }) => {
            peer = new Peer(peerId, {
                debug: 1,
            });

            peer.on('open', () => {
                // Connect to the host
                const conn = peer.connect(`chaos-${roomId}`);

                conn.on('open', () => {
                    handleConnection(conn);
                    resolve();
                });

                conn.on('error', (err) => {
                    console.error('Connection error:', err);
                    reject(err);
                });
            });

            peer.on('connection', (conn) => {
                handleConnection(conn);
            });

            peer.on('error', (err) => {
                console.error('Peer error:', err);
                reject(err);
            });
        });
    });
}

/**
 * Handle new connection
 */
function handleConnection(conn) {
    connections.push(conn);
    console.log('New connection:', conn.peer);

    conn.on('data', (data) => {
        if (onMessageCallback) {
            onMessageCallback(data, conn.peer);
        }

        // If host, relay message to other peers
        if (isHost) {
            relayMessage(data, conn.peer);
        }
    });

    conn.on('close', () => {
        connections = connections.filter((c) => c !== conn);
        console.log('Connection closed:', conn.peer);
        if (onDisconnectCallback) {
            onDisconnectCallback(conn.peer);
        }
    });

    if (onConnectionCallback) {
        onConnectionCallback(conn.peer);
    }
}

/**
 * Relay message to all peers except sender
 */
function relayMessage(data, senderId) {
    connections.forEach((conn) => {
        if (conn.peer !== senderId && conn.open) {
            conn.send(data);
        }
    });
}

/**
 * Broadcast message to all connected peers
 * @param {Object} data - Data to send
 */
export function broadcast(data) {
    connections.forEach((conn) => {
        if (conn.open) {
            conn.send(data);
        }
    });
}

/**
 * Leave the room and close all connections
 */
export function leaveRoom() {
    connections.forEach((conn) => {
        conn.close();
    });
    connections = [];

    if (peer) {
        peer.destroy();
        peer = null;
    }

    roomId = null;
    isHost = false;
}

/**
 * Get current room ID
 */
export function getRoomId() {
    return roomId;
}

/**
 * Check if current peer is the host
 */
export function getIsHost() {
    return isHost;
}

/**
 * Get number of connected peers
 */
export function getConnectionCount() {
    return connections.length;
}

/**
 * Check if connected to a room
 */
export function isConnected() {
    return peer !== null && (isHost || connections.length > 0);
}
