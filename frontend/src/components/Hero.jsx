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
      <style>{`
        .wedora-hero-ribbon {
          position: absolute;
          z-index: 0;
          top: 9rem;
          left: 50%;
          width: min(150vw, 1200px);
          height: clamp(150px, 23vw, 280px);
          pointer-events: none;
          border-radius: 50%;
          opacity: 0;
          transform: translateX(-54%) rotate(-8deg) scale(.92);
          background:
            linear-gradient(
              108deg,
              transparent 4%,
              rgba(201, 184, 255, .16) 24%,
              rgba(169, 232, 255, .25) 48%,
              rgba(247, 183, 216, .20) 70%,
              transparent 96%
            );
          filter: blur(18px);
          animation: wedora-ribbon-arrive 2.4s cubic-bezier(.2, .7, .2, 1) .1s forwards;
        }

        .wedora-hero-ribbon::after {
          content: '';
          position: absolute;
          inset: 18% 8%;
          border: 1px solid rgba(255, 255, 255, .38);
          border-left-color: rgba(201, 184, 255, .2);
          border-right-color: rgba(169, 232, 255, .28);
          border-radius: 50%;
          transform: rotate(-4deg);
          box-shadow:
            0 0 24px rgba(201, 184, 255, .14),
            inset 0 0 24px rgba(255, 255, 255, .12);
        }

        .wedora-hero-copy > * {
          opacity: 0;
          animation: wedora-hero-rise .8s cubic-bezier(.2, .75, .25, 1) forwards;
        }

        .wedora-hero-copy > :nth-child(1) {
          animation-delay: .25s;
        }

        .wedora-hero-copy > :nth-child(2) {
          animation-delay: .42s;
        }

        .wedora-hero-copy > :nth-child(3) {
          animation-delay: .6s;
        }

        .wedora-search-arrival {
          opacity: 0;
          transform: translateY(-28px) scale(.985);
          transform-origin: center top;
          animation: wedora-search-settle 1s cubic-bezier(.18, .8, .22, 1) .78s forwards;
        }

        @keyframes wedora-ribbon-arrive {
          0% {
            opacity: 0;
            transform: translateX(-57%) rotate(-8deg) scale(.92);
          }
          35% {
            opacity: .78;
          }
          100% {
            opacity: .34;
            transform: translateX(-46%) rotate(-2deg) scale(1.04);
          }
        }

        @keyframes wedora-hero-rise {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes wedora-search-settle {
          0% {
            opacity: 0;
            transform: translateY(-28px) scale(.985);
          }
          72% {
            opacity: 1;
            transform: translateY(3px) scale(1);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .wedora-hero-ribbon {
            display: none;
            animation: none;
          }

          .wedora-hero-copy > *,
          .wedora-search-arrival {
            opacity: 1;
            transform: none;
            animation: none;
          }
        }
      `}</style>

      <div className="wedora-hero-ribbon" aria-hidden="true" />

      {/* Floating liquid blobs */}
      <div
        className="blob blob-a"
        style={{
          top: '-60px',
          left: '-80px',
          width: '460px',
          height: '460px',
          background:
            'radial-gradient(circle at 30% 30%, #C9B8FF, #F7B7D8 60%, transparent 70%)',
        }}
      />
      <div
        className="blob blob-b"
        style={{
          top: '120px',
          right: '-100px',
          width: '520px',
          height: '520px',
          background:
            'radial-gradient(circle at 60% 40%, #A9E8FF, #F5A9B8 60%, transparent 75%)',
        }}
      />
      <div
        className="blob blob-a"
        style={{
          bottom: '-100px',
          left: '20%',
          width: '420px',
          height: '420px',
          background:
            'radial-gradient(circle at 50% 50%, #FFF8EF, #F7B7D8 60%, transparent 75%)',
          animationDelay: '3s',
        }}
      />

      <div className="wedora-hero-copy relative z-10 max-w-4xl text-center mb-8">
        <p className="font-heading uppercase tracking-[0.35em] text-xs text-[#988FA6] mb-6">
          Your AI Wedding Companion
        </p>
        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] text-[#2D2638]">
          Your Wedding.<br />
          <span className="iridescent-text italic">Reimagined by AI.</span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-[#6B617A] text-base md:text-lg leading-relaxed">
          Meet{' '}
          <span className="font-heading font-medium text-[#2D2638]">
            WEDORA AI
          </span>{' '}
          — your intelligent wedding companion for planning, designing,
          budgeting and discovering everything you need for your perfect
          celebration.
        </p>
      </div>

      <div className="wedora-search-arrival relative z-10 w-full">
        <ChatInterface initialPromptRef={chatRef} />
      </div>
    </section>
  );
};

export default Hero;
