import React, { useState, useEffect, useMemo } from 'react';
import useStateData from '../Hooks/useStateData';
import useFoodData from '../Hooks/useFoodData';
import usePlaceData from '../Hooks/usePlaceData';
import useFestivalData from '../Hooks/useFestivalData';
import useWearData from '../Hooks/useWearData';
import WinningAnimation from './WinningAnimation';
import { CustomAlertModal, StoreModal, ConfirmActionModal } from './SharedModals'; 
import '../Css/Quiz.css';
import { trackScore } from '../Hooks/useApi';
import { useEconomy } from '../Hooks/EconomyContext'; 

const PICTURE_CATS = new Set(['symbols', 'food', 'festival', 'wear', 'place']);
const QS_PER_ROUND = 5; 
const MIN_CORRECT_TO_PASS = 3; // 🌟 Passing requirement

const ROUNDS = [
  { n: 2, label: 'Easy', sub: '2 Options', emoji: '🌱', color: '#06d6a0', points: 1 },
  { n: 3, label: 'Medium', sub: '3 Options', emoji: '🔥', color: '#FF9933', points: 5 },
  { n: 4, label: 'Hard', sub: '4 Options', emoji: '💎', color: '#d62828', points: 10 },
];

const LEVEL_NUMS = {
  'symbols': 1, 'capital': 2, 'language': 3, 'geography': 4,
  'food': 5, 'festival': 6, 'place': 7, 'wear': 8, 'establish': 9, 'mix': 10
};

// 🌟 KEYS: Cost to unlock early (1.1 is never locked)
const getRoundKeyCost = (cat, levelNum, rIdx) => {
  if (levelNum === 1 && rIdx === 0) return 0; // 1.1 is ALWAYS FREE                 
  if (cat === 'symbols') return 1;                   
  if (cat === 'capital' || cat === 'language' || cat === 'geography') return 3; 
  if (cat === 'food' || cat === 'festival' || cat === 'place') return 5; 
  if (cat === 'wear' || cat === 'establish' || cat === 'mix') return 7;     
  return 3;
};

// 🌟 COINS: Cost to play (1.1 is Free, rest cost coins)
const getRoundCoinCost = (cat, levelNum, rIdx) => {
  if (levelNum === 1 && rIdx === 0) return 0; // 🌟 1.1 is ALWAYS FREE
  if (cat === 'symbols') return [11, 11, 13][rIdx]; 
  if (cat === 'capital' || cat === 'language' || cat === 'geography') return [13, 13, 17][rIdx];
  if (cat === 'food' || cat === 'festival' || cat === 'place') return [17, 17, 21][rIdx];
  if (cat === 'wear' || cat === 'establish' || cat === 'mix') return [21, 21, 21][rIdx];
  return 13;
};

const LABELS = ['A', 'B', 'C', 'D'];
const shuffle = arr => [...arr].sort(() => 0.5 - Math.random());

const makeOptions = (pool, correct, n) => {
  const safePool = pool || [];
  const wrongs = shuffle(safePool.filter(x => x && x !== correct)).slice(0, n - 1);
  while (wrongs.length < n - 1) wrongs.push('—');
  return shuffle([...wrongs, correct]);
};

function cycleSlice(arr, n) {
  if (!arr || !arr.length) return [];
  const out = [];
  for (let i = 0; i < n; i++) out.push(arr[i % arr.length]);
  return out;
}

function optClass(opt, correct, selected) {
  if (!selected) return '';
  if (opt === correct) return ' correct';
  if (opt === selected) return ' wrong';
  return ' dim';
}

function buildTextQ(item, stateNames, pools, n) {
  if (!item) return null;
  const stateName = item.state?.name || 'India';
  const isReverse = ['food', 'festival', 'wear', 'place'].includes(item.type) && Math.random() < 0.5;
  let questionText, correct, optionPool;

  switch (item.type) {
    case 'symbols':
      questionText = `What is the National ${item.title?.replace('National ', '') || 'Symbol'} of India?`;
      correct = item.name; optionPool = pools.symbols; break;
    case 'geography_area':
      questionText = `What is the total area of ${stateName}?`;
      correct = item.name; optionPool = pools.geography_area; break;
    case 'geography_pop':
      questionText = `What is the population of ${stateName}?`;
      correct = item.name; optionPool = pools.geography_pop; break;
    case 'food':
      questionText = isReverse ? `${stateName} is famous for which food?` : `Where is "${item.name}" popular?`;
      correct = isReverse ? item.name : stateName;
      optionPool = isReverse ? pools.food : stateNames; break;
    case 'festival':
      questionText = isReverse ? `${stateName} is known for which festival?` : `"${item.name}" is celebrated in which state?`;
      correct = isReverse ? item.name : stateName;
      optionPool = isReverse ? pools.festival : stateNames; break;
    case 'wear':
      questionText = isReverse ? `What is the traditional wear of ${stateName}?` : `"${item.name}" is worn in which state?`;
      correct = isReverse ? item.name : stateName;
      optionPool = isReverse ? pools.wear : stateNames; break;
    case 'place':
      questionText = isReverse ? `${stateName} is famous for which landmark?` : `Where is "${item.name}" located?`;
      correct = isReverse ? item.name : stateName;
      optionPool = isReverse ? pools.place : stateNames; break;
    case 'capital':
      questionText = `What is the capital of ${stateName}?`;
      correct = item.name; optionPool = pools.capital; break;
    case 'establish':
      questionText = `When was ${stateName} established?`;
      correct = item.name; optionPool = pools.establish; break;
    case 'language':
      questionText = `What is the official language of ${stateName}?`;
      correct = item.name; optionPool = pools.language; break;
    default:
      questionText = `Where is "${item.name}" found?`;
      correct = item.state?.name || item.name;
      optionPool = stateNames;
  }
  return { ...item, kind: 'text', questionText, correct, options: makeOptions(optionPool, correct, n), imageUrl: null };
}

function buildImageQ(item, pools, n) {
  if (!item) return null;
  const typeQ = { symbols: `What National Symbol is this?`, food: '🍛 What is this food?', festival: '🎭 Which festival is this?', wear: '👘 What is this traditional wear?', place: '🏯 Which place is this?' };
  const pool = pools[item.type] || [];
  return { ...item, kind: 'image', questionText: typeQ[item.type] || 'What is this?', correct: item.name, options: makeOptions(pool, item.name, n), imageUrl: item.image || item.imageUrl || null };
}

export default function QuizGame({ category, onBack, onLevelComplete }) {
  const { stateData } = useStateData();
  const foodData = useFoodData(null, true) || [];
  const placeData = usePlaceData(null, true) || [];
  const festivalData = useFestivalData(null, true) || [];
  const wearData = useWearData(null, true) || [];

  const userId = localStorage.getItem("userId");
  const levelNum = LEVEL_NUMS[category] || 1;

  const { coins, setCoins, keys, setKeys, showStore, setShowStore, gameScores, updateScoreData, unlockedLevels, setGameUnlock } = useEconomy();
  
  const [customAlert, setCustomAlert] = useState(null); 
  const [confirmAction, setConfirmAction] = useState(null); 

  const [symbolsData, setSymbolsData] = useState([]);
  useEffect(() => {
    fetch('http://localhost:8081/api/symbols').then(res => res.ok ? res.json() : []).then(data => { if (Array.isArray(data)) setSymbolsData(data); }).catch(console.error);
  }, []);

  const scoreKey = `quiz_${category}_scores`;
  const roundScores = gameScores[scoreKey] || [null, null, null];
  const setRoundScores = (val) => updateScoreData(scoreKey, val);

  const [roundsData, setRoundsData] = useState(null);
  const [roundIdx, setRoundIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [roundScore, setRoundScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0); 
  const [phase, setPhase] = useState('loading');
  const [showWin, setShowWin] = useState(false);

  // 🌟 DECIMAL PARSING: 1.1 = Level 1 Round 1.
  const quizFloatVal = Math.round((unlockedLevels.quiz || 1.1) * 10); 
  
  const isRoundUnlocked = (rIdx) => {
    const requiredVal = levelNum * 10 + rIdx + 1; 
    return quizFloatVal >= requiredVal;
  };

  const isPictureCat = PICTURE_CATS.has(category);

  const dataReady = useMemo(() => {
    if (!stateData || !Object.keys(stateData).length) return false;
    if (category === 'symbols') return symbolsData.length > 0;
    if (['capital', 'language', 'establish', 'geography'].includes(category)) return Object.keys(stateData).length > 0;
    if (isPictureCat || category === 'mix') return foodData.length > 0 && festivalData.length > 0 && wearData.length > 0 && placeData.length > 0 && symbolsData.length > 0;
    return true; 
  }, [stateData, foodData, placeData, festivalData, wearData, symbolsData, category, isPictureCat]);

  useEffect(() => {
    if (!category || !dataReady || roundsData !== null) return;
    const stateList = Object.values(stateData).filter(Boolean);
    const stateNames = stateList.map(s => s.name).filter(Boolean);
    const formatWear = w => ({ ...w, name: w.menWear || 'Unknown', type: 'wear' });
    const pools = {
      symbols: symbolsData.map(s => s.name).filter(Boolean),
      food: foodData.map(f => f.name).filter(Boolean), 
      festival: festivalData.map(f => f.name).filter(Boolean), 
      wear: wearData.map(w => w.menWear).filter(Boolean),
      place: placeData.map(p => p.name).filter(Boolean), 
      capital: stateList.map(s => s.capital).filter(Boolean), 
      establish: stateList.map(s => s.established ? String(s.established) : null).filter(Boolean),
      language: stateList.map(s => s.language).filter(Boolean),
      geography_area: stateList.map(s => s.area).filter(Boolean),
      geography_pop: stateList.map(s => s.population).filter(Boolean),
    };

    let textPool = [];
    if (category === 'symbols') textPool = symbolsData.map(i => ({ ...i, type: 'symbols' }));
    if (category === 'food') textPool = foodData.map(i => ({ ...i, type: 'food' }));
    if (category === 'festival') textPool = festivalData.map(i => ({ ...i, type: 'festival' }));
    if (category === 'wear') textPool = wearData.map(formatWear);
    if (category === 'place') textPool = placeData.map(i => ({ ...i, type: 'place' }));
    if (category === 'capital') textPool = stateList.map(s => ({ ...s, name: s.capital, state: { name: s.name }, type: 'capital' }));
    if (category === 'establish') textPool = stateList.map(s => ({ ...s, name: String(s.established), state: { name: s.name }, type: 'establish' }));
    if (category === 'language') textPool = stateList.map(s => ({ ...s, name: s.language, state: { name: s.name }, type: 'language' }));
    if (category === 'geography') {
        textPool = [...stateList.filter(s => s && s.area).map(s => ({ ...s, name: s.area, state: { name: s.name }, type: 'geography_area' })), ...stateList.filter(s => s && s.population).map(s => ({ ...s, name: s.population, state: { name: s.name }, type: 'geography_pop' }))];
    }
    if (category === 'mix') {
        textPool = [...symbolsData.map(i => ({ ...i, type: 'symbols' })), ...foodData.map(i => ({ ...i, type: 'food' })), ...placeData.map(i => ({ ...i, type: 'place' })), ...festivalData.map(i => ({ ...i, type: 'festival' })), ...wearData.map(formatWear), ...stateList.filter(s => s && s.capital).map(s => ({ ...s, name: s.capital, state: { name: s.name }, type: 'capital' })), ...stateList.filter(s => s && s.area).map(s => ({ ...s, name: s.area, state: { name: s.name }, type: 'geography_area' }))];
    }

    let imagePool = [];
    if (category === 'symbols') imagePool = symbolsData.map(i => ({ ...i, type: 'symbols' }));
    if (category === 'food') imagePool = foodData.map(i => ({ ...i, type: 'food' }));
    if (category === 'festival') imagePool = festivalData.map(i => ({ ...i, type: 'festival' }));
    if (category === 'wear') imagePool = wearData.map(formatWear);
    if (category === 'place') imagePool = placeData.map(i => ({ ...i, type: 'place' }));
    if (category === 'mix') imagePool = [...symbolsData.map(i => ({ ...i, type: 'symbols' })), ...foodData.map(i => ({ ...i, type: 'food' })), ...placeData.map(i => ({ ...i, type: 'place' })), ...festivalData.map(i => ({ ...i, type: 'festival' })), ...wearData.map(formatWear)];

    textPool = textPool.filter(t => t && t.name);
    imagePool = imagePool.filter(i => i && i.name);
    if (!textPool.length && !imagePool.length) return;

    const totalText = isPictureCat ? ROUNDS.length * 3 : ROUNDS.length * QS_PER_ROUND;
    const totalImage = isPictureCat ? ROUNDS.length * 2 : 0; 
    const textItems = cycleSlice(shuffle(textPool), totalText);
    const imageItems = cycleSlice(shuffle(imagePool), totalImage);

    const builtRounds = ROUNDS.map((r, ri) => {
      const tSlice = textItems.slice(ri * (isPictureCat ? 3 : QS_PER_ROUND), ri * (isPictureCat ? 3 : QS_PER_ROUND) + (isPictureCat ? 3 : QS_PER_ROUND));
      const iSlice = isPictureCat ? imageItems.slice(ri * 2, ri * 2 + 2) : [];
      const textQs = tSlice.map(item => buildTextQ(item, stateNames, pools, r.n)).filter(Boolean);
      const imageQs = iSlice.map(item => buildImageQ(item, pools, r.n)).filter(Boolean);
      return shuffle([...textQs, ...imageQs]);
    });

    if (builtRounds && builtRounds[0]?.length > 0) { setRoundsData(builtRounds); setPhase('round-select'); }
  }, [category, dataReady, roundsData, symbolsData, foodData, festivalData, wearData, placeData, stateData, isPictureCat]);

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

  const startRoundLogic = (rIdx) => {
    setRoundIdx(rIdx); 
    setQIdx(0); 
    setRoundScore(0); 
    setCorrectCount(0); 
    setSelected(null); 
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
            await fetch(`http://localhost:8081/api/progress/currency/${userId}`, {
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
        setGameUnlock('quiz', nextValStr / 10); 

        try {
          await fetch(`http://localhost:8081/api/progress/currency/${userId}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coins: coins, keysCount: newKeys })
          });
        } catch(err) { console.error(err); }
        setCustomAlert({ type: 'success', icon: '🔓', title: 'Round Unlocked!', text: `Round ${rIdx + 1} is now unlocked! You can now play it using coins.` });
    }
  };

  const handleSelect = opt => {
    if (selected) return;
    setSelected(opt);
    if (opt === roundsData[roundIdx][qIdx].correct) {
      const pointsEarned = ROUNDS[roundIdx].points;
      setScore(s => s + pointsEarned); 
      setRoundScore(s => s + pointsEarned);
      setCorrectCount(c => c + 1); 
    }
  };

  const handleNext = async () => {
    const isLastQ = qIdx + 1 >= QS_PER_ROUND;
    if (isLastQ) {
      const passedRound = correctCount >= MIN_CORRECT_TO_PASS; 

      if (passedRound) {
        trackScore('quiz', roundScore, `Round ${roundIdx + 1}`);
        
        setRoundScores(prev => {
          const newScores = [...(prev || [null, null, null])];
          if (newScores[roundIdx] === null || roundScore > newScores[roundIdx]) newScores[roundIdx] = roundScore;
          return newScores;
        });

        let nextValStr = levelNum * 10 + roundIdx + 2; 
        if (roundIdx === 2) nextValStr = (levelNum + 1) * 10 + 1; 
        
        if (nextValStr > quizFloatVal) {
            setGameUnlock('quiz', nextValStr / 10); 
        }

        if (roundIdx + 1 >= ROUNDS.length) { 
            setShowWin(true); setPhase('level-win'); 
            if (onLevelComplete) onLevelComplete(); 
        } else {
            setPhase('round-win');
        }
      } else {
        setPhase('round-fail');
      }

    } else { 
        setQIdx(q => q + 1); setSelected(null); 
    }
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

  if (phase === 'loading' || !roundsData) return <div className="qz-loading"><div className="qz-spinner" /><p className="qz-loading-text">Building questions…</p></div>;

  const roundPlayCost = getRoundCoinCost(category, levelNum, roundIdx);

  if (phase === 'round-select') {
    return (
        <>
            <div style={{maxWidth: '500px', margin: '40px auto', textAlign: 'center', background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}>
                <h2 style={{fontFamily: "'Baloo 2', cursive", fontSize: '2rem', color: '#1a2340', marginBottom: '10px'}}>Quiz Rounds</h2>
                <p style={{color: '#666', marginBottom: '20px'}}>Pass with at least <strong>3/5 correct</strong> to advance!</p>
                <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                    {ROUNDS.map((r, i) => {
                        const isUnlocked = isRoundUnlocked(i);
                        const rScore = roundScores[i];
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
                                <span>{isUnlocked ? r.emoji : '🔒'} {r.label} ({r.sub})</span>
                                <span style={{fontSize: '0.9rem', color: isUnlocked ? '#f57f17' : '#999'}}>
                                    {isUnlocked ? (
                                        rScore !== null ? <span style={{color: '#138808'}}>✅ {rScore} Pts</span> : `Play ${displayPlayCost}`
                                    ) : (
                                        `Unlock 🗝️ ${unlockCost}`
                                    )}
                                </span>
                            </button>
                        )
                    })}
                </div>
                <button className="qz-restart-btn" style={{marginTop: '25px', width: '100%', border: 'none', background: 'transparent', color: '#666', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold'}} onClick={onBack}>← Back to Levels</button>
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

  if (phase === 'round-win') {
    const cur = ROUNDS[roundIdx];
    return (
      <div className="qz-wrapper">
        <div className="qz-inter" style={{textAlign: 'center', maxWidth: '400px', margin: '40px auto'}}>
          <div className="qz-inter-emoji" style={{ color: cur.color, fontSize: '4rem' }}>{cur.emoji}</div>
          <h2 className="qz-inter-title" style={{ color: cur.color, marginTop: '10px' }}>{cur.label} Complete!</h2>
          <p style={{ fontSize: '1.2rem', color: '#333' }}>Correct: <strong>{correctCount} / {QS_PER_ROUND}</strong></p>
          <p className="qz-inter-score" style={{color: '#138808', fontWeight: 'bold', margin: '20px 0'}}>🎉 You earned +{roundScore} Points this round!</p>
          <button className="qz-next-round-btn" style={{ background: '#4caf50', width: '100%', padding: '15px', borderRadius: '12px', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }} onClick={() => setPhase('round-select')}>▶ Next Round</button>
          <button className="qz-restart-small" style={{marginTop: '15px', background: 'transparent', border: 'none', color: '#666', cursor: 'pointer'}} onClick={() => setPhase('round-select')}>← Back to Round Menu</button>
        </div>
      </div>
    );
  }

  // 🌟 NEW FAIL PHASE
  if (phase === 'round-fail') {
    const displayPlayCost = roundPlayCost === 0 ? 'Free' : `🪙 ${roundPlayCost}`;
    return (
      <div className="qz-wrapper">
        <div className="qz-inter" style={{textAlign: 'center', maxWidth: '400px', margin: '40px auto'}}>
          <div className="qz-inter-emoji" style={{ color: '#d62828', fontSize: '4rem' }}>💔</div>
          <h2 className="qz-inter-title" style={{ color: '#d62828', marginTop: '10px' }}>Round Failed</h2>
          <p style={{ fontSize: '1.2rem', color: '#555', margin: '15px 0' }}>
            You got <strong>{correctCount} / {QS_PER_ROUND}</strong> correct. <br/>
            You need at least <strong>{MIN_CORRECT_TO_PASS} correct</strong> to pass!
          </p>
          <p className="qz-inter-score" style={{color: '#138808', fontWeight: 'bold', margin: '20px 0'}}>You still keep your +{roundScore} Points!</p>
          
          <button className="qz-next-round-btn" style={{ background: '#FF9933', width: '100%', padding: '15px', borderRadius: '12px', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }} onClick={() => handleStartRoundClick(roundIdx)}>
            🔄 Retry Round ({displayPlayCost})
          </button>
          <button className="qz-restart-small" style={{marginTop: '15px', background: 'transparent', border: 'none', color: '#666', cursor: 'pointer'}} onClick={() => setPhase('round-select')}>← Back to Menu</button>
        </div>
      </div>
    );
  }

  if (phase === 'level-win') {
    return (
      <div className="qz-wrapper" style={{position: 'relative'}}>
        {showWin && <WinningAnimation onAnimationEnd={() => setShowWin(false)} />}
        <div className="qz-inter" style={{textAlign: 'center', maxWidth: '400px', margin: '40px auto'}}>
          <div className="qz-inter-emoji" style={{ fontSize: '5rem' }}>🏆</div>
          <h2 className="qz-inter-title" style={{ color: '#d62828', marginTop: '10px' }}>Level Complete!</h2>
          <p style={{ fontSize: '1.2rem', color: '#333' }}>Correct: <strong>{correctCount} / {QS_PER_ROUND}</strong></p>
          <p className="qz-inter-score" style={{color: '#138808', fontWeight: 'bold', margin: '20px 0'}}>🎉 You scored +{score} Points total!</p>
          <button className="qz-next-round-btn" style={{ background: '#138808', width: '100%', padding: '15px', borderRadius: '12px', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }} onClick={() => { setPhase('round-select'); }}>🔄 Play Again</button>
          <button className="qz-next-round-btn" style={{ background: '#0077b6', width: '100%', padding: '15px', borderRadius: '12px', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '1.1rem', marginTop: '10px' }} onClick={onBack}>← All Levels</button>
        </div>
      </div>
    );
  }

  const totalQ = QS_PER_ROUND * ROUNDS.length;
  const doneQ = (roundIdx * QS_PER_ROUND) + qIdx;
  
  const current = roundsData[roundIdx][qIdx];
  const roundMeta = ROUNDS[roundIdx];
  const isLastQ = qIdx + 1 >= QS_PER_ROUND;
  const isImageQ = current.kind === 'image';

  return (
    <div className="qz-wrapper">
      <div className="qz-box">
        <div className="qz-header-row">
          <button onClick={() => setPhase('round-select')} style={{background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.5rem', marginRight: '10px'}}>🔙</button>
          <span className="qz-round-chip" style={{ background: roundMeta.color }}>{roundMeta.emoji} {roundMeta.label}</span>
        </div>
        <div className="qz-progress-track"><div className="qz-progress-fill" style={{ width: `${(doneQ / totalQ) * 100}%`, background: `linear-gradient(to right, ${ROUNDS[0].color}, ${roundMeta.color})` }} /></div>
        <div className="qz-sub-row"><span className="qz-counter">Q{qIdx + 1}/{QS_PER_ROUND} · {roundMeta.n} options</span><span className="qz-score-pill">🎯 {score}</span></div>
        <h3 className="qz-question">{current.questionText}</h3>
        {isImageQ && current.imageUrl && (<div className="qz-image-wrap"><img src={current.imageUrl} alt="quiz" className="qz-image" /></div>)}
        <div className={`qz-options-grid cols-${roundMeta.n <= 2 ? 1 : 2}`}>
          {current.options.map((opt, i) => (
            <button key={i} className={`qz-opt${optClass(opt, current.correct, selected)}`} onClick={() => handleSelect(opt)} disabled={!!selected}>
              <span className="qz-opt-label">{LABELS[i]}.</span> {opt}
            </button>
          ))}
        </div>
        {selected && (
          <div className="qz-feedback-row">
            <span className={`qz-feedback ${selected === current.correct ? 'correct' : 'wrong'}`}>{selected === current.correct ? `🎉 Correct! (+${roundMeta.points} Pts)` : `✗  ${current.correct}`}</span>
            <button className="qz-next" style={{background: roundMeta.color}} onClick={handleNext}>{isLastQ ? 'Finish Round →' : 'Next →'}</button>
          </div>
        )}
      </div>
    </div>
  );
}