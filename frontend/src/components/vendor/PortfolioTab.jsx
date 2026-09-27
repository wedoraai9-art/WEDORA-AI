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
import { Upload, Trash2, Lock, Plus, Pencil, BookOpen, X, MapPin, CalendarDays, ImagePlus, Check } from 'lucide-react';

const EMPTY_FORM = {
  title: '', event_type: 'Wedding', location: '', event_date: '',
  description: '', servicesText: '', budget_range: '', photos: [],
};
const inputClass = 'w-full rounded-xl border border-[#E7DDF6] bg-white/80 px-3 py-2.5 text-sm text-[#30283B] placeholder:text-[#A69BB5] outline-none transition focus:border-[#BFA4F4] focus:ring-2 focus:ring-[#E9DDFB]';
const labelClass = 'mb-1.5 block text-xs font-medium text-[#6B617A]';

export const PortfolioTab = ({ vendor, planDetails, onSaved }) => {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState(null);
  const [caseStudies, setCaseStudies] = useState(Array.isArray(vendor?.portfolio_case_studies) ? vendor.portfolio_case_studies : []);
  const [loadingStudies, setLoadingStudies] = useState(false);
  const [savingStudy, setSavingStudy] = useState(false);
  const [deletingStudyId, setDeletingStudyId] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const portfolio = Array.isArray(vendor?.portfolio) ? vendor.portfolio : [];
  const limit = Number(planDetails?.photo_limit ?? 5);
  const hasUnlimitedPhotos = limit > 1000;
  const limitLabel = hasUnlimitedPhotos ? '∞' : limit;
  const atLimit = !hasUnlimitedPhotos && portfolio.length >= limit;
  const limitMessage = `Your ${planDetails?.label || 'current'} plan includes up to ${limitLabel} portfolio photos. Upgrade your plan to expand your portfolio.`;

  useEffect(() => {
    setCaseStudies(Array.isArray(vendor?.portfolio_case_studies) ? vendor.portfolio_case_studies : []);
  }, [vendor?.portfolio_case_studies]);

  useEffect(() => {
    let active = true;
    setLoadingStudies(true);
    apiGetPortfolioCaseStudies()
      .then((response) => { if (active) setCaseStudies(Array.isArray(response?.case_studies) ? response.case_studies : []); })
      .catch((err) => { if (active) toast.error(fmtApiError(err?.response?.data?.detail, 'Could not load case studies.')); })
      .finally(() => { if (active) setLoadingStudies(false); });
    return () => { active = false; };
  }, []);

  const refreshAfterChange = async (updatedVendor) => {
    if (updatedVendor) {
      setCaseStudies(Array.isArray(updatedVendor.portfolio_case_studies) ? updatedVendor.portfolio_case_studies : caseStudies);
      if (onSaved) await onSaved(updatedVendor);
    } else if (onSaved) {
      await onSaved();
    }
  };

  const openSubscription = () => window.dispatchEvent(new CustomEvent('wedora:goto-tab', { detail: 'subscription' }));

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (atLimit) { toast.error(limitMessage); openSubscription(); return; }
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error('Portfolio images must be 8 MB or smaller.'); return; }
    setBusy(true);
    try {
      const response = await apiUploadPortfolio(file);
      toast.success('Photo added to portfolio');
      await refreshAfterChange(response?.vendor);
    } catch (err) {
      const detail = err?.response?.data?.detail || '';
      if (String(detail).startsWith('PHOTO_LIMIT') || (err?.response?.status === 403 && /portfolio limit/i.test(String(detail)))) {
        toast.error(limitMessage); openSubscription();
      } else toast.error(fmtApiError(detail, 'Upload failed. Please try again.'));
    } finally { setBusy(false); }
  };

  const remove = async (url) => {
    if (!url || busy || deletingUrl) return;
    if (!window.confirm('Remove this photo from your portfolio?')) return;
    setDeletingUrl(url);
    try {
      const response = await apiDeletePortfolio(url);
      toast.success('Photo removed from portfolio');
      setForm((current) => ({ ...current, photos: current.photos.filter((photo) => photo !== url) }));
      await refreshAfterChange(response?.vendor);
    } catch (err) { toast.error(fmtApiError(err?.response?.data?.detail, 'Could not remove this photo. Please try again.')); }
    finally { setDeletingUrl(null); }
  };

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const startCreate = () => { setEditingId(null); setForm({ ...EMPTY_FORM }); setShowEditor(true); };
  const startEdit = (study) => {
    setEditingId(study.id);
    setForm({ ...EMPTY_FORM, ...study, servicesText: Array.isArray(study.services) ? study.services.join(', ') : '' });
    setShowEditor(true);
  };
  const closeEditor = () => { if (!savingStudy) { setShowEditor(false); setEditingId(null); setForm({ ...EMPTY_FORM }); } };

  const saveCaseStudy = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Please enter a case-study title.'); return; }
    const payload = {
      title: form.title.trim(), event_type: form.event_type || 'Wedding',
      location: form.location.trim(), event_date: form.event_date,
      description: form.description.trim(),
      services: form.servicesText.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 20),
      budget_range: form.budget_range.trim(), photos: form.photos.filter((photo) => portfolio.includes(photo)),
    };
    setSavingStudy(true);
    try {
      const response = editingId
        ? await apiUpdatePortfolioCaseStudy(editingId, payload)
        : await apiCreatePortfolioCaseStudy(payload);
      setCaseStudies(Array.isArray(response?.case_studies) ? response.case_studies : (current) => current);
      await refreshAfterChange(response?.vendor);
      toast.success(editingId ? 'Case study updated' : 'Case study saved to your portfolio');
      setShowEditor(false); setEditingId(null); setForm({ ...EMPTY_FORM });
    } catch (err) { toast.error(fmtApiError(err?.response?.data?.detail, 'Could not save this case study. Please try again.')); }
    finally { setSavingStudy(false); }
  };

  const removeCaseStudy = async (study) => {
    if (!study?.id || savingStudy || deletingStudyId) return;
    if (!window.confirm(`Delete the case study “${study.title}”?`)) return;
    setDeletingStudyId(study.id);
    try {
      const response = await apiDeletePortfolioCaseStudy(study.id);
      setCaseStudies(Array.isArray(response?.case_studies) ? response.case_studies : []);
      await refreshAfterChange(response?.vendor);
      toast.success('Case study deleted');
    } catch (err) { toast.error(fmtApiError(err?.response?.data?.detail, 'Could not delete this case study.')); }
    finally { setDeletingStudyId(null); }
  };

  return (
    <div className="pearl-card p-6 md:p-8" data-testid="portfolio-tab">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-heading font-semibold text-lg text-[#2D2638]">Portfolio</h3>
          <p className="text-sm text-[#6B617A]">{portfolio.length} / {limitLabel} photos on {planDetails?.label || 'Free'} plan</p>
        </div>
        <button type="button" data-testid="portfolio-upload-btn" onClick={() => { if (atLimit) { toast.error(limitMessage); openSubscription(); return; } fileRef.current?.click(); }} disabled={busy || Boolean(deletingUrl)} className="glow-btn !py-2 !px-5 !text-sm inline-flex items-center gap-2 disabled:opacity-60">
          <Upload className="w-4 h-4" />{busy ? 'Uploading…' : 'Add photo'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
      </div>

      {portfolio.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#C9B8FF]/60 bg-white/50 p-10 text-center text-[#6B617A]"><Lock className="mx-auto mb-3 h-6 w-6 text-[#C9B8FF]" /><p>Your portfolio is empty. Add your first photo — couples love seeing real work.</p></div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {portfolio.map((url, i) => <div key={`${url}-${i}`} data-testid={`portfolio-image-${i}`} className="group relative aspect-square overflow-hidden rounded-2xl border border-white/70 bg-white/60 shadow-sm">
            <img src={url} alt={`Portfolio ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
            <button type="button" data-testid={`portfolio-delete-${i}`} onClick={() => remove(url)} disabled={busy || Boolean(deletingUrl)} aria-label={`Remove portfolio photo ${i + 1}`} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/80 bg-white/90 text-red-400 opacity-0 shadow-sm backdrop-blur transition duration-200 hover:scale-105 hover:bg-rose-50 group-hover:opacity-100 disabled:opacity-50"><Trash2 className={`h-4 w-4 ${deletingUrl === url ? 'animate-pulse' : ''}`} /></button>
          </div>)}
        </div>
      )}

      <div className="mt-9 border-t border-[#E9E0F5] pt-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div><div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-[#9B7ACB]" /><h3 className="font-heading text-lg font-semibold text-[#2D2638]">Portfolio Case Studies</h3></div><p className="mt-1 text-sm text-[#6B617A]">Showcase event stories, design details and selected portfolio photos.</p></div>
          <button type="button" onClick={startCreate} className="glow-btn inline-flex items-center gap-2 !px-4 !py-2 !text-sm"><Plus className="h-4 w-4" /> Add case study</button>
        </div>

        {loadingStudies ? <div className="rounded-2xl bg-white/60 p-6 text-center text-sm text-[#81758F]">Loading case studies…</div> : caseStudies.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#C9B8FF]/60 bg-white/50 p-8 text-center"><BookOpen className="mx-auto mb-3 h-6 w-6 text-[#BBA6E6]" /><p className="font-medium text-[#4A4058]">No case studies yet</p><p className="mt-1 text-sm text-[#81758F]">Create your first event story to give couples a better view of your work.</p><button type="button" onClick={startCreate} className="glow-btn mt-4 inline-flex items-center gap-2 !px-4 !py-2 !text-sm"><Plus className="h-4 w-4" /> Create case study</button></div>
        ) : <div className="grid gap-4 md:grid-cols-2">{caseStudies.map((study) => <article key={study.id} className="overflow-hidden rounded-3xl border border-[#E9E0F5] bg-white/75 shadow-sm">
          {study.photos?.length > 0 && <div className="grid h-36 grid-cols-3 gap-1 overflow-hidden bg-[#F6F1FC]">{study.photos.slice(0, 3).map((photo, index) => <img key={`${study.id}-photo-${index}`} src={photo} alt={`${study.title} ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />)}</div>}
          <div className="p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><span className="rounded-full bg-[#F1EAFB] px-2.5 py-1 text-[11px] font-medium text-[#8062A9]">{study.event_type || 'Event'}</span><h4 className="mt-2 break-words font-heading text-base font-semibold text-[#2D2638]">{study.title}</h4></div><div className="flex shrink-0 gap-1"><button type="button" onClick={() => startEdit(study)} aria-label={`Edit ${study.title}`} className="rounded-full bg-[#F2EAFB] p-2 text-[#8969B2] transition hover:bg-[#E8DDF8]"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => removeCaseStudy(study)} disabled={Boolean(deletingStudyId)} aria-label={`Delete ${study.title}`} className="rounded-full bg-rose-50 p-2 text-rose-400 transition hover:bg-rose-100 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button></div></div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#81758F]">{study.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{study.location}</span>}{study.event_date && <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{study.event_date}</span>}{study.budget_range && <span>{study.budget_range}</span>}</div>
            {study.description && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#62586F]">{study.description}</p>}
            {study.services?.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{study.services.map((service, index) => <span key={`${study.id}-service-${index}`} className="rounded-full border border-[#E9E0F5] bg-[#FAF7FE] px-2.5 py-1 text-[11px] text-[#76658B]">{service}</span>)}</div>}
          </div>
        </article>)}</div>}
      </div>

      {showEditor && <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#21182F]/45 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Portfolio case study editor">
        <form onSubmit={saveCaseStudy} className="my-auto max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/70 bg-[#FFFDFF] p-5 shadow-2xl md:p-7">
          <div className="mb-5 flex items-start justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-[0.16em] text-[#A18CB9]">WEDORA Portfolio</p><h3 className="mt-1 font-heading text-xl font-semibold text-[#2D2638]">{editingId ? 'Edit case study' : 'Create case study'}</h3><p className="mt-1 text-sm text-[#81758F]">Add a concise story about this event and your work.</p></div><button type="button" onClick={closeEditor} className="rounded-full p-2 text-[#81758F] transition hover:bg-[#F2EAFB]" aria-label="Close editor"><X className="h-5 w-5" /></button></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className={labelClass}>Case-study title *</span><input required maxLength={120} className={inputClass} placeholder="e.g. Blush Garden Wedding" value={form.title} onChange={(e) => updateForm('title', e.target.value)} /></label>
            <label><span className={labelClass}>Event type</span><select className={inputClass} value={form.event_type} onChange={(e) => updateForm('event_type', e.target.value)}>{['Wedding','Engagement','Reception','Mehendi','Sangeet','Birthday','Baby Shower','Other'].map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span className={labelClass}>Location</span><input maxLength={120} className={inputClass} placeholder="City or venue" value={form.location} onChange={(e) => updateForm('location', e.target.value)} /></label>
            <label><span className={labelClass}>Event date</span><input type="date" className={inputClass} value={form.event_date} onChange={(e) => updateForm('event_date', e.target.value)} /></label>
            <label><span className={labelClass}>Budget range (optional)</span><input maxLength={80} className={inputClass} placeholder="e.g. ₹5–8 lakh" value={form.budget_range} onChange={(e) => updateForm('budget_range', e.target.value)} /></label>
            <label className="sm:col-span-2"><span className={labelClass}>Design story / description</span><textarea maxLength={2000} rows={4} className={inputClass} placeholder="Describe the concept, client vision, styling and execution…" value={form.description} onChange={(e) => updateForm('description', e.target.value)} /></label>
            <label className="sm:col-span-2"><span className={labelClass}>Services provided (comma-separated)</span><input maxLength={500} className={inputClass} placeholder="Wedding design, floral styling, stage decor" value={form.servicesText} onChange={(e) => updateForm('servicesText', e.target.value)} /></label>
          </div>
          <div className="mt-5 rounded-2xl border border-[#E9E0F5] bg-[#FBF8FF] p-4"><div className="mb-3 flex items-center gap-2"><ImagePlus className="h-4 w-4 text-[#9B7ACB]" /><p className="text-sm font-medium text-[#4A4058]">Select photos from your existing portfolio</p></div>{portfolio.length === 0 ? <p className="text-xs text-[#81758F]">Upload portfolio photos first to attach them to this case study.</p> : <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{portfolio.map((url, index) => { const checked = form.photos.includes(url); return <button key={`${url}-${index}`} type="button" onClick={() => updateForm('photos', checked ? form.photos.filter((photo) => photo !== url) : [...form.photos, url])} className={`relative aspect-square overflow-hidden rounded-xl border-2 transition ${checked ? 'border-[#A884D8] ring-2 ring-[#E6D8FA]' : 'border-transparent hover:border-[#D8C7F0]'}`} aria-pressed={checked} aria-label={`${checked ? 'Deselect' : 'Select'} portfolio photo ${index + 1}`}><img src={url} alt={`Portfolio selection ${index + 1}`} className="h-full w-full object-cover" />{checked && <span className="absolute right-1.5 top-1.5 rounded-full bg-[#9872C4] p-1 text-white"><Check className="h-3 w-3" /></span>}</button>; })}</div>}</div>
          <div className="mt-6 flex flex-wrap justify-end gap-2"><button type="button" onClick={closeEditor} disabled={savingStudy} className="rounded-xl border border-[#E9E0F5] bg-white px-4 py-2.5 text-sm text-[#766B83] transition hover:bg-[#F8F4FC] disabled:opacity-50">Cancel</button><button type="submit" disabled={savingStudy} className="glow-btn inline-flex items-center gap-2 !px-5 !py-2.5 !text-sm disabled:opacity-60">{savingStudy ? 'Saving…' : <><Check className="h-4 w-4" />{editingId ? 'Save changes' : 'Save case study'}</>}</button></div>
        </form>
      </div>}
    </div>
  );
};

export default PortfolioTab;
