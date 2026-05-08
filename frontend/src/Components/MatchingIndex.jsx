import React, { useState } from 'react';
import LevelPickerPage from './LevelPickerPage';
import MatchingGame from './MatchingGame';
import { CustomAlertModal, StoreModal, ConfirmActionModal } from './SharedModals'; // 🌟 Added ConfirmActionModal
import '../Css/MatchingGame.css';
import { apiFetch } from '../Hooks/useApi';
import { useEconomy } from '../Hooks/EconomyContext'; 

const LEVELS = [
  { id: 'symbols', num: 1, emoji: '🦚', title: 'National Symbols', desc: 'Match national symbols to their names!', tag: 'Starter', color: '#00b4d8', bg: 'linear-gradient(135deg,#e0f7ff,#b3ecff)', border: '#00b4d8', tagColor: '#005f80' },
  { id: 'capital', num: 2, emoji: '🏛️', title: 'Capitals', desc: 'Match each state to its capital city.', tag: 'Beginner', color: '#00b4d8', bg: 'linear-gradient(135deg,#e0f7ff,#b3ecff)', border: '#00b4d8', tagColor: '#005f80' },
  { id: 'language', num: 3, emoji: '🗣️', title: 'Languages', desc: 'Which language does each state speak?', tag: 'Beginner', color: '#138808', bg: 'linear-gradient(135deg,#e8fded,#c6f6d5)', border: '#138808', tagColor: '#1a5c2a' },
  { id: 'food', num: 4, emoji: '🍛', title: 'Traditional Food', desc: 'Pair each state with its famous dish.', tag: 'Medium', color: '#8338ec', bg: 'linear-gradient(135deg,#f0e8ff,#d9b3ff)', border: '#8338ec', tagColor: '#4a0080' },
  { id: 'festival', num: 5, emoji: '🎭', title: 'Festivals', desc: 'Match states to their celebrated festivals.', tag: 'Medium', color: '#fb5607', bg: 'linear-gradient(135deg,#ffe8e0,#ffbfaa)', border: '#fb5607', tagColor: '#7a2000' },
  { id: 'place', num: 6, emoji: '🏯', title: 'Tourist Places', desc: 'Which landmark belongs to which state?', tag: 'Medium', color: '#3a86ff', bg: 'linear-gradient(135deg,#e0eaff,#b3ccff)', border: '#3a86ff', tagColor: '#003080' },
  { id: 'wear', num: 7, emoji: '👘', title: 'Traditional Wear', desc: "Match the state's traditional men's clothing.", tag: 'Hard', color: '#ffbe0b', bg: 'linear-gradient(135deg,#fff8e0,#ffe680)', border: '#ffbe0b', tagColor: '#5a4000' },
  { id: 'established', num: 8, emoji: '📅', title: 'Established Year', desc: 'Match the state to when it was formed.', tag: 'Easy', color: '#FF9933', bg: 'linear-gradient(135deg,#fff3e0,#ffe0b2)', border: '#FF9933', tagColor: '#7a4000' },
  { id: 'mix', num: 9, emoji: '🎲', title: 'Mix Challenge', desc: 'Random categories — expect the unexpected!', tag: 'Expert', color: '#d62828', bg: 'linear-gradient(135deg,#1a1a2e,#16213e)', border: '#d62828', tagColor: '#ff6b6b', dark: true },
];

export default function MatchingIndex() {
  const userId = localStorage.getItem("userId");
  const [activeLevel, setActiveLevel] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // 🌟 Unified Confirmation State
  const [customAlert, setCustomAlert] = useState(null); 
  
  const { coins, setCoins, keys, setKeys, showStore, setShowStore, unlockedLevels, setGameUnlock } = useEconomy();
  
  // matchingUnlocked format: 1.1, 1.2, 1.3... just like puzzle!
  const matchingUnlocked = unlockedLevels.matching || 1.1;
  const setMatchingUnlocked = (val) => setGameUnlock('matching', val);

  // Helper to extract the base level (e.g., 2.3 -> 2)
  const currentBaseLevel = Math.floor(matchingUnlocked);
  const activeMeta = LEVELS.find(l => l.id === activeLevel);

  // 🌟 DYNAMIC LEVEL UNLOCK COST LOGIC (Slightly more expensive than Puzzle!)
  const getLevelUnlockCost = (levelNum) => {
    if (levelNum === 2 || levelNum === 3) return 11; // Puzzle was 9
    if (levelNum >= 4 && levelNum <= 6) return 13;   // Puzzle was 11
    if (levelNum >= 7 && levelNum <= 9) return 15;   // Puzzle was 13
    return 0; 
  };

  const handlePickLevel = (id) => {
    const lvl = LEVELS.find(l => l.id === id);
    
    // Check if the level is locked
    if (lvl.num > currentBaseLevel) {
      if (lvl.num > currentBaseLevel + 1) {
        setCustomAlert({ type: 'error', icon: '🔒', title: 'Level Locked', text: 'You must unlock previous levels first!' });
      } else {
        // 🌟 Prepare Confirmation Modal for Keys
        const cost = getLevelUnlockCost(lvl.num);
        setConfirmAction({
            lvl: lvl, cost: cost,
            title: 'Unlock Level', icon: '🗝️', color: '#00b4d8',
            message: `Are you sure you want to spend 🗝️ ${cost} Keys to unlock ${lvl.title} early?`
        });
      }
      return;
    }
    
    apiFetch('/dashboard/activity', { method: 'POST', body: JSON.stringify({ game: 'matching', score: null, stateName: `Browsed Level:${id}` }) });
    setActiveLevel(id);
  };

  // 🌟 EXECUTE AFTER CONFIRMATION
  const executeConfirm = async () => {
    const { cost, lvl } = confirmAction;
    setConfirmAction(null); // Close modal

    if (keys >= cost) {
      const newKeys = keys - cost;
      setKeys(newKeys);
      
      // Unlock the level by setting it to X.1
      setMatchingUnlocked(lvl.num + 0.1);
      
      // Update Database
      try {
        await fetch(`http://localhost:8081/api/progress/currency/${userId}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coins: coins, keysCount: newKeys })
        });
      } catch (err) { console.error("Failed to save currency", err); }

      setCustomAlert({ type: 'success', icon: '🔓', title: 'Level Unlocked!', text: `${lvl.title} is now unlocked! You can play its rounds using coins.` });
      
    } else {
      setCustomAlert({ type: 'warning', icon: '🗝️', title: 'Out of Keys!', text: `You need ${cost} keys to unlock this level. Visit the store to get more!` });
      setShowStore(true);
    }
  };

  // 🌟 FULLY INTEGRATED ASYNC STORE FUNCTIONS
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

  return (
    <>
      <LevelPickerPage
        title="🎮 Matching Game"
        subtitle="Play matching rounds to earn points and unlock new levels!"
        levels={LEVELS} activeLevel={activeLevel} unlockedLevel={currentBaseLevel}
        onPickLevel={handlePickLevel} onBack={() => setActiveLevel(null)}
        jumpLabel={lvl => lvl.num === 9 ? '🎲' : lvl.num}
        lockText={(lvl, isNext) => isNext ? `Complete Lvl ${lvl.num - 1} OR pay 🗝️ ${getLevelUnlockCost(lvl.num)}` : `Locked`}
      >
        {activeLevel && (
          <MatchingGame 
            key={activeLevel} 
            category={activeLevel} 
            levelColor={activeMeta?.color} 
            onBack={() => setActiveLevel(null)} 
          />
        )}
      </LevelPickerPage>

      {/* 🌟 REPLACED HTML WITH SHARED COMPONENT */}
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