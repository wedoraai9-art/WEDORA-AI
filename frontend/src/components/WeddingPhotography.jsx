import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Camera,
  Plus,
  Trash2,
  Search,
  IndianRupee,
  CalendarDays,
  Phone,
  CheckCircle2,
  Star,
  Sparkles,
  Video,
  BookOpen,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const PHOTOGRAPHY_TYPES = [
  "Traditional",
  "Candid",
  "Cinematic",
  "Pre-Wedding",
  "Drone",
  "Complete Wedding",
];

export default function WeddingPhotography() {
  const navigate = useNavigate();

  const [photographers, setPhotographers] = useState(() => {
    try {
      const saved = localStorage.getItem("wedora_wedding_photographers");
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Unable to load photographers", error);
      return [];
    }
  });

  const [name, setName] = useState("");
  const [type, setType] = useState("Candid");
  const [date, setDate] = useState("");
  const [cost, setCost] = useState("");
  const [phone, setPhone] = useState("");
  const [video, setVideo] = useState("Included");
  const [album, setAlbum] = useState("Included");
  const [notes, setNotes] = useState("");

  const [search, setSearch] = useState("");
  const [showShortlisted, setShowShortlisted] = useState(false);

  const savePhotographers = (updated) => {
    setPhotographers(updated);

    try {
      localStorage.setItem(
        "wedora_wedding_photographers",
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error("Unable to save photographers", error);
    }
  };

  const addPhotographer = () => {
    if (!name.trim()) return;

    const newPhotographer = {
      id: Date.now(),
      name: name.trim(),
      type,
      date,
      cost: Number(cost) || 0,
      phone: phone.trim(),
      video,
      album,
      notes: notes.trim(),
      shortlisted: false,
      selected: false,
    };

    savePhotographers([...photographers, newPhotographer]);

    setName("");
    setType("Candid");
    setDate("");
    setCost("");
    setPhone("");
    setVideo("Included");
    setAlbum("Included");
    setNotes("");
  };

  const toggleShortlist = (id) => {
    savePhotographers(
      photographers.map((item) =>
        item.id === id
          ? { ...item, shortlisted: !item.shortlisted }
          : item
      )
    );
  };

  const selectPhotographer = (id) => {
    savePhotographers(
      photographers.map((item) => ({
        ...item,
        selected: item.id === id,
      }))
    );
  };

  const deletePhotographer = (id) => {
    savePhotographers(
      photographers.filter((item) => item.id !== id)
    );
  };

  const filteredPhotographers = useMemo(() => {
    return photographers.filter((item) => {
      const text = search.toLowerCase();

      const matchesSearch =
        item.name.toLowerCase().includes(text) ||
        item.type.toLowerCase().includes(text);

      const matchesShortlist =
        !showShortlisted || item.shortlisted;

      return matchesSearch && matchesShortlist;
    });
  }, [photographers, search, showShortlisted]);

  const selectedPhotographer = photographers.find(
    (item) => item.selected
  );

  const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN")}`;

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
            <Camera size={18} />
            Wedding Command Center
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-[#35244F] md:text-5xl">
            Photography
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-[#776B7F]">
            Organize photographers, packages, dates and deliverables while
            keeping your wedding memories beautifully planned.
          </p>
        </section>

        {/* SELECTED PHOTOGRAPHER */}
        {selectedPhotographer && (
          <section className="mb-8 rounded-[28px] border border-[#DCC9DA] bg-gradient-to-br from-[#F3EAF2] via-white to-[#F8EEDC] p-6 shadow-[0_15px_45px_rgba(64,42,91,0.06)] md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8B6D8B]">
                  <CheckCircle2 size={16} />
                  Selected Photographer
                </div>

                <h2 className="text-2xl font-semibold text-[#35244F]">
                  {selectedPhotographer.name}
                </h2>

                <p className="mt-2 text-sm text-[#776B7F]">
                  {selectedPhotographer.type}
                </p>
              </div>

              <div className="rounded-2xl bg-white/80 px-5 py-4">
                <p className="text-xs text-[#8C7D91]">
                  Package Cost
                </p>

                <p className="mt-1 text-xl font-semibold text-[#35244F]">
                  {formatCurrency(selectedPhotographer.cost)}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* STATS */}
        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[24px] border border-[#E9E0D5] bg-white p-5 shadow-[0_10px_30px_rgba(64,42,91,0.04)]">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F1E4F0] text-[#806281]">
              <Camera size={20} />
            </div>

            <p className="text-sm text-[#8C7D91]">
              Photographers
            </p>

            <p className="mt-1 text-3xl font-semibold text-[#35244F]">
              {photographers.length}
            </p>
          </div>

          <div className="rounded-[24px] border border-[#E9E0D5] bg-white p-5 shadow-[0_10px_30px_rgba(64,42,91,0.04)]">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F8EEDC] text-[#9A7C4F]">
              <Star size={20} />
            </div>

            <p className="text-sm text-[#8C7D91]">
              Shortlisted
            </p>

            <p className="mt-1 text-3xl font-semibold text-[#35244F]">
              {photographers.filter((p) => p.shortlisted).length}
            </p>
          </div>

          <div className="rounded-[24px] border border-[#E9E0D5] bg-white p-5 shadow-[0_10px_30px_rgba(64,42,91,0.04)]">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF3EA] text-[#6A896F]">
              <CheckCircle2 size={20} />
            </div>

            <p className="text-sm text-[#8C7D91]">
              Selected
            </p>

            <p className="mt-1 text-xl font-semibold text-[#35244F]">
              {selectedPhotographer ? "1 Photographer" : "None"}
            </p>
          </div>
        </section>

        {/* ADD PHOTOGRAPHER */}
        <section className="mb-8 rounded-[28px] border border-[#E9E0D5] bg-white p-6 shadow-[0_15px_45px_rgba(64,42,91,0.05)] md:p-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F1E4F0] to-[#F8EEDC] text-[#7D6284]">
              <Plus size={21} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#35244F]">
                Add Photographer
              </h2>

              <p className="text-sm text-[#8C7D91]">
                Save photography vendors and compare their packages.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Photographer / studio"
              className="h-12 rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm outline-none placeholder:text-[#B0A4AE] focus:border-[#B991B5]"
            />

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="h-12 rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm outline-none focus:border-[#B991B5]"
            >
              {PHOTOGRAPHY_TYPES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-12 rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm outline-none focus:border-[#B991B5]"
            />

            <input
              type="number"
              min="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="Package cost ₹"
              className="h-12 rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm outline-none placeholder:text-[#B0A4AE] focus:border-[#B991B5]"
            />

            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Contact number"
              className="h-12 rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm outline-none placeholder:text-[#B0A4AE] focus:border-[#B991B5]"
            />

            <select
              value={video}
              onChange={(e) => setVideo(e.target.value)}
              className="h-12 rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm outline-none focus:border-[#B991B5]"
            >
              <option>Included</option>
              <option>Not Included</option>
              <option>Optional</option>
            </select>

            <select
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              className="h-12 rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm outline-none focus:border-[#B991B5]"
            >
              <option>Included</option>
              <option>Not Included</option>
              <option>Optional</option>
            </select>

            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes"
              className="h-12 rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm outline-none placeholder:text-[#B0A4AE] focus:border-[#B991B5]"
            />
          </div>

          <button
            onClick={addPhotographer}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#35244F] px-6 text-sm font-semibold text-white transition hover:bg-[#46325F] md:w-auto"
          >
            <Plus size={17} />
            Add Photographer
          </button>
        </section>

        {/* SEARCH */}
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
              placeholder="Search photographers..."
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
            {showShortlisted
              ? "Showing Shortlisted"
              : "Show Shortlisted"}
          </button>
        </section>

        {/* LIST */}
        <section className="space-y-4">
          {filteredPhotographers.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-[#DCCFC1] bg-white px-6 py-16 text-center">
              <Camera
                size={36}
                className="mx-auto mb-4 text-[#B991B5]"
              />

              <h3 className="text-lg font-semibold text-[#35244F]">
                No photographers found
              </h3>

              <p className="mt-2 text-sm text-[#8C7D91]">
                Add your first photography vendor above.
              </p>
            </div>
          ) : (
            filteredPhotographers.map((photographer) => (
              <div
                key={photographer.id}
                className={`rounded-[28px] border bg-white p-5 shadow-[0_10px_30px_rgba(64,42,91,0.04)] transition md:p-6 ${
                  photographer.selected
                    ? "border-[#B991B5] ring-2 ring-[#B991B5]/10"
                    : "border-[#E9E0D5] hover:border-[#C9B0C7]"
                }`}
              >
                <div className="flex flex-col gap-5 lg:flex-row">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F1E4F0] to-[#F8EEDC] text-[#806281]">
                    <Camera size={24} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-semibold text-[#35244F]">
                            {photographer.name}
                          </h3>

                          {photographer.selected && (
                            <span className="rounded-full bg-[#EEF5EF] px-3 py-1 text-xs font-semibold text-[#66856D]">
                              Selected
                            </span>
                          )}

                          {photographer.shortlisted && (
                            <span className="rounded-full bg-[#F8EEDC] px-3 py-1 text-xs font-semibold text-[#9A7C4F]">
                              Shortlisted
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-sm text-[#8C7D91]">
                          {photographer.type}
                        </p>
                      </div>

                      <div className="text-left md:text-right">
                        <p className="text-xs text-[#8C7D91]">
                          Package Cost
                        </p>

                        <p className="mt-1 text-xl font-semibold text-[#35244F]">
                          {formatCurrency(photographer.cost)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-2xl bg-[#FCFAF7] p-3">
                        <div className="flex items-center gap-2 text-xs text-[#8C7D91]">
                          <CalendarDays size={14} />
                          Event Date
                        </div>

                        <p className="mt-1 text-sm font-semibold text-[#5D5064]">
                          {photographer.date || "Not set"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#FCFAF7] p-3">
                        <div className="flex items-center gap-2 text-xs text-[#8C7D91]">
                          <Video size={14} />
                          Video
                        </div>

                        <p className="mt-1 text-sm font-semibold text-[#5D5064]">
                          {photographer.video}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#FCFAF7] p-3">
                        <div className="flex items-center gap-2 text-xs text-[#8C7D91]">
                          <BookOpen size={14} />
                          Album
                        </div>

                        <p className="mt-1 text-sm font-semibold text-[#5D5064]">
                          {photographer.album}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#FCFAF7] p-3">
                        <div className="flex items-center gap-2 text-xs text-[#8C7D91]">
                          <Phone size={14} />
                          Contact
                        </div>

                        <p className="mt-1 text-sm font-semibold text-[#5D5064]">
                          {photographer.phone || "Not set"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 border-t border-[#F0E8DF] pt-4 sm:flex-row sm:items-center sm:justify-end">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            toggleShortlist(photographer.id)
                          }
                          className={`flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                            photographer.shortlisted
                              ? "bg-[#F8EEDC] text-[#9A7C4F]"
                              : "border border-[#E6DCCD] bg-white text-[#6F6276] hover:bg-[#F5EFF6]"
                          }`}
                        >
                          <Star size={15} />
                          {photographer.shortlisted
                            ? "Shortlisted"
                            : "Shortlist"}
                        </button>

                        <button
                          onClick={() =>
                            selectPhotographer(photographer.id)
                          }
                          className={`flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                            photographer.selected
                              ? "bg-[#EEF5EF] text-[#66856D]"
                              : "bg-[#35244F] text-white hover:bg-[#46325F]"
                          }`}
                        >
                          <CheckCircle2 size={15} />
                          {photographer.selected
                            ? "Selected"
                            : "Select"}
                        </button>

                        <button
                          onClick={() =>
                            deletePhotographer(photographer.id)
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-full text-[#B2A7B0] transition hover:bg-[#FBEDED] hover:text-[#B86F76]"
                          aria-label="Delete photographer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {photographer.notes && (
                      <div className="mt-4 rounded-2xl bg-[#FCFAF7] p-4 text-sm leading-6 text-[#776B7F]">
                        <strong className="font-semibold text-[#5D5064]">
                          Notes:
                        </strong>{" "}
                        {photographer.notes}
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
          Your photography planning data is automatically saved on this device.
        </div>
      </main>
    </div>
  );
}
