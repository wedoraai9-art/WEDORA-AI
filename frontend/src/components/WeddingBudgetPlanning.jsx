import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "wedora_budget_planning";

const CATEGORIES = [
  "Venue",
  "Decor",
  "Catering",
  "Photography",
  "Makeup",
  "Outfits",
  "Jewellery",
  "Transportation",
  "Entertainment",
  "Invitations",
  "Accommodation",
  "Miscellaneous",
];

const emptyForm = {
  item: "",
  vendor: "",
  category: "Decor",
  totalCost: "",
  paid: "",
  status: "Pending",
  notes: "",
};

export default function WeddingBudgetPlanning() {
  const [budget, setBudget] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.budget || 0;
      }
    } catch {}
    return 0;
  });

  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.expenses || [];
      }
    } catch {}
    return [];
  });

  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        budget,
        expenses,
      })
    );
  }, [budget, expenses]);

  const totals = useMemo(() => {
    const planned = expenses.reduce(
      (sum, item) => sum + Number(item.totalCost || 0),
      0
    );

    const paid = expenses.reduce(
      (sum, item) => sum + Number(item.paid || 0),
      0
    );

    const balance = Math.max(planned - paid, 0);
    const remaining = Math.max(Number(budget || 0) - paid, 0);

    const usedPercent =
      Number(budget) > 0
        ? Math.min((paid / Number(budget)) * 100, 100)
        : 0;

    return {
      planned,
      paid,
      balance,
      remaining,
      usedPercent,
    };
  }, [budget, expenses]);

  const filteredExpenses = useMemo(() => {
    const query = search.toLowerCase().trim();

    return expenses.filter((item) => {
      const matchesSearch =
        !query ||
        [
          item.item,
          item.vendor,
          item.category,
          item.status,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesCategory =
        categoryFilter === "All" ||
        item.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [expenses, search, categoryFilter]);

  const updateForm = (name, value) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const addExpense = () => {
    if (!form.item.trim()) {
      alert("Please enter an expense name.");
      return;
    }

    const total = Number(form.totalCost || 0);
    const paid = Number(form.paid || 0);

    if (total <= 0) {
      alert("Please enter a valid total cost.");
      return;
    }

    if (paid < 0 || paid > total) {
      alert("Paid amount cannot be greater than total cost.");
      return;
    }

    const newExpense = {
      ...form,
      id: Date.now(),
      totalCost: total,
      paid,
      balance: total - paid,
    };

    setExpenses((current) => [
      newExpense,
      ...current,
    ]);

    setForm(emptyForm);
    setShowForm(false);
  };

  const deleteExpense = (id) => {
    setExpenses((current) =>
      current.filter((item) => item.id !== id)
    );
  };

  const goBack = () => {
    window.location.href = "/wedding-planning";
  };

  const formatMoney = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #fffaf7 0%, #f7f3f6 100%)",
        color: "#4d4260",
        fontFamily: "Arial, sans-serif",
        paddingBottom: "70px",
      }}
    >
      <div
        style={{
          maxWidth: "1250px",
          margin: "0 auto",
          padding: "34px 22px",
        }}
      >
        {/* BACK */}

        <button
          onClick={goBack}
          style={{
            border: "none",
            background: "transparent",
            color: "#8c6fa8",
            fontSize: "15px",
            cursor: "pointer",
            marginBottom: "22px",
          }}
        >
          ← Back to Command Center
        </button>

        {/* HEADER */}

        <div style={{ marginBottom: "30px" }}>
          <div
            style={{
              fontSize: "12px",
              letterSpacing: "2px",
              color: "#a38bad",
              fontWeight: "700",
              marginBottom: "8px",
            }}
          >
            WEDDING PLANNING
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "38px",
              color: "#4d4260",
              fontWeight: "700",
            }}
          >
            Budget Planning
          </h1>

          <p
            style={{
              marginTop: "10px",
              color: "#8b8195",
              fontSize: "16px",
            }}
          >
            Track your wedding budget, payments and balance due
            in one place.
          </p>
        </div>

        {/* TOTAL BUDGET */}

        <div
          style={{
            background: "#fff",
            borderRadius: "26px",
            padding: "24px",
            border: "1px solid #eee5ef",
            boxShadow:
              "0 10px 32px rgba(90,70,100,0.07)",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "15px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "12px",
                  letterSpacing: "1.5px",
                  color: "#a38bad",
                  fontWeight: "700",
                }}
              >
                YOUR WEDDING BUDGET
              </div>

              <div
                style={{
                  marginTop: "7px",
                  fontSize: "28px",
                  fontWeight: "700",
                  color: "#51455f",
                }}
              >
                {formatMoney(budget)}
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  color: "#8e8295",
                  marginBottom: "6px",
                }}
              >
                Set Total Budget
              </label>

              <input
                type="number"
                min="0"
                value={budget}
                onChange={(e) =>
                  setBudget(Number(e.target.value || 0))
                }
                placeholder="Enter budget"
                style={{
                  ...inputStyle,
                  width: "220px",
                }}
              />
            </div>
          </div>

          <div
            style={{
              height: "9px",
              background: "#eee8ef",
              borderRadius: "20px",
              overflow: "hidden",
              marginTop: "22px",
            }}
          >
            <div
              style={{
                width: `${totals.usedPercent}%`,
                height: "100%",
                background:
                  "linear-gradient(90deg, #d89ab1, #a88bc2)",
                borderRadius: "20px",
              }}
            />
          </div>

          <div
            style={{
              marginTop: "8px",
              color: "#95899d",
              fontSize: "13px",
            }}
          >
            {budget > 0
              ? `${totals.usedPercent.toFixed(
                  1
                )}% of your budget has been paid`
              : "Set your total wedding budget to track progress."}
          </div>
        </div>

        {/* STATS */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <StatCard
            icon="📋"
            label="Planned Cost"
            value={formatMoney(totals.planned)}
          />

          <StatCard
            icon="✓"
            label="Paid So Far"
            value={formatMoney(totals.paid)}
          />

          <StatCard
            icon="⌛"
            label="Balance Due"
            value={formatMoney(totals.balance)}
          />

          <StatCard
            icon="◈"
            label="Remaining Budget"
            value={formatMoney(totals.remaining)}
          />
        </div>

        {/* SEARCH */}

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search expenses or vendors..."
            style={{
              ...inputStyle,
              flex: 1,
              minWidth: "240px",
            }}
          />

          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value)
            }
            style={{
              ...inputStyle,
              minWidth: "180px",
            }}
          >
            <option>All</option>

            {CATEGORIES.map((category) => (
              <option key={category}>
                {category}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowForm(true)}
            style={primaryButton}
          >
            + Add Expense
          </button>
        </div>

        {/* EXPENSES */}

        {filteredExpenses.length === 0 ? (
          <div
            style={{
              background: "#fff",
              borderRadius: "24px",
              padding: "55px 25px",
              textAlign: "center",
              border: "1px solid #eee5ef",
            }}
          >
            <div
              style={{
                fontSize: "42px",
                marginBottom: "12px",
              }}
            >
              ₹
            </div>

            <h3
              style={{
                margin: "0 0 8px",
                color: "#51455f",
              }}
            >
              No expenses added yet
            </h3>

            <p style={{ color: "#94899c" }}>
              Add your wedding expenses to start tracking
              your budget.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(310px, 1fr))",
              gap: "18px",
            }}
          >
            {filteredExpenses.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#fff",
                  borderRadius: "24px",
                  padding: "22px",
                  border: "1px solid #eee5ef",
                  boxShadow:
                    "0 8px 28px rgba(90,70,100,0.07)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "19px",
                        fontWeight: "700",
                        color: "#51455f",
                      }}
                    >
                      {item.item}
                    </div>

                    <div
                      style={{
                        marginTop: "5px",
                        color: "#95899d",
                        fontSize: "13px",
                      }}
                    >
                      {item.vendor || "Vendor not added"}
                    </div>
                  </div>

                  <div
                    style={{
                      background:
                        item.status === "Paid"
                          ? "#edf6ee"
                          : item.status ===
                            "Partially Paid"
                          ? "#f7f0e7"
                          : "#f8edf1",
                      color:
                        item.status === "Paid"
                          ? "#6c9271"
                          : "#9b7380",
                      padding: "7px 10px",
                      borderRadius: "10px",
                      fontSize: "11px",
                      fontWeight: "700",
                      height: "fit-content",
                    }}
                  >
                    {item.status}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "16px",
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={tagStyle}>
                    {item.category}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    marginTop: "15px",
                  }}
                >
                  <MoneyBox
                    label="Total Cost"
                    value={formatMoney(
                      item.totalCost
                    )}
                  />

                  <MoneyBox
                    label="Paid"
                    value={formatMoney(item.paid)}
                  />

                  <MoneyBox
                    label="Balance"
                    value={formatMoney(
                      item.balance
                    )}
                  />
                </div>

                {item.notes && (
                  <div
                    style={{
                      marginTop: "14px",
                      padding: "12px",
                      background: "#faf7fa",
                      borderRadius: "13px",
                      color: "#817687",
                      fontSize: "13px",
                    }}
                  >
                    {item.notes}
                  </div>
                )}

                <button
                  onClick={() =>
                    deleteExpense(item.id)
                  }
                  style={{
                    width: "100%",
                    marginTop: "16px",
                    border: "none",
                    background: "#f8eef0",
                    color: "#a26f7c",
                    borderRadius: "13px",
                    padding: "11px",
                    cursor: "pointer",
                  }}
                >
                  Delete Expense
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD EXPENSE MODAL */}

      {showForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(57,45,65,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "650px",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: "28px",
              padding: "28px",
              boxShadow:
                "0 25px 70px rgba(50,40,60,0.22)",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                color: "#51455f",
              }}
            >
              Add Wedding Expense
            </h2>

            <p
              style={{
                color: "#95899d",
                marginTop: "-8px",
                marginBottom: "22px",
              }}
            >
              Add the total cost and amount already paid.
              WEDORA will calculate the balance automatically.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "14px",
              }}
            >
              <input
                name="item"
                value={form.item}
                onChange={(e) =>
                  updateForm(
                    "item",
                    e.target.value
                  )
                }
                placeholder="Expense / Item"
                style={inputStyle}
              />

              <input
                name="vendor"
                value={form.vendor}
                onChange={(e) =>
                  updateForm(
                    "vendor",
                    e.target.value
                  )
                }
                placeholder="Vendor Name"
                style={inputStyle}
              />

              <select
                name="category"
                value={form.category}
                onChange={(e) =>
                  updateForm(
                    "category",
                    e.target.value
                  )
                }
                style={inputStyle}
              >
                {CATEGORIES.map((category) => (
                  <option key={category}>
                    {category}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="0"
                name="totalCost"
                value={form.totalCost}
                onChange={(e) =>
                  updateForm(
                    "totalCost",
                    e.target.value
                  )
                }
                placeholder="Total Cost (₹)"
                style={inputStyle}
              />

              <input
                type="number"
                min="0"
                name="paid"
                value={form.paid}
                onChange={(e) =>
                  updateForm(
                    "paid",
                    e.target.value
                  )
                }
                placeholder="Amount Paid (₹)"
                style={inputStyle}
              />

              <select
                name="status"
                value={form.status}
                onChange={(e) =>
                  updateForm(
                    "status",
                    e.target.value
                  )
                }
                style={inputStyle}
              >
                <option>Pending</option>
                <option>Partially Paid</option>
                <option>Paid</option>
              </select>
            </div>

            <textarea
              name="notes"
              value={form.notes}
              onChange={(e) =>
                updateForm(
                  "notes",
                  e.target.value
                )
              }
              placeholder="Notes"
              rows={4}
              style={{
                ...inputStyle,
                width: "100%",
                boxSizing: "border-box",
                marginTop: "14px",
                resize: "vertical",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "22px",
              }}
            >
              <button
                onClick={() => {
                  setShowForm(false);
                  setForm(emptyForm);
                }}
                style={secondaryButton}
              >
                Cancel
              </button>

              <button
                onClick={addExpense}
                style={primaryButton}
              >
                Save Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "22px",
        padding: "22px",
        boxShadow:
          "0 8px 30px rgba(90,70,100,0.08)",
        border: "1px solid #eee5ef",
      }}
    >
      <div
        style={{
          width: "46px",
          height: "46px",
          borderRadius: "15px",
          background:
            "linear-gradient(135deg, #f7e9ee, #eee8f7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
          marginBottom: "15px",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          fontSize: "23px",
          fontWeight: "700",
          color: "#51455f",
        }}
      >
        {value}
      </div>

      <div
        style={{
          color: "#94899c",
          marginTop: "4px",
          fontSize: "14px",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function MoneyBox({ label, value }) {
  return (
    <div
      style={{
        background: "#faf7fa",
        padding: "12px",
        borderRadius: "14px",
      }}
    >
      <small style={{ color: "#9b909f" }}>
        {label}
      </small>

      <div
        style={{
          marginTop: "4px",
          fontWeight: "700",
          color: "#51455f",
        }}
      >
        {value}
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "13px 15px",
  borderRadius: "13px",
  border: "1px solid #e5dce8",
  background: "#fff",
  outline: "none",
  fontSize: "14px",
  color: "#51455f",
};

const tagStyle = {
  background: "#f2edf7",
  color: "#806b91",
  padding: "7px 10px",
  borderRadius: "10px",
  fontSize: "12px",
};

const primaryButton = {
  border: "none",
  borderRadius: "13px",
  padding: "13px 21px",
  background:
    "linear-gradient(135deg, #9c7db6, #7f699a)",
  color: "#fff",
  fontWeight: "700",
  cursor: "pointer",
};

const secondaryButton = {
  border: "1px solid #e4dbe8",
  borderRadius: "13px",
  padding: "12px 20px",
  background: "#fff",
  color: "#7e6a8d",
  fontWeight: "600",
  cursor: "pointer",
};
