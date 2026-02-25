import React, { useState, useEffect, useEffectEvent } from "react";
import axios from "axios";

export default function Tasks() {
  const token = localStorage.getItem("access");

  /* ---------------- STATE ---------------- */

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  });

  const [formData, setFormData] = useState({
    project: "",
    title: "",
    description: "",
    priority: "Low",
    status: "To-Do",
    due_date: "",
    estimate_hours: "",
  });

  /* ---------------- FETCH FUNCTIONS ---------------- */

  const fetchTasks = async (url = null) => {
    try {
      const requestUrl = url || `http://127.0.0.1:8000/url/tasks/?search=${search}`;
      const res = await axios.get(
        requestUrl,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTasks(res.data.results || []);
      setPagination({
        count: res.data.count,
        next: res.data.next,
        previous: res.data.previous,
      });
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8000/url/projects/",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProjects(res.data.results || res.data);
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  const fetchNotifications = async () => {
    try {
        // 1️⃣ Get notifications
        const res = await axios.get(
        "http://localhost:8000/url/notifications/",
        { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = res.data.results || res.data;

        setNotifications(data);

        // 2️⃣ Mark all as read in backend
        await axios.post(
        `http://localhost:8000/url/notifications/mark_read/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
        );

        // 3️⃣ Update frontend state to mark them read immediately
        setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
        );

    } catch (err) {
        console.log(err.response?.data || err.message);
    }
    };

  const fetchTasksEvent = useEffectEvent(() => {
    fetchTasks();
    fetchProjects();
    fetchNotifications();
  })

  useEffect(() => {
    fetchTasksEvent();
  }, []);

  /* ---------------- ACTIONS ---------------- */

  const handleCreateTask = async () => {
    if (!formData.project) return alert("Select project");
    if (!formData.title) return alert("Title required");

    try {
      await axios.post(
        "http://127.0.0.1:8000/url/tasks/",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFormData({
        project: "",
        title: "",
        description: "",
        priority: "Low",
        status: "To-Do",
        due_date: "",
        estimate_hours: "",
      });

      fetchTasks();
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await axios.delete(
        `http://127.0.0.1:8000/url/tasks/${id}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTasks();
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-blue-400">
            Tasks Dashboard
          </h2>
          <p className="text-slate-400 text-sm">
            Create, manage and track tasks
          </p>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={()=> {
                fetchNotifications();
                setShowNotifications(!showNotifications);
            }}
            className="text-2xl text-slate-300"
          >
            🔔
          </button>

          {notifications.filter((n) => !n.is_read).length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-xs px-2 rounded-full">
              {notifications.filter((n) => !n.is_read).length}
            </span>
          )}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-slate-800 rounded-xl shadow-lg p-4 z-50 max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                <p className="text-slate-400 text-sm">
                    No notifications
                </p>
                ) : (
                notifications.map((n) => (
                    <div
                    key={n.id}
                    className={`border-b border-slate-700 py-2 text-sm ${
                        n.is_read ? "text-slate-400" : "text-white font-medium"
                    }`}
                    >
                    {n.message}
                    </div>
                ))
                )}
            </div>
            )}
        </div>
      </div>

      {/* SEARCH */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field w-72"
        />
        <button
          onClick={() => fetchTasks()}
          className="btn-secondary"
        >
          Search
        </button>
      </div>

      {/* CREATE TASK */}
      <div className="bg-slate-800 p-6 rounded-xl space-y-4">
        <h3 className="text-lg font-semibold text-slate-300">
          Create Task
        </h3>

        <div className="grid md:grid-cols-2 gap-4">

          <select
            className="input-field"
            value={formData.project}
            onChange={(e) =>
              setFormData({ ...formData, project: e.target.value })
            }
          >
            <option value="">Select Project</option>
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))}
          </select>

          <input
            className="input-field"
            placeholder="Title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />

          <textarea
            className="input-field md:col-span-2"
            placeholder="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />

          <select
            className="input-field"
            value={formData.priority}
            onChange={(e) =>
              setFormData({ ...formData, priority: e.target.value })
            }
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>

          <input
            type="date"
            className="input-field"
            value={formData.due_date}
            onChange={(e) =>
              setFormData({ ...formData, due_date: e.target.value })
            }
          />

          <input
            type="number"
            className="input-field"
            placeholder="Estimate Hours"
            value={formData.estimate_hours}
            onChange={(e) =>
              setFormData({ ...formData, estimate_hours: e.target.value })
            }
          />
        </div>

        <button
          onClick={handleCreateTask}
          className="btn-primary w-fit"
        >
          Create Task
        </button>
      </div>

      {/* TASK LIST */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <p className="text-slate-400">No tasks found</p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              token={token}
              onDelete={handleDeleteTask}
            />
          ))
        )}
      </div>

      {/* PAGINATION */}
      <div className="flex justify-between items-center mt-6">
        <p className="text-slate-400 text-sm">
            Total Tasks: {pagination.count}
        </p>

        <div className="flex gap-3">
            <button
            disabled={!pagination.previous}
            onClick={() => fetchTasks(pagination.previous)}
            className="btn-secondary disabled:opacity-40"
            >
            Previous
            </button>

            <button
            disabled={!pagination.next}
            onClick={() => fetchTasks(pagination.next)}
            className="btn-secondary disabled:opacity-40"
            >
            Next
            </button>
        </div>
      </div>
    </div>
  );
}

/* ================= TASK CARD ================= */

function TaskCard({ task, onDelete, token }) {

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);

  const fetchComments = async () => {
    const res = await axios.get(
      `http://localhost:8000/url/tasks/${task.id}/comments/`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setComments(res.data.results || res.data);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    await axios.post(
      `http://localhost:8000/url/tasks/${task.id}/comments/`,
      { body: newComment },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setNewComment("");
    fetchComments();
  };

  const highlightMentions = (text) =>
    text.split(/(@\w+)/g).map((part, i) =>
      part.startsWith("@") ? (
        <span key={i} className="text-yellow-400 font-medium">
          {part}
        </span>
      ) : (
        part
      )
    );

  return (
    <div className="bg-slate-800 p-5 rounded-xl space-y-3">

      <div className="flex justify-between">
        <h4 className="text-blue-400 font-semibold">
          {task.title}
        </h4>

        <button
          onClick={() => onDelete(task.id)}
          className="btn-danger"
        >
          Delete
        </button>
      </div>

      <p className="text-slate-300 text-sm">
        {task.description}
      </p>

      <button
        onClick={() => {
          setShowComments(!showComments);
          if (!showComments) fetchComments();
        }}
        className="text-blue-400 text-sm"
      >
        {showComments ? "Hide Comments" : "View Comments"}
      </button>

      {showComments && (
        <div className="bg-slate-900 p-4 rounded-lg space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="text-sm text-slate-300">
              <span className="text-blue-400 font-medium">
                {c.author_username}
              </span>
              : {highlightMentions(c.body)}
            </div>
          ))}

          <div className="flex gap-2">
            <input
              className="input-field flex-1"
              placeholder="Write comment... use @username"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button
              onClick={handleAddComment}
              className="btn-primary"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}