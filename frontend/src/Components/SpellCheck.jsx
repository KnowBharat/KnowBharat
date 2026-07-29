import React, { useState, useEffect, useMemo, useCallback } from 'react';
import useStateData from '../Hooks/useStateData';
import useCategoryData from '../Hooks/useCategoryData';
import WinningAnimation from './WinningAnimation';
import { CustomAlertModal, StoreModal, ConfirmActionModal } from './SharedModals'; 
import '../Css/SpellCheck.css';
import { trackScore } from '../Hooks/useApi';
import { useEconomy } from '../Hooks/EconomyContext'; 
import { API_BASE_URL } from '../Hooks/config';
import useGameModal from '../Hooks/useGameModal';

const BASE = `${API_BASE_URL}/api`;
const QS_PER_ROUND = 5;
const MIN_CORRECT_TO_PASS = 3; 
const QWERTY = "QWERTYUIOPASDFGHJKLZXCVBNM".split('');

const ROUNDS = [
  { n: 1, label: 'Easy', sub: 'Pre-filled Letters', emoji: '🌱', color: '#06d6a0', hints: 3, points: 10 },
  { n: 2, label: 'Medium', sub: 'Scrambled Tiles', emoji: '🔥', color: '#FF9933', hints: 2, points: 20 },
  { n: 3, label: 'Hard', sub: 'Keyboard Only', emoji: '💎', color: '#d62828', hints: 1, points: 30 },
];

const LEVEL_NUMS = {
  'symbols': 1, 'capital': 2, 'language': 3, 'food': 4,
  'place': 5, 'festival': 6, 'wear': 7, 'mix': 8
};

const getRoundKeyCost = (cat, levelNum, rIdx) => {
  if (levelNum === 1 && rIdx === 0) return 0;                
  if (levelNum >= 1 && levelNum <= 3) return 3; 
  if (levelNum >= 4 && levelNum <= 6) return 5; 
  if (levelNum >= 7 && levelNum <= 8) return 7;     
  return 3;
};

const getRoundCoinCost = (cat, levelNum, rIdx) => {
  if (levelNum === 1 && rIdx === 0) return 0; 
  if (levelNum >= 1 && levelNum <= 3) return [13, 13, 17][rIdx]; 
  if (levelNum >= 4 && levelNum <= 6) return [17, 17, 21][rIdx];
  if (levelNum >= 7 && levelNum <= 8) return [21, 21, 25][rIdx];
  return 15;
};

const shuffle = arr => [...arr].sort(() => 0.5 - Math.random());

function buildRoundPools(pool) {
  const sorted = [...pool].sort((a, b) => a.answer.length - b.answer.length);
  const third = Math.ceil(sorted.length / 3);
  return [
    sorted.slice(0, third),                  
    sorted.slice(third, third * 2),          
    sorted.slice(third * 2),                 
  ];
}

export default function SpellCheck({ category, onBack, onLevelComplete }) {
  const { stateData } = useStateData();
  const foodData     = useCategoryData('foods', null, true) || [];
const placeData    = useCategoryData('places', null, true) || [];
const festivalData = useCategoryData('festivals', null, true) || [];
const wearData     = useCategoryData('wears', null, true) || [];
  
  const userId = localStorage.getItem("userId");
  const levelNum = LEVEL_NUMS[category] || 1;
const { 
    showStore, setShowStore, confirmAction, setConfirmAction, customAlert, setCustomAlert, 
    claimDaily, watchAdCoins, watchAdKeys, 
    buyCoinPack1, buyCoinPack2, buyCoinPack3,
    buyKeyPack1, buyKeyPack2, buyKeyPack3,
    buyCombo1, buyCombo2
  } = useGameModal();
  const { 

    coins, setCoins, keys, setKeys, 

    unlockedLevels, setGameUnlock, gameScores, updateScoreData 

  } = useEconomy();
  const [symbolsData, setSymbolsData] = useState([]);
  useEffect(() => {
    fetch(`${BASE}/symbols`)
      .then(res => res.ok ? res.json() : [])
      .then(data => { if (Array.isArray(data)) setSymbolsData(data); })
      .catch(console.error);
  }, []);

  const unlockKey = `spell_${category}_unlocks`;
  const scoreKey = `spell_${category}_scores`;

  const roundScores = gameScores[scoreKey] || [null, null, null];
  const setRoundScores = (val) => updateScoreData(scoreKey, val);

  const dataReady = useMemo(() => {
    if (category === 'symbols') return symbolsData.length > 0;
    if (category === 'capital' || category === 'language') return Object.keys(stateData).length > 0;
    if (category === 'food') return foodData.length > 0;
    if (category === 'place') return placeData.length > 0;
    if (category === 'festival') return festivalData.length > 0;
    if (category === 'wear') return wearData.length > 0;
    if (category === 'mix') return foodData.length > 0 && placeData.length > 0 && symbolsData.length > 0 && Object.keys(stateData).length > 0;
    return false;
  }, [category, symbolsData, stateData, foodData, placeData, festivalData, wearData]);

  const [rounds, setRounds] = useState(null); 
  const [roundIdx, setRoundIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [roundScore, setRoundScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0); 
  const [phase, setPhase] = useState('loading'); 
  const [showWin, setShowWin] = useState(false);

  const [shuffledLetters, setShuffledLetters] = useState([]);
  const [userAnswer, setUserAnswer] = useState([]);
  const [hintedIndexes, setHintedIndexes] = useState([]);
  const [hintsLeft, setHintsLeft] = useState(ROUNDS[0].hints);
  const [result, setResult] = useState(null);

  const spellFloatVal = Math.round((unlockedLevels.spell || 1.1) * 10); 
  
  const isRoundUnlocked = (rIdx) => {
    const requiredVal = levelNum * 10 + rIdx + 1; 
    return spellFloatVal >= requiredVal;
  };

  // Dynamic Subtitle Text for the Menu!
  const getRoundSub = (rIdx) => {
    if (rIdx === 0) return 'Pre-filled Letters';
    if (rIdx === 1) return 'Scrambled Tiles';
    if (rIdx === 2) return levelNum <= 4 ? 'Scrambled Tiles' : 'Keyboard Only';
    return '';
  };

  // Logical switch. Early levels never use the full keyboard!
  const useScrambled = roundIdx < 2 || levelNum <= 4;

  useEffect(() => {
    if (!dataReady || rounds !== null) return;

    let pool = [];
    const stateList = Object.values(stateData);

    if (category === 'symbols') pool = symbolsData.map(s => ({ answer: s.name, type: s.category, imageUrl: s.imageUrl || null, prompt: `National ${s.title}` }));
    if (category === 'capital') pool = stateList.map(s => ({ answer: s.capital, type: 'Capital', imageUrl: null, prompt: `Capital of ${s.name}` }));
    if (category === 'language') pool = stateList.map(s => ({ answer: s.language, type: 'Language', imageUrl: null, prompt: `Language spoken in ${s.name}` }));
    if (category === 'food') pool = foodData.map(s => ({ answer: s.name, type: 'Food', imageUrl: s.image || s.imageUrl, prompt: `Famous food from ${s.state?.name}` }));
    if (category === 'place') pool = placeData.map(s => ({ answer: s.name, type: 'Place', imageUrl: s.image || s.imageUrl, prompt: `Tourist place in ${s.state?.name}` }));
    if (category === 'festival') pool = festivalData.map(s => ({ answer: s.name, type: 'Festival', imageUrl: s.image || s.imageUrl, prompt: `Festival in ${s.state?.name}` }));
    if (category === 'wear') pool = wearData.map(s => ({ answer: s.menWear, type: 'Clothing', imageUrl: s.image || s.imageUrl, prompt: `Traditional wear of ${s.state?.name}` }));
    if (category === 'mix') {
        pool = [
            ...symbolsData.map(s => ({ answer: s.name, type: 'Symbol', imageUrl: s.imageUrl, prompt: `National ${s.title}` })),
            ...stateList.map(s => ({ answer: s.capital, type: 'Capital', imageUrl: null, prompt: `Capital of ${s.name}` })),
            ...foodData.map(s => ({ answer: s.name, type: 'Food', imageUrl: s.image || s.imageUrl, prompt: `Famous food from ${s.state?.name}` })),
            ...festivalData.map(s => ({ answer: s.name, type: 'Festival', imageUrl: s.image || s.imageUrl, prompt: `Festival in ${s.state?.name}` })),
        ];
    }

    pool = pool.filter(i => i.answer && i.answer.trim().length > 0);

    const [easy, med, hard] = buildRoundPools(pool);
    const built = [
      shuffle(easy).slice(0, QS_PER_ROUND),
      shuffle(med).slice(0, QS_PER_ROUND),
      shuffle(hard).slice(0, QS_PER_ROUND),
    ];

    const safe = built.map((bucket, ri) => {
      const src = [easy, med, hard][ri];
      if (bucket.length < QS_PER_ROUND) {
        const cycled = [];
        for (let i = 0; i < QS_PER_ROUND; i++) cycled.push(src[i % src.length]);
        return cycled;
      }
      return bucket;
    });

    setRounds(safe);
    setPhase('round-select');
  }, [dataReady, category, rounds, foodData, placeData, festivalData, wearData, symbolsData, stateData]);

  const handleStartRoundClick = (rIdx) => {
    const coinCost = getRoundCoinCost(category, levelNum, rIdx); 
    if (coins < coinCost) {
        setCustomAlert({ type: 'warning', icon: '🪙', title: 'Out of Coins!', text: `You need ${coinCost} Coins to play this round! \nVisit the Store to get more.` });
        setShowStore(true);
        return;
    }
    
    if (coinCost === 0) {
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

  const startRoundLogic = (rIdx) => {
    setRoundIdx(rIdx); 
    setQIdx(0); 
    setRoundScore(0); 
    setScore(0); 
    setCorrectCount(0); 
    initQuestion(rounds[rIdx][0], ROUNDS[rIdx].hints, rIdx);
    setPhase('playing');
  }

  const executeConfirm = async (actionOverride) => {
    const { type, rIdx, cost } = actionOverride || confirmAction;
    setConfirmAction(null);

    if (type === 'play') {
        if (cost > 0) {
          const newCoins = coins - cost;
          setCoins(newCoins);
          try {
            await fetch(`${BASE}/auth/progress/currency/${userId}`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coins: newCoins, keysCount: keys })
            });
          } catch(err) { console.error(err); }
        }
        startRoundLogic(rIdx);
    }

    if (type === 'unlock') {
        const newKeys = keys - cost;
        setKeys(newKeys);
        const nextValStr = levelNum * 10 + rIdx + 1; 
        setGameUnlock('spell', nextValStr / 10); 

        try {
          await fetch(`${BASE}/auth/progress/currency/${userId}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coins: coins, keysCount: newKeys })
          });
        } catch(err) { console.error(err); }
        setCustomAlert({ type: 'success', icon: '🔓', title: 'Round Unlocked!', text: `Round ${rIdx + 1} is now unlocked! You can now play it using coins.` });
    }
  };

  const initQuestion = useCallback((item, hints, currentRIdx) => {
    const rawAnswer = item.answer.toUpperCase();
    const answerArr = rawAnswer.split('');
    const newAnswer = Array(answerArr.length).fill('');
    const newHints = [];
    const poolLetters = [];

    answerArr.forEach((char, i) => {
        if (char === ' ') { newAnswer[i] = ' '; newHints.push(i); } 
        else poolLetters.push(char);
    });

    if (currentRIdx === 0) {
        const lettersToReveal = Math.max(1, Math.floor(poolLetters.length / 3));
        const emptyIndexes = newAnswer.map((char, i) => char === '' ? i : null).filter(i => i !== null);
        const shuffledEmpty = shuffle(emptyIndexes);

        for (let i = 0; i < lettersToReveal && i < shuffledEmpty.length; i++) {
            const targetIdx = shuffledEmpty[i];
            const charToReveal = answerArr[targetIdx];
            newAnswer[targetIdx] = charToReveal;
            newHints.push(targetIdx);
            const poolIdx = poolLetters.indexOf(charToReveal);
            if (poolIdx > -1) poolLetters.splice(poolIdx, 1);
        }
    }

    setShuffledLetters(shuffle(poolLetters));
    setUserAnswer(newAnswer);
    setHintedIndexes(newHints);
    setHintsLeft(hints);
    setResult(null);
  }, []);

  const handleLetterClick = (letter, idx) => {
    if (result) return;
    const newAnswer = [...userAnswer];
    const newShuffled = [...shuffledLetters];
    let placed = false;

    for (let i = 0; i < newAnswer.length; i++) {
      if (!newAnswer[i] && !hintedIndexes.includes(i)) {
        newAnswer[i] = letter; placed = true; break;
      }
    }

    // 🌟 Conditionally splice tiles based on `useScrambled`
    if (placed && useScrambled) {
        newShuffled.splice(idx, 1);
        setShuffledLetters(newShuffled);
    }
    setUserAnswer(newAnswer);
  };

  const handleBackspace = (i) => {
    if (result || hintedIndexes.includes(i) || !userAnswer[i]) return;
    const letter = userAnswer[i];
    const newAnswer = [...userAnswer];
    newAnswer[i] = '';
    setUserAnswer(newAnswer);
    
    // Conditionally return tiles based on `useScrambled`
    if (useScrambled) setShuffledLetters(prev => [...prev, letter]);
  };

  const handleHint = () => {
    if (!rounds || result || hintsLeft <= 0) return;
    const current = rounds[roundIdx][qIdx];
    const ansArr = current.answer.toUpperCase().split('');
    const newAnswer = [...userAnswer];
    const newShuffled = [...shuffledLetters];
    const newHints = [...hintedIndexes];

    const revealable = ansArr.map((ch, i) => (newAnswer[i] !== ch && !newHints.includes(i) ? i : null)).filter(i => i !== null);
    if (!revealable.length) return;

    const pick = revealable[Math.floor(Math.random() * revealable.length)];
    const ch = ansArr[pick];
    newAnswer[pick] = ch;
    newHints.push(pick);

    // Conditionally handle hint tiles based on `useScrambled`
    if (useScrambled) {
        const si = newShuffled.indexOf(ch);
        if (si !== -1) newShuffled.splice(si, 1);
        setShuffledLetters(newShuffled);
    }

    setUserAnswer(newAnswer);
    setHintedIndexes(newHints);
    setHintsLeft(h => h - 1);
  };

  const handleCheck = () => {
    const current = rounds[roundIdx][qIdx];
    const correct = current.answer.toUpperCase();
    const isRight = userAnswer.join('') === correct;
    setResult(isRight ? 'correct' : 'wrong');
    if (isRight) {
      const pointsEarned = ROUNDS[roundIdx].points;
      setScore(s => s + pointsEarned);
      setRoundScore(s => s + pointsEarned);
      setCorrectCount(c => c + 1); 
    }
  };

  const handleNext = () => {
    const isLastQ = qIdx + 1 >= QS_PER_ROUND;
    if (isLastQ) {
      const passedRound = correctCount >= MIN_CORRECT_TO_PASS; 

      if (passedRound) {
        trackScore('spelling', roundScore, `Round ${roundIdx + 1}`);

        setRoundScores(prev => {
          const newScores = [...(prev || [null, null, null])];
          if (newScores[roundIdx] === null || roundScore > newScores[roundIdx]) newScores[roundIdx] = roundScore;
          return newScores;
        });

        let nextValStr = levelNum * 10 + roundIdx + 2; 
        if (roundIdx === 2) nextValStr = (levelNum + 1) * 10 + 1; 
        
        if (nextValStr > spellFloatVal) {
            setGameUnlock('spell', nextValStr / 10); 
        }

        if (roundIdx + 1 >= ROUNDS.length) { 
          setShowWin(true); setPhase('level-win'); 
          if (onLevelComplete) onLevelComplete(); return; 
        }
        setPhase('round-win');

      } else {
        setPhase('round-fail');
      }
    } else {
      const nextItem = rounds[roundIdx][qIdx + 1];
      setQIdx(q => q + 1);
      initQuestion(nextItem, ROUNDS[roundIdx].hints, roundIdx);
    }
  };


  if (phase === 'loading' || !rounds) return (
    <div className="sp-loading"><div className="sp-spinner" /><p>Loading words…</p></div>
  );

  const roundPlayCost = getRoundCoinCost(category, levelNum, roundIdx);

  // ── MENU PHASE ──
  if (phase === 'round-select') {
    return (
        <>
            <div style={{maxWidth: '500px', margin: '40px auto', textAlign: 'center', background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}>
                <h2 style={{fontFamily: "'Baloo 2', cursive", fontSize: '2rem', color: '#1a2340', marginBottom: '10px'}}>Spelling Rounds</h2>
                {/* <p style={{color: '#666', marginBottom: '20px'}}>Pass with at least <strong>3/5 correct</strong> to advance!</p> */}
                <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                    {ROUNDS.map((r, i) => {
                        const isUnlocked = isRoundUnlocked(i);
                        const rScore = roundScores[i];
                        const playCost = getRoundCoinCost(category, levelNum, i);
                        const unlockCost = getRoundKeyCost(category, levelNum, i);
                        const displayPlayCost = playCost === 0 ? 'Free' : `🪙 ${playCost}`;

                        return (
                            <button key={i} disabled={!isUnlocked && keys < unlockCost} onClick={() => isUnlocked ? handleStartRoundClick(i) : handleUnlockRoundClick(i)}
                                style={{
                                    padding: '15px 20px', borderRadius: '15px', border: `2px solid ${isUnlocked ? r.color : '#e0e0e0'}`,
                                    background: isUnlocked ? '#fff' : '#f9f9f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    cursor: isUnlocked || keys >= unlockCost ? 'pointer' : 'not-allowed', opacity: isUnlocked ? 1 : 0.6, fontSize: '1.1rem', fontWeight: 'bold', color: '#333',
                                    boxShadow: isUnlocked ? '0 4px 0 ' + r.color : 'none'
                                }}
                            >
                                {/* 🌟 NEW: Dynamic Subtext */}
                                <span>{isUnlocked ? r.emoji : '🔒'} {r.label} ({getRoundSub(i)})</span>
                                <span style={{fontSize: '0.9rem', color: isUnlocked ? '#f57f17' : '#999'}}>
                                    {isUnlocked ? (
                                       `Play ${displayPlayCost}`
                                    ) : (
                                        `Unlock 🗝️ ${unlockCost}`
                                    )}
                                </span>
                            </button>
                        )
                    })}
                </div>
                <button className="sp-restart-btn" style={{marginTop: '25px', width: '100%', borderColor: '#ccc', color: '#666'}} onClick={onBack}>← Back to Levels</button>
            </div>
            
            <ConfirmActionModal 
                confirmAction={confirmAction} 
                onConfirm={() => executeConfirm()} 
                onCancel={() => setConfirmAction(null)} 
            />

            <CustomAlertModal alert={customAlert} onClose={() => setCustomAlert(null)} />
            <StoreModal
        show={showStore}
        onClose={() => setShowStore(false)}
        isParent={true} 
        onDailyReward={claimDaily}
        onWatchAdCoins={watchAdCoins}
        onWatchAdKeys={watchAdKeys}
        onBuyCoin1={buyCoinPack1}
        onBuyCoin2={buyCoinPack2}
        onBuyCoin3={buyCoinPack3}
        onBuyKey1={buyKeyPack1}
        onBuyKey2={buyKeyPack2}
        onBuyKey3={buyKeyPack3}
        onBuyCombo1={buyCombo1}
        onBuyCombo2={buyCombo2}
      />
</>
    );
  }

  // ── ROUND WIN PHASE ──
  if (phase === 'round-win') {
    const cur = ROUNDS[roundIdx];
    return (
      <div className="sp-wrapper">
        <div className="sp-inter" style={{textAlign: 'center', maxWidth: '400px', margin: '40px auto'}}>
          <div className="sp-inter-emoji" style={{ color: cur.color, fontSize: '4rem' }}>{cur.emoji}</div>
          <h2 className="sp-inter-title" style={{ color: cur.color, marginTop: '10px' }}>{cur.label} Complete!</h2>
          <p style={{ fontSize: '1.2rem', color: '#333' }}>Correct: <strong>{correctCount} / {QS_PER_ROUND}</strong></p>
          <p className="sp-inter-score" style={{color: '#138808', fontWeight: 'bold', margin: '20px 0'}}>
            🎉 You earned +{roundScore} Points this round!
          </p>
          <button className="sp-next-round-btn" style={{ background: '#4caf50', width: '100%', padding: '15px', borderRadius: '12px', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }} onClick={() => setPhase('round-select')}>
            ▶ Next Round
          </button>
          <button className="sp-restart-small" style={{marginTop: '15px', background: 'transparent', border: 'none', color: '#666', cursor: 'pointer'}} onClick={() => setPhase('round-select')}>
            ← Back to Round Menu
          </button>
        </div>
      </div>
    );
  }

  // FAIL PHASE
  if (phase === 'round-fail') {
    const displayPlayCost = roundPlayCost === 0 ? 'Free' : `🪙 ${roundPlayCost}`;
    return (
      <div className="sp-wrapper">
        <div className="sp-inter" style={{textAlign: 'center', maxWidth: '400px', margin: '40px auto'}}>
          <div className="sp-inter-emoji" style={{ color: '#d62828', fontSize: '4rem' }}>💔</div>
          <h2 className="sp-inter-title" style={{ color: '#d62828', marginTop: '10px' }}>Round Failed</h2>
          <p style={{ fontSize: '1.2rem', color: '#555', margin: '15px 0' }}>
            You got <strong>{correctCount} / {QS_PER_ROUND}</strong> correct. <br/>
            You need at least <strong>{MIN_CORRECT_TO_PASS} correct</strong> to pass!
          </p>
          <p className="sp-inter-score" style={{color: '#138808', fontWeight: 'bold', margin: '20px 0'}}>You still keep your +{roundScore} Points!</p>
          
          <button className="sp-next-round-btn" style={{ background: '#FF9933', width: '100%', padding: '15px', borderRadius: '12px', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }} onClick={() => handleStartRoundClick(roundIdx)}>
            🔄 Retry Round ({displayPlayCost})
          </button>
          <button className="sp-restart-small" style={{marginTop: '15px', background: 'transparent', border: 'none', color: '#666', cursor: 'pointer'}} onClick={() => setPhase('round-select')}>
            ← Back to Menu
          </button>
        </div>
      </div>
    );
  }

  // ── LEVEL WIN PHASE ──
  if (phase === 'level-win') {
    return (
      <div className="sp-wrapper" style={{position: 'relative'}}>
        {showWin && <WinningAnimation onAnimationEnd={() => setShowWin(false)} />}
        <div className="sp-inter" style={{textAlign: 'center', maxWidth: '400px', margin: '40px auto'}}>
          <div className="sp-inter-emoji" style={{ fontSize: '5rem' }}>🏆</div>
          <h2 className="sp-inter-title" style={{ color: '#d62828', marginTop: '10px' }}>Level Complete!</h2>
          <p style={{ fontSize: '1.2rem', color: '#333' }}>Correct: <strong>{correctCount} / {QS_PER_ROUND}</strong></p>
          <p className="sp-inter-score" style={{color: '#138808', fontWeight: 'bold', margin: '20px 0'}}>
            🎉 You scored +{score} Points total!
          </p>
          <button className="sp-next-round-btn" style={{ background: '#138808', width: '100%', padding: '15px', borderRadius: '12px', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }} onClick={() => { setScore(0); setPhase('round-select'); }}>
            🔄 Play Again
          </button>
          <button className="sp-next-round-btn" style={{ background: '#0077b6', width: '100%', padding: '15px', borderRadius: '12px', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '1.1rem', marginTop: '10px' }} onClick={onBack}>
            ← All Levels
          </button>
        </div>
      </div>
    );
  }

  /* ── PLAYING PHASE ── */
  const current = rounds[roundIdx][qIdx];
  const roundMeta = ROUNDS[roundIdx];
  const canCheck = !userAnswer.includes('') && userAnswer.length === current.answer.length;
  const totalQ = roundIdx * QS_PER_ROUND + qIdx;
  const totalAll = QS_PER_ROUND * ROUNDS.length;

  return (
    <div className="sp-wrapper">
      <div className="sp-card">
        <div className="sp-topbar">
          <button onClick={() => setPhase('round-select')} style={{background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.5rem', marginRight: '10px'}}>🔙</button>
          <span className="sp-round-chip" style={{ background: roundMeta.color }}>
            {roundMeta.emoji} {roundMeta.label}
          </span>
        </div>
        <div className="sp-sub-row">
          <span className="sp-counter">Q{qIdx + 1}/{QS_PER_ROUND}</span>
          <div className="sp-hints-row">
            {Array.from({ length: roundMeta.hints }).map((_, i) => (
              <span key={i} className={`sp-hint-dot ${i < (roundMeta.hints - hintsLeft) ? 'used' : ''}`}>💡</span>
            ))}
            <button className="sp-hint-btn" onClick={handleHint} disabled={!!result || hintsLeft <= 0} style={{ borderColor: roundMeta.color, color: roundMeta.color }}>
              Hint ({hintsLeft})
            </button>
          </div>
          <span className="sp-score-pill">🎯 {score}</span>
        </div>
        <div className="sp-card-inner">
          {current.imageUrl && (
            <div className="sp-left">
              <img src={current.imageUrl} alt="spell this" className="sp-image" />
              <span className="sp-type-badge" style={{ background: roundMeta.color + '22', color: roundMeta.color, borderColor: roundMeta.color }}>
                {current.type}
              </span>
            </div>
          )}
          <div className="sp-right">
            <p className="sp-prompt">{current.prompt}</p>
            <div className="sp-blanks" style={{ flexWrap: 'wrap', gap: '5px' }}>
              {Array.from({ length: current.answer.length }).map((_, i) => {
                const letter = userAnswer[i];
                const isHinted = hintedIndexes.includes(i);
                if (current.answer[i] === ' ') return <span key={i} style={{width: '15px'}}></span>;
                return letter ? (
                  <span key={i} className={`sp-letter filled${isHinted ? ' hinted' : ''}${result === 'correct' ? ' correct' : result === 'wrong' ? ' wrong' : ''}`} onClick={() => handleBackspace(i)}>
                    {letter}
                  </span>
                ) : (
                  <span key={i} className="sp-letter blank">_</span>
                );
              })}
            </div>
            <div className="sp-tiles" style={{marginTop: '20px'}}>
              
              {/* SCRAMBLED vs KEYBOARD RENDER LOGIC */}
              {useScrambled ? (
                  shuffledLetters.map((letter, i) => (
                    <button key={i} className="sp-tile" style={{ '--tc': roundMeta.color }} onClick={() => handleLetterClick(letter, i)} disabled={!!result}>
                      {letter}
                    </button>
                  ))
              ) : (
                  QWERTY.map((letter, i) => (
                    <button key={`qwerty-${i}`} className="sp-tile" style={{ '--tc': roundMeta.color, padding: '10px 15px', margin: '3px' }} onClick={() => handleLetterClick(letter, -1)} disabled={!!result}>
                      {letter}
                    </button>
                  ))
              )}
            </div>
            <div className="sp-controls">
              {result === 'correct' && (
                <div className="sp-feedback correct">
                  <span className="sp-feedback-icon">🎉</span>
                  <span>Spelled correctly! (+{roundMeta.points} Pts)</span>
                  <button className="sp-next-btn" style={{ background: roundMeta.color }} onClick={handleNext}>
                    {qIdx + 1 >= QS_PER_ROUND ? `Finish Round →` : 'Next →'}
                  </button>
                </div>
              )}
              {result === 'wrong' && (
                <div className="sp-feedback wrong">
                  <span className="sp-feedback-icon">😅</span>
                  <div><span>It was </span><strong>{current.answer}</strong></div>
                  <button className="sp-next-btn" style={{ background: roundMeta.color }} onClick={handleNext}>
                    {qIdx + 1 >= QS_PER_ROUND ? `Finish Round →` : 'Next →'}
                  </button>
                </div>
              )}
              {!result && (
                <button className="sp-check-btn" onClick={handleCheck} disabled={!canCheck} style={{ background: canCheck ? roundMeta.color : '#e0e0e0', color: canCheck ? 'white' : '#aaa' }}>
                  ✔ Check
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}