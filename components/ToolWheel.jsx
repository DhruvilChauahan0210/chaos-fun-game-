'use client';

import { useState, useEffect, useCallback } from 'react';
import { TOOLS } from '@/lib/constants';
import styles from './ToolWheel.module.css';

const toolList = Object.values(TOOLS);

export default function ToolWheel({ selectedTool, onSelectTool }) {
    const [isOpen, setIsOpen] = useState(false);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Number keys 1-5 for quick tool selection
            const toolIndex = parseInt(e.key) - 1;
            if (toolIndex >= 0 && toolIndex < toolList.length) {
                onSelectTool(toolList[toolIndex].id);
            }

            // Space to toggle wheel
            if (e.key === ' ' && !e.repeat) {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onSelectTool]);

    const handleToolClick = useCallback((toolId) => {
        onSelectTool(toolId);
        setIsOpen(false);
    }, [onSelectTool]);

    const selectedToolData = toolList.find((t) => t.id === selectedTool) || toolList[0];

    return (
        <div className={styles.container}>
            {/* Current tool button */}
            <button
                className={styles.currentTool}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    '--tool-color': selectedToolData.color,
                    borderColor: selectedToolData.color,
                }}
            >
                <span className={styles.toolIcon}>{selectedToolData.icon}</span>
                <span className={styles.toolLabel}>{selectedToolData.label}</span>
                <span className={styles.expandIcon}>{isOpen ? '▼' : '▲'}</span>
            </button>

            {/* Tool wheel */}
            <div className={`${styles.wheel} ${isOpen ? styles.open : ''}`}>
                {toolList.map((tool, index) => {
                    const isSelected = tool.id === selectedTool;
                    const angle = (index / toolList.length) * 360 - 90;
                    const radius = 100;
                    const x = Math.cos((angle * Math.PI) / 180) * radius;
                    const y = Math.sin((angle * Math.PI) / 180) * radius;

                    return (
                        <button
                            key={tool.id}
                            className={`${styles.toolOption} ${isSelected ? styles.selected : ''}`}
                            style={{
                                '--tool-color': tool.color,
                                '--x': `${x}px`,
                                '--y': `${y}px`,
                                '--delay': `${index * 50}ms`,
                            }}
                            onClick={() => handleToolClick(tool.id)}
                        >
                            <span className={styles.optionIcon}>{tool.icon}</span>
                            <span className={styles.optionLabel}>{tool.label}</span>
                            <span className={styles.shortcut}>{tool.shortcut}</span>
                        </button>
                    );
                })}
            </div>

            {/* Quick toolbar */}
            <div className={styles.quickBar}>
                {toolList.map((tool) => (
                    <button
                        key={tool.id}
                        className={`${styles.quickTool} ${tool.id === selectedTool ? styles.active : ''}`}
                        style={{ '--tool-color': tool.color }}
                        onClick={() => onSelectTool(tool.id)}
                        title={`${tool.label} (${tool.shortcut})`}
                    >
                        <span>{tool.icon}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
