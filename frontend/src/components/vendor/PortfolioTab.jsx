
import React, { useRef, useState } from 'react';
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
import { Upload, Trash2, Lock } from 'lucide-react';

export const PortfolioTab = ({ vendor, planDetails, onSaved }) => {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState(null);

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

  return (
    <div
      className="pearl-card p-6 md:p-8"
      data-testid="portfolio-tab"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-heading text-lg font-semibold text-[#2D2638]">
            Portfolio
          </h3>

          <p className="text-sm text-[#6B617A]">
            {portfolio.length} / {limitLabel} photos on{' '}
            {planDetails?.label || 'Free'} plan
          </p>

          {/* Portfolio upload requirements */}
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
    </div>
  );
};

export default PortfolioTab;
