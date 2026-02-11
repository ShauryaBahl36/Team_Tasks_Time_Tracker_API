import React, { useEffect, useState } from 'react';
import axios from "axios";

export default function TimeEntries() {
    const token = localStorage.getItem("access");

    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);

    const [filters, setFilters] = useState({
        project: "",
        task: "",
        user: "",
        billable: "",
        from_date: "",
        to_date: "",
        ordering: "-start_time"
    });

    const [formData, setFormData] = useState({
        task: "",
        start_time: "",
        end_time: "",
        notes: "",
        billable: true
    });

    const fetchEntries = async () => {
        try {
            setLoading(true);

            let query = `?ordering=${filters.ordering}`;

            if (filters.project) query += `&project=${filters.project}`
            if (filters.task) query += `&task=${filters.task}`;
            if (filters.user) query += `&user=${filters.user}`;
            if (filters.billable !== "") query += `&billable=${filters.billable}`;
            if (filters.from_date) query += `&from_date=${filters.from_date}`;
            if (filters.to_date) query += `&to_date=${filters.to_date}`;

            const response = await axios.get(`http://localhost:8000/url/time-entries/${query}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.results) {
                setEntries(response.data.results);
            } else {
                setEntries(response.data);
            }
        } catch (error) {
            console.log(error.response?.data || error.message);
            alert("Failed to fetch time entries");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntries();
    }, []);

    const handleApplyFilters = () => {
        fetchEntries();
    };

    const handleCreateEntry = async () => {
        try {
            await axios.post("http://localhost:8000/url/time-entries/", formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
            });

            alert("Time Entry Created Successfully");

            setFormData({
                task: "",
                start_time: "",
                end_time: "",
                notes: "",
                billable: ""
            })

            fetchEntries();
        } catch (error) {
            console.log(error.response?.data || error.message);
            alert("Failed to create time entry");
        }
    };

    const handleDeleteEntry = async (id) => {
        try {
            await axios.delete(`http://localhost:8000/url/time-entries/${id}/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            alert("Time Entry deleted Successfully!");
            fetchEntries();
        } catch (error) {
            console.log(error.response?.data || error.message);
            alert("Failed to delete time entry");
        }
    };

    return (
    <div style={{ padding: "20px" }}>
      <h2>Time Entries Dashboard</h2>

      {/* Filters */}
      <h3>Filters</h3>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        <input
          type="number"
          placeholder="Project ID"
          value={filters.project}
          onChange={(e) => setFilters({ ...filters, project: e.target.value })}
        />

        <input
          type="number"
          placeholder="Task ID"
          value={filters.task}
          onChange={(e) => setFilters({ ...filters, task: e.target.value })}
        />

        <input
          type="number"
          placeholder="User ID"
          value={filters.user}
          onChange={(e) => setFilters({ ...filters, user: e.target.value })}
        />

        <select
          value={filters.billable}
          onChange={(e) => setFilters({ ...filters, billable: e.target.value })}
        >
          <option value="">All</option>
          <option value="true">Billable</option>
          <option value="false">Non-Billable</option>
        </select>

        <input
          type="datetime-local"
          value={filters.from_date}
          onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
        />

        <input
          type="datetime-local"
          value={filters.to_date}
          onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
        />

        <select
          value={filters.ordering}
          onChange={(e) => setFilters({ ...filters, ordering: e.target.value })}
        >
          <option value="-start_time">Start Time (Latest)</option>
          <option value="start_time">Start Time (Oldest)</option>
          <option value="-end_time">End Time (Latest)</option>
          <option value="end_time">End Time (Oldest)</option>
          <option value="billable">Billable</option>
          <option value="-billable">Non-Billable</option>
        </select>

        <button onClick={handleApplyFilters}>Apply Filters</button>
      </div>

      <hr />

      {/* Create Entry */}
      <h3>Create Time Entry</h3>

      <div style={{ display: "flex", flexDirection: "column", width: "300px" }}>
        <input
          type="number"
          placeholder="Task ID"
          value={formData.task}
          onChange={(e) => setFormData({ ...formData, task: e.target.value })}
        />

        <label>Start Time:</label>
        <input
          type="datetime-local"
          value={formData.start_time}
          onChange={(e) =>
            setFormData({ ...formData, start_time: e.target.value })
          }
        />

        <label>End Time:</label>
        <input
          type="datetime-local"
          value={formData.end_time}
          onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
        />

        <textarea
          placeholder="Notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />

        <label>
          <input
            type="checkbox"
            checked={formData.billable}
            onChange={(e) =>
              setFormData({ ...formData, billable: e.target.checked })
            }
          />
          Billable
        </label>

        <button onClick={handleCreateEntry}>Create Entry</button>
      </div>

      <hr />

      {/* Entries List */}
      <h3>Time Entries</h3>

      {loading ? (
        <p>Loading time entries...</p>
      ) : entries.length === 0 ? (
        <p>No time entries found.</p>
      ) : (
        entries.map((entry) => (
          <div
            key={entry.id}
            style={{
              border: "1px solid gray",
              padding: "12px",
              marginBottom: "10px",
              borderRadius: "6px",
            }}
          >
            <p>
              <b>Task:</b> {entry.task} | <b>User:</b> {entry.user}
            </p>

            <p>
              <b>Start:</b> {entry.start_time}
            </p>

            <p>
              <b>End:</b> {entry.end_time || "Still Running"}
            </p>

            <p>
              <b>Billable:</b> {entry.billable ? "Yes" : "No"}
            </p>

            <p>
              <b>Timeline:</b> {entry.timeline || "Not Finished"}
            </p>

            <p>
              <b>Notes:</b> {entry.notes}
            </p>

            <button onClick={() => handleDeleteEntry(entry.id)}>Delete</button>
          </div>
        ))
      )}
    </div>
  );
}