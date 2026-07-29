import { API_BASE_URL } from './config';
const BASE = `${API_BASE_URL}/api/auth`; 

function authHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: { ...authHeaders(), ...(options.headers || {}) },
    });
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return null;
    return await res.json();
  } catch (err) {
    console.error("API Fetch Error:", err);
    return null; 
  }
}

// Call when any game round ends with a score
export async function trackScore(game, score, stateName = null) {
  const userId = localStorage.getItem("userId");
  if (!userId) return null;

  // 1. Save to GameScore table (Updates Leaderboard, Performance, and Total Score)
  apiFetch(`/game-data/score/${userId}`, {
    method: 'POST',
    body: JSON.stringify({ game, score, stateName }),
  }).catch(err => console.error("Failed to save score:", err));

  // 2. Save to GameActivity table (Updates the Recent Activity Log)
  return apiFetch(`/game-data/activity/${userId}`, {
    method: 'POST',
    body: JSON.stringify({ game, score, stateName }),
  });
}

export async function trackStateVisit(stateName) {
  const userId = localStorage.getItem("userId");
  if (!userId) return null;
  return apiFetch(`/game-data/activity/${userId}`, {
    method: 'POST',
    body: JSON.stringify({ game: 'map', score: null, stateName }),
  });
}