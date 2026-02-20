import React, { useEffectEvent, useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom';
import Tasks from '../components/Tasks.jsx';
import TimeEntries from '../components/Time_Entry.jsx';
import Projects from "../components/Projects.jsx";
import Users from "../components/Users.jsx";
import axios from 'axios';

export default function Home() {
    const navigate = useNavigate();

    const token = localStorage.getItem("access");

    const [activeTab, setActiveTab] = useState("projects");
    const [user, setUser] = useState(null);

    function handleLogout() {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");

        navigate("/");
    }

    const fetchUser = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/me/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(response.data);
    } catch (error) {
      console.log(error.response?.data || error.message);
    }
  };

  const fetchAllUsers = useEffectEvent(()=> {
    fetchUser();
  }, []);

  useEffect(() => {
    fetchAllUsers();
  }, []);

    return (
        <div style={{ padding: "20px" }}>
            <h1 className="text-6xl text-red-500">Welcome Home</h1>

            <nav className="flex flex-wrap gap-3 bg-slate-800 p-4 rounded-xl shadow-md mb-6">
              {["projects", "tasks", "timeentries"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg transition font-medium capitalize
                    ${
                      activeTab === tab
                        ? "bg-blue-600 text-white shadow"
                        : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                    }`}
                >
                  {tab === "timeentries" ? "Time Entries" : tab}
                </button>
              ))}

              {user?.is_staff && (
                <button
                  onClick={() => setActiveTab("users")}
                  className={`px-4 py-2 rounded-lg transition font-medium
                    ${
                      activeTab === "users"
                        ? "bg-blue-600 text-white shadow"
                        : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                    }`}
                >
                  Users
                </button>
              )}

              <div className="ml-auto">
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition"
                >
                  Logout
                </button>
              </div>
            </nav>

            {/* <nav style={{
                display: "flex",
                gap: "20px",
                padding: "10px",
                backgroundColor: "#f1f1f1",
                borderRadius: "8px",
                marginBottom: "20px",
            }}>
                <button
                onClick={() => setActiveTab("projects")}
                style={{
                    padding: "8px 16px",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "6px",
                    backgroundColor: activeTab === "projects" ? "#007bff" : "#ddd",
                    color: activeTab === "projects" ? "white" : "black",
                }}
                >
                Projects
                </button>
                <button 
                onClick={()=> setActiveTab("tasks")}
                style={{
                    padding: "8px 16px",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "6px",
                    backgroundColor: activeTab === "tasks" ? "#007bff" : "#ddd",
                    color: activeTab === "tasks" ? "white" : "black",
                }}
                >
                    Tasks
                </button>

                <button
                onClick={()=> setActiveTab("timeentries")}
                style={{
                    padding: "8px 16px",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "6px",
                    backgroundColor: activeTab == "timeentries" ? "#007bff" : "#ddd",
                    color: activeTab == "timeentries" ? "white": "black",
                }}>
                    Time Entries
                </button>
                {user?.is_staff && (
                    <button onClick={() => setActiveTab("users")} style={{
                    padding: "8px 16px",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "6px",
                    backgroundColor: activeTab == "users" ? "#007bff" : "#ddd",
                    color: activeTab == "users" ? "white": "black",
                }}>
                        Users
                    </button>
                )}
                <button onClick={handleLogout}>Logout</button>
            </nav> */}

            {activeTab === "projects" && <Projects />}
            {activeTab == "tasks" && <Tasks />}
            {activeTab == "timeentries" && <TimeEntries />}
            {activeTab === "users" && user?.is_staff && <Users />}
        </div>
    );
}
