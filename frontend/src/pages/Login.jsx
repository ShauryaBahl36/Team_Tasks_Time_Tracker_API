import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit() {
    try {
      if (!username || !password) {
        alert("Please enter Username and Password");
        return;
      }

      const payload = {
        username,
        password,
      };

      const response = await axios.post(
        "http://localhost:8000/auth/login/",
        payload
      );

      localStorage.setItem("access", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);

      navigate("/home");
    } catch (error) {
      console.log(error.response?.data || error.message);
      alert("Invalid Username or Password");
    }
  }

  return (
    <div
      style={{
        minHeight: "50vh",
        backgroundColor: "#0f172a",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "380px",
          padding: "30px",
          backgroundColor: "#111827",
          borderRadius: "10px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
          color: "white",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: "20px",
            color: "#60a5fa",
          }}
        >
          Login
        </h2>

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

        {/* Register Link */}
        <div style={{ marginTop: "10px" }}>
          <Link to="/register" style={{ color: "#60a5fa" }}>
            Don’t have an account? Register
          </Link>
        </div>

        {/* Login Button */}
        <button
          onClick={handleSubmit}
          style={{
            width: "100%",
            marginTop: "15px",
            padding: "10px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "#2563eb",
            color: "white",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "0.3s",
          }}
        >
          Login
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "8px",
  marginTop: "5px",
  marginBottom: "12px",
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