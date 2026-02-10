import React, { useState, useEffect, useEffectEvent } from "react";
import axios from "axios";

export default function Tasks() {
  const token = localStorage.getItem("access");

  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    project: "",
    title: "",
    description: "",
    priority: "Low",
    status: "To-Do",
    due_date: "",
    estimate_hours: "",
    assigned_to: "",
  });

  const fetchTasksNormal = async () => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/url/tasks/?search=${search}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.results) {
        setTasks(response.data.results)
      } else {
        setTasks(response.data);
      }
    } catch (error) {
      console.log(error.response?.data || error.message);
      alert("Failed to fetch tasks");
    }
  };

  const fetchTasksEvent = useEffectEvent(() => {
    fetchTasksNormal();
  });

  useEffect(() => {
    fetchTasksEvent();
  }, []);

  const handleCreateTask = async () => {
    try {
      await axios.post("http://127.0.0.1:8000/url/tasks/", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Task Created successfully!");

      setFormData({
        project: "",
        title: "",
        description: "",
        priority: "Low",
        status: "To-Do",
        due_date: "",
        estimate_hours: "",
        assigned_to: "",
      });

      fetchTasksNormal();
    } catch (error) {
      console.log(error.response?.data || error.message);
      alert("Task creation failed");
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/url/tasks/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Task Deleted successfully");
      fetchTasksNormal();
    } catch (error) {
      console.log(error.response?.data || error.message);
      alert("Task delete failed");
    }
  };

  const handleUpdateTask = async (id, updatedTask) => {
    try {
      await axios.put(`http://127.0.0.1:8000/url/tasks/${id}/`, updatedTask, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Task Updated Successfully!");
      fetchTasksNormal();
    } catch (error) {
      console.log(error.response?.data || error.message);
      alert("Task update failed");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Task Dashboard</h2>

      {/* Search */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={fetchTasksNormal}>Search</button>
      </div>

      {/* Create Task Form */}
      <h3>Create Task</h3>
      <div style={{ display: "flex", flexDirection: "column", width: "300px" }}>
        <input
          type="number"
          placeholder="Project ID"
          value={formData.project}
          onChange={(e) => setFormData({ ...formData, project: e.target.value })}
        />

        <input
          type="text"
          placeholder="Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />

        <textarea
          placeholder="Description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />

        <select
          value={formData.priority}
          onChange={(e) =>
            setFormData({ ...formData, priority: e.target.value })
          }
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>

        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
        >
          <option value="To-Do">To-Do</option>
          <option value="In-Progress">In-Progress</option>
          <option value="Done">Done</option>
        </select>

        <input
          type="date"
          value={formData.due_date}
          onChange={(e) =>
            setFormData({ ...formData, due_date: e.target.value })
          }
        />

        <input
          type="number"
          placeholder="Estimate Hours"
          value={formData.estimate_hours}
          onChange={(e) =>
            setFormData({ ...formData, estimate_hours: e.target.value })
          }
        />

        <input
          type="number"
          placeholder="Assigned To (User ID)"
          value={formData.assigned_to}
          onChange={(e) =>
            setFormData({ ...formData, assigned_to: e.target.value })
          }
        />

        <button onClick={handleCreateTask} style={{ marginTop: "10px" }}>
          Create Task
        </button>
      </div>

      <hr />

      {/* Task List */}
      <h3>My Assigned Tasks</h3>

      {Array.isArray(tasks) && tasks.length > 0 ? (
        tasks.map((task) => (
            <TaskCard 
            key={task.id} 
            task={task}
            onDelete={handleDeleteTask}
            onUpdate={handleUpdateTask} />
        ))
       ) : (
        <p>No tasks found</p>
       )}



      {/* {tasks.length === 0 ? (
        <p>No tasks assigned yet.</p>
      ) : (
        tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDelete={handleDeleteTask}
            onUpdate={handleUpdateTask}
          />
        ))
      )} */}
    </div>
  );
}

function TaskCard({ task, onDelete, onUpdate }) {
  const [editMode, setEditMode] = useState(false);

  const [updatedTask, setUpdatedTask] = useState({
    project: task.project,
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    due_date: task.due_date,
    estimate_hours: task.estimate_hours,
    assigned_to: task.assigned_to,
  });

  const handleSave = () => {
    onUpdate(task.id, updatedTask);
    setEditMode(false);
  };

  return (
    <div style={{ border: "1px solid gray", padding: "15px", marginBottom: "10px" }}>
      {editMode ? (
        <>
          <input
            type="text"
            value={updatedTask.title}
            onChange={(e) =>
              setUpdatedTask({ ...updatedTask, title: e.target.value })
            }
          />

          <textarea
            value={updatedTask.description}
            onChange={(e) =>
              setUpdatedTask({ ...updatedTask, description: e.target.value })
            }
          />

          <button onClick={handleSave}>Save</button>
          <button onClick={() => setEditMode(false)}>Cancel</button>
        </>
      ) : (
        <>
          <h4>{task.title}</h4>
          <p>{task.description}</p>
          <p>
            <b>Status:</b> {task.status} | <b>Priority:</b> {task.priority}
          </p>
          <button onClick={() => setEditMode(true)}>Edit</button>
          <button onClick={() => onDelete(task.id)}>Delete</button>
        </>
      )}
    </div>
  );
}