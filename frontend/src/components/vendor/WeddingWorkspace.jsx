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
  Plus,
  Trash2,
  Edit3,
} from 'lucide-react';
import { authAxios } from '../../lib/auth';

const emptyExpense = {
  title: '',
  category: 'General',
  amount: '',
  expense_date: '',
  notes: '',
};

const emptyPayment = {
  title: '',
  payment_type: 'payment',
  amount: '',
  payment_date: '',
  notes: '',
};

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
  const [editingClientId, setEditingClientId] = useState(null);
  const [editingTaskIndex, setEditingTaskIndex] = useState(null);

  const [budgetData, setBudgetData] = useState({
    budget: {
      total_budget: Number(wedding?.budget || 0),
      total_expenses: 0,
      total_payments: 0,
      remaining_budget: Number(wedding?.budget || 0),
      payment_balance: 0,
    },
    expenses: [],
    payments: [],
  });
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState(emptyExpense);
  const [paymentForm, setPaymentForm] = useState(emptyPayment);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editingPaymentId, setEditingPaymentId] = useState(null);

  useEffect(() => {
    if (wedding?.id) {
      loadClients();
      loadBudget();
    }
  }, [wedding?.id]);

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

  const loadBudget = async () => {
    setBudgetLoading(true);
    try {
      const response = await authAxios.get(
        `/vendor/weddings/${wedding.id}/budget`
      );
      setBudgetData({
        budget: response.data?.budget || budgetData.budget,
        expenses: response.data?.expenses || [],
        payments: response.data?.payments || [],
      });
    } catch (error) {
      console.error("Failed to load wedding budget:", error);
    } finally {
      setBudgetLoading(false);
    }
  };

  const saveClient = async () => {
    if (!clientName.trim() || savingClient) return;

    setSavingClient(true);

    try {
      await authAxios.post(
        `/vendor/weddings/${wedding.id}/clients`,
        {
          name: clientName.trim(),
          phone: clientPhone,
          email: clientEmail,
          relation: clientRelation,
          notes: clientNotes,
        }
      );

      resetClientForm();
      await loadClients();
    } catch (error) {
      console.error("Failed to save client:", error);
    } finally {
      setSavingClient(false);
    }
  };

  const updateClient = async () => {
    if (!editingClientId || !clientName.trim() || savingClient) return;

    setSavingClient(true);

    try {
      await authAxios.put(
        `/vendor/weddings/${wedding.id}/clients/${editingClientId}`,
        {
          name: clientName.trim(),
          phone: clientPhone,
          email: clientEmail,
          relation: clientRelation,
          notes: clientNotes,
        }
      );

      resetClientForm();
      await loadClients();
    } catch (error) {
      console.error("Failed to update client:", error);
    } finally {
      setSavingClient(false);
    }
  };

  const resetClientForm = () => {
    setClientName("");
    setClientPhone("");
    setClientEmail("");
    setClientRelation("");
    setClientNotes("");
    setEditingClientId(null);
    setShowClientForm(false);
  };

  const resetExpenseForm = () => {
    setExpenseForm(emptyExpense);
    setEditingExpenseId(null);
    setShowExpenseForm(false);
  };

  const resetPaymentForm = () => {
    setPaymentForm(emptyPayment);
    setEditingPaymentId(null);
    setShowPaymentForm(false);
  };

  const saveExpense = async () => {
    if (!expenseForm.title.trim() || !Number(expenseForm.amount) || budgetSaving) return;
    setBudgetSaving(true);
    try {
      const payload = {
        ...expenseForm,
        title: expenseForm.title.trim(),
        amount: Number(expenseForm.amount),
      };
      if (editingExpenseId) {
        await authAxios.put(
          `/vendor/weddings/${wedding.id}/expenses/${editingExpenseId}`,
          payload
        );
      } else {
        await authAxios.post(`/vendor/weddings/${wedding.id}/expenses`, payload);
      }
      resetExpenseForm();
      await loadBudget();
    } catch (error) {
      console.error("Failed to save expense:", error);
      window.alert(error.response?.data?.detail || 'Could not save expense.');
    } finally {
      setBudgetSaving(false);
    }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await authAxios.delete(`/vendor/weddings/${wedding.id}/expenses/${id}`);
      await loadBudget();
    } catch (error) {
      console.error("Failed to delete expense:", error);
      window.alert(error.response?.data?.detail || 'Could not delete expense.');
    }
  };

  const savePayment = async () => {
    if (!paymentForm.title.trim() || !Number(paymentForm.amount) || budgetSaving) return;
    setBudgetSaving(true);
    try {
      const payload = {
        ...paymentForm,
        title: paymentForm.title.trim(),
        amount: Number(paymentForm.amount),
      };
      if (editingPaymentId) {
        await authAxios.put(
          `/vendor/weddings/${wedding.id}/payments/${editingPaymentId}`,
          payload
        );
      } else {
        await authAxios.post(`/vendor/weddings/${wedding.id}/payments`, payload);
      }
      resetPaymentForm();
      await loadBudget();
    } catch (error) {
      console.error("Failed to save payment:", error);
      window.alert(error.response?.data?.detail || 'Could not save payment.');
    } finally {
      setBudgetSaving(false);
    }
  };

  const deletePayment = async (id) => {
    if (!window.confirm('Delete this payment?')) return;
    try {
      await authAxios.delete(`/vendor/weddings/${wedding.id}/payments/${id}`);
      await loadBudget();
    } catch (error) {
      console.error("Failed to delete payment:", error);
      window.alert(error.response?.data?.detail || 'Could not delete payment.');
    }
  };

  const updateWeddingBudget = async (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0 || budgetSaving) return;
    setBudgetSaving(true);
    try {
      const response = await authAxios.put(
        `/vendor/weddings/${wedding.id}/budget`,
        { total_budget: amount }
      );
      setBudgetData({
        budget: response.data?.budget || budgetData.budget,
        expenses: response.data?.expenses || budgetData.expenses,
        payments: response.data?.payments || budgetData.payments,
      });
    } catch (error) {
      console.error("Failed to update wedding budget:", error);
      window.alert(error.response?.data?.detail || 'Could not update budget.');
    } finally {
      setBudgetSaving(false);
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
    { title: 'Overview', description: 'Wedding details, timeline and important information', icon: Heart },
    { title: 'Tasks', description: 'Plan and track everything that needs to be done', icon: CheckSquare },
    { title: 'Clients', description: 'Manage bride, groom and client communication', icon: Users },
    { title: 'Budget & Payments', description: 'Track budget, expenses, advances and payments', icon: Wallet },
    { title: 'Documents', description: 'Keep contracts, bills and important files organized', icon: FileText },
    { title: 'Notifications', description: 'Important reminders and wedding updates', icon: Bell },
    { title: 'AI Assistant', description: 'Get AI-powered help for this wedding', icon: Sparkles },
  ];

  const budget = budgetData.budget || {};

  return (
    <div className="min-h-screen bg-[#fcf9ff] px-4 py-6 md:px-8 text-[#2D2638]">
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
                <h3 className="text-[#2D2638] font-medium">{module.title}</h3>
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
                : activeModule === "Clients"
                ? "Manage client details and communication for this wedding."
                : activeModule === "Budget & Payments"
                ? "Track budget, expenses, advances and payments for this wedding."
                : "Wedding overview and important details."}
            </p>

            {/* TASKS MODULE */}
            {activeModule === "Tasks" && (
              <>
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

                {showTaskForm && (
                  <div className="mb-5 rounded-xl border border-[#eadff2] bg-white p-5">
                    <p className="text-sm font-medium text-[#3F3748] mb-2">New Task</p>
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
                          if (editingTaskIndex !== null) {
                            setTasks(
                              tasks.map((item, index) =>
                                index === editingTaskIndex
                                  ? { ...item, title: taskTitle }
                                  : item
                              )
                            );
                            setEditingTaskIndex(null);
                          } else {
                            setTasks([...tasks, { title: taskTitle, completed: false }]);
                          }
                          setTaskTitle("");
                          setShowTaskForm(false);
                        }}
                        className="rounded-xl bg-[#f4eafa] px-4 py-2 text-sm font-medium text-[#8B6AA8]"
                      >
                        {editingTaskIndex !== null ? "Update Task" : "Save Task"}
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

                {tasks.length > 0 && (
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
                                  i === index ? { ...item, completed: !item.completed } : item
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
                          <span className={`text-sm ${task.completed ? "text-[#9B91A3] line-through" : "text-[#3F3748]"}`}>
                            {task.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTaskIndex(index);
                              setTaskTitle(task.title);
                              setShowTaskForm(true);
                            }}
                            className="ml-auto rounded-lg bg-[#f4eafa] px-3 py-1 text-sm text-[#8B6AA8]"
                          >
                            Edit
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* CLIENTS MODULE */}
            {activeModule === "Clients" && (
              <div className="mt-4 mb-5 rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
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
                    onClick={() => {
                      resetClientForm();
                      setShowClientForm(true);
                    }}
                    className="rounded-xl bg-[#f4eafa] px-4 py-2 text-sm font-medium text-[#8B6AA8] hover:bg-[#eadff5]"
                  >
                    + Add Client
                  </button>
                </div>

                {showClientForm && (
                  <div className="mt-5 rounded-xl border border-[#eadff2] bg-white p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client Name *" className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                      <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="Phone" className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                      <input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="Email" className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                      <input value={clientRelation} onChange={(e) => setClientRelation(e.target.value)} placeholder="Relation (Bride / Groom / Family)" className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                      <textarea value={clientNotes} onChange={(e) => setClientNotes(e.target.value)} placeholder="Notes" rows="3" className="md:col-span-2 rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button type="button" onClick={editingClientId ? updateClient : saveClient} disabled={savingClient} className="rounded-xl bg-[#8B6AA8] px-4 py-2 text-sm font-medium text-white disabled:opacity-60 disabled:cursor-not-allowed">
                        {savingClient ? "Saving..." : editingClientId ? "Update Client" : "Save Client"}
                      </button>
                      <button type="button" onClick={resetClientForm} className="rounded-xl px-4 py-2 text-sm text-[#8B8194]">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {clients.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {clients.map((client) => (
                      <div key={client.id} className="rounded-xl border border-[#eadff2] bg-white p-4">
                        <p className="font-medium text-[#3F3748]">{client.name}</p>
                        <div className="mt-1 text-sm text-[#6B6175] space-y-1">
                          {client.phone && <p>Phone: {client.phone}</p>}
                          {client.email && <p>Email: {client.email}</p>}
                          {client.relation && <p>Relation: {client.relation}</p>}
                          {client.notes && <p>Notes: {client.notes}</p>}
                        </div>
                        <div className="mt-3">
                          <button type="button" onClick={() => {
                            setEditingClientId(client.id);
                            setClientName(client.name || "");
                            setClientPhone(client.phone || "");
                            setClientEmail(client.email || "");
                            setClientRelation(client.relation || "");
                            setClientNotes(client.notes || "");
                            setShowClientForm(true);
                          }} className="rounded-xl bg-[#f4eafa] px-4 py-2 text-sm font-medium text-[#8B6AA8] hover:bg-[#eadff5]">
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* OVERVIEW MODULE */}
            {activeModule === "Overview" && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4"><p className="text-xs text-[#8B8194]">Bride</p><p className="text-sm font-medium text-[#3F3748] mt-1">{wedding.bride_name || "Not added"}</p></div>
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4"><p className="text-xs text-[#8B8194]">Groom</p><p className="text-sm font-medium text-[#3F3748] mt-1">{wedding.groom_name || "Not added"}</p></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4"><p className="text-xs text-[#8B8194]">Wedding Date</p><p className="text-sm font-medium text-[#3F3748] mt-1">{formatDate(wedding.wedding_date)}</p></div>
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4"><p className="text-xs text-[#8B8194]">Venue & Location</p><p className="text-sm font-medium text-[#3F3748] mt-1">{wedding.venue || "Venue not added"}{wedding.city ? `, ${wedding.city}` : ""}</p></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4"><p className="text-xs text-[#8B8194]">Guest Count</p><p className="text-sm font-medium text-[#3F3748] mt-1">{wedding.guest_count || "Not added"}</p></div>
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4"><p className="text-xs text-[#8B8194]">Budget</p><p className="text-sm font-medium text-[#3F3748] mt-1">{formatCurrency(wedding.budget)}</p></div>
                </div>
              </div>
            )}

            {/* BUDGET & PAYMENTS MODULE */}
            {activeModule === "Budget & Payments" && (
              <div className="mt-4 space-y-5">
                <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-sm text-[#8B8194]">Financial Management</p>
                      <h4 className="text-lg font-semibold text-[#3F3748] mt-1">Wedding Budget</h4>
                      <p className="text-sm text-[#6B6175] mt-1">Track your planned budget, expenses and client payments.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-[#8B8194]">Total Budget</label>
                      <input
                        type="number"
                        min="0"
                        defaultValue={budget.total_budget || 0}
                        key={budget.total_budget}
                        onBlur={(e) => updateWeddingBudget(e.target.value)}
                        className="w-40 rounded-xl border border-[#eadff2] bg-white px-3 py-2 text-sm text-[#3F3748] outline-none focus:border-[#c9a9df]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4"><p className="text-xs text-[#8B8194]">Total Budget</p><p className="text-xl font-semibold text-[#3F3748] mt-1">{formatCurrency(budget.total_budget)}</p></div>
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4"><p className="text-xs text-[#8B8194]">Expenses</p><p className="text-xl font-semibold text-[#3F3748] mt-1">{formatCurrency(budget.total_expenses)}</p></div>
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4"><p className="text-xs text-[#8B8194]">Payments Received</p><p className="text-xl font-semibold text-[#3F3748] mt-1">{formatCurrency(budget.total_payments)}</p></div>
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-4"><p className="text-xs text-[#8B8194]">Remaining Budget</p><p className="text-xl font-semibold text-[#3F3748] mt-1">{formatCurrency(budget.remaining_budget)}</p></div>
                </div>

                {budgetLoading ? (
                  <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-8 text-center text-sm text-[#8B8194]">Loading budget...</div>
                ) : (
                  <>
                    <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div><p className="text-sm text-[#8B8194]">Expense Management</p><h4 className="text-lg font-semibold text-[#3F3748] mt-1">Wedding Expenses</h4></div>
                        <button type="button" onClick={() => { resetExpenseForm(); setShowExpenseForm(true); }} className="rounded-xl bg-[#f4eafa] px-4 py-2 text-sm font-medium text-[#8B6AA8] hover:bg-[#eadcf5]"><Plus className="inline w-4 h-4 mr-1" />Add Expense</button>
                      </div>

                      {showExpenseForm && (
                        <div className="mt-4 rounded-xl border border-[#eadff2] bg-white p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input value={expenseForm.title} onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })} placeholder="Expense title *" className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                            <input type="number" min="0" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} placeholder="Amount *" className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                            <select value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })} className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none bg-white"><option>General</option><option>Venue</option><option>Decor</option><option>Catering</option><option>Photography</option><option>Entertainment</option><option>Transport</option><option>Accommodation</option><option>Invitations</option><option>Other</option></select>
                            <input type="date" value={expenseForm.expense_date} onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })} className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                            <textarea value={expenseForm.notes} onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })} placeholder="Notes" rows="2" className="md:col-span-2 rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                          </div>
                          <div className="flex gap-2 mt-4"><button type="button" onClick={saveExpense} disabled={budgetSaving} className="rounded-xl bg-[#8B6AA8] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{budgetSaving ? 'Saving...' : editingExpenseId ? 'Update Expense' : 'Save Expense'}</button><button type="button" onClick={resetExpenseForm} className="rounded-xl px-4 py-2 text-sm text-[#8B8194]">Cancel</button></div>
                        </div>
                      )}

                      {budgetData.expenses.length > 0 ? (
                        <div className="mt-4 space-y-2">
                          {budgetData.expenses.map((expense) => (
                            <div key={expense.id} className="flex flex-col md:flex-row md:items-center gap-3 rounded-lg border border-[#eadff2] bg-white px-4 py-3">
                              <div className="flex-1"><p className="text-sm font-medium text-[#3F3748]">{expense.title}</p><p className="text-xs text-[#8B8194] mt-1">{expense.category}{expense.expense_date ? ` • ${expense.expense_date}` : ''}{expense.notes ? ` • ${expense.notes}` : ''}</p></div>
                              <p className="text-sm font-semibold text-[#3F3748]">{formatCurrency(expense.amount)}</p>
                              <button type="button" onClick={() => { setEditingExpenseId(expense.id); setExpenseForm({ title: expense.title || '', category: expense.category || 'General', amount: expense.amount || '', expense_date: expense.expense_date || '', notes: expense.notes || '' }); setShowExpenseForm(true); }} className="rounded-lg bg-[#f4eafa] px-3 py-1 text-sm text-[#8B6AA8]"><Edit3 className="inline w-3.5 h-3.5 mr-1" />Edit</button>
                              <button type="button" onClick={() => deleteExpense(expense.id)} className="rounded-lg bg-[#fff1f4] px-3 py-1 text-sm text-red-400"><Trash2 className="inline w-3.5 h-3.5 mr-1" />Delete</button>
                            </div>
                          ))}
                        </div>
                      ) : <p className="mt-4 text-sm text-[#8B8194]">No expenses added yet.</p>}
                    </div>

                    <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div><p className="text-sm text-[#8B8194]">Payment Management</p><h4 className="text-lg font-semibold text-[#3F3748] mt-1">Advances & Payments</h4></div>
                        <button type="button" onClick={() => { resetPaymentForm(); setShowPaymentForm(true); }} className="rounded-xl bg-[#f4eafa] px-4 py-2 text-sm font-medium text-[#8B6AA8] hover:bg-[#eadcf5]"><Plus className="inline w-4 h-4 mr-1" />Add Payment</button>
                      </div>

                      {showPaymentForm && (
                        <div className="mt-4 rounded-xl border border-[#eadff2] bg-white p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input value={paymentForm.title} onChange={(e) => setPaymentForm({ ...paymentForm, title: e.target.value })} placeholder="Payment title *" className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                            <input type="number" min="0" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder="Amount *" className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                            <select value={paymentForm.payment_type} onChange={(e) => setPaymentForm({ ...paymentForm, payment_type: e.target.value })} className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none bg-white"><option value="advance">Advance</option><option value="payment">Payment</option><option value="refund">Refund</option></select>
                            <input type="date" value={paymentForm.payment_date} onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} className="rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                            <textarea value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} placeholder="Notes" rows="2" className="md:col-span-2 rounded-lg border border-[#eadff2] px-3 py-2 text-sm outline-none" />
                          </div>
                          <div className="flex gap-2 mt-4"><button type="button" onClick={savePayment} disabled={budgetSaving} className="rounded-xl bg-[#8B6AA8] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{budgetSaving ? 'Saving...' : editingPaymentId ? 'Update Payment' : 'Save Payment'}</button><button type="button" onClick={resetPaymentForm} className="rounded-xl px-4 py-2 text-sm text-[#8B8194]">Cancel</button></div>
                        </div>
                      )}

                      {budgetData.payments.length > 0 ? (
                        <div className="mt-4 space-y-2">
                          {budgetData.payments.map((payment) => (
                            <div key={payment.id} className="flex flex-col md:flex-row md:items-center gap-3 rounded-lg border border-[#eadff2] bg-white px-4 py-3">
                              <div className="flex-1"><p className="text-sm font-medium text-[#3F3748]">{payment.title}</p><p className="text-xs text-[#8B8194] mt-1 capitalize">{payment.payment_type}{payment.payment_date ? ` • ${payment.payment_date}` : ''}{payment.notes ? ` • ${payment.notes}` : ''}</p></div>
                              <p className={`text-sm font-semibold ${payment.payment_type === 'refund' ? 'text-red-400' : 'text-[#3F3748]'}`}>{payment.payment_type === 'refund' ? '-' : ''}{formatCurrency(payment.amount)}</p>
                              <button type="button" onClick={() => { setEditingPaymentId(payment.id); setPaymentForm({ title: payment.title || '', payment_type: payment.payment_type || 'payment', amount: payment.amount || '', payment_date: payment.payment_date || '', notes: payment.notes || '' }); setShowPaymentForm(true); }} className="rounded-lg bg-[#f4eafa] px-3 py-1 text-sm text-[#8B6AA8]"><Edit3 className="inline w-3.5 h-3.5 mr-1" />Edit</button>
                              <button type="button" onClick={() => deletePayment(payment.id)} className="rounded-lg bg-[#fff1f4] px-3 py-1 text-sm text-red-400"><Trash2 className="inline w-3.5 h-3.5 mr-1" />Delete</button>
                            </div>
                          ))}
                        </div>
                      ) : <p className="mt-4 text-sm text-[#8B8194]">No payments added yet.</p>}
                    </div>

                    <div className="rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5">
                      <div className="flex items-center justify-between"><div><p className="text-sm text-[#8B8194]">Payment Balance</p><h4 className="text-lg font-semibold text-[#3F3748] mt-1">Expense vs. Payments</h4></div><p className="text-lg font-semibold text-[#3F3748]">{formatCurrency(budget.payment_balance)}</p></div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* PLACEHOLDER MODULES — kept unchanged until their dedicated backend work */}
            {activeModule === "Documents" && (
              <div className="mt-4 rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5"><p className="text-sm text-[#8B8194]">Documents</p><h4 className="text-lg font-semibold text-[#3F3748] mt-1">Wedding Documents</h4><p className="text-sm text-[#6B6175] mt-1">Document management will be added next.</p></div>
            )}
            {activeModule === "Notifications" && (
              <div className="mt-4 rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5"><p className="text-sm text-[#8B8194]">Notifications</p><h4 className="text-lg font-semibold text-[#3F3748] mt-1">Wedding Notifications</h4><p className="text-sm text-[#6B6175] mt-1">Wedding reminders and updates will be added next.</p></div>
            )}
            {activeModule === "AI Assistant" && (
              <div className="mt-4 rounded-xl border border-[#eadff2] bg-[#faf7ff] p-5"><p className="text-sm text-[#8B8194]">AI Assistant</p><h4 className="text-lg font-semibold text-[#3F3748] mt-1">Wedding AI Assistant</h4><p className="text-sm text-[#6B6175] mt-1">Wedding-specific AI assistance will be added next.</p></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeddingWorkspace;
