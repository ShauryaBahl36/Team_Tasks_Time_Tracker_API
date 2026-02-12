import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom';
import Tasks from '../components/Tasks.jsx';
import TimeEntries from '../components/Time_Entry.jsx';
import Projects from "../components/Projects.jsx";

export default function Home() {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("projects");

    function handleLogout() {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");

        navigate("/");
    }

    return (
        <div style={{ padding: "20px" }}>
            <h1>Welcome Home</h1>
            <nav style={{
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
                <button onClick={handleLogout}>Logout</button>
            </nav>

            {activeTab === "projects" && <Projects />}
            {activeTab == "tasks" && <Tasks />}
            {activeTab == "timeentries" && <TimeEntries />}
        </div>
    );
}
