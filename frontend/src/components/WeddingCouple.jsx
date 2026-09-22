import React, { useEffect, useMemo, useState } from "react";

const COUPLE_KEY = "wedora_wedding_couple";
const FUNCTIONS_KEY = "wedora_wedding_functions";

const DEFAULT_FUNCTIONS = [
  "Engagement",
  "Haldi",
  "Mehndi",
  "Sangeet",
  "Wedding",
  "Reception",
];

const emptyStyling = {
  bride: {
    outfit: "",
    jewellery: "",
    makeup: "",
    hair: "",
    shoes: "",
    notes: "",
  },
  groom: {
    outfit: "",
    accessories: "",
    shoes: "",
    grooming: "",
    notes: "",
  },
};

function createFunction(name) {
  return {
    id: `${name}-${Date.now()}-${Math.random()}`,
    name,
    styling: JSON.parse(JSON.stringify(emptyStyling)),
  };
}

function loadData() {
  try {
    const saved = localStorage.getItem(COUPLE_KEY);

    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}

  return {
    brideName: "",
    groomName: "",
  };
}

function loadFunctions() {
  try {
    const saved = localStorage.getItem(FUNCTIONS_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  return DEFAULT_FUNCTIONS.map((name) => createFunction(name));
}

export default function WeddingCouple() {
  const [couple, setCouple] = useState(loadData);
  const [functions, setFunctions] = useState(loadFunctions);
  const [selectedFunctionId, setSelectedFunctionId] = useState(
    functions[0]?.id || null
  );

  const [showAddFunction, setShowAddFunction] = useState(false);
  const [newFunctionName, setNewFunctionName] = useState("");

  const [saved, setSaved] = useState(false);

  const selectedFunction = useMemo(
    () =>
      functions.find(
        (item) => item.id === selectedFunctionId
      ) || functions[0],
    [functions, selectedFunctionId]
  );

  useEffect(() => {
    localStorage.setItem(COUPLE_KEY, JSON.stringify(couple));
  }, [couple]);

  useEffect(() => {
    localStorage.setItem(
      FUNCTIONS_KEY,
      JSON.stringify(functions)
    );
  }, [functions]);

  const updateStyling = (person, field, value) => {
    if (!selectedFunction) return;

    setFunctions((current) =>
      current.map((item) =>
        item.id === selectedFunction.id
          ? {
              ...item,
              styling: {
                ...item.styling,
                [person]: {
                  ...item.styling[person],
                  [field]: value,
                },
              },
            }
          : item
      )
    );

    setSaved(false);
  };

  const addFunction = () => {
    const name = newFunctionName.trim();

    if (!name) return;

    const exists = functions.some(
      (item) => item.name.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
      alert("This function already exists.");
      return;
    }

    const newFunction = createFunction(name);

    setFunctions((current) => [
      ...current,
      newFunction,
    ]);

    setSelectedFunctionId(newFunction.id);
    setNewFunctionName("");
    setShowAddFunction(false);
    setSaved(false);
  };

  const deleteFunction = () => {
    if (!selectedFunction) return;

    if (functions.length <= 1) {
      alert("At least one function must remain.");
      return;
    }

    const confirmed = window.confirm(
      `Delete ${selectedFunction.name} styling plan?`
    );

    if (!confirmed) return;

    const remaining = functions.filter(
      (item) => item.id !== selectedFunction.id
    );

    setFunctions(remaining);
    setSelectedFunctionId(remaining[0].id);
    setSaved(false);
  };

  const saveDetails = () => {
    localStorage.setItem(
      COUPLE_KEY,
      JSON.stringify(couple)
    );

    localStorage.setItem(
      FUNCTIONS_KEY,
      JSON.stringify(functions)
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  const getCompletion = (item) => {
    if (!item) return 0;

    const values = [
      item.styling?.bride?.outfit,
      item.styling?.bride?.jewellery,
      item.styling?.bride?.makeup,
      item.styling?.bride?.hair,
      item.styling?.bride?.shoes,
      item.styling?.groom?.outfit,
      item.styling?.groom?.accessories,
      item.styling?.groom?.shoes,
      item.styling?.groom?.grooming,
    ];

    const completed = values.filter(
      (value) => value && value.trim()
    ).length;

    return Math.round(
      (completed / values.length) * 100
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
            Bride & Groom
          </h1>

          <p
            style={{
              marginTop: "10px",
              color: "#8b8195",
              fontSize: "16px",
            }}
          >
            Plan the complete styling for every wedding function.
          </p>
        </div>

        {/* COUPLE */}

        <div
          style={{
            background: "#fff",
            borderRadius: "26px",
            padding: "25px",
            border: "1px solid #eee5ef",
            boxShadow: "0 10px 32px rgba(90,70,100,0.07)",
            marginBottom: "25px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "16px",
                background:
                  "linear-gradient(135deg, #f7dce7, #eee5f8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "23px",
              }}
            >
              ♡
            </div>

            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "23px",
                  color: "#51455f",
                }}
              >
                Your Couple
              </h2>

              <p
                style={{
                  margin: "4px 0 0",
                  color: "#95899d",
                  fontSize: "13px",
                }}
              >
                Names are shared across your wedding planner.
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "15px",
            }}
          >
            <div
              style={{
                background: "#faf7fa",
                borderRadius: "16px",
                padding: "17px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#9a8ea1",
                  marginBottom: "5px",
                }}
              >
                BRIDE
              </div>

              <input
                value={couple.brideName}
                onChange={(e) =>
                  setCouple((current) => ({
                    ...current,
                    brideName: e.target.value,
                  }))
                }
                placeholder="Bride name"
                style={inputStyle}
              />
            </div>

            <div
              style={{
                background: "#faf7fa",
                borderRadius: "16px",
                padding: "17px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#9a8ea1",
                  marginBottom: "5px",
                }}
              >
                GROOM
              </div>

              <input
                value={couple.groomName}
                onChange={(e) =>
                  setCouple((current) => ({
                    ...current,
                    groomName: e.target.value,
                  }))
                }
                placeholder="Groom name"
                style={inputStyle}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: "12px",
              fontSize: "12px",
              color: "#a095a7",
            }}
          >
            We will connect these names directly to the main Wedding
            Overview in the next step, so they won't need to be entered
            twice.
          </div>
        </div>

        {/* FUNCTIONS */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(220px, 280px) 1fr",
            gap: "20px",
            alignItems: "start",
          }}
        >
          {/* FUNCTION LIST */}

          <div
            style={{
              background: "#fff",
              borderRadius: "26px",
              padding: "20px",
              border: "1px solid #eee5ef",
              boxShadow: "0 10px 32px rgba(90,70,100,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
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
                  FUNCTIONS
                </div>

                <h3
                  style={{
                    margin: "5px 0 0",
                    color: "#51455f",
                    fontSize: "20px",
                  }}
                >
                  Styling Plans
                </h3>
              </div>
            </div>

            {functions.map((item) => {
              const completion = getCompletion(item);
              const active =
                selectedFunction?.id === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() =>
                    setSelectedFunctionId(item.id)
                  }
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: active
                      ? "1px solid #c7add8"
                      : "1px solid #eee5ef",
                    background: active
                      ? "linear-gradient(135deg, #faf0f5, #f2eef9)"
                      : "#fff",
                    borderRadius: "16px",
                    padding: "14px",
                    marginBottom: "9px",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: "700",
                        color: "#51455f",
                      }}
                    >
                      {item.name}
                    </span>

                    <span
                      style={{
                        fontSize: "12px",
                        color:
                          completion === 100
                            ? "#769878"
                            : "#9a8ea1",
                      }}
                    >
                      {completion}%
                    </span>
                  </div>

                  <div
                    style={{
                      height: "5px",
                      background: "#eee8ef",
                      borderRadius: "10px",
                      marginTop: "10px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${completion}%`,
                        height: "100%",
                        background:
                          "linear-gradient(90deg, #d89ab1, #a88bc2)",
                        borderRadius: "10px",
                      }}
                    />
                  </div>
                </button>
              );
            })}

            <button
              onClick={() => setShowAddFunction(true)}
              style={{
                width: "100%",
                border: "1px dashed #cdbbd5",
                background: "#fcf9fc",
                color: "#876c99",
                borderRadius: "16px",
                padding: "13px",
                cursor: "pointer",
                fontWeight: "700",
                marginTop: "4px",
              }}
            >
              + Add Function
            </button>
          </div>

          {/* SELECTED FUNCTION */}

          {selectedFunction && (
            <div>
              <div
                style={{
                  background: "#fff",
                  borderRadius: "26px",
                  padding: "25px",
                  border: "1px solid #eee5ef",
                  boxShadow: "0 10px 32px rgba(90,70,100,0.07)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "15px",
                    flexWrap: "wrap",
                    marginBottom: "25px",
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
                      CURRENT FUNCTION
                    </div>

                    <h2
                      style={{
                        margin: "5px 0 0",
                        color: "#51455f",
                        fontSize: "28px",
                      }}
                    >
                      {selectedFunction.name}
                    </h2>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        background: "#f6edf7",
                        padding: "10px 15px",
                        borderRadius: "13px",
                        color: "#876c99",
                        fontWeight: "700",
                      }}
                    >
                      {getCompletion(selectedFunction)}% Complete
                    </div>

                    <button
                      onClick={deleteFunction}
                      style={{
                        border: "none",
                        background: "#faeef0",
                        color: "#a16f7c",
                        borderRadius: "12px",
                        padding: "10px 13px",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* BRIDE */}

                <StylingSection
                  title="Bride Styling"
                  icon="♡"
                  fields={[
                    {
                      label: "Outfit",
                      field: "outfit",
                      placeholder:
                        "Lehenga / Saree / Gown",
                    },
                    {
                      label: "Jewellery",
                      field: "jewellery",
                      placeholder:
                        "Necklace, earrings, bangles...",
                    },
                    {
                      label: "Makeup",
                      field: "makeup",
                      placeholder:
                        "Makeup artist / makeup look",
                    },
                    {
                      label: "Hair",
                      field: "hair",
                      placeholder:
                        "Hair stylist / hairstyle",
                    },
                    {
                      label: "Shoes",
                      field: "shoes",
                      placeholder:
                        "Bridal footwear",
                    },
                  ]}
                  values={selectedFunction.styling.bride}
                  onChange={(field, value) =>
                    updateStyling("bride", field, value)
                  }
                />

                <div style={{ height: "20px" }} />

                {/* GROOM */}

                <StylingSection
                  title="Groom Styling"
                  icon="♢"
                  fields={[
                    {
                      label: "Outfit",
                      field: "outfit",
                      placeholder:
                        "Sherwani / Suit / Tuxedo",
                    },
                    {
                      label: "Accessories",
                      field: "accessories",
                      placeholder:
                        "Watch, sehra, jewellery...",
                    },
                    {
                      label: "Shoes",
                      field: "shoes",
                      placeholder:
                        "Jutti / Formal shoes",
                    },
                    {
                      label: "Grooming",
                      field: "grooming",
                      placeholder:
                        "Hair, beard, salon...",
                    },
                  ]}
                  values={selectedFunction.styling.groom}
                  onChange={(field, value) =>
                    updateStyling("groom", field, value)
                  }
                />

                {/* NOTES */}

                <div
                  style={{
                    marginTop: "20px",
                    background: "#faf7fa",
                    borderRadius: "18px",
                    padding: "18px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "700",
                      color: "#51455f",
                      marginBottom: "9px",
                    }}
                  >
                    Function Notes
                  </div>

                  <textarea
                    value={
                      selectedFunction.styling.bride.notes
                    }
                    onChange={(e) =>
                      updateStyling(
                        "bride",
                        "notes",
                        e.target.value
                      )
                    }
                    rows={4}
                    placeholder="Special styling requirements, colour theme, designer details, alterations, family jewellery, etc."
                    style={{
                      ...inputStyle,
                      width: "100%",
                      boxSizing: "border-box",
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>

              {/* SAVE */}

              <div
                style={{
                  marginTop: "16px",
                  background: "#fff",
                  borderRadius: "22px",
                  padding: "18px 20px",
                  border: "1px solid #eee5ef",
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
                      fontWeight: "700",
                      color: "#51455f",
                    }}
                  >
                    {saved
                      ? "✓ Styling details saved"
                      : "Your styling plan is saved automatically"}
                  </div>

                  <div
                    style={{
                      color: "#95899d",
                      fontSize: "12px",
                      marginTop: "4px",
                    }}
                  >
                    Each function keeps its own styling details.
                  </div>
                </div>

                <button
                  onClick={saveDetails}
                  style={{
                    border: "none",
                    borderRadius: "13px",
                    padding: "12px 22px",
                    background:
                      "linear-gradient(135deg, #9c7db6, #7f699a)",
                    color: "#fff",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  {saved ? "✓ Saved" : "Save Details"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ADD FUNCTION MODAL */}

      {showAddFunction && (
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
              maxWidth: "460px",
              background: "#fff",
              borderRadius: "28px",
              padding: "28px",
              boxShadow:
                "0 25px 70px rgba(50,40,60,0.22)",
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "#51455f",
              }}
            >
              Add Wedding Function
            </h2>

            <p
              style={{
                color: "#95899d",
                fontSize: "14px",
                marginTop: "8px",
              }}
            >
              Add any celebration that needs its own styling plan.
            </p>

            <input
              autoFocus
              value={newFunctionName}
              onChange={(e) =>
                setNewFunctionName(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addFunction();
                }
              }}
              placeholder="e.g. Cocktail Night"
              style={{
                ...inputStyle,
                width: "100%",
                boxSizing: "border-box",
                marginTop: "15px",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <button
                onClick={() => {
                  setShowAddFunction(false);
                  setNewFunctionName("");
                }}
                style={secondaryButton}
              >
                Cancel
              </button>

              <button
                onClick={addFunction}
                style={primaryButton}
              >
                Add Function
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StylingSection({
  title,
  icon,
  fields,
  values,
  onChange,
}) {
  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, #fffafa, #faf7fc)",
        borderRadius: "20px",
        padding: "20px",
        border: "1px solid #f0e8f1",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "18px",
        }}
      >
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "14px",
            background:
              "linear-gradient(135deg, #f7dce7, #eee5f8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
          }}
        >
          {icon}
        </div>

        <h3
          style={{
            margin: 0,
            color: "#51455f",
            fontSize: "20px",
          }}
        >
          {title}
        </h3>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "14px",
        }}
      >
        {fields.map((item) => (
          <div key={item.field}>
            <label
              style={{
                display: "block",
                marginBottom: "7px",
                fontSize: "12px",
                fontWeight: "600",
                color: "#766b7e",
              }}
            >
              {item.label}
            </label>

            <input
              value={values?.[item.field] || ""}
              onChange={(e) =>
                onChange(item.field, e.target.value)
              }
              placeholder={item.placeholder}
              style={inputStyle}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "13px 14px",
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
