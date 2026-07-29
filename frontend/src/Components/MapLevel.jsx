import React, { useEffect, useState } from 'react';
import { trackStateVisit, apiFetch } from '../Hooks/useApi';
import useCategoryData from '../Hooks/useCategoryData';
import { useEconomy } from '../Hooks/EconomyContext';
import { CustomAlertModal, StoreModal, ConfirmActionModal } from './SharedModals';
import { API_BASE_URL } from '../Hooks/config';
import useGameModal from '../Hooks/useGameModal';
const BASE = `${API_BASE_URL}/api/auth`;

export default function MapLevel({ levelMeta, stateInfo, onLevelComplete }) {
  const id = stateInfo?.id || 0;
  const userId = localStorage.getItem("userId");

  const foodData = useCategoryData('foods', id);
  const placeData = useCategoryData('places', id);
  const festivalData = useCategoryData('festivals', id);
  const wearData = useCategoryData('wears', id);

  const [learnIdx, setLearnIdx] = useState(0);
  const [learnTab, setLearnTab] = useState('basic');
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
  // TIERED PRICING LOGIC
  const getLevelCost = (num) => {
    if (num === 1) return 0;
    if (num >= 2 && num <= 4) return 7;
    if (num >= 5 && num <= 8) return 11;
    if (num >= 9 && num <= 11) return 13;
    return 0;
  };

  const cost = getLevelCost(levelMeta.num);

  const unlockKey = `${stateInfo.id} lvl ${levelMeta.num}`;
  const unlockedNodes = Array.isArray(gameScores['map_explored_nodes']) ? gameScores['map_explored_nodes'] : [];

  const isUnlocked = levelMeta.num === 1 || unlockedNodes.includes(unlockKey);
  useEffect(() => {
    // if (stateInfo?.name) trackStateVisit(stateInfo.name);
    setLearnIdx(0);
    setLearnTab('basic');

    const isAlreadySaved = unlockedNodes.includes(unlockKey);

    if (levelMeta?.num === 1 && !isAlreadySaved) {
      const newNodes = [...unlockedNodes, unlockKey];
      updateScoreData('map_explored_nodes', newNodes);

      fetch(`${BASE}/progress/data/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'map_explored_nodes', value: newNodes }) // Saves "14 lvl 1" as a string
      }).catch(err => console.error(err));
    }

    // Check for Level Progression (10 states)
    if ((isUnlocked || levelMeta?.num === 1) && stateInfo?.id && levelMeta?.num) {
      const currentLevelExplored = unlockedNodes.filter(node => node.endsWith(` lvl ${levelMeta.num}`));

      if (currentLevelExplored.length >= 10 && levelMeta.num === (unlockedLevels.map || 1)) {
        setGameUnlock('map', levelMeta.num + 1);
        if (onLevelComplete) {
          setTimeout(onLevelComplete, 400);
        }
      }
    }
  }, [stateInfo?.id, stateInfo?.name, levelMeta?.num, unlockKey, unlockedNodes, isUnlocked, unlockedLevels.map]);

  if (!stateInfo || !levelMeta) return null;

  // PRE-ACTION CHECK: Prompt user before spending coins
  const promptUnlock = () => {
    if (coins < cost) {
      setCustomAlert({
        type: 'warning',
        icon: '🪙',
        title: 'Out of Coins!',
        text: `You need ${cost} Coins for Level ${levelMeta.num}. \nVisit the Store to get more.`
      });
      setShowStore(true);
      return;
    }

    if (cost === 0) {
      executeUnlock(0);
    } else {
      setConfirmAction({
        cost: cost,
        title: 'Explore State',
        icon: '🪙',
        color: '#FF9933',
        message: `Are you sure you want to spend 🪙 ${cost} Coins to uncover the secrets of ${stateInfo.name}?`
      });
    }
  };

  // ASYNC UNLOCK: Deducts coins, saves to UI, and saves to DB instantly!
  const executeUnlock = async (freeCost) => {
    const finalCost = freeCost !== undefined ? freeCost : confirmAction.cost;
    setConfirmAction(null);

    const newCoins = coins - finalCost;
    const newNodes = [...unlockedNodes, unlockKey];

    setCoins(newCoins);
    updateScoreData('map_explored_nodes', newNodes);

    try {
      if (finalCost > 0) {
        await fetch(`${BASE}/progress/currency/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coins: newCoins, keysCount: keys })
        });
      }

      await fetch(`${BASE}/progress/data/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'map_explored_nodes', value: newNodes })
      });

      apiFetch('/dashboard/activity', {
        method: 'POST',
        body: JSON.stringify({
          game: 'map',
          score: null,
          stateName: `Unlocked ${stateInfo.name} (Lvl ${levelMeta.num})`
        })
      });

      if (finalCost > 0) {
        setCustomAlert({
          type: 'success',
          icon: '🔓',
          title: 'State Unlocked!',
          text: `Success! ${finalCost} Coins deducted.`
        });
      }
    } catch (err) {
      console.error("Failed to sync unlock to database", err);
    }
  };

  const capital = stateInfo.capital || stateInfo.aboutCapital || '—';

  const renderCarousel = (dataArray, title, colorHex, bgClass) => {
    const item = dataArray?.[learnIdx];
    if (!dataArray?.length) return <div style={{ textAlign: 'center', color: '#bbb', padding: '30px' }}>No data available.</div>;

    return (
      <div className={`learn-card ${bgClass}`} style={{ border: `1.5px solid ${colorHex}55` }}>
        <div className="learn-title" style={{ color: colorHex }}>{title}</div>
        {item && (
          <>
            <img className="learn-carousel-img" src={item.imageUrl} alt={item.name} />
            <div className="learn-carousel-name">{item.name}</div>
            <div className="learn-carousel-desc">{item.description}</div>
            <div className="learn-carousel-nav">
              <button className="learn-nav-btn" onClick={() => setLearnIdx(i => (i - 1 + dataArray.length) % dataArray.length)}>← Prev</button>
              <span className="learn-counter">{learnIdx + 1}/{dataArray.length}</span>
              <button className="learn-nav-btn" onClick={() => setLearnIdx(i => (i + 1) % dataArray.length)}>Next →</button>
            </div>
          </>
        )}
      </div>
    );
  };

  let content = null;

  if (!isUnlocked) {
    content = (
      <div className="learn-card" style={{ background: '#fff8e1', textAlign: 'center', padding: '30px 20px', border: '3px dashed #ffc107', borderRadius: '16px' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '10px' }}>🔒</div>
        <h3 style={{ color: '#b45309', marginBottom: '10px', fontFamily: "'Baloo 2', cursive", fontSize: '1.5rem' }}>Level Locked</h3>
        <p style={{ color: '#777', fontSize: '1rem', marginBottom: '20px' }}>Pay coins to discover new facts about {stateInfo.name}!</p>
        <button
          onClick={promptUnlock}
          style={{ background: '#FF9933', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '14px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 0 #cc7a00', transition: 'transform 0.1s' }}
          onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
        >
          Unlock 🪙 {cost}
        </button>
      </div>
    );
  } else if (levelMeta.num === 1) {
    content = (
      <div className="learn-card blue">
        <div className="learn-title" style={{ color: '#005f80' }}>🗺️ This state is called…</div>
        <div className="learn-value">{stateInfo.name}</div>
        <div className="learn-fact-row">{stateInfo.about}</div>
      </div>
    );
  } else if (levelMeta.num === 2) {
    content = (
      <div className="learn-card green">
        <div className="learn-title" style={{ color: '#1a5c2a' }}>🏛️ Capital of {stateInfo.name}</div>
        <div className="learn-value">{capital}</div>
        {stateInfo.aboutCapital && stateInfo.aboutCapital !== capital && (
          <div className="learn-fact-row"><span className="learn-fact-icon">📖</span><span>{stateInfo.aboutCapital}</span></div>
        )}
      </div>
    );
  } else if (levelMeta.num === 3) {
    content = (
      <div className="learn-card orange">
        <div className="learn-title" style={{ color: '#7a4000' }}>🗣️ Language of {stateInfo.name}</div>
        <div className="learn-value">{stateInfo.language}</div>
        <div className="learn-fact-row"><span className="learn-fact-icon">🏛️</span><span><span className="learn-fact-label">Capital:</span>{capital}</span></div>
        <div style={{ marginTop: '10px', background: 'rgba(255,255,255,0.6)', borderRadius: '10px', padding: '8px 12px', fontSize: '0.82rem', color: '#555', lineHeight: 1.5 }}>
          💡 <strong>Fun fact:</strong> India has 22 scheduled languages and hundreds of dialects. {stateInfo.language} is spoken by millions of people!
        </div>
      </div>
    );
  } else if (levelMeta.num === 4) {
    content = (
      <div className="learn-card pink">
        <div className="learn-title" style={{ color: '#7a0033' }}>🌍 Geography of {stateInfo.name}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '8px 0' }}>
          {[
            { icon: '📐', label: 'Area', val: stateInfo.area },
            { icon: '👨‍👩‍👧', label: 'Population', val: stateInfo.population },
          ].map(item => (
            <div key={item.label} style={{ background: 'white', borderRadius: '12px', padding: '12px', textAlign: 'center', boxShadow: '0 3px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: '1.6rem' }}>{item.icon}</div>
              <div style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 800, fontSize: '0.75rem', color: '#c1121f', marginTop: '4px' }}>{item.label}</div>
              <div style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 800, fontSize: '0.95rem', color: '#333', marginTop: '4px', wordBreak: 'break-word' }}>{item.val}</div>
            </div>
          ))}
        </div>
        <div className="learn-fact-row" style={{ marginTop: '6px' }}><span className="learn-fact-icon">🏛️</span><span><span className="learn-fact-label">Capital:</span>{capital}</span></div>
        <div className="learn-fact-row"><span className="learn-fact-icon">🗣️</span><span><span className="learn-fact-label">Language:</span>{stateInfo.language}</span></div>
      </div>
    );
  } else if (levelMeta.num === 5) {
    content = renderCarousel(foodData, `🍛 Foods of ${stateInfo.name}`, '#4a0080', 'purple');
  } else if (levelMeta.num === 6) {
    content = renderCarousel(festivalData, `🎭 Festivals of ${stateInfo.name}`, '#7a2000', 'orange');
  } else if (levelMeta.num === 7) {
    content = renderCarousel(placeData, `🏯 Tourist Places in ${stateInfo.name}`, '#003080', 'blue');
  } else if (levelMeta.num === 8) {
    content = !wearData ? <div style={{ textAlign: 'center', color: '#bbb', padding: '30px' }}>No wear data available.</div> : (
      <div className="learn-card yellow">
        <div className="learn-title" style={{ color: '#5a4000' }}>👘 Traditional Wear of {stateInfo.name}</div>
        <img src={wearData.imageUrl} alt="Wear" style={{ width: '100%', maxHeight: '170px', objectFit: 'contain', borderRadius: '14px', marginBottom: '12px', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }} />
        <div className="learn-fact-row"><span className="learn-fact-icon">🧑‍🦱</span><span><span className="learn-fact-label">Men wear:</span>{wearData.menWear}</span></div>
        <div className="learn-fact-row"><span className="learn-fact-icon">👩‍🦰</span><span><span className="learn-fact-label">Women wear:</span>{wearData.womenWear}</span></div>
      </div>
    );
  } else if (levelMeta.num === 9) {
    content = (
      <div className="learn-card teal">
        <div className="learn-title" style={{ color: '#005a40' }}>📜 History of {stateInfo.name}</div>
        <div style={{ textAlign: 'center', margin: '8px 0' }}>
          <div style={{ fontSize: '0.82rem', color: '#888', fontWeight: 600 }}>Established in</div>
          <div className="learn-value" style={{ fontSize: '2.2rem' }}>{stateInfo.established}</div>
        </div>
        {stateInfo.about && (
          <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: '12px', padding: '10px 14px', fontSize: '0.84rem', color: '#333', lineHeight: 1.6, marginTop: '8px' }}>
            <div style={{ fontWeight: 800, color: '#005a40', marginBottom: '4px' }}>📖 About</div>
            {stateInfo.about}
          </div>
        )}
      </div>
    );
  } else if (levelMeta.num === 10) {
    content = (
      <>
        <div style={{ textAlign: 'center', padding: '16px', background: 'linear-gradient(135deg,#d62828,#a00000)', borderRadius: 'var(--radius)', color: 'white' }}>
          <div style={{ fontSize: '2.5rem' }}>🏆</div>
          <div style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 800, fontSize: '1.1rem', marginTop: '4px' }}>Master Level: {stateInfo.name}</div>
          <div style={{ fontSize: '0.78rem', opacity: 0.8, marginTop: '2px' }}>Complete profile — learn everything!</div>
        </div>
        <div className="learn-card red">
          <div className="learn-title" style={{ color: '#7a0000' }}>📋 Complete Profile</div>
          {[
            { icon: '🗺️', label: 'State', val: stateInfo.name },
            { icon: '🏛️', label: 'Capital', val: capital },
            { icon: '🗣️', label: 'Language', val: stateInfo.language },
            { icon: '📐', label: 'Area', val: stateInfo.area },
            { icon: '👨‍👩‍👧', label: 'Population', val: stateInfo.population },
            { icon: '📅', label: 'Established', val: stateInfo.established },
          ].map(r => (
            <div key={r.label} className="learn-fact-row"><span className="learn-fact-icon">{r.icon}</span><span><span className="learn-fact-label">{r.label}:</span>{r.val}</span></div>
          ))}
        </div>
        {stateInfo.about && (
          <div style={{ background: 'white', borderRadius: '14px', padding: '12px 16px', border: '1.5px solid #f0f0f0', fontSize: '0.84rem', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 800, color: '#c1121f', marginBottom: '6px' }}>📖 About</div>
            {stateInfo.about}
          </div>
        )}
      </>
    );
  } else if (levelMeta.num === 11) {
    const learnTabs = [
      { key: 'basic', label: 'Facts' }, { key: 'food', label: 'Food' },
      { key: 'fest', label: 'Festivals' }, { key: 'tour', label: 'Tourist' }, { key: 'wear', label: 'Wear' },
    ];
    const learnDataMap = { food: foodData, fest: festivalData, tour: placeData };
    const learnCarouselData = learnDataMap[learnTab];
    const learnItem = learnCarouselData?.[learnIdx];

    content = (
      <>
        <div style={{ background: 'linear-gradient(135deg,#d62828,#a00000)', borderRadius: '16px', padding: '14px 16px', color: 'white', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem' }}>🎖️</div>
          <div style={{ fontFamily: "'Baloo 2',cursive", fontWeight: 800, fontSize: '1.05rem', marginTop: '4px' }}>Grand Challenge — {stateInfo.name}</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '2px' }}>All topics · Complete guide</div>
        </div>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {learnTabs.map(t => (
            <button key={t.key} className={`details-controls ${learnTab === t.key ? 'active-view' : ''}`} onClick={() => { setLearnTab(t.key); setLearnIdx(0); }}>{t.label}</button>
          ))}
        </div>
        {learnTab === 'basic' && (
          <div className="learn-card red">
            <div className="learn-title" style={{ color: '#7a0000' }}>📋 Complete Facts</div>
            {[
              ['🗺️', 'State', stateInfo.name], ['🏛️', 'Capital', capital], ['🗣️', 'Language', stateInfo.language],
              ['📐', 'Area', stateInfo.area], ['👨‍👩‍👧', 'Population', stateInfo.population], ['📅', 'Established', stateInfo.established],
            ].map(([icon, label, val]) => (
              <div key={label} className="learn-fact-row"><span className="learn-fact-icon">{icon}</span><span><span className="learn-fact-label">{label}:</span>{val}</span></div>
            ))}
            {stateInfo.about && <div style={{ marginTop: '8px', background: 'rgba(255,255,255,0.6)', borderRadius: '10px', padding: '8px 12px', fontSize: '0.82rem', lineHeight: 1.5, color: '#444' }}>📖 {stateInfo.about}</div>}
          </div>
        )}
        {['food', 'fest', 'tour'].includes(learnTab) && (
          learnItem ? (
            <div className="learn-card" style={{ background: '#f0f8ff', border: '1.5px solid #b3e0ff', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
              <img className="learn-carousel-img" src={learnItem.imageUrl} alt={learnItem.name} />
              <div className="learn-carousel-name">{learnItem.name}</div>
              <div className="learn-carousel-desc">{learnItem.description}</div>
              <div className="learn-carousel-nav">
                <button className="learn-nav-btn" onClick={() => setLearnIdx(i => (i - 1 + learnCarouselData.length) % learnCarouselData.length)}>← Prev</button>
                <span className="learn-counter">{learnIdx + 1} / {learnCarouselData.length}</span>
                <button className="learn-nav-btn" onClick={() => setLearnIdx(i => (i + 1) % learnCarouselData.length)}>Next →</button>
              </div>
            </div>
          ) : <div style={{ textAlign: 'center', color: '#bbb', padding: '20px' }}>No data available.</div>
        )}
        {learnTab === 'wear' && (
          wearData ? (
            <div className="learn-card yellow">
              <img src={wearData.imageUrl} alt="Wear" style={{ width: '100%', maxHeight: '160px', objectFit: 'contain', borderRadius: '14px', marginBottom: '10px' }} />
              <div className="learn-fact-row"><span className="learn-fact-icon">🧑‍🦱</span><span><span className="learn-fact-label">Men:</span>{wearData.menWear}</span></div>
              <div className="learn-fact-row"><span className="learn-fact-icon">👩‍🦰</span><span><span className="learn-fact-label">Women:</span>{wearData.womenWear}</span></div>
            </div>
          ) : <div style={{ textAlign: 'center', color: '#bbb', padding: '20px' }}>No wear data.</div>
        )}
      </>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {levelMeta.num < 10 && (
        <div className="lt-banner" style={{ '--lc': levelMeta.color }}>
          <div className="lt-banner-left">
            <span className="lt-level-chip">{levelMeta.emoji} Level {levelMeta.num}</span>
          </div>
        </div>
      )}
      <div className="lt-content">{content}</div>

      <ConfirmActionModal
        confirmAction={confirmAction}
        onConfirm={() => executeUnlock()}
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
    </div>
  );
}