const API_BASE = '/api';

function getBrowserId() {
  let id = localStorage.getItem('zhaoyun_browser_id');
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('zhaoyun_browser_id', id);
  }
  return id;
}

async function request(url, options = {}) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-Browser-Id': getBrowserId(),
      ...options.headers
    };
    const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.warn('API 请求失败:', err.message);
    return { ok: false, status: 0, data: null };
  }
}


