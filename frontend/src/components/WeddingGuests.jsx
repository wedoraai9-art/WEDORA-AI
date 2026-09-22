import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Users,
  Plus,
  Trash2,
  Search,
  Phone,
  Hotel,
  Utensils,
  CheckCircle2,
  Clock3,
  XCircle,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const DEFAULT_GUESTS = [];

const RSVP_OPTIONS = ["Pending", "Attending", "Declined"];

const MEAL_OPTIONS = [
  "Not Selected",
  "Vegetarian",
  "Non-Vegetarian",
  "Jain",
  "Other",
];

export default function WeddingGuests() {
  const navigate = useNavigate();

  const [guests, setGuests] = useState(() => {
    try {
      const saved = localStorage.getItem("wedora_wedding_guests");

      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error("Unable to load guests", error);
    }

    return DEFAULT_GUESTS;
  });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [group, setGroup] = useState("");
  const [rsvp, setRsvp] = useState("Pending");
  const [accommodation, setAccommodation] = useState(false);
  const [meal, setMeal] = useState("Not Selected");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const saveGuests = (updatedGuests) => {
    setGuests(updatedGuests);

    try {
      localStorage.setItem(
        "wedora_wedding_guests",
        JSON.stringify(updatedGuests)
      );
    } catch (error) {
      console.error("Unable to save guests", error);
    }
  };

  const addGuest = () => {
    if (!name.trim()) return;

    const newGuest = {
      id: Date.now(),
      name: name.trim(),
      phone: phone.trim(),
      group: group.trim() || "General",
      rsvp,
      accommodation,
      meal,
    };

    saveGuests([...guests, newGuest]);

    setName("");
    setPhone("");
    setGroup("");
    setRsvp("Pending");
    setAccommodation(false);
    setMeal("Not Selected");
  };

  const deleteGuest = (id) => {
    saveGuests(guests.filter((guest) => guest.id !== id));
  };

  const filteredGuests = useMemo(() => {
    return guests.filter((guest) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        guest.name.toLowerCase().includes(searchText) ||
        guest.group.toLowerCase().includes(searchText) ||
        guest.phone.includes(searchText);

      const matchesFilter =
        filter === "All" || guest.rsvp === filter;

      return matchesSearch && matchesFilter;
    });
  }, [guests, search, filter]);

  const totalGuests = guests.length;

  const attending = guests.filter(
    (guest) => guest.rsvp === "Attending"
  ).length;

  const pending = guests.filter(
    (guest) => guest.rsvp === "Pending"
  ).length;

  const declined = guests.filter(
    (guest) => guest.rsvp === "Declined"
  ).length;

  const accommodationCount = guests.filter(
    (guest) => guest.accommodation
  ).length;

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
            <Users size={18} />
            Wedding Command Center
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-[#35244F] md:text-5xl">
            Guest Management
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-[#776B7F]">
            Keep your guest list organized, track RSVPs, meal preferences and
            accommodation requirements in one place.
          </p>
        </section>

        {/* STATS */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[24px] border border-[#E9E0D5] bg-white p-5 shadow-[0_10px_30px_rgba(64,42,91,0.04)]">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F1E4F0] text-[#806281]">
              <Users size={20} />
            </div>

            <p className="text-sm text-[#8C7D91]">Total Guests</p>

            <p className="mt-1 text-3xl font-semibold text-[#35244F]">
              {totalGuests}
            </p>
          </div>

          <div className="rounded-[24px] border border-[#E9E0D5] bg-white p-5 shadow-[0_10px_30px_rgba(64,42,91,0.04)]">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF3EA] text-[#6A896F]">
              <CheckCircle2 size={20} />
            </div>

            <p className="text-sm text-[#8C7D91]">Attending</p>

            <p className="mt-1 text-3xl font-semibold text-[#35244F]">
              {attending}
            </p>
          </div>

          <div className="rounded-[24px] border border-[#E9E0D5] bg-white p-5 shadow-[0_10px_30px_rgba(64,42,91,0.04)]">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F8EEDC] text-[#9A7C4F]">
              <Clock3 size={20} />
            </div>

            <p className="text-sm text-[#8C7D91]">Pending</p>

            <p className="mt-1 text-3xl font-semibold text-[#35244F]">
              {pending}
            </p>
          </div>

          <div className="rounded-[24px] border border-[#E9E0D5] bg-white p-5 shadow-[0_10px_30px_rgba(64,42,91,0.04)]">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F8E9EA] text-[#A56D73]">
              <Hotel size={20} />
            </div>

            <p className="text-sm text-[#8C7D91]">Accommodation</p>

            <p className="mt-1 text-3xl font-semibold text-[#35244F]">
              {accommodationCount}
            </p>
          </div>
        </section>

        {/* ADD GUEST */}
        <section className="mb-8 rounded-[28px] border border-[#E9E0D5] bg-white p-6 shadow-[0_15px_45px_rgba(64,42,91,0.05)] md:p-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F1E4F0] to-[#F8EEDC] text-[#7D6284]">
              <Plus size={21} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#35244F]">
                Add Guest
              </h2>

              <p className="text-sm text-[#8C7D91]">
                Add your wedding guests and their details.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Guest name"
              className="h-12 rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm outline-none placeholder:text-[#B0A4AE] focus:border-[#B991B5] focus:ring-4 focus:ring-[#B991B5]/10"
            />

            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              className="h-12 rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm outline-none placeholder:text-[#B0A4AE] focus:border-[#B991B5]"
            />

            <input
              type="text"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              placeholder="Family / group"
              className="h-12 rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm outline-none placeholder:text-[#B0A4AE] focus:border-[#B991B5]"
            />

            <select
              value={rsvp}
              onChange={(e) => setRsvp(e.target.value)}
              className="h-12 rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm outline-none focus:border-[#B991B5]"
            >
              {RSVP_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  RSVP: {option}
                </option>
              ))}
            </select>

            <select
              value={meal}
              onChange={(e) => setMeal(e.target.value)}
              className="h-12 rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm outline-none focus:border-[#B991B5]"
            >
              {MEAL_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  Meal: {option}
                </option>
              ))}
            </select>

            <label className="flex h-12 cursor-pointer items-center gap-3 rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm text-[#6F6276]">
              <input
                type="checkbox"
                checked={accommodation}
                onChange={(e) => setAccommodation(e.target.checked)}
                className="h-4 w-4 accent-[#8C6C8C]"
              />
              Accommodation required
            </label>
          </div>

          <button
            onClick={addGuest}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#35244F] px-6 text-sm font-semibold text-white transition hover:bg-[#46325F] md:w-auto"
          >
            <Plus size={17} />
            Add Guest
          </button>
        </section>

        {/* SEARCH + FILTER */}
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
              placeholder="Search guests..."
              className="h-12 w-full rounded-full border border-[#E5DBD0] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#B991B5]"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto">
            {["All", ...RSVP_OPTIONS].map((option) => (
              <button
                key={option}
                onClick={() => setFilter(option)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                  filter === option
                    ? "bg-[#35244F] text-white"
                    : "border border-[#E6DCCD] bg-white text-[#6F6276] hover:bg-[#F5EFF6]"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </section>

        {/* GUEST LIST */}
        <section className="space-y-3">
          {filteredGuests.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-[#DCCFC1] bg-white px-6 py-16 text-center">
              <Users
                size={36}
                className="mx-auto mb-4 text-[#B991B5]"
              />

              <h3 className="text-lg font-semibold text-[#35244F]">
                No guests found
              </h3>

              <p className="mt-2 text-sm text-[#8C7D91]">
                Add your first guest above to start building your guest list.
              </p>
            </div>
          ) : (
            filteredGuests.map((guest) => (
              <div
                key={guest.id}
                className="group rounded-[24px] border border-[#E9E0D5] bg-white p-5 shadow-[0_10px_30px_rgba(64,42,91,0.04)] transition hover:border-[#C9B0C7]"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#F1E4F0] to-[#F8EEDC] text-sm font-semibold text-[#765A78]">
                    {guest.name
                      .split(" ")
                      .map((word) => word[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-[#35244F]">
                        {guest.name}
                      </h3>

                      <span className="rounded-full bg-[#F5EDF4] px-3 py-1 text-xs font-semibold text-[#846B88]">
                        {guest.group}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          guest.rsvp === "Attending"
                            ? "bg-[#EEF5EF] text-[#66856D]"
                            : guest.rsvp === "Declined"
                            ? "bg-[#FBEDED] text-[#A56D73]"
                            : "bg-[#F8EEDC] text-[#9A7C4F]"
                        }`}
                      >
                        {guest.rsvp}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-[#8C7D91]">
                      {guest.phone && (
                        <span className="flex items-center gap-2">
                          <Phone size={14} />
                          {guest.phone}
                        </span>
                      )}

                      {guest.meal !== "Not Selected" && (
                        <span className="flex items-center gap-2">
                          <Utensils size={14} />
                          {guest.meal}
                        </span>
                      )}

                      {guest.accommodation && (
                        <span className="flex items-center gap-2">
                          <Hotel size={14} />
                          Accommodation
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => deleteGuest(guest.id)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-full text-[#B2A7B0] transition hover:bg-[#FBEDED] hover:text-[#B86F76] md:self-center"
                    aria-label="Delete guest"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        <div className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-[#9B909B]">
          <Sparkles size={14} />
          Your guest list is automatically saved on this device.
        </div>
      </main>
    </div>
  );
}
