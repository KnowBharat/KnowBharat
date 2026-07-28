import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Css/NationalSymbols.css';
import { apiFetch } from '../Hooks/useApi';
import { useEconomy } from '../Hooks/EconomyContext';
import { CustomAlertModal, StoreModal, ConfirmActionModal } from './SharedModals'; // 🌟 Added ConfirmActionModal
import { API_BASE_URL } from '../Hooks/config';
import useGameModal from '../Hooks/useGameModal';

const BASE = `${API_BASE_URL}/api`;
const CATEGORIES = ['All', 'Wildlife', 'Flora', 'Culture', 'State', 'Geography'];
const DEFAULT_UNLOCKED = ['1', '2', '3'];

export default function NationalSymbols() {
  const navigate = useNavigate(); 
  const userId = localStorage.getItem("userId");

  const [activeCategory, setActiveCategory] = useState('All');
  const [expanded, setExpanded] = useState(null);
  const [symbolsData, setSymbolsData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedImageModal, setSelectedImageModal] = useState(null);
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
  const unlockedSymbols = gameScores['unlocked_symbols_list'] || [];
  const setUnlockedSymbols = (val) => updateScoreData('unlocked_symbols_list', val);
  const progressCount = new Set([...DEFAULT_UNLOCKED, ...unlockedSymbols]).size;

  useEffect(() => {
    // 1. Fetch Symbol Data
    fetch(`${BASE}/symbols`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (!Array.isArray(data)) { setSymbolsData([]); setLoading(false); return; }
        setSymbolsData(data.map(item => ({
          ...item,
          tags: item.tags ? item.tags.split(',') : [],
          specialBg: item.specialBg === 1 || item.specialBg === true
        })));
        setLoading(false);
      })
      .catch(() => { setSymbolsData([]); setLoading(false); });

    // 2. Fetch Unlocked Symbols
    if (userId) {
  // 🌟 FIX: Added '/auth' to the path so it matches the secured controller
  fetch(`${BASE}/auth/progress/symbols/${userId}`) 
    .then(res => res.ok ? res.json() : [])
    .then(savedSymbols => {
      if (savedSymbols && Array.isArray(savedSymbols) && savedSymbols.length > 0) {
        setUnlockedSymbols(savedSymbols); 
      }
    })
    .catch(err => console.error("Could not fetch saved symbols:", err));
}
  }, [userId]);

  const filtered = activeCategory === 'All'
    ? symbolsData
    : symbolsData.filter(s => s.category === activeCategory);

  // 🌟 PRE-ACTION CHECK: Prompt before spending coins
  const promptUnlockSymbol = (sym) => {
    if (coins < 7) {
      setCustomAlert({ type: 'warning', icon: '🪙', title: 'Out of Coins!', text: 'You need 7 Coins to unlock this symbol! \nVisit the Store to get more.' });
      setShowStore(true);
      return;
    }
    
    setConfirmAction({
      type: 'unlockSymbol',
      sym: sym,
      cost: 7,
      title: 'Unlock Symbol',
      icon: '🪙',
      color: '#FF9933',
      message: `Are you sure you want to spend 🪙 7 Coins to unlock the mystery ${sym.category} symbol?`
    });
  };

  // 🌟 MASTER EXECUTE FUNCTION: Handles both Unlocking Symbols and Leveling Up
  const executeConfirm = async () => {
    const action = confirmAction;
    setConfirmAction(null); // Close modal

    if (action.type === 'unlockSymbol') {
      const { sym, cost } = action;
      const newCoins = coins - cost;
      const newUnlocked = Array.from(new Set([...unlockedSymbols, sym.id]));

      // Visually update UI instantly
      setCoins(newCoins); 
      setUnlockedSymbols(newUnlocked);
      
      try {
        await fetch(`${BASE}/auth/progress/currency/${userId}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ coins: newCoins, keysCount: keys })
        });

        await fetch(`${BASE}/auth/progress/data/${userId}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'unlocked_symbols_list', value: newUnlocked })
        });

        apiFetch('/dashboard/activity', { 
          method: 'POST', body: JSON.stringify({ game: 'symbols', score: null, stateName: `Unlocked Symbol ${sym.id}` }) 
        });
      } catch (err) {
        console.error("Failed to sync unlock to database", err);
      }
      
      // Trigger Next Level Map Modal if requirements are met
      if ((newUnlocked.length + DEFAULT_UNLOCKED.length) >= 10 && (unlockedLevels.map || 0) < 1) {
        setGameUnlock('map', 1);
        setTimeout(() => {
          setConfirmAction({
            type: 'levelUp',
            title: 'Map Unlocked!',
            icon: '🗺️',
            color: '#4caf50',
            message: `Amazing! You unlocked 10 National Symbols.\n\n🔓 Map Explorer is now UNLOCKED!\n\nDo you want to play it now?`
          });
        }, 400);
      }
    } else if (action.type === 'levelUp') {
      navigate('/map');
    }
  };

  const toggleFact = (e, id) => { e.stopPropagation(); setExpanded(expanded === id ? null : id); };
  const openImageModal = (sym) => setSelectedImageModal(sym);

  if (loading) {
    return <div className="ns-loading">Loading Symbols...</div>;
  }

  return (
    <main className="ns-page">
      <div className="ns-hero">
        <div className="ns-hero-content">
          <div className="ns-hero-chakra">☸</div>
          <h1 className="ns-hero-title">National Symbols</h1>
        </div>
      </div>

      <div className="ns-topbar">
        <div className="ns-categories">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`ns-cat-btn ${activeCategory === cat ? 'active' : ''}`}>
              {cat}
            </button>
          ))}
        </div>

        {progressCount < 10 && (unlockedLevels.map || 0) < 1 && (
          <div className="ns-progress-tracker">
            Level 1 Progress: {progressCount} / 10 Symbols
          </div>
        )}
      </div>

      <div className="ns-grid">
        {filtered.map((sym, i) => {
  const symbolIdStr = String(sym.id);
  const isUnlocked = DEFAULT_UNLOCKED.includes(symbolIdStr) || 
                     unlockedSymbols.map(String).includes(symbolIdStr);
const isOpen = expanded === sym.id;
          return (
            <div
              key={sym.id}
              className="ns-card"
              style={{
                background: isUnlocked ? sym.bg : '#f5f5f5',
                borderColor: isUnlocked ? sym.color : '#ccc',
                animationDelay: `${i * 0.055}s`,
                cursor: isUnlocked ? 'pointer' : 'default'
              }}
              onClick={() => isUnlocked && openImageModal(sym)}
            >
              {!isUnlocked ? (
                <div className="ns-locked-body">
                  <div className="ns-locked-icon">❓</div>
                  <div className="ns-card-cat ns-card-cat--locked">{sym.category}</div>
                  <p className="ns-locked-label">Mystery Symbol</p>
                  
                  {/* 🌟 Updated to call the Prompt instead of Execute */}
                  <button className="ns-unlock-btn" onClick={(e) => { e.stopPropagation(); promptUnlockSymbol(sym); }}>
                    Unlock 🪙 7
                  </button>
                </div>
              ) : (
                <>
                  <span className="ns-card-cat" style={{ color: sym.accent, borderColor: sym.color }}>{sym.category}</span>
                  <div className="ns-card-emoji" style={{ color: sym.color }}>
                    {sym.emoji && typeof sym.emoji === 'string' && sym.emoji.endsWith('.png') ? (
                      <img src={`/${sym.emoji}`} alt={sym.name} width="60" height="40" style={{ objectFit: 'cover' }} />
                    ) : (
                      sym.emoji || '❓'
                    )}
                  </div>
                  <div className="ns-card-title" style={{ color: sym.accent }}>{sym.title}</div>
                  <div className="ns-card-name">{sym.name}</div>
                  <div className="ns-card-tags">
                    {sym.tags && sym.tags.map(t => (
                      <span key={t} className="ns-tag" style={{ background: sym.color + '22', color: sym.accent }}>{t}</span>
                    ))}
                  </div>
                  <div className="ns-card-since" style={{ color: sym.accent + 'aa' }}>Since {sym.since}</div>
                  <button className="ns-tap-hint" style={{ color: isOpen ? 'white' : sym.color, background: isOpen ? sym.color : 'transparent', border: `2px solid ${sym.color}` }} onClick={(e) => toggleFact(e, sym.id)}>
                    {isOpen ? '▼ Close Fact' : '▲ Read Fun Fact!'}
                  </button>
                  <div className={`ns-fact-panel${isOpen ? ' show' : ''}`} onClick={(e) => e.stopPropagation()}>
                    <div className="ns-fact-bar" style={{ background: sym.color }} />
                    <p className="ns-fact-text">{sym.fact}</p>
                    <button className="ns-fact-close" style={{ color: sym.color }} onClick={(e) => toggleFact(e, sym.id)}>✕ Close</button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {selectedImageModal && (
        <div className="ns-img-overlay" onClick={() => setSelectedImageModal(null)}>
          <div className="ns-img-modal" onClick={(e) => e.stopPropagation()}>
            <button className="ns-img-close" style={{ background: selectedImageModal.color }} onClick={() => setSelectedImageModal(null)}>✕</button>
            <h2 className="ns-img-name" style={{ color: selectedImageModal.accent }}>{selectedImageModal.name}</h2>
            <p className="ns-img-title">{selectedImageModal.title}</p>
            <div className="ns-img-frame">
              {selectedImageModal.imageUrl ? (
                <img src={selectedImageModal.imageUrl} alt={selectedImageModal.name} className="ns-img-photo" />
              ) : (
                <span className="ns-img-emoji">{selectedImageModal.emoji}</span>
              )}
            </div>
            <div className="ns-img-fact" style={{ background: selectedImageModal.bg, border: `2px solid ${selectedImageModal.color}` }}>
              <p style={{ color: selectedImageModal.accent }}>"{selectedImageModal.fact}"</p>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 REPLACED INLINE HTML WITH SHARED COMPONENT */}
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
    </main>
  );
}