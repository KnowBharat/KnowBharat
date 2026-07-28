import React, { useState } from 'react';
import { GAME_META } from './DashboardConstants';

// 🌟 Expanded map to translate both shortcodes AND full lowercase strings!
const EXTENDED_STATE_MAP = { 
  "AP": "Andhra Pradesh", "AR": "Arunachal Pradesh", "AS": "Assam", "BR": "Bihar", "CG": "Chhattisgarh", "GA": "Goa", "GJ": "Gujarat", "HR": "Haryana", "HP": "Himachal Pradesh", "JH": "Jharkhand", "KA": "Karnataka", "KL": "Kerala", "MP": "Madhya Pradesh", "MH": "Maharashtra", "MN": "Manipur", "ML": "Meghalaya", "MZ": "Mizoram", "NL": "Nagaland", "OD": "Odisha", "PB": "Punjab", "RJ": "Rajasthan", "SK": "Sikkim", "TN": "Tamil Nadu", "TG": "Telangana", "TR": "Tripura", "UP": "Uttar Pradesh", "UK": "Uttarakhand", "WB": "West Bengal", "AN": "Andaman & Nicobar", "CH": "Chandigarh", "DN": "Dadra & Nagar Haveli", "DD": "Daman & Diu", "DL": "Delhi", "JK": "Jammu & Kashmir", "LA": "Ladakh", "LD": "Lakshadweep", "PY": "Puducherry",
  "himachalpradesh": "Himachal Pradesh", "rajasthan": "Rajasthan", "uttarpradesh": "Uttar Pradesh", "andhrapradesh": "Andhra Pradesh", "maharashtra": "Maharashtra", "gujarat": "Gujarat", "chhattisgarh": "Chhattisgarh", "odisha": "Odisha", "karnataka": "Karnataka", "tamilnadu": "Tamil Nadu", "jammuandkashmir": "Jammu & Kashmir"
};

const formatStateName = (code) => {
  if (EXTENDED_STATE_MAP[code]) return EXTENDED_STATE_MAP[code];
  if (!isNaN(code)) return `State Region #${code}`; // For numerical IDs like "31"
  return code.charAt(0).toUpperCase() + code.slice(1);
};

// ─── 1. OVERVIEW TAB ─────────────────────────────────────────────────────────
export const OverviewTab = ({ stats, heatmapData, globalLeaderboard, lbTimeRange, setLbTimeRange, setActiveTab, viewDetailsInLog, mapLevelDetails, onOwnProfileClick }) => {
  const userId = localStorage.getItem("userId");
  
  // 🌟 Capitalizes the current time range for the labels!
  const timeLabel = lbTimeRange.charAt(0).toUpperCase() + lbTimeRange.slice(1);

  return (
    <>
      <div className="stats-grid">
        {/* Clickable Total Score Card */}
        <div 
           className="stat-card" 
           style={{ borderColor: '#FF9933', cursor: 'pointer', transition: 'transform 0.2s' }}
           onClick={() => setActiveTab('performance')}
           onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
           onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div className="stat-icon">🎯</div>
          {/* SHOWS 'No Score' IF EMPTY, OTHERWISE SHOWS SCORE */}
          <div className="stat-value">{stats.totalScore > 0 ? stats.totalScore.toLocaleString() : 'No Score'}</div>
          <div className="stat-label">{timeLabel} Total Score</div>
          <div style={{ fontSize: '0.75rem', color: '#FF9933', marginTop: '4px' }}>(Click for Module Performance)</div>
        </div>
        
        {/* Clickable Map Stat Card */}
        <div 
          className="stat-card" 
          style={{ borderColor: '#138808', cursor: 'pointer', position: 'relative' }}
          onClick={() => setActiveTab('map-progress')}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div className="stat-icon">🗺️</div>
          <div className="stat-value">{stats.statesLearned || 0}</div>
          <div className="stat-label">Total States Explored</div>
          <div style={{ fontSize: '0.75rem', color: '#138808', marginTop: '4px' }}>(Click for Level details)</div>
        </div>

        {/* Clickable Activity Card */}
        <div 
           className="stat-card" 
           style={{ borderColor: '#00b4d8', cursor: 'pointer', transition: 'transform 0.2s' }}
           onClick={() => setActiveTab('activity')}
           onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
           onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div className="stat-icon">📝</div>
          <div className="stat-value">{stats.recentActivity?.length || 0}</div>
          <div className="stat-label">{timeLabel} Activities</div>
          <div style={{ fontSize: '0.75rem', color: '#00b4d8', marginTop: '4px' }}>(Click for Full Log)</div>
        </div>
      </div>

      <div className="pd-grid">
        {/* Most Accessed Grid */}
        <div className="pd-card">
          <div className="pd-card-header"><div className="pd-card-title">🔥 Most Accessed Modules</div></div>
          <div className="pd-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '15px', paddingBottom: '10px' }}>
              {heatmapData.map((data) => {
                const dotCount = Math.min(data.count, 10);
                const dots = Array.from({ length: dotCount });

                return (
                  <div 
                    key={data.game} 
                    onClick={() => viewDetailsInLog(data.game)} 
                    style={{ background: '#fcfcfc', border: `2px solid ${data.color}40`, padding: '15px', borderRadius: '16px', cursor: 'pointer', textAlign: 'center', transition: 'transform 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ color: data.color, fontWeight: 'bold', fontSize: '1.05rem', marginBottom: '8px' }}>
                      {data.label}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '10px' }}>
                      Plays: {data.count}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center' }}>
                      {dots.map((_, idx) => (
                        <span key={idx} style={{ width: '8px', height: '8px', borderRadius: '50%', background: data.color }} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Global Leaderboard */}
        <div className="pd-card">
          <div className="pd-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div className="pd-card-title">🏆 Global Leaderboard</div>
            <div style={{ display: 'flex', gap: '5px', background: '#f0f0f0', padding: '4px', borderRadius: '8px' }}>
              {['daily', 'weekly', 'monthly'].map(range => (
                <button
                  key={range}
                  onClick={() => setLbTimeRange(range)}
                  style={{
                    border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer',
                    background: lbTimeRange === range ? '#fff' : 'transparent', color: lbTimeRange === range ? '#1a2340' : '#888',
                    boxShadow: lbTimeRange === range ? '0 2px 4px rgba(0,0,0,0.1)' : 'none', textTransform: 'capitalize'
                  }}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="pd-card-body" style={{ minHeight: 280 }}>
            {globalLeaderboard.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center', marginTop: '40px' }}>Calculating Global Ranks...</p>
            ) : globalLeaderboard.slice(0, 5).map(user => {
              const isOwnProfile = user.userId === parseInt(userId);
              return (
                <div
                  key={user.rank}
                  onClick={isOwnProfile ? onOwnProfileClick : undefined}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px',
                    borderBottom: '1px solid #eee', cursor: isOwnProfile ? 'pointer' : 'default',
                    background: isOwnProfile ? '#e8f5e9' : 'transparent', 
                    borderRadius: isOwnProfile ? '8px' : '0',
                    border: isOwnProfile ? '1px solid #4caf50' : 'none',
                    marginBottom: isOwnProfile ? '4px' : '0'
                  }}
                >
                  <div style={{ fontWeight: isOwnProfile ? 'bold' : '600', color: isOwnProfile ? '#2e7d32' : '#333' }}>
                    <span style={{ width: '35px', display: 'inline-block', color: '#888', fontSize: '1.1rem' }}>
                      {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : user.rank === 3 ? '🥉' : `#${user.rank}`}
                    </span>
                    {user.childName || user.name || 'Player'} {isOwnProfile && <span style={{ color: '#f57f17', marginLeft: '5px' }}>(You)</span>}
                  </div>
                  <div style={{ fontWeight: '900', color: '#004E89', fontSize: '1.1rem' }}>{user.score.toLocaleString()} pts</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

// ─── 2. PERFORMANCE TAB ──────────────────────────────────────────────────────
export const PerformanceTab = ({ stats, lbTimeRange, setLbTimeRange }) => { 
  // 🌟 FIX: Reset this back to 'all' so it shows all games by default
  const [gameFilter, setGameFilter] = useState('all'); 
  
  // 🌟 FIX: Removed the extra "=" 
  const timeLabel = lbTimeRange.charAt(0).toUpperCase() + lbTimeRange.slice(1);
  const scoreHistory = stats.scoreHistory || [];

  const filteredScores = scoreHistory.filter(entry => {
    if (gameFilter === 'all') return true;
    return entry.game && entry.game.toLowerCase().trim() === gameFilter.toLowerCase();
  });

  return (
    <div className="pd-grid">
      <div className="pd-card" style={{ gridColumn: '1 / -1' }}>
        
        <div className="pd-card-header" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div className="pd-card-title">📜 {timeLabel} Score History</div>
            
            <div style={{ display: 'flex', gap: '5px', background: '#f0f0f0', padding: '4px', borderRadius: '8px' }}>
              {['daily', 'weekly', 'monthly'].map(range => (
                <button
                  key={range}
                  onClick={() => setLbTimeRange(range)}
                  style={{
                    border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer',
                    background: lbTimeRange === range ? '#fff' : 'transparent', color: lbTimeRange === range ? '#1a2340' : '#888',
                    boxShadow: lbTimeRange === range ? '0 2px 4px rgba(0,0,0,0.1)' : 'none', textTransform: 'capitalize'
                  }}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid #eee', paddingTop: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 'bold', display: 'flex', alignItems: 'center', marginRight: '5px' }}>Filter Game:</span>
            {['all', 'quiz', 'spell', 'matching', 'puzzle', 'map', 'symbols'].map(game => (
              <button
                key={game}
                onClick={() => setGameFilter(game)}
                style={{
                  border: '1px solid',
                  borderColor: gameFilter === game ? '#004E89' : '#ddd',
                  background: gameFilter === game ? '#e6f0fa' : '#fff',
                  color: gameFilter === game ? '#004E89' : '#555',
                  padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', textTransform: 'capitalize'
                }}
              >
                {game === 'all' ? 'All Games' : game}
              </button>
            ))}
          </div>
        </div>
        
        <div className="pd-card-body" style={{ minHeight: 400 }}>
          {filteredScores.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', marginTop: '40px' }}>No scores found for this filter.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Game</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Score</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredScores.map((entry, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #f9f9f9' }}>
                    <td style={{ padding: '10px' }}>{entry.game ? entry.game.toUpperCase() : 'N/A'}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#004E89' }}>{entry.score}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontSize: '0.8rem', color: '#666' }}>
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── 3. ACTIVITY LOG TAB ─────────────────────────────────────────────────────
export const ActivityTab = ({ stats, activityFilter, setActivityFilter, displayActivityLog, lbTimeRange, setLbTimeRange }) => { 
  const [sortOrder, setSortOrder] = useState('date-desc'); 
  const timeLabel = lbTimeRange = lbTimeRange.charAt(0).toUpperCase() + lbTimeRange.slice(1);
  const filterOptions = ['All', 'symbols', 'map', 'puzzle', 'matching', 'quiz', 'spell'];

  const sortedLog = [...displayActivityLog].sort((a, b) => {
    if (sortOrder === 'date-desc') return new Date(b.timestamp) - new Date(a.timestamp);
    if (sortOrder === 'date-asc') return new Date(a.timestamp) - new Date(b.timestamp);
    
    const nameA = GAME_META[a.game]?.label || a.game;
    const nameB = GAME_META[b.game]?.label || b.game;
    if (sortOrder === 'name-asc') return nameA.localeCompare(nameB);
    if (sortOrder === 'name-desc') return nameB.localeCompare(nameA);
    return 0;
  });

  return (
    <div className="pd-grid">
      <div className="pd-card" style={{ gridColumn: '1 / -1' }}>
        <div className="pd-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          
          <div className="pd-card-title">📝 {timeLabel} Activity Log</div>
          
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '5px', background: '#f0f0f0', padding: '4px', borderRadius: '8px' }}>
              {['daily', 'weekly', 'monthly'].map(range => (
                <button
                  key={range}
                  onClick={() => setLbTimeRange(range)}
                  style={{
                    border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer',
                    background: lbTimeRange === range ? '#fff' : 'transparent', color: lbTimeRange === range ? '#1a2340' : '#888',
                    boxShadow: lbTimeRange === range ? '0 2px 4px rgba(0,0,0,0.1)' : 'none', textTransform: 'capitalize'
                  }}
                >
                  {range}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 'bold' }}>Filter:</span>
              <select 
                value={activityFilter} 
                onChange={(e) => setActivityFilter(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none', cursor: 'pointer' }}
              >
                {filterOptions.map(opt => (
                  <option key={opt} value={opt}>{opt === 'All' ? 'All Modules' : opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 'bold' }}>Sort:</span>
              <select 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none', cursor: 'pointer' }}
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="name-asc">Module (A-Z)</option>
                <option value="name-desc">Module (Z-A)</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="pd-card-body" style={{ minHeight: 400 }}>
          {sortedLog.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>No activity found.</p>
          ) : (
            sortedLog.map((a, i) => (
              <div key={i} className="activity-item">
                <div className="activity-details">
                  <div className="activity-name">
                    {GAME_META[a.game]?.label || a.game} {a.status && a.status !== 'Played' ? ` — ${a.status}` : ''}
                  </div>
                  <div className="activity-time">
                    {new Date(a.timestamp).toLocaleDateString()} at {new Date(a.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
                <span className="activity-score" style={{ background: GAME_META[a.game]?.color || '#888' }}>
                  {a.score != null && a.score > 0 ? `+${a.score} Pts` : 'Explored'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ─── 4. PROFILE & SETTINGS TAB ───────────────────────────────────────────────
export const ProfileTab = ({ 
  stats, editForm, setEditForm, handleEditSubmit, 
  passMode, setPassMode, passForm, setPassForm, handlePasswordChange,
  resetEmail, setResetEmail, handleForgotPassRequest,
  resetOtp, setResetOtp, handleResetPassSubmit 
}) => (
  <div className="pd-grid">
    <div className="pd-card">
      <div className="pd-card-header"><div className="pd-card-title">Edit Details</div></div>
      <div className="pd-card-body">
        <form onSubmit={handleEditSubmit} className="pd-form">
          <label>Login Email
            <input type="email" value={stats.email || 'loading@knowbharat.in'} disabled className="pd-input" style={{ background: '#f5f5f5', cursor: 'not-allowed' }} />
          </label>
          <label>Student's Name <input type="text" value={editForm.childName} onChange={e => setEditForm({ ...editForm, childName: e.target.value })} className="pd-input" required /></label>
          <label>School Name <input type="text" value={editForm.schoolName} onChange={e => setEditForm({ ...editForm, schoolName: e.target.value })} className="pd-input" required /></label>
          <label>Date of Birth 
            <input 
              type="date" 
              value={editForm.dob} 
              onChange={e => setEditForm({ ...editForm, dob: e.target.value })} 
              className="pd-input" 
              required 
            />
          </label>
          <label>Phone Number <input type="tel" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="pd-input" required /></label>
          <button type="submit" className="pd-btn primary">Save Details</button>
        </form>
      </div>
    </div>

    <div className="pd-card">
      <div className="pd-card-header"><div className="pd-card-title">Change Password</div></div>
      <div className="pd-card-body">
        {passMode === 'standard' && (
          <form onSubmit={handlePasswordChange} className="pd-form">
            <label>Current Password <input type="password" value={passForm.oldPassword} onChange={e => setPassForm({ ...passForm, oldPassword: e.target.value })} className="pd-input" required /></label>
            <label>New Password <input type="password" value={passForm.newPassword} onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })} className="pd-input" required /></label>
            <label>Confirm New Password <input type="password" value={passForm.confirmPassword} onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })} className="pd-input" required /></label>
            <div style={{ textAlign: 'right', marginTop: -8 }}><button type="button" style={{ background: 'none', border: 'none', color: '#004E89', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }} onClick={() => setPassMode('forgot')}>Forgot Password?</button></div>
            <button type="submit" className="pd-btn danger">Update Password</button>
          </form>
        )}
        {passMode === 'forgot' && (
          <form onSubmit={handleForgotPassRequest} className="pd-form">
            <p style={{ color: '#555', fontSize: '0.85rem' }}>Enter your registered email to receive an OTP.</p>
            <label>Email Address <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} className="pd-input" required /></label>
            <button type="submit" className="pd-btn primary">Send OTP</button>
            <button type="button" style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontWeight: 'bold', marginTop: 5 }} onClick={() => setPassMode('standard')}>← Cancel</button>
          </form>
        )}
        {passMode === 'reset' && (
          <form onSubmit={handleResetPassSubmit} className="pd-form">
            <label>Enter OTP <input type="text" value={resetOtp} onChange={e => setResetOtp(e.target.value)} className="pd-input" required /></label>
            <label>New Password <input type="password" value={passForm.newPassword} onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })} className="pd-input" required /></label>
            <label>Confirm New Password <input type="password" value={passForm.confirmPassword} onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })} className="pd-input" required /></label>
            <button type="submit" className="pd-btn danger">Set New Password</button>
            <button type="button" style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontWeight: 'bold', marginTop: 5 }} onClick={() => setPassMode('standard')}>← Cancel</button>
          </form>
        )}
      </div>
    </div>
  </div>
);

// ─── 5. HELP & SUPPORT TAB ───────────────────────────────────────────────────
export const SupportTab = ({ feedbackText, setFeedbackText, handleFeedbackSubmit }) => (
  <div className="pd-grid">
    <div className="pd-card">
      <div className="pd-card-header"><div className="pd-card-title">About KnowBharat</div></div>
      <div className="pd-card-body">
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img src="/KnowBharat.png" alt="KnowBharat Logo" className="logo" width="50" height="50" />
          <h3 style={{ fontFamily: "'Baloo 2', cursive", color: '#004E89', marginTop: 8 }}>KnowBharat v1.0</h3>
        </div>
        <p style={{ color: '#444', lineHeight: 1.6 }}>
          KnowBharat is an interactive, gamified learning platform designed to help children
          explore the rich culture, geography, and heritage of India. Through puzzles, quizzes,
          and interactive maps, we make learning fun and rewarding!
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />
        <h4 style={{ color: '#333', marginBottom: 6 }}>Contact Us</h4>
        <p style={{ color: '#444' }}>Email: knowbharat04@gmail.com</p>
        {/* <p style={{ color: '#444', marginTop: 4 }}>Phone: +91 98765 43210</p> */}
      </div>
    </div>

    <div className="pd-card">
      <div className="pd-card-header"><div className="pd-card-title">Send Feedback</div></div>
      <div className="pd-card-body">
        <p style={{ color: '#444', marginBottom: 15 }}>Have a suggestion or found a bug? Let us know!</p>
        <form onSubmit={handleFeedbackSubmit} className="pd-form">
          <label>Your Message
            <textarea rows="5" className="pd-input" value={feedbackText} onChange={e => setFeedbackText(e.target.value)} placeholder="Tell us what you think..." required style={{ resize: 'vertical' }} />
          </label>
          <button type="submit" className="pd-btn primary">Send Feedback</button>
        </form>
      </div>
    </div>
  </div>
);

// ─── 6. MAP PROGRESS TAB ─────────────────────────────────────────────────────
// 🌟 ADD stateIdMap as a prop here
export const MapProgressTab = ({ mapLevelDetails, stateIdMap }) => {
  return (
    <div className="pd-grid">
      <div className="pd-card" style={{ gridColumn: '1 / -1' }}>
        <div className="pd-card-header">
          <div className="pd-card-title">🗺️ Map Exploration Details</div>
        </div>
        
        <div className="pd-card-body" style={{ minHeight: 400 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {Object.keys(mapLevelDetails).map(lvl => {
              const exploredList = mapLevelDetails[lvl];
              return (
                <div key={lvl} style={{ background: '#f9f9f9', padding: '20px', borderRadius: '12px', border: '2px solid #13880822' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px dashed #ccc', paddingBottom: '10px', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, color: '#1a2340', fontSize: '1.3rem' }}>Level {lvl}</h3>
                    <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold' }}>
                      {exploredList.length} / 36 States
                    </span>
                  </div>
                  
                  {exploredList.length === 0 ? (
                    <p style={{ color: '#888', fontStyle: 'italic', fontSize: '0.9rem', margin: 0 }}>No states explored in this level yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {exploredList.map(code => (
                        <span key={code} style={{ background: 'white', border: '1px solid #ddd', padding: '6px 12px', borderRadius: '8px', fontSize: '0.9rem', color: '#333', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                          {/* 🌟 CHECK THE DICTIONARY FOR THE NAME! */}
                          ✅ {stateIdMap && stateIdMap[code] ? stateIdMap[code] : formatStateName(code)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};