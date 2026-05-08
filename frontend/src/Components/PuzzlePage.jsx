import React, { useEffect, useState, useMemo } from 'react';
import usePlaceData from '../Hooks/usePlaceData';
import useFoodData from '../Hooks/useFoodData';
import useFestivalData from '../Hooks/useFestivalData';
import useWearData from '../Hooks/useWearData';
import WinningAnimation from '../Components/WinningAnimation';
import { CustomAlertModal, StoreModal, ConfirmActionModal } from './SharedModals'; 
import '../Css/Puzzle.css';
import { trackScore } from '../Hooks/useApi';
import { useEconomy } from '../Hooks/EconomyContext'; 

const ROUNDS = [
  { n: 1, grid: 3, label: 'Easy', sub: '3x3 Grid', emoji: '🌱', color: '#06d6a0' },
  { n: 2, grid: 4, label: 'Medium', sub: '4x4 Grid', emoji: '🔥', color: '#FF9933' },
  { n: 3, grid: 5, label: 'Hard', sub: '5x5 Grid', emoji: '💎', color: '#d62828' },
];

const LEVEL_NUMS = {
  'map': 1, 'symbols': 2, 'food': 3, 'place': 4,
  'festival': 5, 'wear': 6, 'mix': 7
};

const isSuitable = img => img.width >= 300 && img.height >= 300 && Math.abs(img.width - img.height) < 150;

async function pickImage(list) {
  const tried = new Set();
  while (tried.size < list.length) {
    const index = Math.floor(Math.random() * list.length);
    const item = list[index];
    const url = item.url;
    if (tried.has(url)) continue;
    tried.add(url);
    const ok = await new Promise(res => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => res(isSuitable(img));
      img.onerror = () => res(false);
      img.src = url;
    });
    if (ok) return item; 
  }
  return list[0] || null;
}

const getLevelHints = (levelNum) => {
  if (levelNum <= 3) return 3;
  if (levelNum <= 5) return 2;
  return 1;
};

// 🌟 KEYS: Cost to unlock early (1.1 is never locked)
const getRoundKeyCost = (cat, levelNum, rIdx) => {
  if (levelNum === 1 && rIdx === 0) return 0; // 1.1 is ALWAYS FREE
  if (cat === 'map') return 1;                   
  if (cat === 'symbols' || cat === 'food') return 2; 
  if (cat === 'place' || cat === 'festival') return 3; 
  if (cat === 'wear' || cat === 'mix') return 5;     
  return 2;
};

// 🌟 COINS: Cost to play (1.1 is Free, rest cost coins)
const getRoundCoinCost = (cat, levelNum, rIdx) => {
  if (levelNum === 1 && rIdx === 0) return 0; // 🌟 1.1 is ALWAYS FREE
  if (cat === 'map') return [11, 11, 11][rIdx]; // Fallback for 1.2 and 1.3
  if (cat === 'symbols') return [11, 11, 13][rIdx];
  if (cat === 'food') return [11, 13, 13][rIdx];
  if (cat === 'place' || cat === 'festival') return [13, 13, 13][rIdx];
  if (cat === 'wear' || cat === 'mix') return [17, 17, 17][rIdx];
  return 11;
};

const getRoundPoints = (cat, rIdx) => {
  const earlyLevels = ['map', 'symbols', 'food'];
  if (earlyLevels.includes(cat)) return [10, 20, 30][rIdx];
  return [20, 30, 50][rIdx];
};

export default function PuzzlePage({ category, onBack, onLevelComplete }) {
  const userId = localStorage.getItem("userId");
  const levelNum = LEVEL_NUMS[category] || 1;
  const maxHints = getLevelHints(levelNum); 

  const placeData = usePlaceData(null, true) || [];
  const foodData = useFoodData(null, true) || [];
  const festivalData = useFestivalData(null, true) || [];
  const wearData = useWearData(null, true) || [];
  
  const { coins, setCoins, keys, setKeys, showStore, setShowStore, gameScores, updateScoreData, unlockedLevels, setGameUnlock } = useEconomy(); 
  const [customAlert, setCustomAlert] = useState(null); 
  const [confirmAction, setConfirmAction] = useState(null); 

  const [symbolsData, setSymbolsData] = useState([]);
  useEffect(() => {
    fetch('http://localhost:8081/api/symbols')
      .then(res => { if (!res.ok) throw new Error("HTTP error!"); return res.json(); })
      .then(data => { if (Array.isArray(data)) setSymbolsData(data); })
      .catch(console.error);
  }, []);

  const scoreKey = `puzzle_${category}_scores`;
  const roundScores = gameScores[scoreKey] || [null, null, null];
  const setRoundScores = (val) => updateScoreData(scoreKey, val);

  const imagePool = useMemo(() => {
    if (category === 'map') return [{ url: '/image/IndiaMap.jpeg', name: 'Map of India' }]; 
    let raw = [];
    if (category === 'symbols') raw = symbolsData;
    if (category === 'food') raw = foodData;
    if (category === 'place') raw = placeData;
    if (category === 'festival') raw = festivalData;
    if (category === 'wear') raw = wearData;
    if (category === 'mix') raw = [...symbolsData, ...foodData, ...placeData, ...festivalData, ...wearData];
    
    return raw.filter(i => i.image || i.imageUrl).map(i => ({
        url: i.image || i.imageUrl,
        name: i.name || i.title || 'Indian Culture'
    }));
  }, [category, symbolsData, placeData, foodData, festivalData, wearData]);

  const [roundIdx, setRoundIdx] = useState(0);
  const [phase, setPhase] = useState('round-select'); 
  const [currentImageObj, setCurrentImageObj] = useState(null); 
  const imageUrl = currentImageObj?.url; 
  
  const [pieces, setPieces] = useState([]);  
  const [board, setBoard] = useState([]);  
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null); 
  const [showPreview, setShowPreview] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [usedImages, setUsedImages] = useState([]);
  const [score, setScore] = useState(0); 
  const [hintsLeft, setHintsLeft] = useState(maxHints); 

  const puzzleFloatVal = Math.round((unlockedLevels.puzzle || 1.1) * 10); 
  const isRoundUnlocked = (rIdx) => puzzleFloatVal >= (levelNum * 10 + rIdx + 1);

  const handleStartRoundClick = (rIdx) => {
    const coinCost = getRoundCoinCost(category, levelNum, rIdx); 
    if (coins < coinCost) {
        setCustomAlert({ type: 'warning', icon: '🪙', title: 'Out of Coins!', text: `You need ${coinCost} Coins to play this round! \nVisit the Store to get more.` });
        setShowStore(true);
        return;
    }
    
    if (coinCost === 0) {
        setConfirmAction({ type: 'play', cost: 0, rIdx });
        executeConfirm({ type: 'play', cost: 0, rIdx }); 
    } else {
        setConfirmAction({
            type: 'play', cost: coinCost, rIdx: rIdx,
            title: 'Play Round', icon: '🪙', color: '#FF9933',
            message: `Are you sure you want to spend 🪙 ${coinCost} Coins to play this round?`
        });
    }
  };

  const handleUnlockRoundClick = (rIdx) => {
    if (rIdx > 0 && !isRoundUnlocked(rIdx - 1)) {
        setCustomAlert({ type: 'error', icon: '🔒', title: 'Round Locked', text: 'You must unlock the previous round first!' });
        return;
    }
    const keyCost = getRoundKeyCost(category, levelNum, rIdx);
    if (keys < keyCost) {
        setCustomAlert({ type: 'warning', icon: '🗝️', title: 'Out of Keys!', text: `You need ${keyCost} Keys to unlock this round early! \nVisit the Store to get more.` });
        setShowStore(true);
        return;
    }
    setConfirmAction({
        type: 'unlock', cost: keyCost, rIdx: rIdx,
        title: 'Unlock Round', icon: '🗝️', color: '#06d6a0',
        message: `Are you sure you want to spend 🗝️ ${keyCost} Keys to unlock this round early?`
    });
  };

  const executeConfirm = async (actionOverride) => {
    const { type, rIdx, cost } = actionOverride || confirmAction;
    setConfirmAction(null);

    if (type === 'play') {
        if (cost > 0) {
          const newCoins = coins - cost;
          setCoins(newCoins);
          try {
            await fetch(`http://localhost:8081/api/progress/currency/${userId}`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coins: newCoins, keysCount: keys })
            });
          } catch(err) { console.error(err); }
        }
        setRoundIdx(rIdx); setScore(0); setCurrentImageObj(null); setPhase('loading');
    }

    if (type === 'unlock') {
        const newKeys = keys - cost;
        setKeys(newKeys);
        const nextValStr = levelNum * 10 + rIdx + 1; 
        setGameUnlock('puzzle', nextValStr / 10); 

        try {
          await fetch(`http://localhost:8081/api/progress/currency/${userId}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coins: coins, keysCount: newKeys })
          });
        } catch(err) { console.error(err); }
        setCustomAlert({ type: 'success', icon: '🔓', title: 'Round Unlocked!', text: `Round ${rIdx + 1} is now unlocked! You can now play it using coins.` });
    }
  };

  useEffect(() => {
    if (!imagePool.length || phase !== 'loading') return;
    if (category === 'map') {
        setCurrentImageObj(imagePool[0]); setUsedImages(prev => [...prev, imagePool[0].url]); return;
    }
    const fresh = imagePool.filter(u => !usedImages.includes(u.url));
    const pool = fresh.length ? fresh : imagePool; 

    pickImage(pool).then(item => {
      if (!item) return;
      setCurrentImageObj(item); setUsedImages(prev => [...prev, item.url]);
    });
  }, [imagePool, phase, category, usedImages]);

  useEffect(() => {
    if (!imageUrl || phase !== 'loading') return;
    const grid = ROUNDS[roundIdx].grid;
    const total = grid * grid;
    const order = Array.from({ length: total }, (_, i) => i);
    const shuffled = [...order].sort(() => Math.random() - 0.5);
    setPieces(shuffled); setBoard(Array(total).fill(null)); setSubmitted(false); setResult(null);
    setHintsLeft(maxHints); 
    setShowPreview(true); setPhase('preview');
    setTimeout(() => { setShowPreview(false); setPhase('playing'); }, 3000);
  }, [imageUrl, roundIdx, maxHints]);

  const onDragStart = (e, fromBoard, index) => {
    e.dataTransfer.setData('fromBoard', fromBoard); e.dataTransfer.setData('index', index);
  };

  const onDrop = (e, dropIdx) => {
    if (submitted) return;
    const fromBoard = e.dataTransfer.getData('fromBoard') === 'true';
    const index = parseInt(e.dataTransfer.getData('index'), 10);
    if (isNaN(index)) return;

    const boardCopy = [...board];
    if (fromBoard) {
      const temp = boardCopy[dropIdx];
      boardCopy[dropIdx] = boardCopy[index]; boardCopy[index] = temp;
    } else {
      if (boardCopy[dropIdx] !== null) return;
      boardCopy[dropIdx] = pieces[index];
      const newPieces = [...pieces]; newPieces.splice(index, 1); setPieces(newPieces);
    }
    setBoard(boardCopy);
  };

  const handleHint = () => {
    if (submitted || hintsLeft <= 0 || phase !== 'playing') return;
    setShowPreview(true); setHintsLeft(h => h - 1);
    setTimeout(() => setShowPreview(false), 3000);
  };

  const handleSubmit = () => {
    if (board.includes(null)) return;
    const correct = board.every((v, i) => v === i);
    setResult(correct ? 'correct' : 'wrong'); setSubmitted(true);
  };

  const handleRestart = () => {
    const grid = ROUNDS[roundIdx].grid;
    const total = grid * grid;
    const shuffled = Array.from({ length: total }, (_, i) => i).sort(() => Math.random() - 0.5);
    setPieces(shuffled); setBoard(Array(total).fill(null)); setSubmitted(false); setResult(null);
    setHintsLeft(maxHints); 
    setShowPreview(true); setPhase('preview');
    setTimeout(() => { setShowPreview(false); setPhase('playing'); }, 3000);
  };

  const handleNext = async () => {
    if (result === 'correct') {
        const ptsEarned = getRoundPoints(category, roundIdx);
        const coinsEarned = ptsEarned; 

        trackScore('puzzle', ptsEarned, `Round ${roundIdx + 1}`);
        setScore(s => s + ptsEarned);

        setRoundScores(prev => {
            const newScores = [...(prev || [null, null, null])];
            newScores[roundIdx] = Math.max(newScores[roundIdx] || 0, ptsEarned); 
            return newScores;
        });

        // 🌟 AUTOMATIC PROGRESSION: Unlocks the next round OR Next Level for FREE
        let nextValStr = levelNum * 10 + roundIdx + 2; // e.g. 1.1 -> 1.2
        if (roundIdx === 2) nextValStr = (levelNum + 1) * 10 + 1; // e.g. beat Round 3 (1.3) -> Unlocks Next Level (2.1)
        
        if (nextValStr > puzzleFloatVal) {
            setGameUnlock('puzzle', nextValStr / 10); 
            if (nextValStr >= 51 && (unlockedLevels.matching || 0) < 1) {
                setGameUnlock('matching', 1);
                setTimeout(() => setCustomAlert({ type: 'success', icon: '🎴', title: 'Matching Unlocked!', text: 'You cleared the requirements! The Matching Game is now unlocked!'}), 800);
            }
        }

        const newCoins = coins + coinsEarned;
        setCoins(newCoins);
        try {
          await fetch(`http://localhost:8081/api/progress/currency/${userId}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coins: newCoins, keysCount: keys })
          });
        } catch (err) { console.error(err); }

        if (roundIdx + 1 >= ROUNDS.length) {
            setShowWin(true); setPhase('level-win');
            if (onLevelComplete) onLevelComplete(); 
        } else setPhase('round-win');
    } else setPhase('round-fail');
  };

  const updateCurrencyDB = async (c, k) => {
    try {
      await fetch(`http://localhost:8081/api/progress/currency/${userId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coins: c, keysCount: k }) });
    } catch (err) { console.error(err); }
  };

  const watchAd = async () => { const c = coins+50, k = keys+1; setCoins(c); setKeys(k); setShowStore(false); setCustomAlert({ type: 'success', icon: '📺', title: 'Reward Claimed!', text: '+50 Coins and +1 Key.' }); await updateCurrencyDB(c, k); };
  const buyTokens = async () => { const c = coins+500, k = keys+10; setCoins(c); setKeys(k); setShowStore(false); setCustomAlert({ type: 'success', icon: '💳', title: 'Purchase Successful!', text: '+500 Coins and +10 Keys.' }); await updateCurrencyDB(c, k); };
  const claimDaily = async () => { const c = coins+100, k = keys+3; setCoins(c); setKeys(k); setShowStore(false); setCustomAlert({ type: 'success', icon: '🎁', title: 'Daily Reward Claimed!', text: '+100 Coins and +3 Keys.' }); await updateCurrencyDB(c, k); };
  const buyMegaPack = async () => { const c = coins+2000, k = keys+50; setCoins(c); setKeys(k); setShowStore(false); setCustomAlert({ type: 'success', icon: '💎', title: 'Mega Pack Purchased!', text: '+2000 Coins and +50 Keys.' }); await updateCurrencyDB(c, k); };

  const tileSize = useMemo(() => {
    const grid = ROUNDS[roundIdx].grid;
    if (grid === 3) return 100;
    if (grid === 4) return 76;
    return 58; 
  }, [roundIdx]);

  const grid = ROUNDS[roundIdx].grid;
  const roundMeta = ROUNDS[roundIdx];
  const roundPlayCost = getRoundCoinCost(category, levelNum, roundIdx);
  const potentialPoints = getRoundPoints(category, roundIdx);

  if (phase === 'round-select') {
    return (
        <>
            <div style={{maxWidth: '500px', margin: '40px auto', textAlign: 'center', background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}>
                <h2 style={{fontFamily: "'Baloo 2', cursive", fontSize: '2rem', color: '#1a2340', marginBottom: '20px'}}>Puzzle Rounds</h2>
                <p style={{color: '#666', marginBottom: '20px'}}>Level {levelNum} allows <strong>{maxHints} Hints</strong> per round.</p>
                <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                    {ROUNDS.map((r, i) => {
                        const isUnlocked = isRoundUnlocked(i);
                        const score = roundScores[i];
                        const playCost = getRoundCoinCost(category, levelNum, i);
                        const unlockCost = getRoundKeyCost(category, levelNum, i);
                        const displayPlayCost = playCost === 0 ? 'Free' : `🪙 ${playCost}`;
                        
                        return (
                            <button key={i} onClick={() => isUnlocked ? handleStartRoundClick(i) : handleUnlockRoundClick(i)}
                                style={{
                                    padding: '15px 20px', borderRadius: '15px', border: `2px solid ${isUnlocked ? r.color : '#e0e0e0'}`,
                                    background: isUnlocked ? '#fff' : '#f9f9f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    cursor: 'pointer', opacity: isUnlocked ? 1 : 0.8, fontSize: '1.1rem', fontWeight: 'bold', color: '#333',
                                    boxShadow: isUnlocked ? '0 4px 0 ' + r.color : 'none'
                                }}
                            >
                                <span>{isUnlocked ? r.emoji : '🔒'} {r.label} ({r.grid}x{r.grid})</span>
                                <span style={{fontSize: '0.9rem', color: isUnlocked ? '#f57f17' : '#999'}}>
                                    {isUnlocked ? (
                                        score !== null ? <span style={{color: '#138808'}}>✅ {score} Pts</span> : `Play ${displayPlayCost}`
                                    ) : (
                                        `Unlock 🗝️ ${unlockCost}`
                                    )}
                                </span>
                            </button>
                        )
                    })}
                </div>
                <button className="pz-restart-btn" style={{marginTop: '25px', width: '100%', borderColor: '#ccc', color: '#666'}} onClick={onBack}>← Back to Levels</button>
            </div>
            
            <ConfirmActionModal 
                confirmAction={confirmAction} 
                onConfirm={() => executeConfirm()} 
                onCancel={() => setConfirmAction(null)} 
            />

            <CustomAlertModal alert={customAlert} onClose={() => setCustomAlert(null)} />
            <StoreModal show={showStore} onClose={() => setShowStore(false)} onWatchAd={watchAd} onBuyTokens={buyTokens} onDailyReward={claimDaily} onBuyMegaPack={buyMegaPack} />
        </>
    );
  }

  if (phase === 'loading') return (
    <div className="pz-loading"><div className="pz-spinner" style={{ borderTopColor: roundMeta.color }} /><p>Loading puzzle…</p></div>
  );

  const renderRecap = () => (
    <div style={{ background: '#f0f8ff', borderRadius: '15px', padding: '15px', margin: '20px 0', border: '2px solid #b3e0ff' }}>
        <p style={{ color: '#005f80', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '5px', textTransform: 'uppercase' }}>🧩 You pieced together:</p>
        <img src={imageUrl} alt="Recap" style={{ width: '100%', maxHeight: '160px', objectFit: 'contain', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
        <h3 style={{ color: '#1a2340', marginTop: '12px', fontSize: '1.2rem', wordWrap: 'break-word', fontFamily: "'Baloo 2', cursive" }}>{currentImageObj?.name}</h3>
    </div>
  );

  if (phase === 'round-win') {
    return (
      <div className="pz-done">
        <div className="pz-done-emoji">🏆</div>
        <h2 className="pz-done-title">{roundMeta.label} Complete!</h2>
        
        {renderRecap()}

        <p className="pz-done-sub" style={{color: '#138808'}}>Awesome! You scored <strong>+{potentialPoints} Points</strong> and earned <strong>+{potentialPoints} Coins 🪙</strong>!</p>
        <button className="pz-submit-btn" style={{ background: '#4caf50', marginTop: '20px' }} onClick={() => setPhase('round-select')}>▶ Next Round</button>
      </div>
    );
  }

  if (phase === 'round-fail') {
    const displayPlayCost = roundPlayCost === 0 ? 'Free' : `🪙 ${roundPlayCost}`;
    return (
      <div className="pz-done">
        <div className="pz-done-emoji" style={{filter: 'grayscale(100%)'}}>💔</div>
        <h2 className="pz-done-title" style={{color: '#d62828'}}>Round Failed</h2>
        <p className="pz-done-sub">That wasn't quite right. Don't worry, you can try again!</p>
        <button className="pz-submit-btn" style={{ background: '#FF9933', marginTop: '20px' }} onClick={() => handleStartRoundClick(roundIdx)}>🔄 Retry ({displayPlayCost})</button>
        <button className="pz-restart-btn" style={{marginTop: '15px'}} onClick={() => setPhase('round-select')}>← Back to Menu</button>
      </div>
    );
  }

  if (phase === 'level-win') {
    return (
      <div className="pz-done" style={{position: 'relative'}}>
        {showWin && <WinningAnimation onAnimationEnd={() => setShowWin(false)} />}
        <div className="pz-done-emoji">🏆</div>
        <h2 className="pz-done-title">Level Complete!</h2>

        {renderRecap()}

        <p className="pz-done-sub" style={{color: '#138808'}}>🎉 You scored +{score} Points and earned +{score} Coins total!</p>
        <button className="pz-submit-btn" style={{ background: '#0077b6', marginTop: '20px' }} onClick={onBack}>← Back to Levels</button>
        <button className="pz-restart-btn" style={{marginTop: '15px'}} onClick={() => setPhase('round-select')}>🔄 View Scores</button>
      </div>
    );
  }

  const canSubmit = !submitted && !board.includes(null);

  return (
    <div className="pz-wrapper">
      <div className="pz-topbar">
        <button className="pz-back-btn" onClick={() => setPhase('round-select')}>BACK</button>
        <span className="pz-round-chip" style={{ background: roundMeta.color }}>
          {roundMeta.emoji} {roundMeta.label} Mode · {grid}×{grid}
        </span>
      </div>

      <div className="pz-sub-row">
        <div className="pz-hint-row">
          {Array.from({ length: maxHints }).map((_, i) => (
            <span key={i} className={`pz-hint-dot${i >= hintsLeft ? ' used' : ''}`}>💡</span>
          ))}
          {maxHints > 0 && (
            <button className="pz-hint-btn" onClick={handleHint} disabled={submitted || hintsLeft <= 0} style={{ borderColor: roundMeta.color, color: roundMeta.color }}>
              Hint ({hintsLeft})
            </button>
          )}
        </div>
      </div>

      {result && (
        <div className={`pz-feedback ${result}`}>
          {result === 'correct' ? `🎉 Perfect! +${potentialPoints} Points!` : '❌ Not quite right!'}
        </div>
      )}

      <div className="pz-container">
        <div className="pz-pieces-panel" style={{ borderColor: roundMeta.color }}>
          <span className="pz-panel-label">🧩 Pieces</span>
          {pieces.map((val, i) => (
            <div key={i} className="pz-tile draggable" draggable={!submitted} onDragStart={e => onDragStart(e, false, i)}
              style={{
                width: tileSize, height: tileSize, backgroundImage: `url(${imageUrl})`,
                backgroundPosition: `${-(val % grid) * tileSize}px ${-Math.floor(val / grid) * tileSize}px`,
                backgroundSize: `${grid * tileSize}px ${grid * tileSize}px`,
              }}
            />
          ))}
          {pieces.length === 0 && !submitted && <p className="pz-panel-empty">✅ All placed!</p>}
        </div>

        <div className="pz-grid" style={{ gridTemplateColumns: `repeat(${grid}, ${tileSize}px)`, gridTemplateRows: `repeat(${grid}, ${tileSize}px)`, borderColor: roundMeta.color }}>
          {board.map((val, idx) => (
            <div key={idx} className="pz-drop-cell" style={{ width: tileSize, height: tileSize }} onDragOver={e => e.preventDefault()} onDrop={e => onDrop(e, idx)}>
              {val !== null ? (
                <div className="pz-tile draggable" draggable={!submitted} onDragStart={e => onDragStart(e, true, idx)}
                  style={{
                    width: tileSize, height: tileSize, backgroundImage: `url(${imageUrl})`,
                    backgroundPosition: `${-(val % grid) * tileSize}px ${-Math.floor(val / grid) * tileSize}px`,
                    backgroundSize: `${grid * tileSize}px ${grid * tileSize}px`,
                  }}
                />
              ) : (
                <div className="pz-tile empty" style={{ width: tileSize, height: tileSize }} />
              )}
            </div>
          ))}
        </div>

        {submitted && imageUrl && (
          <div className="pz-reference">
            <p className="pz-ref-label">🖼️ Original</p>
            <img src={imageUrl} alt="original" className="pz-ref-img" />
          </div>
        )}
      </div>

      <div className="pz-buttons">
        <button className="pz-restart-btn" onClick={handleRestart} style={{ borderColor: roundMeta.color, color: roundMeta.color }}>↺ Restart</button>
        {!submitted && ( <button className="pz-submit-btn" onClick={handleSubmit} disabled={!canSubmit} style={{ background: canSubmit ? roundMeta.color : '#e0e0e0', color: canSubmit ? 'white' : '#aaa' }}>✔ Submit</button> )}
        {submitted && ( <button className="pz-submit-btn" onClick={handleNext} style={{ background: result === 'correct' ? roundMeta.color : '#f44336' }}>{result === 'correct' ? 'Next →' : '↻ Continue'}</button> )}
      </div>

      {showPreview && imageUrl && (
        <div className="pz-preview-overlay">
          <img src={imageUrl} alt="preview" className="pz-preview-img" />
          <p className="pz-preview-label">👀 Memorise this!</p>
        </div>
      )}
    </div>
  );
}