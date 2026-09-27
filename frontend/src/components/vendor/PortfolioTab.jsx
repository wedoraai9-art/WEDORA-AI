
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
import { Upload, Trash2, Lock, Plus, Pencil, X, Save, BookOpen } from 'lucide-react';

const emptyCaseStudy = {
  title: '',
  event_type: 'Wedding',
  location: '',
  event_date: '',
  description: '',
  services: '',
  budget_range: '',
  photos: [],
};

const inputClass =
  'w-full rounded-xl border border-[#DCD2EE] bg-white/80 px-3 py-2.5 text-sm text-[#342C42] outline-none transition focus:border-[#C99CEB] focus:ring-2 focus:ring-[#EAD7FA]';

export const PortfolioTab = ({ vendor, planDetails, onSaved }) => {
  const fileRef = useRef(null);

  const [busy, setBusy] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState(null);
  const [caseStudies, setCaseStudies] = useState([]);
  const [caseStudiesLoading, setCaseStudiesLoading] = useState(true);
  const [showCaseStudyForm, setShowCaseStudyForm] = useState(false);
  const [savingCaseStudy, setSavingCaseStudy] = useState(false);
  const [deletingCaseStudyId, setDeletingCaseStudyId] = useState(null);
  const [editingCaseStudyId, setEditingCaseStudyId] = useState(null);
  const [caseStudyForm, setCaseStudyForm] = useState(emptyCaseStudy);

  const portfolio = Array.isArray(vendor?.portfolio)
    ? vendor.portfolio
    : [];

  const limit = Number(planDetails?.photo_limit ?? 5);
  const hasUnlimitedPhotos = limit > 1000;
  const limitLabel = hasUnlimitedPhotos ? '∞' : limit;

  const atLimit =
    !hasUnlimitedPhotos && portfolio.length >= limit;

  const limitMessage = hasUnlimitedPhotos
    ? 'Your PRO portfolio has reached its current photo limit.'
    : `FREE includes up to ${limit} portfolio photos. PRO expands your portfolio after payment is verified.`;

  const refreshAfterChange = async (updatedVendor) => {
    if (onSaved) {
      await onSaved(updatedVendor);
    }
  };

  const openSubscription = () => {
    window.dispatchEvent(
      new CustomEvent('wedora:goto-tab', {
        detail: 'subscription',
      })
    );
  };

  const loadCaseStudies = async () => {
    setCaseStudiesLoading(true);

    try {
      const response = await apiGetPortfolioCaseStudies();
      setCaseStudies(
        Array.isArray(response?.case_studies)
          ? response.case_studies
          : []
      );
    } catch (err) {
      toast.error(
        fmtApiError(
          err?.response?.data?.detail,
          'Could not load portfolio case studies.'
        )
      );
    } finally {
      setCaseStudiesLoading(false);
    }
  };

  useEffect(() => {
    loadCaseStudies();
  }, []);

  const onFile = async (e) => {
    const file = e.target.files?.[0];

    // Reset input so selecting the same file again works.
    e.target.value = '';

    if (!file) return;

    if (atLimit) {
      toast.error(limitMessage);
      openSubscription();
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
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
        (
          err?.response?.status === 403 &&
          /portfolio limit/i.test(String(detail))
        )
      ) {
        toast.error(limitMessage);
        openSubscription();
      } else {
        toast.error(
          fmtApiError(
            detail,
            'Upload failed. Please try again.'
          )
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async (url) => {
    if (!url || busy || deletingUrl) return;

    const confirmed = window.confirm(
      'Remove this photo from your portfolio?'
    );

    if (!confirmed) return;

    setDeletingUrl(url);

    try {
      const response = await apiDeletePortfolio(url);

      toast.success('Photo removed from portfolio');
      await refreshAfterChange(response?.vendor);

      // Remove deleted images from any open case-study form.
      setCaseStudyForm((current) => ({
        ...current,
        photos: current.photos.filter((photo) => photo !== url),
      }));
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

  const openNewCaseStudyForm = () => {
    setEditingCaseStudyId(null);
    setCaseStudyForm({ ...emptyCaseStudy, photos: [] });
    setShowCaseStudyForm(true);
  };

  const openEditCaseStudyForm = (study) => {
    setEditingCaseStudyId(study.id);
    setCaseStudyForm({
      title: study.title || '',
      event_type: study.event_type || 'Wedding',
      location: study.location || '',
      event_date: study.event_date || '',
      description: study.description || '',
      services: Array.isArray(study.services)
        ? study.services.join(', ')
        : '',
      budget_range: study.budget_range || '',
      photos: Array.isArray(study.photos) ? study.photos : [],
    });
    setShowCaseStudyForm(true);
  };

  const closeCaseStudyForm = () => {
    if (savingCaseStudy) return;
    setShowCaseStudyForm(false);
    setEditingCaseStudyId(null);
    setCaseStudyForm(emptyCaseStudy);
  };

  const updateCaseStudyField = (field, value) => {
    setCaseStudyForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const toggleCaseStudyPhoto = (url) => {
    setCaseStudyForm((current) => {
      const alreadySelected = current.photos.includes(url);

      return {
        ...current,
        photos: alreadySelected
          ? current.photos.filter((photo) => photo !== url)
          : [...current.photos, url],
      };
    });
  };

  const saveCaseStudy = async (e) => {
    e.preventDefault();

    const title = caseStudyForm.title.trim();

    if (title.length < 2) {
      toast.error('Please enter a case-study title.');
      return;
    }

    const payload = {
      title,
      event_type: caseStudyForm.event_type.trim() || 'Wedding',
      location: caseStudyForm.location.trim(),
      event_date: caseStudyForm.event_date.trim(),
      description: caseStudyForm.description.trim(),
      services: caseStudyForm.services
        .split(',')
        .map((service) => service.trim())
        .filter(Boolean),
      budget_range: caseStudyForm.budget_range.trim(),
      photos: caseStudyForm.photos,
    };

    setSavingCaseStudy(true);

    try {
      const response = editingCaseStudyId
        ? await apiUpdatePortfolioCaseStudy(
            editingCaseStudyId,
            payload
          )
        : await apiCreatePortfolioCaseStudy(payload);

      if (Array.isArray(response?.case_studies)) {
        setCaseStudies(response.case_studies);
      } else {
        await loadCaseStudies();
      }

      if (response?.vendor) {
        await refreshAfterChange(response.vendor);
      }

      toast.success(
        editingCaseStudyId
          ? 'Case study updated.'
          : 'Case study created.'
      );

      setShowCaseStudyForm(false);
      setEditingCaseStudyId(null);
      setCaseStudyForm(emptyCaseStudy);
    } catch (err) {
      toast.error(
        fmtApiError(
          err?.response?.data?.detail,
          'Could not save this case study. Please try again.'
        )
      );
    } finally {
      setSavingCaseStudy(false);
    }
  };

  const deleteCaseStudy = async (study) => {
    if (!study?.id || deletingCaseStudyId) return;

    const confirmed = window.confirm(
      `Delete the case study "${study.title}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingCaseStudyId(study.id);

    try {
      const response = await apiDeletePortfolioCaseStudy(study.id);

      if (Array.isArray(response?.case_studies)) {
        setCaseStudies(response.case_studies);
      } else {
        await loadCaseStudies();
      }

      if (response?.vendor) {
        await refreshAfterChange(response.vendor);
      }

      toast.success('Case study deleted.');
    } catch (err) {
      toast.error(
        fmtApiError(
          err?.response?.data?.detail,
          'Could not delete this case study. Please try again.'
        )
      );
    } finally {
      setDeletingCaseStudyId(null);
    }
  };

  return (
    <div
      className="space-y-6"
      data-testid="portfolio-tab"
    >
      {/* Existing photo portfolio */}
      <section className="pearl-card p-6 md:p-8">
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
              Supported image formats: JPG, JPEG, PNG, WEBP,
              GIF and other browser-supported image formats.
              Maximum file size: 8 MB per image.
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
              Your portfolio is empty. Add your first photo —
              couples love seeing real work.
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
                    onClick={() => remove(url)}
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

      {/* Portfolio case studies */}
      <section
        className="pearl-card p-6 md:p-8"
        data-testid="portfolio-case-studies"
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#A77AD4]" />
              <h3 className="font-heading text-lg font-semibold text-[#2D2638]">
                Portfolio Case Studies
              </h3>
            </div>
            <p className="mt-1 text-sm text-[#6B617A]">
              Showcase the story behind your event projects.
            </p>
          </div>

          <button
            type="button"
            onClick={openNewCaseStudyForm}
            className="glow-btn inline-flex items-center gap-2 !px-5 !py-2 !text-sm transition-all duration-300"
          >
            <Plus className="h-4 w-4" />
            Add case study
          </button>
        </div>

        {showCaseStudyForm && (
          <form
            onSubmit={saveCaseStudy}
            className="mb-6 rounded-3xl border border-[#DCCCF0] bg-white/70 p-5 md:p-6"
            data-testid="case-study-form"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <h4 className="font-heading text-base font-semibold text-[#2D2638]">
                {editingCaseStudyId ? 'Edit case study' : 'Create case study'}
              </h4>

              <button
                type="button"
                onClick={closeCaseStudyForm}
                disabled={savingCaseStudy}
                aria-label="Close case-study form"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3EAFB] text-[#665879] transition hover:bg-[#EBDCF8] disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-[#5E536E]">
                Project title *
                <input
                  className={`${inputClass} mt-1`}
                  value={caseStudyForm.title}
                  onChange={(e) =>
                    updateCaseStudyField('title', e.target.value)
                  }
                  placeholder="e.g. Royal Garden Wedding"
                  maxLength={120}
                  minLength={2}
                  required
                />
              </label>

              <label className="block text-sm font-medium text-[#5E536E]">
                Event type
                <input
                  className={`${inputClass} mt-1`}
                  value={caseStudyForm.event_type}
                  onChange={(e) =>
                    updateCaseStudyField('event_type', e.target.value)
                  }
                  placeholder="Wedding, engagement, birthday..."
                  maxLength={60}
                />
              </label>

              <label className="block text-sm font-medium text-[#5E536E]">
                Venue / location
                <input
                  className={`${inputClass} mt-1`}
                  value={caseStudyForm.location}
                  onChange={(e) =>
                    updateCaseStudyField('location', e.target.value)
                  }
                  placeholder="Venue or city"
                  maxLength={120}
                />
              </label>

              <label className="block text-sm font-medium text-[#5E536E]">
                Event date
                <input
                  className={`${inputClass} mt-1`}
                  type="date"
                  value={caseStudyForm.event_date}
                  onChange={(e) =>
                    updateCaseStudyField('event_date', e.target.value)
                  }
                />
              </label>

              <label className="block text-sm font-medium text-[#5E536E] md:col-span-2">
                Project story / design concept
                <textarea
                  className={`${inputClass} mt-1 min-h-24 resize-y`}
                  value={caseStudyForm.description}
                  onChange={(e) =>
                    updateCaseStudyField('description', e.target.value)
                  }
                  placeholder="Describe the client's vision, design concept, challenge, and how the event came together."
                  maxLength={200}
                />
                <span className="mt-1 block text-xs font-normal text-[#958AA3]">
                  {caseStudyForm.description.length}/200 characters
                </span>
              </label>

              <label className="block text-sm font-medium text-[#5E536E]">
                Services provided
                <input
                  className={`${inputClass} mt-1`}
                  value={caseStudyForm.services}
                  onChange={(e) =>
                    updateCaseStudyField('services', e.target.value)
                  }
                  placeholder="Design, decor, floral, execution"
                />
                <span className="mt-1 block text-xs font-normal text-[#958AA3]">
                  Separate services with commas.
                </span>
              </label>

              <label className="block text-sm font-medium text-[#5E536E]">
                Budget range (optional)
                <input
                  className={`${inputClass} mt-1`}
                  value={caseStudyForm.budget_range}
                  onChange={(e) =>
                    updateCaseStudyField('budget_range', e.target.value)
                  }
                  placeholder="e.g. ₹5–8 lakh"
                  maxLength={80}
                />
              </label>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-[#5E536E]">
                  Select photos from your uploaded portfolio
                </p>
                <span className="text-xs text-[#958AA3]">
                  {caseStudyForm.photos.length} selected
                </span>
              </div>

              {portfolio.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#D7C7E9] bg-white/60 p-5 text-center text-sm text-[#81758F]">
                  Upload portfolio photos above before attaching them to a case study.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                  {portfolio.map((url, index) => {
                    const selected = caseStudyForm.photos.includes(url);

                    return (
                      <label
                        key={`${url}-case-study-${index}`}
                        className={`relative cursor-pointer overflow-hidden rounded-xl border-2 transition ${
                          selected
                            ? 'border-[#B88AE0] ring-2 ring-[#EAD7FA]'
                            : 'border-transparent hover:border-[#D9C5ED]'
                        }`}
                      >
                        <img
                          src={url}
                          alt={`Select portfolio image ${index + 1}`}
                          className="aspect-square w-full object-cover"
                          loading="lazy"
                        />
                        <input
                          type="checkbox"
                          className="absolute right-2 top-2 h-4 w-4 accent-[#A77AD4]"
                          checked={selected}
                          onChange={() => toggleCaseStudyPhoto(url)}
                        />
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeCaseStudyForm}
                disabled={savingCaseStudy}
                className="rounded-full border border-[#D8C9E8] bg-white/80 px-5 py-2.5 text-sm text-[#62566F] transition hover:bg-[#F8F1FC] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={savingCaseStudy}
                className="glow-btn inline-flex items-center gap-2 !px-5 !py-2.5 !text-sm transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {savingCaseStudy
                  ? 'Saving…'
                  : editingCaseStudyId
                    ? 'Save changes'
                    : 'Create case study'}
              </button>
            </div>
          </form>
        )}

        {caseStudiesLoading ? (
          <div className="rounded-2xl border border-[#E7DDF1] bg-white/50 p-8 text-center text-sm text-[#81758F]">
            Loading case studies…
          </div>
        ) : caseStudies.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#C9B8FF]/60 bg-white/50 p-10 text-center text-[#6B617A]">
            <BookOpen className="mx-auto mb-3 h-6 w-6 text-[#C9B8FF]" />
            <p className="font-medium text-[#51465F]">
              No case studies yet
            </p>
            <p className="mt-1 text-sm">
              Turn your completed events into project stories that help couples understand your work.
            </p>
            <button
              type="button"
              onClick={openNewCaseStudyForm}
              className="glow-btn mt-5 inline-flex items-center gap-2 !px-5 !py-2 !text-sm"
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
                className="overflow-hidden rounded-3xl border border-white/80 bg-white/65 shadow-sm"
                data-testid={`case-study-${study.id}`}
              >
                {Array.isArray(study.photos) && study.photos.length > 0 ? (
                  <div className="grid aspect-[16/7] grid-cols-2 gap-1 overflow-hidden bg-[#F3ECF8]">
                    {study.photos.slice(0, 2).map((photo, index) => (
                      <img
                        key={`${photo}-${index}`}
                        src={photo}
                        alt={`${study.title} photo ${index + 1}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex aspect-[16/7] items-center justify-center bg-gradient-to-br from-[#F2E8FC] via-[#FCEAF2] to-[#E7F4FC]">
                    <BookOpen className="h-9 w-9 text-[#B99AD7]" />
                  </div>
                )}

                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="break-words font-heading text-base font-semibold text-[#2D2638]">
                        {study.title}
                      </h4>
                      <p className="mt-1 text-sm text-[#766A85]">
                        {[study.event_type, study.location, study.event_date]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => openEditCaseStudyForm(study)}
                        aria-label={`Edit ${study.title}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DCCCF0] bg-white text-[#7B6397] transition hover:bg-[#F4EAFB]"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteCaseStudy(study)}
                        disabled={deletingCaseStudyId === study.id}
                        aria-label={`Delete ${study.title}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-rose-100 bg-white text-rose-400 transition hover:bg-rose-50 disabled:opacity-50"
                      >
                        <Trash2
                          className={`h-4 w-4 ${
                            deletingCaseStudyId === study.id
                              ? 'animate-pulse'
                              : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {study.description && (
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-[#62576F]">
                      {study.description}
                    </p>
                  )}

                  {Array.isArray(study.services) &&
                    study.services.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {study.services.map((service, index) => (
                          <span
                            key={`${service}-${index}`}
                            className="rounded-full border border-[#E2D5F0] bg-[#F8F2FC] px-3 py-1 text-xs text-[#76608E]"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    )}

                  {study.budget_range && (
                    <p className="mt-3 text-xs text-[#81758F]">
                      Budget range: {study.budget_range}
                    </p>
                  )}

                  {Array.isArray(study.photos) && study.photos.length > 2 && (
                    <p className="mt-2 text-xs text-[#81758F]">
                      +{study.photos.length - 2} more portfolio photos
                    </p>
                  )}
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
