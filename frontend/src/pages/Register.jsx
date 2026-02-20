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

  const getPasswordStrength = () => {
    if (!password) return null;

    const strongRegex =
      /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{10,})/;
    const moderateRegex =
      /^(?=.*[A-Za-z])(?=.*[0-9])(?=.{6,})/;

    if (strongRegex.test(password)) {
      return { label: "Strong", color: "#22c55e", width: "100%" };
    } else if (moderateRegex.test(password)) {
      return { label: "Moderate", color: "#facc15", width: "65%" };
    } else {
      return { label: "Weak", color: "#ef4444", width: "35%" };
    }
  };

  const strength = getPasswordStrength();
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const isFormValid =
    email &&
    username &&
    password &&
    confirmPassword &&
    passwordsMatch;

  async function handleSubmit() {
    try {
      const payload = { email, username, password };

      await axios.post(
        "http://localhost:8000/auth/register/",
        payload
      );

      alert("User registered successfully");
      navigate("/");
    } catch (error) {
      console.log(error.response?.data || error.message);
      alert("Registration failed");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0f172a",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
      }}
    >
      <div
        style={{
          width: "400px",
          padding: "30px",
          backgroundColor: "#111827",
          borderRadius: "12px",
          boxShadow: "0px 8px 20px rgba(0,0,0,0.4)",
        }}
      >
        <h2 style={{ textAlign: "center", color: "#60a5fa" }}>
          Create Account
        </h2>

        {/* Email */}
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        {/* Username */}
        <label>Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={inputStyle}
        />

        {/* Password */}
        <label>Password</label>
        <div style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            style={eyeStyle}
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        {/* Strength Bar */}
        {password && !confirmPassword && strength && (
          <>
            <div
              style={{
                height: "6px",
                backgroundColor: "#1f2937",
                borderRadius: "6px",
                marginTop: "5px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: strength.width,
                  height: "100%",
                  backgroundColor: strength.color,
                  transition: "0.3s",
                }}
              />
            </div>
            <p style={{ color: strength.color, marginTop: "5px" }}>
              Strength: {strength.label}
            </p>
          </>
        )}

        {/* Confirm Password */}
        <label>Confirm Password</label>
        <div style={{ position: "relative" }}>
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={inputStyle}
          />
          <span
            onClick={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
            style={eyeStyle}
          >
            {showConfirmPassword ? "🙈" : "👁️"}
          </span>
        </div>

        {/* Match Message */}
        {confirmPassword && (
          <p
            style={{
              color: passwordsMatch ? "#22c55e" : "#ef4444",
              marginTop: "5px",
            }}
          >
            {passwordsMatch
              ? "Password Match ✔"
              : "Passwords do not match ✘"}
          </p>
        )}

        {/* Login Link */}
        <div style={{ marginTop: "15px" }}>
          <Link to="/" style={{ color: "#60a5fa" }}>
            Already have an account? Login
          </Link>
        </div>

        {/* Register Button */}
        <button
          onClick={handleSubmit}
          disabled={!isFormValid}
          style={{
            width: "100%",
            marginTop: "15px",
            padding: "10px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: isFormValid ? "#2563eb" : "#374151",
            color: "white",
            cursor: isFormValid ? "pointer" : "not-allowed",
            transition: "0.3s",
          }}
        >
          Register
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "8px",
  marginTop: "5px",
  marginBottom: "10px",
  borderRadius: "6px",
  border: "1px solid #374151",
  backgroundColor: "#1f2937",
  color: "white",
};

const eyeStyle = {
  position: "absolute",
  right: "10px",
  top: "10px",
  cursor: "pointer",
};
