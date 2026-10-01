
import React, { useState } from "react";

const styles = {
  page: {
    minHeight: "100vh",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
    background:
      "linear-gradient(135deg, #f8efff 0%, #fff8fb 50%, #eef7ff 100%)",
    fontFamily: "Inter, Arial, sans-serif",
    color: "#352e43",
    position: "relative",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: "50%",
    filter: "blur(75px)",
    background: "rgba(225, 184, 245, 0.32)",
    top: -120,
    left: -100,
    pointerEvents: "none",
  },
  glow2: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: "50%",
    filter: "blur(80px)",
    background: "rgba(173, 215, 255, 0.3)",
    bottom: -150,
    right: -100,
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: 440,
    padding: "32px",
    boxSizing: "border-box",
    borderRadius: 26,
    border: "1px solid rgba(255,255,255,0.9)",
    background: "rgba(255,255,255,0.86)",
    boxShadow: "0 22px 65px rgba(100, 77, 130, 0.13)",
    backdropFilter: "blur(18px)",
  },
  back: {
    border: 0,
    background: "transparent",
    color: "#81758f",
    cursor: "pointer",
    fontSize: 13,
    padding: "0 0 22px",
  },
  logo: {
    width: 50,
    height: 50,
    margin: "0 auto 10px",
    display: "grid",
    placeItems: "center",
    borderRadius: 16,
    background: "linear-gradient(135deg, #d6b4f5, #f4b8d9 55%, #b8dcff)",
    color: "#fff",
    fontSize: 25,
    fontWeight: 800,
    boxShadow: "0 8px 22px rgba(195, 151, 220, 0.25)",
  },
  brand: {
    textAlign: "center",
    fontSize: 17,
    fontWeight: 800,
    letterSpacing: "0.08em",
  },
  ai: { color: "#e28bb9" },
  eyebrow: {
    marginTop: 28,
    textAlign: "center",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.25em",
    color: "#a18ab9",
  },
  heading: {
    margin: "10px 0 8px",
    textAlign: "center",
    fontFamily: "Georgia, serif",
    fontSize: 34,
    fontWeight: 400,
  },
  subtitle: {
    margin: "0 auto 26px",
    maxWidth: 320,
    textAlign: "center",
    color: "#81798e",
    fontSize: 13,
    lineHeight: 1.7,
  },
  label: {
    display: "block",
    margin: "15px 0 8px",
    color: "#51485f",
    fontSize: 12,
    fontWeight: 700,
  },
  input: {
    width: "100%",
    height: 48,
    boxSizing: "border-box",
    padding: "0 14px",
    border: "1px solid #e8e0ef",
    borderRadius: 12,
    outline: "none",
    background: "#fff",
    color: "#352e43",
    fontSize: 13,
  },
  passwordWrap: { position: "relative" },
  show: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    border: 0,
    background: "transparent",
    color: "#9675b4",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  error: {
    marginTop: 15,
    padding: 12,
    border: "1px solid #f0c4ce",
    borderRadius: 10,
    background: "#fff1f4",
    color: "#a52e4a",
    fontSize: 12,
    lineHeight: 1.5,
  },
  submit: {
    width: "100%",
    minHeight: 49,
    marginTop: 22,
    border: 0,
    borderRadius: 13,
    background: "linear-gradient(100deg, #d9b5f5, #f2b8d8 55%, #b8dcff)",
    color: "#342b42",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 9px 22px rgba(206, 163, 221, 0.24)",
  },
  help: {
    marginTop: 22,
    padding: 13,
    border: "1px solid #eee6f5",
    borderRadius: 12,
    background: "#fbf8ff",
    color: "#81788d",
    fontSize: 11,
    lineHeight: 1.65,
  },
  footer: {
    marginTop: 24,
    textAlign: "center",
    color: "#aaa1b3",
    fontSize: 10,
  },
};

export default function StaffLogin({
  onLogin,
  onBack,
  loading: externalLoading = false,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState("");

  const loading = localLoading || externalLoading;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Please enter your work email and password.");
      return;
    }

    if (typeof onLogin !== "function") {
      setError("Staff login is not connected yet. Please try again later.");
      return;
    }

    try {
      setLocalLoading(true);
      await onLogin({ email: cleanEmail, password });
    } catch (err) {
      setError(
        err?.message ||
          "Unable to sign in. Please check your details and try again."
      );
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <main style={styles.page}>
      <div style={styles.glow} />
      <div style={styles.glow2} />

      <section style={styles.card}>
        <button
          type="button"
          onClick={onBack}
          style={styles.back}
        >
          ← Back to WEDORA AI
        </button>

        <div style={styles.logo}>W</div>

        <div style={styles.brand}>
          WEDORA <span style={styles.ai}>AI</span>
        </div>

        <div style={styles.eyebrow}>TEAM WORKSPACE</div>

        <h1 style={styles.heading}>Welcome back</h1>

        <p style={styles.subtitle}>
          Sign in to view your assigned weddings, tasks and team workspace.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="staff-email" style={styles.label}>
            Work email
          </label>

          <input
            id="staff-email"
            type="email"
            autoComplete="username"
            placeholder="name@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            style={styles.input}
            required
            disabled={loading}
          />

          <label htmlFor="staff-password" style={styles.label}>
            Password
          </label>

          <div style={styles.passwordWrap}>
            <input
              id="staff-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={{ ...styles.input, paddingRight: 68 }}
              required
              disabled={loading}
            />

            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              style={styles.show}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {error && (
            <div role="alert" aria-live="polite" style={styles.error}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submit,
              opacity: loading ? 0.65 : 1,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "Signing in..." : "Sign in to Staff Workspace"}
            {!loading && <span aria-hidden="true"> →</span>}
          </button>
        </form>

        <div style={styles.help}>
          ✦ Your staff account and access are managed by your WEDORA AI
          administrator. Contact your team owner if you need login assistance
          or a password reset.
        </div>

        <div style={styles.footer}>
          Secure team access · WEDORA AI
        </div>
      </section>
    </main>
  );
}

