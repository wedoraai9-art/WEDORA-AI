
import React, { useEffect, useRef, useState } from 'react';
import {
  apiUploadPortfolio,
  apiDeletePortfolio,
  apiGetPortfolioCaseStudies,
  apiCreatePortfolioCaseStudy,
  apiUpdatePortfolioCaseStudy,
  apiDeletePortfolioCaseStudy,
  fmtApiError,
} from '@/lib/auth';
import { toast } from 'sonner';
import { Upload, Trash2, Lock, Plus, Pencil, X, Briefcase, Image as ImageIcon } from 'lucide-react';

const emptyCaseStudy = {
  title: '',
  event_type: 'Wedding',
  location: '',
  event_date: '',
  description: '',
  services: [],
  budget_range: '',
  photos: [],
};

const inputClass =
  'w-full rounded-xl border border-[#DCCFF0] bg-white/80 px-3 py-2.5 text-sm text-[#2D2638] outline-none transition focus:border-[#B99AE8] focus:ring-2 focus:ring-[#E8DDFB]';

const labelClass = 'mb-1.5 block text-sm font-medium text-[#514762]';

export const PortfolioTab = ({ vendor, planDetails, onSaved }) => {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState(null);
  const [caseStudies, setCaseStudies] = useState([]);
  const [loadingStudies, setLoadingStudies] = useState(true);
  const [savingStudy, setSavingStudy] = useState(false);
  const [deletingStudyId, setDeletingStudyId] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyCaseStudy);

  const portfolio = Array.isArray(vendor?.portfolio)
    ? vendor.portfolio
    : [];

  const limit = Number(planDetails?.photo_limit ?? 5);
  const hasUnlimitedPhotos = limit > 1000;
  const limitLabel = hasUnlimitedPhotos ? '∞' : limit;
  const atLimit = !hasUnlimitedPhotos && portfolio.length >= limit;

  const limitMessage = hasUnlimitedPhotos
    ? 'Your PRO portfolio has reached its current photo limit.'
    : `FREE includes up to ${limit} portfolio photos. PRO expands your portfolio after payment is verified.`;

  const refreshAfterChange = async (updatedVendor) => {
    if (onSaved) await onSaved(updatedVendor);
  };

  const openSubscription = () => {
    window.dispatchEvent(
      new CustomEvent('wedora:goto-tab', { detail: 'subscription' })
    );
  };

  const loadCaseStudies = async () => {
    setLoadingStudies(true);
    try {
      const response = await apiGetPortfolioCaseStudies();
      setCaseStudies(
        Array.isArray(response?.case_studies) ? response.case_studies : []
      );
    } catch (err) {
      toast.error(
        fmtApiError(
          err?.response?.data?.detail,
          'Could not load portfolio case studies.'
        )
      );
    } finally {
      setLoadingStudies(false);
    }
  };

  useEffect(() => {
    loadCaseStudies();
  }, []);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (atLimit) {
      toast.error(limitMessage);
      openSubscription();
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Portfolio images must be 8 MB or smaller.');
      return;
    }

    setBusy(true);
    try {
      const response = await apiUploadPortfolio(file);
      toast.success('Photo added to portfolio');
      await refreshAfterChange(response?.vendor);
    } catch (err) {
      const detail = err?.response?.data?.detail || '';
      if (
        String(detail).startsWith('PHOTO_LIMIT') ||
        (err?.response?.status === 403 && /portfolio limit/i.test(String(detail)))
      ) {
        toast.error(limitMessage);
        openSubscription();
      } else {
        toast.error(fmtApiError(detail, 'Upload failed. Please try again.'));
      }
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = async (url) => {
    if (!url || busy || deletingUrl) return;
    if (!window.confirm('Remove this photo from your portfolio?')) return;

    setDeletingUrl(url);
    try {
      const response = await apiDeletePortfolio(url);
      toast.success('Photo removed from portfolio');
      await refreshAfterChange(response?.vendor);
      await loadCaseStudies();
    } catch (err) {
      toast.error(
        fmtApiError(
          err?.response?.data?.detail,
          'Could not remove this photo. Please try again.'
        )
      );
    } finally {
      setDeletingUrl(null);
    }
  };

  const openNewStudy = () => {
    setEditingId(null);
    setForm({ ...emptyCaseStudy });
    setEditorOpen(true);
  };

  const openEditStudy = (study) => {
    setEditingId(study.id);
    setForm({
      ...emptyCaseStudy,
      ...study,
      services: Array.isArray(study.services) ? study.services : [],
      photos: Array.isArray(study.photos) ? study.photos : [],
    });
    setEditorOpen(true);
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleService = (service) => {
    setForm((current) => ({
      ...current,
      services: current.services.includes(service)
        ? current.services.filter((item) => item !== service)
        : [...current.services, service],
    }));
  };

  const togglePhoto = (url) => {
    setForm((current) => ({
      ...current,
      photos: current.photos.includes(url)
        ? current.photos.filter((item) => item !== url)
        : [...current.photos, url],
    }));
  };

  const saveCaseStudy = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Please enter a project title.');
      return;
    }

    setSavingStudy(true);
    const payload = {
      ...form,
      title: form.title.trim(),
      event_type: form.event_type.trim() || 'Wedding',
      location: form.location.trim(),
      event_date: form.event_date.trim(),
      description: form.description.trim(),
      budget_range: form.budget_range.trim(),
      services: form.services,
      photos: form.photos,
    };

    try {
      if (editingId) {
        await apiUpdatePortfolioCaseStudy(editingId, payload);
        toast.success('Case study updated');
      } else {
        await apiCreatePortfolioCaseStudy(payload);
        toast.success('Case study created');
      }
      setEditorOpen(false);
      setEditingId(null);
      setForm({ ...emptyCaseStudy });
      await loadCaseStudies();
    } catch (err) {
      toast.error(
        fmtApiError(
          err?.response?.data?.detail,
          'Could not save the case study. Please try again.'
        )
      );
    } finally {
      setSavingStudy(false);
    }
  };

  const removeCaseStudy = async (study) => {
    if (!study?.id || deletingStudyId) return;
    if (!window.confirm(`Delete the case study "${study.title}"?`)) return;

    setDeletingStudyId(study.id);
    try {
      await apiDeletePortfolioCaseStudy(study.id);
      setCaseStudies((current) =>
        current.filter((item) => item.id !== study.id)
      );
      toast.success('Case study deleted');
    } catch (err) {
      toast.error(
        fmtApiError(
          err?.response?.data?.detail,
          'Could not delete the case study.'
        )
      );
    } finally {
      setDeletingStudyId(null);
    }
  };

  const servicesList = [
    'Wedding design',
    'Event decor',
    'Floral design',
    'Stage design',
    'Lighting',
    'Guest tables',
    'Production & execution',
    'Planning support',
  ];

  return (
    <div className="space-y-6" data-testid="portfolio-tab">
      {/* Photo portfolio */}
      <section className="pearl-card rounded-3xl p-6 md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-heading text-lg font-semibold text-[#2D2638]">
              Portfolio
            </h3>
            <p className="text-sm text-[#6B617A]">
              {portfolio.length} / {limitLabel} photos on{' '}
              {planDetails?.label || 'Free'} plan
            </p>
            <p
              className="mt-1 text-xs leading-relaxed text-[#8A8199]"
              data-testid="portfolio-upload-requirements"
            >
              Supported image formats: JPG, JPEG, PNG, WEBP, GIF and other
              browser-supported image formats. Maximum file size: 8 MB per image.
            </p>
          </div>

          <button
            type="button"
            data-testid="portfolio-upload-btn"
            onClick={() => {
              if (atLimit) {
                toast.error(limitMessage);
                openSubscription();
                return;
              }
              fileRef.current?.click();
            }}
            disabled={busy || Boolean(deletingUrl)}
            className="glow-btn inline-flex items-center gap-2 !px-5 !py-2 !text-sm transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload className="h-4 w-4" />
            {busy ? 'Uploading…' : 'Add photo'}
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={onFile}
          />
        </div>

        {portfolio.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#C9B8FF]/60 bg-white/50 p-10 text-center text-[#6B617A]">
            <Lock className="mx-auto mb-3 h-6 w-6 text-[#C9B8FF]" />
            <p>
              Your portfolio is empty. Add your first photo — couples love
              seeing real work.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {portfolio.map((url, i) => {
              const isDeleting = deletingUrl === url;
              return (
                <div
                  key={`${url}-${i}`}
                  data-testid={`portfolio-image-${i}`}
                  className="group relative aspect-square overflow-hidden rounded-2xl border border-white/70"
                >
                  <img
                    src={url}
                    alt={`Portfolio ${i + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <button
                    type="button"
                    data-testid={`portfolio-delete-${i}`}
                    onClick={() => removePhoto(url)}
                    disabled={busy || Boolean(deletingUrl)}
                    aria-label={`Remove portfolio photo ${i + 1}`}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/80 bg-white/85 opacity-0 backdrop-blur transition-all duration-300 hover:bg-rose-50 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2
                      className={`h-4 w-4 text-red-400 ${
                        isDeleting ? 'animate-pulse' : ''
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Case studies */}
      <section
        className="pearl-card rounded-3xl p-6 md:p-8"
        data-testid="portfolio-case-studies"
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-[#A88BD8]" />
              <h3 className="font-heading text-lg font-semibold text-[#2D2638]">
                Portfolio Case Studies
              </h3>
            </div>
            <p className="mt-1 text-sm text-[#6B617A]">
              Showcase your event projects, design concepts, services, and
              selected portfolio photos.
            </p>
          </div>
          <button
            type="button"
            onClick={openNewStudy}
            className="glow-btn inline-flex items-center gap-2 !px-5 !py-2 !text-sm transition-all duration-300"
            data-testid="add-case-study-btn"
          >
            <Plus className="h-4 w-4" />
            Add case study
          </button>
        </div>

        {editorOpen && (
          <form
            onSubmit={saveCaseStudy}
            className="mb-6 rounded-2xl border border-[#DCCFF0] bg-white/70 p-4 md:p-6"
            data-testid="case-study-form"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h4 className="font-heading text-base font-semibold text-[#2D2638]">
                {editingId ? 'Edit case study' : 'Create a case study'}
              </h4>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                aria-label="Close case study form"
                className="rounded-full p-2 text-[#6B617A] transition hover:bg-[#F4ECFC]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Project title *</label>
                <input
                  className={inputClass}
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  maxLength={120}
                  placeholder="e.g. A pastel garden wedding"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Event type</label>
                <input
                  className={inputClass}
                  value={form.event_type}
                  onChange={(e) => updateField('event_type', e.target.value)}
                  maxLength={60}
                  placeholder="Wedding, engagement, birthday..."
                />
              </div>
              <div>
                <label className={labelClass}>Venue / location</label>
                <input
                  className={inputClass}
                  value={form.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  maxLength={120}
                  placeholder="Venue or city"
                />
              </div>
              <div>
                <label className={labelClass}>Event date</label>
                <input
                  className={inputClass}
                  value={form.event_date}
                  onChange={(e) => updateField('event_date', e.target.value)}
                  maxLength={40}
                  placeholder="e.g. 12 December 2026"
                />
              </div>
              <div>
                <label className={labelClass}>Budget range (optional)</label>
                <input
                  className={inputClass}
                  value={form.budget_range}
                  onChange={(e) => updateField('budget_range', e.target.value)}
                  maxLength={80}
                  placeholder="e.g. ₹5–8 lakh"
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Design concept / project description</label>
                <textarea
                  className={`${inputClass} min-h-24 resize-y`}
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  maxLength={200}
                  placeholder="Describe the event concept, client brief, or design story..."
                />
                <p className="mt-1 text-right text-xs text-[#8A8199]">
                  {form.description.length}/200
                </p>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Services provided</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {servicesList.map((service) => (
                    <label
                      key={service}
                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#E5DDF0] bg-white/70 px-3 py-2 text-xs text-[#514762] transition hover:border-[#B99AE8]"
                    >
                      <input
                        type="checkbox"
                        checked={form.services.includes(service)}
                        onChange={() => toggleService(service)}
                        className="accent-[#A88BD8]"
                      />
                      {service}
                    </label>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>
                  Select photos from your uploaded portfolio
                </label>
                {portfolio.length === 0 ? (
                  <p className="rounded-xl bg-[#F7F2FC] p-3 text-xs text-[#6B617A]">
                    Upload portfolio photos above before attaching images to
                    this case study.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                    {portfolio.map((url, index) => (
                      <label
                        key={`${url}-${index}`}
                        className={`relative cursor-pointer overflow-hidden rounded-xl border-2 ${
                          form.photos.includes(url)
                            ? 'border-[#A88BD8] ring-2 ring-[#E8DDFB]'
                            : 'border-transparent'
                        }`}
                      >
                        <img
                          src={url}
                          alt={`Select portfolio image ${index + 1}`}
                          className="aspect-square w-full object-cover"
                          loading="lazy"
                        />
                        <span className="absolute left-2 top-2 rounded-md bg-white/90 px-1.5 py-1 text-[10px] text-[#514762]">
                          <input
                            type="checkbox"
                            checked={form.photos.includes(url)}
                            onChange={() => togglePhoto(url)}
                            aria-label={`Select photo ${index + 1}`}
                            className="accent-[#A88BD8]"
                          />
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="rounded-xl border border-[#DCCFF0] bg-white/80 px-4 py-2 text-sm text-[#514762] transition hover:bg-[#F7F2FC]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingStudy}
                className="glow-btn inline-flex items-center gap-2 !px-5 !py-2 !text-sm transition-all duration-300 disabled:opacity-60"
              >
                {savingStudy ? 'Saving…' : editingId ? 'Save changes' : 'Create case study'}
              </button>
            </div>
          </form>
        )}

        {loadingStudies ? (
          <div className="rounded-2xl bg-white/50 p-8 text-center text-sm text-[#6B617A]">
            Loading case studies…
          </div>
        ) : caseStudies.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#C9B8FF]/60 bg-white/50 p-10 text-center text-[#6B617A]">
            <ImageIcon className="mx-auto mb-3 h-7 w-7 text-[#C9B8FF]" />
            <p className="font-medium text-[#514762]">
              No case studies yet
            </p>
            <p className="mt-1 text-sm">
              Turn your completed events into project stories that couples can
              explore.
            </p>
            <button
              type="button"
              onClick={openNewStudy}
              className="glow-btn mt-4 inline-flex items-center gap-2 !px-5 !py-2 !text-sm"
            >
              <Plus className="h-4 w-4" />
              Create your first case study
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {caseStudies.map((study) => (
              <article
                key={study.id}
                className="overflow-hidden rounded-2xl border border-white/80 bg-white/65 shadow-sm"
                data-testid={`case-study-${study.id}`}
              >
                {Array.isArray(study.photos) && study.photos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-1 bg-[#F4ECFC]">
                    {study.photos.slice(0, 2).map((url, index) => (
                      <img
                        key={`${url}-${index}`}
                        src={url}
                        alt={`${study.title} ${index + 1}`}
                        className="h-40 w-full object-cover"
                        loading="lazy"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex h-28 items-center justify-center bg-gradient-to-r from-[#F1E7FC] via-[#FCEAF2] to-[#E5F4FC]">
                    <ImageIcon className="h-8 w-8 text-[#A88BD8]" />
                  </div>
                )}

                <div className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h4 className="font-heading text-base font-semibold text-[#2D2638]">
                        {study.title}
                      </h4>
                      <p className="mt-1 text-xs text-[#7B718B]">
                        {[study.event_type, study.location, study.event_date]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#F2E8FC] px-2.5 py-1 text-[10px] font-medium text-[#725A98]">
                      Case study
                    </span>
                  </div>

                  {study.description && (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#6B617A]">
                      {study.description}
                    </p>
                  )}

                  {Array.isArray(study.services) && study.services.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {study.services.map((service) => (
                        <span
                          key={service}
                          className="rounded-full border border-[#E5DDF0] bg-white/70 px-2.5 py-1 text-[10px] text-[#6B617A]"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  )}

                  {study.budget_range && (
                    <p className="mt-3 text-xs text-[#7B718B]">
                      Budget range: {study.budget_range}
                    </p>
                  )}

                  <div className="mt-4 flex justify-end gap-2 border-t border-[#EEE7F5] pt-3">
                    <button
                      type="button"
                      onClick={() => openEditStudy(study)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCCFF0] bg-white/80 px-3 py-1.5 text-xs text-[#514762] transition hover:bg-[#F4ECFC]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCaseStudy(study)}
                      disabled={deletingStudyId === study.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-100 bg-white/80 px-3 py-1.5 text-xs text-rose-500 transition hover:bg-rose-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {deletingStudyId === study.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default PortfolioTab;
