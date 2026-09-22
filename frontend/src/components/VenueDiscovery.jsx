import React, { useEffect, useState } from 'react';
import { VENUE } from '@/constants/testIds';
import { listVenues, listVendors } from '@/lib/aiService';
import { MapPin, Users, Star, Filter } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const CITIES = ['All', 'Jaipur', 'Delhi NCR', 'Goa', 'Mumbai', 'Udaipur', 'Bangalore'];
const TYPES = ['All', 'Palace', 'Farmhouse', 'Beach Resort', 'Banquet', 'Garden'];

export const VenueDiscovery = () => {
  const [tab, setTab] = useState('venues');
  const [city, setCity] = useState('All');
  const [vtype, setVtype] = useState('All');
  const [venues, setVenues] = useState([]);
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    const params = {};
    if (city !== 'All') params.city = city;
    if (vtype !== 'All') params.vtype = vtype;
    listVenues(params).then(r => setVenues(r.results || []));
  }, [city, vtype]);

  useEffect(() => {
    const params = {};
    if (city !== 'All') params.city = city;
    listVendors(params).then(r => setVendors(r.results || []));
  }, [city]);

  return (
    <section id="venues" data-testid={VENUE.section} className="relative py-24 px-4">
      <div className="max-w-6xl mx-auto text-center mb-10">
        <p className="font-heading uppercase tracking-[0.3em] text-xs text-[#988FA6] mb-4">Discovery</p>
        <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-[#2D2638] leading-tight">
          Find What Your <span className="iridescent-text italic">Wedding</span> Needs.
        </h2>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="liquid-glass rounded-full p-1 flex">
          <button
            data-testid="venues-tab-venues"
            onClick={() => setTab('venues')}
            className={`px-5 py-2 rounded-full text-sm transition ${tab === 'venues' ? 'bg-gradient-to-r from-[#C9B8FF]/70 to-[#F7B7D8]/70 text-[#2D2638] shadow-sm' : 'text-[#6B617A] hover:text-[#2D2638]'}`}
          >Venues</button>
          <button
            data-testid="venues-tab-vendors"
            id="vendors"
            onClick={() => setTab('vendors')}
            className={`px-5 py-2 rounded-full text-sm transition ${tab === 'vendors' ? 'bg-gradient-to-r from-[#C9B8FF]/70 to-[#F7B7D8]/70 text-[#2D2638] shadow-sm' : 'text-[#6B617A] hover:text-[#2D2638]'}`}
          >Vendors</button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-[#988FA6]" />
          <select data-testid={VENUE.filterCity} value={city} onChange={(e) => setCity(e.target.value)}
            className="chip !py-1.5 !cursor-pointer">
            {CITIES.map(c => <option key={c}>{c}</option>)}
          </select>
          {tab === 'venues' && (
            <select data-testid={VENUE.filterType} value={vtype} onChange={(e) => setVtype(e.target.value)}
              className="chip !py-1.5 !cursor-pointer">
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          )}
        </div>
      </div>

      {tab === 'venues' ? (
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {venues.map(v => (
            <div key={v.id} data-testid={VENUE.card(v.id)} className="pearl-card overflow-hidden">
              <div className="relative h-44 overflow-hidden">
                <img src={v.image} alt={v.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                <span className="absolute top-3 left-3 chip !py-1 !text-xs">{v.price_tier}</span>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-heading font-semibold text-[#2D2638]">{v.name}</h3>
                  <span className="text-xs text-[#988FA6]">{v.type}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#6B617A] mb-3">
                  <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{v.city}</span>
                  <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" />{v.capacity}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {v.tags.map(t => <span key={t} className="text-[10px] uppercase tracking-widest text-[#6B617A] bg-white/60 border border-white/70 rounded-full px-2 py-0.5">{t}</span>)}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#2D2638]">from {fmt(v.starting_price)}</p>
                  <button data-testid={`venue-inquire-${v.id}`} className="chip !text-xs">Inquire</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {vendors.map(v => (
            <div key={v.id} data-testid={VENUE.vendorCard(v.id)} className="pearl-card p-5">
              <p className="text-xs uppercase tracking-widest text-[#988FA6]">{v.role}</p>
              <h3 className="font-heading font-semibold text-[#2D2638] mt-1">{v.name}</h3>
              <p className="text-xs text-[#6B617A] mt-1 inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{v.city}</p>
              <div className="flex flex-wrap gap-1.5 my-3">
                {v.tags.map(t => <span key={t} className="text-[10px] uppercase tracking-widest text-[#6B617A] bg-white/60 border border-white/70 rounded-full px-2 py-0.5">{t}</span>)}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-1 text-[#2D2638]"><Star className="w-3.5 h-3.5 fill-[#F7B7D8] text-[#F58D91]" />{v.rating}</span>
                <span className="text-[#2D2638] font-medium">{v.role === 'Caterer' ? `${fmt(v.price)}/plate` : `from ${fmt(v.price)}`}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default VenueDiscovery;
