import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiLogin, apiVendorRegister, fmtApiError } from '@/lib/auth';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  'Wedding Decor', 'Wedding Planner', 'Photographer', 'Videographer', 'Caterer',
  'Florist', 'Makeup Artist', 'Mehendi Artist', 'DJ', 'Music/Band', 'Choreographer',
  'Venue', 'Hotel', 'Resort', 'Farmhouse', 'Invitation Designer', 'Furniture/Rental',
  'Bridal Wear', 'Groom Wear', 'Jewellery', 'Transportation', 'Other',
];

const inputCls = "mt-1 w-full rounded-2xl px-4 py-2.5 bg-white/70 border border-white/80 outline-none focus:border-pink-300 text-[#2D2638] text-sm";
const labelCls = "text-xs uppercase tracking-widest text-[#988FA6]";

const Field = ({ label, children }) => (
  <label className="block">
    <span className={labelCls}>{label}</span>
    {children}
  </label>
);

const VendorAuth = () => {
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get('mode') === 'register' ? 'register' : 'login');
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [busy, setBusy] = useState(false);

  const [login, setLogin] = useState({ email: '', password: '' });
  const [form, setForm] = useState({
    business_name: '', contact_person: '', phone: '', whatsapp: '', email: '', password: '',
    category: 'Wedding Decor', city: '', address: '', years_experience: '', starting_price: '',
    instagram: '', website: '', description: '',
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => { setMode(params.get('mode') === 'register' ? 'register' : 'login'); }, [params]);

  const onLogin = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await apiLogin(login.email, login.password);
      await refresh();
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate(data.user.role === 'admin' ? '/admin/dashboard' : data.user.role === 'vendor' ? '/vendor/dashboard' : '/');
    } catch (err) {
      toast.error(fmtApiError(err.response?.data?.detail, 'Login failed'));
    }
    setBusy(false);
  };

  const onRegister = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { ...form, years_experience: Number(form.years_experience) || 0, starting_price: Number(form.starting_price) || 0 };
      await apiVendorRegister(payload);
      await refresh();
      toast.success('Your business is listed on WEDORA!');
      navigate('/vendor/dashboard');
    } catch (err) {
      toast.error(fmtApiError(err.response?.data?.detail, 'Registration failed'));
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen silky-bg pt-32 pb-20 px-4 relative overflow-hidden">
      <div className="blob blob-a" style={{ top: '-40px', left: '-80px', width: '380px', height: '380px', background: 'radial-gradient(circle at 40% 40%, #C9B8FF, #F7B7D8 60%, transparent 75%)' }} />
      <div className="relative z-10 max-w-xl mx-auto">
        <div className="text-center mb-8">
          <Sparkles className="w-8 h-8 mx-auto text-[#C9B8FF] mb-3" />
          <h1 className="font-display text-4xl text-[#2D2638]">
            {mode === 'login' ? <>Welcome <span className="iridescent-text italic">Back.</span></> : <>List Your <span className="iridescent-text italic">Business.</span></>}
          </h1>
        </div>

        <div className="liquid-glass rounded-full p-1 flex max-w-xs mx-auto mb-8">
          <button data-testid="auth-tab-login" onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-full text-sm transition ${mode === 'login' ? 'bg-gradient-to-r from-[#C9B8FF]/70 to-[#F7B7D8]/70 font-medium' : 'text-[#6B617A]'}`}>Sign In</button>
          <button data-testid="auth-tab-register" onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-full text-sm transition ${mode === 'register' ? 'bg-gradient-to-r from-[#C9B8FF]/70 to-[#F7B7D8]/70 font-medium' : 'text-[#6B617A]'}`}>Register</button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={onLogin} className="pearl-card p-7 space-y-4" data-testid="vendor-login-form">
            <Field label="Email"><input data-testid="login-email" type="email" required className={inputCls} value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} /></Field>
            <Field label="Password"><input data-testid="login-password" type="password" required className={inputCls} value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} /></Field>
            <button data-testid="login-submit" disabled={busy} className="glow-btn w-full disabled:opacity-60">{busy ? 'Signing in…' : 'Sign In'}</button>
          </form>
        ) : (
          <form onSubmit={onRegister} className="pearl-card p-7 grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="vendor-register-form">
            <Field label="Business Name"><input data-testid="reg-business-name" required className={inputCls} value={form.business_name} onChange={set('business_name')} /></Field>
            <Field label="Contact Person"><input data-testid="reg-contact-person" required className={inputCls} value={form.contact_person} onChange={set('contact_person')} /></Field>
            <Field label="Phone"><input data-testid="reg-phone" required className={inputCls} value={form.phone} onChange={set('phone')} /></Field>
            <Field label="WhatsApp"><input data-testid="reg-whatsapp" className={inputCls} value={form.whatsapp} onChange={set('whatsapp')} placeholder="Defaults to phone" /></Field>
            <Field label="Email"><input data-testid="reg-email" type="email" required className={inputCls} value={form.email} onChange={set('email')} /></Field>
            <Field label="Password"><input data-testid="reg-password" type="password" required minLength={6} className={inputCls} value={form.password} onChange={set('password')} /></Field>
            <Field label="Business Category">
              <select data-testid="reg-category" className={inputCls} value={form.category} onChange={set('category')}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="City"><input data-testid="reg-city" required className={inputCls} value={form.city} onChange={set('city')} /></Field>
            <Field label="Address"><input data-testid="reg-address" className={inputCls} value={form.address} onChange={set('address')} /></Field>
            <Field label="Years of Experience"><input data-testid="reg-experience" type="number" min="0" className={inputCls} value={form.years_experience} onChange={set('years_experience')} /></Field>
            <Field label="Starting Price (₹)"><input data-testid="reg-starting-price" type="number" min="0" className={inputCls} value={form.starting_price} onChange={set('starting_price')} /></Field>
            <Field label="Instagram"><input data-testid="reg-instagram" className={inputCls} value={form.instagram} onChange={set('instagram')} placeholder="@yourbusiness" /></Field>
            <Field label="Website"><input data-testid="reg-website" className={inputCls} value={form.website} onChange={set('website')} placeholder="https://" /></Field>
            <label className="block sm:col-span-2">
              <span className={labelCls}>Business Description</span>
              <textarea data-testid="reg-description" rows={3} className={inputCls + ' resize-none'} value={form.description} onChange={set('description')} placeholder="Tell couples what makes you special…" />
            </label>
            <button data-testid="reg-submit" disabled={busy} className="glow-btn w-full sm:col-span-2 disabled:opacity-60">
              {busy ? 'Creating your listing…' : 'Create My Vendor Profile'}
            </button>
          </form>
        )}
        <p className="text-center text-xs text-[#988FA6] mt-5">Logo and portfolio photos can be added from your dashboard after registration.</p>
      </div>
    </div>
  );
};

export default VendorAuth;
