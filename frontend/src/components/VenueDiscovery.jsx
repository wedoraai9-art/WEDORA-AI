import React, { useEffect, useState } from 'react';
import { VENUE } from '@/constants/testIds';
import { listVenues, listVendors } from '@/lib/aiService';
import { MapPin, Users, Star, Filter, Sparkles } from 'lucide-react';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);

const CITIES = [
  'All',
  'Jaipur',
  'Delhi NCR',
  'Goa',
  'Mumbai',
  'Udaipur',
  'Bangalore',
];

const TYPES = [
  'All',
  'Palace',
  'Farmhouse',
  'Beach Resort',
  'Banquet',
  'Garden',
];

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

    listVenues(params).then((r) => setVenues(r.results || []));
  }, [city, vtype]);

  useEffect(() => {
    const params = {};

    if (city !== 'All') params.city = city;

    listVendors(params).then((r) => setVendors(r.results || []));
  }, [city]);

  return (
    <section
      id="venues"
      data-testid={VENUE.section}
      className="relative overflow-hidden py-24 px-4"
    >
      {/* Soft WEDORA pastel background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-12%] top-[8%] h-[420px] w-[420px] rounded-full bg-[#DCCBFF]/20 blur-[110px]" />
        <div className="absolute right-[-10%] top-[18%] h-[420px] w-[420px] rounded-full bg-[#F7C6DA]/20 blur-[110px]" />
        <div className="absolute bottom-[-15%] left-[35%] h-[380px] w-[380px] rounded-full bg-[#CBE8F7]/15 blur-[120px]" />
      </div>

      {/* Header */}
      <div className="max-w-6xl mx-auto text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#E8DFF5] bg-white/70 px-4 py-2 shadow-[0_8px_30px_rgba(93,76,120,0.05)] backdrop-blur-md mb-5">
          <Sparkles className="w-3.5 h-3.5 text-[#9B7CF6]" />

          <p className="font-heading uppercase tracking-[0.28em] text-[10px] text-[#8E829F]">
            WEDORA AI DISCOVERY
          </p>
        </div>

        <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-[#2D2638] leading-[1.05]">
          Find What Your{' '}
          <span className="iridescent-text italic">
            Wedding
          </span>{' '}
          Needs.
        </h2>

        <p className="mt-5 max-w-2xl mx-auto text-sm sm:text-base leading-7 text-[#746A82]">
          Discover beautiful venues and trusted wedding professionals,
          curated around your celebration, style and requirements.
        </p>
      </div>

      {/* Tabs + Filters */}
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-4 mb-8">
        {/* Tabs */}
        <div className="rounded-full border border-[#E8DFF5] bg-white/65 p-1.5 flex shadow-[0_8px_30px_rgba(93,76,120,0.05)] backdrop-blur-xl">
          <button
            data-testid="venues-tab-venues"
            onClick={() => setTab('venues')}
            className={`
              relative px-6 py-2.5 rounded-full text-sm font-medium
              transition-all duration-300
              ${
                tab === 'venues'
                  ? 'bg-gradient-to-r from-[#D8C8FF] via-[#E8D3F4] to-[#F7C5D9] text-[#30283A] shadow-[0_5px_18px_rgba(183,155,230,0.22)]'
                  : 'text-[#81758F] hover:text-[#3B3247] hover:bg-white/70'
              }
            `}
          >
            Venues
          </button>

          <button
            data-testid="venues-tab-vendors"
            id="vendors"
            onClick={() => setTab('vendors')}
            className={`
              relative px-6 py-2.5 rounded-full text-sm font-medium
              transition-all duration-300
              ${
                tab === 'vendors'
                  ? 'bg-gradient-to-r from-[#D8C8FF] via-[#E8D3F4] to-[#F7C5D9] text-[#30283A] shadow-[0_5px_18px_rgba(183,155,230,0.22)]'
                  : 'text-[#81758F] hover:text-[#3B3247] hover:bg-white/70'
              }
            `}
          >
            Vendors
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-full border border-[#E8DFF5] bg-white/70">
            <Filter className="w-4 h-4 text-[#9B7CF6]" />
          </div>

          <select
            data-testid={VENUE.filterCity}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="
              rounded-full border border-[#E8DFF5]
              bg-white/75 backdrop-blur-md
              px-4 py-2
              text-xs sm:text-sm
              text-[#5F556E]
              outline-none cursor-pointer
              shadow-[0_5px_20px_rgba(93,76,120,0.04)]
              transition-all duration-200
              hover:border-[#CDB9F5]
              focus:border-[#B9A0F1]
            "
          >
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          {tab === 'venues' && (
            <select
              data-testid={VENUE.filterType}
              value={vtype}
              onChange={(e) => setVtype(e.target.value)}
              className="
                rounded-full border border-[#E8DFF5]
                bg-white/75 backdrop-blur-md
                px-4 py-2
                text-xs sm:text-sm
                text-[#5F556E]
                outline-none cursor-pointer
                shadow-[0_5px_20px_rgba(93,76,120,0.04)]
                transition-all duration-200
                hover:border-[#CDB9F5]
                focus:border-[#B9A0F1]
              "
            >
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* VENUES */}
      {tab === 'venues' ? (
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {venues.map((v) => (
            <div
              key={v.id}
              data-testid={VENUE.card(v.id)}
              className="
                group relative overflow-hidden
                rounded-[24px]
                border border-[#E9E1F2]
                bg-white/72
                backdrop-blur-xl
                shadow-[0_15px_45px_rgba(72,54,95,0.07)]
                transition-all duration-500
                hover:-translate-y-1
                hover:border-[#D4C4EE]
                hover:shadow-[0_22px_55px_rgba(72,54,95,0.11)]
              "
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={v.image}
                  alt={v.name}
                  className="
                    w-full h-full object-cover
                    transition-transform duration-700
                    group-hover:scale-105
                  "
                />

                {/* Image overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#241D2D]/35 via-transparent to-transparent" />

                {/* Price tier */}
                <span
                  className="
                    absolute top-3 left-3
                    rounded-full
                    border border-white/60
                    bg-white/80
                    backdrop-blur-md
                    px-3 py-1.5
                    text-[10px]
                    uppercase
                    tracking-[0.15em]
                    font-medium
                    text-[#554A64]
                    shadow-sm
                  "
                >
                  {v.price_tier}
                </span>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-heading font-semibold text-[#30283A] leading-5">
                    {v.name}
                  </h3>

                  <span className="shrink-0 text-[11px] text-[#9589A2]">
                    {v.type}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-[#756A82] mb-4">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#9B7CF6]" />
                    {v.city}
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#C69BCF]" />
                    {v.capacity}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-5">
                  {v.tags.map((t) => (
                    <span
                      key={t}
                      className="
                        text-[9px]
                        uppercase
                        tracking-[0.13em]
                        text-[#756A82]
                        bg-[#FAF8FC]
                        border border-[#ECE5F3]
                        rounded-full
                        px-2.5 py-1
                      "
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[#30283A]">
                    from {fmt(v.starting_price)}
                  </p>

                  <button
                    data-testid={`venue-inquire-${v.id}`}
                    className="
                      rounded-full
                      border border-[#DED1F1]
                      bg-gradient-to-r
                      from-[#F1EBFF]
                      to-[#FFF0F6]
                      px-4 py-2
                      text-[11px]
                      font-medium
                      text-[#5D506D]
                      shadow-[0_5px_15px_rgba(145,117,190,0.08)]
                      transition-all duration-300
                      hover:-translate-y-0.5
                      hover:border-[#C9B6EA]
                      hover:text-[#352B42]
                    "
                  >
                    Inquire
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* VENDORS */
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {vendors.map((v) => (
            <div
              key={v.id}
              data-testid={VENUE.vendorCard(v.id)}
              className="
                group relative
                rounded-[22px]
                border border-[#E9E1F2]
                bg-white/72
                backdrop-blur-xl
                p-5
                shadow-[0_12px_35px_rgba(72,54,95,0.06)]
                transition-all duration-400
                hover:-translate-y-1
                hover:border-[#D4C4EE]
                hover:shadow-[0_18px_45px_rgba(72,54,95,0.10)]
              "
            >
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#9589A2]">
                {v.role}
              </p>

              <h3 className="font-heading font-semibold text-[#30283A] mt-1.5">
                {v.name}
              </h3>

              <p className="text-xs text-[#756A82] mt-1.5 inline-flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-[#9B7CF6]" />
                {v.city}
              </p>

              <div className="flex flex-wrap gap-1.5 my-4">
                {v.tags.map((t) => (
                  <span
                    key={t}
                    className="
                      text-[9px]
                      uppercase
                      tracking-[0.12em]
                      text-[#756A82]
                      bg-[#FAF8FC]
                      border border-[#ECE5F3]
                      rounded-full
                      px-2 py-1
                    "
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm pt-2 border-t border-[#EEE8F4]">
                <span className="inline-flex items-center gap-1.5 text-[#4A4057] font-medium">
                  <Star
                    className="w-3.5 h-3.5 fill-[#F5B8D1] text-[#D995B7]"
                  />
                  {v.rating}
                </span>

                <span className="text-[#30283A] font-semibold">
                  {v.role === 'Caterer'
                    ? `${fmt(v.price)}/plate`
                    : `from ${fmt(v.price)}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty states */}
      {tab === 'venues' && venues.length === 0 && (
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F4EEFF] border border-[#E5D9F7]">
            <Sparkles className="w-5 h-5 text-[#9B7CF6]" />
          </div>

          <h3 className="font-display text-2xl text-[#30283A]">
            No venues found
          </h3>

          <p className="mt-2 text-sm text-[#81758F]">
            Try changing your city or venue type to discover more options.
          </p>
        </div>
      )}

      {tab === 'vendors' && vendors.length === 0 && (
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F4EEFF] border border-[#E5D9F7]">
            <Sparkles className="w-5 h-5 text-[#9B7CF6]" />
          </div>

          <h3 className="font-display text-2xl text-[#30283A]">
            No vendors found
          </h3>

          <p className="mt-2 text-sm text-[#81758F]">
            Try changing your city to discover more wedding professionals.
          </p>
        </div>
      )}
    </section>
  );
};

export default VenueDiscovery;
