import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Users,
  WalletCards,
  MapPin,
  Camera,
  Utensils,
  Shirt,
  Car,
  Heart,
  Plus,
  ChevronRight,
} from 'lucide-react';



export default function WeddingPlanner() {
  const [weddingDate, setWeddingDate] = useState('');
  const [coupleName, setCoupleName] = useState('');
  const [city, setCity] = useState('');
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [functionDate, setFunctionDate] = useState('');

  const [functions, setFunctions] = useState([
  { name: 'Engagement', date: 'Add date', icon: Heart },
  { name: 'Haldi', date: 'Add date', icon: Heart },
  { name: 'Mehndi', date: 'Add date', icon: Heart },
  { name: 'Sangeet', date: 'Add date', icon: Heart },
  { name: 'Wedding', date: 'Add date', icon: Heart },
  { name: 'Reception', date: 'Add date', icon: Heart },
]);

  const planningCards = [
  {
    title: 'Wedding Checklist',
    desc: 'Track everything that needs to be planned before the big day.',
    icon: CheckCircle2,
  },
  {
    title: 'Wedding Timeline',
    desc: 'Create a clear timeline for every function and preparation.',
    icon: Clock3,
  },
  {
    title: 'Guest Management',
    desc: 'Manage guests, RSVP, accommodation and transportation.',
    icon: Users,
  },
  {
    title: 'Budget Planning',
    desc: 'Organise your wedding expenses and keep spending under control.',
    icon: WalletCards,
  },
  {
    title: 'Venue Planning',
    desc: 'Plan venue requirements, layouts and important venue details.',
    icon: MapPin,
  },
  {
    title: 'Photography',
    desc: 'Plan photography moments, shoots and important family portraits.',
    icon: Camera,
  },
  {
    title: 'Catering',
    desc: 'Plan menus, cuisines, counters and special dietary requirements.',
    icon: Utensils,
  },
  {
    title: 'Bride & Groom',
    desc: 'Organise outfits, jewellery, makeup and styling requirements.',
    icon: Shirt,
  },
  {
    title: 'Transportation',
    desc: 'Plan guest transfers, cars, pickups and wedding transportation.',
    icon: Car,
  },
];
  
  const countdown = useMemo(() => {
    if (!weddingDate) return null;

    const today = new Date();
    const target = new Date(`${weddingDate}T00:00:00`);
    const difference = target - today;

    if (difference <= 0) return 'Your wedding day is here ❤️';

    return `${Math.ceil(difference / (1000 * 60 * 60 * 24))} days to go`;
  }, [weddingDate]);

  return (
    <section className="min-h-screen bg-[#FCFAF8] px-4 py-10 md:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mx-auto mb-12 max-w-4xl text-center">
          <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#988FA6]">
            WEDDING PLANNER
          </p>

          <h1 className="font-display text-4xl leading-tight text-[#2D2638] sm:text-5xl lg:text-6xl">
            Plan Your Dream Wedding.
            <br />
            <span className="iridescent-text italic">
              Every Detail, Beautifully.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-[#6B617A]">
            Organise your wedding from the first decision to the final celebration
            with one intelligent planning space.
          </p>
        </div>

        {/* Wedding Overview */}
        <div className="mb-10 rounded-[28px] border border-white/80 bg-white/80 p-5 shadow-[0_20px_60px_rgba(90,70,100,0.08)] backdrop-blur md:p-7">

          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#988FA6]">
                YOUR WEDDING
              </p>
              <h2 className="mt-1 font-heading text-2xl font-semibold text-[#2D2638]">
                Wedding Overview
              </h2>
            </div>

            <Heart className="h-7 w-7 text-[#D99AAF]" />
          </div>

          <div className="grid gap-4 md:grid-cols-3">

            <div>
              <label className="mb-2 block text-sm text-[#6B617A]">
                Couple Name
              </label>
              <input
                value={coupleName}
                onChange={(e) => setCoupleName(e.target.value)}
                placeholder="e.g. Rahul & Priya"
                className="w-full rounded-2xl border border-[#E9E1E8] bg-[#FFFCFA] px-4 py-3 outline-none transition focus:border-[#C9B8FF]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-[#6B617A]">
                Wedding Date
              </label>
              <input
                type="date"
                value={weddingDate}
                onChange={(e) => setWeddingDate(e.target.value)}
                className="w-full rounded-2xl border border-[#E9E1E8] bg-[#FFFCFA] px-4 py-3 outline-none transition focus:border-[#C9B8FF]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-[#6B617A]">
                Wedding City
              </label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Jaipur"
                className="w-full rounded-2xl border border-[#E9E1E8] bg-[#FFFCFA] px-4 py-3 outline-none transition focus:border-[#C9B8FF]"
              />
            </div>

          </div>

          {(coupleName || weddingDate || city) && (
            <div className="mt-6 rounded-2xl bg-gradient-to-r from-[#F7E8F2] via-[#FFF5F0] to-[#E9F4FA] p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-[#6B617A]">Your Wedding</p>
                  <h3 className="mt-1 font-heading text-2xl font-semibold text-[#2D2638]">
                    {coupleName || 'Your Dream Wedding'}
                  </h3>

                  <p className="mt-1 text-sm text-[#6B617A]">
                    {city || 'Your city'}
                  </p>
                </div>

                {countdown && (
                  <div className="rounded-2xl bg-white/80 px-5 py-3 text-center">
                    <p className="text-xs uppercase tracking-wider text-[#988FA6]">
                      Countdown
                    </p>
                    <p className="mt-1 font-heading text-xl font-semibold text-[#2D2638]">
                      {countdown}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Functions */}
        <div className="mb-12">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#988FA6]">
                YOUR CELEBRATIONS
              </p>
              <h2 className="mt-1 font-heading text-3xl font-semibold text-[#2D2638]">
                Wedding Functions
              </h2>
            </div>

            
             
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {functions.map(({ name, date, icon: Icon }) => (
             <div
                key={name}
                onClick={() => setSelectedFunction(name)}
                role="button"
                tabIndex={0}
                className="rounded-3xl border border-white bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F7D7E8] to-[#E8E0FF]">
                    <Icon className="h-5 w-5 text-[#2D2638]" />
                  </div>

                  <ChevronRight className="h-5 w-5 text-[#B3A9B9]" />
                </div>

                <h3 className="font-heading text-lg font-semibold text-[#2D2638]">
                  {name}
                </h3>

                <p className="mt-1 text-sm text-[#8A8090]">
                  {date}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Planning Tools */}
        <div>
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.25em] text-[#988FA6]">
              PLAN EVERYTHING
            </p>

            <h2 className="mt-1 font-heading text-3xl font-semibold text-[#2D2638]">
              Your Wedding Command Center
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {planningCards.map(({ title, desc, icon: Icon }) => (
              <button
                  key={title}
                  onClick={() => {
                  if (title === "Wedding Checklist") {
                    window.location.href = "/wedding-planning/checklist";
                  }
                
                  if (title === "Wedding Timeline") {
                    window.location.href = "/wedding-planning/timeline";
                  }
                    if (title === "Guest Management") {
                        window.location.href = "/wedding-planning/guests";
                      }
                    if (title === "Budget Planning") {
                      window.location.href = "/wedding-planning/budget";
                    }
                    if (title === "Venue Planning") {
                      window.location.href = "/wedding-planning/venue";
                    }
                    if (title === "Photography") {
                        window.location.href = "/wedding-planning/photography";
                      }
                    if (title === "Catering") {
                        window.location.href = "/wedding-planning/catering";
                      }
                    if (title === "Bride & Groom") {
                        window.location.href = "/wedding-planning/couple";
                      }
                                      }}
                  className="group rounded-3xl border border-white bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F7D7E8] via-[#EDE4FF] to-[#DDF1F8]">
                  <Icon className="h-6 w-6 text-[#2D2638]" />
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-heading text-xl font-semibold text-[#2D2638]">
                      {title}
                    </h3>

                    <p className="mt-2 text-sm leading-relaxed text-[#6B617A]">
                      {desc}
                    </p>
                  </div>

                  <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-[#B5AABA] transition group-hover:translate-x-1" />
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
      {selectedFunction && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D2638]/30 px-4 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-[32px] border border-white/70 bg-white/95 p-7 shadow-2xl">
      
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#B3A9B9]">
            Your Celebration
          </p>

          <h2 className="font-heading text-2xl font-semibold text-[#2D2638]">
            {selectedFunction}
          </h2>

          <p className="mt-2 text-sm text-[#8A8090]">
            Choose the date for this wedding function.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedFunction(null);
            setFunctionDate('');
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7D7E8] text-[#2D2638] transition hover:scale-105"
        >
          ×
        </button>
      </div>

      <div className="mb-6 rounded-2xl bg-gradient-to-br from-[#F7D7E8] via-[#EDE4FF] to-[#DDF1F8] p-5">
        <label className="mb-2 block text-sm font-medium text-[#2D2638]">
          Function Date
        </label>

        <input
          type="date"
          value={functionDate}
          onChange={(e) => setFunctionDate(e.target.value)}
          className="w-full rounded-2xl border border-white bg-white px-4 py-3 text-[#2D2638] outline-none transition focus:ring-2 focus:ring-[#D7B8E8]"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => {
            setSelectedFunction(null);
            setFunctionDate('');
          }}
          className="flex-1 rounded-2xl border border-[#E8E0E8] bg-white px-5 py-3 font-medium text-[#6B6171] transition hover:bg-[#FAF7FA]"
        >
          Cancel
        </button>

        <button
          type="button"
          disabled={!functionDate}
          onClick={() => {
            setFunctions((current) =>
              current.map((item) =>
                item.name === selectedFunction
                  ? { ...item, date: functionDate }
                  : item
              )
            );

            setSelectedFunction(null);
            setFunctionDate('');
          }}
          className="flex-1 rounded-2xl bg-[#2D2638] px-5 py-3 font-medium text-white transition hover:bg-[#40354D] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save Date
        </button>
      </div>
    </div>
  </div>
)}
    </section>
  );
}
