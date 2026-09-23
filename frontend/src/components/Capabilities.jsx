import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CAPS } from '@/constants/testIds';
import { Gem,  Flower2, Building2, Handshake,  } from 'lucide-react';

const items = [
  { icon: Gem,       title: 'Wedding Planning',  desc: 'Complete planning, timelines and checklists tailored to your date.', tint: 'from-[#C9B8FF]/40 to-[#F7B7D8]/40' },
  { icon: Flower2,   title: 'AI Wedding Design', desc: 'Generate themes, palettes, décor concepts and styling ideas.',       tint: 'from-[#F7B7D8]/40 to-[#F5A9B8]/40' },
  { icon: Building2, title: 'Venue Discovery',   desc: 'Discover venues by city, guest count and budget.',                   tint: 'from-[#FFF8EF]/60 to-[#F7B7D8]/40' },
  { icon: Handshake, title: 'Vendor Discovery',  desc: 'Photographers, caterers, decorators, MUAs and more.',                 tint: 'from-[#A9E8F4]/40 to-[#F7B7D8]/40' },
 ];

export const Capabilities = () => {
  const navigate = useNavigate();

  return (
  <section id="capabilities" data-testid={CAPS.section} className="relative py-24 px-4">
    <div className="max-w-6xl mx-auto text-center mb-12">
      <p className="font-heading uppercase tracking-[0.3em] text-xs text-[#988FA6] mb-4">Capabilities</p>
      <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-[#2D2638] leading-tight">
        Everything Your Wedding Needs.<br />
        <span className="iridescent-text italic">One Intelligent AI.</span>
      </h2>
    </div>

    <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {items.map(({ icon: Icon, title, desc, tint }) => (
        <div
          key={title}
          data-testid={CAPS.card(title)}
          onClick={() => {
  if (title === 'Wedding Planning') {
   navigate('/wedding-planning');
 } else if (title === 'AI Wedding Design') {
  document.getElementById('designer')?.scrollIntoView({ behavior: 'smooth' });
} else if (title === 'Venue Discovery') {
  navigate('/venue-discovery');
}}
         className={`pearl-card p-6 flex flex-col items-start ${
         title === 'AI Wedding Design' ? 'cursor-pointer' : ''
         }`}
        >
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tint} flex items-center justify-center mb-4 border border-white/70 shadow-sm`}>
            <Icon className="w-6 h-6 text-[#2D2638]" strokeWidth={1.6} />
          </div>
          <h3 className="font-heading font-semibold text-lg text-[#2D2638] mb-1.5">{title}</h3>
          <p className="text-sm text-[#6B617A] leading-relaxed">{desc}</p>
        </div>
      ))}
    </div>
 </section>
);
}

export default Capabilities;
