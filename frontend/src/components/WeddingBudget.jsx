import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  WalletCards,
  Plus,
  Trash2,
  Search,
  IndianRupee,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const DEFAULT_EXPENSES = [];

const CATEGORIES = [
  "Venue",
  "Decor",
  "Catering",
  "Photography",
  "Entertainment",
  "Bride & Groom",
  "Guests",
  "Transportation",
  "Invitations",
  "Accommodation",
  "Other",
];

const STATUS_OPTIONS = ["Planned", "Partially Paid", "Paid"];

export default function WeddingBudget() {
  const navigate = useNavigate();

  const [budget, setBudget] = useState(() => {
    try {
      const saved = localStorage.getItem("wedora_wedding_budget");

      if (saved) {
        return Number(saved);
      }
    } catch (error) {
      console.error("Unable to load budget", error);
    }

    return 0;
  });

  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem("wedora_wedding_expenses");

      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error("Unable to load expenses", error);
    }

    return DEFAULT_EXPENSES;
  });

  const [budgetInput, setBudgetInput] = useState(
    budget ? String(budget) : ""
  );

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Venue");
  const [planned, setPlanned] = useState("");
  const [actual, setActual] = useState("");
  const [status, setStatus] = useState("Planned");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const saveBudget = (value) => {
    const numericValue = Number(value) || 0;

    setBudget(numericValue);

    try {
      localStorage.setItem(
        "wedora_wedding_budget",
        String(numericValue)
      );
    } catch (error) {
      console.error("Unable to save budget", error);
    }
  };

  const saveExpenses = (updatedExpenses) => {
    setExpenses(updatedExpenses);

    try {
      localStorage.setItem(
        "wedora_wedding_expenses",
        JSON.stringify(updatedExpenses)
      );
    } catch (error) {
      console.error("Unable to save expenses", error);
    }
  };

  const addExpense = () => {
    if (!title.trim()) return;

    const plannedAmount = Number(planned) || 0;
    const actualAmount = Number(actual) || 0;

    const newExpense = {
      id: Date.now(),
      title: title.trim(),
      category,
      planned: plannedAmount,
      actual: actualAmount,
      status,
    };

    saveExpenses([...expenses, newExpense]);

    setTitle("");
    setCategory("Venue");
    setPlanned("");
    setActual("");
    setStatus("Planned");
  };

  const deleteExpense = (id) => {
    saveExpenses(expenses.filter((expense) => expense.id !== id));
  };

  const totals = useMemo(() => {
    const plannedTotal = expenses.reduce(
      (sum, expense) => sum + Number(expense.planned || 0),
      0
    );

    const actualTotal = expenses.reduce(
      (sum, expense) => sum + Number(expense.actual || 0),
      0
    );

    const remaining = budget - actualTotal;

    return {
      plannedTotal,
      actualTotal,
      remaining,
    };
  }, [expenses, budget]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        expense.title.toLowerCase().includes(searchText) ||
        expense.category.toLowerCase().includes(searchText);

      const matchesFilter =
        filter === "All" || expense.category === filter;

      return matchesSearch && matchesFilter;
    });
  }, [expenses, search, filter]);

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  };

  const budgetUsed =
    budget > 0
      ? Math.min(Math.round((totals.actualTotal / budget) * 100), 100)
      : 0;

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
            <WalletCards size={18} />
            Wedding Command Center
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-[#35244F] md:text-5xl">
            Budget Planning
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-[#776B7F]">
            Plan your wedding spending, track actual expenses and keep your
            celebration within your chosen budget.
          </p>
        </section>

        {/* TOTAL BUDGET */}
        <section className="mb-8 rounded-[28px] border border-[#E9E0D5] bg-white p-6 shadow-[0_15px_45px_rgba(64,42,91,0.06)] md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-[#8C7D91]">
                YOUR WEDDING BUDGET
              </p>

              <div className="mt-2 flex items-center gap-2">
                <IndianRupee size={28} className="text-[#B991B5]" />

                <span className="text-4xl font-semibold text-[#35244F]">
                  {formatCurrency(budget)}
                </span>
              </div>
            </div>

            <div className="flex w-full gap-2 md:w-auto">
              <input
                type="number"
                min="0"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                placeholder="Enter total budget"
                className="h-12 w-full rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm outline-none focus:border-[#B991B5] md:w-56"
              />

              <button
                onClick={() => saveBudget(budgetInput)}
                className="h-12 rounded-2xl bg-[#35244F] px-5 text-sm font-semibold text-white transition hover:bg-[#46325F]"
              >
                Save
              </button>
            </div>
          </div>

          <div className="mt-7">
            <div className="mb-2 flex justify-between text-xs text-[#8C7D91]">
              <span>Budget used</span>
              <span>{budgetUsed}%</span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-[#F0EAE4]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#B991B5] via-[#CBA4C5] to-[#D8B98F] transition-all duration-500"
                style={{ width: `${budgetUsed}%` }}
              />
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[24px] border border-[#E9E0D5] bg-white p-5 shadow-[0_10px_30px_rgba(64,42,91,0.04)]">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F1E4F0] text-[#806281]">
              <WalletCards size={20} />
            </div>

            <p className="text-sm text-[#8C7D91]">Planned Spending</p>

            <p className="mt-1 text-2xl font-semibold text-[#35244F]">
              {formatCurrency(totals.plannedTotal)}
            </p>
          </div>

          <div className="rounded-[24px] border border-[#E9E0D5] bg-white p-5 shadow-[0_10px_30px_rgba(64,42,91,0.04)]">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F8EEDC] text-[#9A7C4F]">
              <Clock3 size={20} />
            </div>

            <p className="text-sm text-[#8C7D91]">Actual Spending</p>

            <p className="mt-1 text-2xl font-semibold text-[#35244F]">
              {formatCurrency(totals.actualTotal)}
            </p>
          </div>

          <div className="rounded-[24px] border border-[#E9E0D5] bg-white p-5 shadow-[0_10px_30px_rgba(64,42,91,0.04)]">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF3EA] text-[#6A896F]">
              {totals.remaining >= 0 ? (
                <CheckCircle2 size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
            </div>

            <p className="text-sm text-[#8C7D91]">Remaining</p>

            <p
              className={`mt-1 text-2xl font-semibold ${
                totals.remaining >= 0
                  ? "text-[#35244F]"
                  : "text-[#A56D73]"
              }`}
            >
              {formatCurrency(Math.abs(totals.remaining))}
            </p>
          </div>

          <div className="rounded-[24px] border border-[#E9E0D5] bg-white p-5 shadow-[0_10px_30px_rgba(64,42,91,0.04)]">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F8E9EA] text-[#A56D73]">
              <IndianRupee size={20} />
            </div>

            <p className="text-sm text-[#8C7D91]">Expenses</p>

            <p className="mt-1 text-2xl font-semibold text-[#35244F]">
              {expenses.length}
            </p>
          </div>
        </section>

        {/* ADD EXPENSE */}
        <section className="mb-8 rounded-[28px] border border-[#E9E0D5] bg-white p-6 shadow-[0_15px_45px_rgba(64,42,91,0.05)] md:p-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F1E4F0] to-[#F8EEDC] text-[#7D6284]">
              <Plus size={21} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#35244F]">
                Add Wedding Expense
              </h2>

              <p className="text-sm text-[#8C7D91]">
                Track planned and actual spending for every part of your wedding.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Expense / vendor"
              className="h-12 rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm outline-none placeholder:text-[#B0A4AE] focus:border-[#B991B5]"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-12 rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm outline-none focus:border-[#B991B5]"
            >
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="0"
              value={planned}
              onChange={(e) => setPlanned(e.target.value)}
              placeholder="Planned ₹"
              className="h-12 rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm outline-none placeholder:text-[#B0A4AE] focus:border-[#B991B5]"
            />

            <input
              type="number"
              min="0"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              placeholder="Actual ₹"
              className="h-12 rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm outline-none placeholder:text-[#B0A4AE] focus:border-[#B991B5]"
            />

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-12 rounded-2xl border border-[#E5DBD0] bg-[#FCFAF7] px-4 text-sm outline-none focus:border-[#B991B5]"
            >
              {STATUS_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={addExpense}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#35244F] px-6 text-sm font-semibold text-white transition hover:bg-[#46325F] md:w-auto"
          >
            <Plus size={17} />
            Add Expense
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
              placeholder="Search expenses..."
              className="h-12 w-full rounded-full border border-[#E5DBD0] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#B991B5]"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto">
            {["All", ...CATEGORIES].map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                  filter === item
                    ? "bg-[#35244F] text-white"
                    : "border border-[#E6DCCD] bg-white text-[#6F6276] hover:bg-[#F5EFF6]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {/* EXPENSE LIST */}
        <section className="space-y-3">
          {filteredExpenses.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-[#DCCFC1] bg-white px-6 py-16 text-center">
              <WalletCards
                size={36}
                className="mx-auto mb-4 text-[#B991B5]"
              />

              <h3 className="text-lg font-semibold text-[#35244F]">
                No expenses found
              </h3>

              <p className="mt-2 text-sm text-[#8C7D91]">
                Add your first wedding expense above.
              </p>
            </div>
          ) : (
            filteredExpenses.map((expense) => (
              <div
                key={expense.id}
                className="group rounded-[24px] border border-[#E9E0D5] bg-white p-5 shadow-[0_10px_30px_rgba(64,42,91,0.04)] transition hover:border-[#C9B0C7]"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F1E4F0] to-[#F8EEDC] text-[#806281]">
                    <IndianRupee size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-[#35244F]">
                        {expense.title}
                      </h3>

                      <span className="rounded-full bg-[#F5EDF4] px-3 py-1 text-xs font-semibold text-[#846B88]">
                        {expense.category}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          expense.status === "Paid"
                            ? "bg-[#EEF5EF] text-[#66856D]"
                            : expense.status === "Partially Paid"
                            ? "bg-[#F8EEDC] text-[#9A7C4F]"
                            : "bg-[#F1EAF4] text-[#765A78]"
                        }`}
                      >
                        {expense.status}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-5 text-sm">
                      <span className="text-[#8C7D91]">
                        Planned:{" "}
                        <strong className="font-semibold text-[#5D5064]">
                          {formatCurrency(expense.planned)}
                        </strong>
                      </span>

                      <span className="text-[#8C7D91]">
                        Actual:{" "}
                        <strong className="font-semibold text-[#5D5064]">
                          {formatCurrency(expense.actual)}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteExpense(expense.id)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-full text-[#B2A7B0] transition hover:bg-[#FBEDED] hover:text-[#B86F76] md:self-center"
                    aria-label="Delete expense"
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
          Your wedding budget is automatically saved on this device.
        </div>
      </main>
    </div>
  );
}
