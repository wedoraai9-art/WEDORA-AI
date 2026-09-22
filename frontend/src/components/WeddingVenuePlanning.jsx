import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Plus,
  Trash2,
  Search,
  CalendarDays,
  Users,
  IndianRupee,
  BedDouble,
  Car,
  Utensils,
  Phone,
  CheckCircle2,
  Star,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const DEFAULT_VENUES = [];

export default function WeddingVenuePlanning() {
  const navigate = useNavigate();

  const [venues, setVenues] = useState(() => {
    try {
      const saved = localStorage.getItem("wedora_wedding_venues");

      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error("Unable to load venues", error);
    }

    return DEFAULT_VENUES;
  });

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [cost, setCost] = useState("");
  const [date, setDate] = useState("");
  const [rooms, setRooms] = useState("");
  const [parking, setParking] = useState("Available");
  const [catering, setCatering] = useState("Available");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [search, setSearch] = useState("");
  const [showShortlisted, setShowShortlisted] = useState(false);

  const saveVenues = (updatedVenues) => {
    setVenues(updatedVenues);

    try {
      localStorage.setItem(
        "wedora_wedding_venues",
        JSON.stringify(updatedVenues)
      );
    } catch (error) {
      console.error("Unable to save venues", error);
    }
  };

  const addVenue = () => {
    if (!name.trim()) return;

    const newVenue = {
      id: Date.now(),
      name: name.trim(),
      location: location.trim(),
      capacity: capacity.trim(),
      cost: Number(cost) || 0,
      date,
      rooms: rooms.trim(),
      parking,
      catering,
      phone: phone.trim(),
      notes: notes.trim(),
      shortlisted: false,
      selected: false,
    };

    saveVenues([...venues, newVenue]);

    setName("");
    setLocation("");
    setCapacity("");
    setCost("");
    setDate("");
    setRooms("");
    setParking("Available");
    setCatering("Available");
    setPhone("");
    setNotes("");
  };

  const toggleShortlist = (id) => {
    const updatedVenues = venues.map((venue) =>
      venue.id === id
        ? {
            ...venue,
            shortlisted: !venue.shortlisted,
          }
        : venue
    );

    saveVenues(updatedVenues);
  };

  const selectVenue = (id) => {
    const updatedVenues = venues.map((venue) => ({
      ...venue,
      selected: venue.id === id,
    }));

    saveVenues(updatedVenues);
  };

  const deleteVenue = (id) => {
    saveVenues(venues.filter((venue) => venue.id !== id));
  };

  const filteredVenues = useMemo(() => {
    return venues.filter((venue) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        venue.name.toLowerCase().includes(searchText) ||
        venue.location.toLowerCase().includes(searchText);

      const matchesShortlist =
        !showShortlisted || venue.shortlisted;

      return matchesSearch && matchesShortlist;
    });
  }, [venues, search, showShortlisted]);

  const selectedVenue = venues.find((venue) => venue.selected);

  const shortlistedCount = venues.filter(
    (venue) => venue.shortlisted
  ).length;

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  };

  return (
    <div className="min-h-screen bg-[#F8F5F0] text-[#33254F]">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-[#E9E0D5] bg-[#F8F5F0]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <button
            onClick={() => navigate("/wedding-planning")}
            className="flex items-center gap-2 rounded-full border border-[#E6DCCD] bg-white px-4 py-2 text-sm font-medium text-[#4A3868] transition hover:bg-[#F3EDF7]"
          >
            <ArrowLeft size={17} />
            Back to Command Center
          </button>

          <div className="hidden items-center gap-2 text-sm font-semibold md:flex">
            <Sparkles size={17} className="text-[#A77B9D]" />
            WEDORA
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-12">
        {/* HERO */}
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#A77B9D]">
            <MapPin size={18} />
            Wedding Command Center
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-[#35244F] md:text-5xl">
            Venue Planning
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-[#776B7F]">
            Compare venues, shortlist your favourites and keep all important
            venue information organized in one place.
          </p>
        </section>

        {/* SELECTED VENUE */}
        {selectedVenue && (
          <section className="mb-8 overflow-hidden rounded-[28px] border border-[#DCC9DA] bg-gradient-to-br from-[#F3EAF2] via-white to-[#F8EEDC] p-6 shadow-[0_15px_45px_rgba(64,42,91,0.06)] md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8B6D8B]">
                  <CheckCircle2 size={16} />
                  Selected Venue
                </div>

                <h2 className="text-2xl font-semibold text-[#35244F]">
                  {selectedVenue.name}
                </h2>

                {selectedVenue.location && (
                  <p className="mt-2 flex items-center gap-2 text-sm text-[#776B7F]">
                    <MapPin size={15} />
                    {selectedVenue.location}
                  </p>
                )}
              </div>

              <div className="rounded-2xl bg-white/80 px-5 py-4">
                <p className="text-xs text-[#8C7D91]">Venue Cost</p>

                <p className="mt-1 text-xl font-semibold text-[#35244F]">
                  {formatCurrency(selectedVenue.cost)}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* STATS */}
        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[24px] border border-[#E9E0D5] bg-white p-5 shadow-[0_10px_30px_rgba(64,42,91,0.04)]">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F1E4F0] text-[#806281]">
              <MapPin size={20} />
            </div>

            <p className="text-sm text-[#8C7D91]">Venues</p>

            <p className="mt-1 text-3xl font-semibold text-[#35244F]">
              {venues.length}
            </p>
          </div>

          <div className="rounded-[24px] border border-[#E9E0D5] bg-white p-5 shadow-[0_10px_30px_rgba(64,42,91,0.04)]">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F8EEDC] text-[#9A7C4F]">
              <Star size={20} />
            </div>

            <p className="text-sm text-[#8C7D91]">Shortlisted</p>

            <p className="mt-1 text-3xl font-semibold text-[#35244F]">
              {shortlistedCount}
            </p>
          </div>

          <div className="rounded-[24px] border border-[#E9E0D5] bg-white p-5 shadow-[0_10px_30px_rgba(64,42,91,0.04)]">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF3EA] text-[#6A896F]">
              <CheckCircle2 size={20} />
            </div>

            <p className="text-sm text-[#8C7D91]">Selected</p>

            <p className="mt-1 text-xl font-semibold text-[#35244F]">
              {selectedVenue ? "1 Venue" : "None"}
            </p>
          </div>
        </section>

        {/* ADD VENUE */}
        <section className="mb-8 rounded-[28px] border border-[#E9E0D5] bg-white p-6 shadow-[0_15px_45px_rgba(64,42,91,0.05)] md:p-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F1E4F0] to-[#F8EEDC] text-[#7D6284]">
              <Plus size={21} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#35244F]">
                Add Venue
              </h2>

              <p className="text-sm text-[#8C7D91]">
                Save venue details while comparing your options.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Venue name"
              className="h-12 rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm outline-none placeholder:text-[#B0A4AE] focus:border-[#B991B5]"
            />

            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
              className="h-12 rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm outline-none placeholder:text-[#B0A4AE] focus:border-[#B991B5]"
            />

            <input
              type="number"
              min="0"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Guest capacity"
              className="h-12 rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm outline-none placeholder:text-[#B0A4AE] focus:border-[#B991B5]"
            />

            <input
              type="number"
              min="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="Venue cost ₹"
              className="h-12 rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm outline-none placeholder:text-[#B0A4AE] focus:border-[#B991B5]"
            />

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-12 rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm outline-none focus:border-[#B991B5]"
            />

            <input
              type="number"
              min="0"
              value={rooms}
              onChange={(e) => setRooms(e.target.value)}
              placeholder="Rooms available"
              className="h-12 rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm outline-none placeholder:text-[#B0A4AE] focus:border-[#B991B5]"
            />

            <select
              value={parking}
              onChange={(e) => setParking(e.target.value)}
              className="h-12 rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm outline-none focus:border-[#B991B5]"
            >
              <option>Available</option>
              <option>Limited</option>
              <option>Not Available</option>
            </select>

            <select
              value={catering}
              onChange={(e) => setCatering(e.target.value)}
              className="h-12 rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm outline-none focus:border-[#B991B5]"
            >
              <option>Available</option>
              <option>Outside Catering Allowed</option>
              <option>Not Available</option>
            </select>

            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Contact number"
              className="h-12 rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm outline-none placeholder:text-[#B0A4AE] focus:border-[#B991B5]"
            />

            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes"
              className="h-12 rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm outline-none placeholder:text-[#B0A4AE] focus:border-[#B991B5] md:col-span-2"
            />
          </div>

          <button
            onClick={addVenue}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#35244F] px-6 text-sm font-semibold text-white transition hover:bg-[#46325F] md:w-auto"
          >
            <Plus size={17} />
            Add Venue
          </button>
        </section>

        {/* SEARCH + SHORTLIST */}
        <section className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A69AA6]"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search venues..."
              className="h-12 w-full rounded-full border border-[#E5DBD0] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#B991B5]"
            />
          </div>

          <button
            onClick={() => setShowShortlisted(!showShortlisted)}
            className={`flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition ${
              showShortlisted
                ? "bg-[#35244F] text-white"
                : "border border-[#E6DCCD] bg-white text-[#6F6276] hover:bg-[#F5EFF6]"
            }`}
          >
            <Star size={16} />
            {showShortlisted ? "Showing Shortlisted" : "Show Shortlisted"}
          </button>
        </section>

        {/* VENUE LIST */}
        <section className="space-y-4">
          {filteredVenues.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-[#DCCFC1] bg-white px-6 py-16 text-center">
              <MapPin
                size={36}
                className="mx-auto mb-4 text-[#B991B5]"
              />

              <h3 className="text-lg font-semibold text-[#35244F]">
                No venues found
              </h3>

              <p className="mt-2 text-sm text-[#8C7D91]">
                Add your first venue above to start comparing options.
              </p>
            </div>
          ) : (
            filteredVenues.map((venue) => (
              <div
                key={venue.id}
                className={`rounded-[28px] border bg-white p-5 shadow-[0_10px_30px_rgba(64,42,91,0.04)] transition md:p-6 ${
                  venue.selected
                    ? "border-[#B991B5] ring-2 ring-[#B991B5]/10"
                    : "border-[#E9E0D5] hover:border-[#C9B0C7]"
                }`}
              >
                <div className="flex flex-col gap-5 lg:flex-row">
                  {/* ICON */}
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F1E4F0] to-[#F8EEDC] text-[#806281]">
                    <MapPin size={24} />
                  </div>

                  {/* CONTENT */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-semibold text-[#35244F]">
                            {venue.name}
                          </h3>

                          {venue.selected && (
                            <span className="rounded-full bg-[#EEF5EF] px-3 py-1 text-xs font-semibold text-[#66856D]">
                              Selected
                            </span>
                          )}

                          {venue.shortlisted && (
                            <span className="rounded-full bg-[#F8EEDC] px-3 py-1 text-xs font-semibold text-[#9A7C4F]">
                              Shortlisted
                            </span>
                          )}
                        </div>

                        {venue.location && (
                          <p className="mt-2 flex items-center gap-2 text-sm text-[#8C7D91]">
                            <MapPin size={14} />
                            {venue.location}
                          </p>
                        )}
                      </div>

                      <div className="text-left md:text-right">
                        <p className="text-xs text-[#8C7D91]">
                          Venue Cost
                        </p>

                        <p className="mt-1 text-xl font-semibold text-[#35244F]">
                          {formatCurrency(venue.cost)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-2xl bg-[#FCFAF7] p-3">
                        <div className="flex items-center gap-2 text-xs text-[#8C7D91]">
                          <Users size={14} />
                          Capacity
                        </div>

                        <p className="mt-1 text-sm font-semibold text-[#5D5064]">
                          {venue.capacity || "Not set"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#FCFAF7] p-3">
                        <div className="flex items-center gap-2 text-xs text-[#8C7D91]">
                          <BedDouble size={14} />
                          Rooms
                        </div>

                        <p className="mt-1 text-sm font-semibold text-[#5D5064]">
                          {venue.rooms || "Not set"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#FCFAF7] p-3">
                        <div className="flex items-center gap-2 text-xs text-[#8C7D91]">
                          <Car size={14} />
                          Parking
                        </div>

                        <p className="mt-1 text-sm font-semibold text-[#5D5064]">
                          {venue.parking}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#FCFAF7] p-3">
                        <div className="flex items-center gap-2 text-xs text-[#8C7D91]">
                          <Utensils size={14} />
                          Catering
                        </div>

                        <p className="mt-1 text-sm font-semibold text-[#5D5064]">
                          {venue.catering}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 border-t border-[#F0E8DF] pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap gap-4 text-sm text-[#8C7D91]">
                        {venue.date && (
                          <span className="flex items-center gap-2">
                            <CalendarDays size={14} />
                            {new Date(
                              `${venue.date}T00:00:00`
                            ).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        )}

                        {venue.phone && (
                          <span className="flex items-center gap-2">
                            <Phone size={14} />
                            {venue.phone}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => toggleShortlist(venue.id)}
                          className={`flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                            venue.shortlisted
                              ? "bg-[#F8EEDC] text-[#9A7C4F]"
                              : "border border-[#E6DCCD] bg-white text-[#6F6276] hover:bg-[#F5EFF6]"
                          }`}
                        >
                          <Star size={15} />
                          {venue.shortlisted
                            ? "Shortlisted"
                            : "Shortlist"}
                        </button>

                        <button
                          onClick={() => selectVenue(venue.id)}
                          className={`flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                            venue.selected
                              ? "bg-[#EEF5EF] text-[#66856D]"
                              : "bg-[#35244F] text-white hover:bg-[#46325F]"
                          }`}
                        >
                          <CheckCircle2 size={15} />
                          {venue.selected ? "Selected" : "Select Venue"}
                        </button>

                        <button
                          onClick={() => deleteVenue(venue.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-full text-[#B2A7B0] transition hover:bg-[#FBEDED] hover:text-[#B86F76]"
                          aria-label="Delete venue"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {venue.notes && (
                      <div className="mt-4 rounded-2xl bg-[#FCFAF7] p-4 text-sm leading-6 text-[#776B7F]">
                        <strong className="font-semibold text-[#5D5064]">
                          Notes:
                        </strong>{" "}
                        {venue.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </section>

        <div className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-[#9B909B]">
          <Sparkles size={14} />
          Your venue planning data is automatically saved on this device.
        </div>
      </main>
    </div>
  );
}
