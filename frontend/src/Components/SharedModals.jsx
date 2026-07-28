import React, { useState, useEffect } from 'react';

/**
 * 1. BaseModal: The shared shell for ALL popups.
 * Handles the overlay, the pop-in animation, and the white container.
 */
const BaseModal = ({ children, isOpen, zIndex = 3000, maxWidth = '400px', overlayColor = 'rgba(0,0,0,0.65)', border = 'none' }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', inset: 0, background: overlayColor, 
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex
    }}>
      <div className="game-modal" style={{
        background: 'white', padding: '30px', borderRadius: '24px', 
        textAlign: 'center', width: '90%', maxWidth, border,
        boxShadow: '0 15px 40px rgba(0,0,0,0.3)', 
        animation: 'swalPopIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}>
        {children}
      </div>
    </div>
  );
};

/**
 * 2. CustomAlertModal: Reusable for Success, Error, and Warning alerts.
 */
export function CustomAlertModal({ alert, onClose }) {
  return (
    <BaseModal isOpen={!!alert} zIndex={9999} maxWidth="350px">
      <div style={{ fontSize: '5rem', marginBottom: '10px', lineHeight: '1' }}>{alert?.icon}</div>
      <h2 style={{ fontFamily: "'Baloo 2', cursive", color: '#1a2340', margin: '0 0 10px 0', fontSize: '1.8rem' }}>
        {alert?.title}
      </h2>
      <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '25px', whiteSpace: 'pre-line', lineHeight: '1.5' }}>
        {alert?.text}
      </p>
      <button 
        onClick={onClose} 
        className="modal-primary-btn"
        style={{
          width: '100%', padding: '14px', borderRadius: '14px', border: 'none', 
          background: alert?.type === 'error' ? '#f44336' : alert?.type === 'warning' ? '#FF9933' : '#4caf50', 
          color: 'white', fontWeight: 'bold', fontSize: '1.2rem', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
        }}
      >
        OK
      </button>
    </BaseModal>
  );
}

/**
 * 3. StoreModal: Token Shop (Dynamic Pricing Edition)
 */
export function StoreModal({ 
  show, onClose, isParent = true, 
  onDailyReward, onWatchAdCoins, onWatchAdKeys, 
  onBuyCoin1, onBuyCoin2, onBuyCoin3,
  onBuyKey1, onBuyKey2, onBuyKey3,
  onBuyCombo1, onBuyCombo2 
}) {
  const [canClaimDaily, setCanClaimDaily] = useState(false);

  React.useEffect(() => {
    if (show) {
      const lastClaimDate = localStorage.getItem('lastDailyReward');
      setCanClaimDaily(lastClaimDate !== new Date().toDateString());
    }
  }, [show]);

  const handleDailyClick = () => {
    if (canClaimDaily) {
      localStorage.setItem('lastDailyReward', new Date().toDateString());
      setCanClaimDaily(false); 
      if (onDailyReward) onDailyReward();
    }
  };

  // Reusable style for the small pricing cards
  const cardStyle = (borderColor, bgColor) => ({
    padding: '10px', border: `2px solid ${borderColor}`, borderRadius: '12px',
    background: bgColor, cursor: 'pointer', textAlign: 'center', display: 'flex', 
    flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '110px'
  });

  return (
    <BaseModal isOpen={show} overlayColor="rgba(0,0,0,0.7)" border="5px solid #FFD700" maxWidth="500px">
      <h2 style={{ fontFamily: "'Baloo 2', cursive", color: '#1a2340', marginTop: 0 }}>🏪 Token Store</h2>
      
      <div style={{ maxHeight: '65vh', overflowY: 'auto', paddingRight: '5px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* 🌟 FREE REWARDS */}
        <div>
          <div style={{ textAlign: 'left', fontWeight: 'bold', color: '#888', borderBottom: '2px solid #eee', paddingBottom: '5px', marginBottom: '10px' }}>Free Rewards</div>
          <button onClick={handleDailyClick} disabled={!canClaimDaily} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: canClaimDaily ? '2px solid #ffc107' : '2px solid #e0e0e0', background: canClaimDaily ? '#fff8e1' : '#f5f5f5', cursor: canClaimDaily ? 'pointer' : 'not-allowed', marginBottom: '10px' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333' }}>🎁 {canClaimDaily ? 'Daily Login Reward' : 'Claimed for Today'}</div>
          </button>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button onClick={onWatchAdCoins} style={cardStyle('#ccc', '#f9f9f9')}>
              <div style={{ fontSize: '1.2rem' }}>📺</div><div style={{ fontWeight: 'bold' }}>+10 🪙</div><div style={{ fontSize: '0.8rem', color: '#888' }}>Watch Ad</div>
            </button>
            <button onClick={onWatchAdKeys} style={cardStyle('#ccc', '#f9f9f9')}>
              <div style={{ fontSize: '1.2rem' }}>📺</div><div style={{ fontWeight: 'bold' }}>+1 🗝️</div><div style={{ fontSize: '0.8rem', color: '#888' }}>Watch Ad</div>
            </button>
          </div>
        </div>

        {/* 🌟 PAID ITEMS (Parents Only) */}
        {isParent && (
          <>
            {/* Coins */}
            <div>
              <div style={{ textAlign: 'left', fontWeight: 'bold', color: '#888', borderBottom: '2px solid #eee', paddingBottom: '5px', marginBottom: '10px' }}>Buy Coins</div>
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                <button onClick={onBuyCoin1} style={cardStyle('#faebcc', '#fcf8e3')}><div style={{ fontSize: '1.5rem' }}>🪙</div><div style={{ fontWeight: '900', color: '#8a6d3b' }}>40</div><div style={{ fontSize: '0.9rem', color: '#555', marginTop: '5px' }}>₹10</div></button>
                <button onClick={onBuyCoin2} style={cardStyle('#faebcc', '#fcf8e3')}><div style={{ fontSize: '1.5rem' }}>💰</div><div style={{ fontWeight: '900', color: '#8a6d3b' }}>450</div><div style={{ fontSize: '0.9rem', color: '#555', marginTop: '5px' }}>₹100</div></button>
                <button onClick={onBuyCoin3} style={cardStyle('#faebcc', '#fcf8e3')}><div style={{ fontSize: '1.5rem' }}>👑</div><div style={{ fontWeight: '900', color: '#8a6d3b' }}>2,500</div><div style={{ fontSize: '0.9rem', color: '#555', marginTop: '5px' }}>₹500</div></button>
              </div>
            </div>

            {/* Keys */}
            <div>
              <div style={{ textAlign: 'left', fontWeight: 'bold', color: '#888', borderBottom: '2px solid #eee', paddingBottom: '5px', marginBottom: '10px' }}>Buy Keys</div>
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                <button onClick={onBuyKey1} style={cardStyle('#b2ebf2', '#e0f7fa')}><div style={{ fontSize: '1.5rem' }}>🗝️</div><div style={{ fontWeight: '900', color: '#006064' }}>2</div><div style={{ fontSize: '0.9rem', color: '#555', marginTop: '5px' }}>₹10</div></button>
                <button onClick={onBuyKey2} style={cardStyle('#b2ebf2', '#e0f7fa')}><div style={{ fontSize: '1.5rem' }}>🗝️</div><div style={{ fontWeight: '900', color: '#006064' }}>25</div><div style={{ fontSize: '0.9rem', color: '#555', marginTop: '5px' }}>₹100</div></button>
                <button onClick={onBuyKey3} style={cardStyle('#b2ebf2', '#e0f7fa')}><div style={{ fontSize: '1.5rem' }}>🗝️</div><div style={{ fontWeight: '900', color: '#006064' }}>130</div><div style={{ fontSize: '0.9rem', color: '#555', marginTop: '5px' }}>₹500</div></button>
              </div>
            </div>

            {/* Combos */}
            <div>
              <div style={{ textAlign: 'left', fontWeight: 'bold', color: '#888', borderBottom: '2px solid #eee', paddingBottom: '5px', marginBottom: '10px' }}>Value Combos</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                <button onClick={onBuyCombo1} style={{ padding: '15px', borderRadius: '12px', border: '2px solid #ff9800', background: 'linear-gradient(135deg, #fff3e0, #ffe0b2)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ textAlign: 'left' }}><div style={{ fontWeight: 'bold', color: '#e65100', fontSize: '1.1rem' }}>Super Combo</div><div style={{ fontSize: '0.9rem', color: '#666' }}>600 🪙 + 20 🗝️</div></div>
                  <div style={{ fontWeight: '900', fontSize: '1.2rem', color: '#d84315' }}>₹150</div>
                </button>
                <button onClick={onBuyCombo2} style={{ padding: '15px', borderRadius: '12px', border: '2px solid #004E89', background: 'linear-gradient(135deg, #e6f0fa, #b3d4f5)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ textAlign: 'left' }}><div style={{ fontWeight: 'bold', color: '#004E89', fontSize: '1.1rem' }}>Mega Combo</div><div style={{ fontSize: '0.9rem', color: '#666' }}>2,000 🪙 + 80 🗝️</div></div>
                  <div style={{ fontWeight: '900', fontSize: '1.2rem', color: '#003a66' }}>₹499</div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <button onClick={onClose} style={{ marginTop: '20px', width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: '#f44336', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem' }}>
        Close Store
      </button>
    </BaseModal>
  );
}

/**
 * 4. UnlockModal: Early access confirmation.
 */
export function UnlockModal({ modalData, onConfirm, onCancel }) {
  return (
    <BaseModal isOpen={!!modalData}>
      <h2 style={{ fontFamily: "'Baloo 2', cursive", color: '#1a2340' }}>{modalData?.title}</h2>
      <p style={{ color: '#555' }}>Don't want to wait? Skip completing Level {modalData?.num - 1} and unlock early!</p>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0277bd', margin: '20px 0' }}>
          Cost: 🗝️ {modalData?.unlockCost} Keys
      </div>
      <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
        <button onClick={onConfirm} style={{ ...actionBtnStyle, background: '#4caf50' }}>Unlock Early</button>
        <button onClick={onCancel} style={{ ...actionBtnStyle, background: '#f44336' }}>Cancel</button>
      </div>
    </BaseModal>
  );
}

/**
 * 🌟 5. ConfirmActionModal: NEW! The unified SweetAlert-style modal for asking to spend currency.
 */
export function ConfirmActionModal({ confirmAction, onConfirm, onCancel }) {
  if (!confirmAction) return null;

  return (
    <BaseModal isOpen={true} zIndex={9999} maxWidth="350px">
      <div style={{ fontSize: '4rem', marginBottom: '10px', lineHeight: '1' }}>{confirmAction.icon}</div>
      <h2 style={{ fontFamily: "'Baloo 2', cursive", color: '#1a2340', margin: '0 0 10px 0', fontSize: '1.6rem' }}>
        {confirmAction.title}
      </h2>
      <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '25px', whiteSpace: 'pre-line', lineHeight: '1.5' }}>
        {confirmAction.message}
      </p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          onClick={onConfirm} 
          style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: confirmAction.color || '#4caf50', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem' }}
        >
          Confirm
        </button>
        <button 
          onClick={onCancel} 
          style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#f44336', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem' }}
        >
          Cancel
        </button>
      </div>
    </BaseModal>
  );
}

// Internal styles to keep code clean
const storeBtnStyle = {
  padding: '15px', border: '2px solid #e0e0e0', borderRadius: '16px', 
  background: '#f9f9f9', cursor: 'pointer', textAlign: 'left'
};

const actionBtnStyle = {
  flex: 1, padding: '12px', border: 'none', borderRadius: '12px', 
  color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem'
};