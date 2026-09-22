import React from 'react';
import { FOOTER } from '@/constants/testIds';
import { Instagram, Twitter, Facebook } from 'lucide-react';

const LOGO_URL = 'https://customer-assets-4nw71qhi.emergentagent.net/job_iridescent-weddings/artifacts/r1g2t1cw_WEDORA.webp';

export const Footer = () => (
  <footer data-testid={FOOTER.section} className="relative pt-16 pb-8 px-4 border-t border-white/70">
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
      <div className="md:col-span-2">
        <div className="flex items-center gap-3 mb-4">
          <img src={LOGO_URL} alt="WEDORA" className="w-10 h-10 rounded-full object-cover ring-1 ring-white/70" />
          <span className="font-heading font-semibold text-lg text-[#2D2638]">
            WEDORA <span className="iridescent-text">AI</span>
          </span>
        </div>
        <p className="text-[#6B617A] max-w-md leading-relaxed">
          Your AI Wedding Companion. From the first idea to the final celebration, WEDORA helps you plan it all.
        </p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-[#988FA6] mb-3">Product</p>
        <ul className="space-y-1.5 text-sm text-[#4a4257]">
          <li><a href="#capabilities" className="hover:text-[#2D2638]">Plan Wedding</a></li>
          <li><a href="#designer" className="hover:text-[#2D2638]">AI Designer</a></li>
          <li><a href="#budget" className="hover:text-[#2D2638]">Budget</a></li>
          <li><a href="#venues" className="hover:text-[#2D2638]">Venues</a></li>
          <li><a href="#vendors" className="hover:text-[#2D2638]">Vendors</a></li>
        </ul>
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-[#988FA6] mb-3">Company</p>
        <ul className="space-y-1.5 text-sm text-[#4a4257]">
          <li><a href="#about" className="hover:text-[#2D2638]">About</a></li>
          <li><a href="#" className="hover:text-[#2D2638]">Contact</a></li>
          <li><a href="#" className="hover:text-[#2D2638]">Privacy</a></li>
          <li><a href="#" className="hover:text-[#2D2638]">Terms</a></li>
        </ul>
      </div>
    </div>

    <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-white/70 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-xs text-[#988FA6]">© {new Date().getFullYear()} WEDORA AI · Crafted with love & code.</p>
      <div className="flex items-center gap-3">
        <a href="#" className="w-9 h-9 rounded-full liquid-glass flex items-center justify-center hover:scale-105 transition"><Instagram className="w-4 h-4 text-[#4a4257]" /></a>
        <a href="#" className="w-9 h-9 rounded-full liquid-glass flex items-center justify-center hover:scale-105 transition"><Twitter className="w-4 h-4 text-[#4a4257]" /></a>
        <a href="#" className="w-9 h-9 rounded-full liquid-glass flex items-center justify-center hover:scale-105 transition"><Facebook className="w-4 h-4 text-[#4a4257]" /></a>
      </div>
    </div>
  </footer>
);

export default Footer;
