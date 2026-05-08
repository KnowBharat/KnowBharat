import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import LevelPickerPage from './LevelPickerPage';
import IndiaMap        from './India';
import { CustomAlertModal, StoreModal, ConfirmActionModal } from './SharedModals'; // 🌟 Added ConfirmActionModal
import MapLevel        from './MapLevel'; 
import useStateData from '../Hooks/useStateData';
import '../Css/MapLevel.css';
import { trackStateVisit, apiFetch } from '../Hooks/useApi';
import { useEconomy } from '../Hooks/EconomyContext'; 

const LEVELS = [
  { id:1,  num:1,  emoji:'🗺️', title:'State Names',      desc:'Can you name the highlighted state on the map?',      color:'#00b4d8', bg:'linear-gradient(135deg,#e0f7ff,#b3ecff)', border:'#00b4d8', tag:'Beginner', tagColor:'#005f80', unlockCost: 0 },
  { id:2,  num:2,  emoji:'🏛️', title:'Capital Cities',  desc:'Match every state to its capital city.',              color:'#138808', bg:'linear-gradient(135deg,#e8fded,#c6f6d5)', border:'#138808', tag:'Beginner', tagColor:'#1a5c2a', unlockCost: 3 },
  { id:3,  num:3,  emoji:'🗣️', title:'Languages',       desc:'Which language is spoken in each state?',             color:'#FF9933', bg:'linear-gradient(135deg,#fff3e0,#ffe0b2)', border:'#FF9933', tag:'Easy',     tagColor:'#7a4000', unlockCost: 3 },
  { id:4,  num:4,  emoji:'🌍', title:'Geography',        desc:'Learn the area and population of every state.',       color:'#ff006e', bg:'linear-gradient(135deg,#ffe0ef,#ffb3d1)', border:'#ff006e', tag:'Easy',     tagColor:'#7a0033', unlockCost: 3 },
  { id:5,  num:5,  emoji:'🍛', title:'Traditional Food', desc:'Identify dishes from a blurred food photo!',          color:'#8338ec', bg:'linear-gradient(135deg,#f0e8ff,#d9b3ff)', border:'#8338ec', tag:'Medium',   tagColor:'#4a0080', unlockCost: 5 },
  { id:6,  num:6,  emoji:'🎭', title:'Festivals',        desc:'Name the festival from its photo — no peeking!',      color:'#fb5607', bg:'linear-gradient(135deg,#ffe8e0,#ffbfaa)', border:'#fb5607', tag:'Medium',   tagColor:'#7a2000', unlockCost: 5 },
  { id:7,  num:7,  emoji:'🏯', title:'Tourist Places',   desc:'Guess the iconic landmark from a blurred image.',     color:'#3a86ff', bg:'linear-gradient(135deg,#e0eaff,#b3ccff)', border:'#3a86ff', tag:'Medium',   tagColor:'#003080', unlockCost: 5 },
  { id:8,  num:8,  emoji:'👘', title:'Traditional Wear', desc:'Describe what men and women traditionally wear.',     color:'#ffbe0b', bg:'linear-gradient(135deg,#fff8e0,#ffe680)', border:'#ffbe0b', tag:'Hard',     tagColor:'#5a4000', unlockCost: 7 },
  { id:9,  num:9,  emoji:'📜', title:'History',          desc:'When was each state officially established?',         color:'#06d6a0', bg:'linear-gradient(135deg,#e0fff7,#b3ffea)', border:'#06d6a0', tag:'Hard',     tagColor:'#005a40', unlockCost: 7 },
  { id:10, num:10, emoji:'🏆', title:'Master Level',     desc:'All 6 facts at once — the ultimate India challenge!', color:'#d62828', bg:'linear-gradient(135deg,#ffe0e0,#ffb3b3)', border:'#d62828', tag:'Expert',   tagColor:'#7a0000', unlockCost: 7 },
  { id:11, num:11, emoji:'🎖️', title:'Grand Challenge',  desc:'5 rounds — all topics in one epic challenge!',        color:'#d62828', bg:'linear-gradient(135deg,#1a1a2e,#16213e)', border:'#d62828', tag:'Ultimate', tagColor:'#ff6b6b', dark:true, unlockCost: 11 },
];

export default function MapIndex() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const { stateData, selectedState, setSelectedState } = useStateData();
  
  const { 
    coins, setCoins, keys, setKeys, showStore, setShowStore, 
    unlockedLevels, setGameUnlock, gameScores, updateScoreData 
  } = useEconomy(); 

  const mapUnlocked = unlockedLevels.map || 1;
  const setMapUnlocked = (val) => setGameUnlock('map', val);

  const flatExploredNodes = gameScores['map_explored_nodes'] || [];
  const exploredStates = {};
  flatExploredNodes.forEach(node => {
    const parts = node.split(' lvl ');
    if (parts.length === 2) {
      const stateKey = parts[0];
      const lvl = parseInt(parts[1], 10);
      if (!exploredStates[lvl]) exploredStates[lvl] = [];
      exploredStates[lvl].push(stateKey);
    }
  });
  
  const [confirmAction, setConfirmAction] = useState(null); // 🌟 Unified Modal State
  const [customAlert, setCustomAlert] = useState(null); 
  const [activeLevel, setActiveLevel] = useState(null);
  const [hoveredState, setHoveredState] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const activeKey = hoveredState || selectedState;
  const stateInfo = activeKey ? stateData[activeKey] : null;

  const getLevelCost = (num) => {
    if (!num || num === 1) return 0;
    if (num >= 2 && num <= 4) return 7;
    if (num >= 5 && num <= 8) return 11;
    if (num >= 9 && num <= 11) return 13;
    return 0;
  };
  const activeLevelCost = getLevelCost(activeLevel);

  const handleSearchChange = useCallback((e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (!val.trim()) { setSuggestions([]); return; }
    setSuggestions(Object.keys(stateData).filter(k => stateData[k].name.toLowerCase().startsWith(val.toLowerCase())));
  }, [stateData]);

  // Select State logic checks for Level-Up milestone dynamically
  const selectState = useCallback((key) => {
    setSelectedState(key);
    setSearchTerm(stateData[key]?.name || '');
    setSuggestions([]);
    trackStateVisit(stateData[key]?.name);

    if (activeLevel) {
      const currentExploredForLevel = exploredStates[activeLevel] || [];
      
      if (currentExploredForLevel.includes(key)) {
         if (currentExploredForLevel.length === 10 && activeLevel === mapUnlocked) {
            const nextLevel = activeLevel + 1;
            setMapUnlocked(nextLevel);
            
            setTimeout(() => {
               setConfirmAction({
                 type: 'levelUp',
                 nextLevelId: nextLevel,
                 nextRoute: nextLevel === 10 ? '/puzzle' : null,
                 title: nextLevel === 10 ? '🧩 Puzzle Unlocked!' : 'Level Unlocked!',
                 icon: nextLevel === 10 ? '🧩' : '🎉',
                 color: '#4caf50',
                 message: `Amazing! You explored 10 states in Level ${activeLevel}.\n\n🔓 ${nextLevel === 10 ? 'The Puzzle Game' : `Level ${nextLevel}`} is now UNLOCKED!\n\nDo you want to play it now?`
               });
            }, 400);
         }
      }
    }
  }, [stateData, activeLevel, exploredStates, mapUnlocked, setMapUnlocked]);

  const handlePickLevel = (id) => {
    const lvl = LEVELS.find(l => l.id === id);
    if (id > mapUnlocked + 1) {
      setCustomAlert({ type: 'error', icon: '🔒', title: 'Level Locked', text: 'You must unlock previous levels first!' });
      return;
    }
    if (id > mapUnlocked) {
      // 🌟 Trigger Confirmation Modal for unlocking
      setConfirmAction({
        type: 'unlock',
        id: lvl.id,
        cost: lvl.unlockCost,
        title: 'Unlock Level',
        icon: '🗝️',
        color: '#06d6a0',
        message: `Are you sure you want to spend 🗝️ ${lvl.unlockCost} Keys to unlock ${lvl.title} early?`
      });
    } else {
      setActiveLevel(id);
      setHoveredState(null);
      setSearchTerm('');
      setSuggestions([]);
    }
  };

  // 🌟 Master function handling BOTH unlocking and level-ups
  const executeConfirm = async () => {
    const action = confirmAction;
    setConfirmAction(null);

    if (action.type === 'unlock') {
      if (keys >= action.cost) {
        const newKeys = keys - action.cost;
        setKeys(newKeys);
        setMapUnlocked(action.id);
        try {
          await fetch(`http://localhost:8081/api/progress/currency/${userId}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coins: coins, keysCount: newKeys })
          });
        } catch (err) { console.error("Failed to save currency", err); }
        setCustomAlert({ type: 'success', icon: '🔓', title: 'Level Unlocked!', text: `Level is now unlocked! You can now explore it.` });
      } else {
        setCustomAlert({ type: 'warning', icon: '🗝️', title: 'Out of Keys!', text: `You need ${action.cost} keys to unlock this level. Visit the store to get more!` });
        setShowStore(true);
      }
    } else if (action.type === 'levelUp') {
      if (action.nextRoute) {
        navigate(action.nextRoute); // Send them to the newly unlocked game
      } else {
        setActiveLevel(action.nextLevelId); // Go directly to the next level
        setHoveredState(null);
      }
    }
  };

  const updateCurrencyDB = async (c, k) => {
    try {
      await fetch(`http://localhost:8081/api/progress/currency/${userId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coins: c, keysCount: k })
      });
    } catch (err) { console.error("Failed to save currency", err); }
  };

  const watchAd = async () => { const c = coins+50, k = keys+1; setCoins(c); setKeys(k); setShowStore(false); setCustomAlert({ type: 'success', icon: '📺', title: 'Reward Claimed!', text: '+50 Coins and +1 Key.' }); await updateCurrencyDB(c, k); };
  const buyTokens = async () => { const c = coins+500, k = keys+10; setCoins(c); setKeys(k); setShowStore(false); setCustomAlert({ type: 'success', icon: '💳', title: 'Purchase Successful!', text: '+500 Coins and +10 Keys.' }); await updateCurrencyDB(c, k); };
  const claimDaily = async () => { const c = coins+100, k = keys+3; setCoins(c); setKeys(k); setShowStore(false); setCustomAlert({ type: 'success', icon: '🎁', title: 'Daily Reward Claimed!', text: '+100 Coins and +3 Keys.' }); await updateCurrencyDB(c, k); };
  const buyMegaPack = async () => { const c = coins+2000, k = keys+50; setCoins(c); setKeys(k); setShowStore(false); setCustomAlert({ type: 'success', icon: '💎', title: 'Mega Pack Purchased!', text: '+2000 Coins and +50 Keys.' }); await updateCurrencyDB(c, k); };

  const generateLockText = (lvl, isNextToUnlock) => {
    if (isNextToUnlock) {
      const prevExplored = (exploredStates[lvl.id - 1] || []).length;
      return `🗝️ ${lvl.unlockCost} Keys OR ${prevExplored}/10 States`;
    }
    return 'Complete previous level';
  };

  const activeMeta = LEVELS.find(l => l.id === activeLevel);
  const currentExploredCount = (exploredStates[activeLevel] || []).length;

  return (
    <>
      <LevelPickerPage
        title="🗺️ Explore India"
        levels={LEVELS} activeLevel={activeLevel} unlockedLevel={mapUnlocked}
        onPickLevel={handlePickLevel} onBack={() => { setActiveLevel(null); setHoveredState(null); }}
        lockText={generateLockText} jumpLabel={lvl => lvl.id === 11 ? '🎖️' : lvl.num}
      >
        <div className="ml-layout">
          <div className="ml-map-area">
            <IndiaMap onHover={setHoveredState} onClick={selectState} selectedState={selectedState} hoveredState={hoveredState} />
          </div>

          <div className="ml-sidebar">
            <div style={{background: '#fff8e1', padding: '8px 12px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 'bold', color: '#f57f17', marginBottom: '10px', border: '1px solid #ffe082'}}>
              {activeLevel 
                ? (activeLevelCost === 0 ? `💡 Exploring this level is completely FREE!` : `💡 Cost to explore a state in Level ${activeLevel}: 🪙 ${activeLevelCost} Coins`)
                : `💡 Select a level from the menu to start playing!`
              }
            </div>

            {activeLevel && currentExploredCount < 10 && activeLevel === mapUnlocked && (
              <div style={{background: '#e0f7ff', padding: '8px 12px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 'bold', color: '#005f80', marginBottom: '15px', border: '1px solid #b3ecff'}}>
                Level {activeLevel} Progress: {currentExploredCount} / 10 States
              </div>
            )}

            <div className="ml-search-wrap">
              <span className="ml-search-icon">🔍</span>
              <input className="ml-search-input" type="text" placeholder="Search for a state..." value={searchTerm} onChange={handleSearchChange} onKeyDown={e => { if (e.key === 'Enter' && suggestions.length) selectState(suggestions[0]); }} onBlur={() => setTimeout(() => setSuggestions([]), 120)} autoComplete="off" />
              {suggestions.length > 0 && (
                <div className="ml-suggestions">
                  {suggestions.map((key, i) => ( <div key={i} className="ml-suggestion-item" onMouseDown={() => selectState(key)}> {stateData[key].name} </div> ))}
                </div>
              )}
            </div>

            {stateInfo && <div className="ml-state-header"><h2 className="ml-state-name">{stateInfo.name}</h2></div>}

            {!stateInfo && (
              <div className="ml-empty">
                <span className="ml-empty-icon">{activeMeta?.emoji}</span>
                <span style={{ fontWeight:700, color:'#555' }}>{activeMeta?.title}</span>
                <span style={{ fontSize:'0.82rem', color:'#aaa' }}>Select a state to reveal its secrets!</span>
              </div>
            )}

            {stateInfo && activeMeta && (
              <MapLevel 
                levelMeta={activeMeta} 
                stateInfo={stateInfo} 
                key={`${activeLevel}-${activeKey}`} 
                onLevelComplete={() => {
                  const nextLevel = activeLevel + 1;
                  setConfirmAction({
                    type: 'levelUp',
                    nextLevelId: nextLevel,
                    nextRoute: nextLevel === 10 ? '/puzzle' : null,
                    title: nextLevel === 10 ? '🧩 Puzzle Unlocked!' : 'Level Unlocked!',
                    icon: nextLevel === 10 ? '🧩' : '🎉',
                    color: '#4caf50',
                    message: `Amazing! You explored 10 states in Level ${activeLevel}.\n\n🔓 ${nextLevel === 10 ? 'The Puzzle Game' : `Level ${nextLevel}`} is now UNLOCKED!\n\nDo you want to play it now?`
                  });
                }}
              />
            )}
          </div>
        </div>
      </LevelPickerPage>

      {/* 🌟 REPLACED HTML AND OLD UNLOCK MODAL WITH UNIFIED SHARED MODAL */}
      <ConfirmActionModal 
        confirmAction={confirmAction} 
        onConfirm={executeConfirm} 
        onCancel={() => setConfirmAction(null)} 
      />

      <StoreModal show={showStore} onClose={() => setShowStore(false)} onWatchAd={watchAd} onBuyTokens={buyTokens} onDailyReward={claimDaily} onBuyMegaPack={buyMegaPack} />
      <CustomAlertModal alert={customAlert} onClose={() => setCustomAlert(null)} />
    </>
  );
}