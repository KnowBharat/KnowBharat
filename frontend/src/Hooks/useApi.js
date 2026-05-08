// Hooks/useApi.js
const BASE = 'http://localhost:8081/api/auth';

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
  } catch {
    return null; // never crash gameplay
  }
}

// ── Convenience wrappers ──────────────────────────────────────────────────────

// Call when any game round ends with a score
export async function trackScore(game, score, stateName = null) {
  return apiFetch('/dashboard/activity', {
    method: 'POST',
    body: JSON.stringify({ game, score, stateName }),
  });
}

// Call when a state is clicked / loaded in any component
export async function trackStateVisit(stateName) {
  return apiFetch('/dashboard/activity', {
    method: 'POST',
    body: JSON.stringify({ game: 'map', score: null, stateName }),
  });
}