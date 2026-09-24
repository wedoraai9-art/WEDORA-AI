import React, { useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  CheckSquare,
  Users,
  Wallet,
  FileText,
  Bell,
  Sparkles,
  MapPin,
  Heart,
} from 'lucide-react';

const WeddingWorkspace = ({ wedding, onBack }) => {
  const [activeModule, setActiveModule] = useState(null);
 const [showTaskForm, setShowTaskForm] = useState(false);
const [taskTitle, setTaskTitle] = useState("");
const [tasks, setTasks] = useState([]);
  if (!wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#2D2638]">
        Wedding not found.
      </div>
    );
  }

  const formatDate = (date) => {
    if (!date) return 'Date not set';

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;

    return parsed.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';

    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  const modules = [
    {
      title: 'Overview',
      description: 'Wedding details, timeline and important information',
      icon: Heart,
    },
    {
      title: 'Tasks',
      description: 'Plan and track everything that needs to be done',
      icon: CheckSquare,
    },
    {
      title: 'Clients',
      description: 'Manage bride, groom and client communication',
      icon: Users,
    },
    {
      title: 'Budget & Payments',
      description: 'Track budget, expenses, advances and payments',
      icon: Wallet,
    },
    {
      title: 'Documents',
      description: 'Keep contracts, bills and important files organized',
      icon: FileText,
    },
    {
      title: 'Notifications',
      description: 'Important reminders and wedding updates',
      icon: Bell,
    },
    {
      title: 'AI Assistant',
      description: 'Get AI-powered help for this wedding',
      icon: Sparkles,
    },
  ];

  return (
   <div className="min-h-screen bg-[#fcf9ff] px-4 py-6 md:px-8 text-[#2D2638]">
      {/* Header */}
      <div className="max-w-7xl mx-auto">

        <button
          onClick={onBack}
          className="flex items-center gap-2  text-[#8B8194] hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Weddings
        </button>

        {/* Wedding Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-[#eadff2] bg-white/80 shadow-[0_20px_60px_rgba(190,160,210,0.12)] backdrop-blur-xl p-6 md:p-8 mb-6">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-pink-400/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-purple-400/10 blur-3xl" />

          <div className="relative z-10">

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full  bg-[#f6efff] text-xs  text-[#8B8194] mb-4">
                  <Heart className="w-3.5 h-3.5" />
                  Wedding Workspace
                </div>

               <h1 className="text-3xl md:text-4xl font-semibold text-[#2D2638]">
                  {wedding.wedding_name || 'Untitled Wedding'}
                </h1>

               <p className="text-[#6B6175] mt-2">
                  {wedding.bride_name || 'Bride'}{' '}
                  <span className="text-pink-300">&</span>{' '}
                  {wedding.groom_name || 'Groom'}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">

                <div className="rounded-2xl bg-[#faf7ff] border border-white/10 px-4 py-3">
                  <div className="flex items-center gap-2 text-[#8B8194] text-xs">
                    <CalendarDays className="w-4 h-4" />
                    Wedding Date
                  </div>

                  <p className="text-[#3F3748] mt-1 font-medium">
                    {formatDate(wedding.wedding_date)}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#faf7ff] border border-white/10 px-4 py-3">
                 <div className="flex items-center gap-2 text-[#8B8194] text-xs">
                    <MapPin className="w-4 h-4" />
                    Location
                  </div>

                 <p className="text-[#3F3748] mt-1 font-medium">
                    {wedding.city || 'Location not set'}
                  </p>
                </div>

              </div>

            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">

              <div className="rounded-2xl bg-white/80 border border-white/10 p-4">
                <p className="text-xs text-[#8B8194]">Guests</p>
                <p className="text-xl font-semibold text-[#3F3748] mt-1">
                  {wedding.guest_count || '—'}
                </p>
              </div>

              <div className="rounded-2xl bg-white/80 border border-[#eadff2] p-4">
                <p className="text-xs text-[#8B8194]">Budget</p>
                <p className="text-xl font-semibold text-[#3F3748] mt-1">
                  {formatCurrency(wedding.budget)}
                </p>
              </div>

              <div className="rounded-2xl bg-white/80 border border-[#eadff2] p-4">
                <p className="text-xs text-[#8B8194]">Venue</p>
                <p className="text-sm font-medium text-[#3F3748] mt-1 truncate">
                  {wedding.venue || 'Not set'}
                </p>
              </div>

              <div className="rounded-2xl bg-white/80 border border-white/10 p-4">
                <p className="text-xs text-[#8B8194]">Status</p>
                <p className="text-sm font-medium text-[#3F3748] mt-1 capitalize">
                  {(wedding.status || 'upcoming').replace('_', ' ')}
                </p>
              </div>

            </div>

          </div>
        </div>

        {/* Workspace Modules */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-[#2D2638]">
            Wedding Management
          </h2>

          <p className="text-[#6B6175] text-sm mt-1">
            Everything you need to manage this wedding in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {modules.map((module) => {
            const Icon = module.icon;

            return (
             <button
                key={module.title}
                type="button"
               onClick={() => {
                setActiveModule(module.title);
             setTimeout(() => {
                document.getElementById("wedding-module")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start"
                });
              }, 100);
              }}
                className="group text-left rounded-2xl border border-[#eadff2] bg-white/80 hover:bg-white hover:border-[#d9c7e6] shadow-[0_10px_30px_rgba(190,160,210,0.08)] transition-all duration-200 p-5"
              >

                <div className="w-11 h-11 rounded-xl bg-[#f4eafa] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5 text-[#8B6AA8]" />
                </div>

                <h3 className="text-[#2D2638] font-medium">
                  {module.title}
                </h3>

                <p className="text-[#6B6175] text-sm mt-1 leading-relaxed">
                  {module.description}
                </p>

              </button>
            );
          })}

        </div>
{activeModule && (
 <div id="wedding-module" className="mt-6 rounded-2xl border border-[#eadff2] bg-white/80 p-6 shadow-[0_10px_30px_rgba(190,160,210,0.08)]">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-[#2D2638]">
        {activeModule}
      </h3>
      <button
        type="button"
        onClick={() => setActiveModule(null)}
        className="text-sm text-[#8B6AA8] hover:text-[#6B4F82]"
      >
        Back
      </button>
    </div>
   <p className="mt-2 text-sm text-[#6B6175]">
{activeModule === "Tasks"
  ? "Manage and track everything that needs to be done for this wedding."
  : "Wedding overview and important details."}
</p>
{activeModule === "Tasks" && (
  <div className="mb-5 rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-[#8B8194]">Task Management</p>
        <h4 className="text-lg font-semibold text-[#3F3748] mt-1">
          Wedding Tasks
        </h4>
        <p className="text-sm text-[#6B6175] mt-1">
          Create, organize and track tasks for this wedding.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setShowTaskForm(true)}
        className="rounded-xl bg-[#f4eafa] px-4 py-2 text-sm font-medium text-[#8B6AA8] hover:bg-[#eadcf5]"
      >
        + Add Task
      </button>
    </div>
  </div>
)}
   {activeModule === "Tasks" && showTaskForm && (
  <div className="mb-5 rounded-xl border border-[#eadff2] bg-white p-5">
    <p className="text-sm font-medium text-[#3F3748] mb-2">
      New Task
    </p>

    <input
      type="text"
      value={taskTitle}
      onChange={(e) => setTaskTitle(e.target.value)}
      placeholder="Enter task name"
      className="w-full rounded-xl border border-[#eadff2] bg-[#faf7ff] px-4 py-3 text-sm text-[#3F3748] outline-none focus:border-[#c9a9df]"
    />

    <div className="flex gap-2 mt-3">
      <button
        type="button"
        onClick={() => {
          if (!taskTitle.trim()) return;
          setTasks([...tasks, { title: taskTitle, completed: false }]);
          setTaskTitle("");
          setShowTaskForm(false);
        }}
        className="rounded-xl bg-[#f4eafa] px-4 py-2 text-sm font-medium text-[#8B6AA8]"
      >
        Save Task
      </button>

      <button
        type="button"
        onClick={() => setShowTaskForm(false)}
        className="rounded-xl px-4 py-2 text-sm text-[#8B8194]"
      >
        Cancel
      </button>
    </div>
  </div>
)}
   )}

{activeModule === "Tasks" && tasks.length > 0 && (
  <div className="mb-5 rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
    <p className="text-sm text-[#8B8194]">Your Tasks</p>

    <div className="mt-3 space-y-2">
      {tasks.map((task, index) => (
        <div
          key={index}
          className="flex items-center justify-between rounded-lg border border-[#eadff2] bg-white px-4 py-3"
        >
          <span className="text-sm text-[#3F3748]">
            {task.title}
          </span>
        </div>
      ))}
    </div>
  </div>
)}

<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">

  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4">
    <p className="text-xs text-[#8B8194]">Bride</p>
    <p className="text-sm font-medium text-[#3F3748] mt-1">
      {wedding.bride_name || "Not added"}
    </p>
  </div>

  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4">
    <p className="text-xs text-[#8B8194]">Groom</p>
    <p className="text-sm font-medium text-[#3F3748] mt-1">
      {wedding.groom_name || "Not added"}
    </p>
  </div>
</div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4">
    <p className="text-xs text-[#8B8194]">Wedding Date</p>
    <p className="text-sm font-medium text-[#3F3748] mt-1">
      {wedding.wedding_date || "Not added"}
    </p>
  </div>

  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4">
    <p className="text-xs text-[#8B8194]">Venue & Location</p>
    <p className="text-sm font-medium text-[#3F3748] mt-1">
      {wedding.venue || "Venue not added"}
      {wedding.city ? `, ${wedding.city}` : ""}
    </p>
  </div>
</div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4">
    <p className="text-xs text-[#8B8194]">Guest Count</p>
    <p className="text-sm font-medium text-[#3F3748] mt-1">
      {wedding.guest_count || "Not added"}
    </p>
  </div>
      <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4">
  <p className="text-xs text-[#8B8194]">Budget</p>
  <p className="text-sm font-medium text-[#3F3748] mt-1">
    {formatCurrency(wedding.budget)}
  </p>
</div>
</div>
  </div>
)}
  
  );
};

export default WeddingWorkspace;
