'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './ScreenEffects.module.css';

/**
 * Screen effects component - handles shake, particles, and status messages
 */
export default function ScreenEffects({ children }) {
    const [shake, setShake] = useState(0);
    const [particles, setParticles] = useState([]);
    const [statusMessage, setStatusMessage] = useState('');
    const particleIdRef = useRef(0);

    // Expose effect triggers globally
    useEffect(() => {
        window.triggerScreenShake = (intensity = 1) => {
            setShake(intensity);
            setTimeout(() => setShake(0), 300 + intensity * 100);
        };

        window.spawnParticles = (x, y, count = 10, color = '#ff6b6b') => {
            // Get canvas offset from page - particles are in fixed position layer
            const gameArea = document.querySelector('[data-game-area]');
            const offsetX = gameArea ? gameArea.getBoundingClientRect().left : 0;
            const offsetY = gameArea ? gameArea.getBoundingClientRect().top : 0;

            const newParticles = [];
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
                const speed = 3 + Math.random() * 5;
                newParticles.push({
                    id: particleIdRef.current++,
                    x: x + offsetX, // Add canvas offset
                    y: y + offsetY, // Add canvas offset
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 4 + Math.random() * 8,
                    color,
                    life: 1,
                });
            }
            setParticles((prev) => [...prev, ...newParticles]);
        };

        window.showChaosStatus = (message) => {
            setStatusMessage(message);
            setTimeout(() => setStatusMessage(''), 2500);
        };

        return () => {
            delete window.triggerScreenShake;
            delete window.spawnParticles;
            delete window.showChaosStatus;
        };
    }, []);

    // Animate particles
    useEffect(() => {
        if (particles.length === 0) return;

        const interval = setInterval(() => {
            setParticles((prev) =>
                prev
                    .map((p) => ({
                        ...p,
                        x: p.x + p.vx,
                        y: p.y + p.vy,
                        vy: p.vy + 0.2, // gravity
                        life: p.life - 0.03,
                        size: p.size * 0.97,
                    }))
                    .filter((p) => p.life > 0)
            );
        }, 16);

        return () => clearInterval(interval);
    }, [particles.length > 0]);

    const shakeStyle = shake > 0 ? {
        animation: `shake ${0.1 + shake * 0.05}s ease-in-out`,
        animationIterationCount: Math.ceil(shake * 2),
    } : {};

    return (
        <div className={styles.container} style={shakeStyle}>
            {children}

            {/* Particles layer */}
            <div className={styles.particleLayer}>
                {particles.map((p) => (
                    <div
                        key={p.id}
                        className={styles.particle}
                        style={{
                            left: p.x,
                            top: p.y,
                            width: p.size,
                            height: p.size,
                            backgroundColor: p.color,
                            opacity: p.life,
                            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                        }}
                    />
                ))}
            </div>

            {/* Status message */}
            {statusMessage && (
                <div className={styles.statusOverlay}>
                    <div className={styles.statusMessage}>{statusMessage}</div>
                </div>
            )}
        </div>
    );
}
