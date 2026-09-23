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

  const filteredVenues = useMemo(() => {
    if (!searched) return [];

    return mergedVenues.filter((venue) => {
      const matchesLocation =
        !location ||
        venue.city.toLowerCase().includes(location.toLowerCase()) ||
        venue.location.toLowerCase().includes(location.toLowerCase());

      const matchesGuests =
        !guests || venue.capacity >= Number(guests);

      const matchesBudget =
        !budget || venue.startingPrice <= Number(budget);

      const matchesType =
        !selectedType || venue.type === selectedType;

      const searchableText = `
        ${venue.name}
        ${venue.city}
        ${venue.type}
        ${venue.location}
      `.toLowerCase();

      const matchesQuery =
        !query ||
        searchableText.includes(query.toLowerCase()) ||
        query.toLowerCase().includes(venue.city.toLowerCase()) ||
        query.toLowerCase().includes(venue.type.toLowerCase());

      return (
        matchesLocation &&
        matchesGuests &&
        matchesBudget &&
        matchesType &&
        matchesQuery
      );
    });
  }, [
    searched,
    mergedVenues,
    location,
    guests,
    budget,
    selectedType,
    query,
  ]);

  const handleSearch = () => {
    setSearched(true);
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
    <div className="min-h-screen bg-[#fbfaf7] text-[#302c29]">

      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-[#e8e1d9] bg-[#fbfaf7]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-[#6f6861] hover:text-[#302c29]"
          >
            <ArrowLeft size={18} />
            Back to WEDORA
          </button>

          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#b99768]" />
            <span className="text-sm tracking-[0.25em] text-[#514a44]">
              WEDORA AI
            </span>
          </div>

          <div className="w-[120px]" />
        </div>
      </header>

      {/* HERO */}
      <main>

        <section className="px-6 pb-14 pt-20">
          <div className="mx-auto max-w-5xl text-center">

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e3d8ca] bg-[#f7f1e9] px-4 py-2 text-xs tracking-[0.18em] text-[#8b7357]">
              <Sparkles size={14} />
              AI VENUE DISCOVERY
            </div>

            <h1 className="text-4xl font-light tracking-tight md:text-6xl">
              Find the venue
              <br />
              <span className="font-normal italic text-[#a88761]">
                that fits your wedding.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#777069] md:text-lg">
              Tell WEDORA what you're looking for.
              Search by your wedding requirements and discover matching venues.
            </p>

            {/* SEARCH */}
            <div className="mx-auto mt-10 max-w-4xl rounded-[28px] border border-[#ded5ca] bg-white p-3 shadow-[0_20px_60px_rgba(70,55,40,0.08)]">

              <div className="flex flex-col gap-3 md:flex-row">

                <div className="flex min-h-[64px] flex-1 items-center gap-3 rounded-2xl bg-[#faf8f5] px-5">

                  <Search
                    size={21}
                    className="shrink-0 text-[#a88761]"
                  />

                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearch();
                    }}
                    placeholder="Describe your ideal wedding venue..."
                    className="w-full bg-transparent text-[15px] outline-none placeholder:text-[#a49c94]"
                  />

                  {query && (
                    <button onClick={() => setQuery('')}>
                      <X size={17} className="text-[#99918a]" />
                    </button>
                  )}

                </div>

                <button
                  onClick={handleSearch}
                  className="flex min-h-[64px] items-center justify-center gap-2 rounded-2xl bg-[#302c29] px-8 text-sm tracking-wide text-white hover:bg-[#49423d]"
                >
                  <Search size={18} />
                  Discover Venues
                </button>

              </div>

              {/* FILTER BUTTON */}
              <div className="mt-3 flex flex-wrap items-center gap-2 px-2">

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 rounded-full border border-[#e4ddd5] px-4 py-2 text-xs text-[#665e57]"
                >
                  <SlidersHorizontal size={14} />
                  Filters
                </button>

                {selectedType && (
                  <span className="rounded-full bg-[#f4eee7] px-4 py-2 text-xs text-[#75634f]">
                    {selectedType}
                  </span>
                )}

                {(location ||
                  guests ||
                  budget ||
                  selectedType) && (
                  <button
                    onClick={clearSearch}
                    className="ml-auto text-xs text-[#9a7168] hover:underline"
                  >
                    Clear all
                  </button>
                )}

              </div>

              {/* FILTERS */}
              {showFilters && (
                <div className="mt-4 grid gap-3 border-t border-[#eee8e1] pt-4 md:grid-cols-3">

                  <div className="rounded-2xl border border-[#e5ddd4] bg-[#fcfaf8] p-4 text-left">
                    <label className="mb-2 block text-xs tracking-wide text-[#81776f]">
                      LOCATION
                    </label>

                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-[#a88761]" />

                      <input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Jaipur, Udaipur..."
                        className="w-full bg-transparent text-sm outline-none"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#e5ddd4] bg-[#fcfaf8] p-4 text-left">
                    <label className="mb-2 block text-xs tracking-wide text-[#81776f]">
                      GUESTS
                    </label>

                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-[#a88761]" />

                      <input
                        type="number"
                        value={guests}
                        onChange={(e) => setGuests(e.target.value)}
                        placeholder="300"
                        className="w-full bg-transparent text-sm outline-none"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#e5ddd4] bg-[#fcfaf8] p-4 text-left">
                    <label className="mb-2 block text-xs tracking-wide text-[#81776f]">
                      MAXIMUM BUDGET
                    </label>

                    <div className="flex items-center gap-2">
                      <IndianRupee
                        size={16}
                        className="text-[#a88761]"
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

              <p className="mb-3 text-xs tracking-[0.15em] text-[#9a9189]">
                TRY ASKING
              </p>

              <div className="flex flex-wrap justify-center gap-2">

                {suggestedQueries.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => useSuggestion(suggestion)}
                    className="rounded-full border border-[#e3dbd2] bg-white px-4 py-2 text-xs text-[#716960] hover:border-[#cbb69d] hover:bg-[#faf6f0]"
                  >
                    {suggestion}
                  </button>
                ))}

              </div>

            </div>

          </div>
        </section>

        {/* VENUE TYPES */}
        <section className="border-y border-[#ebe4dc] bg-white px-6 py-14">

          <div className="mx-auto max-w-6xl">

            <div className="mb-8 text-center">
              <p className="text-xs tracking-[0.2em] text-[#a88761]">
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
                        ? 'border-[#b99768] bg-[#f8f1e8]'
                        : 'border-[#e6dfd7] bg-[#fdfbf9] hover:border-[#cdbda9]'
                    }`}
                  >

                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f3ede5] text-[#a88761]">
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
          <section className="px-6 py-16">

            <div className="mx-auto max-w-6xl">

              <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">

                <div>
                  <p className="text-xs tracking-[0.2em] text-[#a88761]">
                    WEDORA MATCHES
                  </p>

                  <h2 className="mt-2 text-3xl font-light">
                    {filteredVenues.length} venue
                    {filteredVenues.length !== 1 ? 's' : ''} found
                  </h2>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#837b73]">
                  <ShieldCheck size={15} className="text-[#9c805d]" />
                  Venue information is continuously updated
                </div>

              </div>

              {filteredVenues.length === 0 ? (
                <div className="rounded-[28px] border border-[#e5ddd5] bg-white px-6 py-16 text-center">

                  <Search
                    size={34}
                    className="mx-auto text-[#c2b4a5]"
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
                      <div className="relative flex h-48 items-center justify-center bg-[#eee7de]">

                        <div className="text-center text-[#a49687]">
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
                                ? 'fill-[#a88761] text-[#a88761]'
                                : 'text-[#756d66]'
                            }
                          />
                        </button>

                        <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-[11px] text-[#6e655d]">
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

                          <div className="rounded-xl bg-[#faf8f5] p-3">
                            <p className="text-[10px] tracking-wide text-[#978d84]">
                              CAPACITY
                            </p>
                            <p className="mt-1 text-sm">
                              {venue.capacity} guests
                            </p>
                          </div>

                          <div className="rounded-xl bg-[#faf8f5] p-3">
                            <p className="text-[10px] tracking-wide text-[#978d84]">
                              ROOMS
                            </p>
                            <p className="mt-1 text-sm">
                              {venue.rooms}
                            </p>
                          </div>

                        </div>

                        <div className="mt-3 rounded-xl bg-[#faf8f5] p-3">

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

                          <div className="flex items-center gap-1.5 text-[11px] text-[#7d756e]">

                            {venue.status === 'Updated by WEDORA' ? (
                              <CheckCircle2
                                size={14}
                                className="text-[#718c72]"
                              />
                            ) : (
                              <Clock3
                                size={14}
                                className="text-[#a88761]"
                              />
                            )}

                            {venue.status}

                          </div>

                          <span className="text-[10px] text-[#a09891]">
                            {venue.lastUpdated}
                          </span>

                        </div>

                        {/* UPDATE BUTTON */}
                        <button
                          onClick={() =>
                            openUpdateModal(venue)
                          }
                          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-[#ded5ca] bg-[#fcfaf8] py-3 text-xs text-[#665d55] hover:bg-[#f6f0e8]"
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
        <section className="border-t border-[#e8e1d9] bg-white px-6 py-16">

          <div className="mx-auto max-w-5xl text-center">

            <ShieldCheck
              size={30}
              className="mx-auto text-[#a88761]"
            />

            <h2 className="mt-4 text-2xl font-light">
              Help WEDORA keep venue information accurate.
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#827a73]">
              Found an outdated price, incorrect capacity, changed contact
              information or another mistake? Submit an update and WEDORA
              can use verified corrections in future searches.
            </p>

          </div>

        </section>

      </main>

      {/* UPDATE MODAL */}
      {updateVenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#29231f]/45 px-5 py-8 backdrop-blur-sm">

          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[28px] bg-white p-7 shadow-2xl">

            {!updateSubmitted ? (
              <>
                <div className="flex items-start justify-between">

                  <div>
                    <p className="text-xs tracking-[0.18em] text-[#a88761]">
                      UPDATE VENUE INFORMATION
                    </p>

                    <h2 className="mt-2 text-2xl font-light">
                      {updateVenue.name}
                    </h2>
                  </div>

                  <button
                    onClick={closeUpdateModal}
                    className="rounded-full p-2 hover:bg-[#f5f1ec]"
                  >
                    <X size={19} />
                  </button>

                </div>

                <div className="mt-6 rounded-2xl bg-[#faf7f2] p-4">

                  <div className="flex gap-3">
                    <AlertCircle
                      size={19}
                      className="mt-0.5 shrink-0 text-[#a88761]"
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
                    className="flex-1 rounded-xl border border-[#ded6ce] py-3 text-sm text-[#665d55]"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={submitUpdate}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#302c29] py-3 text-sm text-white"
                  >
                    <Send size={15} />
                    Submit Update
                  </button>

                </div>
              </>
            ) : (
              <div className="py-10 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eef4ee]">
                  <CheckCircle2
                    size={30}
                    className="text-[#718c72]"
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
                  className="mt-7 rounded-xl bg-[#302c29] px-7 py-3 text-sm text-white"
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
