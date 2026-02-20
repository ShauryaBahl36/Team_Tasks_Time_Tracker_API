import React, { useEffect, useState } from "react";
import axios from "axios";
import Profile from "./Profile";

export default function Projects() {
  const token = localStorage.getItem("access");

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);

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

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const pageSize = 5;

  const canManageProject = user?.is_staff || selectedProject?.my_role === "Manager";

  // Fetch all projects
  const fetchProjects = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `http://127.0.0.1:8000/url/projects/?search=${search}&page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.results) {
        setProjects(response.data.results);
        setCount(response.data.count);
      } else {
        setProjects(response.data);
        setCount(response.data.length);
      }

    } catch (error) {

      // 🔥 HANDLE INVALID PAGE HERE
      if (error.response?.data?.detail === "Invalid page.") {
        setPage(1);   // Reset to page 1
        return;
      }

      console.log(error.response?.data || error.message);
      alert("Failed to fetch projects");

    } finally {
      setLoading(false);
    }
  };


  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:8000/url/users/", {
        headers: {
          Authorization: `Bearer ${token}`
        },
      });

      if (response.data.results) {
        setUsers(response.data.results);
      } else {
        setUsers(response.data);
      }
    } catch (error) {
      if (error.response?.status === 403) {
        return;
      }
      console.log(error.response?.data || error.message);
      alert("Failed to fetch users list");
    }
  };

  const fetchUser = async () => {
    try {
        const response = await axios.get("http://localhost:8000/me/", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        setUser(response.data);

        if (response.data.is_staff) {
          fetchUsers();
        }
    } catch (error) {
        console.log(error.response?.data || error.message);
    }
  };

  const handleBulkUpload = async () => {
    if (!uploadFile) {
      alert("Please select a CSV/XLSX file");
      return;
    }

    try {
      const form = new FormData();
      form.append("file", uploadFile);

      await axios.post("http://localhost:8000/url/projects/bulk-upload/", form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Bulk upload successful");
      fetchProjects();
    } catch (error) {
      console.log(error.response?.data || error.message);
      alert("Bulk upload failed");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      fetchUser();
      fetchUsers();
    };

    loadData();
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [page, search])

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
      alert("Project creation failed. You are not a Manager or Admin, so you cannot create a project.");
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

    if (!memberData.user_id) {
      alert("Please select a user");
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
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-blue-400">
          Projects Dashboard
        </h2>
        <p className="text-slate-400 text-sm">
          Manage projects, members and summaries
        </p>
      </div>

      {/* Profile */}
      <div className="bg-slate-800 p-5 rounded-xl shadow-md">
        <Profile user={user} />
      </div>

      {/* Create Project */}
      {user?.is_staff && (
        <div className="bg-slate-800 p-6 rounded-xl shadow-md space-y-5">
          <h3 className="text-lg font-semibold text-slate-300">
            Create Project
          </h3>

          <div className="grid md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Project Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="input-field"
            />

            <input
              type="text"
              placeholder="Project Code"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              className="input-field"
            />

            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="input-field"
            />
          </div>

          <button
            onClick={handleCreateProject}
            className="btn-primary w-fit"
          >
            Create Project
          </button>

          {/* Bulk Upload */}
          <div className="pt-4 border-t border-slate-700 space-y-3">
            <h4 className="text-md font-medium text-slate-300">
              Bulk Upload
            </h4>

            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={(e) => setUploadFile(e.target.files[0])}
              className="text-slate-300"
            />

            <button
              onClick={handleBulkUpload}
              className="btn-secondary w-fit"
            >
              Upload File
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="input-field w-72"
        />

        <button
          onClick={() => {
            setPage(1);
            fetchProjects();
          }}
          className="btn-secondary"
        >
          Search
        </button>
      </div>

      {/* Main Layout */}
      <div className="grid lg:grid-cols-2 gap-8">

        {/* Left Panel - Project List */}
        <div className="space-y-4">

          {loading ? (
            <p className="text-slate-400">Loading projects...</p>
          ) : projects.length === 0 ? (
            <p className="text-slate-400">No projects found.</p>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                onClick={() => {
                  setSelectedProject(project);
                  setSummaryResult(null);
                }}
                className={`p-5 rounded-xl cursor-pointer transition border
                  ${
                    selectedProject?.id === project.id
                      ? "border-blue-500 bg-slate-800"
                      : "border-slate-700 bg-slate-800 hover:bg-slate-700"
                  }`}
              >
                <h4 className="text-lg font-semibold text-blue-400">
                  {project.name}
                </h4>

                <p className="text-sm text-slate-400">
                  Code: {project.code}
                </p>

                <p className="text-sm text-slate-300 mt-2">
                  {project.description}
                </p>

                <span
                  className={`inline-block mt-3 px-3 py-1 text-xs rounded-full
                    ${
                      project.is_archived
                        ? "bg-red-500/20 text-red-400"
                        : "bg-green-500/20 text-green-400"
                    }`}
                >
                  {project.is_archived ? "Archived" : "Active"}
                </span>
              </div>
            ))
          )}

          {/* Pagination */}
          {projects.length > 0 && (
            <div className="flex items-center justify-between pt-4">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="btn-secondary disabled:opacity-40"
              >
                Previous
              </button>

              <span className="text-sm text-slate-400">
                Page {page} of {Math.ceil(count / pageSize)}
              </span>

              <button
                disabled={page >= Math.ceil(count / pageSize)}
                onClick={() => setPage(page + 1)}
                className="btn-secondary disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}

        </div>

        {/* Right Panel - Selected Project */}
        <div className="bg-slate-800 p-6 rounded-xl shadow-md space-y-6">

          {selectedProject ? (
            <>
              <div>
                <h3 className="text-xl font-semibold text-blue-400">
                  {selectedProject.name}
                </h3>

                <p className="text-slate-300 mt-2">
                  {selectedProject.description}
                </p>
              </div>

              {/* Archive / Reactivate */}
              {canManageProject && (
                <div className="flex gap-3">
                  {selectedProject.is_archived ? (
                    <button
                      onClick={() =>
                        handleReactivate(selectedProject.id)
                      }
                      className="btn-primary"
                    >
                      Reactivate
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        handleArchive(selectedProject.id)
                      }
                      className="btn-danger"
                    >
                      Archive
                    </button>
                  )}
                </div>
              )}

              {/* Member Management */}
              {canManageProject && (
                <div className="space-y-3 pt-4 border-t border-slate-700">
                  <h4 className="text-md font-medium text-slate-300">
                    Manage Members
                  </h4>

                  <select
                    value={memberData.user_id}
                    onChange={(e) =>
                      setMemberData({
                        ...memberData,
                        user_id: e.target.value,
                      })
                    }
                    className="input-field"
                  >
                    <option value="">Select User</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.username}
                      </option>
                    ))}
                  </select>

                  <div className="flex gap-3">
                    <select
                      value={memberData.action}
                      onChange={(e) =>
                        setMemberData({
                          ...memberData,
                          action: e.target.value,
                        })
                      }
                      className="input-field"
                    >
                      <option value="add">Add</option>
                      <option value="remove">Remove</option>
                    </select>

                    <select
                      value={memberData.role}
                      onChange={(e) =>
                        setMemberData({
                          ...memberData,
                          role: e.target.value,
                        })
                      }
                      className="input-field"
                    >
                      <option value="Member">Member</option>
                      <option value="Manager">Manager</option>
                    </select>
                  </div>

                  <button
                    onClick={handleMemberAction}
                    className="btn-secondary w-fit"
                  >
                    Submit
                  </button>
                </div>
              )}

              {/* Timesheet Summary */}
              {canManageProject && (
                <div className="space-y-3 pt-4 border-t border-slate-700">
                  <h4 className="text-md font-medium text-slate-300">
                    Timesheet Summary
                  </h4>

                  <div className="flex gap-3">
                    <input
                      type="date"
                      value={summaryFilters.from}
                      onChange={(e) =>
                        setSummaryFilters({
                          ...summaryFilters,
                          from: e.target.value,
                        })
                      }
                      className="input-field"
                    />

                    <input
                      type="date"
                      value={summaryFilters.to}
                      onChange={(e) =>
                        setSummaryFilters({
                          ...summaryFilters,
                          to: e.target.value,
                        })
                      }
                      className="input-field"
                    />
                  </div>

                  <button
                    onClick={fetchTimesheetSummary}
                    className="btn-secondary w-fit"
                  >
                    Get Summary
                  </button>

                  {summaryResult && (
                    <div className="bg-slate-700 p-4 rounded-lg text-sm space-y-2">
                      <p>
                        <span className="font-medium text-slate-300">
                          Total Logged:
                        </span>{" "}
                        {summaryResult.total_logged_time}
                      </p>
                      <p>
                        <span className="font-medium text-slate-300">
                          Billable:
                        </span>{" "}
                        {summaryResult.billable_time}
                      </p>
                      <p>
                        <span className="font-medium text-slate-300">
                          Entries:
                        </span>{" "}
                        {summaryResult.total_entries}
                      </p>
                    </div>
                  )}
                </div>
              )}

            </>
          ) : (
            <p className="text-slate-400">
              Select a project to view details.
            </p>
          )}

        </div>

      </div>
    </div>
  );
}