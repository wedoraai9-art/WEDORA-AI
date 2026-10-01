
import React, { useMemo, useState } from "react";

const COLORS = {
  text: "#352e43",
  muted: "#82798f",
  purple: "#9874b7",
  border: "#eee7f4",
  background: "#faf7ff",
  pink: "#f5d8e8",
  blue: "#dceeff",
  green: "#dff3e8",
};

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #faf6ff 0%, #fff9fb 50%, #f0f8ff 100%)",
    fontFamily: "Inter, Arial, sans-serif",
    color: COLORS.text,
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 5,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
    padding: "15px 5%",
    background: "rgba(255,255,255,0.88)",
    borderBottom: "1px solid rgba(230,220,240,0.8)",
    backdropFilter: "blur(16px)",
  },
  brand: {
    fontSize: 17,
    fontWeight: 800,
    letterSpacing: "0.07em",
  },
  brandAI: { color: "#e28bb9" },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  user: {
    color: COLORS.muted,
    fontSize: 12,
  },
  logout: {
    padding: "10px 15px",
    border: "1px solid #eadff1",
    borderRadius: 11,
    background: "#fff",
    color: "#74588e",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
  },
  container: {
    width: "min(1160px, 92%)",
    margin: "0 auto",
    padding: "36px 0 60px",
  },
  eyebrow: {
    color: "#a18ab9",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.22em",
  },
  title: {
    margin: "8px 0 6px",
    fontFamily: "Georgia, serif",
    fontSize: "clamp(28px, 4vw, 40px)",
    fontWeight: 400,
    letterSpacing: "-0.035em",
  },
  subtitle: {
    margin: 0,
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 1.7,
  },
  hero: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    flexWrap: "wrap",
    padding: "26px",
    marginTop: 24,
    border: "1px solid rgba(255,255,255,0.9)",
    borderRadius: 22,
    background:
      "linear-gradient(110deg, rgba(236,220,255,0.85), rgba(255,233,244,0.85), rgba(224,241,255,0.9))",
    boxShadow: "0 12px 36px rgba(104,78,135,0.07)",
  },
  heroName: {
    margin: "5px 0",
    fontSize: 21,
    fontWeight: 750,
  },
  heroText: {
    margin: 0,
    color: "#766d85",
    fontSize: 12,
  },
  avatar: {
    width: 58,
    height: 58,
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    borderRadius: 19,
    background: "linear-gradient(135deg, #d8b8f4, #f3c3dd, #b9dcfa)",
    color: "#fff",
    fontSize: 23,
    fontWeight: 800,
  },
  sectionTitle: {
    margin: "32px 0 14px",
    fontSize: 16,
    fontWeight: 750,
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 14,
    marginTop: 20,
  },
  stat: {
    padding: "19px",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 17,
    background: "rgba(255,255,255,0.85)",
    boxShadow: "0 7px 24px rgba(92,70,120,0.045)",
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: 650,
  },
  statValue: {
    marginTop: 9,
    fontSize: 29,
    fontWeight: 800,
    letterSpacing: "-0.04em",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 14,
  },
  search: {
    flex: "1 1 230px",
    minWidth: 0,
    maxWidth: 380,
    height: 42,
    boxSizing: "border-box",
    padding: "0 13px",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 11,
    background: "#fff",
    color: COLORS.text,
    outline: "none",
    fontSize: 12,
  },
  filter: {
    height: 42,
    padding: "0 12px",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 11,
    background: "#fff",
    color: "#62566f",
    fontSize: 12,
    outline: "none",
  },
  taskList: {
    display: "grid",
    gap: 12,
  },
  task: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 14,
    padding: 18,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 17,
    background: "rgba(255,255,255,0.88)",
    boxShadow: "0 7px 22px rgba(92,70,120,0.04)",
  },
  taskTitle: {
    margin: "0 0 7px",
    fontSize: 14,
    fontWeight: 750,
    lineHeight: 1.5,
  },
  taskMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 1.7,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 9px",
    borderRadius: 20,
    fontSize: 10,
    fontWeight: 750,
    whiteSpace: "nowrap",
  },
  statusSelect: {
    minWidth: 130,
    height: 36,
    padding: "0 9px",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    background: "#fff",
    color: "#62566f",
    fontSize: 11,
  },
  empty: {
    padding: 34,
    textAlign: "center",
    border: `1px dashed #d9cbe5`,
    borderRadius: 16,
    background: "rgba(255,255,255,0.6)",
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 1.7,
  },
  notice: {
    marginTop: 24,
    padding: 14,
    border: "1px solid #e8e0f0",
    borderRadius: 13,
    background: "#fbf8ff",
    color: "#82798f",
    fontSize: 11,
    lineHeight: 1.6,
  },
};

function getTaskId(task) {
  return String(task?._id ?? task?.id ?? task?.task_id ?? "");
}

function getTaskTitle(task) {
  return (
    task?.title ??
    task?.task ??
    task?.name ??
    task?.description ??
    "Untitled task"
  );
}

function getTaskStatus(task) {
  const value = String(task?.status ?? "todo").toLowerCase();
  if (["completed", "done"].includes(value)) return "completed";
  if (["in_progress", "in progress", "doing"].includes(value))
    return "in_progress";
  if (["cancelled", "canceled"].includes(value)) return "cancelled";
  return "todo";
}

function getStatusLabel(status) {
  return {
    todo: "To do",
    in_progress: "In progress",
    completed: "Completed",
    cancelled: "Cancelled",
  }[status] || "To do";
}

function getStatusColor(status) {
  return {
    todo: { background: "#f1eafb", color: "#7b5ba2" },
    in_progress: { background: "#e4f1ff", color: "#3975ae" },
    completed: { background: "#e3f5e9", color: "#347b51" },
    cancelled: { background: "#f5e9eb", color: "#98606c" },
  }[status] || { background: "#f1eafb", color: "#7b5ba2" };
}

export default function StaffDashboard({
  staff = {},
  tasks = [],
  onUpdateTask,
  onLogout,
  canUpdateTasks = false,
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");

  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return safeTasks.filter((task) => {
      const status = getTaskStatus(task);
      const title = getTaskTitle(task).toLowerCase();
      const wedding = String(
        task?.wedding_name ?? task?.weddingName ?? task?.client_name ?? ""
      ).toLowerCase();

      const matchesSearch =
        !query || title.includes(query) || wedding.includes(query);

      const matchesFilter = filter === "all" || status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [safeTasks, search, filter]);

  const counts = useMemo(() => {
    return safeTasks.reduce(
      (result, task) => {
        const status = getTaskStatus(task);
        result.total += 1;
        if (status === "todo") result.todo += 1;
        if (status === "in_progress") result.inProgress += 1;
        if (status === "completed") result.completed += 1;
        return result;
      },
      { total: 0, todo: 0, inProgress: 0, completed: 0 }
    );
  }, [safeTasks]);

  const name =
    staff?.name ??
    staff?.full_name ??
    staff?.fullName ??
    staff?.username ??
    "Team Member";

  const role = staff?.job_title ?? staff?.jobTitle ?? staff?.role ?? "Staff";
  const initial = String(name).trim().charAt(0).toUpperCase() || "W";

  const handleStatusChange = async (task, nextStatus) => {
    const id = getTaskId(task);
    if (!id || typeof onUpdateTask !== "function") {
      setError("Task updates are not connected yet.");
      return;
    }

    setError("");
    setUpdatingId(id);

    try {
      await onUpdateTask(id, nextStatus);
    } catch (err) {
      setError(err?.message || "Could not update this task.");
    } finally {
      setUpdatingId("");
    }
  };

  const statCards = [
    { label: "Assigned tasks", value: counts.total, background: "#f1e6fc" },
    { label: "To do", value: counts.todo, background: "#fff0f6" },
    {
      label: "In progress",
      value: counts.inProgress,
      background: "#eaf4ff",
    },
    {
      label: "Completed",
      value: counts.completed,
      background: "#e8f7ed",
    },
  ];

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div style={styles.brand}>
          WEDORA <span style={styles.brandAI}>AI</span>
        </div>

        <div style={styles.headerRight}>
          <span style={styles.user}>
            {name} · {role}
          </span>
          <button
            type="button"
            onClick={onLogout}
            style={styles.logout}
          >
            Sign out ↗
          </button>
        </div>
      </header>

      <div style={styles.container}>
        <div style={styles.eyebrow}>YOUR TEAM WORKSPACE</div>

        <h1 style={styles.title}>Staff Dashboard</h1>

        <p style={styles.subtitle}>
          Keep track of your assigned work and wedding tasks.
        </p>

        <section style={styles.hero}>
          <div>
            <div style={styles.eyebrow}>WELCOME BACK</div>
            <h2 style={styles.heroName}>{name}</h2>
            <p style={styles.heroText}>
              {role} · Your assigned work at a glance
            </p>
          </div>
          <div style={styles.avatar} aria-hidden="true">
            {initial}
          </div>
        </section>

        <h2 style={styles.sectionTitle}>Task overview</h2>

        <section style={styles.stats}>
          {statCards.map((item) => (
            <div
              key={item.label}
              style={{
                ...styles.stat,
                background: `linear-gradient(145deg, ${item.background}, #fff 85%)`,
              }}
            >
              <div style={styles.statLabel}>{item.label}</div>
              <div style={styles.statValue}>{item.value}</div>
            </div>
          ))}
        </section>

        <h2 style={styles.sectionTitle}>My assigned tasks</h2>

        <div style={styles.toolbar}>
          <input
            type="search"
            aria-label="Search tasks"
            placeholder="Search tasks or weddings..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={styles.search}
          />

          <select
            aria-label="Filter tasks by status"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            style={styles.filter}
          >
            <option value="all">All tasks</option>
            <option value="todo">To do</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {error && (
          <div role="alert" style={styles.error || {
            ...styles.notice,
            borderColor: "#efc3cb",
            color: "#a52e4a",
          }}>
            {error}
          </div>
        )}

        {filteredTasks.length === 0 ? (
          <div style={styles.empty}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>✦</div>
            <strong>
              {safeTasks.length === 0
                ? "No tasks assigned yet"
                : "No matching tasks"}
            </strong>
            <div>
              {safeTasks.length === 0
                ? "Your assigned tasks will appear here when your team owner assigns them."
                : "Try another search or choose a different status filter."}
            </div>
          </div>
        ) : (
          <section style={styles.taskList}>
            {filteredTasks.map((task, index) => {
              const id = getTaskId(task) || `task-${index}`;
              const status = getTaskStatus(task);
              const wedding =
                task?.wedding_name ??
                task?.weddingName ??
                task?.client_name ??
                "";
              const dueDate =
                task?.due_date ?? task?.dueDate ?? task?.deadline ?? "";

              return (
                <article key={id} style={styles.task}>
                  <div style={{ flex: "1 1 230px", minWidth: 0 }}>
                    <h3 style={styles.taskTitle}>{getTaskTitle(task)}</h3>

                    <div style={styles.taskMeta}>
                      {wedding && <span>💍 {wedding}</span>}
                      {dueDate && (
                        <span>
                          📅 Due:{" "}
                          {String(dueDate).slice(0, 10)}
                        </span>
                      )}
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <span
                        style={{
                          ...styles.badge,
                          ...getStatusColor(status),
                        }}
                      >
                        {getStatusLabel(status)}
                      </span>
                    </div>
                  </div>

                  {canUpdateTasks && (
                    <div>
                      <label
                        htmlFor={`task-status-${id}`}
                        style={{
                          display: "block",
                          marginBottom: 5,
                          color: COLORS.muted,
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        Update status
                      </label>
                      <select
                        id={`task-status-${id}`}
                        value={status}
                        disabled={updatingId === id}
                        onChange={(event) =>
                          handleStatusChange(task, event.target.value)
                        }
                        style={styles.statusSelect}
                      >
                        <option value="todo">To do</option>
                        <option value="in_progress">In progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}

        <div style={styles.notice}>
          ✦ Your access to weddings, client information and task actions is
          controlled by your team owner's permissions. This dashboard only
          displays the data supplied to it by the application.
        </div>
      </div>
    </main>
  );
}

