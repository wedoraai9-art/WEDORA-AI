import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles, ArrowRight } from 'lucide-react';

export const PLANS_UI = [
  {
    id: 'free', name: 'FREE', monthly: 0, yearly: 0,
    features: ['Business profile', '5 photos', 'Contact details', 'Basic listing', 'City/category listing'],
    cta: 'Start Free', highlight: false,
  },
  {
    id: 'pro', name: 'PRO', monthly: 599, yearly: 5999,
    features: ['Featured profile', 'Unlimited portfolio', 'Client lead access and management', 'Priority lead notifications', 'Analytics', 'AI business profile assistant', 'WhatsApp integration', 'PRO vendor badge'],
    cta: 'Choose Pro', highlight: true,
  },
];

export const PricingCards = ({ onChoose, compact = false, billing = 'monthly' }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 gap-5 ${compact ? '' : 'max-w-4xl mx-auto'}`}>
    {PLANS_UI.map((p) => (
      <div
        key={p.id}
        data-testid={`plan-card-${p.id}`}
        className={`relative pearl-card p-7 flex flex-col ${p.highlight ? 'gradient-border ring-1 ring-pink-200/80 !shadow-[0_20px_60px_-16px_rgba(247,183,216,0.45)]' : ''}`}
      >
        {p.highlight && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 chip !text-[10px] !py-1 !px-3 uppercase tracking-[0.2em] !bg-gradient-to-r !from-[#C9B8FF]/60 !to-[#F7B7D8]/60 font-medium">
            Most Loved
          </span>
        )}
        <p className="font-heading text-sm font-semibold tracking-[0.2em] text-[#2D2638]">{p.name}</p>
        <p className="mt-3">
          <span className="font-display text-4xl text-[#2D2638]">₹{p[billing].toLocaleString('en-IN')}</span>
          <span className="text-sm text-[#988FA6]">/{billing === 'yearly' ? 'year' : 'month'}</span>
        </p>
        {billing === 'yearly' && p.id === 'pro' && (
          <p className="mt-1 text-sm text-[#6B617A]">₹5,999/year · equivalent to ₹499.92/month</p>
        )}
        <ul className="mt-5 space-y-2.5 flex-1">
          {p.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-[#4a4257]">
              <span className="mt-0.5 w-4.5 h-4.5 w-[18px] h-[18px] rounded-full bg-gradient-to-br from-[#C9B8FF]/50 to-[#F7B7D8]/50 border border-white/80 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-[#2D2638]" strokeWidth={2.5} />
              </span>
              {f}
            </li>
          ))}
        </ul>
        <button
          data-testid={`plan-choose-${p.id}`}
          onClick={() => onChoose && onChoose(p.id, billing)}
          className={`mt-7 w-full ${p.highlight ? 'glow-btn' : 'chip !py-2.5 font-medium'} inline-flex items-center justify-center gap-2`}
        >
          {p.cta} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
);

const VendorLanding = () => {
  const navigate = useNavigate();
  const [billing, setBilling] = useState('monthly');
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-36 pb-20 px-4 silky-bg overflow-hidden" data-testid="vendor-landing-hero">
        <div className="blob blob-a" style={{ top: '-40px', right: '-80px', width: '420px', height: '420px', background: 'radial-gradient(circle at 40% 40%, #A9E8FF, #F7B7D8 60%, transparent 75%)' }} />
        <div className="blob blob-b" style={{ bottom: '-80px', left: '-60px', width: '380px', height: '380px', background: 'radial-gradient(circle at 50% 50%, #C9B8FF, #FFF8EF 65%, transparent 78%)' }} />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <p className="font-heading uppercase tracking-[0.35em] text-xs text-[#988FA6] mb-5">WEDORA For Vendors</p>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-[#2D2638] leading-[1.05]">
            Grow Your Wedding Business<br />
            <span className="iridescent-text italic">With WEDORA.</span>
          </h1>
          <p className="mt-6 text-[#6B617A] text-base md:text-lg max-w-xl mx-auto">
            Get discovered by couples who are actively planning their wedding.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button data-testid="vendor-hero-list-btn" onClick={() => navigate('/vendor/auth?mode=register')} className="glow-btn inline-flex items-center gap-2 !px-7">
              <Sparkles className="w-4 h-4" /> List Your Business
            </button>
            <a data-testid="vendor-hero-plans-btn" href="#vendor-plans" className="chip !py-3 !px-7 font-medium inline-flex items-center">
              View Plans
            </a>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="vendor-plans" className="py-20 px-4 scroll-mt-24" data-testid="vendor-plans-section">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <p className="font-heading uppercase tracking-[0.3em] text-xs text-[#988FA6] mb-4">Pricing</p>
          <h2 className="font-display text-4xl sm:text-5xl text-[#2D2638]">
            Choose How You <span className="iridescent-text italic">Bloom.</span>
          </h2>
        </div>
        <div className="flex justify-center mb-8">
          <div className="liquid-glass rounded-full p-1.5 inline-flex items-center gap-1" data-testid="vendor-billing-toggle">
            <button
              type="button"
              onClick={() => setBilling('monthly')}
              className={`px-5 py-2.5 rounded-full text-sm transition ${billing === 'monthly' ? 'bg-gradient-to-r from-[#C9B8FF]/70 to-[#F7B7D8]/70 text-[#2D2638] font-medium shadow-sm' : 'text-[#6B617A] hover:text-[#2D2638]'}`}
              data-testid="vendor-billing-monthly"
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBilling('yearly')}
              className={`px-5 py-2.5 rounded-full text-sm transition flex items-center gap-2 ${billing === 'yearly' ? 'bg-gradient-to-r from-[#C9B8FF]/70 to-[#F7B7D8]/70 text-[#2D2638] font-medium shadow-sm' : 'text-[#6B617A] hover:text-[#2D2638]'}`}
              data-testid="vendor-billing-yearly"
            >
              Yearly
              <span className="text-[10px] uppercase tracking-wider bg-white/70 px-2 py-0.5 rounded-full">Save</span>
            </button>
          </div>
        </div>
        <PricingCards
          billing={billing}
          onChoose={(plan) => navigate(`/vendor/auth?mode=register&plan=${plan}`)}
        />
        <p className="text-center text-xs text-[#988FA6] mt-6">PRO features activate after payment is verified.</p>
      </section>
    </div>
  );
};

export default VendorLanding;
