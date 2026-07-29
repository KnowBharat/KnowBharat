import React from 'react';
import '../Css/LevelPickerPage.css';

export default function LevelPickerPage({
  title,
  subtitle,
  levels = [],
  activeLevel,
  unlockedLevel = 999, 
  onPickLevel,
  onBack,
  jumpLabel,      
  cardExtra,
  lockText, 
  children,       
}) {
  const activeMeta = levels.find(l => l.id === activeLevel);

  if (!activeLevel) return (
    <main className="lpp-page">
      <div className="lpp-header">
        <div className="lpp-flag">
          <span className="lpp-flag-s s1" />
          <span className="lpp-flag-s s2" />
          <span className="lpp-flag-s s3" />
        </div>
        <div className="lpp-header-text">
          <h1 className="lpp-title">{title}</h1>
          <p  className="lpp-sub">{subtitle}</p>
        </div>
      </div>

      <div className="lpp-grid">
        {levels.map((lvl, i) => {
          // Use lvl.num for math (since Puzzle IDs are strings like 'map', 'food')
          const levelNumber = lvl.num || lvl.id; 
          
          const isUnlocked = levelNumber <= unlockedLevel;
          const isNextToUnlock = levelNumber === unlockedLevel + 1;
          const isHardLocked = levelNumber > unlockedLevel + 1;

          return (
            <button
              key={lvl.id}
              className={`lpp-card ${lvl.dark ? 'dark' : ''} ${!isUnlocked ? 'locked-card' : ''} ${isHardLocked ? 'hard-locked' : ''}`}
              style={{
                background: lvl.dark ? undefined : lvl.bg,
borderColor: lvl.border,
                animationDelay: `${i * 0.055}s`,
                position: 'relative',
                cursor: !isUnlocked ? 'pointer' : 'pointer'
              }}
              onClick={() => onPickLevel(lvl.id)}
            >
              {/* LOCK OVERLAY */}
              {!isUnlocked && (
                <div className="lock-overlay" style={{borderRadius: '20px'}}>
                  <div className="lock-icon">{isNextToUnlock ? '🔓' : '🔒'}</div>
                  <div className="lock-text">
                    {lockText ? lockText(lvl, isNextToUnlock) : 'Locked'}
                  </div>
                </div>
              )}

              {/* Change number badge color to gray if locked */}
              <span className="lpp-card-num" style={{ background: isUnlocked ? lvl.color : '#aaaaaa' }}>{lvl.num}</span>

              {/* Change tag colors to gray if locked */}
              <span className="lpp-card-tag"
                style={{
                  color: isUnlocked ? lvl.tagColor : '#777777',
                  borderColor: isUnlocked ? lvl.border : '#bbbbbb',
                  background: isUnlocked ? (lvl.dark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.72)') : '#e0e0e0',
                }}>
                {lvl.tag}
              </span>

              {/* Apply grayscale to emoji if locked */}
              <div className="lpp-card-emoji" style={{ filter: isUnlocked ? 'drop-shadow(0 3px 5px rgba(0,0,0,0.14))' : 'grayscale(100%) opacity(0.6)' }}>
                {lvl.emoji}
              </div>

              {/* Title and description colors adjusted for locked state */}
              <div className="lpp-card-title" style={{ color: isUnlocked ? lvl.tagColor : '#666666' }}>
                {lvl.title}
              </div>
              <div className="lpp-card-desc" style={{ color: isUnlocked ? (lvl.dark ? '#aaa' : undefined) : '#888888' }}>
                {lvl.desc}
              </div>

              {cardExtra && cardExtra(lvl)}

              {isUnlocked && (
                <div className="lpp-card-play" style={{ background: lvl.color }}>
                  ▶ Play
                </div>
              )}
            </button>
          );
        })}
      </div>
    </main>
  );

  return (
    <main className="lpp-game-page">
      <div className="lpp-topbar">
        <button className="lpp-back-btn" onClick={onBack}>← All Levels</button>

        <div className="lpp-topbar-level">
          <span>{activeMeta?.emoji}</span>
          <span>Level {activeMeta?.num} — {activeMeta?.title}</span>
        </div>

        <div className="lpp-topbar-jumps">
          {levels.map(lvl => {
            const levelNumber = lvl.num || lvl.id;
            const isLvlUnlocked = levelNumber <= unlockedLevel;

            return (
              <button
                key={lvl.id}
                className={`lpp-jump-btn ${activeLevel === lvl.id ? 'active' : ''} ${!isLvlUnlocked ? 'jump-locked' : ''}`}
                style={activeLevel === lvl.id ? { background: lvl.color, color: 'white', borderColor: lvl.color } : {}}
                onClick={() => onPickLevel(lvl.id)}
                title={!isLvlUnlocked ? 'Locked' : lvl.title}
              >
                {!isLvlUnlocked ? '🔒' : (jumpLabel ? jumpLabel(lvl) : lvl.emoji)}
              </button>
            );
          })}
        </div>
      </div>
      {children}
    </main>
  );
}