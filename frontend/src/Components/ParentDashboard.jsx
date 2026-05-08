import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../Hooks/useApi';
import '../Css/ParentDashboard.css';
import { CustomAlertModal, StoreModal } from './SharedModals'; // 🌟 Added StoreModal
import { GAME_META } from './DashboardTabs/DashboardConstants';
import { OverviewTab, PerformanceTab, ActivityTab, ProfileTab, SupportTab } from './DashboardTabs/DashboardViews'; 
import { useEconomy } from '../Hooks/EconomyContext'; // 🌟 Added Economy

export default function ParentDashboard() {
  const userId = localStorage.getItem("userId");
  const [activeTab, setActiveTab] = useState('overview');
  const [lbTimeRange, setLbTimeRange] = useState('daily'); // 🌟 Removed 'all', default to 'daily'
  const [activityFilter, setActivityFilter] = useState('All');
  const [showLogoutPrompt, setShowLogoutPrompt] = useState(false);
  const [customAlert, setCustomAlert] = useState(null);
  const navigate = useNavigate();

  // 🌟 Economy Context for Topbar & Store
  const { coins, setCoins, keys, setKeys, showStore, setShowStore, gameScores } = useEconomy();

  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', childName: '' });
  const [passMode, setPassMode] = useState('standard');
  const [passForm, setPassForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [feedbackText, setFeedbackText] = useState('');

  const [stats, setStats] = useState({
    totalScore: 0,
    statesLearned: 0,
    recentActivity: [],
    parentName: '',
    childName: '',
    email: '',
    leaderboard: [],
    moduleScores: {}, 
    modulePlays: {}   
  });

  useEffect(() => {
    apiFetch(`/dashboard/stats?timeRange=${lbTimeRange}`).then(data => {
      if (data) {
        const calcScores = {};
        const calcPlays = {};
        
        (data.recentActivities || []).forEach(act => {
           calcPlays[act.game] = (calcPlays[act.game] || 0) + 1;
           calcScores[act.game] = (calcScores[act.game] || 0) + (act.score || 0);
        });

        setStats({
          ...data,
          statesLearned: data.mapExploredCount || 0,
          recentActivity: data.recentActivities || [], 
          moduleScores: calcScores,
          modulePlays: calcPlays
        });

        setEditForm({
          firstName: data.parentName?.split(' ')[0] || '',
          lastName: data.parentName?.split(' ')[1] || '',
          childName: data.childName || '',
        });
      }
    }).catch(() => navigate('/login'));
  }, [navigate, lbTimeRange]);

  // ─── Handlers ─────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try { await apiFetch('/logout', { method: 'POST' }); } catch (e) { console.error(e); }
    finally { localStorage.clear(); navigate('/login'); }
  };

  const handleCloseAlert = () => {
    const action = customAlert?.onCloseAction;
    setCustomAlert(null);
    if (action) action();
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    await apiFetch('/user/edit', { method: 'PUT', body: JSON.stringify(editForm) });
    setCustomAlert({
      type: 'success', icon: '✅', title: 'Profile Updated', text: 'Your details have been saved successfully!',
      onCloseAction: () => window.location.reload(),
    });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) return setCustomAlert({ type: 'error', icon: '❌', title: 'Error', text: 'New passwords do not match!' });
    const res = await apiFetch('/user/change-password', { method: 'PUT', body: JSON.stringify(passForm) });
    if (res && !res.error) {
      setCustomAlert({ type: 'success', icon: '🔒', title: 'Success', text: 'Password Changed Successfully!' });
      setPassForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      setCustomAlert({ type: 'error', icon: '❌', title: 'Update Failed', text: res?.error || 'Incorrect current password.' });
    }
  };

  const handleForgotPassRequest = async (e) => {
    e.preventDefault();
    if (resetEmail.toLowerCase().trim() !== stats.email.toLowerCase().trim()) {
      return setCustomAlert({ type: 'error', icon: '🛡️', title: 'Security Alert', text: 'Please enter your login email.' });
    }
    const res = await apiFetch('/forgot-password-otp', { method: 'POST', body: JSON.stringify({ email: resetEmail }) });
    if (res && !res.error) setPassMode('reset');
    else setCustomAlert({ type: 'error', icon: '❌', title: 'Not Found', text: res?.error || 'Email not registered.' });
  };

  const handleResetPassSubmit = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) return setCustomAlert({ type: 'error', icon: '❌', title: 'Error', text: 'New passwords do not match!' });
    const res = await apiFetch('/reset-password', { method: 'POST', body: JSON.stringify({ email: resetEmail, otp: resetOtp, newPassword: passForm.newPassword }) });
    if (res && !res.error) {
      setCustomAlert({ type: 'success', icon: '✅', title: 'Success', text: 'Password Reset Successfully!' });
      setPassMode('standard'); setPassForm({ oldPassword: '', newPassword: '', confirmPassword: '' }); setResetOtp(''); setResetEmail('');
    } else setCustomAlert({ type: 'error', icon: '❌', title: 'Error', text: res?.error || 'Invalid OTP.' });
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    setCustomAlert({ type: 'success', icon: '💌', title: 'Thank You!', text: 'Your feedback has been sent.' });
    setFeedbackText('');
  };

  // 🌟 STORE HANDLERS
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

  // ── Derived Analytics ───────────────────────────────────────────────
  const modulePerformance = useMemo(() => {
    if (!stats.moduleScores) return [];
    return Object.keys(stats.moduleScores).map(gameKey => {
      const userScore = stats.moduleScores[gameKey];
      const globalScore = stats.globalModuleAverages?.[gameKey] || 0;
      const maxScale = Math.max(1000, userScore, globalScore) * 1.1;

      return {
        game: gameKey,
        label: GAME_META[gameKey]?.label || gameKey,
        color: GAME_META[gameKey]?.color || '#888',
        avgScore: userScore,
        globalAvg: globalScore,
        widthPct: Math.min((userScore / maxScale) * 100, 100),
        globalWidthPct: Math.min((globalScore / maxScale) * 100, 100),
      };
    }).sort((a, b) => b.avgScore - a.avgScore);
  }, [stats.moduleScores, stats.globalModuleAverages]);

  const heatmapData = useMemo(() => {
    if (!stats.modulePlays) return [];
    return Object.keys(GAME_META).map(key => ({
      game: key,
      label: GAME_META[key].label,
      color: GAME_META[key].color,
      count: stats.modulePlays[key] || 0
    })).sort((a, b) => b.count - a.count);
  }, [stats.modulePlays]);

  const globalLeaderboard = useMemo(() => {
    if (!stats.leaderboard) return [];
    const sorted = [...stats.leaderboard].sort((a, b) => b.score - a.score);
    return sorted.map((user, index) => ({ ...user, rank: index + 1 }));
  }, [stats.leaderboard]);

  const displayActivityLog = useMemo(() => {
    if (!stats.recentActivity) return [];
    if (activityFilter === 'All') return stats.recentActivity;
    return stats.recentActivity.filter(a => a.game === activityFilter);
  }, [stats.recentActivity, activityFilter]);

  // 🌟 DERIVE MAP LEVEL-WISE COUNT
  const mapLevelCounts = useMemo(() => {
    const mapNodes = gameScores['map_explored_nodes'] || [];
    const counts = {};
    mapNodes.forEach(node => {
      const match = node.match(/lvl (\d+)/);
      if (match) {
        const lvl = parseInt(match[1], 10);
        counts[lvl] = (counts[lvl] || 0) + 1;
      }
    });
    return counts;
  }, [gameScores]);

  return (
    <div className="pd-root">
      <aside className="pd-sidebar">
        <div className="pd-brand">
          <div className="pd-brand-logo">
            <img src="/KnowBharat.png" alt="KnowBharat Logo" className="logo" width="50" height="50" />
          </div>
          <div className="pd-brand-name">KnowBharat</div>
          <div className="pd-brand-sub">Parent Portal</div>
        </div>

        <nav className="pd-nav">
          {[
            { id: 'overview', icon: '📊', label: 'Overview' },
            { id: 'performance', icon: '📈', label: 'Performance' },
            { id: 'activity', icon: '📝', label: 'Activity Log' },
            { id: 'profile', icon: '⚙️', label: 'Edit Profile' },
            { id: 'support', icon: '🎧', label: 'Help & Support' },
          ].map(n => (
            <button key={n.id} className={`pd-nav-item ${activeTab === n.id ? 'active' : ''}`} onClick={() => setActiveTab(n.id)}>
              <span className="nav-icon">{n.icon}</span>
              <span className="nav-text">{n.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-actions">
          <button className="pd-logout" style={{ background: '#4caf50', color: 'white' }} onClick={() => {
            sessionStorage.setItem('from_dashboard', 'true');
            navigate('/home');
          }}>
            <span className="nav-icon">🎮</span><span className="nav-text">Kids Space</span>
          </button>
          <button className="pd-logout" onClick={() => setShowLogoutPrompt(true)}>
            <span className="nav-icon">🚪</span><span className="nav-text">Logout</span>
          </button>
        </div>
      </aside>

      <main className="pd-main">
        <div className="pd-topbar">
          <div className="pd-topbar-title">Parent Dashboard</div>
          <div className="pd-topbar-right">
            
            {/* 🌟 ECONOMY TOPBAR */}
            <div className="pd-economy-bar" onClick={() => setShowStore(true)} style={{display: 'flex', gap: '15px', marginRight: '20px', cursor: 'pointer', background: '#f5f5f5', padding: '8px 15px', borderRadius: '20px', border: '1px solid #ddd', alignItems: 'center'}}>
              <div style={{fontWeight: 'bold', color: '#FF9933'}}>🪙 {coins}</div>
              <div style={{fontWeight: 'bold', color: '#06d6a0'}}>🗝️ {keys}</div>
              <div style={{fontSize: '0.8rem', color: '#666', background: '#e0e0e0', padding: '2px 8px', borderRadius: '10px'}}>➕ Store</div>
            </div>

            <div><div className="pd-parent-name">Welcome, {stats.parentName || 'Parent'}</div></div>
            <div className="pd-avatar">{stats.parentName?.[0] || 'P'}</div>
          </div>
        </div>

        <div className="pd-content">
          {activeTab === 'overview' && (
             <OverviewTab 
                stats={stats} 
                heatmapData={heatmapData} 
                globalLeaderboard={globalLeaderboard} 
                lbTimeRange={lbTimeRange} 
                setLbTimeRange={setLbTimeRange} 
                setActiveTab={setActiveTab} 
                viewDetailsInLog={(key) => { setActivityFilter(key); setActiveTab('activity'); }} 
                mapLevelCounts={mapLevelCounts} // 🌟 Passed Map Data
                onOwnProfileClick={() => setActiveTab('performance')} // 🌟 Passed Click Handler
             />
          )}
          
          {activeTab === 'performance' && <PerformanceTab modulePerformance={modulePerformance} />}
          
          {activeTab === 'activity' && <ActivityTab stats={stats} activityFilter={activityFilter} setActivityFilter={setActivityFilter} displayActivityLog={displayActivityLog} />}
          
          {activeTab === 'profile' && (
             <ProfileTab 
               stats={stats} editForm={editForm} setEditForm={setEditForm} handleEditSubmit={handleEditSubmit}
               passMode={passMode} setPassMode={setPassMode} passForm={passForm} setPassForm={setPassForm} handlePasswordChange={handlePasswordChange}
               resetEmail={resetEmail} setResetEmail={setResetEmail} handleForgotPassRequest={handleForgotPassRequest}
               resetOtp={resetOtp} setResetOtp={setResetOtp} handleResetPassSubmit={handleResetPassSubmit}
             />
          )}

          {activeTab === 'support' && (
             <SupportTab feedbackText={feedbackText} setFeedbackText={setFeedbackText} handleFeedbackSubmit={handleFeedbackSubmit} />
          )}
        </div>
      </main>

      <StoreModal show={showStore} onClose={() => setShowStore(false)} onWatchAd={watchAd} onBuyTokens={buyTokens} onDailyReward={claimDaily} onBuyMegaPack={buyMegaPack} />
      <CustomAlertModal alert={customAlert} onClose={handleCloseAlert} />

      {showLogoutPrompt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', padding: 30, borderRadius: 24, textAlign: 'center', width: '90%', maxWidth: 350 }}>
            <div style={{ fontSize: '4rem', margin: '0 0 10px' }}>👋</div>
            <h2 style={{ fontFamily: "'Baloo 2', cursive", color: '#1a2340', marginBottom: 10 }}>Leaving so soon?</h2>
            <p style={{ color: '#555', marginBottom: 25 }}>Are you sure you want to logout of the Parent Dashboard?</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleLogout} style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: '#f44336', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Yes, Logout</button>
              <button onClick={() => setShowLogoutPrompt(false)} style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: '#e0e0e0', color: '#333', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}