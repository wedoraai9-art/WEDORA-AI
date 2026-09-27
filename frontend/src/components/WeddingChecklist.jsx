import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const DEFAULT_TASKS = [
  {
    id: 1,
    title: "Finalize wedding date",
    category: "Planning",
    completed: true,
  },
  {
    id: 2,
    title: "Finalize wedding venue",
    category: "Venue",
    completed: false,
  },
  {
    id: 3,
    title: "Book decorator",
    category: "Decor",
    completed: false,
  },
  {
    id: 4,
    title: "Book photographer",
    category: "Photography",
    completed: false,
  },
  {
    id: 5,
    title: "Finalize catering",
    category: "Catering",
    completed: false,
  },
  {
    id: 6,
    title: "Prepare guest list",
    category: "Guests",
    completed: false,
  },
  {
    id: 7,
    title: "Book makeup artist",
    category: "Bride & Groom",
    completed: false,
  },
  {
    id: 8,
    title: "Plan wedding invitations",
    category: "Invitations",
    completed: false,
  },
  {
    id: 9,
    title: "Finalize wedding outfits",
    category: "Bride & Groom",
    completed: false,
  },
  {
    id: 10,
    title: "Arrange transportation",
    category: "Transportation",
    completed: false,
  },
];

const categories = [
  "All",
  "Planning",
  "Venue",
  "Decor",
  "Photography",
  "Catering",
  "Guests",
  "Bride & Groom",
  "Invitations",
  "Transportation",
];

export default function WeddingChecklist() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem("wedora_wedding_checklist");

      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error("Unable to load checklist", error);
    }

    return DEFAULT_TASKS;
  });

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [newTask, setNewTask] = useState("");
  const [newCategory, setNewCategory] = useState("Planning");

  const saveTasks = (updatedTasks) => {
    setTasks(updatedTasks);

    try {
      localStorage.setItem(
        "wedora_wedding_checklist",
        JSON.stringify(updatedTasks)
      );
    } catch (error) {
      console.error("Unable to save checklist", error);
    }
  };

  const toggleTask = (id) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id
        ? {
            ...task,
            completed: !task.completed,
          }
        : task
    );

    saveTasks(updatedTasks);
  };

  const deleteTask = (id) => {
    const updatedTasks = tasks.filter((task) => task.id !== id);
    saveTasks(updatedTasks);
  };

  const addTask = () => {
    const title = newTask.trim();

    if (!title) return;

    const task = {
      id: Date.now(),
      title,
      category: newCategory,
      completed: false,
    };

    saveTasks([...tasks, task]);
    setNewTask("");
  };

  const filteredTasks = useMemo(() => {
    if (selectedCategory === "All") {
      return tasks;
    }

    return tasks.filter((task) => task.category === selectedCategory);
  }, [tasks, selectedCategory]);

  const completedTasks = tasks.filter((task) => task.completed).length;
  const totalTasks = tasks.length;

  const progress =
    totalTasks === 0
      ? 0
      : Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="min-h-screen">
      {/* HEADER */}
      <header className="sticky top-0 z-40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <button className="flex items-center gap-2 rounded-full border border-[#E6DCCD] bg-white px-4 py-2 text-sm font-medium text-[#4A3868] transition hover:bg-[#F3EDF7]"
            onClick={() => navigate("/wedding-planning")}
            className="flex items-center gap-2 rounded-full border px-4 py-2 font-medium"
          >
            <ArrowLeft size={17} />
            Back to Command Center
          </button>

          <div className="hidden items-center gap-2 font-semibold md:flex">
            <Sparkles size={17} className="" />
            WEDORA
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-12">
        {/* HERO */}
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2 font-semibold uppercase tracking-[0.18em]">
            <CheckCircle2 size={18} />
            Wedding Command Center
          </div>

          <h1 className="font-semibold tracking-tight md:text-5xl">
            Wedding Checklist
          </h1>

          <p className="mt-3 max-w-2xl leading-7">
            Keep every wedding task organized in one beautiful place.
            Complete tasks, add your own, and stay in control of your
            celebration.
          </p>
        </section>

        {/* PROGRESS CARD */}
        <section className="mb-8 overflow-hidden rounded-[28px] border p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-medium">
                YOUR PROGRESS
              </p>

              <div className="mt-2 flex items-end gap-3">
                <span className="font-semibold">
                  {progress}%
                </span>

                <span className="pb-1">
                  {completedTasks} of {totalTasks} tasks completed
                </span>
              </div>
            </div>

            <div className="w-full md:w-[320px]">
              <div className="mb-2 flex justify-between">
                <span>Wedding planning</span>
                <span>{progress}%</span>
              </div>

              <div className="h-3 overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full from-[#B991B5] via-[#CBA4C5] to-[#D8B98F] duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ADD TASK */}
        <section className="mb-8 rounded-[28px] border p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl from-[#F1E4F0] to-[#F8EEDC]">
              <Plus size={21} />
            </div>

            <div>
              <h2 className="font-semibold">
                Add a Wedding Task
              </h2>

              <p className="">
                Add anything you need to remember.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_190px_auto]">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addTask();
                }
              }}
              placeholder="e.g. Book mehndi artist"
              className="h-12 rounded-2xl border px-4 outline-none placeholder:text-[#B0A4AE] focus:border-[#B991B5] focus:ring-4 focus:ring-[#B991B5]/10"
            />

            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="h-12 rounded-2xl border px-4 outline-none focus:border-[#B991B5]"
            >
              {categories
                .filter((category) => category !== "All")
                .map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
            </select>

            <button
              onClick={addTask}
              className="glow-btn flex h-12 items-center justify-center gap-2 rounded-2xl px-6 font-semibold"
            >
              <Plus size={17} />
              Add Task
            </button>
          </div>
        </section>

        {/* CATEGORY FILTER */}
        <section className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                  selectedCategory === category
                    ? "bg-[#35244F] text-white"
                    : "border border-[#E6DCCD] bg-white text-[#6F6276] hover:bg-[#F5EFF6]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {/* TASK LIST */}
        <section className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="rounded-[28px] border px-6 py-16">
              <CalendarDays
                size={34}
                className="mx-auto mb-4"
              />

              <h3 className="font-semibold">
                No tasks here yet
              </h3>

              <p className="mt-2">
                Add a new task above to start planning.
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`group flex items-center gap-4 rounded-[22px] border bg-white p-4 transition md:p-5 ${
                  task.completed
                    ? "border-[#E8E1D8] opacity-75"
                    : "border-[#E9E0D5] hover:border-[#C9B0C7] hover:shadow-[0_10px_30px_rgba(64,42,91,0.05)]"
                }`}
              >
                {/* CHECK */}
                <button
                  onClick={() => toggleTask(task.id)}
                  aria-label={
                    task.completed
                      ? "Mark task incomplete"
                      : "Mark task complete"
                  }
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition ${
                    task.completed
                      ? "bg-[#B991B5] text-white"
                      : "border-2 border-[#D9CED8] bg-white text-transparent hover:border-[#B991B5]"
                  }`}
                >
                  {task.completed ? (
                    <Check size={20} strokeWidth={2.5} />
                  ) : (
                    <Circle size={20} />
                  )}
                </button>

                {/* TASK CONTENT */}
                <div className="min-w-0 flex-1">
                  <h3
                    className={`font-medium ${
                      task.completed
                        ? "text-[#9A909D] line-through"
                        : "text-[#35244F]"
                    }`}
                  >
                    {task.title}
                  </h3>

                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded-full px-2.5 py-1 font-medium">
                      {task.category}
                    </span>
                  </div>
                </div>

                {/* DELETE */}
                <button
                  onClick={() => deleteTask(task.id)}
                  aria-label="Delete task"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))
          )}
        </section>

        {/* FOOTER NOTE */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <Sparkles size={14} />
          Your checklist is automatically saved on this device.
        </div>
      </main>
    </div>
  );
}
