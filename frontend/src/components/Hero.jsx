import React from 'react';
import { HERO } from '@/constants/testIds';
import ChatInterface from './ChatInterface';

export const Hero = ({ chatRef }) => {
  return (
    <section
      id="hero"
      data-testid={HERO.section}
      className="relative pt-32 pb-20 px-4 overflow-hidden silky-bg min-h-screen flex flex-col items-center justify-start"
    >
      {/* Floating liquid blobs */}
      <div className="blob blob-a" style={{ top: '-60px', left: '-80px', width: '460px', height: '460px', background: 'radial-gradient(circle at 30% 30%, #C9B8FF, #F7B7D8 60%, transparent 70%)' }} />
      <div className="blob blob-b" style={{ top: '120px', right: '-100px', width: '520px', height: '520px', background: 'radial-gradient(circle at 60% 40%, #A9E8FF, #F5A9B8 60%, transparent 75%)' }} />
      <div className="blob blob-a" style={{ bottom: '-100px', left: '20%', width: '420px', height: '420px', background: 'radial-gradient(circle at 50% 50%, #FFF8EF, #F7B7D8 60%, transparent 75%)', animationDelay: '3s' }} />

      <div className="relative z-10 max-w-4xl text-center mb-8">
        <p className="font-heading uppercase tracking-[0.35em] text-xs text-[#988FA6] mb-6">
          Your AI Wedding Companion
        </p>
        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] text-[#2D2638]">
          Your Wedding.<br />
          <span className="iridescent-text italic">Reimagined by AI.</span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-[#6B617A] text-base md:text-lg leading-relaxed">
          Meet <span className="font-heading font-medium text-[#2D2638]">WEDORA AI</span> — your intelligent wedding companion for planning, designing, budgeting and discovering everything you need for your perfect celebration.
        </p>
      </div>

      <div className="relative z-10 w-full">
        <ChatInterface initialPromptRef={chatRef} />
      </div>
    </section>
  );
};

export default Hero;
