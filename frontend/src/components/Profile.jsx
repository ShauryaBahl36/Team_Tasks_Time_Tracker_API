import React, { useState, useEffect, useEffectEvent } from "react";
import axios from "axios";
import { PencilSquareIcon } from "@heroicons/react/24/outline";

export default function Profile({ user, refreshUser }) {
  const token = localStorage.getItem("access");

  const [editing, setEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    avatar_url: "",
    timezone: "",
  });

  const setFormDataEvent = useEffectEvent(()=> {
    if (user) {
      setFormData({
        name: user.name || "",
        avatar_url: user.avatar_url || "",
        timezone: user.timezone || "",
      });
    }
  })

  // 🔥 Sync formData whenever user changes
  useEffect(() => {
    setFormDataEvent();
  }, [user]);

  const handleUpdate = async () => {
    try {
      await axios.patch(
        "http://127.0.0.1:8000/url/profile/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await refreshUser(); // 🔥 wait for updated user
      setEditing(false);

    } catch (err) {
      console.log(err.response?.data);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">
          My Profile
        </h2>

        <button
          onClick={() => setEditing(!editing)}
          className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition"
        >
          <PencilSquareIcon className="w-5 h-5" />
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>

      {/* Avatar Section */}
      <div className="flex items-center gap-6 mb-8">
        <img
          src={
            formData.avatar_url ||
            `https://ui-avatars.com/api/?name=${user?.username}`
          }
          alt="avatar"
          className="w-20 h-20 rounded-full border-2 border-indigo-500 object-cover"
        />

        <div>
          <p className="text-xl font-semibold">
            {user?.username}
          </p>
          <p className="text-slate-400 text-sm">
            {user?.email}
          </p>
          <p className="text-indigo-400 text-sm mt-1">
            {user?.is_staff
                ? user?.user_role === "Member"
                ? "Admin"
                : user?.user_role
                : "Member"}
          </p>
        </div>
      </div>

      {/* Editable Fields */}
      <div className="space-y-4">

        {/* Name */}
        <div>
          <label className="text-slate-400 text-sm">
            Full Name
          </label>
          <input
            type="text"
            disabled={!editing}
            value={formData.name}
            onChange={(e) =>
              setFormData({
                ...formData,
                name: e.target.value,
              })
            }
            className="w-full mt-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
          />
        </div>

        {/* Avatar URL */}
        <div>
          <label className="text-slate-400 text-sm">
            Avatar URL
          </label>
          <input
            type="text"
            disabled={!editing}
            value={formData.avatar_url}
            onChange={(e) =>
              setFormData({
                ...formData,
                avatar_url: e.target.value,
              })
            }
            className="w-full mt-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
          />
        </div>

        {/* Timezone */}
        <div>
          <label className="text-slate-400 text-sm">
            Timezone
          </label>
          <input
            type="text"
            disabled={!editing}
            value={formData.timezone}
            onChange={(e) =>
              setFormData({
                ...formData,
                timezone: e.target.value,
              })
            }
            className="w-full mt-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
          />
        </div>
      </div>

      {/* Save Button */}
      {editing && (
        <button
          onClick={handleUpdate}
          className="mt-6 w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-lg font-semibold"
        >
          Save Changes
        </button>
      )}
    </div>
  );
}