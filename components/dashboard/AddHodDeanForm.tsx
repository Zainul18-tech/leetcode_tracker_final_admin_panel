"use client";

import { useState } from "react";
import { createHodDean } from "@/app/dashboard/hod-dean/actions";

interface Props {
  onSuccess: () => void;
}

type Role = "HOD" | "Dean";

export default function AddHodDeanForm({ onSuccess }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("HOD");
  const [department, setDepartment] = useState("CSE");

  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !role) {
      alert("Please fill all fields.");
      return;
    }

    if (role === "HOD" && !department) {
      alert("Please select a department.");
      return;
    }

    setLoading(true);

    try {
      const result = await createHodDean({
        name: name.trim(),
        email: email.trim(),
        role,
        department: role === "HOD" ? department : null,
      });

      if (result.error) {
        alert(result.error);
        setLoading(false);
        return;
      }

      alert(`${role} added successfully. Default password: 123456`);

      setName("");
      setEmail("");
      setRole("HOD");
      setDepartment("CSE");

      onSuccess();
    } catch (err) {
      console.error("Error adding HOD/Dean:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800">
          Add HOD / Dean
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Add an HOD or Dean. A login account will be created
          automatically with the default password{" "}
          <span className="font-medium text-gray-700">123456</span>.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-5 md:grid-cols-2"
      >

        {/* Name */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Name
          </label>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dr. Meena R"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-blue-500"
          />
        </div>

        {/* Email */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="meena@college.edu"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-blue-500"
          />
        </div>

        {/* Role */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Role
          </label>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-blue-500"
          >
            <option value="HOD">HOD</option>
            <option value="Dean">Dean</option>
          </select>
        </div>

        {/* Department (only for HOD) */}
        {role === "HOD" ? (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Department
            </label>

            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-blue-500"
            >
              <option>CSE</option>
              <option>IT</option>
              <option>AIDS</option>
              <option>CSBS</option>
              <option>CYBER</option>
            </select>
          </div>
        ) : (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Department
            </label>

            <input
              type="text"
              value="All Departments"
              disabled
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-gray-600"
            />
          </div>
        )}

        {/* Button */}
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {loading ? `Adding ${role}...` : `Add ${role}`}
          </button>
        </div>

      </form>
    </div>
  );
}