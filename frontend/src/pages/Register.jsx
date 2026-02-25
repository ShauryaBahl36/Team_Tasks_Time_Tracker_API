import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const getPasswordStrength = () => {
    if (!password) return null;

    const strongRegex =
      /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{10,})/;
    const moderateRegex =
      /^(?=.*[A-Za-z])(?=.*[0-9])(?=.{6,})/;

    if (strongRegex.test(password)) {
      return { label: "Strong", color: "bg-emerald-500", width: "100%" };
    } else if (moderateRegex.test(password)) {
      return { label: "Moderate", color: "bg-yellow-400", width: "65%" };
    } else {
      return { label: "Weak", color: "bg-red-500", width: "35%" };
    }
  };

  const strength = getPasswordStrength();
  const passwordsMatch =
    password && confirmPassword && password === confirmPassword;

  const isFormValid =
    email && username && password && confirmPassword && passwordsMatch;

  async function handleSubmit() {
  try {
    setErrorMessage(""); // clear previous errors

    await axios.post("http://localhost:8000/auth/register/", {
      email,
      username,
      password,
    });

    navigate("/");
  } catch (error) {
    if (error.response && error.response.data) {
      const data = error.response.data;

      // Convert backend validation errors into readable string
      const messages = Object.values(data)
        .flat()
        .join(" ");

      setErrorMessage(messages);
    } else {
      setErrorMessage("Something went wrong. Please try again.");
    }
  }
}

  return (
    <div className="min-h-screen flex bg-slate-950 text-white">

      {/* LEFT SIDE - Branding Section */}
      <div className="hidden lg:flex w-1/2 items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-12">
        <div className="max-w-md text-center">
          <h1 className="text-4xl font-bold mb-6">
            Join TaskFlow 🚀
          </h1>
          <p className="text-lg text-blue-100">
            Manage projects, track time, and collaborate efficiently
            with a powerful modern admin dashboard.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - Register Form */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8">

          <h2 className="text-3xl font-bold mb-2">
            Create Account
          </h2>
          <p className="text-slate-400 mb-6 text-sm">
            Start your productivity journey today.
          </p>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-slate-400 text-sm mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {/* Username */}
          <div className="mb-4">
            <label className="block text-slate-400 text-sm mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {/* Password */}
          <div className="mb-4 relative">
            <label className="block text-slate-400 text-sm mb-1">
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 cursor-pointer text-slate-400"
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>

          {/* Strength Bar */}
          {password && strength && (
            <div className="mb-4">
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${strength.color} transition-all duration-300`}
                  style={{ width: strength.width }}
                />
              </div>
              <p className="text-xs mt-1 text-slate-400">
                Strength:{" "}
                <span className="font-medium text-white">
                  {strength.label}
                </span>
              </p>
            </div>
          )}

          {/* Confirm Password */}
          <div className="mb-2 relative">
            <label className="block text-slate-400 text-sm mb-1">
              Confirm Password
            </label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full px-4 py-2 bg-slate-950 border ${
                confirmPassword
                  ? passwordsMatch
                    ? "border-emerald-500"
                    : "border-red-500"
                  : "border-slate-800"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
            />
            <span
              onClick={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
              className="absolute right-3 top-9 cursor-pointer text-slate-400"
            >
              {showConfirmPassword ? "🙈" : "👁️"}
            </span>
          </div>

          {/* Match Message */}
          {confirmPassword && (
            <p
              className={`text-sm mb-4 ${
                passwordsMatch
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {passwordsMatch
                ? "Passwords match ✔"
                : "Passwords do not match ✘"}
            </p>
          )}

          {errorMessage && (
            <div className="mb-4 text-red-400 text-sm bg-red-500/10 border border-red-500/30 p-2 rounded">
                {errorMessage}
            </div>
            )}

          {/* Register Button */}
          <button
            onClick={handleSubmit}
            disabled={!isFormValid}
            className={`w-full py-2 rounded-lg font-semibold transition duration-300 ${
              isFormValid
                ? "bg-blue-600 hover:bg-blue-700 shadow-lg"
                : "bg-slate-800 cursor-not-allowed"
            }`}
          >
            Create Account
          </button>

          {/* Login Link */}
          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{" "}
            <Link
              to="/"
              className="text-blue-500 hover:text-blue-400 transition"
            >
              Login
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}