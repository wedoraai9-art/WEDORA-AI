import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "wedora_wedding_catering";

const emptyForm = {
  caterer: "",
  cuisine: "Multi-Cuisine",
  eventDate: "",
  guests: "",
  costPerPlate: "",
  totalCost: "",
  phone: "",
  service: "Full Service",
  tasting: "Not Scheduled",
  menu: "",
  notes: "",
  shortlisted: false,
};

const defaultCaterers = [
  {
    id: 1,
    caterer: "Wedding Caterer",
    cuisine: "Multi-Cuisine",
    eventDate: "",
    guests: "",
    costPerPlate: "",
    totalCost: "",
    phone: "",
    service: "Full Service",
    tasting: "Not Scheduled",
    menu: "",
    notes: "",
    shortlisted: false,
  },
];

export default function WeddingCatering() {
  const [caterers, setCaterers] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : defaultCaterers;
    } catch {
      return defaultCaterers;
    }
  });

  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCaterer, setSelectedCaterer] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(caterers));
  }, [caterers]);

  const filteredCaterers = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return caterers;

    return caterers.filter((item) =>
      [
        item.caterer,
        item.cuisine,
        item.service,
        item.tasting,
        item.menu,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [caterers, search]);

  const totalCaterers = caterers.length;
  const shortlisted = caterers.filter((item) => item.shortlisted).length;
  const tastings = caterers.filter(
    (item) => item.tasting === "Scheduled"
  ).length;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((current) => {
      const updated = {
        ...current,
        [name]: value,
      };

      if (name === "guests" || name === "costPerPlate") {
        const guests = Number(
          name === "guests" ? value : current.guests
        );
        const cost = Number(
          name === "costPerPlate" ? value : current.costPerPlate
        );

        if (guests && cost) {
          updated.totalCost = guests * cost;
        }
      }

      return updated;
    });
  };

  const addCaterer = () => {
    if (!form.caterer.trim()) {
      alert("Please enter caterer name.");
      return;
    }

    const newCaterer = {
      ...form,
      id: Date.now(),
      guests: form.guests ? Number(form.guests) : "",
      costPerPlate: form.costPerPlate
        ? Number(form.costPerPlate)
        : "",
      totalCost: form.totalCost ? Number(form.totalCost) : "",
    };

    setCaterers((current) => [newCaterer, ...current]);
    setForm(emptyForm);
    setShowForm(false);
  };

  const deleteCaterer = (id) => {
    setCaterers((current) =>
      current.filter((item) => item.id !== id)
    );

    if (selectedCaterer?.id === id) {
      setSelectedCaterer(null);
    }
  };

  const toggleShortlist = (id) => {
    setCaterers((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, shortlisted: !item.shortlisted }
          : item
      )
    );
  };

  const goBack = () => {
    window.location.href = "/wedding-planning";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #fffaf7 0%, #f7f3f6 100%)",
        color: "#4d4260",
        fontFamily: "Arial, sans-serif",
        paddingBottom: "60px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "34px 22px",
        }}
      >
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
            Catering
          </h1>

          <p
            style={{
              marginTop: "10px",
              color: "#8b8195",
              fontSize: "16px",
            }}
          >
            Manage caterers, menus, guest counts, tastings and food budgets.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          {[
            ["Caterers", totalCaterers, "🍽️"],
            ["Shortlisted", shortlisted, "♡"],
            ["Tastings", tastings, "✦"],
          ].map(([label, value, icon]) => (
            <div
              key={label}
              style={{
                background: "#ffffff",
                borderRadius: "22px",
                padding: "22px",
                boxShadow: "0 8px 30px rgba(90,70,100,0.08)",
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
                  fontSize: "21px",
                  marginBottom: "15px",
                }}
              >
                {icon}
              </div>

              <div
                style={{
                  fontSize: "28px",
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
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "22px",
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search caterers, cuisine or service..."
            style={{
              flex: 1,
              minWidth: "240px",
              padding: "14px 17px",
              borderRadius: "15px",
              border: "1px solid #e7dfe9",
              background: "#fff",
              outline: "none",
              fontSize: "14px",
              color: "#51455f",
            }}
          />

          <button
            onClick={() => setShowForm(true)}
            style={{
              border: "none",
              borderRadius: "15px",
              padding: "14px 22px",
              background:
                "linear-gradient(135deg, #9c7db6, #7f699a)",
              color: "#fff",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 8px 20px rgba(127,105,154,0.22)",
            }}
          >
            + Add Caterer
          </button>
        </div>

        {filteredCaterers.length === 0 ? (
          <div
            style={{
              background: "#fff",
              borderRadius: "24px",
              padding: "55px 25px",
              textAlign: "center",
              border: "1px solid #eee5ef",
            }}
          >
            <div style={{ fontSize: "42px", marginBottom: "12px" }}>
              🍽️
            </div>

            <h3 style={{ margin: "0 0 8px", color: "#51455f" }}>
              No caterers added yet
            </h3>

            <p style={{ color: "#94899c" }}>
              Add your first caterer to start planning your wedding menu.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(290px, 1fr))",
              gap: "18px",
            }}
          >
            {filteredCaterers.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#fff",
                  borderRadius: "24px",
                  padding: "22px",
                  border: "1px solid #eee5ef",
                  boxShadow: "0 8px 28px rgba(90,70,100,0.07)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "12px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "700",
                        color: "#51455f",
                      }}
                    >
                      {item.caterer}
                    </div>

                    <div
                      style={{
                        marginTop: "6px",
                        color: "#9a8ea1",
                        fontSize: "14px",
                      }}
                    >
                      {item.cuisine}
                    </div>
                  </div>

                  <button
                    onClick={() => toggleShortlist(item.id)}
                    style={{
                      border: "none",
                      background: item.shortlisted
                        ? "#f4e6f1"
                        : "#f7f4f8",
                      color: "#9a79a8",
                      width: "38px",
                      height: "38px",
                      borderRadius: "12px",
                      cursor: "pointer",
                      fontSize: "20px",
                    }}
                  >
                    {item.shortlisted ? "♥" : "♡"}
                  </button>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    marginTop: "18px",
                  }}
                >
                  <div
                    style={{
                      background: "#faf7fa",
                      padding: "12px",
                      borderRadius: "14px",
                    }}
                  >
                    <small style={{ color: "#9b909f" }}>
                      Guests
                    </small>
                    <div
                      style={{
                        marginTop: "4px",
                        fontWeight: "700",
                      }}
                    >
                      {item.guests || "—"}
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#faf7fa",
                      padding: "12px",
                      borderRadius: "14px",
                    }}
                  >
                    <small style={{ color: "#9b909f" }}>
                      Cost / Plate
                    </small>
                    <div
                      style={{
                        marginTop: "4px",
                        fontWeight: "700",
                      }}
                    >
                      {item.costPerPlate
                        ? `₹${Number(
                            item.costPerPlate
                          ).toLocaleString("en-IN")}`
                        : "—"}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "14px",
                    padding: "12px 14px",
                    background: "#f8f3fa",
                    borderRadius: "14px",
                    fontSize: "14px",
                  }}
                >
                  <strong>Total:</strong>{" "}
                  {item.totalCost
                    ? `₹${Number(
                        item.totalCost
                      ).toLocaleString("en-IN")}`
                    : "Not set"}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    marginTop: "14px",
                  }}
                >
                  <span
                    style={{
                      background: "#f2edf7",
                      padding: "7px 10px",
                      borderRadius: "10px",
                      fontSize: "12px",
                    }}
                  >
                    {item.service}
                  </span>

                  <span
                    style={{
                      background: "#f8ecef",
                      padding: "7px 10px",
                      borderRadius: "10px",
                      fontSize: "12px",
                    }}
                  >
                    Tasting: {item.tasting}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "9px",
                    marginTop: "18px",
                  }}
                >
                  <button
                    onClick={() => setSelectedCaterer(item)}
                    style={{
                      flex: 1,
                      border: "1px solid #e6ddea",
                      background: "#fff",
                      color: "#7e6794",
                      borderRadius: "13px",
                      padding: "11px",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    View Details
                  </button>

                  <button
                    onClick={() => deleteCaterer(item.id)}
                    style={{
                      border: "none",
                      background: "#f8eef0",
                      color: "#a26f7c",
                      borderRadius: "13px",
                      padding: "11px 14px",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(57,45,65,0.35)",
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
              boxShadow: "0 25px 70px rgba(50,40,60,0.22)",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                color: "#51455f",
              }}
            >
              Add Caterer
            </h2>

            <p
              style={{
                color: "#95899d",
                marginTop: "-8px",
                marginBottom: "22px",
              }}
            >
              Add catering details for your wedding.
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
                name="caterer"
                value={form.caterer}
                onChange={handleChange}
                placeholder="Caterer / Company Name"
                style={inputStyle}
              />

              <select
                name="cuisine"
                value={form.cuisine}
                onChange={handleChange}
                style={inputStyle}
              >
                <option>Multi-Cuisine</option>
                <option>Rajasthani</option>
                <option>North Indian</option>
                <option>South Indian</option>
                <option>Gujarati</option>
                <option>Punjabi</option>
                <option>Continental</option>
                <option>Italian</option>
                <option>Asian</option>
                <option>Live Counters</option>
              </select>

              <input
                type="date"
                name="eventDate"
                value={form.eventDate}
                onChange={handleChange}
                style={inputStyle}
              />

              <input
                type="number"
                name="guests"
                value={form.guests}
                onChange={handleChange}
                placeholder="Number of Guests"
                style={inputStyle}
              />

              <input
                type="number"
                name="costPerPlate"
                value={form.costPerPlate}
                onChange={handleChange}
                placeholder="Cost Per Plate (₹)"
                style={inputStyle}
              />

              <input
                type="number"
                name="totalCost"
                value={form.totalCost}
                onChange={handleChange}
                placeholder="Total Cost (₹)"
                style={inputStyle}
              />

              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Contact Number"
                style={inputStyle}
              />

              <select
                name="service"
                value={form.service}
                onChange={handleChange}
                style={inputStyle}
              >
                <option>Full Service</option>
                <option>Food Only</option>
                <option>Food + Staff</option>
                <option>Live Counters</option>
                <option>Buffet</option>
                <option>Plated Service</option>
              </select>

              <select
                name="tasting"
                value={form.tasting}
                onChange={handleChange}
                style={inputStyle}
              >
                <option>Not Scheduled</option>
                <option>Scheduled</option>
                <option>Completed</option>
              </select>
            </div>

            <textarea
              name="menu"
              value={form.menu}
              onChange={handleChange}
              placeholder="Menu / Food Items"
              rows={4}
              style={{
                ...inputStyle,
                width: "100%",
                marginTop: "14px",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />

            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Notes"
              rows={3}
              style={{
                ...inputStyle,
                width: "100%",
                marginTop: "14px",
                resize: "vertical",
                boxSizing: "border-box",
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
                onClick={addCaterer}
                style={primaryButton}
              >
                Save Caterer
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedCaterer && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(57,45,65,0.35)",
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
              maxWidth: "560px",
              background: "#fff",
              borderRadius: "28px",
              padding: "30px",
              boxShadow: "0 25px 70px rgba(50,40,60,0.22)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: "#51455f",
                }}
              >
                {selectedCaterer.caterer}
              </h2>

              <button
                onClick={() => setSelectedCaterer(null)}
                style={{
                  border: "none",
                  background: "#f6f1f7",
                  borderRadius: "12px",
                  width: "38px",
                  height: "38px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                marginTop: "22px",
                lineHeight: 1.8,
                color: "#766b7e",
              }}
            >
              <div><strong>Cuisine:</strong> {selectedCaterer.cuisine}</div>
              <div><strong>Event Date:</strong> {selectedCaterer.eventDate || "Not set"}</div>
              <div><strong>Guests:</strong> {selectedCaterer.guests || "Not set"}</div>
              <div><strong>Cost / Plate:</strong> {selectedCaterer.costPerPlate ? `₹${Number(selectedCaterer.costPerPlate).toLocaleString("en-IN")}` : "Not set"}</div>
              <div><strong>Total Cost:</strong> {selectedCaterer.totalCost ? `₹${Number(selectedCaterer.totalCost).toLocaleString("en-IN")}` : "Not set"}</div>
              <div><strong>Service:</strong> {selectedCaterer.service}</div>
              <div><strong>Tasting:</strong> {selectedCaterer.tasting}</div>
              <div><strong>Contact:</strong> {selectedCaterer.phone || "Not added"}</div>
              <div><strong>Menu:</strong> {selectedCaterer.menu || "Not added"}</div>
              <div><strong>Notes:</strong> {selectedCaterer.notes || "None"}</div>
            </div>

            <button
              onClick={() => setSelectedCaterer(null)}
              style={{
                ...primaryButton,
                width: "100%",
                marginTop: "22px",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
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

const primaryButton = {
  border: "none",
  borderRadius: "13px",
  padding: "12px 20px",
  background: "linear-gradient(135deg, #9c7db6, #7f699a)",
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
