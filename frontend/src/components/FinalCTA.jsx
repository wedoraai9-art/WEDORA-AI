import React from 'react';
import { CTA } from '@/constants/testIds';
import { Sparkles } from 'lucide-react';

export const FinalCTA = ({ onStart }) => (
  <section id="about" data-testid={CTA.section} className="relative py-32 px-4 overflow-hidden">
    {/* glowing orb behind */}
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      <div className="w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-[#C9B8FF] via-[#F7B7D8] to-[#A9E8FF] blur-3xl opacity-70 animate-pulse" />
    </div>
    <div className="absolute left-[10%] top-[20%] w-40 h-40 rounded-full bg-[#FFF8EF] blur-3xl opacity-70" />
    <div className="absolute right-[10%] bottom-[10%] w-56 h-56 rounded-full bg-[#F5A9B8] blur-3xl opacity-40" />

    <div className="relative z-10 max-w-3xl mx-auto text-center">
      <div className="liquid-glass-strong rounded-[36px] p-10 md:p-14 gradient-border">
        <p className="font-heading uppercase tracking-[0.35em] text-xs text-[#988FA6] mb-5">Begin</p>
        <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-[#2D2638] leading-tight">
          Your Wedding Story <br className="hidden md:block" />
          <span className="iridescent-text italic">Starts Here.</span>
        </h2>
        <p className="mt-6 text-[#6B617A] text-base md:text-lg">
          Tell WEDORA what you&apos;re dreaming of.
        </p>
        <button
          data-testid={CTA.btn}
          onClick={onStart}
          className="glow-btn mt-8 inline-flex items-center gap-2 !px-8 !py-3 text-base"
        >
          <Sparkles className="w-4 h-4" /> Start Planning With WEDORA
        </button>
      </div>
    </div>
  </section>
);

export default FinalCTA;
