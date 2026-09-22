import React, { useState } from 'react';
import { DESIGNER } from '@/constants/testIds';
import { generateDesign } from '@/lib/aiService';
import { Wand2, Palette, Sparkles } from 'lucide-react';

const CATS = [
  { key: 'theme',       label: 'Theme',          img: 'https://images.unsplash.com/photo-1782038522861-22e8c23c96e5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MjJ8MHwxfHNlYXJjaHwzfHxsdXh1cnklMjBwYXN0ZWwlMjB3ZWRkaW5nJTIwZmxvcmFsJTIwZGVjb3J8ZW58MHx8fHwxNzkwMDU4MDI3fDA&ixlib=rb-4.1.0&q=85' },
  { key: 'palette',     label: 'Colour Palette', img: null },
  { key: 'mandap',      label: 'Mandap',         img: 'https://images.pexels.com/photos/37828118/pexels-photo-37828118.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940' },
  { key: 'stage',       label: 'Stage',          img: 'https://images.unsplash.com/photo-1751257547111-9641cb540f4d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwyfHxsdXh1cnklMjBwYXN0ZWwlMjB3ZWRkaW5nJTIwZmxvcmFsJTIwZGVjb3J8ZW58MHx8fHwxNzkwMDU4MDI3fDA&ixlib=rb-4.1.0&q=85' },
  { key: 'entrance',    label: 'Entrance',       img: 'https://images.pexels.com/photos/33485957/pexels-photo-33485957.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940' },
  { key: 'table_decor', label: 'Table Décor',    img: 'https://images.unsplash.com/photo-1757283588394-ebafdbfffcc9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNzl8MHwxfHNlYXJjaHw0fHxlbGVnYW50JTIwd2VkZGluZyUyMHZlbnVlJTIwbHV4dXJ5JTIwcGFzdGVsfGVufDB8fHx8MTc5MDA1ODAyN3ww&ixlib=rb-4.1.0&q=85' },
  { key: 'lighting',    label: 'Lighting',       img: 'https://images.unsplash.com/photo-1646038572815-43fe759e459b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MjJ8MHwxfHNlYXJjaHwxfHxpcmlkZXNjZW50JTIwcGFzdGVsJTIwZmx1aWQlMjBncmFkaWVudCUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzkwMDU4MDI3fDA&ixlib=rb-4.1.0&q=85' },
  { key: 'florals',     label: 'Florals',        img: 'https://images.unsplash.com/photo-1644426358808-d5db8b4735a0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MjJ8MHwxfHNlYXJjaHwzfHxpcmlkZXNjZW50JTIwcGFzdGVsJTIwZmx1aWQlMjBncmFkaWVudCUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzkwMDU4MDI3fDA&ixlib=rb-4.1.0&q=85' },
];

export const AIDesigner = () => {
  const [input, setInput] = useState('Pastel pink and ivory wedding with a modern floral mandap, soft candlelight and luxury garden styling.');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const onGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const r = await generateDesign(input);
      setResult(r);
    } catch (e) {
      setResult({ _error: e.message });
    }
    setLoading(false);
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
        <div data-testid={DESIGNER.result} className="max-w-6xl mx-auto mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {CATS.map((c) => {
            const val = result[c.key];
            return (
              <div key={c.key} className="pearl-card overflow-hidden">
                {c.key === 'palette' ? (
                  <div className="p-5">
                    <p className="text-xs uppercase tracking-widest text-[#988FA6] mb-3 flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" /> Palette</p>
                    <div className="flex gap-2">
                      {(Array.isArray(val) ? val : ['#C9B8FF','#F7B7D8','#A9E8FF','#F5A9B8','#FFF8EF']).slice(0, 5).map((hex, i) => (
                        <div key={i} className="flex-1 aspect-square rounded-2xl border border-white/80 shadow-inner" style={{ background: hex }} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {c.img && (
                      <div className="relative h-32 overflow-hidden">
                        <img src={c.img} alt={c.label} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent" />
                      </div>
                    )}
                    <div className="p-5">
                      <p className="text-xs uppercase tracking-widest text-[#988FA6] mb-1.5">{c.label}</p>
                      <p className="text-sm text-[#4a4257] leading-relaxed">
                        {typeof val === 'string' ? val : (c.key === 'theme' ? (result.theme || '—') : '—')}
                      </p>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default AIDesigner;
