'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { initEngine, startEngine, stopEngine, clearWorld, getGravity, setGravity } from '@/lib/physics/engine';
import { createObject } from '@/lib/physics/objects';
import { executeTool, updateFloatyObjects, handleExplosiveCollision, toolPush } from '@/lib/physics/tools';
import { CANVAS, TOOLS, OBJECTS } from '@/lib/constants';
import styles from './GameCanvas.module.css';

export default function GameCanvas({
    selectedTool = 'spawn',
    selectedObject = 'box',
    onToolUsed = () => { },
    remoteCursors = {},
    onSpawn = () => { },
}) {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);
    const [isReady, setIsReady] = useState(false);
    const [gravityDirection, setGravityDirection] = useState('down');
    const lastMousePos = useRef({ x: 0, y: 0 });

    // Initialize physics engine
    useEffect(() => {
        if (!canvasRef.current) return;

        const handleCollision = (bodyA, bodyB) => {
            const explosionResult = handleExplosiveCollision(bodyA, bodyB);
            if (explosionResult) {
                onToolUsed('explode', explosionResult);
            }
        };

        const { engine, world, render, runner, mouse, mouseConstraint } = initEngine(
            canvasRef.current,
            handleCollision
        );

        engineRef.current = { engine, world, render, runner, mouse, mouseConstraint };
        startEngine();
        setIsReady(true);

        // Update floaty objects in game loop
        const floatyInterval = setInterval(() => {
            updateFloatyObjects();
        }, 16);

        return () => {
            clearInterval(floatyInterval);
            stopEngine();
        };
    }, [onToolUsed]);

    // Handle canvas click
    const handleClick = useCallback((e) => {
        if (!isReady) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const position = { x, y };

        switch (selectedTool) {
            case 'spawn':
                const result = executeTool('spawn', { position, objectType: selectedObject });
                onSpawn(selectedObject, position);
                onToolUsed('spawn', result);
                break;

            case 'explode':
                const explodeResult = executeTool('explode', { position });
                onToolUsed('explode', explodeResult);
                break;

            case 'gravity':
                const gravityResult = executeTool('gravity', {});
                setGravityDirection((prev) => (prev === 'down' ? 'up' : 'down'));
                onToolUsed('gravity', gravityResult);
                break;

            case 'scale':
                const scaleResult = executeTool('scale', { position, grow: !e.shiftKey });
                if (scaleResult) {
                    onToolUsed('scale', scaleResult);
                }
                break;

            default:
                break;
        }
    }, [isReady, selectedTool, selectedObject, onToolUsed, onSpawn]);

    // Handle mouse move for push tool
    const handleMouseMove = useCallback((e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        lastMousePos.current = { x, y };
    }, []);

    // Handle mouse down for push tool
    const handleMouseDown = useCallback((e) => {
        if (selectedTool !== 'push') return;
        if (e.button !== 0) return; // Only left click

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const position = { x, y };

        // Push direction is from click point outward
        const centerX = CANVAS.WIDTH / 2;
        const centerY = CANVAS.HEIGHT / 2;
        const dx = x - centerX;
        const dy = y - centerY;
        const length = Math.sqrt(dx * dx + dy * dy) || 1;
        const direction = { x: dx / length, y: dy / length };

        const pushResult = toolPush(position, direction);
        onToolUsed('push', pushResult);
    }, [selectedTool, onToolUsed]);

    return (
        <div className={styles.canvasContainer}>
            <canvas
                ref={canvasRef}
                width={CANVAS.WIDTH}
                height={CANVAS.HEIGHT}
                className={styles.canvas}
                onClick={handleClick}
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
            />

            {/* Gravity indicator */}
            <div className={styles.gravityIndicator}>
                <span className={styles.gravityIcon}>
                    {gravityDirection === 'down' ? '⬇️' : '⬆️'}
                </span>
                <span className={styles.gravityLabel}>Gravity</span>
            </div>

            {/* Remote cursors */}
            {Object.entries(remoteCursors).map(([peerId, cursor]) => (
                <div
                    key={peerId}
                    className={styles.remoteCursor}
                    style={{
                        left: cursor.position.x,
                        top: cursor.position.y,
                        backgroundColor: cursor.color || '#ff6b6b',
                    }}
                >
                    <span className={styles.cursorLabel}>{peerId.slice(-4)}</span>
                </div>
            ))}

            {/* Tool hint */}
            <div className={styles.toolHint}>
                {selectedTool === 'spawn' && `Click to spawn ${selectedObject}`}
                {selectedTool === 'push' && 'Click to push objects outward'}
                {selectedTool === 'explode' && 'Click to create explosion'}
                {selectedTool === 'gravity' && 'Click to flip gravity'}
                {selectedTool === 'scale' && 'Click to grow (Shift+Click to shrink)'}
            </div>
        </div>
    );
}
