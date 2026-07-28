import React, { useState } from 'react';
import LevelPickerPage from './LevelPickerPage';
import PuzzlePage from './PuzzlePage';
import { CustomAlertModal, StoreModal, ConfirmActionModal } from './SharedModals'; // 🌟 Added ConfirmActionModal
import '../Css/Puzzle.css';
import { apiFetch } from '../Hooks/useApi';
import { useEconomy } from '../Hooks/EconomyContext';
import { API_BASE_URL } from '../Hooks/config';
import useGameModal from '../Hooks/useGameModal';

const BASE = `${API_BASE_URL}/api/auth`;
const LEVELS = [
  { id: 'map', num: 1, emoji: '🗺️', title: 'India Map', desc: 'Put together the map of India to begin!', tag: 'Starter', color: '#06d6a0', bg: 'linear-gradient(135deg,#e0fff7,#b3ffea)', border: '#06d6a0', tagColor: '#005a40' },
  { id: 'symbols', num: 2, emoji: '🦚', title: 'National Symbols', desc: 'Piece together India\'s beautiful national symbols!', tag: 'Easy', color: '#00b4d8', bg: 'linear-gradient(135deg,#e0f7ff,#b3ecff)', border: '#00b4d8', tagColor: '#005f80' },
  { id: 'food', num: 3, emoji: '🍛', title: 'Traditional Food', desc: 'Piece together India\'s mouthwatering dishes!', tag: 'Easy', color: '#8338ec', bg: 'linear-gradient(135deg,#f0e8ff,#d9b3ff)', border: '#8338ec', tagColor: '#4a0080' },
  { id: 'place', num: 4, emoji: '🏯', title: 'Tourist Places', desc: 'Reconstruct stunning Indian landmarks!', tag: 'Medium', color: '#3a86ff', bg: 'linear-gradient(135deg,#e0eaff,#b3ccff)', border: '#3a86ff', tagColor: '#003080' },
  { id: 'festival', num: 5, emoji: '🎭', title: 'Festivals', desc: 'Puzzle together India\'s vibrant celebrations!', tag: 'Medium', color: '#fb5607', bg: 'linear-gradient(135deg,#ffe8e0,#ffbfaa)', border: '#fb5607', tagColor: '#7a2000' },
  { id: 'wear', num: 6, emoji: '👘', title: 'Traditional Wear', desc: 'Assemble beautiful traditional clothing images!', tag: 'Hard', color: '#FF9933', bg: 'linear-gradient(135deg,#fff3e0,#ffe0b2)', border: '#FF9933', tagColor: '#7a4000' },
  { id: 'mix', num: 7, emoji: '🎲', title: 'Mix Challenge', desc: 'Random images from all categories — good luck!', tag: 'Expert', color: '#d62828', bg: 'linear-gradient(135deg,#1a1a2e,#16213e)', border: '#d62828', tagColor: '#ff6b6b', dark: true },
];

export default function PuzzleIndex() {
  const userId = localStorage.getItem("userId");
  const [activeLevel, setActiveLevel] = useState(null);
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
  const puzzleUnlocked = unlockedLevels.puzzle || 1.1;
  const setPuzzleUnlocked = (val) => setGameUnlock('puzzle', val);

  // Helper to extract the base level (e.g., 2.3 -> 2)
  const currentBaseLevel = Math.floor(puzzleUnlocked);

  // 🌟 DYNAMIC LEVEL UNLOCK COST LOGIC
  const getLevelUnlockCost = (levelNum) => {
    if (levelNum === 2 || levelNum === 3) return 9;
    if (levelNum === 4 || levelNum === 5) return 11;
    if (levelNum >= 6) return 13;
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
          title: 'Unlock Level', icon: '🗝️', color: '#06d6a0',
          message: `Are you sure you want to spend 🗝️ ${cost} Keys to unlock ${lvl.title} early?`
        });
      }
      return;
    }

    apiFetch('/dashboard/activity', { method: 'POST', body: JSON.stringify({ game: 'puzzle', score: null, stateName: `Browsed Level:${id}` }) });
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
      setPuzzleUnlocked(lvl.num + 0.1);

      // Update Database
      try {
        await fetch(`${BASE}/progress/currency/${userId}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coins: coins, keysCount: newKeys })
        });
      } catch (err) { console.error("Failed to save currency", err); }

      setCustomAlert({ type: 'success', icon: '🔓', title: 'Level Unlocked!', text: `${lvl.title} is now unlocked! You can play its rounds using coins.` });

    } else {
      setCustomAlert({ type: 'warning', icon: '🗝️', title: 'Out of Keys!', text: `You need ${cost} keys to unlock this level. Visit the store to get more!` });
      setShowStore(true);
    }
  };
  return (
    <>
      <LevelPickerPage
        title="🧩 Puzzle Time!"
        subtitle="Play puzzles to earn points and unlock new levels!"
        levels={LEVELS}
        activeLevel={activeLevel}
        unlockedLevel={currentBaseLevel}
        onPickLevel={handlePickLevel}
        onBack={() => setActiveLevel(null)}
        jumpLabel={lvl => lvl.num === 7 ? lvl.emoji : lvl.num}
        lockText={(lvl, isNext) => isNext ? `Complete Lvl ${lvl.num - 1} OR pay 🗝️ ${getLevelUnlockCost(lvl.num)}` : `Locked`}
      >
        {activeLevel && (
          <PuzzlePage
            key={activeLevel}
            category={activeLevel}
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
      <CustomAlertModal alert={customAlert} onClose={() => setCustomAlert(null)} />
    </>
  );
}