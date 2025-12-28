'use client';

import { useEffect, useCallback } from 'react';
import { TOOLS } from '@/lib/constants';
import styles from './ToolWheel.module.css';

const toolList = Object.values(TOOLS);

export default function ToolWheel({ selectedTool, onSelectTool }) {
    // Handle keyboard shortcuts (1-9 keys)
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Number keys 1-9 for quick tool selection
            const toolIndex = parseInt(e.key) - 1;
            if (toolIndex >= 0 && toolIndex < toolList.length) {
                onSelectTool(toolList[toolIndex].id);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onSelectTool]);

    const handleToolClick = useCallback((toolId) => {
        onSelectTool(toolId);
    }, [onSelectTool]);

    return (
        <div className={styles.hotbar}>
            {toolList.map((tool, index) => {
                const isSelected = tool.id === selectedTool;
                const slotNumber = index + 1;

                return (
                    <button
                        key={tool.id}
                        className={`${styles.slot} ${isSelected ? styles.activeSlot : ''}`}
                        style={{ '--tool-color': tool.color }}
                        onClick={() => handleToolClick(tool.id)}
                        title={`${tool.label} (${slotNumber})`}
                    >
                        <span className={styles.slotNumber}>{slotNumber}</span>
                        <span className={styles.slotIcon}>{tool.icon}</span>
                        <span className={styles.slotLabel}>{tool.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
