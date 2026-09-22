import React from 'react';
import { HOW } from '@/constants/testIds';

const steps = [
  { n: '01', title: 'Tell WEDORA',       desc: 'Share your vision, budget, city and dreams in your own words.' },
  { n: '02', title: 'WEDORA Understands', desc: 'The AI listens, asks warm follow-ups and gathers your context.' },
  { n: '03', title: 'WEDORA Plans',      desc: 'Personalized plans, budgets, designs and vendor curation appear.' },
  { n: '04', title: 'You Celebrate',     desc: 'Refine, book, and step into the wedding you always imagined.' },
];

export const HowItWorks = () => (
  <section id="how" data-testid={HOW.section} className="relative py-24 px-4">
    <div className="max-w-6xl mx-auto text-center mb-14">
      <p className="font-heading uppercase tracking-[0.3em] text-xs text-[#988FA6] mb-4">The Process</p>
      <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-[#2D2638] leading-tight">
        How <span className="iridescent-text italic">WEDORA</span> Works
      </h2>
    </div>

    <div className="relative max-w-6xl mx-auto">
      {/* gradient connector */}
      <div className="hidden md:block absolute left-6 right-6 top-14 h-[2px] bg-gradient-to-r from-[#C9B8FF] via-[#F7B7D8] via-[#A9E8FF] to-[#F58D91] opacity-70 rounded-full" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 relative">
        {steps.map((s) => (
          <div key={s.n} data-testid={HOW.step(s.n)} className="pearl-card p-6 relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white to-[#FFF8EF] border border-white/80 shadow-sm flex items-center justify-center font-display text-xl text-[#2D2638] mb-4">
              {s.n}
            </div>
            <h3 className="font-heading font-semibold text-lg text-[#2D2638] mb-1.5">{s.title}</h3>
            <p className="text-sm text-[#6B617A] leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
