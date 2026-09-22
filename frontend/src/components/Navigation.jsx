import React, { useState, useEffect } from 'react';
import { NAV } from '@/constants/testIds';
import { Menu, X } from 'lucide-react';

const LOGO_URL = 'https://customer-assets-4nw71qhi.emergentagent.net/job_iridescent-weddings/artifacts/r1g2t1cw_WEDORA.webp';

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
  if (href.startsWith('/')) { window.location.href = href; return; }
  const el = document.querySelector(href);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  else window.location.href = '/' + href;
};

export const Navigation = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <nav className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${scrolled ? 'w-[95%] max-w-6xl' : 'w-[95%] max-w-6xl'}`}>
        <div className="liquid-glass rounded-full px-4 md:px-6 py-2.5 flex items-center justify-between">
          {/* Logo */}
          <button
            data-testid={NAV.logo}
            onClick={() => scrollTo('#hero')}
            className="flex items-center gap-2 pl-1"
          >
            <img src={LOGO_URL} alt="WEDORA" className="w-9 h-9 rounded-full object-cover ring-1 ring-white/70" />
            <span className="font-heading font-semibold tracking-wide text-[#2D2638] hidden sm:inline">
              WEDORA <span className="iridescent-text">AI</span>
            </span>
          </button>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-1">
            {links.map((l) => (
              <button
                key={l.id}
                data-testid={l.id}
                onClick={() => scrollTo(l.href)}
                className="text-sm text-[#4a4257] hover:text-[#2D2638] px-3 py-1.5 rounded-full transition hover:bg-white/50"
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-2">
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
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="lg:hidden mt-2 liquid-glass-strong rounded-3xl p-3 flex flex-col gap-1">
            {links.map((l) => (
              <button
                key={l.id + '-m'}
                data-testid={l.id + '-mobile'}
                onClick={() => { scrollTo(l.href); setOpen(false); }}
                className="text-left px-4 py-2 rounded-2xl text-[#4a4257] hover:bg-white/50 transition"
              >
                {l.label}
              </button>
            ))}
          </div>
        )}
      </nav>
    </>
  );
};

export default Navigation;
