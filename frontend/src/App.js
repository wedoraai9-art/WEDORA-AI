import React, { useEffect, useRef, useState } from 'react';
import '@/App.css';
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';
import { Toaster } from 'sonner';
import {
  ArrowRight,
  CalendarDays,
  Check,
  FileText,
  MapPin,
  Palette,
  Sparkles,
  Store,
  Wallet,
} from 'lucide-react';

import { AuthProvider } from '@/context/AuthContext';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Capabilities from '@/components/Capabilities';
import HowItWorks from '@/components/HowItWorks';
import AIDesigner from '@/components/AIDesigner';
import BudgetPlanner from '@/components/BudgetPlanner';
import VenueDiscovery from '@/components/VenueDiscovery';
import PromptExamples from '@/components/PromptExamples';
import FinalCTA from '@/components/FinalCTA';
import Footer from '@/components/Footer';
import VendorLanding from '@/components/vendor/VendorLanding';
import VendorAuth from '@/components/vendor/VendorAuth';
import VendorDashboard from '@/components/vendor/VendorDashboard';
import AdminDashboard from '@/components/vendor/AdminDashboard';
import Marketplace, {
  VendorPublicProfile,
} from '@/components/marketplace/Marketplace';
import SharePage from '@/components/SharePage';
import WeddingPlanner from '@/components/WeddingPlanner';
import WeddingChecklist from '@/components/WeddingChecklist';
import WeddingTimeline from '@/components/WeddingTimeline';
import WeddingGuests from '@/components/WeddingGuests';
import WeddingBudget from '@/components/WeddingBudget';
import WeddingVenuePlanning from '@/components/WeddingVenuePlanning';
import WeddingPhotography from '@/components/WeddingPhotography';
import WeddingCatering from '@/components/WeddingCatering';
import WeddingCouple from '@/components/WeddingCouple';
import WeddingTransportation from '@/components/WeddingTransportation';
import WedoraVenueDiscovery from '@/components/WedoraVenueDiscovery';
import WedoraVendorDiscovery from '@/components/WedoraVendorDiscovery';

const INTRO_TOTAL_DURATION = 16200;
const INTRO_STAR_TRAVEL_START = 15100;
const INTRO_STAR_TRAVEL_DURATION = 1050;
const REDUCED_INTRO_DURATION = 1200;

const shouldPlayIntro = (pathname) =>
  pathname === '/' && typeof window !== 'undefined';

const getReducedMotionPreference = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const IntroSparkle = React.forwardRef((props, ref) => (
  <svg
    ref={ref}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="url(#wedora-intro-sparkle-gradient)"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <defs>
      <linearGradient
        id="wedora-intro-sparkle-gradient"
        x1="2"
        y1="3"
        x2="22"
        y2="21"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#FF8DA7" />
        <stop offset="38%" stopColor="#F4B4CF" />
        <stop offset="68%" stopColor="#91E5F6" />
        <stop offset="100%" stopColor="#98B7FF" />
      </linearGradient>
    </defs>

    <path d="M12 3 13.9 8.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3Z" />
    <path d="M5 3v4" />
    <path d="M7 5H3" />
    <path d="M19 17v4" />
    <path d="M21 19h-4" />
  </svg>
));

IntroSparkle.displayName = 'IntroSparkle';

const Home = () => {
  const chatPromptRef = useRef(null);

  const handlePrompt = (text) => {
    const el = document.querySelector('#hero');

    if (el) {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }

    setTimeout(() => {
      if (chatPromptRef.current) {
        chatPromptRef.current(text);
      }
    }, 500);
  };

  return (
    <div className="App min-h-screen">
      <Hero chatRef={chatPromptRef} />
      <Capabilities />
      <HowItWorks />
      <AIDesigner />
      <BudgetPlanner />
      <VenueDiscovery />
      <PromptExamples onPrompt={handlePrompt} />
      <FinalCTA
        onStart={() => handlePrompt('Help me plan my dream wedding.')}
      />
      <Footer />
    </div>
  );
};

const AppContent = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const introStarRef = useRef(null);
  const starAnimationRef = useRef(null);

  const [prefersReducedMotion] = useState(getReducedMotionPreference);

  const [introActive, setIntroActive] = useState(() =>
    shouldPlayIntro(location.pathname)
  );

  const [starTraveling, setStarTraveling] = useState(false);

  useEffect(() => {
    if (!isHomePage) {
      if (introActive) {
        setIntroActive(false);
      }

      return undefined;
    }

    if (!introActive) {
      return undefined;
    }

    if (prefersReducedMotion) {
      const reducedTimer = window.setTimeout(() => {
        setIntroActive(false);
      }, REDUCED_INTRO_DURATION);

      return () => window.clearTimeout(reducedTimer);
    }

    const travelTimer = window.setTimeout(() => {
      setStarTraveling(true);

      const introStar = introStarRef.current;

      const searchStar = document.querySelector(
        '.wedora-search-sparkle-home, [data-wedora-search-sparkle]'
      );

      if (!introStar || !searchStar || !introStar.animate) {
        return;
      }

      const startRect = introStar.getBoundingClientRect();
      const targetRect = searchStar.getBoundingClientRect();

      if (!startRect.width || !targetRect.width) {
        return;
      }

      const startCenterX = startRect.left + startRect.width / 2;
      const startCenterY = startRect.top + startRect.height / 2;

      const targetCenterX = targetRect.left + targetRect.width / 2;
      const targetCenterY = targetRect.top + targetRect.height / 2;

      const moveX = targetCenterX - startCenterX;
      const moveY = targetCenterY - startCenterY;

      const targetScale = Math.min(
        1,
        targetRect.width / startRect.width
      );

      const keyframes = [
        {
          transform: 'translate3d(0, 0, 0) scale(1.08) rotate(0deg)',
          opacity: 1,
          offset: 0,
        },
        {
          transform: 'translate3d(0, 0, 0) scale(1.28) rotate(-8deg)',
          opacity: 1,
          offset: 0.08,
        },
        {
          transform:
            `translate3d(${moveX * 0.08}px, ${moveY * 0.12}px, 0) ` +
            'scale(1.18) rotate(10deg)',
          opacity: 1,
          offset: 0.2,
        },
        {
          transform:
            `translate3d(${moveX * 0.28}px, ${moveY * 0.42}px, 0) ` +
            'scale(1.08) rotate(-14deg)',
          opacity: 0.99,
          offset: 0.42,
        },
        {
          transform:
            `translate3d(${moveX * 0.56}px, ${moveY * 0.68}px, 0) ` +
            'scale(1.02) rotate(12deg)',
          opacity: 0.98,
          offset: 0.64,
        },
        {
          transform:
            `translate3d(${moveX * 0.82}px, ${moveY * 0.88}px, 0) ` +
            'scale(0.98) rotate(-7deg)',
          opacity: 0.97,
          offset: 0.84,
        },
        {
          transform:
            `translate3d(${moveX}px, ${moveY}px, 0) ` +
            `scale(${targetScale}) rotate(0deg)`,
          opacity: 0.96,
          offset: 1,
        },
      ];

      starAnimationRef.current = introStar.animate(
        keyframes,
        {
          duration: INTRO_STAR_TRAVEL_DURATION,
          easing: 'cubic-bezier(.22, .72, .22, 1)',
          fill: 'forwards',
        }
      );
    }, INTRO_STAR_TRAVEL_START);

    const finishTimer = window.setTimeout(() => {
      setIntroActive(false);
    }, INTRO_TOTAL_DURATION);

    return () => {
      window.clearTimeout(travelTimer);
      window.clearTimeout(finishTimer);

      if (starAnimationRef.current) {
        starAnimationRef.current.cancel();
        starAnimationRef.current = null;
      }
    };
  }, [
    introActive,
    isHomePage,
    prefersReducedMotion,
  ]);

  const finishIntroEarly = () => {
    setIntroActive(false);
  };

  return (
    <>
      <div className="App min-h-screen">
        <Navigation introActive={introActive} />

        <Routes>
          <Route path="/" element={<Home />} />

          <Route
            path="/wedding-planning"
            element={<WeddingPlanner />}
          />

          <Route
            path="/wedding-planning/checklist"
            element={<WeddingChecklist />}
          />

          <Route
            path="/wedding-planning/timeline"
            element={<WeddingTimeline />}
          />

          <Route
            path="/wedding-planning/guests"
            element={<WeddingGuests />}
          />

          <Route
            path="/wedding-planning/budget"
            element={<WeddingBudget />}
          />

          <Route
            path="/wedding-planning/venue"
            element={<WeddingVenuePlanning />}
          />

          <Route
            path="/wedding-planning/photography"
            element={<WeddingPhotography />}
          />

          <Route
            path="/wedding-planning/catering"
            element={<WeddingCatering />}
          />

          <Route
            path="/wedding-planning/couple"
            element={<WeddingCouple />}
          />

          <Route
            path="/wedding-planning/transportation"
            element={<WeddingTransportation />}
          />

          <Route
            path="/venue-discovery"
            element={<WedoraVenueDiscovery />}
          />

          <Route
            path="/vendor-discovery"
            element={<WedoraVendorDiscovery />}
          />

          <Route
            path="/for-vendors"
            element={<VendorLanding />}
          />

          <Route
            path="/vendor/auth"
            element={<VendorAuth />}
          />

          <Route
            path="/vendor/dashboard"
            element={<VendorDashboard />}
          />

          <Route
            path="/admin/dashboard"
            element={<AdminDashboard />}
          />

          <Route
            path="/marketplace"
            element={<Marketplace />}
          />

          <Route
            path="/vendor/:slug"
            element={<VendorPublicProfile />}
          />

          <Route
            path="/share/:shareId"
            element={<SharePage />}
          />
        </Routes>
      </div>

      {introActive && (
        <div
          className={`wedora-intro-screen ${
            starTraveling
              ? 'wedora-intro-star-traveling'
              : ''
          } ${
            prefersReducedMotion
              ? 'wedora-intro-screen-reduced'
              : ''
          }`}
          role="status"
          aria-label="Welcome to WEDORA AI"
        >
          <style>{`
            .wedora-intro-screen {
              position: fixed;
              inset: 0;
              z-index: 1000;
              display: grid;
              place-items: center;
              overflow: hidden;
              color: #2D2638;
              background:
                radial-gradient(
                  ellipse at 14% 22%,
                  rgba(201, 184, 255, .34),
                  transparent 43%
                ),
                radial-gradient(
                  ellipse at 82% 24%,
                  rgba(247, 183, 216, .32),
                  transparent 44%
                ),
                radial-gradient(
                  ellipse at 54% 90%,
                  rgba(169, 232, 255, .38),
                  transparent 48%
                ),
                #fffdfd;
              isolation: isolate;
              animation: wedora-intro-screen-in .55s ease-out both;
            }

            .wedora-intro-screen::before {
              content: '';
              position: absolute;
              inset: -22%;
              z-index: -1;
              pointer-events: none;
              background:
                conic-gradient(
                  from 205deg at 50% 50%,
                  transparent 0deg,
                  rgba(247, 183, 216, .13) 55deg,
                  rgba(169, 232, 255, .19) 125deg,
                  rgba(201, 184, 255, .14) 205deg,
                  transparent 280deg
                );
              filter: blur(46px);
              animation:
                wedora-intro-light-drift
                9s ease-in-out infinite alternate;
            }

            .wedora-intro-screen::after {
              content: '';
              position: absolute;
              inset: 0;
              z-index: -1;
              pointer-events: none;
              background:
                radial-gradient(
                  ellipse at center,
                  transparent 38%,
                  rgba(255, 255, 255, .3) 100%
                );
            }

            .wedora-intro-skip {
              position: absolute;
              right: max(24px, env(safe-area-inset-right));
              bottom: max(24px, env(safe-area-inset-bottom));
              z-index: 20;
              padding: 10px 16px;
              border: 1px solid rgba(152, 143, 166, .25);
              border-radius: 999px;
              background: rgba(255, 255, 255, .62);
              color: #6B617A;
              font: inherit;
              font-size: 12px;
              cursor: pointer;
              backdrop-filter: blur(12px);
              transition:
                background .2s ease,
                color .2s ease;
            }

            .wedora-intro-skip:hover {
              background: rgba(255, 255, 255, .92);
              color: #2D2638;
            }

            .wedora-intro-scenes {
              position: absolute;
              inset: 0;
            }

            .wedora-intro-scene {
              position: absolute;
              inset: 0;
              display: grid;
              place-items: center;
              padding: 56px 24px 78px;
              opacity: 0;
              animation:
                wedora-intro-scene-sequence
                var(--scene-duration)
                cubic-bezier(.2, .75, .2, 1)
                var(--scene-delay)
                both;
            }

            .wedora-intro-scene--brand {
              --scene-delay: 0s;
              --scene-duration: 2.9s;
            }

            .wedora-intro-scene--couples {
              --scene-delay: 2.7s;
              --scene-duration: 3s;
            }

            .wedora-intro-scene--discover {
              --scene-delay: 5.5s;
              --scene-duration: 3s;
            }

            .wedora-intro-scene--vendors {
              --scene-delay: 8.3s;
              --scene-duration: 3.1s;
            }

            .wedora-intro-scene--final {
              --scene-delay: 11.2s;
              --scene-duration: 5s;
            }

            .wedora-intro-scene-content {
              width: min(100%, 980px);
              margin: auto;
              text-align: center;
            }

            .wedora-intro-kicker {
              margin: 0 0 18px;
              color: #9B91A8;
              font-size: 11px;
              font-weight: 500;
              letter-spacing: .34em;
              line-height: 1.5;
              text-transform: uppercase;
            }

            /*
             * OPENING INTRO TYPOGRAPHY
             * Styled to match the second reference image.
             */
            .wedora-intro-scene--brand
              .wedora-intro-scene-content {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }

            .wedora-intro-scene--brand
              .wedora-intro-kicker {
              margin-bottom: 38px;
              color: #9B91A8;
              font-size: clamp(9px, 1vw, 12px);
              font-weight: 500;
              letter-spacing: .36em;
              line-height: 1.4;
            }

            .wedora-intro-scene--brand
              .wedora-intro-title {
              margin: 0;
              color: #2F2939;
              font-family:
                Georgia,
                'Times New Roman',
                serif;
              font-size: clamp(48px, 8vw, 108px);
              font-weight: 400;
              letter-spacing: -.055em;
              line-height: .98;
            }

            .wedora-intro-scene--brand
              .wedora-intro-title em {
              display: block;
              margin-top: 8px;
              background:
                linear-gradient(
                  105deg,
                  #F18499 0%,
                  #E99BAF 20%,
                  #CFA8D2 47%,
                  #A6D0E9 70%,
                  #87DDF5 100%
                );
              background-clip: text;
              -webkit-background-clip: text;
              color: transparent;
              font-family:
                Georgia,
                'Times New Roman',
                serif;
              font-size: .92em;
              font-style: italic;
              font-weight: 400;
              letter-spacing: -.055em;
            }

            .wedora-intro-scene--brand
              .wedora-intro-description {
              display: none;
            }

            .wedora-intro-title {
              margin: 0;
              color: #30283D;
              font-family:
                Georgia,
                'Times New Roman',
                serif;
              font-size: clamp(35px, 6vw, 72px);
              font-weight: 400;
              letter-spacing: -.045em;
              line-height: 1.02;
            }

            .wedora-intro-title em {
              display: inline-block;
              background:
                linear-gradient(
                  105deg,
                  #F18499 2%,
                  #D7A8D4 46%,
                  #86DDF4 76%,
                  #9BB4FF 100%
                );
              background-clip: text;
              -webkit-background-clip: text;
              color: transparent;
              font-weight: 400;
            }

            .wedora-intro-description {
              max-width: 650px;
              margin: 18px auto 0;
              color: #70677D;
              font-size: clamp(14px, 1.5vw, 18px);
              line-height: 1.65;
            }

            .wedora-intro-brand-logo {
              display: block;
              width: clamp(116px, 16vw, 168px);
              height: clamp(116px, 16vw, 168px);
              margin: 0 auto 22px;
              border: 1px solid rgba(255, 255, 255, .84);
              border-radius: 30px;
              object-fit: cover;
              box-shadow:
                0 22px 70px rgba(150, 126, 182, .16),
                0 0 34px rgba(255, 255, 255, .72);
              animation:
                wedora-intro-logo-arrive
                1.1s
                cubic-bezier(.18, .76, .2, 1)
                both;
            }

            .wedora-intro-brand-name {
              margin: 0 0 10px;
              color: #51445D;
              font-size: 12px;
              font-weight: 600;
              letter-spacing: .32em;
              text-transform: uppercase;
            }

            .wedora-intro-feature-row {
              display: grid;
              grid-template-columns:
                repeat(3, minmax(0, 1fr));
              gap: 14px;
              max-width: 840px;
              margin: 32px auto 0;
            }

            .wedora-intro-feature-card {
              min-height: 142px;
              padding: 20px 18px;
              border: 1px solid rgba(255, 255, 255, .83);
              border-radius: 24px;
              background: rgba(255, 255, 255, .48);
              box-shadow:
                0 18px 50px rgba(148, 132, 164, .1);
              text-align: left;
              backdrop-filter: blur(16px);
            }

            .wedora-intro-feature-icon {
              display: grid;
              width: 38px;
              height: 38px;
              margin-bottom: 14px;
              place-items: center;
              border: 1px solid rgba(255, 255, 255, .9);
              border-radius: 14px;
              background:
                linear-gradient(
                  135deg,
                  rgba(247, 183, 216, .45),
                  rgba(169, 232, 255, .48)
                );
              color: #725E82;
            }

            .wedora-intro-feature-icon svg {
              width: 18px;
              height: 18px;
              stroke-width: 1.7;
            }

            .wedora-intro-feature-title {
              margin: 0;
              color: #342B40;
              font-size: 15px;
              font-weight: 600;
            }

            .wedora-intro-feature-copy {
              margin: 6px 0 0;
              color: #786F84;
              font-size: 12px;
              line-height: 1.5;
            }

            .wedora-intro-discovery-cards {
              display: grid;
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
              gap: 16px;
              max-width: 740px;
              margin: 32px auto 0;
              text-align: left;
            }

            .wedora-intro-discovery-card {
              display: flex;
              min-height: 150px;
              align-items: center;
              gap: 18px;
              padding: 24px;
              border: 1px solid rgba(255, 255, 255, .85);
              border-radius: 26px;
              background: rgba(255, 255, 255, .5);
              box-shadow:
                0 18px 50px rgba(148, 132, 164, .1);
              backdrop-filter: blur(16px);
            }

            .wedora-intro-discovery-card
              .wedora-intro-feature-icon {
              width: 48px;
              height: 48px;
              margin: 0;
              flex: none;
            }

            .wedora-intro-discovery-card
              .wedora-intro-feature-icon svg {
              width: 22px;
              height: 22px;
            }

            .wedora-intro-discovery-card h3 {
              margin: 0;
              color: #342B40;
              font-size: 16px;
              font-weight: 600;
            }

            .wedora-intro-discovery-card p {
              margin: 7px 0 0;
              color: #786F84;
              font-size: 12px;
              line-height: 1.5;
            }

            .wedora-intro-vendor-panel {
              max-width: 790px;
              margin: 30px auto 0;
              padding: 18px;
              border: 1px solid rgba(255, 255, 255, .86);
              border-radius: 28px;
              background: rgba(255, 255, 255, .5);
              box-shadow:
                0 22px 64px rgba(148, 132, 164, .13);
              text-align: left;
              backdrop-filter: blur(18px);
            }

            .wedora-intro-vendor-panel-top {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 16px;
              padding: 4px 6px 16px;
              border-bottom:
                1px solid rgba(152, 143, 166, .13);
            }

            .wedora-intro-vendor-panel-title {
              color: #4A4057;
              font-size: 13px;
              font-weight: 600;
            }

            .wedora-intro-live-pill {
              display: inline-flex;
              align-items: center;
              gap: 7px;
              padding: 6px 10px;
              border: 1px solid rgba(127, 192, 164, .24);
              border-radius: 999px;
              background: rgba(231, 248, 239, .72);
              color: #587A68;
              font-size: 10px;
            }

            .wedora-intro-live-pill::before {
              width: 6px;
              height: 6px;
              border-radius: 50%;
              background: #7BC9A1;
              content: '';
            }

            .wedora-intro-vendor-tools {
              display: grid;
              grid-template-columns:
                repeat(3, minmax(0, 1fr));
              gap: 10px;
              padding-top: 14px;
            }

            .wedora-intro-vendor-tool {
              min-height: 98px;
              padding: 14px;
              border: 1px solid rgba(255, 255, 255, .82);
              border-radius: 19px;
              background: rgba(255, 255, 255, .55);
            }

            .wedora-intro-vendor-tool svg {
              width: 18px;
              height: 18px;
              margin-bottom: 10px;
              color: #9D718E;
              stroke-width: 1.7;
            }

            .wedora-intro-vendor-tool strong {
              display: block;
              color: #42384F;
              font-size: 12px;
              font-weight: 600;
            }

            .wedora-intro-vendor-tool span {
              display: block;
              margin-top: 4px;
              color: #847A8E;
              font-size: 10px;
              line-height: 1.4;
            }

            .wedora-intro-final-lockup {
              position: relative;
              width: fit-content;
              margin: 0 auto 20px;
            }

            .wedora-intro-final-logo {
              display: block;
              width: clamp(100px, 13vw, 142px);
              height: clamp(100px, 13vw, 142px);
              border: 1px solid rgba(255, 255, 255, .86);
              border-radius: 28px;
              object-fit: cover;
              box-shadow:
                0 18px 56px rgba(150, 126, 182, .15);
            }

            .wedora-intro-fly-star {
              position: absolute;
              top: 2px;
              right: -18px;
              width: 34px;
              height: 34px;
              overflow: visible;
              filter:
                drop-shadow(
                  0 0 7px rgba(255, 116, 158, .72)
                )
                drop-shadow(
                  0 0 14px rgba(96, 212, 255, .66)
                );
              transform:
                translate3d(0, 0, 0)
                scale(.72);
              transform-origin: center;
              will-change: transform, opacity;
              opacity: 0;
              animation:
                wedora-intro-star-pop
                1.15s
                cubic-bezier(.18, .8, .2, 1)
                12.15s
                both,
                wedora-intro-star-glow
                1.5s
                ease-in-out
                13.3s
                infinite
                alternate;
            }

            .wedora-intro-star-traveling
              .wedora-intro-fly-star {
              animation: none;
              filter:
                drop-shadow(0 0 7px rgba(255, 116, 158, .78))
                drop-shadow(0 0 14px rgba(96, 212, 255, .68));
            }

            .wedora-intro-final-label {
              display: flex;
              flex-wrap: wrap;
              justify-content: center;
              gap: 8px;
              margin-top: 22px;
              color: #80758D;
              font-size: 10px;
              font-weight: 600;
              letter-spacing: .2em;
              text-transform: uppercase;
            }

            .wedora-intro-final-label
              span + span::before {
              margin-right: 8px;
              color: #E9A8BE;
              content: '•';
            }

            .wedora-intro-progress {
              position: absolute;
              right: 0;
              bottom: 0;
              left: 0;
              height: 3px;
              overflow: hidden;
              background: rgba(255, 255, 255, .3);
            }

            .wedora-intro-progress::before {
              display: block;
              width: 100%;
              height: 100%;
              background:
                linear-gradient(
                  90deg,
                  #F28FA9,
                  #D7AAD7,
                  #8DDEF4,
                  #98B7FF
                );
              content: '';
              transform: scaleX(0);
              transform-origin: left;
              animation:
                wedora-intro-progress-fill
                ${INTRO_TOTAL_DURATION}ms
                linear
                both;
            }

            .wedora-intro-reduced-card {
              display: none;
              width: min(88vw, 480px);
              padding: 30px;
              border: 1px solid rgba(255, 255, 255, .82);
              border-radius: 28px;
              background: rgba(255, 255, 255, .58);
              box-shadow:
                0 22px 65px rgba(148, 132, 164, .14);
              text-align: center;
              backdrop-filter: blur(18px);
            }

            .wedora-intro-reduced-card img {
              width: 96px;
              height: 96px;
              margin: 0 auto 18px;
              border-radius: 22px;
              object-fit: cover;
            }

            .wedora-intro-reduced-card h1 {
              margin: 0;
              color: #30283D;
              font-family:
                Georgia,
                'Times New Roman',
                serif;
              font-size: 34px;
              font-weight: 400;
            }

            .wedora-intro-reduced-card p {
              margin: 12px 0 0;
              color: #70677D;
              font-size: 14px;
              line-height: 1.55;
            }

            .wedora-intro-star-traveling
              .wedora-intro-final-lockup {
              opacity: 1;
            }

            @keyframes wedora-intro-screen-in {
              from {
                opacity: 0;
              }

              to {
                opacity: 1;
              }
            }

            @keyframes wedora-intro-light-drift {
              from {
                transform:
                  rotate(-6deg)
                  scale(.98);
              }

              to {
                transform:
                  rotate(8deg)
                  scale(1.04);
              }
            }

            @keyframes wedora-intro-logo-arrive {
              0% {
                opacity: 0;
                filter: blur(10px);
                transform:
                  translateY(14px)
                  scale(.92);
              }

              100% {
                opacity: 1;
                filter: blur(0);
                transform:
                  translateY(0)
                  scale(1);
              }
            }

            @keyframes wedora-intro-scene-sequence {
              0% {
                opacity: 0;
                filter: blur(8px);
                transform:
                  translateY(18px)
                  scale(.99);
              }

              14% {
                opacity: 1;
                filter: blur(0);
                transform:
                  translateY(0)
                  scale(1);
              }

              76% {
                opacity: 1;
                filter: blur(0);
                transform:
                  translateY(0)
                  scale(1);
              }

              100% {
                opacity: 0;
                filter: blur(5px);
                transform:
                  translateY(-10px)
                  scale(1.01);
              }
            }

            @keyframes wedora-intro-star-pop {
              0% {
                opacity: 0;
                transform:
                  translate3d(0, 8px, 0)
                  scale(.38)
                  rotate(-22deg);
                filter:
                  drop-shadow(0 0 0 rgba(255, 116, 158, 0))
                  drop-shadow(0 0 0 rgba(96, 212, 255, 0));
              }

              45% {
                opacity: 1;
                transform:
                  translate3d(0, -4px, 0)
                  scale(1.34)
                  rotate(8deg);
              }

              70% {
                transform:
                  translate3d(0, 2px, 0)
                  scale(.94)
                  rotate(-5deg);
              }

              100% {
                opacity: 1;
                transform:
                  translate3d(0, 0, 0)
                  scale(1.08)
                  rotate(0deg);
              }
            }

            @keyframes wedora-intro-star-glow {
              from {
                filter:
                  drop-shadow(
                    0 0 5px rgba(255, 116, 158, .62)
                  )
                  drop-shadow(
                    0 0 10px rgba(96, 212, 255, .48)
                  );
              }

              to {
                filter:
                  drop-shadow(
                    0 0 9px rgba(255, 116, 158, .9)
                  )
                  drop-shadow(
                    0 0 16px rgba(96, 212, 255, .78)
                  );
              }
            }

            @keyframes wedora-intro-progress-fill {
              to {
                transform: scaleX(1);
              }
            }

            @media (max-width: 700px) {
              .wedora-intro-scene {
                padding: 45px 18px 74px;
              }

              .wedora-intro-feature-row {
                gap: 8px;
                margin-top: 24px;
              }

              .wedora-intro-feature-card {
                min-height: 130px;
                padding: 14px 12px;
                border-radius: 19px;
              }

              .wedora-intro-feature-title {
                font-size: 12px;
              }

              .wedora-intro-feature-copy {
                font-size: 10px;
              }

              .wedora-intro-feature-icon {
                width: 32px;
                height: 32px;
                margin-bottom: 10px;
                border-radius: 12px;
              }

              .wedora-intro-discovery-cards {
                gap: 9px;
                margin-top: 24px;
              }

              .wedora-intro-discovery-card {
                min-height: 132px;
                align-items: flex-start;
                flex-direction: column;
                gap: 12px;
                padding: 16px;
                border-radius: 20px;
              }

              .wedora-intro-discovery-card h3 {
                font-size: 13px;
              }

              .wedora-intro-discovery-card p {
                font-size: 10px;
              }

              .wedora-intro-vendor-panel {
                margin-top: 22px;
                padding: 12px;
                border-radius: 22px;
              }

              .wedora-intro-vendor-tool {
                min-height: 92px;
                padding: 10px;
              }

              .wedora-intro-vendor-tool strong {
                font-size: 10px;
              }

              .wedora-intro-vendor-tool span {
                font-size: 9px;
              }

              .wedora-intro-kicker {
                font-size: 9px;
                letter-spacing: .2em;
              }

              .wedora-intro-description {
                max-width: 520px;
                font-size: 13px;
              }

              .wedora-intro-scene--brand
                .wedora-intro-kicker {
                margin-bottom: 28px;
                font-size: 9px;
                letter-spacing: .27em;
              }

              .wedora-intro-scene--brand
                .wedora-intro-title {
                font-size: clamp(43px, 12vw, 72px);
                letter-spacing: -.05em;
              }

              .wedora-intro-scene--brand
                .wedora-intro-title em {
                margin-top: 6px;
              }
            }

            @media (max-width: 420px) {
              .wedora-intro-feature-row {
                grid-template-columns: 1fr;
                max-width: 280px;
                margin-top: 18px;
              }

              .wedora-intro-feature-card {
                display: flex;
                min-height: 0;
                align-items: center;
                gap: 12px;
                padding: 10px 12px;
              }

              .wedora-intro-feature-icon {
                margin: 0;
                flex: none;
              }

              .wedora-intro-feature-copy {
                margin-top: 3px;
              }

              .wedora-intro-vendor-tools {
                grid-template-columns: 1fr;
                gap: 7px;
              }

              .wedora-intro-vendor-tool {
                display: grid;
                min-height: 0;
                grid-template-columns: 22px 1fr;
                column-gap: 8px;
                align-items: center;
                padding: 8px 10px;
              }

              .wedora-intro-vendor-tool svg {
                grid-row: span 2;
                margin: 0;
              }

              .wedora-intro-vendor-tool span {
                margin-top: 2px;
              }

              .wedora-intro-vendor-panel {
                max-width: 310px;
              }

              .wedora-intro-scene--brand
                .wedora-intro-title {
                font-size: 43px;
              }

              .wedora-intro-scene--brand
                .wedora-intro-kicker {
                max-width: 280px;
                line-height: 1.6;
              }
            }

            .wedora-intro-screen-reduced {
              animation: none;
            }

            .wedora-intro-screen-reduced::before {
              animation: none;
              filter: blur(34px);
            }

            .wedora-intro-screen-reduced
              .wedora-intro-scenes {
              display: none;
            }

            .wedora-intro-screen-reduced
              .wedora-intro-reduced-card {
              display: block;
            }

            .wedora-intro-screen-reduced
              .wedora-intro-progress {
              display: none;
            }

            .wedora-intro-screen-reduced
              .wedora-intro-skip {
              display: none;
            }

            @media (prefers-reduced-motion: reduce) {
              .wedora-intro-screen,
              .wedora-intro-screen::before,
              .wedora-intro-brand-logo,
              .wedora-intro-scene,
              .wedora-intro-fly-star,
              .wedora-intro-progress::before {
                animation: none;
                transition: none;
              }

              .wedora-intro-fly-star {
                opacity: 1;
                transform: none;
              }
            }
          `}</style>

          <div
            className="wedora-intro-scenes"
            aria-hidden="true"
          >
            {/* =====================================================
                OPENING INTRO — REFERENCE TYPOGRAPHY PRESERVED
               ===================================================== */}
            <section
              className="
                wedora-intro-scene
                wedora-intro-scene--brand
              "
            >
              <div className="wedora-intro-scene-content">
                <p className="wedora-intro-kicker">
                  YOUR AI WEDDING COMPANION
                </p>

                <h1 className="wedora-intro-title">
                  Your Wedding.
                  <br />
                  <em>Reimagined by AI.</em>
                </h1>
              </div>
            </section>

            <section
              className="
                wedora-intro-scene
                wedora-intro-scene--couples
              "
            >
              <div className="wedora-intro-scene-content">
                <p className="wedora-intro-kicker">
                  For couples
                </p>

                <h2 className="wedora-intro-title">
                  Plan the day.
                  <br />
                  <em>Enjoy the journey.</em>
                </h2>

                <p className="wedora-intro-description">
                  Shape your plans, explore design ideas, and keep your budget
                  in view—all in one place.
                </p>

                <div className="wedora-intro-feature-row">
                  <article className="wedora-intro-feature-card">
                    <div className="wedora-intro-feature-icon">
                      <Sparkles />
                    </div>

                    <h3 className="wedora-intro-feature-title">
                      AI wedding planning
                    </h3>

                    <p className="wedora-intro-feature-copy">
                      Turn your ideas into a clearer plan.
                    </p>
                  </article>

                  <article className="wedora-intro-feature-card">
                    <div className="wedora-intro-feature-icon">
                      <Palette />
                    </div>

                    <h3 className="wedora-intro-feature-title">
                      AI design ideas
                    </h3>

                    <p className="wedora-intro-feature-copy">
                      Explore the look and feel of your day.
                    </p>
                  </article>

                  <article className="wedora-intro-feature-card">
                    <div className="wedora-intro-feature-icon">
                      <Wallet />
                    </div>

                    <h3 className="wedora-intro-feature-title">
                      Wedding budget
                    </h3>

                    <p className="wedora-intro-feature-copy">
                      Keep spending and plans together.
                    </p>
                  </article>
                </div>
              </div>
            </section>

            <section
              className="
                wedora-intro-scene
                wedora-intro-scene--discover
              "
            >
              <div className="wedora-intro-scene-content">
                <p className="wedora-intro-kicker">
                  Find your people and place
                </p>

                <h2 className="wedora-intro-title">
                  The right team.
                  <br />
                  <em>The right setting.</em>
                </h2>

                <p className="wedora-intro-description">
                  Explore wedding venues and discover vendors through the
                  WEDORA marketplace.
                </p>

                <div className="wedora-intro-discovery-cards">
                  <article className="wedora-intro-discovery-card">
                    <div className="wedora-intro-feature-icon">
                      <MapPin />
                    </div>

                    <div>
                      <h3>Venue discovery</h3>

                      <p>
                        Browse places that fit your celebration and plans.
                      </p>
                    </div>
                  </article>

                  <article className="wedora-intro-discovery-card">
                    <div className="wedora-intro-feature-icon">
                      <Store />
                    </div>

                    <div>
                      <h3>Vendor marketplace</h3>

                      <p>
                        Explore vendor profiles, services, and verified reviews.
                      </p>
                    </div>
                  </article>
                </div>
              </div>
            </section>

            <section
              className="
                wedora-intro-scene
                wedora-intro-scene--vendors
              "
            >
              <div className="wedora-intro-scene-content">
                <p className="wedora-intro-kicker">
                  For wedding professionals
                </p>

                <h2 className="wedora-intro-title">
                  Your business,
                  <br />
                  <em>beautifully in sync.</em>
                </h2>

                <p className="wedora-intro-description">
                  Keep client relationships, wedding work, and payments moving
                  from one vendor workspace.
                </p>

                <div className="wedora-intro-vendor-panel">
                  <div className="wedora-intro-vendor-panel-top">
                    <span className="wedora-intro-vendor-panel-title">
                      Vendor Command Center
                    </span>

                    <span className="wedora-intro-live-pill">
                      Your work, organized
                    </span>
                  </div>

                  <div className="wedora-intro-vendor-tools">
                    <div className="wedora-intro-vendor-tool">
                      <CalendarDays />

                      <strong>
                        Calendar & tasks
                      </strong>

                      <span>
                        Deadlines and wedding work
                      </span>
                    </div>

                    <div className="wedora-intro-vendor-tool">
                      <Check />

                      <strong>
                        Leads & client CRM
                      </strong>

                      <span>
                        Follow-ups and client notes
                      </span>
                    </div>

                    <div className="wedora-intro-vendor-tool">
                      <FileText />

                      <strong>
                        Quotes & invoices
                      </strong>

                      <span>
                        Payments and receipts
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section
              className="
                wedora-intro-scene
                wedora-intro-scene--final
              "
            >
              <div className="wedora-intro-scene-content">
                <div className="wedora-intro-final-lockup">
                  <img
                    className="wedora-intro-final-logo"
                    src="/WEDORA.jpg"
                    alt=""
                  />

                  <IntroSparkle
                    ref={introStarRef}
                    className="wedora-intro-fly-star"
                  />
                </div>

                <p className="wedora-intro-kicker">
                  From first idea to the wedding day
                </p>

                <h2 className="wedora-intro-title">
                  One celebration.
                  <br />
                  <em>Every detail in place.</em>
                </h2>

                <div className="wedora-intro-final-label">
                  <span>For couples</span>
                  <span>For wedding professionals</span>
                </div>
              </div>
            </section>
          </div>

          <div className="wedora-intro-reduced-card">
            <img
              src="/WEDORA.jpg"
              alt=""
            />

            <h1>
              Welcome to WEDORA AI
            </h1>

            <p>
              Wedding planning, design, discovery, and business tools in one
              place.
            </p>
          </div>

          <button
            type="button"
            className="wedora-intro-skip"
            onClick={finishIntroEarly}
          >
            Skip intro
            <ArrowRight
              size={14}
              aria-hidden="true"
            />
          </button>

          <div
            className="wedora-intro-progress"
            aria-hidden="true"
          />
        </div>
      )}

      <Toaster position="top-center" />
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
