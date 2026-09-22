import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TOKEN_KEY = 'wedora_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const authAxios = axios.create({ baseURL: API });
authAxios.interceptors.request.use((cfg) => {
  const t = getToken();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export const apiLogin = async (email, password) => {
  const { data } = await authAxios.post('/auth/login', { email, password });
  setToken(data.token);
  return data;
};

export const apiMe = async () => {
  const { data } = await authAxios.get('/auth/me');
  return data;
};

export const apiVendorRegister = async (payload) => {
  const { data } = await authAxios.post('/vendor/register', payload);
  setToken(data.token);
  return data;
};

export const apiVendorMe = async () => (await authAxios.get('/vendor/me')).data;
export const apiVendorUpdate = async (payload) => (await authAxios.put('/vendor/me', payload)).data;
export const apiUploadLogo = async (file) => {
  const fd = new FormData(); fd.append('file', file);
  return (await authAxios.post('/vendor/upload/logo', fd)).data;
};
export const apiUploadPortfolio = async (file) => {
  const fd = new FormData(); fd.append('file', file);
  return (await authAxios.post('/vendor/upload/portfolio', fd)).data;
};
export const apiDeletePortfolio = async (url) => (await authAxios.delete('/vendor/portfolio', { params: { url } })).data;
export const apiDeleteLogo = async () => (await authAxios.delete('/vendor/logo')).data;
export const apiSwitchPlan = async (plan) => (await authAxios.post('/vendor/plan', { plan })).data;
export const apiAIGenerateProfile = async (payload) => (await authAxios.post('/vendor/profile/ai-generate', payload)).data;
export const apiVendorLeads = async () => (await authAxios.get('/vendor/leads')).data;
export const apiUpdateLead = async (id, status) => (await authAxios.patch(`/vendor/leads/${id}`, { status })).data;
export const apiVendorStats = async () => (await authAxios.get('/vendor/stats')).data;

export const apiMarketplace = async (params = {}) => (await axios.get(`${API}/marketplace/vendors`, { params })).data;
export const apiVendorProfile = async (slug) => (await axios.get(`${API}/marketplace/vendors/${slug}`)).data;
export const apiTrack = async (slug, event) => (await axios.post(`${API}/marketplace/track/${slug}`, null, { params: { event } })).data;
export const apiCreateLead = async (payload) => (await axios.post(`${API}/leads`, payload)).data;

export const apiAdminVendors = async () => (await authAxios.get('/admin/vendors')).data;
export const apiAdminUpdateVendor = async (id, payload) => (await authAxios.patch(`/admin/vendors/${id}`, payload)).data;
export const apiAdminLeads = async () => (await authAxios.get('/admin/leads')).data;

export const apiCreateShare = async (session_id) => (await axios.post(`${API}/chat/share`, { session_id })).data;
export const apiGetShare = async (share_id) => (await axios.get(`${API}/chat/share/${share_id}`)).data;

export const fmtApiError = (detail, fallback = 'Something went wrong. Please try again.') => {
  if (!detail) return fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((e) => e?.msg || JSON.stringify(e)).join(' ');
  if (detail?.msg) return detail.msg;
  return String(detail);
};
