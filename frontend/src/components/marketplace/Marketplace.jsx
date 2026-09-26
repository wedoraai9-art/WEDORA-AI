import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { apiMarketplace, apiVendorProfile, apiTrack, apiCreateLead, authAxios, fmtApiError } from '@/lib/auth';
import { toast } from 'sonner';
import { MapPin, Crown, ArrowLeft, MessageCircle, Instagram, Globe, X, Star, BadgeCheck } from 'lucide-react';

const CATEGORIES = ['All', 'Wedding Decor', 'Wedding Planner', 'Photographer', 'Videographer', 'Caterer', 'Florist', 'Makeup Artist', 'Mehendi Artist', 'DJ', 'Music/Band', 'Choreographer', 'Venue', 'Hotel', 'Resort', 'Farmhouse', 'Invitation Designer', 'Furniture/Rental', 'Bridal Wear', 'Groom Wear', 'Jewellery', 'Transportation', 'Other'];

export const fmtINR = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n) || 0);

export const VendorCard = ({ v }) => {
  const navigate = useNavigate();
  const cover = v.portfolio?.[0] || null;
  return (
    <div data-testid={`market-card-${v.slug}`} onClick={() => navigate(`/vendor/${v.slug}`)}
      className="pearl-card overflow-hidden cursor-pointer">
      <div className="relative h-40 bg-gradient-to-br from-[#C9B8FF]/30 to-[#F7B7D8]/30 overflow-hidden">
        {cover ? <img src={cover} alt={v.business_name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" /> : null}
        {v.plan_badge && (
          <span data-testid={`premium-badge-${v.slug}`} className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-semibold tracking-widest px-2.5 py-1 rounded-full bg-white/85 backdrop-blur border border-pink-200/80 text-[#2D2638]">
            <Crown className="w-3 h-3 text-[#F58D91]" /> PREMIUM VENDOR
          </span>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl overflow-hidden bg-white/80 border border-white/80 flex items-center justify-center shrink-0 -mt-9 relative z-10 shadow-sm">
            {v.logo ? <img src={v.logo} alt="" className="w-full h-full object-cover" /> : <span className="font-display text-lg text-[#988FA6]">{v.business_name?.[0]}</span>}
          </div>
          <div className="min-w-0">
            <h3 className="font-heading font-semibold text-[#2D2638] truncate">{v.business_name}</h3>
            <p className="text-xs text-[#6B617A] inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{v.city} · {v.category}</p>
          </div>
        </div>
        <p className="text-sm text-[#6B617A] mt-3 line-clamp-2">{v.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-medium text-[#2D2638]">{v.starting_price ? `from ${fmtINR(v.starting_price)}` : 'Price on request'}</span>
          <span className="chip !text-xs">View profile</span>
        </div>
      </div>
    </div>
  );
};

export const RequestQuoteModal = ({ vendor, onClose }) => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', wedding_date: '', city: '', guest_count: '', budget: '', functions: '', required_service: vendor.category, theme: '', message: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const inputCls = "mt-1 w-full rounded-2xl px-4 py-2.5 bg-white/80 border border-white/80 outline-none focus:border-pink-300 text-[#2D2638] text-sm";

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await apiCreateLead({ ...form, vendor_slug: vendor.slug, guest_count: form.guest_count ? Number(form.guest_count) : null });
      apiTrack(vendor.slug, 'contact_request').catch(() => {});
      toast.success('Your request has been sent! The vendor will reach out soon.');
      onClose(true);
    } catch (err) { toast.error(fmtApiError(err.response?.data?.detail, 'Could not send request')); }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#2D2638]/30 backdrop-blur-sm" data-testid="request-quote-modal" onClick={() => onClose(false)}>
      <div className="liquid-glass-strong rounded-[28px] w-full max-w-lg max-h-[85vh] overflow-y-auto chat-scroll p-6 md:p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="font-display text-2xl text-[#2D2638]">Request a Quote</h3>
            <p className="text-sm text-[#6B617A]">to {vendor.business_name}</p>
          </div>
          <button data-testid="quote-close-btn" onClick={() => onClose(false)} className="w-9 h-9 rounded-full bg-white/70 border border-white/80 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label><span className="text-xs uppercase tracking-widest text-[#988FA6]">Name *</span><input data-testid="quote-name" required className={inputCls} value={form.name} onChange={set('name')} /></label>
          <label><span className="text-xs uppercase tracking-widest text-[#988FA6]">Email *</span><input data-testid="quote-email" type="email" required className={inputCls} value={form.email} onChange={set('email')} /></label>
          <label><span className="text-xs uppercase tracking-widest text-[#988FA6]">Phone *</span><input data-testid="quote-phone" required className={inputCls} value={form.phone} onChange={set('phone')} /></label>
          <label><span className="text-xs uppercase tracking-widest text-[#988FA6]">Wedding Date</span><input data-testid="quote-date" type="date" className={inputCls} value={form.wedding_date} onChange={set('wedding_date')} /></label>
          <label><span className="text-xs uppercase tracking-widest text-[#988FA6]">City</span><input data-testid="quote-city" className={inputCls} value={form.city} onChange={set('city')} /></label>
          <label><span className="text-xs uppercase tracking-widest text-[#988FA6]">Guest Count</span><input data-testid="quote-guests" type="number" min="1" className={inputCls} value={form.guest_count} onChange={set('guest_count')} /></label>
          <label><span className="text-xs uppercase tracking-widest text-[#988FA6]">Budget</span><input data-testid="quote-budget" className={inputCls} placeholder="e.g. ₹15 lakh" value={form.budget} onChange={set('budget')} /></label>
          <label><span className="text-xs uppercase tracking-widest text-[#988FA6]">Wedding Functions</span><input data-testid="quote-functions" className={inputCls} placeholder="Haldi, Sangeet, Wedding…" value={form.functions} onChange={set('functions')} /></label>
          <label className="sm:col-span-2"><span className="text-xs uppercase tracking-widest text-[#988FA6]">Required Service</span><input data-testid="quote-service" className={inputCls} value={form.required_service} onChange={set('required_service')} /></label>
          <label className="sm:col-span-2"><span className="text-xs uppercase tracking-widest text-[#988FA6]">Theme / Style</span><input data-testid="quote-theme" className={inputCls} placeholder="Pastel luxury, royal, boho…" value={form.theme} onChange={set('theme')} /></label>
          <label className="sm:col-span-2"><span className="text-xs uppercase tracking-widest text-[#988FA6]">Message</span><textarea data-testid="quote-message" rows={3} className={inputCls + ' resize-none'} value={form.message} onChange={set('message')} /></label>
          <button data-testid="quote-submit" disabled={busy} className="glow-btn sm:col-span-2 disabled:opacity-60">{busy ? 'Sending…' : 'Send Request'}</button>
        </form>
      </div>
    </div>
  );
};

const Marketplace = () => {
  const [vendors, setVendors] = useState([]);
  const [category, setCategory] = useState('All');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const load = async () => {
    setLoading(true);
    setLoadError('');
    const params = {};
    if (category !== 'All') params.category = category;
    if (q.trim()) params.search = q.trim();
    try {
      const r = await apiMarketplace(params);
      setVendors(Array.isArray(r?.vendors) ? r.vendors : []);
    } catch (err) {
      setVendors([]);
      setLoadError(fmtApiError(
        err.response?.data?.detail,
        err.code === 'ECONNABORTED'
          ? 'The vendor list took too long to load. Please try again.'
          : 'Could not load vendors. Check your connection and try again.'
      ));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [category]);

  return (
    <div className="min-h-screen silky-bg pt-32 pb-20 px-4" data-testid="marketplace-page">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <p className="font-heading uppercase tracking-[0.3em] text-xs text-[#988FA6] mb-3">Marketplace</p>
          <h1 className="font-display text-4xl sm:text-5xl text-[#2D2638]">Find Wedding <span className="iridescent-text italic">Vendors.</span></h1>
          <p className="text-[#6B617A] mt-3 max-w-xl mx-auto">Browse real businesses listed on WEDORA. Click a profile to see their work and request a quote.</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          <input data-testid="market-search" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="Search vendors…" className="liquid-glass rounded-full px-5 py-2.5 text-sm outline-none text-[#2D2638] placeholder-[#988FA6] w-full sm:w-72" />
          <select data-testid="market-category-filter" value={category} onChange={(e) => setCategory(e.target.value)} className="chip !py-2.5">
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <button data-testid="market-search-btn" onClick={load} className="glow-btn !py-2.5 !px-5 !text-sm">Search</button>
        </div>

        {loading ? <div className="thinking-orb mx-auto" /> : loadError ? (
          <div className="text-center text-[#6B617A]" role="alert">
            <p>{loadError}</p>
            <button data-testid="market-retry-btn" onClick={load} className="chip mt-4">Try again</button>
          </div>
        ) : vendors.length === 0 ? (
          <p className="text-center text-[#6B617A]">No vendors found yet. Be the first — <a href="/for-vendors" className="underline decoration-pink-300">list your business</a>.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {vendors.map((v) => <VendorCard key={v.id} v={v} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export const VendorPublicProfile = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reviewToken = searchParams.get('review_token') || '';
  const [vendor, setVendor] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [reviewInvite, setReviewInvite] = useState(null);
  const [reviewInviteLoading, setReviewInviteLoading] = useState(false);
  const [reviewInviteError, setReviewInviteError] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await apiVendorProfile(slug);
        // The API currently returns the vendor document directly. Accept the
        // wrapped form too, so this profile works with either response shape.
        setVendor(r?.vendor || r || null);
        apiTrack(slug, 'profile_view').catch(() => {});
      }
      catch { setNotFound(true); }
    })();
  }, [slug]);

  useEffect(() => {
    if (!reviewToken) {
      setReviewInvite(null);
      setReviewInviteError('');
      setReviewSubmitted(false);
      return;
    }
    let cancelled = false;
    setReviewInviteLoading(true);
    setReviewInviteError('');
    authAxios.get('/marketplace/review-invitation', { params: { token: reviewToken } })
      .then((response) => {
        if (!cancelled) setReviewInvite(response.data || null);
      })
      .catch((error) => {
        if (!cancelled) {
          setReviewInvite(null);
          setReviewInviteError(error?.response?.data?.detail || 'This review link is invalid or has expired.');
        }
      })
      .finally(() => {
        if (!cancelled) setReviewInviteLoading(false);
      });
    return () => { cancelled = true; };
  }, [reviewToken]);

  const submitReview = async (event) => {
    event.preventDefault();
    if (!reviewToken || reviewSaving) return;
    setReviewSaving(true);
    try {
      await authAxios.post('/marketplace/reviews', {
        token: reviewToken,
        rating: reviewRating,
        review: reviewText.trim(),
      });
      setReviewSubmitted(true);
      const refreshed = await apiVendorProfile(slug).catch(() => null);
      if (refreshed) setVendor(refreshed?.vendor || refreshed);
    } catch (error) {
      toast.error(fmtApiError(error?.response?.data?.detail, 'Could not submit your review. Please try again.'));
    } finally {
      setReviewSaving(false);
    }
  };

  if (notFound) return (
    <div className="min-h-screen silky-bg pt-40 text-center text-[#6B617A]">
      <p className="font-display text-3xl text-[#2D2638] mb-2">Vendor not found</p>
      <button onClick={() => navigate('/marketplace')} className="chip mt-4">Back to marketplace</button>
    </div>
  );
  if (!vendor) return <div className="min-h-screen silky-bg pt-40"><div className="thinking-orb mx-auto" /></div>;

  const wa = (vendor.whatsapp || vendor.phone || '').replace(/[^0-9]/g, '');

  return (
    <div className="min-h-screen silky-bg pt-28 pb-20 px-4" data-testid="vendor-public-profile">
      <div className="max-w-4xl mx-auto">
        <button data-testid="profile-back-btn" onClick={() => navigate('/marketplace')} className="chip !text-xs inline-flex items-center gap-1.5 mb-6"><ArrowLeft className="w-3.5 h-3.5" /> Marketplace</button>

        <div className="pearl-card overflow-hidden">
          <div className="relative h-44 md:h-56 bg-gradient-to-br from-[#C9B8FF]/40 via-[#F7B7D8]/40 to-[#A9E8FF]/40 overflow-hidden">
            {(vendor.profile_background || vendor.portfolio?.[0]) && (
              <img
                src={vendor.profile_background || vendor.portfolio[0]}
                alt=""
                data-testid="profile-cover-image"
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-white/85 to-transparent" />
            {vendor.plan_badge && (
              <span data-testid="profile-premium-badge" className="absolute top-4 right-4 inline-flex items-center gap-1 text-[10px] font-semibold tracking-widest px-3 py-1.5 rounded-full bg-white/90 backdrop-blur border border-pink-200/80 text-[#2D2638]">
                <Crown className="w-3.5 h-3.5 text-[#F58D91]" /> PREMIUM VENDOR
              </span>
            )}
          </div>
          <div className="p-6 md:p-8 -mt-14 relative">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex items-end gap-4">
                <div className="w-20 h-20 rounded-3xl overflow-hidden bg-white border border-white/80 shadow-md flex items-center justify-center">
                  {vendor.logo ? <img src={vendor.logo} alt="" className="w-full h-full object-cover" /> : <span className="font-display text-3xl text-[#988FA6]">{vendor.business_name?.[0]}</span>}
                </div>
                <div>
                  <h1 className="font-display text-3xl md:text-4xl text-[#2D2638]" data-testid="profile-business-name">{vendor.business_name}</h1>
                  <p className="text-sm text-[#6B617A] mt-1 inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{vendor.city} · {vendor.category}{vendor.years_experience ? ` · ${vendor.years_experience} yrs experience` : ''}</p>
                </div>
              </div>
              <p className="font-heading font-semibold text-[#2D2638]" data-testid="profile-price">{vendor.starting_price ? `from ${fmtINR(vendor.starting_price)}` : 'Price on request'}</p>
            </div>

            {vendor.description && <p className="mt-6 text-[#4a4257] leading-relaxed whitespace-pre-wrap" data-testid="profile-description">{vendor.description}</p>}

            {vendor.services?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {vendor.services.map((s) => <span key={s} className="chip !text-xs">{s}</span>)}
              </div>
            )}

            <div className="mt-7 flex flex-wrap gap-3">
              <button data-testid="profile-request-quote" onClick={() => setShowQuote(true)} className="glow-btn !py-3 !px-7">Request Quote</button>
              {wa && (
                <a data-testid="profile-whatsapp-btn" href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hi ${vendor.business_name}, I found you on WEDORA and would love to discuss my wedding.`)}`}
                  target="_blank" rel="noreferrer" onClick={() => apiTrack(slug, 'whatsapp_click')}
                  className="chip !py-3 !px-6 inline-flex items-center gap-2"><MessageCircle className="w-4 h-4" /> WhatsApp</a>
              )}
              {vendor.phone && <a data-testid="profile-call-btn" href={`tel:${vendor.phone}`} className="chip !py-3 !px-6">Call</a>}
              {vendor.instagram && <a href={`https://instagram.com/${vendor.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="chip !py-3 !px-4"><Instagram className="w-4 h-4" /></a>}
              {vendor.website && <a href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`} target="_blank" rel="noreferrer" className="chip !py-3 !px-4"><Globe className="w-4 h-4" /></a>}
            </div>
          </div>
        </div>

        {reviewToken && (
          <section className="pearl-card mt-8 p-6 md:p-8" data-testid="verified-review-form">
            {reviewInviteLoading ? (
              <p className="text-sm text-[#6B617A]">Loading your review request…</p>
            ) : reviewInviteError ? (
              <div role="alert">
                <h2 className="font-heading font-semibold text-xl text-[#2D2638]">Review link unavailable</h2>
                <p className="mt-2 text-sm text-[#6B617A]">{reviewInviteError}</p>
              </div>
            ) : reviewSubmitted ? (
              <div role="status">
                <h2 className="font-heading font-semibold text-xl text-[#2D2638]">Thank you for your review!</h2>
                <p className="mt-2 text-sm text-[#6B617A]">Your verified review has been added to this vendor’s profile.</p>
              </div>
            ) : reviewInvite ? (
              <>
                <p className="font-heading uppercase tracking-[0.2em] text-xs text-[#988FA6] mb-2">Verified wedding review</p>
                <h2 className="font-display text-2xl text-[#2D2638]">How was your experience?</h2>
                <p className="mt-2 text-sm text-[#6B617A]">
                  Hi {reviewInvite.client_name}, share your experience with {reviewInvite.vendor_name} for {reviewInvite.wedding_name}.
                </p>
                <form onSubmit={submitReview} className="mt-5 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-[#4a4257] mb-2">Your rating</p>
                    <div className="flex gap-1" role="radiogroup" aria-label="Rating from 1 to 5 stars">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          role="radio"
                          aria-checked={reviewRating === rating}
                          aria-label={`${rating} star${rating === 1 ? '' : 's'}`}
                          onClick={() => setReviewRating(rating)}
                          className="rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-pink-300"
                        >
                          <Star className={`w-7 h-7 ${rating <= reviewRating ? 'fill-[#F4B942] text-[#F4B942]' : 'text-[#c9bfd1]'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="block">
                    <span className="text-sm font-medium text-[#4a4257]">Your review</span>
                    <textarea
                      required
                      minLength={10}
                      maxLength={1200}
                      rows={4}
                      value={reviewText}
                      onChange={(event) => setReviewText(event.target.value)}
                      placeholder="Tell others what you appreciated about working with this vendor…"
                      className="mt-2 w-full rounded-2xl px-4 py-3 bg-white/80 border border-white/80 outline-none focus:border-pink-300 text-[#2D2638] text-sm resize-y"
                    />
                    <span className="mt-1 block text-xs text-[#988FA6]">10 to 1,200 characters</span>
                  </label>
                  <button type="submit" disabled={reviewSaving || reviewText.trim().length < 10} className="glow-btn disabled:opacity-60">
                    {reviewSaving ? 'Sending…' : 'Submit review'}
                  </button>
                </form>
              </>
            ) : null}
          </section>
        )}

        {(Number(vendor.review_count) > 0 || Number(vendor.verified_wedding_count) > 0) && (
          <section className="pearl-card mt-8 p-6 md:p-8" data-testid="vendor-reviews">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="font-heading font-semibold text-xl text-[#2D2638]">Client reviews</h2>
                <p className="mt-1 text-sm text-[#6B617A]">Reviews are submitted through a link sent to a linked wedding client.</p>
              </div>
              {Number(vendor.verified_wedding_count) > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4eafa] px-3 py-1.5 text-xs text-[#76588f]">
                  <BadgeCheck className="w-4 h-4" /> {vendor.verified_wedding_count} verified wedding{Number(vendor.verified_wedding_count) === 1 ? '' : 's'}
                </span>
              )}
            </div>
            {Number(vendor.review_count) > 0 && (
              <p className="mb-4 inline-flex items-center gap-2 text-sm text-[#4a4257]">
                <Star className="w-4 h-4 fill-[#F4B942] text-[#F4B942]" />
                <strong>{Number(vendor.average_rating || 0).toFixed(1)}</strong>
                <span className="text-[#6B617A]">· {vendor.review_count} review{Number(vendor.review_count) === 1 ? '' : 's'}</span>
              </p>
            )}
            <div className="space-y-3">
              {(vendor.reviews || []).map((review) => (
                <article key={review.id} className="rounded-2xl border border-white/80 bg-white/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-[#2D2638]">{review.reviewer_name}</p>
                      <p className="text-xs text-[#988FA6]">{review.wedding_name}</p>
                    </div>
                    <div className="flex items-center gap-1" aria-label={`${review.rating} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((rating) => <Star key={rating} className={`w-4 h-4 ${rating <= Number(review.rating) ? 'fill-[#F4B942] text-[#F4B942]' : 'text-[#c9bfd1]'}`} />)}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[#4a4257] whitespace-pre-wrap">{review.review}</p>
                  {review.verified && <p className="mt-3 inline-flex items-center gap-1 text-xs text-[#76588f]"><BadgeCheck className="w-3.5 h-3.5" /> Verified wedding</p>}
                </article>
              ))}
            </div>
          </section>
        )}

        {vendor.portfolio?.length > 0 && (
          <div className="mt-8" onClick={() => apiTrack(slug, 'portfolio_view')}>
            <h2 className="font-heading font-semibold text-xl text-[#2D2638] mb-4">Portfolio</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {vendor.portfolio.map((url, i) => (
                <div key={i} data-testid={`profile-portfolio-${i}`} className="aspect-square rounded-3xl overflow-hidden border border-white/70">
                  <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showQuote && <RequestQuoteModal vendor={vendor} onClose={() => setShowQuote(false)} />}
    </div>
  );
};

export default Marketplace;
