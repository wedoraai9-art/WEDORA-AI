import React, { useState, useEffect, useRef } from 'react';
import {
  apiVendorUpdate,
  apiUploadLogo,
  apiDeleteLogo,
  apiAIGenerateProfile,
  fmtApiError,
} from '@/lib/auth';
import { toast } from 'sonner';
import { Sparkles, Upload, Trash2, Save, MapPin, Phone, Instagram, Globe } from 'lucide-react';

const inputCls =
  "mt-1 w-full rounded-2xl px-4 py-2.5 bg-white/70 border border-white/80 outline-none focus:border-pink-300 text-[#2D2638] text-sm";

const labelCls = "text-xs uppercase tracking-widest text-[#988FA6]";

const CATEGORIES = [
  'Wedding Decor',
  'Wedding Planner',
  'Photographer',
  'Videographer',
  'Caterer',
  'Florist',
  'Makeup Artist',
  'Mehendi Artist',
  'DJ',
  'Music/Band',
  'Choreographer',
  'Venue',
  'Hotel',
  'Resort',
  'Farmhouse',
  'Invitation Designer',
  'Furniture/Rental',
  'Bridal Wear',
  'Groom Wear',
  'Jewellery',
  'Transportation',
  'Other',
];

const normalizeVendorForm = (vendor = {}) => ({
  business_name: vendor.business_name || '',
  contact_person: vendor.contact_person || '',
  phone: vendor.phone || '',
  whatsapp: vendor.whatsapp || '',
  category: vendor.category || CATEGORIES[0],
  city: vendor.city || '',
  address: vendor.address || '',
  years_experience:
    vendor.years_experience !== undefined && vendor.years_experience !== null
      ? vendor.years_experience
      : '',
  starting_price:
    vendor.starting_price !== undefined && vendor.starting_price !== null
      ? vendor.starting_price
      : '',
  instagram: vendor.instagram || '',
  website: vendor.website || '',
  description: vendor.description || '',
  logo: vendor.logo || '',
});

export const ProfileTab = ({ vendor, planDetails, onSaved }) => {
  const [form, setForm] = useState(normalizeVendorForm(vendor));
  const [busy, setBusy] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [deleteLogoBusy, setDeleteLogoBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiDraft, setAiDraft] = useState('');
  const logoRef = useRef(null);

  useEffect(() => {
    setForm(normalizeVendorForm(vendor));
  }, [vendor]);

  const set = (key) => (event) => {
    setForm((current) => ({
      ...current,
      [key]: event.target.value,
    }));
  };

  const save = async (event) => {
    event.preventDefault();

    if (!form.business_name.trim()) {
      toast.error('Please enter your business name');
      return;
    }

    if (!form.city.trim()) {
      toast.error('Please enter your city');
      return;
    }

    setBusy(true);

    try {
      const payload = {
        ...form,
        business_name: form.business_name.trim(),
        contact_person: form.contact_person.trim(),
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim(),
        category: form.category,
        city: form.city.trim(),
        address: form.address.trim(),
        years_experience: Number(form.years_experience) || 0,
        starting_price: Number(form.starting_price) || 0,
        instagram: form.instagram.trim(),
        website: form.website.trim(),
        description: form.description.trim(),
      };

      // These values are server-managed and must not be sent back
      // as editable vendor profile fields.
      delete payload.id;
      delete payload.slug;
      delete payload.plan;
      delete payload.email;
      delete payload.plan_badge;
      delete payload.plan_label;
      delete payload.is_featured;
      delete payload.created_at;
      delete payload.portfolio;
      delete payload.logo;

      const response = await apiVendorUpdate(payload);

      const updatedVendor = response?.vendor || response;

      if (updatedVendor) {
        setForm(normalizeVendorForm(updatedVendor));
      }

      toast.success('Profile saved successfully');
      onSaved && onSaved(updatedVendor);
    } catch (error) {
      toast.error(
        fmtApiError(
          error?.response?.data?.detail,
          'Could not save your profile. Please try again.'
        )
      );
    } finally {
      setBusy(false);
    }
  };

  const onLogo = async (event) => {
    const file = event.target.files?.[0];

    // Reset the input so selecting the same file again also triggers change.
    event.target.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Logo must be smaller than 10 MB');
      return;
    }

    setLogoBusy(true);

    try {
      const response = await apiUploadLogo(file);
      const updatedVendor = response?.vendor;

      if (updatedVendor) {
        setForm(normalizeVendorForm(updatedVendor));
      }

      toast.success('Logo updated successfully');
      onSaved && onSaved(updatedVendor);
    } catch (error) {
      toast.error(
        fmtApiError(
          error?.response?.data?.detail,
          'Logo upload failed. Please try again.'
        )
      );
    } finally {
      setLogoBusy(false);
    }
  };

  const removeLogo = async () => {
    if (!form.logo) return;

    setDeleteLogoBusy(true);

    try {
      const response = await apiDeleteLogo();
      const updatedVendor = response?.vendor;

      setForm((current) => ({
        ...current,
        logo: updatedVendor?.logo || '',
      }));

      toast.success('Logo removed');
      onSaved && onSaved(updatedVendor);
    } catch (error) {
      toast.error(
        fmtApiError(
          error?.response?.data?.detail,
          'Could not remove the logo.'
        )
      );
    } finally {
      setDeleteLogoBusy(false);
    }
  };

  const genAI = async () => {
    if (!planDetails?.ai_profile) {
      toast.error('AI profile generation is available on PREMIUM.');
      window.dispatchEvent(
        new CustomEvent('wedora:goto-tab', { detail: 'subscription' })
      );
      return;
    }

    setAiBusy(true);

    try {
      const response = await apiAIGenerateProfile({
        business_name: form.business_name,
        category: form.category,
        location: form.city,
        experience: `${form.years_experience || 0} years`,
        services: form.category,
        price_range: form.starting_price
          ? `from ₹${Number(form.starting_price).toLocaleString('en-IN')}`
          : 'flexible',
        notes: aiDraft,
      });

      if (!response?.description) {
        throw new Error('The AI did not return a profile description.');
      }

      setForm((current) => ({
        ...current,
        description: response.description,
      }));

      toast.success('AI draft ready — edit it below and save when you love it');
    } catch (error) {
      const detail = error?.response?.data?.detail;

      if (detail === 'AI_PROFILE_PREMIUM_ONLY') {
        toast.error('This feature is available on PREMIUM.');
      } else {
        toast.error(
          fmtApiError(
            detail,
            'AI generation failed. You can still write your profile manually.'
          )
        );
      }
    } finally {
      setAiBusy(false);
    }
  };

  const isPremium = Boolean(planDetails?.ai_profile);

  return (
    <form
      onSubmit={save}
      className="pearl-card p-6 md:p-8"
      data-testid="profile-tab"
    >
      {/* Profile header */}
      <div className="flex flex-wrap items-center justify-between gap-5 mb-7">
        <div>
          <h2 className="font-heading font-semibold text-xl text-[#2D2638]">
            My Profile
          </h2>
          <p className="text-sm text-[#6B617A] mt-1">
            Keep your vendor information accurate so couples know exactly what
            you offer.
          </p>
        </div>

        <button
          type="submit"
          data-testid="profile-save-btn-top"
          disabled={busy}
          className="glow-btn !py-2.5 !px-5 inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {busy ? 'Saving…' : 'Save Profile'}
        </button>
      </div>

      {/* Logo */}
      <div className="flex flex-wrap items-center gap-5 mb-7">
        <div className="relative w-20 h-20 rounded-3xl overflow-hidden bg-white/70 border border-white/80 flex items-center justify-center">
          {form.logo ? (
            <img
              src={form.logo}
              alt={`${form.business_name || 'Vendor'} logo`}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl font-display text-[#988FA6]">
              {form.business_name?.[0]?.toUpperCase() || 'W'}
            </span>
          )}
        </div>

        <div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              data-testid="logo-upload-btn"
              onClick={() => logoRef.current?.click()}
              disabled={logoBusy || deleteLogoBusy}
              className="chip !text-xs inline-flex items-center gap-1.5 disabled:opacity-60"
            >
              <Upload className="w-3.5 h-3.5" />
              {logoBusy
                ? 'Uploading…'
                : form.logo
                  ? 'Change logo'
                  : 'Upload logo'}
            </button>

            {form.logo && (
              <button
                type="button"
                data-testid="logo-delete-btn"
                onClick={removeLogo}
                disabled={logoBusy || deleteLogoBusy}
                className="chip !text-xs inline-flex items-center gap-1.5 text-red-400 disabled:opacity-60"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleteLogoBusy ? 'Removing…' : 'Remove'}
              </button>
            )}

            <input
              ref={logoRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              hidden
              onChange={onLogo}
            />
          </div>

          <p className="text-xs text-[#988FA6] mt-2">
            Recommended: square JPG/PNG/WebP, up to 10 MB.
          </p>
        </div>
      </div>

      {/* Basic business information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className={labelCls}>Business Name</span>
          <input
            data-testid="profile-business-name"
            className={inputCls}
            value={form.business_name}
            onChange={set('business_name')}
            placeholder="Your business name"
          />
        </label>

        <label className="block">
          <span className={labelCls}>Contact Person</span>
          <input
            data-testid="profile-contact"
            className={inputCls}
            value={form.contact_person}
            onChange={set('contact_person')}
            placeholder="Contact person"
          />
        </label>

        <label className="block">
          <span className={`${labelCls} inline-flex items-center gap-1.5`}>
            <Phone className="w-3 h-3" />
            Phone
          </span>
          <input
            data-testid="profile-phone"
            type="tel"
            className={inputCls}
            value={form.phone}
            onChange={set('phone')}
            placeholder="Phone number"
          />
        </label>

        <label className="block">
          <span className={labelCls}>WhatsApp</span>
          <input
            data-testid="profile-whatsapp"
            type="tel"
            className={inputCls}
            value={form.whatsapp}
            onChange={set('whatsapp')}
            placeholder="WhatsApp number"
          />
        </label>

        <label className="block">
          <span className={labelCls}>Category</span>
          <select
            data-testid="profile-category"
            className={inputCls}
            value={form.category}
            onChange={set('category')}
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={`${labelCls} inline-flex items-center gap-1.5`}>
            <MapPin className="w-3 h-3" />
            City
          </span>
          <input
            data-testid="profile-city"
            className={inputCls}
            value={form.city}
            onChange={set('city')}
            placeholder="Jaipur"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className={labelCls}>Address</span>
          <input
            data-testid="profile-address"
            className={inputCls}
            value={form.address}
            onChange={set('address')}
            placeholder="Business address"
          />
        </label>

        <label className="block">
          <span className={labelCls}>Years of Experience</span>
          <input
            data-testid="profile-experience"
            type="number"
            min="0"
            max="100"
            className={inputCls}
            value={form.years_experience}
            onChange={set('years_experience')}
            placeholder="0"
          />
        </label>

        <label className="block">
          <span className={labelCls}>Starting Price (₹)</span>
          <input
            data-testid="profile-price"
            type="number"
            min="0"
            className={inputCls}
            value={form.starting_price}
            onChange={set('starting_price')}
            placeholder="0"
          />
        </label>

        <label className="block">
          <span className={`${labelCls} inline-flex items-center gap-1.5`}>
            <Instagram className="w-3 h-3" />
            Instagram
          </span>
          <input
            data-testid="profile-instagram"
            className={inputCls}
            value={form.instagram}
            onChange={set('instagram')}
            placeholder="@yourbusiness"
          />
        </label>

        <label className="block">
          <span className={`${labelCls} inline-flex items-center gap-1.5`}>
            <Globe className="w-3 h-3" />
            Website
          </span>
          <input
            data-testid="profile-website"
            type="url"
            className={inputCls}
            value={form.website}
            onChange={set('website')}
            placeholder="https://yourwebsite.com"
          />
        </label>

        {/* AI generator */}
        <div className="sm:col-span-2 rounded-2xl border border-white/80 bg-gradient-to-br from-[#C9B8FF]/15 to-[#F7B7D8]/15 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div>
              <p className="text-sm font-medium text-[#2D2638] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C9B8FF]" />
                Generate Profile With AI
                <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/70 border border-white/80 text-[#988FA6]">
                  Premium
                </span>
              </p>
              <p className="text-xs text-[#988FA6] mt-1">
                Create a polished vendor description from your business
                information.
              </p>
            </div>

            <button
              type="button"
              data-testid="ai-generate-profile-btn"
              onClick={genAI}
              disabled={aiBusy}
              className="glow-btn !py-2 !px-4 !text-sm disabled:opacity-60"
            >
              {aiBusy ? 'Writing…' : 'Generate'}
            </button>
          </div>

          <textarea
            data-testid="ai-notes"
            rows={2}
            className={inputCls + ' resize-none'}
            placeholder="Optional: add notes for the AI (style, specialties, awards)…"
            value={aiDraft}
            onChange={(event) => setAiDraft(event.target.value)}
          />

          {!isPremium && (
            <p className="text-xs text-[#988FA6] mt-2">
              This feature is available on PREMIUM.{' '}
              <a
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  window.dispatchEvent(
                    new CustomEvent('wedora:goto-tab', {
                      detail: 'subscription',
                    })
                  );
                }}
                className="underline decoration-pink-300"
              >
                Upgrade Plan
              </a>
            </p>
          )}
        </div>

        {/* Description */}
        <label className="block sm:col-span-2">
          <span className={labelCls}>Business Description</span>
          <textarea
            data-testid="profile-description"
            rows={5}
            className={inputCls + ' resize-none'}
            value={form.description}
            onChange={set('description')}
            placeholder="Tell couples what makes your business special..."
          />
          <p className="text-xs text-[#988FA6] mt-1">
            Keep this clear and specific. Mention your style, services,
            experience, and what couples can expect.
          </p>
        </label>
      </div>

      {/* Bottom save */}
      <button
        data-testid="profile-save-btn"
        disabled={busy}
        className="glow-btn mt-6 inline-flex items-center gap-2 disabled:opacity-60"
      >
        <Save className="w-4 h-4" />
        {busy ? 'Saving…' : 'Save Profile'}
      </button>
    </form>
  );
};

export default ProfileTab;
