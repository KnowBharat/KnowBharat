import React, { useState } from 'react';
import LevelPickerPage from './LevelPickerPage';
import QuizGame from './QuizGame';
import { CustomAlertModal, StoreModal, ConfirmActionModal } from './SharedModals'; // 🌟 Added ConfirmActionModal
import '../Css/Quiz.css';
import { apiFetch } from '../Hooks/useApi';
import { useEconomy } from '../Hooks/EconomyContext';
import { API_BASE_URL } from '../Hooks/config';
import useGameModal from '../Hooks/useGameModal';

const BASE = `${API_BASE_URL}/api`;
const LEVELS = [
  { id: 'symbols', num: 1, emoji: '🦚', title: 'National Symbols', desc: 'Quiz on India\'s national symbols!', tag: 'Starter', color: '#00b4d8', bg: 'linear-gradient(135deg,#e0f7ff,#b3ecff)', border: '#00b4d8', tagColor: '#005f80' },
  { id: 'capital', num: 2, emoji: '🏛️', title: 'Capitals', desc: 'Which city is the capital of each state?', tag: 'Beginner', color: '#00b4d8', bg: 'linear-gradient(135deg,#e0f7ff,#b3ecff)', border: '#00b4d8', tagColor: '#005f80' },
  { id: 'language', num: 3, emoji: '🗣️', title: 'Languages', desc: 'What language is spoken in each state?', tag: 'Beginner', color: '#138808', bg: 'linear-gradient(135deg,#e8fded,#c6f6d5)', border: '#138808', tagColor: '#1a5c2a' },
  { id: 'geography', num: 4, emoji: '🌍', title: 'Geography', desc: 'Learn the area and population of every state.', tag: 'Easy', color: '#ff006e', bg: 'linear-gradient(135deg,#ffe0ef,#ffb3d1)', border: '#ff006e', tagColor: '#7a0033' },
  { id: 'food', num: 5, emoji: '🍛', title: 'Traditional Food', desc: 'Guess the dish — text and picture questions!', tag: 'Medium', color: '#8338ec', bg: 'linear-gradient(135deg,#f0e8ff,#d9b3ff)', border: '#8338ec', tagColor: '#4a0080' },
  { id: 'festival', num: 6, emoji: '🎭', title: 'Festivals', desc: 'Identify festivals — text and picture rounds!', tag: 'Medium', color: '#fb5607', bg: 'linear-gradient(135deg,#ffe8e0,#ffbfaa)', border: '#fb5607', tagColor: '#7a2000' },
  { id: 'place', num: 7, emoji: '🏯', title: 'Tourist Places', desc: 'Spot the landmark — text and picture rounds!', tag: 'Medium', color: '#3a86ff', bg: 'linear-gradient(135deg,#e0eaff,#b3ccff)', border: '#3a86ff', tagColor: '#003080' },
  { id: 'wear', num: 8, emoji: '👘', title: 'Traditional Wear', desc: 'Match clothing — text and picture questions!', tag: 'Hard', color: '#FF9933', bg: 'linear-gradient(135deg,#fff3e0,#ffe0b2)', border: '#FF9933', tagColor: '#7a4000' },
  { id: 'establish', num: 9, emoji: '📅', title: 'Established Year', desc: 'When was each state officially formed?', tag: 'Hard', color: '#ffbe0b', bg: 'linear-gradient(135deg,#fff8e0,#ffe680)', border: '#ffbe0b', tagColor: '#5a4000' },
  { id: 'mix', num: 10, emoji: '🎲', title: 'Mix Challenge', desc: 'All categories shuffled — stay sharp!', tag: 'Expert', color: '#d62828', bg: 'linear-gradient(135deg,#1a1a2e,#16213e)', border: '#d62828', tagColor: '#ff6b6b', dark: true },
];

export default function QuizIndex() {
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
  // quizUnlocked format: 1.1, 1.2, 1.3... just like matching!
  const quizUnlocked = unlockedLevels.quiz || 1.1;
  const setQuizUnlocked = (newVal) => setGameUnlock('quiz', newVal);

  // Helper to extract the base level (e.g., 2.3 -> 2)
  const currentBaseLevel = Math.floor(quizUnlocked);

  // 🌟 DYNAMIC LEVEL UNLOCK COST LOGIC (Slightly more expensive than Matching!)
  const getLevelUnlockCost = (levelNum) => {
    if (levelNum >= 2 && levelNum <= 4) return 13; // Matching was 11
    if (levelNum >= 5 && levelNum <= 7) return 15; // Matching was 13
    if (levelNum >= 8 && levelNum <= 10) return 17; // Matching was 15
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
          title: 'Unlock Level', icon: '🗝️', color: '#ff006e',
          message: `Are you sure you want to spend 🗝️ ${cost} Keys to unlock ${lvl.title} early?`
        });
      }
      return;
    }

    apiFetch('/dashboard/activity', { method: 'POST', body: JSON.stringify({ game: 'quiz', score: null, stateName: `Browsed Level:${id}` }) });
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
      setQuizUnlocked(lvl.num + 0.1);

      // Update Database
      try {
        await fetch(`${BASE}/auth/progress/currency/${userId}`, {
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
        title="🧠 Quiz Time"
        subtitle="Test your knowledge to earn points and unlock new levels!"
        levels={LEVELS} activeLevel={activeLevel} unlockedLevel={currentBaseLevel}
        onPickLevel={handlePickLevel} onBack={() => setActiveLevel(null)}
        jumpLabel={lvl => lvl.num === 10 ? lvl.emoji : lvl.num}
        lockText={(lvl, isNext) => isNext ? `Complete Lvl ${lvl.num - 1} OR pay 🗝️ ${getLevelUnlockCost(lvl.num)}` : `Locked`}
      >
        {activeLevel && (
          <QuizGame
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