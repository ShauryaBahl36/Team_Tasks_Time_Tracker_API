import React, { useState, useEffect, useEffectEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import {
  FolderIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  UsersIcon,
  ChartBarIcon,
  UserCircleIcon,
  ArrowLeftOnRectangleIcon,
} from "@heroicons/react/24/outline";

import Tasks from "../components/Tasks.jsx";
import TimeEntries from "../components/Time_Entry.jsx";
import Projects from "../components/Projects.jsx";
import Users from "../components/Users.jsx";
import Report from "../components/Report.jsx";
import Profile from "../components/Profile.jsx";

export default function Home() {
  const navigate = useNavigate();
  const token = localStorage.getItem("access");

  const [activeTab, setActiveTab] = useState("projects");
  const [user, setUser] = useState(null);

  /* ===============================
     FETCH LOGGED-IN USER
     =============================== */
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };
  const fetchUser = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/url/profile/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);
    } catch (error) {
      console.log(error.response?.data || error.message);
      if (error.response?.status === 401) {
        handleLogout();
      }
    }
  };

  const fetchUserEvent = useEffectEvent(() => {
    fetchUser();
  });

  useEffect(() => {
    if (!token) {
      navigate("/");
    } else {
      fetchUserEvent();
    }
  }, []);

  /* ===============================
     LOGOUT
  =============================== */

  /* ===============================
     NAV ITEMS
  =============================== */
  const navItems = [
    { key: "projects", label: "Projects", icon: FolderIcon },
    { key: "tasks", label: "Tasks", icon: ClipboardDocumentListIcon },
    { key: "timeentries", label: "Time Entries", icon: ClockIcon },
    ...(user?.is_staff
      ? [
          { key: "users", label: "Users", icon: UsersIcon },
          { key: "report", label: "Reports", icon: ChartBarIcon },
        ]
      : []),
    { key: "profile", label: "Profile", icon: UserCircleIcon },
  ];

  return (
    <div className="h-full w-full flex bg-[#0B0F1A] text-slate-200">
      {/* ===============================
          SIDEBAR
      =============================== */}
      <aside className="w-72 bg-[#0F1424] border-r border-slate-800/40 flex flex-col">
        {/* Branding */}
        <div className="p-8 pb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-400 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ClipboardDocumentListIcon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              TaskFlow
            </h2>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <p className="px-4 text-xs font-bold uppercase tracking-widest text-slate-600 mb-4">
            Management
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;

            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`group flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600/10 text-indigo-400 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.3)]"
                    : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 transition ${
                      isActive ? "scale-110" : "group-hover:scale-105"
                    }`}
                  />
                  <span className="text-sm font-medium tracking-wide">
                    {item.label}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-800/40">
          <button
            onClick={handleLogout}
            className="group flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ===============================
          MAIN CONTENT
      =============================== */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-[#0B0F1A]/80 backdrop-blur-xl border-b border-slate-800/30 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Dashboard
            </span>
            <div className="w-1 h-1 bg-slate-600 rounded-full" />
            <h1 className="text-lg font-bold capitalize">
              {activeTab === "timeentries" ? "Time Entries" : activeTab}
            </h1>
          </div>

          {/* User */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-white">
                {user?.username}
              </p>
              <p className="text-xs text-slate-500 uppercase">
                {user?.is_staff ? "Administrator" : "Member"}
              </p>
            </div>
            <img
              src={
                user?.avatar_url ||
                `https://ui-avatars.com/api/?name=${user?.username}`
              }
              alt="avatar"
              className="w-10 h-10 rounded-full border border-slate-700 ring-2 ring-indigo-500/20"
            />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="animate-fade">
            {activeTab === "projects" && <Projects />}
            {activeTab === "tasks" && <Tasks />}
            {activeTab === "timeentries" && <TimeEntries />}
            {activeTab === "users" && user?.is_staff && <Users />}
            {activeTab === "report" && user?.is_staff && <Report />}
            {activeTab === "profile" && (
              <Profile user={user} refreshUser={fetchUser} />
            )}
          </div>
        </main>
      </div>

      {/* Animation */}
      <style>{`
        @keyframes fade {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade {
          animation: fade 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}
