import React, { useEffect, useState, useEffectEvent } from 'react';
import axios from 'axios';

export default function Users() {
    const token = localStorage.getItem("access");
    const [users, setUsers] = useState([]);

    const fetchUsers = async () => {
        try {
            const response = await axios.get("http://localhost:8000/url/users/", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setUsers(response.data);
        } catch (error) {
            console.log(error.response?.data || error.message);
            alert("Failed to fetch users (Only Admin can view users list");
        }
    };

    const fetchAllUsers = useEffectEvent(()=> {
        fetchUsers();
    })

    useEffect(()=> {
        fetchAllUsers();
    }, []);

    return (
        <div style={{ padding: "20px", color: "white" }}>
      <h2>Registered Users</h2>

      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "15px",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#1e293b" }}>
              <th style={thStyle}>S No.</th>
              <th style={thStyle}>User ID</th>
              <th style={thStyle}>Username</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Admin</th>
              <th style={thStyle}>Active</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user, index) => (
              <tr key={user.id} style={{ borderBottom: "1px solid gray" }}>
                <td style={tdStyle}>{index + 1}</td>
                <td style={tdStyle}>{user.id}</td>
                <td style={tdStyle}>{user.username}</td>
                <td style={tdStyle}>{user.email}</td>
                <td style={tdStyle}>{user.is_staff ? "Yes" : "No"}</td>
                <td style={tdStyle}>{user.is_active ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const thStyle = {
  padding: "10px",
  border: "1px solid gray",
  textAlign: "left",
};

const tdStyle = {
  padding: "10px",
  border: "1px solid gray",
};