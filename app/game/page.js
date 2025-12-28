'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import ToolWheel from '@/components/ToolWheel';
import ObjectPalette from '@/components/ObjectPalette';
import ChaosPanel from '@/components/ChaosPanel';
import ScreenEffects from '@/components/ScreenEffects';
import { createRoom, joinRoom, leaveRoom, getConnectionCount, isConnected } from '@/lib/multiplayer/peer';
import { syncSpawn, syncTool, syncGravity, syncCursor, handleSyncEvent, setPlayerId } from '@/lib/multiplayer/sync';
import { toolSpawn, executeTool } from '@/lib/physics/tools';
import { setGravity, clearWorld } from '@/lib/physics/engine';
import {
    registerEffectCallbacks,
    toggleChaos,
    megaExplosion,
    spawnExplosiveRain,
    balloonParty,
    startExplosionChain,
} from '@/lib/physics/chaos';
import {
    createBlackHole,
    ragdollRain,
    magnetMadness,
    toggleSlowMotion,
    toggleFreeze,
    updateSpecialObjects,
    clearSpecialObjects,
} from '@/lib/physics/special';
import {
    initAudio,
    toggleSounds,
    playExplosionSound,
    playChaosSound,
    playBlackHoleSound,
    playBoingSound,
    playTimeSlowSound,
} from '@/lib/audio/sounds';
import { CANVAS } from '@/lib/constants';
import styles from './page.module.css';

const GameCanvas = dynamic(() => import('@/components/GameCanvas'), {
    ssr: false,
    loading: () => (
        <div className={styles.loading}>
            <div className={styles.loadingSpinner} />
            <p>Loading physics engine...</p>
        </div>
    ),
});

export default function GamePage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [selectedTool, setSelectedTool] = useState('spawn');
    const [selectedObject, setSelectedObject] = useState('box');
    const [roomId, setRoomId] = useState(null);
    const [connectionCount, setConnectionCount] = useState(0);
    const [isMultiplayer, setIsMultiplayer] = useState(false);
    const [remoteCursors, setRemoteCursors] = useState({});
    const [statusMessage, setStatusMessage] = useState('');
    const [chaosEnabled, setChaosEnabled] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);

    const cursorIntervalRef = useRef(null);
    const lastCursorPos = useRef({ x: 0, y: 0 });
    const specialUpdateRef = useRef(null);

    // Initialize audio on first interaction
    useEffect(() => {
        const handleFirstInteraction = () => {
            initAudio();
            document.removeEventListener('click', handleFirstInteraction);
            document.removeEventListener('keydown', handleFirstInteraction);
        };
        document.addEventListener('click', handleFirstInteraction);
        document.addEventListener('keydown', handleFirstInteraction);
        return () => {
            document.removeEventListener('click', handleFirstInteraction);
            document.removeEventListener('keydown', handleFirstInteraction);
        };
    }, []);

    // Register chaos effect callbacks and start update loops
    useEffect(() => {
        registerEffectCallbacks(
            (intensity) => {
                if (window.triggerScreenShake) {
                    window.triggerScreenShake(intensity);
                }
            },
            (x, y, count, color) => {
                if (window.spawnParticles) {
                    window.spawnParticles(x, y, count, color);
                }
            },
            (message) => {
                if (window.showChaosStatus) {
                    window.showChaosStatus(message);
                }
            }
        );

        startExplosionChain();

        // Start special objects update loop (black holes, magnets)
        specialUpdateRef.current = setInterval(() => {
            updateSpecialObjects();
        }, 16);

        return () => {
            if (specialUpdateRef.current) {
                clearInterval(specialUpdateRef.current);
            }
            clearSpecialObjects();
        };
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT') return;

            switch (e.key.toLowerCase()) {
                case 'c':
                    const newChaosState = toggleChaos();
                    setChaosEnabled(newChaosState);
                    if (soundEnabled) playChaosSound();
                    break;
                case 'e':
                    megaExplosion();
                    if (soundEnabled) playExplosionSound(2);
                    break;
                case 'b':
                    spawnExplosiveRain(10);
                    if (soundEnabled) playExplosionSound(0.5);
                    break;
                case 'p':
                    balloonParty(15);
                    break;
                case 'r':
                    clearWorld();
                    clearSpecialObjects();
                    if (window.showChaosStatus) {
                        window.showChaosStatus('🧹 CLEARED!');
                    }
                    break;
                case 'h':
                    createBlackHole(CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2, {
                        pullRadius: 350,
                        lifetime: 6000,
                    });
                    if (soundEnabled) playBlackHoleSound();
                    break;
                case 'g':
                    ragdollRain(5);
                    if (soundEnabled) playBoingSound();
                    break;
                case 'm':
                    magnetMadness();
                    break;
                case 't':
                    toggleSlowMotion();
                    if (soundEnabled) playTimeSlowSound();
                    break;
                case 'f':
                    toggleFreeze();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [soundEnabled]);

    // Initialize multiplayer
    useEffect(() => {
        const shouldCreate = searchParams.get('create') === 'true';
        const roomToJoin = searchParams.get('room');

        if (shouldCreate || roomToJoin) {
            setIsMultiplayer(true);
            initMultiplayer(shouldCreate, roomToJoin);
        }

        return () => {
            leaveRoom();
            if (cursorIntervalRef.current) {
                clearInterval(cursorIntervalRef.current);
            }
        };
    }, [searchParams]);

    const handleMessage = useCallback((data, senderId) => {
        handleSyncEvent(data, {
            onSpawn: (spawnData) => {
                toolSpawn(spawnData.objectType, spawnData.position, spawnData.options);
            },
            onTool: (toolData) => {
                executeTool(toolData.toolType, {
                    position: toolData.position,
                    ...toolData.params,
                });
            },
            onGravity: (gravityData) => {
                setGravity(gravityData.gravity);
            },
            onCursor: (cursorData, peerId) => {
                setRemoteCursors((prev) => ({
                    ...prev,
                    [peerId]: {
                        position: cursorData.position,
                        toolId: cursorData.toolId,
                        color: getPlayerColor(peerId),
                    },
                }));
            },
        });
    }, []);

    const handleConnection = useCallback((peerId) => {
        setConnectionCount(getConnectionCount());
        setStatusMessage('Player joined!');
        setTimeout(() => setStatusMessage(''), 3000);
    }, []);

    const handleDisconnect = useCallback((peerId) => {
        setConnectionCount(getConnectionCount());
        setRemoteCursors((prev) => {
            const next = { ...prev };
            delete next[peerId];
            return next;
        });
        setStatusMessage('Player left');
        setTimeout(() => setStatusMessage(''), 3000);
    }, []);

    const initMultiplayer = async (shouldCreate, roomToJoin) => {
        try {
            setPlayerId(`player_${Date.now()}`);

            if (shouldCreate) {
                setStatusMessage('Creating room...');
                const newRoomId = await createRoom(handleMessage, handleConnection, handleDisconnect);
                setRoomId(newRoomId);
                setStatusMessage('Room created! Share the code.');
            } else if (roomToJoin) {
                setStatusMessage('Joining room...');
                await joinRoom(roomToJoin, handleMessage, handleConnection, handleDisconnect);
                setRoomId(roomToJoin.toUpperCase());
                setStatusMessage('Connected!');
                setTimeout(() => setStatusMessage(''), 3000);
            }

            cursorIntervalRef.current = setInterval(() => {
                if (isConnected()) {
                    syncCursor(lastCursorPos.current, selectedTool);
                }
            }, 100);
        } catch (error) {
            console.error('Multiplayer error:', error);
            setStatusMessage('Failed to connect. Playing solo.');
            setIsMultiplayer(false);
        }
    };

    const getPlayerColor = (peerId) => {
        const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#ff9ff3', '#a29bfe', '#00cec9'];
        let hash = 0;
        for (let i = 0; i < peerId.length; i++) {
            hash = peerId.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const handleToolUsed = useCallback((toolId, result) => {
        if (isMultiplayer && isConnected()) {
            if (toolId === 'gravity' && result) {
                syncGravity(result);
            } else {
                syncTool(toolId, result?.position || { x: 0, y: 0 }, result);
            }
        }
    }, [isMultiplayer]);

    const handleSpawn = useCallback((objectType, position) => {
        if (isMultiplayer && isConnected()) {
            syncSpawn(objectType, position);
        }
    }, [isMultiplayer]);

    const handleMouseMove = useCallback((e) => {
        const gameArea = document.querySelector('[data-game-area]');
        if (gameArea) {
            const rect = gameArea.getBoundingClientRect();
            lastCursorPos.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
        }
    }, []);

    const handleTimeControl = useCallback((action) => {
        if (action === 'slow') {
            toggleSlowMotion();
            if (soundEnabled) playTimeSlowSound();
        }
    }, [soundEnabled]);

    const handleSoundToggle = useCallback((enabled) => {
        setSoundEnabled(enabled);
        toggleSounds();
    }, []);

    const copyRoomCode = () => {
        if (roomId) {
            navigator.clipboard.writeText(roomId);
            setStatusMessage('Copied!');
            setTimeout(() => setStatusMessage(''), 2000);
        }
    };

    const handleClearAll = () => {
        clearWorld();
        clearSpecialObjects();
        if (window.showChaosStatus) {
            window.showChaosStatus('🧹 CLEARED!');
        }
    };

    return (
        <ScreenEffects>
            <main className={styles.main} onMouseMove={handleMouseMove}>
                <header className={styles.header}>
                    <button className={styles.backBtn} onClick={() => router.push('/')}>
                        ← Back
                    </button>
                    <h1 className={styles.logo}>
                        CHAOS
                        {chaosEnabled && <span className={styles.chaosIndicator}>🔥 ACTIVE</span>}
                    </h1>

                    {isMultiplayer && (
                        <div className={styles.roomInfo}>
                            <div className={styles.roomCode} onClick={copyRoomCode}>
                                <span className={styles.roomLabel}>Room:</span>
                                <span className={styles.roomId}>{roomId || '...'}</span>
                                <span className={styles.copyIcon}>📋</span>
                            </div>
                            <div className={styles.playerCount}>
                                👥 {connectionCount + 1}
                            </div>
                        </div>
                    )}

                    {statusMessage && (
                        <div className={styles.statusMessage}>{statusMessage}</div>
                    )}

                    <div className={styles.quickActions}>
                        <button
                            className={styles.quickBtn}
                            onClick={handleClearAll}
                            title="Clear all objects (R)"
                        >
                            🧹
                        </button>
                    </div>
                </header>

                <div className={styles.gameContainer}>
                    <aside className={styles.sidebar}>
                        <ObjectPalette
                            selectedObject={selectedObject}
                            onSelectObject={setSelectedObject}
                        />
                    </aside>

                    <div className={styles.canvasWrapper} data-game-area>
                        <GameCanvas
                            selectedTool={selectedTool}
                            selectedObject={selectedObject}
                            onToolUsed={handleToolUsed}
                            onSpawn={handleSpawn}
                            remoteCursors={remoteCursors}
                        />
                    </div>

                    <aside className={styles.rightSidebar}>
                        <ChaosPanel
                            onChaosToggle={setChaosEnabled}
                            onTimeControl={handleTimeControl}
                            onSoundToggle={handleSoundToggle}
                        />

                        <div className={styles.miniPanel}>
                            <h4>Hotkeys</h4>
                            <ul className={styles.controlsList}>
                                <li><kbd>C</kbd> Chaos mode</li>
                                <li><kbd>H</kbd> Black hole</li>
                                <li><kbd>G</kbd> Ragdolls</li>
                                <li><kbd>M</kbd> Magnets</li>
                                <li><kbd>T</kbd> Slow-mo</li>
                                <li><kbd>F</kbd> Freeze</li>
                                <li><kbd>E</kbd> Explode</li>
                                <li><kbd>R</kbd> Clear</li>
                            </ul>
                        </div>
                    </aside>
                </div>

                <footer className={styles.footer}>
                    <ToolWheel
                        selectedTool={selectedTool}
                        onSelectTool={setSelectedTool}
                    />
                </footer>
            </main>
        </ScreenEffects>
    );
}
