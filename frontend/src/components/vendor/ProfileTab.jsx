import React, { useState, useEffect, useRef } from 'react';
import { apiVendorUpdate, apiUploadLogo, apiDeleteLogo, apiAIGenerateProfile, authAxios, fmtApiError } from '@/lib/auth';
import { toast } from 'sonner';
import { Sparkles, Upload, Trash2 } from 'lucide-react';

const inputCls = "mt-1 w-full rounded-2xl px-4 py-2.5 bg-white/70 border border-white/80 outline-none focus:border-pink-300 text-[#2D2638] text-sm";
const labelCls = "text-xs uppercase tracking-widest text-[#988FA6]";

const CATEGORIES = [
  'Wedding Decor', 'Wedding Planner', 'Photographer', 'Videographer', 'Caterer',
  'Florist', 'Makeup Artist', 'Mehendi Artist', 'DJ', 'Music/Band', 'Choreographer',
  'Venue', 'Hotel', 'Resort', 'Farmhouse', 'Invitation Designer', 'Furniture/Rental',
  'Bridal Wear', 'Groom Wear', 'Jewellery', 'Transportation', 'Other',
];

export const ProfileTab = ({ vendor, planDetails, onSaved }) => {
  const [form, setForm] = useState({ ...vendor, years_experience: vendor.years_experience || '', starting_price: vendor.starting_price || '' });
  const [servicesText, setServicesText] = useState(Array.isArray(vendor.services) ? vendor.services.join(', ') : (vendor.services || ''));
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiDraft, setAiDraft] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const logoRef = useRef(null);
  const backgroundRef = useRef(null);
  const [backgroundBusy, setBackgroundBusy] = useState(false);

  useEffect(() => {
    setForm({ ...vendor, years_experience: vendor.years_experience ?? '', starting_price: vendor.starting_price ?? '' });
    setServicesText(Array.isArray(vendor.services) ? vendor.services.join(', ') : (vendor.services || ''));
  }, [vendor]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        ...form,
        years_experience: Number(form.years_experience) || 0,
        starting_price: Number(form.starting_price) || 0,
        services: servicesText.split(/[\n,]/).map((service) => service.trim()).filter(Boolean),
      };
      delete payload.id; delete payload.slug; delete payload.plan; delete payload.email; delete payload.plan_badge; delete payload.plan_label; delete payload.is_featured; delete payload.created_at; delete payload.portfolio; delete payload.logo; delete payload.profile_background;
      const r = await apiVendorUpdate(payload);
      toast.success('Profile saved');
      onSaved && onSaved(r.vendor);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) { toast.error(fmtApiError(err.response?.data?.detail, 'Save failed')); }
    setBusy(false);
  };

  const onLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await apiUploadLogo(file);
      toast.success('Logo updated');
      onSaved && onSaved();
    } catch (err) { toast.error(fmtApiError(err.response?.data?.detail, 'Upload failed')); }
  };

  const onBackground = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Choose a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error('Choose an image that is 3 MB or smaller.');
      return;
    }

    const body = new FormData();
    body.append('file', file);
    setBackgroundBusy(true);
    try {
      const response = await authAxios.post('/vendor/upload/profile-background', body);
      setForm((current) => ({ ...current, profile_background: response?.data?.profile_background || current.profile_background }));
      toast.success('Profile background updated');
      onSaved && onSaved();
    } catch (err) {
      toast.error(fmtApiError(err.response?.data?.detail, 'Background upload failed'));
    } finally {
      setBackgroundBusy(false);
    }
  };

  const removeBackground = async () => {
    setBackgroundBusy(true);
    try {
      await authAxios.delete('/vendor/profile-background');
      setForm((current) => ({ ...current, profile_background: null }));
      toast.success('Profile background removed');
      onSaved && onSaved();
    } catch (err) {
      toast.error(fmtApiError(err.response?.data?.detail, 'Could not remove the background'));
    } finally {
      setBackgroundBusy(false);
    }
  };

  const genAI = async () => {
    setAiBusy(true);
    try {
      const r = await apiAIGenerateProfile({
        business_name: form.business_name, category: form.category, location: form.city,
        experience: `${form.years_experience} years`, services: servicesText || form.category,
        price_range: form.starting_price ? `from ₹${Number(form.starting_price).toLocaleString('en-IN')}` : 'flexible',
        notes: aiDraft,
      });
      setForm((f) => ({ ...f, description: r.description }));
      setAiSuggestions({
        category: r.suggested_category || '',
        services: Array.isArray(r.suggested_services) ? r.suggested_services : [],
      });
      toast.success('AI business suggestions are ready to review');
    } catch (err) {
      const d = err.response?.data?.detail;
      if (d === 'AI_PROFILE_PRO_ONLY' || d === 'AI_PROFILE_PREMIUM_ONLY') toast.error('This feature is available on PRO.');
      else toast.error(fmtApiError(d, 'AI generation failed'));
    }
    setAiBusy(false);
  };

  const isPro = planDetails?.ai_profile === true || vendor.plan === 'pro';

  return (
    <form onSubmit={save} className="pearl-card p-6 md:p-8" data-testid="profile-tab">
      {/* Logo */}
      <div className="flex items-center gap-5 mb-7">
        <div className="relative w-20 h-20 rounded-3xl overflow-hidden bg-white/70 border border-white/80 flex items-center justify-center">
          {form.logo ? <img src={form.logo} alt="logo" className="w-full h-full object-cover" /> : <span className="text-2xl font-display text-[#988FA6]">{form.business_name?.[0] || 'W'}</span>}
        </div>
        <div className="flex gap-2">
          <button type="button" data-testid="logo-upload-btn" onClick={() => logoRef.current?.click()} className="chip !text-xs inline-flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" /> {form.logo ? 'Change logo' : 'Upload logo'}
          </button>
          {form.logo && (
            <button type="button" data-testid="logo-delete-btn" onClick={async () => { await apiDeleteLogo(); onSaved && onSaved(); }} className="chip !text-xs inline-flex items-center gap-1.5 text-red-400">
              <Trash2 className="w-3.5 h-3.5" /> Remove
            </button>
          )}
          <input ref={logoRef} type="file" accept="image/*" hidden onChange={onLogo} />
        </div>
      </div>
      <p className="-mt-5 mb-7 ml-[6.25rem] text-xs text-[#988FA6]">Recommended logo size: 500 × 500 pixels (square) · 5 MB maximum</p>

      {/* Public profile cover image */}
      <div className="mb-7 rounded-3xl border border-white/80 bg-white/50 p-4 md:p-5">
        <p className={labelCls}>Public profile background</p>
        <p className="mt-1 text-sm text-[#6B617A]">Add a wide cover photo behind your public business profile.</p>
        <div
          className="mt-4 h-36 md:h-48 rounded-2xl border border-white/80 bg-gradient-to-br from-[#E9DDFC] via-[#FFF5FA] to-[#DFF5FA] bg-cover bg-center"
          style={form.profile_background ? { backgroundImage: `url("${form.profile_background}")` } : undefined}
          role="img"
          aria-label={form.profile_background ? 'Current public profile background' : 'Background image preview'}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => backgroundRef.current?.click()} disabled={backgroundBusy} className="chip !text-xs inline-flex items-center gap-1.5 disabled:opacity-60">
            <Upload className="w-3.5 h-3.5" /> {backgroundBusy ? 'Uploading…' : form.profile_background ? 'Change background' : 'Upload background'}
          </button>
          {form.profile_background && (
            <button type="button" onClick={removeBackground} disabled={backgroundBusy} className="chip !text-xs inline-flex items-center gap-1.5 text-red-400 disabled:opacity-60">
              <Trash2 className="w-3.5 h-3.5" /> Remove background
            </button>
          )}
          <input ref={backgroundRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onBackground} />
        </div>
        <p className="mt-2 text-xs text-[#988FA6]">JPG, PNG, or WebP · 3 MB maximum · Recommended size: 1600 × 500 pixels</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block"><span className={labelCls}>Business Name</span><input data-testid="profile-business-name" className={inputCls} value={form.business_name || ''} onChange={set('business_name')} /></label>
        <label className="block"><span className={labelCls}>Contact Person</span><input data-testid="profile-contact" className={inputCls} value={form.contact_person || ''} onChange={set('contact_person')} /></label>
        <label className="block"><span className={labelCls}>Phone</span><input data-testid="profile-phone" className={inputCls} value={form.phone || ''} onChange={set('phone')} /></label>
        <label className="block"><span className={labelCls}>WhatsApp</span><input data-testid="profile-whatsapp" className={inputCls} value={form.whatsapp || ''} onChange={set('whatsapp')} /></label>
        <label className="block"><span className={labelCls}>Category</span>
          <select data-testid="profile-category" className={inputCls} value={form.category || ''} onChange={set('category')}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="block"><span className={labelCls}>City</span><input data-testid="profile-city" className={inputCls} value={form.city || ''} onChange={set('city')} /></label>
        <label className="block"><span className={labelCls}>Address</span><input data-testid="profile-address" className={inputCls} value={form.address || ''} onChange={set('address')} /></label>
        <label className="block"><span className={labelCls}>Years of Experience</span><input data-testid="profile-experience" type="number" min="0" className={inputCls} value={form.years_experience} onChange={set('years_experience')} /></label>
        <label className="block"><span className={labelCls}>Starting Price (₹)</span><input data-testid="profile-price" type="number" min="0" className={inputCls} value={form.starting_price} onChange={set('starting_price')} /></label>
        <label className="block sm:col-span-2"><span className={labelCls}>Services</span>
          <textarea data-testid="profile-services" rows={2} className={inputCls + ' resize-y'} placeholder="For example: Wedding décor, floral design, lighting" value={servicesText} onChange={(e) => setServicesText(e.target.value)} />
          <span className="text-xs text-[#988FA6]">Separate services with commas or put each on a new line.</span>
        </label>
        <label className="block"><span className={labelCls}>Instagram</span><input data-testid="profile-instagram" className={inputCls} value={form.instagram || ''} onChange={set('instagram')} /></label>
        <label className="block sm:col-span-2"><span className={labelCls}>Website</span><input data-testid="profile-website" className={inputCls} value={form.website || ''} onChange={set('website')} /></label>

        {/* AI generator */}
        <div className="sm:col-span-2 rounded-2xl border border-white/80 bg-gradient-to-br from-[#C9B8FF]/15 to-[#F7B7D8]/15 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <p className="text-sm font-medium text-[#2D2638] flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#C9B8FF]" /> PRO AI Business &amp; Category Assistant <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/70 border border-white/80 text-[#988FA6]">PRO</span></p>
            <button type="button" data-testid="ai-generate-profile-btn" onClick={genAI} disabled={aiBusy || !isPro} className="glow-btn !py-2 !px-4 !text-sm disabled:opacity-60">
              {aiBusy ? 'Writing…' : 'Generate'}
            </button>
          </div>
          <textarea data-testid="ai-notes" rows={2} className={inputCls + ' resize-none'} placeholder="Optional: add notes for the AI (style, specialties, awards)…" value={aiDraft} onChange={(e) => setAiDraft(e.target.value)} />
          <p className="text-xs text-[#988FA6] mt-2">Gemini drafts your description and suggests a matching category and services. Review everything before saving.</p>
          {aiSuggestions && (
            <div className="mt-3 rounded-2xl border border-white/80 bg-white/60 p-4" data-testid="ai-business-suggestions">
              <p className="text-xs uppercase tracking-widest text-[#988FA6]">Suggested category</p>
              <p className="text-sm text-[#2D2638] mt-1">{aiSuggestions.category || 'Keep your current category'}</p>
              {aiSuggestions.services.length > 0 && (
                <>
                  <p className="text-xs uppercase tracking-widest text-[#988FA6] mt-3">Suggested services</p>
                  <p className="text-sm text-[#6B617A] mt-1">{aiSuggestions.services.join(' · ')}</p>
                </>
              )}
              <button
                type="button"
                data-testid="ai-apply-suggestions"
                onClick={() => {
                  if (aiSuggestions.category && CATEGORIES.includes(aiSuggestions.category)) {
                    setForm((f) => ({ ...f, category: aiSuggestions.category }));
                  }
                  if (aiSuggestions.services.length > 0) {
                    setServicesText(aiSuggestions.services.join(', '));
                  }
                  setAiSuggestions(null);
                  toast.success('Suggestions added to your profile draft. Review and save when ready.');
                }}
                className="chip !text-xs mt-3"
              >
                Apply category &amp; services
              </button>
            </div>
          )}
          {!isPro && <p className="text-xs text-[#988FA6] mt-2">The AI profile assistant is available on PRO. <a href="#" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('wedora:goto-tab', { detail: 'subscription' })); }} className="underline decoration-pink-300">View plans</a></p>}
        </div>

        <label className="block sm:col-span-2"><span className={labelCls}>Business Description</span>
          <textarea data-testid="profile-description" rows={4} className={inputCls + ' resize-none'} value={form.description || ''} onChange={set('description')} />
        </label>
      </div>

      <button data-testid="profile-save-btn" disabled={busy} className="glow-btn mt-6 disabled:opacity-60">{busy ? 'Saving…' : 'Save Profile'}</button>
    </form>
  );
};

export default ProfileTab;
