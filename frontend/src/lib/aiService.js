import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
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
  const { data } = await axios.post(`${API}/budget/estimate`, payload);
  return data;
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
