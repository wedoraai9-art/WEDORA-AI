import React, { useEffect, useState } from 'react';
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
import { authAxios } from '../../lib/auth';

const WeddingWorkspace = ({ wedding, onBack }) => {
  const [activeModule, setActiveModule] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [showClientForm, setShowClientForm] = useState(false);
const [clientName, setClientName] = useState("");
const [clientPhone, setClientPhone] = useState("");
const [clientEmail, setClientEmail] = useState("");
const [clientRelation, setClientRelation] = useState("");
const [clientNotes, setClientNotes] = useState("");
  const [savingClient, setSavingClient] = useState(false);
  useEffect(() => {
  loadClients();
}, [wedding.id]);

  if (!wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#2D2638]">
        Wedding not found.
      </div>
    );
  }
const loadClients = async () => {
  try {
    const response = await authAxios.get(
      `/vendor/weddings/${wedding.id}/clients`
    );
    setClients(response.data.clients || []);
  } catch (error) {
    console.error("Failed to load clients:", error);
  }
};
const saveClient = async () => {
  if (!clientName.trim() || savingClient) return;

  setSavingClient(true);

  try {
   const response = await authAxios.post(
      `/vendor/weddings/${wedding.id}/clients`,
      {
        name: clientName.trim(),
        phone: clientPhone,
        email: clientEmail,
        relation: clientRelation,
        notes: clientNotes,
      }
    );

    setClientName("");
    setClientPhone("");
    setClientEmail("");
    setClientRelation("");
    setClientNotes("");
    setShowClientForm(false);
   await loadClients();
    } catch (error) {
    console.error("Failed to save client:", error);
  } finally {
    setSavingClient(false);
  }
};
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
          type="button"
          className="flex items-center gap-2 text-[#8B8194] hover:text-[#2D2638] transition mb-6"
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
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f6efff] text-xs text-[#8B8194] mb-4">
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
              <div className="mt-4 mb-5 rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
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

            {activeModule === "Tasks" && tasks.length > 0 && (
              <div className="mb-5 rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                <p className="text-sm text-[#8B8194]">Your Tasks</p>

                <div className="mt-3 space-y-2">
                  {tasks.map((task, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-lg border border-[#eadff2] bg-white px-4 py-3"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setTasks(
                            tasks.map((item, i) =>
                              i === index
                                ? { ...item, completed: !item.completed }
                                : item
                            )
                          );
                        }}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                          task.completed
                            ? "bg-[#8B6AA8] border-[#8B6AA8] text-white"
                            : "border-[#c9b8d8] bg-white"
                        }`}
                      >
                        {task.completed ? "✓" : ""}
                      </button>

                      <span
                        className={`text-sm ${
                          task.completed
                            ? "text-[#9B91A3] line-through"
                            : "text-[#3F3748]"
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeModule === "Clients" && (
  <div className="mb-5 rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-[#8B8194]">Client Management</p>
        <h4 className="text-lg font-semibold text-[#3F3748] mt-1">
          Wedding Clients
        </h4>
        <p className="text-sm text-[#6B6175] mt-1">
          Manage client details and communication for this wedding.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setShowClientForm(true)}
        className="rounded-xl bg-[#f4eafa] px-4 py-2 text-sm font-medium text-[#8B6AA8] hover:bg-[#eadff5]"
      >
        + Add Client
      </button>
    </div>

    {showClientForm && (
      <div className="mt-5 rounded-xl border border-[#eadff2] bg-white p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Client Name *"
            className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none"
          />

          <input
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            placeholder="Phone"
            className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none"
          />

          <input
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="Email"
            className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none"
          />

          <input
            value={clientRelation}
            onChange={(e) => setClientRelation(e.target.value)}
            placeholder="Relation (Bride / Groom / Family)"
            className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none"
          />

          <textarea
            value={clientNotes}
            onChange={(e) => setClientNotes(e.target.value)}
            placeholder="Notes"
            rows="3"
            className="md:col-span-2 rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none"
          />
        </div>

        <div className="flex gap-2 mt-4">
          

         <button
            type="button"
            onClick={saveClient}
            disabled={savingClient}
            className="rounded-xl bg-[#8B6AA8] px-4 py-2 text-sm font-medium text-white disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {savingClient ? "Saving..." : "Save Client"}
          </button>
        </div>
      </div>
    )}

    {clients.length > 0 && (
      <div className="mt-4 space-y-3">
        {clients.map((client) => (
          <div
            key={client.id}
            className="rounded-xl border border-[#eadff2] bg-white p-4"
          >
            <p className="font-medium text-[#3F3748]">
              {client.name}
            </p>

            <div className="mt-1 text-sm text-[#6B6175] space-y-1">
              {client.phone && <p>Phone: {client.phone}</p>}
              {client.email && <p>Email: {client.email}</p>}
              {client.relation && <p>Relation: {client.relation}</p>}
              {client.notes && <p>Notes: {client.notes}</p>}
            </div>
          </div>
        ))}
      </div>
    )}
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

      </div>
    </div>
  );
};

export default WeddingWorkspace;
