import React from "react";
import { useNavigate } from "react-router-dom";

export default function Profile({ user }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    alert("Logged out successfully");
    navigate("/login");
  };

  return (
    <div
      style={{
        padding: "16px",
        borderRadius: "10px",
        backgroundColor: "#111827",
        border: "1px solid #334155",
        marginBottom: "20px",
        boxShadow: "0px 2px 8px rgba(0,0,0,0.4)",
      }}
    >
      <h3 style={{ margin: 0, color: "#60a5fa" }}>My Profile</h3>

      {user ? (
        <>
          <p style={{ marginTop: "10px" }}>
            <b>Username:</b> {user.username}
          </p>
          <p>
            <b>User ID:</b> {user.id}
          </p>
          <p>
            <b>Role:</b> {user.is_staff ? "Admin" : "User"}
          </p>

          <button
            onClick={handleLogout}
            style={{
              marginTop: "10px",
              padding: "8px 14px",
              borderRadius: "6px",
              cursor: "pointer",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
            }}
          >
            Logout
          </button>
        </>
      ) : (
        <p>Loading profile...</p>
      )}
    </div>
  );
}