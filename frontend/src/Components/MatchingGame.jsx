import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import useStateData from '../Hooks/useStateData';
import WinningAnimation from './WinningAnimation';
import { CustomAlertModal, StoreModal, ConfirmActionModal } from './SharedModals';
import '../Css/MatchingGame.css';
import { trackScore } from '../Hooks/useApi';
import { useEconomy } from '../Hooks/EconomyContext';
import { API_BASE_URL } from '../Hooks/config';
import useGameModal from '../Hooks/useGameModal';
const BASE = `${API_BASE_URL}`;

const CAT_LABELS = {
  symbols: 'National Symbols', capital: 'Capitals', language: 'Languages', established: 'Est. Year',
  food: 'Food', festival: 'Festivals', place: 'Tourist Places',
  wear: 'Traditional Wear', mix: 'Mix-Up Challenge',
};

const MIX_CATS = ['food', 'place', 'festival', 'wear'];

const ROUND_META = [
  { label: 'Easy', emoji: '🌱', color: '#06d6a0', pairs: 3 },
  { label: 'Medium', emoji: '🔥', color: '#FF9933', pairs: 5 },
  { label: 'Hard', emoji: '💎', color: '#d62828', pairs: 7 },
];

const LEVEL_NUMS = {
  'symbols': 1, 'capital': 2, 'language': 3, 'food': 4,
  'festival': 5, 'place': 6, 'wear': 7, 'established': 8, 'mix': 9
};

// KEYS: Cost to unlock early (1.1 is never locked)
const getRoundKeyCost = (cat, levelNum, rIdx) => {
  if (levelNum === 1 && rIdx === 0) return 0; // 1.1 is ALWAYS FREE                 
  if (cat === 'symbols') return 1;
  if (cat === 'capital' || cat === 'language') return 2;
  if (cat === 'food' || cat === 'festival' || cat === 'place') return 3;
  if (cat === 'wear' || cat === 'established' || cat === 'mix') return 5;
  return 2;
};

// COINS: Cost to play (1.1 is Free, rest cost coins)
const getRoundCoinCost = (cat, levelNum, rIdx) => {
  if (levelNum === 1 && rIdx === 0) return 0; // 1.1 is ALWAYS FREE
  if (cat === 'symbols') return [11, 11, 11][rIdx]; // Fallback for 1.2 and 1.3
  if (cat === 'capital' || cat === 'language') return [11, 11, 13][rIdx];
  if (cat === 'food' || cat === 'festival' || cat === 'place') return [11, 13, 13][rIdx];
  if (cat === 'wear' || cat === 'established' || cat === 'mix') return [17, 17, 17][rIdx];
  return 11;
};

const getRoundPoints = (cat, rIdx) => {
  const earlyLevels = ['symbols', 'capital', 'language'];
  if (earlyLevels.includes(cat)) {
    return [10, 20, 30][rIdx];
  }
  return [20, 30, 50][rIdx];
};

export default function MatchingGame({ category, levelColor = '#FF9933', onBack, onLevelComplete }) {
  const { stateData } = useStateData();
  const userId = localStorage.getItem("userId");
  const levelNum = LEVEL_NUMS[category] || 1;

  const [score, setScore] = useState(0);
  const { 
    coins, setCoins, keys, setKeys, 
    unlockedLevels, setGameUnlock, gameScores, updateScoreData 
  } = useEconomy();
  const { 
    showStore, setShowStore, confirmAction, setConfirmAction, customAlert, setCustomAlert, 
    claimDaily, watchAdCoins, watchAdKeys, 
    buyCoinPack1, buyCoinPack2, buyCoinPack3,
    buyKeyPack1, buyKeyPack2, buyKeyPack3,
    buyCombo1, buyCombo2
  } = useGameModal();
  const [symbolsData, setSymbolsData] = useState([]);
  useEffect(() => {
    fetch(`${BASE}/api/symbols`)
      .then(res => res.ok ? res.json() : [])
      .then(data => { if (Array.isArray(data)) setSymbolsData(data); })
      .catch(console.error);
  }, []);

  const rounds = useMemo(() => ROUND_META.map((r, i) => ({
    num: i + 1, pairs: r.pairs, label: r.label, emoji: r.emoji, color: levelColor
  })), [levelColor]);

  const scoreKey = `matching_${category}_scores`;
  const roundScores = gameScores[scoreKey] || [null, null, null];
  const setRoundScores = (val) => updateScoreData(scoreKey, val);

  const [phase, setPhase] = useState('round-select');
  const [roundIdx, setRoundIdx] = useState(0);
  const [states, setStates] = useState([]);
  const [values, setValues] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [removingIds, setRemovingIds] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedValue, setSelectedValue] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [hearts, setHearts] = useState(3);
  const [heartsAtEnd, setHeartsAtEnd] = useState(3);
  const [showWin, setShowWin] = useState(false);

  const busy = useRef(false);

  const matchingFloatVal = Math.round((unlockedLevels.matching || 1.1) * 10);

  const isRoundUnlocked = (rIdx) => {
    const requiredVal = levelNum * 10 + rIdx + 1;
    return matchingFloatVal >= requiredVal;
  };

  const fetchValue = useCallback(async (stateKey, cat) => {
    const s = stateData[stateKey];
    if (!s) return null;
    try {
      switch (cat) {
        case 'capital': return s.capital || null;
        case 'language': return s.language || null;
        case 'established': return String(s.established) || null;
        case 'food': {
          const r = await fetch(`${BASE}/foods/food/${s.id}`);
          const d = await r.json(); return Array.isArray(d) ? d[0]?.name : d?.name;
        }
        case 'place': {
          const r = await fetch(`${BASE}/places/place/${s.id}`);
          const d = await r.json(); return Array.isArray(d) ? d[0]?.name : d?.name;
        }
        case 'festival': {
          const r = await fetch(`${BASE}/festivals/festival/${s.id}`);
          const d = await r.json(); return Array.isArray(d) ? d[0]?.name : d?.name;
        }
        case 'wear': {
          const r = await fetch(`${BASE}/wears/wear/${s.id}`);
          const d = await r.json(); return d?.menWear || null;
        }
        default: return null;
      }
    } catch { return null; }
  }, [stateData]);

  const shuffle = arr => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

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
          await fetch(`${BASE}/api/auth/progress/currency/${userId}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coins: newCoins, keysCount: keys })
          });
        } catch (err) { console.error(err); }
      }
      startRoundLogic(rIdx);
    }

    if (type === 'unlock') {
      const newKeys = keys - cost;
      setKeys(newKeys);
      const nextValStr = levelNum * 10 + rIdx + 1;
      setGameUnlock('matching', nextValStr / 10);

      try {
        await fetch(`${BASE}/api/auth/progress/currency/${userId}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coins: coins, keysCount: newKeys })
        });
      } catch (err) { console.error(err); }
      setCustomAlert({ type: 'success', icon: '🔓', title: 'Round Unlocked!', text: `Round ${rIdx + 1} is now unlocked! You can now play it using coins.` });
    }
  };

  const startRoundLogic = async (rIdx) => {
    setRoundIdx(rIdx); setPhase('loading'); setFeedback(''); setSelectedState(null); setSelectedValue(null);
    setMatchedPairs([]); setRemovingIds([]); setHearts(3); busy.current = false;

    const pairCount = rounds[rIdx].pairs;
    const pairs = [];

    if (category === 'symbols') {
      const pool = shuffle([...symbolsData]);
      for (let i = 0; i < pairCount && i < pool.length; i++) {
        const sym = pool[i];
        pairs.push({ stateKey: `${sym.title}`, value: sym.name, id: `sym-${i}` });
      }
    } else {
      const keyList = shuffle(Object.keys(stateData));
      for (const key of keyList) {
        if (pairs.length >= pairCount) break;
        const cat = category === 'mix' ? MIX_CATS[Math.floor(Math.random() * MIX_CATS.length)] : category;
        const value = await fetchValue(key, cat);
        if (value) pairs.push({ stateKey: key, value, id: `${key}-${rIdx}-${pairs.length}` });
      }
    }

    setStates(pairs.map(p => ({ id: p.id, stateKey: p.stateKey })));
    setValues(shuffle(pairs.map(p => ({ id: p.id, value: p.value, stateKey: p.stateKey }))));
    setPhase('playing');
  };

  const finishRound = async (matched, won) => {
    if (won) {
      const ptsEarned = getRoundPoints(category, roundIdx);

      trackScore('matching', ptsEarned, `Round ${roundIdx + 1}`);
      setScore(s => s + ptsEarned);

      setRoundScores(prev => {
        const newScores = [...(prev || [null, null, null])];
        newScores[roundIdx] = Math.max(newScores[roundIdx] || 0, ptsEarned);
        return newScores;
      });

      // 🌟 AUTOMATIC PROGRESSION
      let nextValStr = levelNum * 10 + roundIdx + 2;
      if (roundIdx === 2) nextValStr = (levelNum + 1) * 10 + 1;

      if (nextValStr > matchingFloatVal) {
        setGameUnlock('matching', nextValStr / 10);

        if (nextValStr >= 51 && (unlockedLevels.spell || 0) < 1) {
          setGameUnlock('spell', 1);
          setTimeout(() => {
            setCustomAlert({ type: 'success', icon: '📝', title: 'Spell Check Unlocked!', text: 'You cleared the requirements! The Spell Check Game is now unlocked!' });
          }, 800);
        }
      }

      if (roundIdx + 1 >= rounds.length) {
        setShowWin(true); setPhase('level-win');
        if (onLevelComplete) onLevelComplete();
      } else setPhase('round-win');
    } else setPhase('round-fail');
  };

  const evaluate = async (stateItem, valueItem) => {
    busy.current = true;
    const ok = stateItem.id === valueItem.id;

    if (ok) {
      setMatchedPairs(prev => {
        const next = [...prev, { state: stateItem.stateKey, value: valueItem.value }];
        if (next.length === rounds[roundIdx].pairs) {
          setHeartsAtEnd(hearts);
          setTimeout(() => finishRound(next.length, true), 600);
        }
        return next;
      });
      setFeedback('✅ Correct Match!');
      setRemovingIds(prev => [...prev, stateItem.id]);
      setTimeout(() => {
        setStates(p => p.filter(s => s.id !== stateItem.id));
        setValues(p => p.filter(v => v.id !== valueItem.id));
        setRemovingIds([]); busy.current = false;
      }, 500);
    } else {
      setHearts(h => {
        const next = h - 1;
        if (next <= 0) { setHeartsAtEnd(0); setTimeout(() => finishRound(matchedPairs.length, false), 500); }
        return next;
      });
      setFeedback('💔 Wrong! Try again.');
      setTimeout(() => { setFeedback(''); busy.current = false; }, 1800);
    }
    setSelectedState(null); setSelectedValue(null);
  };

  const handleSelect = (type, item) => {
    if (phase !== 'playing' || busy.current) return;
    setFeedback('');
    if (type === 'state') {
      if (selectedValue) evaluate(item, selectedValue); else { setSelectedState(item); setSelectedValue(null); }
    } else {
      if (selectedState) evaluate(selectedState, item); else { setSelectedValue(item); setSelectedState(null); }
    }
  };

  const catLabel = CAT_LABELS[category] || category;
  const roundMeta = rounds[roundIdx] || rounds[0];
  const roundPlayCost = getRoundCoinCost(category, levelNum, roundIdx);
  const potentialPoints = getRoundPoints(category, roundIdx);

  if (phase === 'round-select') {
    return (
      <>
        <div className="mg-interround" style={{ maxWidth: '400px', margin: '20px auto', textAlign: 'center', background: '#f9f9f9', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
          <div className="mg-ir-badge" style={{ background: levelColor, marginBottom: '20px' }}>{catLabel} Rounds</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {rounds.map((r, i) => {
              const isUnlocked = isRoundUnlocked(i);
              const rScore = roundScores[i];
              const playCost = getRoundCoinCost(category, levelNum, i);
              const unlockCost = getRoundKeyCost(category, levelNum, i);
              const displayPlayCost = playCost === 0 ? 'Free' : `🪙 ${playCost}`;

              return (
                <button key={i} onClick={() => isUnlocked ? handleStartRoundClick(i) : handleUnlockRoundClick(i)}
                  style={{
                    padding: '15px 20px', borderRadius: '15px', border: `2px solid ${isUnlocked ? r.color : '#ccc'}`,
                    background: isUnlocked ? '#fff' : '#f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    cursor: 'pointer', opacity: isUnlocked ? 1 : 0.8, fontSize: '1.1rem', fontWeight: 'bold', color: '#333',
                    boxShadow: isUnlocked ? '0 4px 0 ' + r.color : 'none'
                  }}
                >
                  <span>{isUnlocked ? r.emoji : '🔒'} {r.label} ({r.pairs} Pairs)</span>
                  <span style={{ fontSize: '0.9rem', color: isUnlocked ? '#f57f17' : '#999', textAlign: 'right' }}>
                    {isUnlocked ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: '1.2' }}>
                        <span style={{ fontWeight: 'bold' }}>Play {displayPlayCost}</span>
                      </div>
                    ) : (
                      `Unlock 🗝️ ${unlockCost}`
                    )}
                  </span>
                </button>
              )
            })}
          </div>
          <button className="pz-restart-small" style={{ marginTop: '20px' }} onClick={onBack}>← Back to Levels</button>
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

  if (phase === 'loading') return (
    <div className="mg-loading">
      <div className="mg-loading-spinner" style={{ '--lc': levelColor }} />
      <div className="mg-loading-text">Loading {roundMeta.label} Round...</div>
    </div>
  );

  if (phase === 'round-win') {
    return (
      <div className="mg-interround">
        <div className="mg-ir-badge" style={{ background: roundMeta.color }}>
          {roundMeta.emoji} {roundMeta.label} Complete!
        </div>
        <p className="pz-inter-score">🎉 You earned +{potentialPoints} Points this round!</p>
        <div className="mg-ir-stats">
          <div className="mg-ir-stat"><span className="mg-ir-sv">✅ {roundMeta.pairs}</span><span className="mg-ir-sl">Matched</span></div>
          <div className="mg-ir-stat"><span className="mg-ir-sv">{Array(Math.max(0, heartsAtEnd)).fill('❤️').join('')}</span><span className="mg-ir-sl">Hearts</span></div>
        </div>
        <button className="mg-next-round-btn" style={{ background: '#4caf50' }} onClick={() => setPhase('round-select')}>▶ Next Round</button>
        <button className="pz-restart-small" onClick={() => setPhase('round-select')}>← Back to Round Menu</button>
      </div>
    );
  }

  if (phase === 'round-fail') {
    const displayPlayCost = roundPlayCost === 0 ? 'Free' : `🪙 ${roundPlayCost}`;
    return (
      <div className="mg-interround mg-fail">
        <div className="mg-ir-badge" style={{ background: '#d62828' }}>💔 Round Failed</div>
        <p>You ran out of hearts! Don't worry, you can try again.</p>
        <button className="mg-next-round-btn" style={{ background: '#FF9933' }} onClick={() => handleStartRoundClick(roundIdx)}>
          🔄 Retry ({displayPlayCost})
        </button>
        <button className="pz-restart-small" onClick={() => setPhase('round-select')}>← Back to Round Menu</button>
      </div>
    );
  }

  if (phase === 'level-win') {
    return (
      <div className="mg-interround">
        {showWin && <WinningAnimation onAnimationEnd={() => setShowWin(false)} />}
        <div className="mg-ir-badge" style={{ background: 'linear-gradient(135deg,#ffd700,#ff9500)' }}>🏆 Level Complete!</div>
        <p className="pz-inter-score">🎉 You scored +{score} Points total!</p>
        <button className="mg-next-round-btn" style={{ background: '#138808' }} onClick={() => { setScore(0); setPhase('round-select'); }}>🔄 Play Again</button>
        <button className="mg-next-round-btn" style={{ background: '#0077b6' }} onClick={onBack}>← All Levels</button>
      </div>
    );
  }

  return (
    <div className="matching-game-container">
      <div className="mg-round-header">
        <button className="pz-back-btn" onClick={() => setPhase('round-select')}>BACK</button>
        <div className="mg-round-info">
          <span className="mg-round-chip" style={{ background: roundMeta.color }}>
            {roundMeta.emoji} {roundMeta.label} Mode
          </span>
        </div>
      </div>

      <h1 className="title">Match {category === 'symbols' ? 'Symbols' : 'States'} → {catLabel}</h1>
      <div className="hearts">{Array(Math.max(0, hearts)).fill('❤️').join('')}</div>

      {feedback && <p className={`feedback-text ${feedback.includes('Correct') ? 'correct' : 'incorrect'}`}>{feedback}</p>}

      <div className="Pairs">
        <div className="game-columns">
          <div className="states-column">
            <h2>{category === 'symbols' ? '🏷️ Category' : '🗺️ States'}</h2>
            <ul className="list">
              {states.map(st => (
                <li key={st.id} className={`list-item ${selectedState?.id === st.id ? 'selected' : ''} ${removingIds.includes(st.id) ? 'removing' : ''}`} onClick={() => handleSelect('state', st)}>
                  {category === 'symbols' ? st.stateKey : stateData[st.stateKey]?.name}
                </li>
              ))}
            </ul>
          </div>
          <div className="capitals-column">
            <h2>{category === 'symbols' ? 'Symbol' : catLabel}</h2>
            <ul className="list">
              {values.map(val => (
                <li key={val.id} className={`list-item ${selectedValue?.id === val.id ? 'selected' : ''} ${removingIds.includes(val.id) ? 'removing' : ''}`} onClick={() => handleSelect('value', val)}>
                  {val.value}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}