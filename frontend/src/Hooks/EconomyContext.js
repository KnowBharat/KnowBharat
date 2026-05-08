import React, { createContext, useContext, useState, useEffect } from 'react';

const EconomyContext = createContext();

export function EconomyProvider({ children }) {
  const userId = localStorage.getItem("userId");
  const [loading, setLoading] = useState(true);
  
  // React still needs initial state before the fetch completes, 
  // but these won't be pushed to the DB.
  const [coins, setCoins] = useState(0); 
  const [keys, setKeys] = useState(0);
  const [showStore, setShowStore] = useState(false);
  const [unlockedLevels, setUnlockedLevels] = useState({ map: 0, quiz: 0, spell: 0, matching: 0, puzzle: 0 });
  const [gameScores, setGameScores] = useState({});

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // 🌟 1. FETCH PROGRESS ON LOAD (Purely reading data now)
    fetch(`http://localhost:8081/api/progress/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.userId) {
          // Trust the backend data completely
          setCoins(data.coins);
          setKeys(data.keysCount);
          setUnlockedLevels({
            map: data.mapUnlocked,
            quiz: data.quizUnlocked,
            spell: data.spellUnlocked,
            matching: data.matchingUnlocked,
            puzzle: data.puzzleUnlocked
          });
        }
      })
      .catch(err => console.error("Error loading progress:", err))
      .finally(() => setLoading(false));

  }, [userId]);

  const updateScoreData = (key, val) => {
    setGameScores(prev => ({ ...prev, [key]: val }));
  };

  const setGameUnlock = (game, level) => {
    setUnlockedLevels(prev => ({ ...prev, [game]: level }));
    fetch(`http://localhost:8081/api/progress/unlock/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: game, level: level })
    });
  };

  return (
    <EconomyContext.Provider value={{
      coins, setCoins, keys, setKeys, showStore, setShowStore,
      unlockedLevels, setGameUnlock, gameScores, updateScoreData
    }}>
      {!loading && children}
    </EconomyContext.Provider>
  );
}

export const useEconomy = () => useContext(EconomyContext);