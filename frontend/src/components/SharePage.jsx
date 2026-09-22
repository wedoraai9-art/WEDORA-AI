import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGetShare } from '@/lib/auth';
import PremiumMarkdown from '@/components/PremiumMarkdown';
import { Sparkles, ArrowLeft } from 'lucide-react';

const SharePage = () => {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      try { const r = await apiGetShare(shareId); setData(r); }
      catch { setNotFound(true); }
    })();
  }, [shareId]);

  if (notFound) return (
    <div className="min-h-screen silky-bg pt-40 text-center">
      <p className="font-display text-3xl text-[#2D2638]">This wedding plan link has drifted away.</p>
      <button onClick={() => navigate('/')} className="chip mt-6">Go to WEDORA</button>
    </div>
  );
  if (!data) return <div className="min-h-screen silky-bg pt-40"><div className="thinking-orb mx-auto" /></div>;

  return (
    <div className="min-h-screen silky-bg pt-28 pb-16 px-4" data-testid="share-page">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button data-testid="share-back-btn" onClick={() => navigate('/')} className="chip !text-xs inline-flex items-center gap-1.5"><ArrowLeft className="w-3.5 h-3.5" /> Plan my own wedding</button>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#988FA6]">Shared Wedding Plan</span>
        </div>

        <div className="pearl-card p-5 md:p-7">
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/70">
            <Sparkles className="w-4 h-4 text-[#C9B8FF]" />
            <p className="font-heading font-semibold text-[#2D2638]">WEDORA <span className="iridescent-text">AI</span> <span className="text-xs font-normal text-[#988FA6]">· read-only</span></p>
          </div>
          {data.messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
              {m.role === 'user' ? (
                <div className="max-w-[85%] rounded-3xl rounded-br-md px-4 py-2.5 text-[#2D2638] bg-gradient-to-r from-[#C9B8FF]/25 via-[#F7B7D8]/25 to-[#A9E8FF]/25 border border-white/80 backdrop-blur-md whitespace-pre-wrap">{m.content}</div>
              ) : (
                <div className="max-w-[95%] w-full rounded-3xl rounded-bl-md px-4 py-3 bg-white/85 border border-pink-100/80 shadow-[0_4px_20px_rgba(201,184,255,0.15)]">
                  <PremiumMarkdown text={m.content} />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-[#6B617A] mb-3">Planning your own wedding?</p>
          <button data-testid="share-cta-btn" onClick={() => navigate('/')} className="glow-btn !px-8">Ask WEDORA</button>
        </div>
      </div>
    </div>
  );
};

export default SharePage;
