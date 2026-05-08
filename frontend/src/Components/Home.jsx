import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Css/Home.css';
import { apiFetch } from '../Hooks/useApi';
import { useEconomy } from '../Hooks/EconomyContext';
import { CustomAlertModal, StoreModal, ConfirmActionModal } from './SharedModals'; 
import '../Css/LevelPickerPage.css';

export default function KidsHome() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const { coins, setCoins, keys, setKeys, showStore, setShowStore, gameScores, unlockedLevels, setGameUnlock } = useEconomy();
  
  const [confirmAction, setConfirmAction] = useState(null); 
  const [customAlert, setCustomAlert] = useState(null);
  
  // Parent Switch & Auth State
  const [showParentAuth, setShowParentAuth] = useState(false);
  const [parentAuthMode, setParentAuthMode] = useState('password');
  const [parentPassword, setParentPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('from_dashboard') === 'true') {
      sessionStorage.removeItem('from_dashboard');
      window.location.reload();
    }
  }, []);

  // 🌟 Cleanly floor the decimals (e.g., 2.3 -> Level 2) for the UI checks
  const nsUnlockedCount = (gameScores['unlocked_symbols_list'] || []).length;
  const mapUnlocked = unlockedLevels.map || 0;
  const puzzleUnlocked = Math.floor(unlockedLevels.puzzle || 0);
  const matchingUnlocked = Math.floor(unlockedLevels.matching || 0);
  const quizUnlocked = Math.floor(unlockedLevels.quiz || 0);
  const spellUnlocked = Math.floor(unlockedLevels.spell || 0);

  // 🌟 INCREASED EARLY UNLOCK KEY COSTS TO MATCH THE NEW ECONOMY
  const MODULES = [
    { id: 1, route: '/national', title: 'National Symbols', game: 'symbols', img: '/flag.png', unlockCost: 0, description: "Learn about India's national symbols!", isUnlocked: true, reqText: "" },
    { id: 2, route: '/map', title: 'View the Map', game: 'map', img: '/map.jpg', unlockCost: 35, description: 'Explore states on an interactive map!', isUnlocked: mapUnlocked >= 1 || nsUnlockedCount >= 10, reqText: `Unlock 10 Symbols (${nsUnlockedCount}/10)` },
    { id: 3, route: '/puzzle', title: 'Solve the Puzzle', game: 'puzzle', img: '/puzzle.png', unlockCost: 75, description: 'Put the pieces together!', isUnlocked: puzzleUnlocked >= 1 || mapUnlocked >= 10, reqText: `Reach Map Level 10 (${mapUnlocked}/10)` },
    { id: 4, route: '/matching', title: 'Matching Game', game: 'matching', img: '/matching.png', unlockCost: 120, description: 'Match states with their famous things!', isUnlocked: matchingUnlocked >= 1 || puzzleUnlocked >= 5, reqText: `Reach Puzzle Level 5 (${puzzleUnlocked}/5)` },
    { id: 5, route: '/quiz', title: 'Quiz Master', game: 'quiz', img: '/quiz.png', unlockCost: 250, description: 'Challenge yourself with the ultimate quiz!', isUnlocked: quizUnlocked >= 1 || matchingUnlocked >= 5, reqText: `Reach Match Level 5 (${matchingUnlocked}/5)` },
    { id: 6, route: '/spell', title: 'Spell Check', game: 'spell', img: '/spelling.jpg', unlockCost: 180, description: 'Test your spelling with fun words!', isUnlocked: spellUnlocked >= 1 || quizUnlocked >= 5, reqText: `Reach Quiz Level 5 (${quizUnlocked}/5)` }
  ];

  const handleCardClick = (module) => {
    if (module.isUnlocked) {
      apiFetch('/dashboard/activity', { method: 'POST', body: JSON.stringify({ game: module.game, score: null, stateName: null }) });
      navigate(module.route);
    } else {
      setConfirmAction({
        module: module,
        title: 'Unlock Game',
        icon: '🗝️',
        color: '#06d6a0',
        message: `Are you sure you want to spend 🗝️ ${module.unlockCost} Keys to unlock ${module.title} early?`
      });
    }
  };

  const executeUnlock = async () => {
    const { module } = confirmAction;
    const cost = module.unlockCost;
    setConfirmAction(null); 

    if (keys >= cost) {
      const newKeys = keys - cost;
      
      setKeys(newKeys);
      setGameUnlock(module.game, 1);
      
      try {
        await fetch(`http://localhost:8081/api/progress/currency/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coins: coins, keysCount: newKeys })
        });
      } catch (err) {
        console.error("Failed to sync keys to database:", err);
      }

      apiFetch('/dashboard/activity', {
        method: 'POST',
        body: JSON.stringify({ game: module.game, score: null, stateName: 'Unlocked Early with Keys' })
      });

      setCustomAlert({ type: 'success', icon: '🔓', title: 'Game Unlocked!', text: `${module.title} is now unlocked and ready to play!` });

    } else {
      setCustomAlert({ type: 'warning', icon: '🔑', title: 'Out of Keys!', text: `You need ${cost} Keys to unlock this early. Visit the store to get more!` });
      setShowStore(true);
    }
  };

  const handleParentAuthSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!localStorage.getItem('token')) {
      setCustomAlert({ type: 'error', icon: '⚠️', title: 'Session Expired', text: 'Please log in again.' });
      setShowParentAuth(false);
      setIsLoading(false);
      navigate('/login');
      return;
    }
    
    const res = await apiFetch('/verify-password', {
      method: 'POST',
      body: JSON.stringify({ password: parentPassword })
    });
    
    setIsLoading(false);
    if (res && res.message === "Access Granted") {
      navigate('/parent-dashboard');
    } else {
      setCustomAlert({ type: 'error', icon: '❌', title: 'Access Denied', text: res?.error || 'Incorrect password.' });
    }
    setParentPassword('');
  };

  const resetModalState = () => {
    setShowParentAuth(false);
    setParentAuthMode('password');
    setParentPassword('');
    setResetEmail('');
    setResetOtp('');
    setNewPassword('');
    setConfirmPassword('');
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

  return (
    <main className="container">
      <div className="parent-switch-container">
        <button className="parent-switch-btn" onClick={() => setShowParentAuth(true)}>
          Parent Dashboard
        </button>
      </div>

      <div className="grid">
        {MODULES.map((module) => (
          <div key={module.id} className={`card ${!module.isUnlocked ? 'locked-card' : ''}`} onClick={() => handleCardClick(module)}>
            {!module.isUnlocked && (
              <div className="lock-overlay">
                <div className="lock-icon">🔒</div>
                <div className="lock-text"><b>To Unlock:</b><br />{module.reqText}</div>
                <div className="play-cost-badge">OR Pay: {module.unlockCost} 🔑</div>
              </div>
            )}
            <img src={module.img} alt={module.title} width="100" height="100" />
            <h2>{module.title}</h2>
            <p>{module.description}</p>
          </div>
        ))}
      </div>

      {showParentAuth && (
        <div className="modal-overlay">
          {parentAuthMode === 'password' && (
            <form className="auth-modal" onSubmit={handleParentAuthSubmit}>
              <h2>Parent Access</h2>
              <p>Enter your password to continue.</p>
              <input type="password" placeholder="Password" value={parentPassword} onChange={(e) => setParentPassword(e.target.value)} required className="auth-input" />
              <div className="forgot-pass-container">
                <button type="button" className="btn-forgot-pass" onClick={() => setParentAuthMode('forgot')}>Forgot Password?</button>
              </div>
              <div className="auth-modal-btns">
                <button type="submit" className="btn-auth-primary" disabled={isLoading}>{isLoading ? 'Checking...' : 'Submit'}</button>
                <button type="button" className="btn-auth-cancel" onClick={resetModalState}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      )}

      <ConfirmActionModal 
        confirmAction={confirmAction} 
        onConfirm={executeUnlock} 
        onCancel={() => setConfirmAction(null)} 
      />

      <StoreModal 
        show={showStore} 
        onClose={() => setShowStore(false)} 
        onWatchAd={watchAd} 
        onBuyTokens={buyTokens} 
        onDailyReward={claimDaily} 
        onBuyMegaPack={buyMegaPack} 
      />
      
      <CustomAlertModal alert={customAlert} onClose={() => setCustomAlert(null)} />
    </main>
  );
}