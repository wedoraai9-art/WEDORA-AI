import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "wedora_wedding_transportation";

const emptyForm = {
  provider: "",
  vehicleType: "Sedan",
  functionName: "Wedding",
  date: "",
  pickup: "",
  drop: "",
  pickupTime: "",
  guests: "",
  driver: "",
  driverPhone: "",
  cost: "",
  paymentStatus: "Pending",
  notes: "",
};

const vehicleTypes = [
  "Sedan",
  "SUV",
  "Luxury Car",
  "Tempo Traveller",
  "Mini Bus",
  "Bus",
  "Vintage Car",
  "Other",
];

const functionNames = [
  "Engagement",
  "Haldi",
  "Mehndi",
  "Sangeet",
  "Wedding",
  "Reception",
  "Guest Transfer",
  "Airport Transfer",
  "Other",
];

export default function WeddingTransportation() {
  const [vehicles, setVehicles] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(vehicles)
    );
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return vehicles;

    return vehicles.filter((item) =>
      [
        item.provider,
        item.vehicleType,
        item.functionName,
        item.pickup,
        item.drop,
        item.driver,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [vehicles, search]);

  const totalVehicles = vehicles.length;

  const totalGuests = vehicles.reduce(
    (sum, item) => sum + Number(item.guests || 0),
    0
  );

  const totalCost = vehicles.reduce(
    (sum, item) => sum + Number(item.cost || 0),
    0
  );

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const addVehicle = () => {
    if (!form.provider.trim()) {
      alert("Please enter transport provider.");
      return;
    }

    if (!form.pickup.trim()) {
      alert("Please enter pickup location.");
      return;
    }

    if (!form.drop.trim()) {
      alert("Please enter drop location.");
      return;
    }

    const newVehicle = {
      ...form,
      id: Date.now(),
      guests: form.guests ? Number(form.guests) : 0,
      cost: form.cost ? Number(form.cost) : 0,
    };

    setVehicles((current) => [
      newVehicle,
      ...current,
    ]);

    setForm(emptyForm);
    setShowForm(false);
  };

  const deleteVehicle = (id) => {
    setVehicles((current) =>
      current.filter((item) => item.id !== id)
    );

    if (selectedVehicle?.id === id) {
      setSelectedVehicle(null);
    }
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
        paddingBottom: "70px",
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
            Transportation
          </h1>

          <p
            style={{
              marginTop: "10px",
              color: "#8b8195",
              fontSize: "16px",
            }}
          >
            Plan guest transfers, cars, pickups and wedding
            transportation.
          </p>
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
            icon="🚗"
            value={totalVehicles}
            label="Vehicles"
          />

          <StatCard
            icon="👥"
            value={totalGuests}
            label="Guests Covered"
          />

          <StatCard
            icon="₹"
            value={`₹${totalCost.toLocaleString(
              "en-IN"
            )}`}
            label="Transportation Cost"
          />
        </div>

        {/* SEARCH + ADD */}

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
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search vehicles, provider, function or location..."
            style={{
              flex: 1,
              minWidth: "250px",
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
              boxShadow:
                "0 8px 20px rgba(127,105,154,0.22)",
            }}
          >
            + Add Transport
          </button>
        </div>

        {/* VEHICLE LIST */}

        {filteredVehicles.length === 0 ? (
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
              🚗
            </div>

            <h3
              style={{
                margin: "0 0 8px",
                color: "#51455f",
              }}
            >
              No transportation added yet
            </h3>

            <p style={{ color: "#94899c" }}>
              Add vehicles and guest transfers for your
              wedding.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "18px",
            }}
          >
            {filteredVehicles.map((item) => (
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
                      {item.provider}
                    </div>

                    <div
                      style={{
                        marginTop: "6px",
                        color: "#9a8ea1",
                        fontSize: "14px",
                      }}
                    >
                      {item.vehicleType}
                    </div>
                  </div>

                  <div
                    style={{
                      background:
                        item.paymentStatus === "Paid"
                          ? "#edf6ee"
                          : "#f8edf1",
                      color:
                        item.paymentStatus === "Paid"
                          ? "#6c9271"
                          : "#9b7380",
                      padding: "7px 10px",
                      borderRadius: "10px",
                      fontSize: "12px",
                      fontWeight: "700",
                    }}
                  >
                    {item.paymentStatus}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "18px",
                    background: "#faf7fa",
                    borderRadius: "15px",
                    padding: "13px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#9a8ea1",
                    }}
                  >
                    FUNCTION
                  </div>

                  <div
                    style={{
                      marginTop: "4px",
                      fontWeight: "700",
                      color: "#51455f",
                    }}
                  >
                    {item.functionName}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    marginTop: "12px",
                  }}
                >
                  <InfoBox
                    label="Guests"
                    value={item.guests || "—"}
                  />

                  <InfoBox
                    label="Cost"
                    value={
                      item.cost
                        ? `₹${Number(
                            item.cost
                          ).toLocaleString("en-IN")}`
                        : "—"
                    }
                  />

                  <InfoBox
                    label="Pickup"
                    value={item.pickup}
                  />

                  <InfoBox
                    label="Drop"
                    value={item.drop}
                  />
                </div>

                <div
                  style={{
                    marginTop: "14px",
                    color: "#8f8496",
                    fontSize: "13px",
                  }}
                >
                  {item.date || "Date not set"}
                  {item.pickupTime
                    ? ` • ${item.pickupTime}`
                    : ""}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "9px",
                    marginTop: "18px",
                  }}
                >
                  <button
                    onClick={() =>
                      setSelectedVehicle(item)
                    }
                    style={{
                      flex: 1,
                      border:
                        "1px solid #e6ddea",
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
                    onClick={() =>
                      deleteVehicle(item.id)
                    }
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

      {/* ADD TRANSPORT MODAL */}

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
              maxWidth: "680px",
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
              Add Transportation
            </h2>

            <p
              style={{
                color: "#95899d",
                marginTop: "-8px",
                marginBottom: "22px",
              }}
            >
              Add a vehicle, driver and transfer details.
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
                name="provider"
                value={form.provider}
                onChange={handleChange}
                placeholder="Transport Provider / Company"
                style={inputStyle}
              />

              <select
                name="vehicleType"
                value={form.vehicleType}
                onChange={handleChange}
                style={inputStyle}
              >
                {vehicleTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>

              <select
                name="functionName"
                value={form.functionName}
                onChange={handleChange}
                style={inputStyle}
              >
                {functionNames.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>

              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                style={inputStyle}
              />

              <input
                name="pickup"
                value={form.pickup}
                onChange={handleChange}
                placeholder="Pickup Location"
                style={inputStyle}
              />

              <input
                name="drop"
                value={form.drop}
                onChange={handleChange}
                placeholder="Drop Location"
                style={inputStyle}
              />

              <input
                type="time"
                name="pickupTime"
                value={form.pickupTime}
                onChange={handleChange}
                style={inputStyle}
              />

              <input
                type="number"
                min="0"
                name="guests"
                value={form.guests}
                onChange={handleChange}
                placeholder="Number of Guests"
                style={inputStyle}
              />

              <input
                name="driver"
                value={form.driver}
                onChange={handleChange}
                placeholder="Driver Name"
                style={inputStyle}
              />

              <input
                name="driverPhone"
                value={form.driverPhone}
                onChange={handleChange}
                placeholder="Driver Phone"
                style={inputStyle}
              />

              <input
                type="number"
                min="0"
                name="cost"
                value={form.cost}
                onChange={handleChange}
                placeholder="Transportation Cost (₹)"
                style={inputStyle}
              />

              <select
                name="paymentStatus"
                value={form.paymentStatus}
                onChange={handleChange}
                style={inputStyle}
              >
                <option>Pending</option>
                <option>Advance Paid</option>
                <option>Paid</option>
              </select>
            </div>

            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Notes / special requirements"
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
                onClick={addVehicle}
                style={primaryButton}
              >
                Save Transportation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILS MODAL */}

      {selectedVehicle && (
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
              maxWidth: "560px",
              background: "#fff",
              borderRadius: "28px",
              padding: "30px",
              boxShadow:
                "0 25px 70px rgba(50,40,60,0.22)",
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
                {selectedVehicle.provider}
              </h2>

              <button
                onClick={() =>
                  setSelectedVehicle(null)
                }
                style={{
                  border: "none",
                  background: "#f6f1f7",
                  borderRadius: "12px",
                  width: "38px",
                  height: "38px",
                  cursor: "pointer",
                  fontSize: "20px",
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                marginTop: "22px",
                lineHeight: 1.9,
                color: "#766b7e",
              }}
            >
              <div>
                <strong>Vehicle:</strong>{" "}
                {selectedVehicle.vehicleType}
              </div>

              <div>
                <strong>Function:</strong>{" "}
                {selectedVehicle.functionName}
              </div>

              <div>
                <strong>Date:</strong>{" "}
                {selectedVehicle.date || "Not set"}
              </div>

              <div>
                <strong>Pickup:</strong>{" "}
                {selectedVehicle.pickup}
              </div>

              <div>
                <strong>Drop:</strong>{" "}
                {selectedVehicle.drop}
              </div>

              <div>
                <strong>Pickup Time:</strong>{" "}
                {selectedVehicle.pickupTime || "Not set"}
              </div>

              <div>
                <strong>Guests:</strong>{" "}
                {selectedVehicle.guests || "Not set"}
              </div>

              <div>
                <strong>Driver:</strong>{" "}
                {selectedVehicle.driver || "Not added"}
              </div>

              <div>
                <strong>Driver Phone:</strong>{" "}
                {selectedVehicle.driverPhone ||
                  "Not added"}
              </div>

              <div>
                <strong>Cost:</strong>{" "}
                {selectedVehicle.cost
                  ? `₹${Number(
                      selectedVehicle.cost
                    ).toLocaleString("en-IN")}`
                  : "Not set"}
              </div>

              <div>
                <strong>Payment:</strong>{" "}
                {selectedVehicle.paymentStatus}
              </div>

              <div>
                <strong>Notes:</strong>{" "}
                {selectedVehicle.notes || "None"}
              </div>
            </div>

            <button
              onClick={() =>
                setSelectedVehicle(null)
              }
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

function StatCard({ icon, value, label }) {
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
          fontSize: "25px",
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

function InfoBox({ label, value }) {
  return (
    <div
      style={{
        background: "#faf7fa",
        padding: "12px",
        borderRadius: "14px",
        minWidth: 0,
      }}
    >
      <small
        style={{
          color: "#9b909f",
          display: "block",
        }}
      >
        {label}
      </small>

      <div
        style={{
          marginTop: "4px",
          fontWeight: "700",
          color: "#51455f",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value || "—"}
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

const primaryButton = {
  border: "none",
  borderRadius: "13px",
  padding: "12px 20px",
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
