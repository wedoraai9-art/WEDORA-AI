
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  { id: 'staffLogin', label: 'Staff Login', href: '/staff/login' },
];

export const Navigation = ({ introActive = false }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);

    window.addEventListener('scroll', onScroll);
    onScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, []);

  const scrollTo = (href) => {
    // Internal React Router pages
    if (href.startsWith('/')) {
      navigate(href);
      setOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Homepage section links
    const el = document.querySelector(href);

    if (el) {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      setOpen(false);
      return;
    }

    // Return to Home if the section is not on the current page
    navigate('/');
    setOpen(false);

    // Wait for Home to render before scrolling
    window.setTimeout(() => {
      const target = document.querySelector(href);

      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 100);
  };

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

        .wedora-nav-arriving .wedora-nav-links > :nth-child(8) {
          animation-delay: .42s;
        }

        .wedora-nav-arriving .wedora-nav-actions {
          opacity: 0;
          animation: wedora-nav-item-fade .42s ease-out .3s forwards;
        }

        @keyframes wedora-nav-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes wedora-nav-item-fade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
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
        className={`
          fixed top-4 left-1/2 -translate-x-1/2 z-50
          w-[95%] max-w-6xl
          transition-all duration-500
          ${scrolled ? 'shadow-sm' : ''}
          ${entranceClass}
        `}
      >
        {/* Main navigation bar */}
        <div
          className="
            liquid-glass rounded-full
            px-3 sm:px-4 md:px-6
            py-2.5
            flex items-center justify-between
            gap-2 sm:gap-3
            min-w-0
          "
        >
          {/* Logo */}
          <button
            data-testid={NAV.logo}
            onClick={() => scrollTo('#hero')}
            className="
              wedora-nav-logo
              flex items-center gap-2 pl-1
              shrink-0
            "
            aria-label="WEDORA AI Home"
          >
            <img
              src={LOGO_URL}
              alt="WEDORA"
              className="
                w-9 h-9 rounded-full
                object-cover
                ring-1 ring-white/70
                shrink-0
              "
            />

            <span
              className="
                font-heading font-semibold tracking-wide
                text-[#2D2638]
                hidden sm:inline
                whitespace-nowrap
              "
            >
              WEDORA <span className="iridescent-text">AI</span>
            </span>
          </button>

          {/* Desktop navigation links: visible on very wide screens */}
          <div
            className="
              wedora-nav-links
              hidden 2xl:flex
              flex-1 min-w-0
              items-center justify-center
              gap-0.5
            "
          >
            {links.map((link) => (
              <button
                key={link.id}
                data-testid={link.id}
                onClick={() => scrollTo(link.href)}
                className="
                  text-sm text-[#4a4257]
                  hover:text-[#2D2638]
                  px-2.5 py-1.5
                  rounded-full
                  transition
                  hover:bg-white/50
                  whitespace-nowrap
                  shrink-0
                "
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Right-side actions */}
          <div
            className="
              wedora-nav-actions
              flex items-center
              gap-2
              shrink-0
              ml-auto
              2xl:ml-0
            "
          >
            {/* Start Planning */}
            <button
              data-testid={NAV.startPlanning}
              onClick={() => scrollTo('#hero')}
              className="
                glow-btn
                text-sm
                hidden md:inline-flex
                items-center justify-center
                whitespace-nowrap
                shrink-0
                px-4
              "
            >
              Start Planning
            </button>

            {/* Mobile and tablet menu toggle */}
            <button
              data-testid={NAV.mobileToggle}
              className="
                2xl:hidden
                p-2
                rounded-full
                hover:bg-white/60
                transition
                shrink-0
              "
              onClick={() => setOpen((previous) => !previous)}
              aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={open}
              aria-controls="wedora-mobile-navigation"
            >
              {open ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile and tablet dropdown menu */}
        {open && (
          <div
            id="wedora-mobile-navigation"
            className="
              2xl:hidden
              mt-2
              liquid-glass-strong
              rounded-3xl
              p-3
              flex flex-col gap-1
              max-h-[75vh]
              overflow-y-auto
              shadow-lg
            "
          >
            {links.map((link) => (
              <button
                key={`${link.id}-m`}
                data-testid={`${link.id}-mobile`}
                onClick={() => scrollTo(link.href)}
                className="
                  w-full
                  text-left
                  px-4 py-3
                  rounded-2xl
                  text-[#4a4257]
                  hover:text-[#2D2638]
                  hover:bg-white/50
                  transition
                "
              >
                {link.label}
              </button>
            ))}

            {/* Start Planning inside the dropdown on narrow screens */}
            <button
              data-testid={`${NAV.startPlanning}-mobile`}
              onClick={() => scrollTo('#hero')}
              className="
                md:hidden
                mt-2
                glow-btn
                w-full
                text-sm
                py-3
                rounded-full
              "
            >
              Start Planning
            </button>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navigation;
