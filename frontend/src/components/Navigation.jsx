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
          pointer-events: none;
          transform: translate(-50%, -72px);
        }

        .wedora-nav-arriving {
          animation: wedora-nav-glide-in .85s cubic-bezier(.2, .75, .2, 1) both;
        }

        .wedora-nav-arriving .wedora-nav-logo {
          opacity: 0;
          animation: wedora-nav-item-in .55s cubic-bezier(.2, .75, .25, 1) .28s forwards;
        }

        .wedora-nav-arriving .wedora-nav-links > * {
          opacity: 0;
          animation: wedora-nav-item-in .45s cubic-bezier(.2, .75, .25, 1) forwards;
        }

        .wedora-nav-arriving .wedora-nav-links > :nth-child(1) {
          animation-delay: .38s;
        }

        .wedora-nav-arriving .wedora-nav-links > :nth-child(2) {
          animation-delay: .43s;
        }

        .wedora-nav-arriving .wedora-nav-links > :nth-child(3) {
          animation-delay: .48s;
        }

        .wedora-nav-arriving .wedora-nav-links > :nth-child(4) {
          animation-delay: .53s;
        }

        .wedora-nav-arriving .wedora-nav-links > :nth-child(5) {
          animation-delay: .58s;
        }

        .wedora-nav-arriving .wedora-nav-links > :nth-child(6) {
          animation-delay: .63s;
        }

        .wedora-nav-arriving .wedora-nav-links > :nth-child(7) {
          animation-delay: .68s;
        }

        .wedora-nav-arriving .wedora-nav-actions {
          opacity: 0;
          animation: wedora-nav-item-in .55s cubic-bezier(.2, .75, .25, 1) .62s forwards;
        }

        @keyframes wedora-nav-glide-in {
          from {
            opacity: 0;
            transform: translate(-50%, -52px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        @keyframes wedora-nav-item-in {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .wedora-nav-arriving,
          .wedora-nav-arriving .wedora-nav-logo,
          .wedora-nav-arriving .wedora-nav-links > *,
          .wedora-nav-arriving .wedora-nav-actions {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>

      <nav
        className={`fixed top-4 left-1/2 z-50 transition-all duration-500 ${
          scrolled ? 'w-[95%] max-w-6xl' : 'w-[95%] max-w-6xl'
        } ${entranceClass}`}
      >
        <div className="liquid-glass rounded-full px-4 md:px-6 py-2.5 flex items-center justify-between">
          {/* Logo */}
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

          {/* Desktop links */}
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

          {/* CTA and mobile menu */}
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

        {/* Mobile menu */}
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
