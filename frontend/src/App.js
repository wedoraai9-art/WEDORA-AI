import React, { useEffect, useRef, useState } from 'react';
import '@/App.css';
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';
import { Toaster } from 'sonner';

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

const INTRO_TOTAL_DURATION = 3500;
const LOGO_TRAVEL_START = 2600;
const LOGO_TRAVEL_DURATION = 750;
const HIDDEN_NAVBAR_OFFSET = 72;

const shouldPlayIntro = (pathname) => {
  if (pathname !== '/' || typeof window === 'undefined') return false;

  const prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return !prefersReducedMotion;
};

const Home = () => {
  const chatPromptRef = useRef(null);

  const handlePrompt = (text) => {
    const el = document.querySelector('#hero');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });

    setTimeout(() => {
      if (chatPromptRef.current) chatPromptRef.current(text);
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
      <FinalCTA onStart={() => handlePrompt('Help me plan my dream wedding.')} />
      <Footer />
    </div>
  );
};

const AppContent = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const introLogoRef = useRef(null);
  const logoAnimationRef = useRef(null);

  const [introActive, setIntroActive] = useState(() =>
    shouldPlayIntro(location.pathname)
  );
  const [introTraveling, setIntroTraveling] = useState(false);

  useEffect(() => {
    if (!isHomePage) {
      if (introActive) setIntroActive(false);
      return undefined;
    }

    if (!introActive) return undefined;

    const travelTimer = window.setTimeout(() => {
      setIntroTraveling(true);

      const introLogo = introLogoRef.current;
      const navbarLogo = document.querySelector('.wedora-nav-logo img');

      if (!introLogo || !navbarLogo || !introLogo.animate) return;

      const startRect = introLogo.getBoundingClientRect();
      const targetRect = navbarLogo.getBoundingClientRect();

      const startCenterX = startRect.left + startRect.width / 2;
      const startCenterY = startRect.top + startRect.height / 2;
      const targetCenterX = targetRect.left + targetRect.width / 2;
      const targetCenterY =
        targetRect.top + targetRect.height / 2 + HIDDEN_NAVBAR_OFFSET;

      const moveX = targetCenterX - startCenterX;
      const moveY = targetCenterY - startCenterY;
      const scaleX = targetRect.width / startRect.width;
      const scaleY = targetRect.height / startRect.height;

      const endTransform =
        `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px)) ` +
        `scale(${scaleX}, ${scaleY})`;

      logoAnimationRef.current = introLogo.animate(
        [
          {
            transform: 'translate(-50%, -50%) scale(1, 1)',
            borderRadius: '30px',
          },
          {
            transform: endTransform,
            borderRadius: '50%',
          },
        ],
        {
          duration: LOGO_TRAVEL_DURATION,
          easing: 'cubic-bezier(.22, .72, .22, 1)',
          fill: 'forwards',
        }
      );
    }, LOGO_TRAVEL_START);

    const finishTimer = window.setTimeout(() => {
      setIntroActive(false);
    }, INTRO_TOTAL_DURATION);

    return () => {
      window.clearTimeout(travelTimer);
      window.clearTimeout(finishTimer);

      if (logoAnimationRef.current) {
        logoAnimationRef.current.cancel();
        logoAnimationRef.current = null;
      }
    };
  }, [introActive, isHomePage]);

  const finishIntroEarly = () => {
    setIntroActive(false);
  };

  return (
    <>
      <div className="App min-h-screen">
        <Navigation introActive={introActive} />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/wedding-planning" element={<WeddingPlanner />} />
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
          <Route path="/for-vendors" element={<VendorLanding />} />
          <Route path="/vendor/auth" element={<VendorAuth />} />
          <Route path="/vendor/dashboard" element={<VendorDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/vendor/:slug" element={<VendorPublicProfile />} />
          <Route path="/share/:shareId" element={<SharePage />} />
        </Routes>
      </div>

      {introActive && (
        <div
          className={`wedora-intro-screen ${
            introTraveling ? 'wedora-intro-traveling' : ''
          }`}
          role="status"
          aria-label="WEDORA AI welcome"
        >
          <style>{`
            .wedora-intro-screen {
              position: fixed;
              inset: 0;
              z-index: 1000;
              display: grid;
              place-items: center;
              overflow: hidden;
              background:
                radial-gradient(ellipse at 18% 24%, rgba(201, 184, 255, .36), transparent 42%),
                radial-gradient(ellipse at 82% 28%, rgba(247, 183, 216, .31), transparent 43%),
                radial-gradient(ellipse at 52% 88%, rgba(169, 232, 255, .32), transparent 46%),
                #fffdfd;
              animation: wedora-intro-fade-in .35s ease-out both;
            }

            .wedora-intro-screen::before {
              content: '';
              position: absolute;
              inset: -20%;
              pointer-events: none;
              background:
                conic-gradient(
                  from 210deg at 50% 50%,
                  transparent 0deg,
                  rgba(201, 184, 255, .12) 60deg,
                  rgba(169, 232, 255, .16) 125deg,
                  rgba(247, 183, 216, .13) 205deg,
                  transparent 270deg
                );
              filter: blur(34px);
              animation: wedora-intro-light-drift 5s ease-in-out infinite alternate;
            }

            .wedora-intro-ribbon {
              position: absolute;
              top: 50%;
              left: 50%;
              width: min(145vw, 1250px);
              height: clamp(130px, 24vw, 270px);
              border: 1px solid rgba(255, 255, 255, .68);
              border-left-color: rgba(201, 184, 255, .36);
              border-right-color: rgba(169, 232, 255, .46);
              border-radius: 50%;
              opacity: 0;
              pointer-events: none;
              transform: translate(-50%, -50%) rotate(-9deg) scale(.72);
              box-shadow:
                0 0 38px rgba(201, 184, 255, .17),
                inset 0 0 38px rgba(255, 255, 255, .24);
              animation: wedora-intro-ribbon-form 1.9s cubic-bezier(.2, .7, .2, 1) .05s forwards;
            }

            .wedora-intro-ribbon::after {
              content: '';
              position: absolute;
              inset: 12% -3%;
              border-radius: 50%;
              background: linear-gradient(
                100deg,
                transparent,
                rgba(247, 183, 216, .13),
                rgba(169, 232, 255, .16),
                rgba(201, 184, 255, .14),
                transparent
              );
              filter: blur(16px);
            }

            .wedora-intro-copy {
              position: absolute;
              top: calc(46% + clamp(130px, 19vw, 190px));
              left: 50%;
              width: max-content;
              max-width: 90vw;
              color: #82778e;
              font-family: inherit;
              font-size: 11px;
              font-weight: 500;
              letter-spacing: .34em;
              text-align: center;
              text-transform: uppercase;
              opacity: 0;
              transform: translate(-50%, 10px);
              animation: wedora-intro-copy-in .65s ease-out .75s forwards;
              transition: opacity .3s ease, transform .3s ease;
            }

            .wedora-intro-traveling .wedora-intro-copy {
              opacity: 0;
              transform: translate(-50%, 4px);
            }

            .wedora-intro-logo {
              position: absolute;
              top: 46%;
              left: 50%;
              width: min(76vw, 320px);
              aspect-ratio: 1;
              object-fit: cover;
              object-position: center;
              border-radius: 30px;
              box-shadow: 0 22px 70px rgba(137, 111, 170, .16);
              transform: translate(-50%, -50%);
              animation: wedora-intro-logo-reveal 1s cubic-bezier(.2, .72, .2, 1) .2s both;
              will-change: transform;
            }

            .wedora-intro-skip {
              position: absolute;
              right: max(22px, env(safe-area-inset-right));
              bottom: max(22px, env(safe-area-inset-bottom));
              padding: 9px 14px;
              border: 1px solid rgba(152, 143, 166, .24);
              border-radius: 999px;
              background: rgba(255, 255, 255, .58);
              color: #756b82;
              font: inherit;
              font-size: 12px;
              cursor: pointer;
              transition: background .2s ease, color .2s ease;
            }

            .wedora-intro-skip:hover {
              background: rgba(255, 255, 255, .9);
              color: #2D2638;
            }

            @keyframes wedora-intro-fade-in {
              from { opacity: 0; }
              to { opacity: 1; }
            }

            @keyframes wedora-intro-light-drift {
              from { transform: rotate(-5deg) scale(.98); }
              to { transform: rotate(8deg) scale(1.04); }
            }

            @keyframes wedora-intro-ribbon-form {
              0% {
                opacity: 0;
                transform: translate(-50%, -50%) rotate(-9deg) scale(.72);
              }
              45% { opacity: .9; }
              100% {
                opacity: .52;
                transform: translate(-50%, -50%) rotate(-3deg) scale(1);
              }
            }

            @keyframes wedora-intro-logo-reveal {
              from {
                opacity: 0;
                filter: blur(9px);
                transform: translate(-50%, -46%) scale(.94);
              }
              to {
                opacity: 1;
                filter: blur(0);
                transform: translate(-50%, -50%) scale(1);
              }
            }

            @keyframes wedora-intro-copy-in {
              to {
                opacity: .9;
                transform: translate(-50%, 0);
              }
            }

            @media (max-width: 600px) {
              .wedora-intro-copy {
                letter-spacing: .22em;
                font-size: 9px;
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .wedora-intro-screen,
              .wedora-intro-screen::before,
              .wedora-intro-ribbon,
              .wedora-intro-logo,
              .wedora-intro-copy {
                animation: none;
                transition: none;
              }
            }
          `}</style>

          <div className="wedora-intro-ribbon" aria-hidden="true" />

          <img
            ref={introLogoRef}
            className="wedora-intro-logo"
            src="/WEDORA.jpg"
            alt="WEDORA AI"
          />

          <p className="wedora-intro-copy">
            The future of wedding management
          </p>

          <button
            type="button"
            className="wedora-intro-skip"
            onClick={finishIntroEarly}
          >
            Skip intro
          </button>
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
