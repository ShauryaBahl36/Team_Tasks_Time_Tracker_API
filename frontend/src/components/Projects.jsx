import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Projects() {
  const token = localStorage.getItem("access");

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  const [loading, setLoading] = useState(false);

  // Create project form
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
  });

  // Member add/remove form
  const [memberData, setMemberData] = useState({
    user_id: "",
    action: "add",
    role: "Member",
  });

  // Timesheet summary filters
  const [summaryFilters, setSummaryFilters] = useState({
    from: "",
    to: "",
  });

  const [summaryResult, setSummaryResult] = useState(null);

  // Fetch all projects
  const fetchProjects = async () => {
    try {
      setLoading(true);

      const response = await axios.get("http://127.0.0.1:8000/url/projects/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // handle pagination
      if (response.data.results) {
        setProjects(response.data.results);
      } else {
        setProjects(response.data);
      }
    } catch (error) {
      console.log(error.response?.data || error.message);
      alert("Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Create project
  const handleCreateProject = async () => {
    try {
      await axios.post("http://127.0.0.1:8000/url/projects/", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Project Created Successfully!");
      setFormData({ name: "", code: "", description: "" });
      fetchProjects();
    } catch (error) {
      console.log(error.response?.data || error.message);
      alert("Project creation failed");
    }
  };

  // Archive project
  const handleArchive = async (id) => {
    try {
      await axios.post(
        `http://127.0.0.1:8000/url/projects/${id}/archive/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Project Archived Successfully!");
      fetchProjects();
    } catch (error) {
      console.log(error.response?.data || error.message);
      alert("Failed to archive project");
    }
  };

  // Reactivate project
  const handleReactivate = async (id) => {
    try {
      await axios.post(
        `http://127.0.0.1:8000/url/projects/${id}/reactivate/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Project Reactivated Successfully!");
      fetchProjects();
    } catch (error) {
      console.log(error.response?.data || error.message);
      alert("Failed to reactivate project");
    }
  };

  // Add/Remove members
  const handleMemberAction = async () => {
    if (!selectedProject) {
      alert("Please select a project first");
      return;
    }

    try {
      await axios.post(
        `http://127.0.0.1:8000/url/projects/${selectedProject.id}/members/`,
        memberData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Member action completed successfully!");
    } catch (error) {
      console.log(error.response?.data || error.message);
      alert("Member action failed (Only manager/admin allowed)");
    }
  };

  // Timesheet summary
  const fetchTimesheetSummary = async () => {
    if (!selectedProject) {
      alert("Please select a project first");
      return;
    }

    if (!summaryFilters.from || !summaryFilters.to) {
      alert("Please enter From and To dates");
      return;
    }

    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/url/projects/${selectedProject.id}/timesheet/summary/?from=${summaryFilters.from}&to=${summaryFilters.to}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSummaryResult(response.data);
    } catch (error) {
      console.log(error.response?.data || error.message);
      alert("Failed to fetch summary (Only manager/admin allowed)");
    }
  };

  return (
    <div style={{ 
        padding: "20px",
        backgroundColor: "#0f172a",
        minHeight: "100vh",
        color: "white", 
    }}>
      <h2>Projects Dashboard</h2>

      <hr />

      {/* Create Project */}
      <h3>Create Project</h3>
      <div style={{ display: "flex", flexDirection: "column", width: "300px" }}>
        <input
          type="text"
          placeholder="Project Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />

        <input
          type="text"
          placeholder="Project Code"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
        />

        <textarea
          placeholder="Description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />

        <button onClick={handleCreateProject} style={{ marginTop: "10px" }}>
          Create Project
        </button>
      </div>

      <hr />

      {/* Project List */}
      <h3>My Projects</h3>

      {loading ? (
        <p>Loading projects...</p>
      ) : projects.length === 0 ? (
        <p>No projects found.</p>
      ) : (
        <div style={{ display: "flex", gap: "20px" }}>
          {/* Projects Sidebar */}
          <div style={{ width: "40%" }}>
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => {
                  setSelectedProject(project);
                  setSummaryResult(null);
                }}
                style={{
                    padding: "16px",
                    border: selectedProject?.id === project.id ? "2px solid #007bff" : "1px solid #444",
                    marginBottom: "12px",
                    cursor: "pointer",
                    borderRadius: "10px",
                    backgroundColor: selectedProject?.id === project.id ? "#1e293b" : "#111827",
                    color: "white",
                    boxShadow: "0px 2px 8px rgba(0,0,0,0.4)",
                }}
              >
                <h4 style={{ margin: "0", fontSize: "18px", color: "#60a5fa" }}>{project.name}</h4>
                <p style={{ margin: "6px 0", fontSize: "14px" }}>
                  <b style={{ color: "#cbd5e1" }}>Code:</b> {project.code}
                </p>
                <p style={{ margin: "6px 0", fontSize: "14px", color: "#d1d5db" }}>{project.description}</p>

                <p style={{ margin: "8px 0", fontSize: "14px" }}>
                  <b style={{ color: "#cbd5e1" }}>Status:</b>{" "}
                  {project.is_archived ? (
                    <span style={{ color: "red" }}>Archived</span>
                  ) : (
                    <span style={{ color: "green" }}>Active</span>
                  )}
                </p>
              </div>
            ))}
          </div>

          {/* Project Details Panel */}
          <div style={{ width: "60%" }}>
            {selectedProject ? (
              <>
                <h3 style={{ color: "#60a5fa" }}>Selected Project: {selectedProject.name}</h3>

                {/* Archive / Reactivate */}
                {selectedProject.is_archived ? (
                  <button onClick={() => handleReactivate(selectedProject.id)}>
                    Reactivate Project
                  </button>
                ) : (
                  <button onClick={() => handleArchive(selectedProject.id)}>
                    Archive Project
                  </button>
                )}

                <hr />

                {/* Member Add/Remove */}
                <h4>Manage Members</h4>
                <input
                  type="number"
                  placeholder="User ID"
                  value={memberData.user_id}
                  onChange={(e) =>
                    setMemberData({ ...memberData, user_id: e.target.value })
                  }
                />

                <select
                  value={memberData.action}
                  onChange={(e) =>
                    setMemberData({ ...memberData, action: e.target.value })
                  }
                >
                  <option value="add">Add</option>
                  <option value="remove">Remove</option>
                </select>

                <select
                  value={memberData.role}
                  onChange={(e) =>
                    setMemberData({ ...memberData, role: e.target.value })
                  }
                >
                  <option value="Member">Member</option>
                  <option value="Manager">Manager</option>
                </select>

                <button onClick={handleMemberAction}>Submit</button>

                <hr />

                {/* Timesheet Summary */}
                <h4>Timesheet Summary</h4>
                <label>From:</label>
                <input
                  type="date"
                  value={summaryFilters.from}
                  onChange={(e) =>
                    setSummaryFilters({ ...summaryFilters, from: e.target.value })
                  }
                />

                <label>To:</label>
                <input
                  type="date"
                  value={summaryFilters.to}
                  onChange={(e) =>
                    setSummaryFilters({ ...summaryFilters, to: e.target.value })
                  }
                />

                <button onClick={fetchTimesheetSummary}>
                  Get Summary
                </button>

                {summaryResult && (
                  <div
                    style={{
                      marginTop: "15px",
                      padding: "10px",
                      border: "1px solid gray",
                      borderRadius: "8px",
                    }}
                  >
                    <p>
                      <b>Total Logged Time:</b> {summaryResult.total_logged_time}
                    </p>
                    <p>
                      <b>Billable Time:</b> {summaryResult.billable_time}
                    </p>
                    <p>
                      <b>Total Entries:</b> {summaryResult.total_entries}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p>Select a project to view details.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}