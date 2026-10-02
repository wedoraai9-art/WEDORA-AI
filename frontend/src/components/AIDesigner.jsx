
import React, { useState, useRef } from 'react';
import { DESIGNER } from '@/constants/testIds';
import { generateDesign } from '@/lib/aiService';
import {
  Wand2,
  Palette,
  Sparkles,
  Download,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';

const CATS = [
  { key: 'theme', label: 'Theme' },
  { key: 'palette', label: 'Colour Palette' },
  { key: 'mandap', label: 'Mandap' },
  { key: 'stage', label: 'Stage' },
  { key: 'entrance', label: 'Entrance' },
  { key: 'table_decor', label: 'Table Décor' },
  { key: 'lighting', label: 'Lighting' },
  { key: 'florals', label: 'Florals' },
];

const getImageUrl = (image) => {
  if (typeof image === 'string') return image;
  if (image && typeof image === 'object') {
    return image.url || image.src || image.image_url || '';
  }
  return '';
};

const getImageSource = (image) => {
  if (image && typeof image === 'object') {
    return image.source || image.provider || image.platform || '';
  }
  return '';
};

const getImageLink = (image) => {
  if (image && typeof image === 'object') {
    return image.link || image.source_url || image.page_url || '';
  }
  return '';
};

export const AIDesigner = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [failedImages, setFailedImages] = useState({});
  const moodboardRef = useRef(null);

  const referenceImages = Array.isArray(result?.reference_images)
    ? result.reference_images
        .map((image, index) => ({
          image,
          url: getImageUrl(image),
          source: getImageSource(image),
          link: getImageLink(image),
          key: `${index}-${getImageUrl(image)}`,
        }))
        .filter((item) => item.url)
    : [];

  const onGenerate = async () => {
    if (!input.trim()) {
      toast.error('Please describe your dream wedding first.');
      return;
    }

    setLoading(true);
    setResult(null);
    setFailedImages({});

    try {
      const response = await generateDesign(input);

      if (!response || response._error) {
        throw new Error(response?._error || 'No design was returned.');
      }

      setResult(response);

      if (!Array.isArray(response.reference_images) ||
          response.reference_images.length === 0) {
        toast.warning(
          'Design generated, but no reference images were returned.'
        );
      } else {
        toast.success('Your wedding design and reference images are ready!');
      }
    } catch (error) {
      setResult({ _error: error?.message || 'Design generation failed.' });
      toast.error(error?.message || 'Could not generate your design.');
    } finally {
      setLoading(false);
    }
  };

  const onExport = async () => {
    if (!moodboardRef.current || !result || result._error) return;

    setExporting(true);

    try {
      const dataUrl = await toPng(moodboardRef.current, {
        pixelRatio: 2,
        backgroundColor: '#FAF8F6',
        cacheBust: true,
      });

      const anchor = document.createElement('a');
      anchor.download = `wedora-moodboard-${(
        result.theme || 'design'
      )
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')}.png`;
      anchor.href = dataUrl;
      anchor.click();

      toast.success('Moodboard downloaded — ready for your Instagram Story');
    } catch (error) {
      toast.error('Could not export moodboard. Try again.');
    } finally {
      setExporting(false);
    }
  };

  const markImageFailed = (key) => {
    setFailedImages((previous) => ({ ...previous, [key]: true }));
  };

  return (
    <section
      id="designer"
      data-testid={DESIGNER.section}
      className="relative py-24 px-4"
    >
      <div className="max-w-6xl mx-auto text-center mb-10">
        <p className="font-heading uppercase tracking-[0.3em] text-xs text-[#988FA6] mb-4">
          AI Wedding Designer
        </p>

        <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-[#2D2638] leading-tight">
          Imagine It.
          <br />
          <span className="iridescent-text italic">
            WEDORA Designs It.
          </span>
        </h2>

        <p className="mt-5 max-w-2xl mx-auto text-[#6B617A]">
          Describe your dream wedding and let WEDORA turn your imagination
          into a complete design direction.
        </p>
      </div>

      <div className="max-w-3xl mx-auto liquid-glass-strong rounded-3xl p-4 md:p-5 gradient-border">
        <div className="flex items-start gap-3">
          <Wand2 className="w-5 h-5 text-[#C9B8FF] mt-3 shrink-0" />

          <textarea
            data-testid={DESIGNER.input}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={3}
            placeholder="Describe your dream wedding..."
            className="flex-1 bg-transparent outline-none text-[#2D2638] placeholder-[#988FA6] resize-none py-2 leading-relaxed"
          />
        </div>

        <div className="flex justify-end mt-3">
          <button
            data-testid={DESIGNER.generateBtn}
            onClick={onGenerate}
            disabled={loading || !input.trim()}
            className="glow-btn flex items-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="thinking-orb !w-4 !h-4" />
                Designing…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate design
              </>
            )}
          </button>
        </div>
      </div>

      {result?._error && (
        <div
          role="alert"
          className="max-w-3xl mx-auto mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p className="font-semibold">Design generation failed</p>
          <p className="mt-1 break-words">{result._error}</p>
        </div>
      )}

      {result && !result._error && (
        <div data-testid={DESIGNER.result} className="max-w-6xl mx-auto mt-10">
          <div className="flex justify-end mb-4">
            <button
              data-testid="moodboard-export-btn"
              onClick={onExport}
              disabled={exporting}
              className="glow-btn !py-2.5 !px-6 !text-sm inline-flex items-center gap-2 disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              {exporting
                ? 'Painting your moodboard…'
                : 'Download Moodboard (Story-ready)'}
            </button>
          </div>

          {result.hero_image && (
            <div className="mb-8 overflow-hidden rounded-3xl border border-[#eadff5] bg-white shadow-xl">
              <div className="relative">
                <img
                  src={result.hero_image}
                  alt={result.theme || 'WEDORA AI Wedding Design'}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                  className="w-full aspect-video object-cover"
                />

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6">
                  <p className="text-xs uppercase tracking-[0.25em] text-white/80">
                    WEDORA AI • Wedding Design Inspiration
                  </p>

                  <h2 className="mt-2 text-2xl md:text-4xl font-semibold text-white">
                    {result.theme || 'Your Wedding Vision'}
                  </h2>
                </div>
              </div>
            </div>
          )}

          {referenceImages.length > 0 && (
            <section
              aria-label="Wedding reference images"
              className="mb-10"
              data-testid="designer-reference-gallery"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F2E9FF]">
                  <ImageIcon className="w-5 h-5 text-[#9274C8]" />
                </div>

                <div>
                  <h3 className="font-display text-2xl text-[#2D2638]">
                    Wedding Reference Gallery
                  </h3>
                  <p className="text-sm text-[#81768F]">
                    Visual inspiration related to your design
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {referenceImages.map((item, index) => (
                  <article
                    key={item.key}
                    className="overflow-hidden rounded-3xl border border-[#eadff5] bg-white shadow-sm"
                  >
                    {failedImages[item.key] ? (
                      <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 bg-[#F7F2FA] p-5 text-center text-[#81768F]">
                        <ImageIcon className="h-8 w-8 opacity-60" />
                        <p className="text-sm">
                          This reference image could not be loaded.
                        </p>
                      </div>
                    ) : (
                      <img
                        src={item.url}
                        alt={`Wedding inspiration ${index + 1}`}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={() => markImageFailed(item.key)}
                        className="aspect-[4/3] w-full object-cover"
                      />
                    )}

                    <div className="flex items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#4a4257]">
                          Reference {index + 1}
                        </p>
                        <p className="mt-1 truncate text-xs text-[#988FA6]">
                          {item.source || 'Design inspiration'}
                        </p>
                      </div>

                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Open reference ${index + 1} source`}
                          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#eadff5] px-3 py-2 text-xs text-[#6B617A] hover:bg-[#F8F3FC]"
                        >
                          Source
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {referenceImages.length === 0 && (
            <div
              data-testid="designer-no-references"
              className="mb-10 rounded-3xl border border-dashed border-[#DCCDEB] bg-white/60 p-8 text-center"
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2E9FF]">
                <ImageIcon className="h-6 w-6 text-[#9274C8]" />
              </div>

              <h3 className="font-display text-xl text-[#2D2638]">
                Your design is ready
              </h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-[#81768F]">
                No reference images were returned for this design. The written
                design details are available below. Check the image provider
                configuration to enable visual references.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {CATS.map((category) => {
              const value = result[category.key];

              return (
                <div
                  key={category.key}
                  className="pearl-card overflow-hidden"
                >
                  {category.key === 'palette' ? (
                    <div className="p-5">
                      <p className="text-xs uppercase tracking-widest text-[#988FA6] mb-3 flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5" />
                        Colour Palette
                      </p>

                      <div className="flex gap-2">
                        {(Array.isArray(value)
                          ? value
                          : [
                              '#C9B8FF',
                              '#F7B7D8',
                              '#A9E8FF',
                              '#F5A9B8',
                              '#FFF8EF',
                            ]
                        )
                          .slice(0, 5)
                          .map((hex, index) => (
                            <div
                              key={index}
                              title={hex}
                              className="flex-1 aspect-square rounded-2xl border border-white/80 shadow-inner"
                              style={{ background: hex }}
                            />
                          ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-5">
                      <p className="text-xs uppercase tracking-widest text-[#988FA6] mb-1.5">
                        {category.label}
                      </p>

                      <p className="text-sm text-[#4a4257] leading-relaxed">
                        {typeof value === 'string'
                          ? value
                          : category.key === 'theme'
                            ? result.theme || '—'
                            : '—'}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hidden moodboard canvas — 1080×1920 Instagram Story export */}
      {result && !result._error && (
        <div
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        >
          <div
            ref={moodboardRef}
            style={{
              width: 540,
              height: 960,
              padding: 40,
              position: 'relative',
              overflow: 'hidden',
              background:
                'linear-gradient(160deg, #FDFBF7 0%, #F7E4F1 35%, #E4DCF9 70%, #DFF3FA 100%)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: '#2D2638',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -80,
                right: -80,
                width: 260,
                height: 260,
                borderRadius: 9999,
                background:
                  'radial-gradient(circle, #F7B7D8, transparent 70%)',
                opacity: 0.55,
                filter: 'blur(20px)',
              }}
            />

            <div
              style={{
                position: 'absolute',
                bottom: -60,
                left: -60,
                width: 240,
                height: 240,
                borderRadius: 9999,
                background:
                  'radial-gradient(circle, #A9E8FF, transparent 70%)',
                opacity: 0.55,
                filter: 'blur(20px)',
              }}
            />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <p
                style={{
                  fontSize: 11,
                  letterSpacing: 6,
                  textTransform: 'uppercase',
                  color: '#988FA6',
                }}
              >
                WEDORA · AI Wedding Designer
              </p>

              <p
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 44,
                  fontStyle: 'italic',
                  lineHeight: 1.1,
                  marginTop: 14,
                  background:
                    'linear-gradient(120deg,#C9B8FF,#F58D91,#A9E8FF)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                {result.theme || 'Your Dream Wedding'}
              </p>

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                {(Array.isArray(result.palette) ? result.palette : [])
                  .slice(0, 5)
                  .map((hex, index) => (
                    <div
                      key={index}
                      style={{
                        flex: 1,
                        height: 64,
                        borderRadius: 18,
                        background: hex,
                        border: '2px solid rgba(255,255,255,0.8)',
                      }}
                    />
                  ))}
              </div>

              <div
                style={{
                  marginTop: 26,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                {[
                  ['Mandap', result.mandap],
                  ['Stage', result.stage],
                  ['Entrance', result.entrance],
                  ['Table Décor', result.table_decor],
                  ['Lighting', result.lighting],
                  ['Florals', result.florals],
                ].map(([label, value]) =>
                  value ? (
                    <div
                      key={label}
                      style={{
                        background: 'rgba(255,255,255,0.65)',
                        border: '1px solid rgba(255,255,255,0.85)',
                        borderRadius: 18,
                        padding: '12px 16px',
                      }}
                    >
                      <p
                        style={{
                          fontSize: 10,
                          letterSpacing: 3,
                          textTransform: 'uppercase',
                          color: '#988FA6',
                        }}
                      >
                        {label}
                      </p>
                      <p
                        style={{
                          fontSize: 14,
                          lineHeight: 1.5,
                          marginTop: 4,
                        }}
                      >
                        {value}
                      </p>
                    </div>
                  ) : null
                )}
              </div>

              <p
                style={{
                  marginTop: 26,
                  fontSize: 11,
                  letterSpacing: 3,
                  textTransform: 'uppercase',
                  color: '#988FA6',
                  textAlign: 'center',
                }}
              >
                designed with WEDORA AI
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AIDesigner;
