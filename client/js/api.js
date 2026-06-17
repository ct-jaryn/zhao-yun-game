const API_BASE = '/api';

async function request(url, options = {}) {
  // 后端已禁用，直接返回空结果
  return { ok: false, status: 0, data: null };
}

export async function fetchLeaderboard(limit = 10) {
  return { ok: false, data: [] };
}

export async function submitScore(record) {
  return { ok: false };
}

export async function fetchSave() {
  return { ok: false };
}

export async function saveGame(data) {
  return { ok: false };
}
