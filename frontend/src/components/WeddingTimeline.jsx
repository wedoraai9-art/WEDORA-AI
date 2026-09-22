import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const DEFAULT_EVENTS = [
  {
    id: 1,
    title: "Engagement Ceremony",
    date: "",
    time: "18:00",
    category: "Engagement",
    completed: false,
  },
  {
    id: 2,
    title: "Haldi Ceremony",
    date: "",
    time: "10:00",
    category: "Haldi",
    completed: false,
  },
  {
    id: 3,
    title: "Mehndi Ceremony",
    date: "",
    time: "16:00",
    category: "Mehndi",
    completed: false,
  },
  {
    id: 4,
    title: "Sangeet Night",
    date: "",
    time: "19:00",
    category: "Sangeet",
    completed: false,
  },
  {
    id: 5,
    title: "Wedding Ceremony",
    date: "",
    time: "19:30",
    category: "Wedding",
    completed: false,
  },
  {
    id: 6,
    title: "Reception",
    date: "",
    time: "20:00",
    category: "Reception",
    completed: false,
  },
];

const CATEGORIES = [
  "Engagement",
  "Haldi",
  "Mehndi",
  "Sangeet",
  "Wedding",
  "Reception",
  "Other",
];

export default function WeddingTimeline() {
  const navigate = useNavigate();

  const [events, setEvents] = useState(() => {
    try {
      const saved = localStorage.getItem("wedora_wedding_timeline");

      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error("Unable to load timeline", error);
    }

    return DEFAULT_EVENTS;
  });

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [category, setCategory] = useState("Other");

  const saveEvents = (updatedEvents) => {
    setEvents(updatedEvents);

    try {
      localStorage.setItem(
        "wedora_wedding_timeline",
        JSON.stringify(updatedEvents)
      );
    } catch (error) {
      console.error("Unable to save timeline", error);
    }
  };

  const addEvent = () => {
    if (!title.trim()) return;

    const newEvent = {
      id: Date.now(),
      title: title.trim(),
      date,
      time,
      category,
      completed: false,
    };

    saveEvents([...events, newEvent]);

    setTitle("");
    setDate("");
    setTime("");
    setCategory("Other");
  };

  const toggleEvent = (id) => {
    const updatedEvents = events.map((event) =>
      event.id === id
        ? {
            ...event,
            completed: !event.completed,
          }
        : event
    );

    saveEvents(updatedEvents);
  };

  const deleteEvent = (id) => {
    saveEvents(events.filter((event) => event.id !== id));
  };

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const dateA = `${a.date || "9999-12-31"} ${a.time || "23:59"}`;
      const dateB = `${b.date || "9999-12-31"} ${b.time || "23:59"}`;

      return dateA.localeCompare(dateB);
    });
  }, [events]);

  const completedEvents = events.filter((event) => event.completed).length;

  const progress =
    events.length === 0
      ? 0
      : Math.round((completedEvents / events.length) * 100);

  const formatDate = (value) => {
    if (!value) return "Date not set";

    const parsed = new Date(`${value}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (value) => {
    if (!value) return "Time not set";

    const [hours, minutes] = value.split(":");
    const dateObject = new Date();

    dateObject.setHours(Number(hours), Number(minutes), 0, 0);

    return dateObject.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
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
            <Clock3 size={18} />
            Wedding Command Center
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-[#35244F] md:text-5xl">
            Wedding Timeline
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-[#776B7F]">
            Organize every ceremony, event and important moment of your
            wedding journey in one beautiful timeline.
          </p>
        </section>

        {/* PROGRESS */}
        <section className="mb-8 overflow-hidden rounded-[28px] border border-[#E9E0D5] bg-white p-6 shadow-[0_15px_45px_rgba(64,42,91,0.06)] md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-[#8C7D91]">
                TIMELINE PROGRESS
              </p>

              <div className="mt-2 flex items-end gap-3">
                <span className="text-4xl font-semibold text-[#35244F]">
                  {progress}%
                </span>

                <span className="pb-1 text-sm text-[#8C7D91]">
                  {completedEvents} of {events.length} events completed
                </span>
              </div>
            </div>

            <div className="w-full md:w-[320px]">
              <div className="mb-2 flex justify-between text-xs text-[#8C7D91]">
                <span>Your wedding journey</span>
                <span>{progress}%</span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-[#F0EAE4]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#B991B5] via-[#CBA4C5] to-[#D8B98F] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ADD EVENT */}
        <section className="mb-8 rounded-[28px] border border-[#E9E0D5] bg-white p-6 shadow-[0_15px_45px_rgba(64,42,91,0.05)] md:p-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F1E4F0] to-[#F8EEDC] text-[#7D6284]">
              <Plus size={21} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#35244F]">
                Add Timeline Event
              </h2>

              <p className="text-sm text-[#8C7D91]">
                Add ceremonies, meetings or important wedding moments.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addEvent();
                }
              }}
              placeholder="Event name"
              className="h-12 rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm text-[#35244F] outline-none placeholder:text-[#B0A4AE] focus:border-[#B991B5] focus:ring-4 focus:ring-[#B991B5]/10"
            />

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-12 rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm text-[#35244F] outline-none focus:border-[#B991B5]"
            />

            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-12 rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm text-[#35244F] outline-none focus:border-[#B991B5]"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-12 rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm text-[#35244F] outline-none focus:border-[#B991B5]"
            >
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <button
              onClick={addEvent}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#35244F] px-6 text-sm font-semibold text-white transition hover:bg-[#46325F]"
            >
              <Plus size={17} />
              Add
            </button>
          </div>
        </section>

        {/* TIMELINE */}
        <section>
          {sortedEvents.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-[#DCCFC1] bg-white px-6 py-16 text-center">
              <CalendarDays
                size={36}
                className="mx-auto mb-4 text-[#B991B5]"
              />

              <h3 className="text-lg font-semibold text-[#35244F]">
                Your timeline is empty
              </h3>

              <p className="mt-2 text-sm text-[#8C7D91]">
                Add your first wedding event above.
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* VERTICAL LINE */}
              <div className="absolute bottom-5 left-[22px] top-5 hidden w-px bg-[#DCCFC1] md:block" />

              <div className="space-y-4">
                {sortedEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`relative flex gap-4 rounded-[26px] border bg-white p-5 shadow-[0_10px_30px_rgba(64,42,91,0.04)] transition md:p-6 ${
                      event.completed
                        ? "border-[#E8E1D8] opacity-70"
                        : "border-[#E9E0D5] hover:border-[#C9B0C7]"
                    }`}
                  >
                    {/* TIMELINE DOT */}
                    <div className="relative z-10 hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F4EAF2] text-[#9A7898] md:flex">
                      <CalendarDays size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#F5EDF4] px-3 py-1 text-xs font-semibold text-[#846B88]">
                              {event.category}
                            </span>

                            {event.completed && (
                              <span className="rounded-full bg-[#EEF5EF] px-3 py-1 text-xs font-semibold text-[#66856D]">
                                Completed
                              </span>
                            )}
                          </div>

                          <h3
                            className={`text-xl font-semibold ${
                              event.completed
                                ? "text-[#9A909D] line-through"
                                : "text-[#35244F]"
                            }`}
                          >
                            {event.title}
                          </h3>

                          <div className="mt-3 flex flex-wrap gap-4 text-sm text-[#8C7D91]">
                            <span className="flex items-center gap-2">
                              <CalendarDays size={15} />
                              {formatDate(event.date)}
                            </span>

                            <span className="flex items-center gap-2">
                              <Clock3 size={15} />
                              {formatTime(event.time)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleEvent(event.id)}
                            className={`flex h-10 items-center gap-2 rounded-full px-4 text-xs font-semibold transition ${
                              event.completed
                                ? "bg-[#F2ECE8] text-[#806F76]"
                                : "bg-[#F3EAF2] text-[#765A78] hover:bg-[#EADCE8]"
                            }`}
                          >
                            {event.completed ? (
                              <CheckCircle2 size={16} />
                            ) : (
                              <Circle size={16} />
                            )}

                            {event.completed ? "Completed" : "Mark Done"}
                          </button>

                          <button
                            onClick={() => deleteEvent(event.id)}
                            className="flex h-10 w-10 items-center justify-center rounded-full text-[#B2A7B0] transition hover:bg-[#FBEDED] hover:text-[#B86F76]"
                            aria-label="Delete event"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-[#9B909B]">
          <Sparkles size={14} />
          Your wedding timeline is automatically saved on this device.
        </div>
      </main>
    </div>
  );
}
