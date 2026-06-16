const API_BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, ...data };
}

export async function fetchLeaderboard(limit = 10) {
  return request(`${API_BASE}/leaderboard?limit=${limit}`);
}

export async function submitScore(record) {
  return request(`${API_BASE}/leaderboard`, {
    method: 'POST',
    body: JSON.stringify(record)
  });
}

export async function fetchSave() {
  return request(`${API_BASE}/saves`);
}

export async function saveGame(data) {
  return request(`${API_BASE}/saves`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}
