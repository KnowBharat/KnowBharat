import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../Hooks/useApi';
import '../Css/ParentDashboard.css';
import { CustomAlertModal, StoreModal } from './SharedModals'; // 🌟 Added StoreModal
import { GAME_META } from './DashboardTabs/DashboardConstants';
import { OverviewTab, PerformanceTab, ActivityTab, ProfileTab, SupportTab, MapProgressTab } from './DashboardTabs/DashboardViews';
import { useEconomy } from '../Hooks/EconomyContext'; // 🌟 Added Economy
import { API_BASE_URL } from '../Hooks/config';
import useGameModal from '../Hooks/useGameModal';
import useStateData from '../Hooks/useStateData';

const BASE = `${API_BASE_URL}/api/auth`;
export default function ParentDashboard() {
  const userId = localStorage.getItem("userId");
  const [activeTab, setActiveTab] = useState('overview');
  const [lbTimeRange, setLbTimeRange] = useState('daily'); // 🌟 Removed 'all', default to 'daily'
  const [activityFilter, setActivityFilter] = useState('All');
  const [showLogoutPrompt, setShowLogoutPrompt] = useState(false);
  const navigate = useNavigate();

  const { 
    showStore, setShowStore, confirmAction, setConfirmAction, customAlert, setCustomAlert, 
    claimDaily, watchAdCoins, watchAdKeys, 
    buyCoinPack1, buyCoinPack2, buyCoinPack3,
    buyKeyPack1, buyKeyPack2, buyKeyPack3,
    buyCombo1, buyCombo2
  } = useGameModal();
  
  const { stateIdMap } = useStateData();
  const {
    coins, setCoins, keys, setKeys,
    unlockedLevels, setGameUnlock, gameScores, updateScoreData
  } = useEconomy();
  const [editForm, setEditForm] = useState({ childName: '', schoolName: '', studentClass: '', phone: '' });
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
    if (!userId) {
      navigate('/login');
      return;
    }

    // 🌟 FIX: Reset stats to show loading state while waiting for BOTH calls
    setStats(prev => ({ ...prev, totalScore: 0, recentActivity: [], scoreHistory: [] }));

    Promise.all([
      apiFetch(`/dashboard/stats/${userId}?timeRange=${lbTimeRange}`),
      apiFetch(`/game-data/score/overall/${userId}?filter=${lbTimeRange}`)
    ])
      .then(([statsData, scoresData]) => {
        // 1. Process Stats Data
        if (statsData && !statsData.error) {
          const calcScores = {};
          const calcPlays = {};

          (statsData.recentActivities || []).forEach(act => {
            calcPlays[act.game] = (calcPlays[act.game] || 0) + 1;
            calcScores[act.game] = (calcScores[act.game] || 0) + (act.score || 0);
          });

          setStats(prev => ({
            ...prev,
            ...statsData, // Merges parentName, email, childName, leaderboard
            statesLearned: statsData.mapExploredCount || 0,
            exploredMapNodes: statsData.exploredMapNodes || [],
            recentActivity: statsData.recentActivities || [],
            moduleScores: calcScores,
            modulePlays: calcPlays,
            // 2. Process Score Data from the second API call
            totalScore: scoresData?.totalScore || 0,
            scoreHistory: scoresData?.scores || []
          }));

          setEditForm({
            childName: statsData.childName || '',
            schoolName: statsData.schoolName || '',
            dob: statsData.dob || '',
            phone: statsData.phone || ''
          });
        }
      })
      .catch(err => {
        console.error("Dashboard fetch crash:", err);
        // Only navigate to login if it's an auth-related error (optional)
      });
  }, [navigate, lbTimeRange, userId]);

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
  const mapLevelDetails = useMemo(() => {
    const mapNodes = stats.exploredMapNodes || [];
    const details = {};
    for (let i = 1; i <= 11; i++) { details[i] = []; }

    mapNodes.forEach(node => {
      const match = node.match(/(.+) lvl (\d+)/);
      if (match) {
        const stateCode = match[1];
        const lvl = parseInt(match[2], 10);

        // 🌟 ADDED !details[lvl].includes(stateCode) to prevent duplicates!
        if (details[lvl] && !details[lvl].includes(stateCode)) {
          details[lvl].push(stateCode);
        }
      }
    });
    return details;
  }, [stats.exploredMapNodes]);

  return (
    <div className="pd-root">
      <aside className="pd-sidebar">
        <div className="pd-brand">
          <div className="pd-brand-logo">
            <img src="/KnowBharat.webp" alt="KnowBharat Logo" className="logo" width="50" height="50" />
          </div>
          <div className="pd-brand-name">KnowBharat</div>
          <div className="pd-brand-sub">Parent Portal</div>
        </div>

        <nav className="pd-nav">
          {[
            { id: 'overview', icon: '📊', label: 'Overview' },
            { id: 'performance', icon: '📈', label: 'Performance' },
            { id: 'map-progress', icon: '🗺️', label: 'Map Progress' }, // 🌟 ADDED MAP ICON HERE
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
            <div className="pd-economy-bar" onClick={() => setShowStore(true)} style={{ display: 'flex', gap: '15px', marginRight: '20px', cursor: 'pointer', background: '#f5f5f5', padding: '8px 15px', borderRadius: '20px', border: '1px solid #ddd', alignItems: 'center' }}>
              <div style={{ fontWeight: 'bold', color: '#FF9933' }}>🪙 {coins}</div>
              <div style={{ fontWeight: 'bold', color: '#06d6a0' }}>🗝️ {keys}</div>
              <div style={{ fontSize: '0.8rem', color: '#666', background: '#e0e0e0', padding: '2px 8px', borderRadius: '10px' }}>➕ Store</div>
            </div>

            <div><div className="pd-parent-name">Welcome, {stats.childName || 'Student'}</div></div>
<div className="pd-avatar">{stats.childName?.[0] || 'S'}</div>
</div>
        </div>

        <div className="pd-content">
          {activeTab === 'overview' && (
            <OverviewTab
              stats={stats} heatmapData={heatmapData} globalLeaderboard={globalLeaderboard}
              lbTimeRange={lbTimeRange} setLbTimeRange={setLbTimeRange}
              setActiveTab={setActiveTab} viewDetailsInLog={(key) => { setActivityFilter(key); setActiveTab('activity'); }}
              mapLevelDetails={mapLevelDetails} onOwnProfileClick={() => setActiveTab('performance')}
            />
          )}

          {activeTab === 'performance' && (
            <PerformanceTab
              stats={stats}
              lbTimeRange={lbTimeRange}
              setLbTimeRange={setLbTimeRange}
            />
          )}
          {/* 🌟 PASSED TIME RANGE PROPS TO ACTIVITY */}
          {activeTab === 'activity' && <ActivityTab stats={stats} activityFilter={activityFilter} setActivityFilter={setActivityFilter} displayActivityLog={displayActivityLog} lbTimeRange={lbTimeRange} setLbTimeRange={setLbTimeRange} />}

          {/* 🌟 PASS stateIdMap TO THE TAB */}
          {activeTab === 'map-progress' && <MapProgressTab mapLevelDetails={mapLevelDetails} stateIdMap={stateIdMap} />}

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