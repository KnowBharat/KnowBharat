import { useState } from 'react';
import { useEconomy } from './EconomyContext';
import { API_BASE_URL } from './config';
const BASE = `${API_BASE_URL}/api/auth`;

export default function useGameModal() {
  const { coins, setCoins, keys, setKeys, showStore, setShowStore } = useEconomy();
  const [confirmAction, setConfirmAction] = useState(null);
  const [customAlert, setCustomAlert] = useState(null);
  const userId = localStorage.getItem("userId");

  const updateCurrencyDB = async (c, k) => {
    try {
      await fetch(`${BASE}/progress/currency/${userId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ coins: c, keysCount: k })
      });
    } catch (err) { console.error("Failed to save currency", err); }
  };

  // ─── FREE REWARDS (Will connect to AdMob/SuperAwesome later) ───
  const claimDaily = async () => { 
    const c = coins + 10; setCoins(c); setShowStore(false); 
    setCustomAlert({ type: 'success', icon: '🎁', title: 'Daily Reward Claimed!', text: '+10 Coins added.' }); 
    await updateCurrencyDB(c, keys); 
  };
  const watchAdCoins = async () => { 
    const c = coins + 10; setCoins(c); setShowStore(false); 
    setCustomAlert({ type: 'success', icon: '📺', title: 'Ad Complete!', text: '+10 Coins.' }); 
    await updateCurrencyDB(c, keys); 
  };
  const watchAdKeys = async () => { 
    const k = keys + 1; setKeys(k); setShowStore(false); 
    setCustomAlert({ type: 'success', icon: '📺', title: 'Ad Complete!', text: '+1 Key.' }); 
    await updateCurrencyDB(coins, k); 
  };

  // ─── COIN PACKS ───
  const buyCoinPack1 = async () => { processPurchase(40, 0, '🪙', 'Starter Coins', '₹10'); };
  const buyCoinPack2 = async () => { processPurchase(450, 0, '💰', 'Pro Coins', '₹100'); };
  const buyCoinPack3 = async () => { processPurchase(2500, 0, '👑', 'Elite Coins', '₹500'); };

  // ─── KEY PACKS ───
  const buyKeyPack1 = async () => { processPurchase(0, 2, '🗝️', 'Starter Keys', '₹10'); };
  const buyKeyPack2 = async () => { processPurchase(0, 25, '🗝️', 'Pro Keys', '₹100'); };
  const buyKeyPack3 = async () => { processPurchase(0, 130, '🗝️', 'Elite Keys', '₹500'); };

  // ─── MEGA COMBOS ───
  const buyCombo1 = async () => { processPurchase(600, 20, '🎁', 'Super Combo', '₹150'); };
  const buyCombo2 = async () => { processPurchase(2000, 80, '💎', 'Mega Combo', '₹499'); };

  // Helper function to keep code clean
  const processPurchase = async (addCoins, addKeys, icon, title, price) => {
    const c = coins + addCoins;
    const k = keys + addKeys;
    setCoins(c); setKeys(k); setShowStore(false);
    setCustomAlert({ type: 'success', icon: icon, title: `${title} Purchased!`, text: `Payment of ${price} successful.\nAdded +${addCoins}🪙 and +${addKeys}🗝️.` });
    await updateCurrencyDB(c, k);
  };

  return { 
    showStore, setShowStore, confirmAction, setConfirmAction, customAlert, setCustomAlert, 
    claimDaily, watchAdCoins, watchAdKeys, 
    buyCoinPack1, buyCoinPack2, buyCoinPack3,
    buyKeyPack1, buyKeyPack2, buyKeyPack3,
    buyCombo1, buyCombo2
  };
}