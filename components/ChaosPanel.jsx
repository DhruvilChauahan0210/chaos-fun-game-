'use client';

import { useState, useCallback } from 'react';
import {
    toggleChaos,
    startObjectFlood,
    stopObjectFlood,
    startSuddenRules,
    stopSuddenRules,
    megaExplosion,
    spawnExplosiveRain,
    balloonParty,
    anvilDrop,
} from '@/lib/physics/chaos';
import {
    createBlackHole,
    ragdollRain,
} from '@/lib/physics/special';
import { getGravity, setGravity } from '@/lib/physics/engine';
import { CANVAS } from '@/lib/constants';
import styles from './ChaosPanel.module.css';

export default function ChaosPanel({ onChaosToggle, onTimeControl, onSoundToggle }) {
    const [chaosOn, setChaosOn] = useState(false);
    const [floodOn, setFloodOn] = useState(false);
    const [rulesOn, setRulesOn] = useState(false);
    const [soundOn, setSoundOn] = useState(true);
    const [gravityDir, setGravityDir] = useState('down'); // down, right, up, left

    const GRAVITY_DIRECTIONS = {
        down: { x: 0, y: 1, icon: '⬇️', label: 'DOWN' },
        right: { x: 1, y: 0, icon: '➡️', label: 'RIGHT' },
        up: { x: 0, y: -1, icon: '⬆️', label: 'UP' },
        left: { x: -1, y: 0, icon: '⬅️', label: 'LEFT' },
    };

    const handleChaosToggle = useCallback(() => {
        const newState = toggleChaos();
        setChaosOn(newState);
        setFloodOn(newState);
        setRulesOn(newState);
        if (onChaosToggle) onChaosToggle(newState);
    }, [onChaosToggle]);

    const handleFloodToggle = useCallback(() => {
        if (floodOn) {
            stopObjectFlood();
        } else {
            startObjectFlood(5, 2000);
        }
        setFloodOn(!floodOn);
    }, [floodOn]);

    const handleRulesToggle = useCallback(() => {
        if (rulesOn) {
            stopSuddenRules();
        } else {
            startSuddenRules(10000);
        }
        setRulesOn(!rulesOn);
    }, [rulesOn]);

    const handleBlackHole = useCallback(() => {
        createBlackHole(CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2, {
            pullRadius: 350,
            lifetime: 6000,
        });
    }, []);

    const handleSoundToggle = useCallback(() => {
        const newState = !soundOn;
        setSoundOn(newState);
        if (onSoundToggle) onSoundToggle(newState);
    }, [soundOn, onSoundToggle]);

    const handleGravityToggle = useCallback(() => {
        const directions = ['down', 'right', 'up', 'left'];
        const currentIndex = directions.indexOf(gravityDir);
        const nextDir = directions[(currentIndex + 1) % 4];
        const newGravity = GRAVITY_DIRECTIONS[nextDir];
        setGravity({ x: newGravity.x, y: newGravity.y });
        setGravityDir(nextDir);
    }, [gravityDir]);

    return (
        <div className={styles.panel}>
            <h3 className={styles.title}>
                <span className={styles.fire}>🔥</span> CHAOS
            </h3>

            {/* Master chaos toggle */}
            <button
                className={`${styles.chaosBtn} ${chaosOn ? styles.active : ''}`}
                onClick={handleChaosToggle}
            >
                <span className={styles.icon}>{chaosOn ? '🌋' : '😴'}</span>
                <span>{chaosOn ? 'CHAOS ON' : 'ENABLE CHAOS'}</span>
            </button>

            {/* Individual toggles */}
            <div className={styles.toggles}>
                <button
                    className={`${styles.toggleBtn} ${floodOn ? styles.on : ''}`}
                    onClick={handleFloodToggle}
                >
                    🌊 Flood
                </button>
                <button
                    className={`${styles.toggleBtn} ${rulesOn ? styles.on : ''}`}
                    onClick={handleRulesToggle}
                >
                    🎲 Rules
                </button>
            </div>

            {/* Gravity toggle */}
            <button
                className={`${styles.toggleBtn} ${styles.gravityBtn}`}
                onClick={handleGravityToggle}
            >
                {GRAVITY_DIRECTIONS[gravityDir].icon} Gravity {GRAVITY_DIRECTIONS[gravityDir].label}
            </button>

            {/* Instant actions - Row 1 */}
            <div className={styles.actions}>
                <button className={styles.actionBtn} onClick={megaExplosion}>
                    💥 MEGA
                </button>
                <button className={styles.actionBtn} onClick={() => spawnExplosiveRain(10)}>
                    💣 BOMBS
                </button>
                <button className={styles.actionBtn} onClick={() => balloonParty(15)}>
                    🎈 PARTY
                </button>
                <button className={styles.actionBtn} onClick={() => anvilDrop(5)}>
                    🔨 ANVILS
                </button>
            </div>

            {/* Special actions - Row 2 */}
            <div className={styles.actions}>
                <button className={`${styles.actionBtn} ${styles.special}`} onClick={handleBlackHole}>
                    🕳️ HOLE
                </button>
                <button className={`${styles.actionBtn} ${styles.special}`} onClick={() => ragdollRain(5)}>
                    🎭 DOLL
                </button>
                <button className={`${styles.actionBtn} ${styles.special}`} onClick={() => onTimeControl && onTimeControl('slow')}>
                    ⏰ SLOW
                </button>
            </div>

            {/* Sound toggle */}
            <button
                className={`${styles.toggleBtn} ${styles.soundBtn} ${soundOn ? styles.on : ''}`}
                onClick={handleSoundToggle}
            >
                {soundOn ? '🔊' : '🔇'} Sound
            </button>

        </div>
    );
}
