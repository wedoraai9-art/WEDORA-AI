import React, { useState, useRef } from 'react';
import { DESIGNER } from '@/constants/testIds';
import { generateDesign } from '@/lib/aiService';
import { Wand2, Palette, Sparkles, Download, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';

const CATS = [
  { key: 'theme', label: 'Theme' },
  { key: 'palette', label: 'Colour Palette' },
  { key: 'mandap', label: 'Mandap' },
  { key: 'stage', label: 'Stage / Focal Point' },
  { key: 'entrance', label: 'Entrance' },
  { key: 'table_decor', label: 'Table Décor' },
  { key: 'lighting', label: 'Lighting' },
  { key: 'florals', label: 'Florals' },
];

export const AIDesigner = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const moodboardRef = useRef(null);

  const onGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const r = await generateDesign(input);
      setResult(r);
      if (!Array.isArray(r.reference_images) || r.reference_images.length === 0) {
        toast.warning('Design created, but no reference photos were returned. Check the backend logs.');
      } else {
        toast.success(`Design created with ${r.reference_images.length} reference photos.`);
      }
    } catch (e) {
      setResult(null);
      toast.error(e?.response?.data?.detail || e.message || 'Could not generate design. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onExport = async () => {
    if (!moodboardRef.current || !result) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(moodboardRef.current, {
        pixelRatio: 2,
        backgroundColor: '#FAF8F6',
        cacheBust: true,
      });
      const a = document.createElement('a');
      a.download = `wedora-moodboard-${(result.theme || 'design').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
      a.href = dataUrl;
      a.click();
      toast.success('Moodboard downloaded — ready for your Instagram Story');
    } catch (e) {
      toast.error('Could not export moodboard. Try again.');
    }
    setExporting(false);
  };

  return (
    <section id="designer" data-testid={DESIGNER.section} className="relative py-24 px-4">
      <div className="max-w-6xl mx-auto text-center mb-10">
        <p className="font-heading uppercase tracking-[0.3em] text-xs text-[#988FA6] mb-4">AI Wedding Designer</p>
        <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-[#2D2638] leading-tight">
          Imagine It.<br />
          <span className="iridescent-text italic">WEDORA Designs It.</span>
        </h2>
        <p className="mt-5 max-w-2xl mx-auto text-[#6B617A]">
          Describe your dream wedding and let WEDORA turn your imagination into a complete design direction.
        </p>
      </div>

      <div className="max-w-3xl mx-auto liquid-glass-strong rounded-3xl p-4 md:p-5 gradient-border">
        <div className="flex items-start gap-3">
          <Wand2 className="w-5 h-5 text-[#C9B8FF] mt-3 shrink-0" />
          <textarea
            data-testid={DESIGNER.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            placeholder="Describe your dream wedding..."
            className="flex-1 bg-transparent outline-none text-[#2D2638] placeholder-[#988FA6] resize-none py-2 leading-relaxed"
          />
        </div>
        <div className="flex justify-end mt-3">
          <button
            data-testid={DESIGNER.generateBtn}
            onClick={onGenerate}
            disabled={loading}
            className="glow-btn flex items-center gap-2 disabled:opacity-60"
          >
            {loading ? <><span className="thinking-orb !w-4 !h-4" /> Designing…</> : <><Sparkles className="w-4 h-4" /> Generate design</>}
          </button>
        </div>
      </div>

      {result && (
        <div data-testid={DESIGNER.result} className="max-w-6xl mx-auto mt-10">
          <div className="flex justify-end mb-4">
            <button
              data-testid="moodboard-export-btn"
              onClick={onExport}
              disabled={exporting}
              className="glow-btn !py-2.5 !px-6 !text-sm inline-flex items-center gap-2 disabled:opacity-60"
            >
              <Download className="w-4 h-4" /> {exporting ? 'Painting your moodboard…' : 'Download Moodboard (Story-ready)'}
            </button>
          </div>
          {result?._error ? (
            <div className="pearl-card p-5 text-red-600">{result._error}</div>
          ) : (
            <>
              <div className="mb-6 grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-5">
                <div className="pearl-card overflow-hidden">
                  {result.hero_image ? (
                    <img src={result.hero_image} alt={`${result.function || 'Event'} decor reference`} className="w-full aspect-video object-cover" />
                  ) : (
                    <div className="aspect-video flex flex-col items-center justify-center gap-2 bg-[#fbf7fc] text-[#988FA6]">
                      <ImageIcon className="w-8 h-8" /><span className="text-sm">No hero reference photo available</span>
                    </div>
                  )}
                  <div className="p-5">
                    <p className="text-xs uppercase tracking-widest text-[#988FA6]">{result.function || 'Event design'}</p>
                    <h3 className="mt-1 text-xl font-semibold text-[#2D2638]">{result.theme || 'Your Event Design'}</h3>
                    {result.design_summary && <p className="mt-2 text-sm text-[#6B617A] leading-relaxed">{result.design_summary}</p>}
                  </div>
                </div>
                <div className="pearl-card p-5">
                  <p className="text-xs uppercase tracking-widest text-[#988FA6] mb-3 flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" /> Colour Palette</p>
                  <div className="flex gap-2">
                    {(Array.isArray(result.palette) ? result.palette : []).slice(0, 5).map((hex, i) => (
                      <div key={`${hex}-${i}`} title={hex} className="flex-1 aspect-square rounded-2xl border border-white shadow-inner" style={{ background: hex }} />
                    ))}
                  </div>
                </div>
              </div>

              <section className="mb-7">
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon className="w-5 h-5 text-[#988FA6]" />
                  <h3 className="text-xl font-semibold text-[#2D2638]">{result.function || 'Event'} Décor Reference Gallery</h3>
                </div>
                {Array.isArray(result.reference_images) && result.reference_images.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {result.reference_images.map((image, index) => {
                      const imageUrl = typeof image === 'string' ? image : (image?.url || image?.image_url || image?.src || image?.link || '');
                      if (!imageUrl) return null;
                      const sourceUrl = typeof image === 'object' ? image.source_url : '';
                      const photographer = typeof image === 'object' ? image.photographer : '';
                      const category = typeof image === 'object' ? image.category : '';
                      return (
                        <article key={`${imageUrl}-${index}`} className="pearl-card overflow-hidden">
                          <a href={sourceUrl || imageUrl} target="_blank" rel="noreferrer" className="block relative group">
                            <img src={imageUrl} alt={(typeof image === 'object' && image.alt) || `${result.function || 'Event'} decor reference ${index + 1}`} loading="lazy" className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-[1.02]" onError={(e) => { e.currentTarget.style.opacity = '0.25'; e.currentTarget.alt = 'Reference photo could not be loaded'; }} />
                            <span className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-[#51465f]"><ExternalLink className="w-4 h-4" /></span>
                          </a>
                          <div className="p-3">
                            {category && <p className="text-sm font-medium text-[#4a4257]">{category}</p>}
                            {photographer && <p className="text-xs text-[#988FA6] mt-1">Photo: {photographer}</p>}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="pearl-card p-5 text-sm text-[#6B617A]">No reference photos were returned. The design text is available; check the Render logs for Pexels errors.</div>
                )}
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {CATS.filter((c) => c.key === 'theme' || c.key === 'palette' || (typeof result[c.key] === 'string' && result[c.key].trim())).map((c) => {
                  const val = result[c.key];
                  if (c.key === 'theme' || c.key === 'palette') return null;
                  return (
                    <div key={c.key} className="pearl-card overflow-hidden p-5">
                      <p className="text-xs uppercase tracking-widest text-[#988FA6] mb-2">{c.label}</p>
                      <p className="text-sm text-[#4a4257] leading-relaxed">{val}</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Hidden moodboard canvas — 1080×1920 (Instagram Story) */}
      {result && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0 }} aria-hidden="true">
          <div ref={moodboardRef} style={{
            width: 540, height: 960, padding: 40, position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(160deg, #FDFBF7 0%, #F7E4F1 35%, #E4DCF9 70%, #DFF3FA 100%)',
            fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#2D2638',
          }}>
            {/* decorative blobs */}
            <div style={{ position: 'absolute', top: -80, right: -80, width: 260, height: 260, borderRadius: 9999, background: 'radial-gradient(circle, #F7B7D8, transparent 70%)', opacity: 0.55, filter: 'blur(20px)' }} />
            <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: 9999, background: 'radial-gradient(circle, #A9E8FF, transparent 70%)', opacity: 0.55, filter: 'blur(20px)' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <p style={{ fontSize: 11, letterSpacing: 6, textTransform: 'uppercase', color: '#988FA6' }}>WEDORA · AI Wedding Designer</p>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 44, fontStyle: 'italic', lineHeight: 1.1, marginTop: 14, background: 'linear-gradient(120deg,#C9B8FF,#F58D91,#A9E8FF)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                {result.theme || 'Your Dream Wedding'}
              </p>

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                {(Array.isArray(result.palette) ? result.palette : []).slice(0, 5).map((hex, i) => (
                  <div key={i} style={{ flex: 1, height: 64, borderRadius: 18, background: hex, border: '2px solid rgba(255,255,255,0.8)' }} />
                ))}
              </div>

              <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[['Mandap', result.mandap], ['Stage', result.stage], ['Entrance', result.entrance], ['Table Décor', result.table_decor], ['Lighting', result.lighting], ['Florals', result.florals]].map(([label, val]) => (
                  val ? (
                    <div key={label} style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.85)', borderRadius: 18, padding: '12px 16px' }}>
                      <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#988FA6' }}>{label}</p>
                      <p style={{ fontSize: 14, lineHeight: 1.5, marginTop: 4 }}>{val}</p>
                    </div>
                  ) : null
                ))}
              </div>

              <p style={{ marginTop: 26, fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#988FA6', textAlign: 'center' }}>
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
