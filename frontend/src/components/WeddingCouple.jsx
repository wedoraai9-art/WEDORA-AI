import React, { useEffect, useState } from "react";

const STORAGE_KEY = "wedora_wedding_couple";

const defaultData = {
  bride: {
    name: "",
    outfit: "",
    jewellery: "",
    makeup: "",
    hair: "",
    shoes: "",
    notes: "",
  },
  groom: {
    name: "",
    outfit: "",
    sherwani: "",
    shoes: "",
    accessories: "",
    grooming: "",
    notes: "",
  },
};

export default function WeddingCouple() {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : defaultData;
    } catch {
      return defaultData;
    }
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const updatePerson = (person, field, value) => {
    setData((current) => ({
      ...current,
      [person]: {
        ...current[person],
        [field]: value,
      },
    }));

    setSaved(false);
  };

  const saveDetails = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
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
            Organise outfits, jewellery, makeup, grooming and styling
            requirements.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "22px",
          }}
        >
          {/* BRIDE */}
          <section
            style={{
              background: "#fff",
              borderRadius: "26px",
              padding: "26px",
              border: "1px solid #eee5ef",
              boxShadow: "0 10px 32px rgba(90,70,100,0.07)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                marginBottom: "22px",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "17px",
                  background:
                    "linear-gradient(135deg, #f7dce7, #eee5f8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                }}
              >
                ♡
              </div>

              <div>
                <h2
                  style={{
                    margin: 0,
                    color: "#51455f",
                    fontSize: "24px",
                  }}
                >
                  Bride
                </h2>

                <p
                  style={{
                    margin: "4px 0 0",
                    color: "#968b9e",
                    fontSize: "13px",
                  }}
                >
                  Bridal styling checklist
                </p>
              </div>
            </div>

            <Field
              label="Bride Name"
              value={data.bride.name}
              onChange={(value) =>
                updatePerson("bride", "name", value)
              }
              placeholder="Enter bride name"
            />

            <Field
              label="Main Outfit"
              value={data.bride.outfit}
              onChange={(value) =>
                updatePerson("bride", "outfit", value)
              }
              placeholder="Lehenga / Saree / Gown"
            />

            <Field
              label="Jewellery"
              value={data.bride.jewellery}
              onChange={(value) =>
                updatePerson("bride", "jewellery", value)
              }
              placeholder="Necklace, earrings, bangles..."
            />

            <Field
              label="Makeup Artist"
              value={data.bride.makeup}
              onChange={(value) =>
                updatePerson("bride", "makeup", value)
              }
              placeholder="Makeup artist / studio"
            />

            <Field
              label="Hair Styling"
              value={data.bride.hair}
              onChange={(value) =>
                updatePerson("bride", "hair", value)
              }
              placeholder="Hair stylist / hairstyle"
            />

            <Field
              label="Shoes"
              value={data.bride.shoes}
              onChange={(value) =>
                updatePerson("bride", "shoes", value)
              }
              placeholder="Bridal footwear"
            />

            <Textarea
              label="Notes"
              value={data.bride.notes}
              onChange={(value) =>
                updatePerson("bride", "notes", value)
              }
              placeholder="Any special bridal requirements..."
            />
          </section>

          {/* GROOM */}
          <section
            style={{
              background: "#fff",
              borderRadius: "26px",
              padding: "26px",
              border: "1px solid #eee5ef",
              boxShadow: "0 10px 32px rgba(90,70,100,0.07)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                marginBottom: "22px",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "17px",
                  background:
                    "linear-gradient(135deg, #e4eafa, #eee5f8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                }}
              >
                ♢
              </div>

              <div>
                <h2
                  style={{
                    margin: 0,
                    color: "#51455f",
                    fontSize: "24px",
                  }}
                >
                  Groom
                </h2>

                <p
                  style={{
                    margin: "4px 0 0",
                    color: "#968b9e",
                    fontSize: "13px",
                  }}
                >
                  Groom styling checklist
                </p>
              </div>
            </div>

            <Field
              label="Groom Name"
              value={data.groom.name}
              onChange={(value) =>
                updatePerson("groom", "name", value)
              }
              placeholder="Enter groom name"
            />

            <Field
              label="Main Outfit"
              value={data.groom.outfit}
              onChange={(value) =>
                updatePerson("groom", "outfit", value)
              }
              placeholder="Sherwani / Suit / Tuxedo"
            />

            <Field
              label="Sherwani / Suit Details"
              value={data.groom.sherwani}
              onChange={(value) =>
                updatePerson("groom", "sherwani", value)
              }
              placeholder="Colour, designer, alterations..."
            />

            <Field
              label="Shoes"
              value={data.groom.shoes}
              onChange={(value) =>
                updatePerson("groom", "shoes", value)
              }
              placeholder="Jutti / Formal shoes"
            />

            <Field
              label="Accessories"
              value={data.groom.accessories}
              onChange={(value) =>
                updatePerson("groom", "accessories", value)
              }
              placeholder="Watch, sehra, jewellery..."
            />

            <Field
              label="Grooming"
              value={data.groom.grooming}
              onChange={(value) =>
                updatePerson("groom", "grooming", value)
              }
              placeholder="Hair, beard, salon..."
            />

            <Textarea
              label="Notes"
              value={data.groom.notes}
              onChange={(value) =>
                updatePerson("groom", "notes", value)
              }
              placeholder="Any special groom requirements..."
            />
          </section>
        </div>

        <div
          style={{
            marginTop: "24px",
            background: "#fff",
            borderRadius: "24px",
            padding: "22px",
            border: "1px solid #eee5ef",
            boxShadow: "0 8px 25px rgba(90,70,100,0.06)",
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
                fontSize: "17px",
              }}
            >
              Styling details saved automatically
            </div>

            <div
              style={{
                color: "#968b9e",
                fontSize: "13px",
                marginTop: "5px",
              }}
            >
              Your information stays saved in this browser.
            </div>
          </div>

          <button
            onClick={saveDetails}
            style={{
              border: "none",
              borderRadius: "14px",
              padding: "13px 24px",
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
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: "15px" }}>
      <label
        style={{
          display: "block",
          marginBottom: "7px",
          fontSize: "13px",
          fontWeight: "600",
          color: "#6f6478",
        }}
      >
        {label}
      </label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "13px 14px",
          borderRadius: "13px",
          border: "1px solid #e5dce8",
          background: "#fff",
          outline: "none",
          fontSize: "14px",
          color: "#51455f",
        }}
      />
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: "5px" }}>
      <label
        style={{
          display: "block",
          marginBottom: "7px",
          fontSize: "13px",
          fontWeight: "600",
          color: "#6f6478",
        }}
      >
        {label}
      </label>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "13px 14px",
          borderRadius: "13px",
          border: "1px solid #e5dce8",
          background: "#fff",
          outline: "none",
          fontSize: "14px",
          color: "#51455f",
          resize: "vertical",
        }}
      />
    </div>
  );
}
