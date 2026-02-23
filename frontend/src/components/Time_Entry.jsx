// Time_Entry.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

/**
 * TimeEntries component
 * - shows filters, create entry UI
 * - displays entries with billable pills
 * - summary cards, export CSV, simple pie chart
 */
export default function TimeEntries() {
  const token = localStorage.getItem("access");

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);

  const [filters, setFilters] = useState({
    project: "",
    task: "",
    user: "",
    billable: "",
    from_date: "",
    to_date: "",
    ordering: "-start_time",
  });

  const [formData, setFormData] = useState({
    task: "",
    start_time: "",
    end_time: "",
    notes: "",
    billable: true,
  });

  // Billing rate (editable by user) used to compute estimated billing value
  const [billingRate, setBillingRate] = useState(1000); // default per-hour rate

  const canViewUsers = user?.is_staff;

  /* ------------------ Helpers ------------------ */

  // parse a duration string like "HH:MM:SS" into seconds
  const parseDurationToSeconds = (dur) => {
    if (!dur) return 0;
    if (typeof dur === "number") return dur; // already seconds maybe
    // expected format: "HH:MM:SS" or "H:MM:SS"
    const parts = String(dur)
      .split(":")
      .map((p) => p.trim());
    if (parts.length === 3) {
      const [h, m, s] = parts.map((n) => parseInt(n, 10) || 0);
      return h * 3600 + m * 60 + s;
    }
    if (parts.length === 2) {
      const [m, s] = parts.map((n) => parseInt(n, 10) || 0);
      return m * 60 + s;
    }
    // fallback: try numeric
    const n = Number(dur);
    if (!Number.isNaN(n)) return n;
    return 0;
  };

  // format seconds to "H:mm:ss"
  const formatSecondsToHMS = (secs) => {
    if (!secs && secs !== 0) return "0:00:00";
    const s = Math.floor(secs);
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");
    return `${hours}:${mm}:${ss}`;
  };

  const getTaskTitle = (entry) => {
    // backend may send entry.task_title or entry.task (id)
    if (entry.task_title) return entry.task_title;
    if (typeof entry.task === "object" && entry.task?.title)
      return entry.task.title;
    // fallback to lookup in tasks array by id (entry.task might be id)
    const taskObj = tasks.find((t) => String(t.id) === String(entry.task));
    return taskObj ? taskObj.title : String(entry.task);
  };

  const getUsername = (entry) => {
    if (entry.username) return entry.username;
    if (typeof entry.user === "object" && entry.user?.username)
      return entry.user.username;
    const u = users.find((x) => String(x.id) === String(entry.user));
    return u ? u.username : String(entry.user);
  };

  /* ------------------ Fetch functions ------------------ */

  const fetchUser = async () => {
    try {
      const res = await axios.get("http://localhost:8000/me/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
      if (res.data.is_staff) {
        fetchUsers();
      }
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:8000/url/users/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data.results || res.data || []);
    } catch (err) {
      if (err.response?.status !== 403)
        console.log(err.response?.data || err.message);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await axios.get("http://localhost:8000/url/projects/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(res.data.results || res.data || []);
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await axios.get("http://localhost:8000/url/tasks/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(res.data.results || res.data || []);
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  const fetchEntries = async () => {
    try {
      setLoading(true);

      let query = `?ordering=${filters.ordering}`;
      if (filters.project) query += `&project=${filters.project}`;
      if (filters.task) query += `&task=${filters.task}`;
      if (filters.user) query += `&user=${filters.user}`;
      if (filters.billable !== "") query += `&billable=${filters.billable}`;
      if (filters.from_date) query += `&from_date=${filters.from_date}`;
      if (filters.to_date) query += `&to_date=${filters.to_date}`;

      const res = await axios.get(
        `http://localhost:8000/url/time-entries/${query}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setEntries(res.data.results || res.data || []);
    } catch (err) {
      console.log(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchUser();
      await fetchProjects();
      await fetchTasks();
      await fetchEntries();
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------ Aggregations & Chart data ------------------ */

  // compute totals (in seconds)
  const totals = entries.reduce(
    (acc, e) => {
      const seconds = parseDurationToSeconds(e.timeline);
      acc.total += seconds;
      if (e.billable) acc.billable += seconds;
      else acc.non_billable += seconds;
      return acc;
    },
    { total: 0, billable: 0, non_billable: 0 },
  );

  const totalHoursDecimal = totals.total / 3600;
  const billableHoursDecimal = totals.billable / 3600;
  const nonBillableHoursDecimal = totals.non_billable / 3600;
  const estimatedBillingValue = billableHoursDecimal * Number(billingRate || 0);

  // pie slices angles
  const billablePercent = totals.total
    ? (totals.billable / totals.total) * 100
    : 0;
  const nonBillablePercent = totals.total
    ? (totals.non_billable / totals.total) * 100
    : 0;

  /* ------------------ Actions ------------------ */

  const handleCreateEntry = async () => {
    if (!formData.task) return alert("Please select a task");

    try {
      await axios.post("http://localhost:8000/url/time-entries/", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Time Entry Created Successfully");
      setFormData({
        task: "",
        start_time: "",
        end_time: "",
        notes: "",
        billable: true,
      });
      fetchEntries();
    } catch (err) {
      console.log(err.response?.data || err.message);
      alert(err.response?.data?.detail || "Failed to create entry");
    }
  };

  const handleDeleteEntry = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/url/time-entries/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchEntries();
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  // export current entries to CSV
  const handleExportCSV = () => {
    if (!entries || entries.length === 0) {
      alert("No entries to export");
      return;
    }
    const rows = [
      [
        "id",
        "task",
        "user",
        "start_time",
        "end_time",
        "duration",
        "billable",
        "notes",
      ],
    ];
    entries.forEach((e) => {
      rows.push([
        e.id,
        getTaskTitle(e),
        getUsername(e),
        e.start_time || "",
        e.end_time || "",
        e.timeline || formatSecondsToHMS(parseDurationToSeconds(e.timeline)),
        e.billable ? "Yes" : "No",
        (e.notes || "").replace(/\n/g, " "),
      ]);
    });

    const csvContent = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `time_entries_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ------------------ Simple Pie Chart (SVG) ------------------ */
  // draws 2-slice pie: billable vs non-billable
  const PieChart = ({ billableSeconds, nonBillableSeconds, size = 120 }) => {
    const radius = size / 2;
    const total = billableSeconds + nonBillableSeconds;
    if (total === 0) {
      // empty placeholder
      return (
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="mx-auto"
        >
          <circle
            cx={radius}
            cy={radius}
            r={radius}
            fill="#0f172a"
            stroke="#374151"
          />
          <text
            x="50%"
            y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            className="text-xs fill-slate-400"
          >
            No data
          </text>
        </svg>
      );
    }
    const a = (billableSeconds / total) * 2 * Math.PI; // angle for billable
    const x = radius + radius * Math.sin(a);
    const y = radius - radius * Math.cos(a);
    const largeFlag = a > Math.PI ? 1 : 0;

    // path for billable slice
    const dBillable = `M ${radius} ${radius} L ${radius} 0 A ${radius} ${radius} 0 ${largeFlag} 1 ${x} ${y} z`;
    // remainder path is just a full circle minus billable slice: draw background circle for non-billable
    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="mx-auto"
      >
        {/* non-billable base (draw complete circle first) */}
        <circle cx={radius} cy={radius} r={radius} fill="#052038" />
        {/* billable slice */}
        <path
          d={dBillable}
          fill="rgba(34,197,94,0.18)"
          stroke="rgba(34,197,94,0.9)"
          strokeWidth="0.5"
        />
        {/* center circle to create donut look */}
        <circle cx={radius} cy={radius} r={radius * 0.5} fill="#0f172a" />
        {/* legend text in center */}
        <text
          x="50%"
          y="46%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="text-sm fill-slate-300"
          fontWeight="600"
        >
          {Math.round((billableSeconds / total) * 100)}%
        </text>
        <text
          x="50%"
          y="60%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="text-xs fill-slate-400"
        >
          Billable
        </text>
      </svg>
    );
  };

  /* ---------------- DATE HELPERS ---------------- */

  const resetFilters = () => {
    setFilters({
      project: "",
      task: "",
      user: "",
      billable: "",
      from_date: "",
      to_date: "",
      ordering: "-start_time",
    });
    fetchEntries();
  };

  const validateDates = () => {
    if (filters.from_date && filters.to_date) {
      if (new Date(filters.from_date) > new Date(filters.to_date)) {
        alert("From Date cannot be greater than To Date");
        return false;
      }
    }
    return true;
  };

  const applyFilters = () => {
    if (!validateDates()) return;
    fetchEntries();
  };

  /* -------- QUICK RANGE BUTTONS -------- */

  const setToday = () => {
    const today = new Date().toISOString().split("T")[0];
    setFilters({ ...filters, from_date: today, to_date: today });
  };

  const setThisWeek = () => {
    const now = new Date();
    const first = new Date(now.setDate(now.getDate() - now.getDay()));
    const last = new Date(first);
    last.setDate(first.getDate() + 6);

    setFilters({
      ...filters,
      from_date: first.toISOString().split("T")[0],
      to_date: last.toISOString().split("T")[0],
    });
  };

  const setThisMonth = () => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setFilters({
      ...filters,
      from_date: first.toISOString().split("T")[0],
      to_date: last.toISOString().split("T")[0],
    });
  };

  /* ------------------ Render ------------------ */

  return (
    <div className="space-y-6">
      {/* Header + Summary */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-400">
            Time Entries Dashboard
          </h2>
          <p className="text-slate-400 text-sm">
            Track, filter and manage time logs
          </p>
        </div>

        {/* Summary cards */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="bg-slate-800 p-4 rounded-xl shadow flex flex-col">
            <span className="text-sm text-slate-400">Total Hours</span>
            <span className="text-lg font-semibold text-white">
              {totalHoursDecimal.toFixed(2)} hrs
            </span>
          </div>

          <div className="bg-slate-800 p-4 rounded-xl shadow flex flex-col">
            <span className="text-sm text-slate-400">Billable Hours</span>
            <span className="text-lg font-semibold text-green-400">
              {billableHoursDecimal.toFixed(2)} hrs
            </span>
          </div>

          <div className="bg-slate-800 p-4 rounded-xl shadow flex flex-col">
            <span className="text-sm text-slate-400">Non-billable Hours</span>
            <span className="text-lg font-semibold text-rose-400">
              {nonBillableHoursDecimal.toFixed(2)} hrs
            </span>
          </div>

          <div className="bg-slate-800 p-4 rounded-xl shadow flex flex-col">
            <span className="text-sm text-slate-400">Estimated Billing</span>
            <span className="text-lg font-semibold text-blue-300">
              ₹ {estimatedBillingValue.toFixed(2)}
            </span>
            <div className="mt-2">
              <label className="text-xs text-slate-400">Rate / hr</label>
              <input
                type="number"
                value={billingRate}
                onChange={(e) => setBillingRate(Number(e.target.value || 0))}
                className="input-field mt-1 w-28"
              />
            </div>
          </div>

          {/* Export button */}
          <div className="flex items-center gap-2">
            <button onClick={handleExportCSV} className="btn-secondary">
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
<div className="bg-slate-800 p-6 rounded-xl shadow-md space-y-6">
  <h3 className="text-lg font-semibold text-slate-300">
    Filters
  </h3>

  {/* Project / Task / User */}
  <div className="grid md:grid-cols-3 gap-4">
    <div className="flex flex-col">
      <label className="text-xs text-slate-400 mb-1">
        Project
      </label>
      <select
        className="input-field"
        value={filters.project}
        onChange={(e) =>
          setFilters({ ...filters, project: e.target.value })
        }
      >
        <option value="">All Projects</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>

    <div className="flex flex-col">
      <label className="text-xs text-slate-400 mb-1">
        Task
      </label>
      <select
        className="input-field"
        value={filters.task}
        onChange={(e) =>
          setFilters({ ...filters, task: e.target.value })
        }
      >
        <option value="">All Tasks</option>
        {tasks.map((t) => (
          <option key={t.id} value={t.id}>
            {t.title}
          </option>
        ))}
      </select>
    </div>

    {canViewUsers && (
      <div className="flex flex-col">
        <label className="text-xs text-slate-400 mb-1">
          User
        </label>
        <select
          className="input-field"
          value={filters.user}
          onChange={(e) =>
            setFilters({ ...filters, user: e.target.value })
          }
        >
          <option value="">All Users</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.username}
            </option>
          ))}
        </select>
      </div>
    )}
  </div>

  {/* Second Row */}
  <div className="grid md:grid-cols-4 gap-4">

    {/* Billable */}
    <div className="flex flex-col">
      <label className="text-xs text-slate-400 mb-1">
        Billable Status
      </label>
      <select
        className="input-field"
        value={filters.billable}
        onChange={(e) =>
          setFilters({ ...filters, billable: e.target.value })
        }
      >
        <option value="">All</option>
        <option value="true">Billable</option>
        <option value="false">Non-Billable</option>
      </select>
    </div>

    {/* From Date */}
    <div className="flex flex-col">
      <label className="text-xs text-slate-400 mb-1">
        From Date
      </label>
      <input
        type="date"
        className="input-field"
        value={filters.from_date}
        onChange={(e) =>
          setFilters({ ...filters, from_date: e.target.value })
        }
      />
    </div>

    {/* To Date */}
    <div className="flex flex-col">
      <label className="text-xs text-slate-400 mb-1">
        To Date
      </label>
      <input
        type="date"
        className="input-field"
        value={filters.to_date}
        onChange={(e) =>
          setFilters({ ...filters, to_date: e.target.value })
        }
      />
    </div>

    {/* Buttons */}
    <div className="flex flex-col justify-end gap-2">
      <button
        onClick={applyFilters}
        className="btn-primary"
      >
        Apply Filters
      </button>

      <button
        onClick={resetFilters}
        className="btn-danger"
      >
        Clear Filters
      </button>
    </div>
  </div>

  {/* Quick Date Buttons */}
  <div className="flex flex-wrap gap-3">
    <button onClick={setToday} className="btn-secondary">
      Today
    </button>
    <button onClick={setThisWeek} className="btn-secondary">
      This Week
    </button>
    <button onClick={setThisMonth} className="btn-secondary">
      This Month
    </button>
  </div>
</div>

      {/* Create Entry */}
      <div className="bg-slate-800 p-6 rounded-xl shadow-md space-y-4">
        <h3 className="text-lg font-semibold text-slate-300">
          Create Time Entry
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          <select
            className="input-field"
            value={formData.task}
            onChange={(e) => setFormData({ ...formData, task: e.target.value })}
          >
            <option value="">Select Task</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>

          <input
            type="datetime-local"
            className="input-field"
            value={formData.start_time}
            onChange={(e) =>
              setFormData({ ...formData, start_time: e.target.value })
            }
          />

          <input
            type="datetime-local"
            className="input-field"
            value={formData.end_time}
            onChange={(e) =>
              setFormData({ ...formData, end_time: e.target.value })
            }
          />

          <textarea
            className="input-field"
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
          />
        </div>

        <label className="flex items-center gap-2 text-slate-300">
          <input
            type="checkbox"
            checked={!!formData.billable}
            onChange={(e) =>
              setFormData({ ...formData, billable: e.target.checked })
            }
            className="h-4 w-4"
          />
          Billable
        </label>

        <div className="flex gap-3">
          <button onClick={handleCreateEntry} className="btn-primary">
            Create Entry
          </button>
          <button
            onClick={() =>
              setFormData({
                task: "",
                start_time: "",
                end_time: "",
                notes: "",
                billable: true,
              })
            }
            className="btn-secondary"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Entries + Chart area */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* left: pie + legend */}
        <div className="bg-slate-800 p-6 rounded-xl shadow-md">
          <h4 className="text-slate-300 font-semibold mb-4">
            Billable Distribution
          </h4>

          <div className="flex items-center justify-between">

            {/* Compact Pie */}
            <div className="w-28 h-28">
              <PieChart
                billableSeconds={totals.billable}
                nonBillableSeconds={totals.non_billable}
                size={110}
              />
            </div>

            {/* Stats */}
            <div className="text-sm text-slate-300 space-y-2">
              <p>
                <span className="text-green-400 font-medium">
                  Billable:
                </span>{" "}
                {billableHoursDecimal.toFixed(2)} hrs
              </p>

              <p>
                <span className="text-red-400 font-medium">
                  Non-Billable:
                </span>{" "}
                {nonBillableHoursDecimal.toFixed(2)} hrs
              </p>
            </div>

          </div>
        </div>

        {/* middle & right: entries list (spans two cols on md) */}
        <div className="md:col-span-2 space-y-4">
          {loading ? (
            <p className="text-slate-400">Loading entries...</p>
          ) : entries.length === 0 ? (
            <p className="text-slate-400">No time entries found.</p>
          ) : (
            entries.map((entry) => {
              const title = getTaskTitle(entry);
              const username = getUsername(entry);
              const durationSeconds = parseDurationToSeconds(entry.timeline);
              return (
                <div
                  key={entry.id}
                  className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-md"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="text-blue-400 font-semibold">{title}</p>
                      <p className="text-slate-400 text-sm">
                        Logged by {username}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center justify-center px-3 py-1 text-xs font-medium rounded-full ${
                        entry.billable
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                      style={{ minWidth: 84, height: 32 }}
                    >
                      {entry.billable ? "Billable" : "Non-Billable"}
                    </span>
                  </div>

                  <div className="mt-3 text-slate-300 text-sm space-y-1">
                    <p>
                      <strong>Start:</strong> {entry.start_time || "-"}
                    </p>
                    <p>
                      <strong>End:</strong> {entry.end_time || "Still Running"}
                    </p>
                    <p>
                      <strong>Duration:</strong>{" "}
                      {entry.timeline || formatSecondsToHMS(durationSeconds)}
                    </p>
                    <p>
                      <strong>Notes:</strong> {entry.notes || "No notes"}
                    </p>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
