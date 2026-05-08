import React from 'react';
import { GAME_META } from './DashboardConstants';

// ─── 1. OVERVIEW TAB ─────────────────────────────────────────────────────────
export const OverviewTab = ({ stats, heatmapData, globalLeaderboard, lbTimeRange, setLbTimeRange, setActiveTab, viewDetailsInLog, mapLevelCounts, onOwnProfileClick }) => {
  const userId = localStorage.getItem("userId");

  return (
    <>
      <div className="stats-grid">
        <div className="stat-card" style={{ borderColor: '#FF9933' }}>
          <div className="stat-icon">🎯</div>
          <div className="stat-value">{stats.totalScore?.toLocaleString() || 0}</div>
          <div className="stat-label">Overall Total Score</div>
        </div>
        <div className="stat-card" style={{ borderColor: '#138808' }}>
          <div className="stat-icon">🗺️</div>
          <div className="stat-value">{stats.statesLearned || 0}</div>
          <div className="stat-label">Total States Explored</div>
        </div>
        <div className="stat-card" style={{ borderColor: '#00b4d8' }}>
          <div className="stat-icon">📝</div>
          <div className="stat-value">{stats.recentActivity?.length || 0}</div>
          <div className="stat-label">Total Activities</div>
        </div>
      </div>

      <div className="pd-grid">
        
        {/* 🔥 Most Accessed Grid & Map Levels */}
        <div className="pd-card">
          <div className="pd-card-header"><div className="pd-card-title">🔥 Most Accessed Modules</div></div>
          <div className="pd-card-body">
            
            {/* Interactive Dots Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '15px', paddingBottom: '10px' }}>
              {heatmapData.map((data) => {
                // Limit dots visually to 10 so it doesn't overflow the card
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

            {/* Map States Explored by Level */}
            <h4 style={{ marginTop: '25px', borderTop: '1px solid #eee', paddingTop: '20px', color: '#1a2340', fontSize: '1.1rem' }}>
              🗺️ Map States Explored by Level
            </h4>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '15px' }}>
              {Object.keys(mapLevelCounts || {}).length > 0 ? (
                Object.keys(mapLevelCounts).map(lvl => (
                  <div key={lvl} style={{ background: '#e0f7ff', color: '#005f80', padding: '8px 15px', borderRadius: '12px', fontWeight: 'bold', border: '1px solid #b3ecff', fontSize: '0.95rem' }}>
                    Level {lvl}: <span style={{ color: '#00b4d8' }}>{mapLevelCounts[lvl]} States</span>
                  </div>
                ))
              ) : (
                <div style={{ color: '#888', fontSize: '0.9rem' }}>No map levels explored yet.</div>
              )}
            </div>

          </div>
        </div>

        {/* 🏆 Global Leaderboard */}
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
export const PerformanceTab = ({ modulePerformance }) => (
  <div className="pd-grid">
    <div className="pd-card" style={{ gridColumn: '1 / -1' }}>
      <div className="pd-card-header"><div className="pd-card-title">📈 Module Performance</div></div>
      <div className="pd-card-body" style={{ minHeight: 400 }}>
        {modulePerformance.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', marginTop: '40px' }}>No scores recorded yet.</p>
        ) : (
          <div className="chart-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            {modulePerformance.map((mod, i) => (
              <div key={i} className="chart-row" style={{ marginBottom: '20px' }}>
                <div className="chart-label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontWeight: 'bold', color: '#333' }}>
                  {mod.label} <span>{mod.avgScore} pts</span>
                </div>
                <div className="chart-bar-bg" style={{ position: 'relative', height: '24px', background: '#f0f0f0', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${mod.globalWidthPct}%`, background: '#d1d5db', zIndex: 1, borderRight: '3px dashed #9ca3af' }} />
                  <div style={{ position: 'absolute', top: '4px', bottom: '4px', left: 0, width: `${mod.widthPct}%`, background: mod.color, zIndex: 2, borderRadius: '0 10px 10px 0', opacity: 0.9 }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

// ─── 3. ACTIVITY LOG TAB ─────────────────────────────────────────────────────
export const ActivityTab = ({ stats, activityFilter, setActivityFilter, displayActivityLog }) => (
  <div className="pd-grid">
    <div className="pd-card" style={{ gridColumn: '1 / -1' }}>
      <div className="pd-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="pd-card-title">📝 Full Activity Log</div>
        {activityFilter !== 'All' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: '#666' }}>Filtered by:</span>
            <span style={{ background: GAME_META[activityFilter]?.color || '#333', color: 'white', padding: '4px 12px', borderRadius: '15px', fontSize: '0.85rem', fontWeight: 'bold' }}>
              {GAME_META[activityFilter]?.label || activityFilter}
            </span>
            <button onClick={() => setActivityFilter('All')} style={{ background: 'none', border: 'none', color: '#e53935', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>✕ Clear Filter</button>
          </div>
        )}
      </div>
      <div className="pd-card-body" style={{ minHeight: 400 }}>
        {displayActivityLog.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>No activity found.</p>
        ) : (
          displayActivityLog.map((a, i) => (
            <div key={i} className="activity-item">
              <div className="activity-details">
                <div className="activity-name">
                  {GAME_META[a.game]?.label || a.game} {a.status && a.status !== 'Played' ? ` — ${a.status}` : ''}
                </div>
                <div className="activity-time">{new Date(a.timestamp).toLocaleString()}</div>
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
            <input type="email" value={stats.email || 'loading@knowbharat.in'} disabled className="pd-input" style={{ background: '#f5f5f5', cursor: 'not-allowed', color: '#888', borderColor: '#e0e0e0' }} />
          </label>
          <label>First Name <input type="text" value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} className="pd-input" /></label>
          <label>Last Name <input type="text" value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} className="pd-input" /></label>
          <label>Child's Name <input type="text" value={editForm.childName} onChange={e => setEditForm({ ...editForm, childName: e.target.value })} className="pd-input" /></label>
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
        <p style={{ color: '#444' }}>Email: support@knowbharat.in</p>
        <p style={{ color: '#444', marginTop: 4 }}>Phone: +91 98765 43210</p>
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