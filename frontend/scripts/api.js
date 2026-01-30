// Basic API helper that sends cookies (session) with requests
const BASE = '/api';

async function apiFetch(path, options = {}){
  const url = BASE + path;
  const opts = Object.assign({
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  }, options);

  if (opts.body && typeof opts.body === 'object') opts.body = JSON.stringify(opts.body);

  const res = await fetch(url, opts);
  let json;
  try {
    json = await res.json();
  } catch (e) {
    // If response is not JSON, capture text for clearer error messages
    const text = await res.text().catch(() => '');
    const message = text || 'Invalid JSON response from server';
    throw { message };
  }

  if (!res.ok) throw json;
  return json;
}

window.apiFetch = apiFetch;
