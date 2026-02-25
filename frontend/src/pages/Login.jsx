import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import {
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    try {
      setError("");

      if (!username || !password) {
        setError("Please enter both username and password.");
        return;
      }

      const response = await axios.post(
        "http://localhost:8000/auth/login/",
        { username, password }
      );

      localStorage.setItem("access", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);

      navigate("/home");
    } catch (error) {
      setError("Invalid credentials. Please try again.");
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">

      {/* LEFT SIDE - Branding */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center px-16 bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700">
        <h1 className="text-4xl font-bold mb-6">
          Welcome to TaskFlow
        </h1>
        <p className="text-lg text-indigo-100 leading-relaxed">
          A modern productivity platform designed to help teams
          manage projects, track time, and collaborate efficiently.
        </p>
      </div>

      {/* RIGHT SIDE - Login Form */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8">

          <h2 className="text-2xl font-semibold mb-2">
            Sign in to your account
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            Enter your credentials to access your dashboard.
          </p>

          {/* Username */}
          <div className="mb-4">
            <label className="text-sm text-slate-400">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full mt-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
          </div>

          {/* Password */}
          <div className="mb-4 relative">
            <label className="text-sm text-slate-400">
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-slate-400 hover:text-white transition"
            >
              {showPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 p-2 rounded">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold transition shadow-lg"
          >
            Sign In
            <ArrowRightIcon className="w-4 h-4" />
          </button>

          <p className="text-sm text-slate-400 text-center mt-6">
            Don’t have an account?{" "}
            <Link
              to="/register"
              className="text-indigo-400 hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}