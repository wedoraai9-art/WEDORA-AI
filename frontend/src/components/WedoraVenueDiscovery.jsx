import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  MapPin,
  Users,
  IndianRupee,
  Sparkles,
  SlidersHorizontal,
  Crown,
  Building2,
  Trees,
  Waves,
  Hotel,
  Heart,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Send,
  Clock3,
  ShieldCheck
} from 'lucide-react';

const STORAGE_KEY = 'wedora_venue_updates';

const venueTypes = [
  { name: 'Palace', icon: Crown },
  { name: 'Resort', icon: Hotel },
  { name: 'Banquet', icon: Building2 },
  { name: 'Garden', icon: Trees },
  { name: 'Beach', icon: Waves },
];

const sampleVenues = [
  {
    id: 'venue-1',
    name: 'Royal Heritage Palace',
    city: 'Jaipur',
    type: 'Palace',
    capacity: 500,
    rooms: 80,
    startingPrice: 650000,
    location: 'Jaipur, Rajasthan',
    status: 'Recently Updated',
    lastUpdated: '23 Sep 2026',
    source: 'WEDORA Venue Database',
  },
  {
    id: 'venue-2',
    name: 'The Grand Garden Estate',
    city: 'Jaipur',
    type: 'Garden',
    capacity: 800,
    rooms: 45,
    startingPrice: 450000,
    location: 'Jaipur, Rajasthan',
    status: 'Verified',
    lastUpdated: '20 Sep 2026',
    source: 'WEDORA Venue Database',
  },
  {
    id: 'venue-3',
    name: 'Royal Lake Resort',
    city: 'Udaipur',
    type: 'Resort',
    capacity: 350,
    rooms: 110,
    startingPrice: 850000,
    location: 'Udaipur, Rajasthan',
    status: 'Verified',
    lastUpdated: '18 Sep 2026',
    source: 'WEDORA Venue Database',
  },
];

const suggestedQueries = [
  'Palace wedding venue in Jaipur for 300 guests',
  'Outdoor venue near Jaipur under ₹5 lakh',
  'Wedding resort with 100 rooms near Jaipur',
  'Luxury venue for 500 guests with parking',
];

const emptyUpdate = {
  field: '',
  correctedValue: '',
  reason: '',
  source: '',
};

const WedoraVenueDiscovery = () => {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [guests, setGuests] = useState('');
  const [budget, setBudget] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [searched, setSearched] = useState(false);
  const [shortlisted, setShortlisted] = useState([]);

  const [updateVenue, setUpdateVenue] = useState(null);
  const [updateForm, setUpdateForm] = useState(emptyUpdate);
  const [updateSubmitted, setUpdateSubmitted] = useState(false);

  const [savedUpdates, setSavedUpdates] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const updateLocalStorage = (updates) => {
    setSavedUpdates(updates);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updates));
  };

  const mergedVenues = useMemo(() => {
    return sampleVenues.map((venue) => {
      const venueUpdates = savedUpdates.filter(
        (item) => item.venueId === venue.id && item.status === 'Approved'
      );

      const updatedVenue = { ...venue };

      venueUpdates.forEach((item) => {
        if (item.field === 'Capacity') {
          updatedVenue.capacity = Number(item.correctedValue);
        }

        if (item.field === 'Starting Price') {
          updatedVenue.startingPrice = Number(item.correctedValue);
        }

        if (item.field === 'Rooms') {
          updatedVenue.rooms = Number(item.correctedValue);
        }

        if (item.field === 'Location') {
          updatedVenue.location = item.correctedValue;
        }

        if (item.field === 'Venue Type') {
          updatedVenue.type = item.correctedValue;
        }
      });

      if (venueUpdates.length > 0) {
        updatedVenue.status = 'Updated by WEDORA';
        updatedVenue.lastUpdated =
          venueUpdates[venueUpdates.length - 1].date;
      }

      return updatedVenue;
    });
  }, [savedUpdates]);

  // Convert natural-language searches into the same filters used by
  // the venue database. This makes searches such as
  // "Outdoor venue near Jaipur under ₹5 lakh" actually return matching
  // venues instead of treating the whole sentence as a literal keyword.
  const parsedSearch = useMemo(() => {
    const text = query.toLowerCase().trim();

    let parsedLocation = location;
    let parsedGuests = guests;
    let parsedBudget = budget;
    let parsedType = selectedType;
    let parsedRooms = '';

    // Location
    const knownCities = [
      'jaipur',
      'udaipur',
      'jodhpur',
      'delhi',
      'mumbai',
      'goa',
      'pushkar',
      'ajmer',
    ];

    if (!parsedLocation) {
      const foundCity = knownCities.find((city) => text.includes(city));
      if (foundCity) {
        parsedLocation = foundCity;
      }
    }

    // Guests: "300 guests", "for 500 guests", etc.
    if (!parsedGuests) {
      const guestMatch = text.match(/(\d[\d,]*)\s*(?:guests?|people|persons?)/i);
      if (guestMatch) {
        parsedGuests = guestMatch[1].replace(/,/g, '');
      }
    }

    // Rooms: "100 rooms", "with 80 rooms", etc.
    const roomMatch = text.match(/(\d[\d,]*)\s*rooms?/i);
    if (roomMatch) {
      parsedRooms = roomMatch[1].replace(/,/g, '');
    }

    // Budget:
    // ₹5 lakh / 5 lakh / 5 lakhs -> 500000
    // ₹50 lakh -> 5000000
    // ₹500000 -> 500000
    if (!parsedBudget) {
      const lakhMatch = text.match(/(?:₹|rs\.?\s*)?(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs)/i);
      const numberMatch = text.match(/(?:₹|rs\.?\s*)?(\d[\d,]*)\s*(?:only|budget)?/i);

      if (lakhMatch) {
        parsedBudget = String(
          Math.round(Number(lakhMatch[1]) * 100000)
        );
      } else if (numberMatch && /budget|under|below|within|max|upto|up to|₹|rs/i.test(text)) {
        parsedBudget = numberMatch[1].replace(/,/g, '');
      }
    }

    // Venue type / intent.
    if (!parsedType) {
      if (/palace|fort|heritage/i.test(text)) {
        parsedType = 'Palace';
      } else if (/resort/i.test(text)) {
        parsedType = 'Resort';
      } else if (/banquet|indoor/i.test(text)) {
        parsedType = 'Banquet';
      } else if (/garden|outdoor|open.?air|lawn|green/i.test(text)) {
        // Our current sample database uses Garden for outdoor venues.
        parsedType = 'Garden';
      } else if (/beach/i.test(text)) {
        parsedType = 'Beach';
      }
    }

    return {
      location: parsedLocation,
      guests: parsedGuests,
      budget: parsedBudget,
      type: parsedType,
      rooms: parsedRooms,
    };
  }, [query, location, guests, budget, selectedType]);

  const filteredVenues = useMemo(() => {
    if (!searched) return [];

    const searchText = query.toLowerCase().trim();

    return mergedVenues.filter((venue) => {
      const matchesLocation =
        !parsedSearch.location ||
        venue.city.toLowerCase().includes(parsedSearch.location.toLowerCase()) ||
        venue.location.toLowerCase().includes(parsedSearch.location.toLowerCase());

      const matchesGuests =
        !parsedSearch.guests ||
        venue.capacity >= Number(parsedSearch.guests);

      const matchesBudget =
        !parsedSearch.budget ||
        venue.startingPrice <= Number(parsedSearch.budget);

      const matchesRooms =
        !parsedSearch.rooms ||
        venue.rooms >= Number(parsedSearch.rooms);

      const matchesType =
        !parsedSearch.type ||
        venue.type.toLowerCase() === parsedSearch.type.toLowerCase();

      // Only use the free-text query as a fallback when it does not contain
      // structured search information. Structured terms are already handled
      // above, so "Outdoor venue near Jaipur under ₹5 lakh" can match the
      // actual venue record.
      const structuredSearchDetected =
        Boolean(parsedSearch.location) ||
        Boolean(parsedSearch.guests) ||
        Boolean(parsedSearch.budget) ||
        Boolean(parsedSearch.type) ||
        Boolean(parsedSearch.rooms);

      const searchableText = `
        ${venue.name}
        ${venue.city}
        ${venue.type}
        ${venue.location}
      `.toLowerCase();

      const matchesFreeText =
        !searchText ||
        structuredSearchDetected ||
        searchableText.includes(searchText);

      return (
        matchesLocation &&
        matchesGuests &&
        matchesBudget &&
        matchesRooms &&
        matchesType &&
        matchesFreeText
      );
    });
  }, [searched, mergedVenues, parsedSearch, query]);

  const handleSearch = () => {
    setSearched(true);

    // Move the user to the results after the search button is pressed.
    // A short delay allows React to render the results first.
    window.setTimeout(() => {
      const results = document.getElementById('venue-results');

      if (results) {
        results.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 80);
  };

  const useSuggestion = (suggestion) => {
    setQuery(suggestion);
    setSearched(false);
  };

  const clearSearch = () => {
    setQuery('');
    setLocation('');
    setGuests('');
    setBudget('');
    setSelectedType('');
    setSearched(false);
  };

  const toggleShortlist = (venueId) => {
    setShortlisted((current) =>
      current.includes(venueId)
        ? current.filter((id) => id !== venueId)
        : [...current, venueId]
    );
  };

  const openUpdateModal = (venue) => {
    setUpdateVenue(venue);
    setUpdateForm(emptyUpdate);
    setUpdateSubmitted(false);
  };

  const closeUpdateModal = () => {
    setUpdateVenue(null);
    setUpdateForm(emptyUpdate);
    setUpdateSubmitted(false);
  };

  const submitUpdate = () => {
    if (
      !updateForm.field ||
      !updateForm.correctedValue ||
      !updateForm.reason
    ) {
      return;
    }

    const newUpdate = {
      id: Date.now(),
      venueId: updateVenue.id,
      venueName: updateVenue.name,
      field: updateForm.field,
      correctedValue: updateForm.correctedValue,
      reason: updateForm.reason,
      source: updateForm.source,
      status: 'Pending',
      date: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    };

    updateLocalStorage([...savedUpdates, newUpdate]);
    setUpdateSubmitted(true);
  };

  return (
    <div className="wedora-venue-page min-h-screen bg-gradient-to-b from-[#FBF9FF] via-[#FFFCFE] to-[#F8F6FF] text-[#2D2638]">
      {/* TRANSPARENT BACK CONTROL */}
      <div className="relative z-20 mx-auto max-w-7xl px-6 pt-[112px] md:pt-[120px]">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 rounded-full px-2 py-2 text-sm text-[#756A82] transition-all duration-200 hover:bg-white/55 hover:text-[#30283A] active:scale-[0.97] active:translate-y-[1px]"
        >
          <ArrowLeft size={18} />
          Back to WEDORA
        </button>
      </div>

      {/* HERO */}
      <main>

        <section className="relative overflow-hidden px-6 pb-14 pt-5 md:pt-7">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-[-10%] top-0 h-72 w-72 rounded-full bg-[#DCCBFF]/20 blur-[100px]" />
            <div className="absolute right-[-8%] top-10 h-80 w-80 rounded-full bg-[#F7C6DA]/20 blur-[110px]" />
            <div className="absolute bottom-[-20%] left-[35%] h-72 w-72 rounded-full bg-[#CBE8F7]/15 blur-[110px]" />
          </div>
          <div className="mx-auto max-w-5xl text-center">

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#E8DFF5] bg-[#F6F0FF] px-4 py-2 text-xs tracking-[0.18em] text-[#8E829F]">
              <Sparkles size={14} />
              AI VENUE DISCOVERY
            </div>

            <h1 className="text-4xl font-light tracking-tight md:text-6xl">
              Find the venue
              <br />
              <span className="font-normal italic text-[#9B7CF6]">
                that fits your wedding.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#746A82] md:text-lg">
              Tell WEDORA what you're looking for.
              Search by your wedding requirements and discover matching venues.
            </p>

            {/* SEARCH */}
            <div className="mx-auto mt-10 max-w-4xl rounded-[28px] border border-[#E8DFF5] bg-white p-3 shadow-[0_20px_60px_rgba(70,55,40,0.08)]">

              <div className="flex flex-col gap-3 md:flex-row">

                <div className="flex min-h-[64px] flex-1 items-center gap-3 rounded-2xl bg-[#FBF9FD] px-5">

                  <Search
                    size={21}
                    className="shrink-0 text-[#9B7CF6]"
                  />

                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearch();
                    }}
                    placeholder="Describe your ideal wedding venue..."
                    className="w-full bg-transparent text-[15px] outline-none placeholder:text-[#B0A5C0]"
                  />

                  {query && (
                    <button onClick={() => setQuery('')}>
                      <X size={17} className="text-[#A198AD]" />
                    </button>
                  )}

                </div>

                <button
                  onClick={handleSearch}
                  className="flex min-h-[64px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#D8C8FF] via-[#E8D3F4] to-[#F7C5D9] px-8 text-sm font-medium tracking-wide text-[#30283A] shadow-[0_8px_24px_rgba(155,124,246,0.16)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(155,124,246,0.22)] active:scale-[0.97] active:translate-y-[1px] transition-transform duration-150 active:scale-[0.97] active:translate-y-[1px]"
                >
                  <Search size={18} />
                  Discover Venues
                </button>

              </div>

              {/* FILTER BUTTON */}
              <div className="mt-3 flex flex-wrap items-center gap-2 px-2">

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 rounded-full border border-[#e4ddd5] px-4 py-2 text-xs text-[#6B617A]"
                >
                  <SlidersHorizontal size={14} />
                  Filters
                </button>

                {selectedType && (
                  <span className="rounded-full bg-[#F4EEFF] px-4 py-2 text-xs text-[#74628D]">
                    {selectedType}
                  </span>
                )}

                {(location ||
                  guests ||
                  budget ||
                  selectedType) && (
                  <button
                    onClick={clearSearch}
                    className="ml-auto text-xs text-[#C98EAE] hover:underline"
                  >
                    Clear all
                  </button>
                )}

              </div>

              {/* FILTERS */}
              {showFilters && (
                <div className="mt-4 grid gap-3 border-t border-[#EEE8F5] pt-4 md:grid-cols-3">

                  <div className="rounded-2xl border border-[#E9E2F1] bg-[#FCFAFE] p-4 text-left">
                    <label className="mb-2 block text-xs tracking-wide text-[#8E829F]">
                      LOCATION
                    </label>

                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-[#9B7CF6]" />

                      <input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Jaipur, Udaipur..."
                        className="w-full bg-transparent text-sm outline-none"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#E9E2F1] bg-[#FCFAFE] p-4 text-left">
                    <label className="mb-2 block text-xs tracking-wide text-[#8E829F]">
                      GUESTS
                    </label>

                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-[#9B7CF6]" />

                      <input
                        type="number"
                        value={guests}
                        onChange={(e) => setGuests(e.target.value)}
                        placeholder="300"
                        className="w-full bg-transparent text-sm outline-none"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#E9E2F1] bg-[#FCFAFE] p-4 text-left">
                    <label className="mb-2 block text-xs tracking-wide text-[#8E829F]">
                      MAXIMUM BUDGET
                    </label>

                    <div className="flex items-center gap-2">
                      <IndianRupee
                        size={16}
                        className="text-[#9B7CF6]"
                      />

                      <input
                        type="number"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        placeholder="500000"
                        className="w-full bg-transparent text-sm outline-none"
                      />
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* SUGGESTIONS */}
            <div className="mt-8">

              <p className="mb-3 text-xs tracking-[0.15em] text-[#978DA4]">
                TRY ASKING
              </p>

              <div className="flex flex-wrap justify-center gap-2">

                {suggestedQueries.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => useSuggestion(suggestion)}
                    className="rounded-full border border-[#E9E1F2] bg-white px-4 py-2 text-xs text-[#756A82] hover:border-[#C8B4EA] hover:bg-[#FAF5FF]"
                  >
                    {suggestion}
                  </button>
                ))}

              </div>

            </div>

          </div>
        </section>

        {/* VENUE TYPES */}
        <section className="border-y border-[#EEE8F4] bg-white px-6 py-14">

          <div className="mx-auto max-w-6xl">

            <div className="mb-8 text-center">
              <p className="text-xs tracking-[0.2em] text-[#9B7CF6]">
                EXPLORE BY STYLE
              </p>

              <h2 className="mt-3 text-2xl font-light">
                What kind of venue are you imagining?
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">

              {venueTypes.map((type) => {
                const Icon = type.icon;
                const active = selectedType === type.name;

                return (
                  <button
                    key={type.name}
                    onClick={() =>
                      setSelectedType(active ? '' : type.name)
                    }
                    className={`rounded-2xl border p-6 text-center transition ${
                      active
                        ? 'border-[#9B7CF6] bg-[#F5EEFF]'
                        : 'border-[#EAE4F1] bg-[#FFFDFF] hover:border-[#D2C2EE]'
                    }`}
                  >

                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F2ECF8] text-[#9B7CF6]">
                      <Icon size={22} />
                    </div>

                    <p className="mt-4 text-sm">
                      {type.name}
                    </p>

                  </button>
                );
              })}

            </div>

          </div>

        </section>

        {/* RESULTS */}
        {searched && (
          <section id="venue-results" className="scroll-mt-24 px-6 py-16">

            <div className="mx-auto max-w-6xl">

              <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">

                <div>
                  <p className="text-xs tracking-[0.2em] text-[#9B7CF6]">
                    WEDORA MATCHES
                  </p>

                  <h2 className="mt-2 text-3xl font-light">
                    {filteredVenues.length} venue
                    {filteredVenues.length !== 1 ? 's' : ''} found
                  </h2>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#8B8198]">
                  <ShieldCheck size={15} className="text-[#9B7CF6]" />
                  Venue information is continuously updated
                </div>

              </div>

              {filteredVenues.length === 0 ? (
                <div className="rounded-[28px] border border-[#E9E2F1] bg-white px-6 py-16 text-center">

                  <Search
                    size={34}
                    className="mx-auto text-[#B9ACCB]"
                  />

                  <h3 className="mt-5 text-xl font-light">
                    No matching venues yet
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#817971]">
                    Try changing your location, guest count, budget or venue
                    type.
                  </p>

                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                  {filteredVenues.map((venue) => (

                    <article
                      key={venue.id}
                      className="overflow-hidden rounded-[26px] border border-[#e4ddd5] bg-white shadow-[0_15px_45px_rgba(70,55,40,0.05)]"
                    >

                      {/* IMAGE PLACEHOLDER */}
                      <div className="relative flex h-48 items-center justify-center bg-[#EEEAF5]">

                        <div className="text-center text-[#9C91AD]">
                          <Building2
                            size={38}
                            className="mx-auto"
                          />
                          <p className="mt-2 text-xs">
                            Venue image
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            toggleShortlist(venue.id)
                          }
                          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm"
                        >
                          <Heart
                            size={18}
                            className={
                              shortlisted.includes(venue.id)
                                ? 'fill-[#9B7CF6] text-[#9B7CF6]'
                                : 'text-[#786E85]'
                            }
                          />
                        </button>

                        <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-[11px] text-[#756A82]">
                          {venue.type}
                        </div>

                      </div>

                      {/* CONTENT */}
                      <div className="p-6">

                        <div className="flex items-start justify-between gap-3">

                          <div>
                            <h3 className="text-lg font-medium">
                              {venue.name}
                            </h3>

                            <div className="mt-2 flex items-center gap-1 text-xs text-[#817971]">
                              <MapPin size={13} />
                              {venue.location}
                            </div>
                          </div>

                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">

                          <div className="rounded-xl bg-[#FBF9FD] p-3">
                            <p className="text-[10px] tracking-wide text-[#978d84]">
                              CAPACITY
                            </p>
                            <p className="mt-1 text-sm">
                              {venue.capacity} guests
                            </p>
                          </div>

                          <div className="rounded-xl bg-[#FBF9FD] p-3">
                            <p className="text-[10px] tracking-wide text-[#978d84]">
                              ROOMS
                            </p>
                            <p className="mt-1 text-sm">
                              {venue.rooms}
                            </p>
                          </div>

                        </div>

                        <div className="mt-3 rounded-xl bg-[#FBF9FD] p-3">

                          <p className="text-[10px] tracking-wide text-[#978d84]">
                            STARTING PRICE
                          </p>

                          <p className="mt-1 text-lg font-medium">
                            ₹{Number(
                              venue.startingPrice
                            ).toLocaleString('en-IN')}
                          </p>

                        </div>

                        {/* DATA STATUS */}
                        <div className="mt-4 flex items-center justify-between">

                          <div className="flex items-center gap-1.5 text-[11px] text-[#857A91]">

                            {venue.status === 'Updated by WEDORA' ? (
                              <CheckCircle2
                                size={14}
                                className="text-[#708C82]"
                              />
                            ) : (
                              <Clock3
                                size={14}
                                className="text-[#9B7CF6]"
                              />
                            )}

                            {venue.status}

                          </div>

                          <span className="text-[10px] text-[#A095AE]">
                            {venue.lastUpdated}
                          </span>

                        </div>

                        {/* UPDATE BUTTON */}
                        <button
                          onClick={() =>
                            openUpdateModal(venue)
                          }
                          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-[#E8DFF5] bg-[#FCFAFE] py-3 text-xs text-[#62586F] hover:bg-[#F4EEFF]"
                        >
                          <RefreshCw size={14} />
                          Update / Report Information
                        </button>

                      </div>

                    </article>

                  ))}

                </div>
              )}

            </div>

          </section>
        )}

        {/* TRUST SECTION */}
        <section className="border-t border-[#E9E2F2] bg-white px-6 py-16">

          <div className="mx-auto max-w-5xl text-center">

            <ShieldCheck
              size={30}
              className="mx-auto text-[#9B7CF6]"
            />

            <h2 className="mt-4 text-2xl font-light">
              Help WEDORA keep venue information accurate.
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#82778E]">
              Found an outdated price, incorrect capacity, changed contact
              information or another mistake? Submit an update and WEDORA
              can use verified corrections in future searches.
            </p>

          </div>

        </section>

      </main>

      {/* UPDATE MODAL */}
      {updateVenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#292330]/45 px-5 py-8 backdrop-blur-sm">

          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[28px] bg-white p-7 shadow-2xl">

            {!updateSubmitted ? (
              <>
                <div className="flex items-start justify-between">

                  <div>
                    <p className="text-xs tracking-[0.18em] text-[#9B7CF6]">
                      UPDATE VENUE INFORMATION
                    </p>

                    <h2 className="mt-2 text-2xl font-light">
                      {updateVenue.name}
                    </h2>
                  </div>

                  <button
                    onClick={closeUpdateModal}
                    className="rounded-full p-2 hover:bg-[#F5F0FA]"
                  >
                    <X size={19} />
                  </button>

                </div>

                <div className="mt-6 rounded-2xl bg-[#FAF6FF] p-4">

                  <div className="flex gap-3">
                    <AlertCircle
                      size={19}
                      className="mt-0.5 shrink-0 text-[#9B7CF6]"
                    />

                    <p className="text-xs leading-5 text-[#716961]">
                      Please provide accurate information. Your correction
                      will be stored for verification before it becomes part
                      of WEDORA's trusted venue data.
                    </p>
                  </div>

                </div>

                <div className="mt-6 space-y-4">

                  <div>
                    <label className="mb-2 block text-xs text-[#716961]">
                      WHAT INFORMATION IS WRONG?
                    </label>

                    <select
                      value={updateForm.field}
                      onChange={(e) =>
                        setUpdateForm({
                          ...updateForm,
                          field: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-[#ded6ce] bg-white px-4 py-3 text-sm outline-none"
                    >
                      <option value="">
                        Select information
                      </option>
                      <option value="Starting Price">
                        Starting Price
                      </option>
                      <option value="Capacity">
                        Guest Capacity
                      </option>
                      <option value="Rooms">
                        Number of Rooms
                      </option>
                      <option value="Location">
                        Location
                      </option>
                      <option value="Venue Type">
                        Venue Type
                      </option>
                      <option value="Contact">
                        Contact Information
                      </option>
                      <option value="Other">
                        Other
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs text-[#716961]">
                      CORRECT INFORMATION
                    </label>

                    <input
                      value={updateForm.correctedValue}
                      onChange={(e) =>
                        setUpdateForm({
                          ...updateForm,
                          correctedValue: e.target.value,
                        })
                      }
                      placeholder="Enter the correct information"
                      className="w-full rounded-xl border border-[#ded6ce] px-4 py-3 text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs text-[#716961]">
                      WHY SHOULD THIS BE UPDATED?
                    </label>

                    <textarea
                      value={updateForm.reason}
                      onChange={(e) =>
                        setUpdateForm({
                          ...updateForm,
                          reason: e.target.value,
                        })
                      }
                      rows={4}
                      placeholder="Explain what is incorrect or outdated..."
                      className="w-full resize-none rounded-xl border border-[#ded6ce] px-4 py-3 text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs text-[#716961]">
                      SOURCE / REFERENCE (OPTIONAL)
                    </label>

                    <input
                      value={updateForm.source}
                      onChange={(e) =>
                        setUpdateForm({
                          ...updateForm,
                          source: e.target.value,
                        })
                      }
                      placeholder="Official venue website, venue contact, etc."
                      className="w-full rounded-xl border border-[#ded6ce] px-4 py-3 text-sm outline-none"
                    />
                  </div>

                </div>

                <div className="mt-7 flex gap-3">

                  <button
                    onClick={closeUpdateModal}
                    className="flex-1 rounded-xl border border-[#ded6ce] py-3 text-sm text-[#62586F]"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={submitUpdate}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D8C8FF] via-[#E8D3F4] to-[#F7C5D9] py-3 text-sm font-semibold text-[#30283A] shadow-[0_7px_20px_rgba(155,124,246,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(155,124,246,0.22)] transition-transform duration-150 active:scale-[0.97] active:translate-y-[1px]"
                  >
                    <Send size={15} />
                    Submit Update
                  </button>

                </div>
              </>
            ) : (
              <div className="py-10 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EEF7F4]">
                  <CheckCircle2
                    size={30}
                    className="text-[#708C82]"
                  />
                </div>

                <h2 className="mt-5 text-2xl font-light">
                  Update submitted
                </h2>

                <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#817971]">
                  Thank you. WEDORA has saved your correction for verification.
                  Once approved, future venue searches can use the updated
                  information.
                </p>

                <button
                  onClick={closeUpdateModal}
                  className="mt-7 rounded-full bg-gradient-to-r from-[#D8C8FF] via-[#E8D3F4] to-[#F7C5D9] px-7 py-3 text-sm font-semibold text-[#30283A] shadow-[0_8px_24px_rgba(155,124,246,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(155,124,246,0.22)] active:scale-[0.97] active:translate-y-[1px] transition-transform duration-150 active:scale-[0.97] active:translate-y-[1px]"
                >
                  Done
                </button>

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};

export default WedoraVenueDiscovery;
