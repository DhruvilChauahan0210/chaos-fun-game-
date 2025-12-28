'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function Home() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleCreateRoom = () => {
    router.push('/game?create=true');
  };

  const handleJoinRoom = () => {
    if (roomCode.trim()) {
      router.push(`/game?room=${roomCode.trim().toUpperCase()}`);
    }
  };

  const handlePlaySolo = () => {
    router.push('/game');
  };

  return (
    <main className={styles.main}>
      {/* Background effects */}
      <div className={styles.bgBlob1} />
      <div className={styles.bgBlob2} />
      <div className={styles.bgGrid} />

      {/* Hero section */}
      <div className={styles.hero}>
        <h1 className={styles.title}>
          <span className={styles.titleChaos}>CHAOS</span>
          <span className={styles.titleSandbox}>SANDBOX</span>
        </h1>
        <p className={styles.subtitle}>
          A multiplayer physics playground. No goals. No winners.
          <br />
          <span className={styles.highlight}>Just pure mayhem.</span>
        </p>
      </div>

      {/* Action cards */}
      <div className={styles.cards}>
        {/* Solo play */}
        <div className={styles.card} onClick={handlePlaySolo}>
          <div className={styles.cardIcon}>🎮</div>
          <h2>Play Solo</h2>
          <p>Jump into the sandbox alone and cause some chaos</p>
          <button className={styles.cardBtn}>Start Playing</button>
        </div>

        {/* Create room */}
        <div className={styles.card} onClick={handleCreateRoom}>
          <div className={styles.cardIcon}>🚀</div>
          <h2>Create Room</h2>
          <p>Start a new room and invite your friends</p>
          <button className={styles.cardBtn}>Create Room</button>
        </div>

        {/* Join room */}
        <div className={`${styles.card} ${styles.joinCard}`}>
          <div className={styles.cardIcon}>🔗</div>
          <h2>Join Room</h2>
          <p>Enter a room code to join your friends</p>
          <div className={styles.inputGroup}>
            <input
              type="text"
              placeholder="ROOM CODE"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
              className={styles.input}
            />
            <button
              className={styles.joinBtn}
              onClick={handleJoinRoom}
              disabled={!roomCode.trim()}
            >
              Join
            </button>
          </div>
        </div>
      </div>

      {/* Features preview */}
      <div className={styles.features}>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>💥</span>
          <span>Explosions</span>
        </div>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>🔄</span>
          <span>Flip Gravity</span>
        </div>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>📦</span>
          <span>8 Objects</span>
        </div>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>🎈</span>
          <span>Floaty Balloons</span>
        </div>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>👥</span>
          <span>Multiplayer</span>
        </div>
      </div>

      {/* Footer hint */}
      <p className={styles.hint}>
        Press <kbd>1-5</kbd> for tools • Click to spawn • Shift+Click to shrink
      </p>
    </main>
  );
}
