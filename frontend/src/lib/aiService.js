import axios from 'axios';

const BACKEND_URL = "https://wedora-ai.onrender.com";
export const API = `${BACKEND_URL}/api`;

export const sendChatNonStream = async (message, sessionId) => {
  const { data } = await axios.post(`${API}/chat`, { message, session_id: sessionId });
  return data; // { session_id, reply }
};

// Streaming via fetch + ReadableStream (SSE)
export const sendChatStream = async ({ message, sessionId, onDelta, onDone, onError }) => {
  try {
    const res = await fetch(`${API}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, session_id: sessionId }),
    });
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let newSession = sessionId;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      // split by SSE frames
      let idx;
      while ((idx = buf.indexOf('\n\n')) !== -1) {
        const frame = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        // parse frame lines
        const lines = frame.split('\n');
        let ev = 'message';
        let dataParts = [];
        for (const line of lines) {
          if (line.startsWith('event:')) ev = line.slice(6).trim();
          else if (line.startsWith('data:')) dataParts.push(line.slice(5).replace(/^ /, ''));
        }
        const dataStr = dataParts.join('\n').replace(/\\n/g, '\n');
        if (ev === 'done') { newSession = dataStr || newSession; }
        else if (ev === 'error') { onError && onError(dataStr); }
        else if (dataStr) { onDelta && onDelta(dataStr); }
      }
    }
    onDone && onDone(newSession);
  } catch (e) {
    onError && onError(e.message || 'stream failed');
  }
};

export const estimateBudget = async (payload) => {
  const total = Number(payload.total_budget) || 0;
  const guestCount = Math.max(Number(payload.guest_count) || 0, 1);
  const city = payload.city || 'Jaipur';
  const functions = Number(payload.functions) || 3;

  const split = [
    ['Venue', 0.22, 'Halls, palace grounds, resort takeover, décor-inclusive'],
    ['Food & Catering', 0.22, 'Per-plate multi-cuisine, live counters, bar service'],
    ['Décor & Florals', 0.15, 'Mandap, stage, entrance, table florals, drapes'],
    ['Photography & Video', 0.10, 'Candid, cinematic film, pre-wedding shoot'],
    ['Bridal & Groom Wear', 0.08, 'Lehenga, sherwani, jewellery, accessories'],
    ['Makeup & Styling', 0.04, 'HD makeup, hair, family styling touch-ups'],
    ['Entertainment', 0.05, 'DJ, sangeet choreo, live band, dhol'],
    ['Invitations & Gifting', 0.03, 'Digital + boxed invites, welcome hampers'],
    ['Transportation & Stay', 0.06, 'Guest transfers, family stay, honeymoon start'],
    ['Miscellaneous', 0.05, 'Buffer for last-minute magic ✿'],
  ];

  const categories = split.map(([name, pct, note]) => ({
    name,
    percent: Number((pct * 100).toFixed(1)),
    amount: Math.round(total * pct),
    note,
  }));

  const perHead = Math.round((total * 0.22) / guestCount);

  return {
    total,
    guest_count: guestCount,
    city,
    functions,
    per_head: perHead,
    categories,
  };
};
export const generateDesign = async (dream_description) => {
  const { data } = await axios.post(`${API}/designer/generate`, { dream_description });
  return data;
};

export const listVenues = async (params = {}) => {
  const { data } = await axios.get(`${API}/venues`, { params });
  return data;
};

export const listVendors = async (params = {}) => {
  const { data } = await axios.get(`${API}/vendors`, { params });
  return data;
};

export const apiChatHistory = async (sessionId) => {
  const { data } = await axios.get(`${API}/chat/history/${sessionId}`);
  return data;
};
