import React, { useState, useEffect } from 'react';
import { NAV } from '@/constants/testIds';
import { Menu, X } from 'lucide-react';

const LOGO_URL = '/WEDORA.jpg';

const links = [
  { id: NAV.home, label: 'Home', href: '#hero' },
  { id: NAV.planWedding, label: 'Plan Wedding', href: '#capabilities' },
  { id: NAV.aiDesigner, label: 'AI Designer', href: '#designer' },
  { id: NAV.budget, label: 'Budget', href: '#budget' },
  { id: NAV.venues, label: 'Venues', href: '#venues' },
  { id: NAV.vendors, label: 'Marketplace', href: '/marketplace' },
  { id: NAV.about, label: 'For Vendors', href: '/for-vendors' },
];

const scrollTo = (href) => {
  if (href.startsWith('/')) {
    window.location.href = href;
    return;
  }

  const el = document.querySelector(href);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  else window.location.href = '/' + href;
};

export const Navigation = ({ introActive = false }) => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const entranceClass = introActive
    ? 'wedora-nav-hidden'
    : 'wedora-nav-arriving';

  return (
    <>
      <style>{`
        .wedora-nav-hidden {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
        }

        .wedora-nav-arriving {
          animation: wedora-nav-fade-in .45s ease-out both;
        }

        .wedora-nav-arriving .wedora-nav-logo {
          opacity: 0;
          animation: wedora-nav-item-fade .42s ease-out .12s forwards;
        }

        .wedora-nav-arriving .wedora-nav-links > * {
          opacity: 0;
          animation: wedora-nav-item-fade .38s ease-out forwards;
        }

        .wedora-nav-arriving .wedora-nav-links > :nth-child(1) {
          animation-delay: .14s;
        }

        .wedora-nav-arriving .wedora-nav-links > :nth-child(2) {
          animation-delay: .18s;
        }

        .wedora-nav-arriving .wedora-nav-links > :nth-child(3) {
          animation-delay: .22s;
        }

        .wedora-nav-arriving .wedora-nav-links > :nth-child(4) {
          animation-delay: .26s;
        }

        .wedora-nav-arriving .wedora-nav-links > :nth-child(5) {
          animation-delay: .30s;
        }

        .wedora-nav-arriving .wedora-nav-links > :nth-child(6) {
          animation-delay: .34s;
        }

        .wedora-nav-arriving .wedora-nav-links > :nth-child(7) {
          animation-delay: .38s;
        }

        .wedora-nav-arriving .wedora-nav-actions {
          opacity: 0;
          animation: wedora-nav-item-fade .42s ease-out .3s forwards;
        }

        @keyframes wedora-nav-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes wedora-nav-item-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          .wedora-nav-arriving,
          .wedora-nav-arriving .wedora-nav-logo,
          .wedora-nav-arriving .wedora-nav-links > *,
          .wedora-nav-arriving .wedora-nav-actions {
            animation: none;
            opacity: 1;
          }
        }
      `}</style>

      <nav
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
          scrolled ? 'w-[95%] max-w-6xl' : 'w-[95%] max-w-6xl'
        } ${entranceClass}`}
      >
        <div className="liquid-glass rounded-full px-4 md:px-6 py-2.5 flex items-center justify-between">
          <button
            data-testid={NAV.logo}
            onClick={() => scrollTo('#hero')}
            className="wedora-nav-logo flex items-center gap-2 pl-1"
          >
            <img
              src={LOGO_URL}
              alt="WEDORA"
              className="w-9 h-9 rounded-full object-cover ring-1 ring-white/70"
            />
            <span className="font-heading font-semibold tracking-wide text-[#2D2638] hidden sm:inline">
              WEDORA <span className="iridescent-text">AI</span>
            </span>
          </button>

          <div className="wedora-nav-links hidden lg:flex items-center gap-1">
            {links.map((link) => (
              <button
                key={link.id}
                data-testid={link.id}
                onClick={() => scrollTo(link.href)}
                className="text-sm text-[#4a4257] hover:text-[#2D2638] px-3 py-1.5 rounded-full transition hover:bg-white/50"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="wedora-nav-actions flex items-center gap-2">
            <button
              data-testid={NAV.startPlanning}
              onClick={() => scrollTo('#hero')}
              className="glow-btn text-sm hidden sm:inline-block"
            >
              Start Planning
            </button>

            <button
              data-testid={NAV.mobileToggle}
              className="lg:hidden p-2 rounded-full hover:bg-white/60"
              onClick={() => setOpen(!open)}
              aria-label="Menu"
            >
              {open ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden mt-2 liquid-glass-strong rounded-3xl p-3 flex flex-col gap-1">
            {links.map((link) => (
              <button
                key={`${link.id}-m`}
                data-testid={`${link.id}-mobile`}
                onClick={() => {
                  scrollTo(link.href);
                  setOpen(false);
                }}
                className="text-left px-4 py-2 rounded-2xl text-[#4a4257] hover:bg-white/50 transition"
              >
                {link.label}
              </button>
            ))}
          </div>
        )}
      </nav>
    </>
  );
};

export default Navigation;
