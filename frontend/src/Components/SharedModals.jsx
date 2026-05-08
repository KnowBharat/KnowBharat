import React from 'react';

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
 * 3. StoreModal: The Token Shop.
 */
export function StoreModal({ show, onClose, onWatchAd, onBuyTokens, onDailyReward, onBuyMegaPack }) {
  return (
    <BaseModal isOpen={show} overlayColor="rgba(0,0,0,0.7)" border="5px solid #FFD700">
      <h2 style={{ fontFamily: "'Baloo 2', cursive", color: '#1a2340' }}>🏪 Token Store</h2>
      <p style={{ color: '#555', marginBottom: '20px' }}>Need more Coins or Keys to play?</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        <button onClick={onWatchAd} style={storeBtnStyle}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}>📺 Watch Ad</div>
          <span style={{ fontSize: '0.85rem', color: '#666' }}>Free Reward (+50 🪙 | +1 🗝️)</span>
        </button>

        <button onClick={onDailyReward} style={storeBtnStyle}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}>🎁 Claim Daily Reward</div>
          <span style={{ fontSize: '0.85rem', color: '#666' }}>Free Reward (+100 🪙 | +3 🗝️)</span>
        </button>

        <button onClick={onBuyTokens} style={storeBtnStyle}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}>💳 Buy Starter Pack</div>
          <span style={{ fontSize: '0.85rem', color: '#666' }}>$0.99 (+500 🪙 | +10 🗝️)</span>
        </button>

        <button onClick={onBuyMegaPack} style={storeBtnStyle}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}>💎 Buy Mega Pack</div>
          <span style={{ fontSize: '0.85rem', color: '#666' }}>$3.99 (+2000 🪙 | +50 🗝️)</span>
        </button>

      </div>
      <button onClick={onClose} style={{ marginTop: '20px', width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: '#f44336', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
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