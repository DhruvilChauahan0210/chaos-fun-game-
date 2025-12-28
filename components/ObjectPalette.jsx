'use client';

import { useState } from 'react';
import { OBJECTS } from '@/lib/constants';
import styles from './ObjectPalette.module.css';

const objectList = Object.values(OBJECTS);

const categories = {
    basic: ['box', 'circle', 'triangle', 'plank'],
    chaos: ['balloon', 'jelly', 'explosive'],
    heavy: ['anvil'],
};

export default function ObjectPalette({ selectedObject, onSelectObject }) {
    const [activeCategory, setActiveCategory] = useState('basic');

    const filteredObjects = objectList.filter((obj) =>
        categories[activeCategory].includes(obj.type)
    );

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Objects</h3>

            {/* Category tabs */}
            <div className={styles.tabs}>
                {Object.keys(categories).map((category) => (
                    <button
                        key={category}
                        className={`${styles.tab} ${activeCategory === category ? styles.activeTab : ''}`}
                        onClick={() => setActiveCategory(category)}
                    >
                        {category === 'basic' && '📦'}
                        {category === 'chaos' && '🎪'}
                        {category === 'heavy' && '🔨'}
                        <span>{category}</span>
                    </button>
                ))}
            </div>

            {/* Object grid */}
            <div className={styles.grid}>
                {filteredObjects.map((obj) => (
                    <button
                        key={obj.type}
                        className={`${styles.objectBtn} ${selectedObject === obj.type ? styles.selected : ''}`}
                        style={{ '--obj-color': obj.color }}
                        onClick={() => onSelectObject(obj.type)}
                    >
                        <div
                            className={styles.preview}
                            style={{ backgroundColor: obj.color }}
                        >
                            {obj.type === 'circle' || obj.type === 'balloon' ? (
                                <div className={styles.circlePreview} />
                            ) : obj.type === 'triangle' ? (
                                <div className={styles.trianglePreview} />
                            ) : obj.type === 'plank' ? (
                                <div className={styles.plankPreview} />
                            ) : obj.type === 'anvil' ? (
                                <div className={styles.anvilPreview} />
                            ) : (
                                <div className={styles.boxPreview} />
                            )}
                        </div>
                        <span className={styles.objectLabel}>{obj.label}</span>
                        {obj.explosive && <span className={styles.badge}>💥</span>}
                        {obj.floaty && <span className={styles.badge}>🎈</span>}
                    </button>
                ))}
            </div>

            {/* Object info */}
            <div className={styles.info}>
                {selectedObject && (
                    <>
                        <div className={styles.infoTitle}>
                            {objectList.find((o) => o.type === selectedObject)?.label}
                        </div>
                        <div className={styles.infoProps}>
                            <span>Mass: {objectList.find((o) => o.type === selectedObject)?.density > 0.005 ? '🔴 Heavy' : objectList.find((o) => o.type === selectedObject)?.density < 0.0005 ? '🟢 Light' : '🟡 Normal'}</span>
                            <span>Bounce: {objectList.find((o) => o.type === selectedObject)?.restitution > 0.7 ? '🔵 High' : '⚪ Low'}</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
