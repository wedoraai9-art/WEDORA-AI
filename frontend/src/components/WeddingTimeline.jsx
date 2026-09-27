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
    <div
      className="min-h-screen bg-[#FFFCF8] text-[#2D2638]"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 55% 45% at 12% 8%, rgba(201,184,255,0.18), transparent 65%), radial-gradient(ellipse 55% 45% at 88% 12%, rgba(247,183,216,0.18), transparent 65%), radial-gradient(ellipse 55% 45% at 50% 92%, rgba(169,232,255,0.14), transparent 65%)",
      }}
    >
      {/* MAIN */}
      <main className="mx-auto max-w-7xl px-5 pb-8 pt-28 md:px-8 md:pb-12 md:pt-32">
        {/* BACK NAVIGATION */}
        <div className="relative z-50 mb-7 flex items-center">
          <button
            type="button"
            onClick={() => navigate("/wedding-planning")}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[rgba(201,184,255,0.5)] bg-white/95 px-4 py-2 text-sm font-medium text-[#292431] shadow-[0_8px_24px_rgba(80,60,110,0.12)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[#C9B8FF] hover:bg-white hover:shadow-[0_12px_28px_rgba(155,124,246,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A78BFA] focus-visible:ring-offset-2"
          >
            <ArrowLeft size={17} />
            <span>Back to Command Center</span>
          </button>
        </div>
        {/* HERO */}
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#A77B9D]">
            <Clock3 size={18} />
            Wedding Command Center
          </div>

          <h1
            className="font-normal tracking-[-0.02em] text-[#17141F] md:text-6xl"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Wedding Timeline
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-[#6B617A]">
            Organize every ceremony, event and important moment of your
            wedding journey in one beautiful timeline.
          </p>
        </section>

        {/* PROGRESS */}
        <section className="mb-8 overflow-hidden rounded-[28px] border border-[rgba(201,184,255,0.28)] bg-white/70 p-6 shadow-[0_15px_45px_rgba(120,100,150,0.06)] backdrop-blur-sm md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-[#6B617A]">
                TIMELINE PROGRESS
              </p>

              <div className="mt-2 flex items-end gap-3">
                <span className="text-4xl font-semibold text-[#2D2638]">
                  {progress}%
                </span>

                <span className="pb-1 text-sm text-[#6B617A]">
                  {completedEvents} of {events.length} events completed
                </span>
              </div>
            </div>

            <div className="w-full md:w-[320px]">
              <div className="mb-2 flex justify-between text-xs text-[#6B617A]">
                <span>Your wedding journey</span>
                <span>{progress}%</span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-[#F1EDF5]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#C9B8FF] via-[#F7B7D8] to-[#A9E8FF] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ADD EVENT */}
        <section className="mb-8 rounded-[28px] border border-[rgba(201,184,255,0.28)] bg-white/70 p-6 shadow-[0_15px_45px_rgba(120,100,150,0.06)] backdrop-blur-sm md:p-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F1E4F0] to-[#F8EEDC] text-[#7D6284]">
              <Plus size={21} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#2D2638]">
                Add Timeline Event
              </h2>

              <p className="text-sm text-[#6B617A]">
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
              className="h-12 rounded-2xl border border-[rgba(201,184,255,0.32)] bg-white px-4 text-sm text-[#2D2638] outline-none placeholder:text-[#B0A4AE] focus:border-[#C9B8FF] focus:ring-4 focus:ring-[#C9B8FF]/20"
            />

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-12 rounded-2xl border border-[rgba(201,184,255,0.32)] bg-white px-4 text-sm text-[#2D2638] outline-none focus:border-[#C9B8FF]"
            />

            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-12 rounded-2xl border border-[rgba(201,184,255,0.32)] bg-white px-4 text-sm text-[#2D2638] outline-none focus:border-[#C9B8FF]"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-12 rounded-2xl border border-[rgba(201,184,255,0.32)] bg-white px-4 text-sm text-[#2D2638] outline-none focus:border-[#C9B8FF]"
            >
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <button
              onClick={addEvent}
              className="glow-btn flex h-12 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-semibold"
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

              <h3 className="text-lg font-semibold text-[#2D2638]">
                Your timeline is empty
              </h3>

              <p className="mt-2 text-sm text-[#6B617A]">
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
                    className={`relative flex gap-4 rounded-[26px] border bg-white/80 p-5 shadow-[0_10px_30px_rgba(120,100,150,0.05)] backdrop-blur-sm transition md:p-6 ${
                      event.completed
                        ? "border-[#E8E1D8] opacity-70"
                        : "border-[rgba(201,184,255,0.28)] hover:border-[#C9B0C7]"
                    }`}
                  >
                    {/* TIMELINE DOT */}
                    <div className="relative z-10 hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E7DBFF] to-[#FBE0EE] text-[#75618F] md:flex">
                      <CalendarDays size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#F3ECFA] px-3 py-1 text-xs font-semibold text-[#75618F]">
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
                                ? "text-[#9B8FA8] line-through"
                                : "text-[#2D2638]"
                            }`}
                          >
                            {event.title}
                          </h3>

                          <div className="mt-3 flex flex-wrap gap-4 text-sm text-[#6B617A]">
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
                                ? "bg-[#F1EDF5] text-[#6B617A]"
                                : "border border-white/80 bg-gradient-to-r from-[#C9B8FF] via-[#F7B7D8] to-[#A9E8FF] text-[#2D2638] shadow-[0_8px_22px_rgba(247,183,216,0.18)] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(155,124,246,0.18)]"
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
                            className="flex h-10 w-10 items-center justify-center rounded-full text-[#9B8FA8] transition hover:bg-[#FCEEF2] hover:text-[#B86F76]"
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

        <div className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-[#9B8FA8]">
          <Sparkles size={14} />
          Your wedding timeline is automatically saved on this device.
        </div>
      </main>
    </div>
  );
}
