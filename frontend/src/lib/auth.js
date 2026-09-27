
import axios from 'axios';

const BACKEND_URL = 'https://wedora-ai.onrender.com';
const API = `${BACKEND_URL}/api`;
const TOKEN_KEY = 'wedora_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const setToken = (token) => token
  ? localStorage.setItem(TOKEN_KEY, token)
  : localStorage.removeItem(TOKEN_KEY);

export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const authAxios = axios.create({ baseURL: API });

authAxios.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Authentication
export const apiLogin = async (email, password) => {
  const { data } = await authAxios.post('/auth/login', { email, password });
  setToken(data.token);
  return data;
};

export const apiMe = async () => (
  await authAxios.get('/auth/me')
).data;

// Vendor account
export const apiVendorRegister = async (payload) => {
  const { data } = await authAxios.post('/vendor/register', payload);
  setToken(data.token);
  return data;
};

export const apiVendorMe = async () => (
  await authAxios.get('/vendor/me')
).data;

export const apiVendorUpdate = async (payload) => (
  await authAxios.put('/vendor/me', payload)
).data;

// Vendor logo and portfolio uploads
export const apiUploadLogo = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  return (
    await authAxios.post('/vendor/upload/logo', formData)
  ).data;
};

export const apiUploadPortfolio = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  return (
    await authAxios.post('/vendor/upload/portfolio', formData)
  ).data;
};

export const apiDeletePortfolio = async (url) => (
  await authAxios.delete('/vendor/portfolio', {
    params: { url },
  })
).data;

export const apiDeleteLogo = async () => (
  await authAxios.delete('/vendor/logo')
).data;

// Portfolio Case Studies
export const apiGetPortfolioCaseStudies = async () => (
  await authAxios.get('/vendor/portfolio/case-studies')
).data;

export const apiCreatePortfolioCaseStudy = async (payload) => (
  await authAxios.post('/vendor/portfolio/case-studies', payload)
).data;

export const apiUpdatePortfolioCaseStudy = async (id, payload) => (
  await authAxios.put(
    `/vendor/portfolio/case-studies/${encodeURIComponent(id)}`,
    payload
  )
).data;

export const apiDeletePortfolioCaseStudy = async (id) => (
  await authAxios.delete(
    `/vendor/portfolio/case-studies/${encodeURIComponent(id)}`
  )
).data;

// Vendor plan and AI profile
export const apiSwitchPlan = async (plan) => (
  await authAxios.post('/vendor/plan', { plan })
).data;

export const apiAIGenerateProfile = async (payload) => (
  await authAxios.post('/vendor/profile/ai-generate', payload)
).data;

// Vendor leads and statistics
export const apiVendorLeads = async () => (
  await authAxios.get('/vendor/leads')
).data;

export const apiUpdateLead = async (id, status) => (
  await authAxios.patch(`/vendor/leads/${id}`, { status })
).data;

export const apiVendorStats = async () => (
  await authAxios.get('/vendor/stats')
).data;

// Public marketplace
// Render may take time to wake from sleep, so these requests have a timeout.
export const apiMarketplace = async (params = {}) => (
  await axios.get(`${API}/marketplace/vendors`, {
    params,
    timeout: 30000,
  })
).data;

export const apiVendorProfile = async (slug) => (
  await axios.get(`${API}/marketplace/vendors/${slug}`, {
    timeout: 30000,
  })
).data;

export const apiTrack = async (slug, event) => (
  await axios.post(
    `${API}/marketplace/track/${slug}`,
    null,
    {
      params: { event },
      timeout: 30000,
    }
  )
).data;

export const apiCreateLead = async (payload) => (
  await axios.post(`${API}/leads`, payload, {
    timeout: 30000,
  })
).data;

// Admin
export const apiAdminVendors = async () => (
  await authAxios.get('/admin/vendors')
).data;

export const apiAdminUpdateVendor = async (id, payload) => (
  await authAxios.patch(`/admin/vendors/${id}`, payload)
).data;

export const apiAdminLeads = async () => (
  await authAxios.get('/admin/leads')
).data;

// Shared chat
export const apiCreateShare = async (session_id) => (
  await axios.post(`${API}/chat/share`, { session_id })
).data;

export const apiGetShare = async (share_id) => (
  await axios.get(`${API}/chat/share/${share_id}`)
).data;

// API error formatting
export const fmtApiError = (
  detail,
  fallback = 'Something went wrong. Please try again.'
) => {
  if (!detail) return fallback;

  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((error) => error?.msg || JSON.stringify(error))
      .join(' ');
  }

  if (detail?.msg) return detail.msg;

  return String(detail);
};
