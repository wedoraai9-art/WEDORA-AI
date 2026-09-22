import React from 'react';
import { PROMPTS } from '@/constants/testIds';
import { Sparkles } from 'lucide-react';

const PROMPTS_LIST = [
  'Plan my ₹10 lakh wedding.',
  'Create a pastel luxury wedding theme.',
  'Plan my Jaipur destination wedding.',
  'Create a 3-day wedding itinerary.',
  'Help me divide my wedding budget.',
  'Suggest décor for a 300-guest wedding.',
  'Create my Haldi décor concept.',
  'Find everything I need for my wedding.',
];

export const PromptExamples = ({ onPrompt }) => (
  <section data-testid={PROMPTS.section} className="relative py-24 px-4">
    <div className="max-w-6xl mx-auto text-center mb-10">
      <p className="font-heading uppercase tracking-[0.3em] text-xs text-[#988FA6] mb-4">Try It</p>
      <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-[#2D2638] leading-tight">
        Start With <span className="iridescent-text italic">a Thought.</span>
      </h2>
    </div>

    <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
      {PROMPTS_LIST.map((p, i) => (
        <button
          key={p}
          data-testid={PROMPTS.prompt(i)}
          onClick={() => onPrompt && onPrompt(p)}
          className="pearl-card !p-4 text-left flex items-center gap-3 group"
        >
          <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C9B8FF]/40 to-[#F7B7D8]/40 border border-white/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <Sparkles className="w-4 h-4 text-[#2D2638]" strokeWidth={1.6} />
          </span>
          <span className="text-sm text-[#2D2638]">{p}</span>
        </button>
      ))}
    </div>
  </section>
);

export default PromptExamples;
