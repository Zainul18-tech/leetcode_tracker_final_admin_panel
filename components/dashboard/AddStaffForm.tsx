"use client";

import { useState } from "react";
import { createStaffMember } from "./actions";

interface Props {
  onSuccess: () => void;
}

export default function AddStaffForm({ onSuccess }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Tutor");
  const [department, setDepartment] = useState("CSE");
  const [year, setYear] = useState(1);
  const [section, setSection] = useState("");

  // Register number range
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (
      !name.trim() ||
      !email.trim() ||
      !role ||
      !department ||
      !section.trim() ||
      !rangeStart.trim() ||
      !rangeEnd.trim()
    ) {
      alert("Please fill all fields.");
      return;
    }

    // Validate register number range
    try {
      const start = BigInt(rangeStart);
      const end = BigInt(rangeEnd);

      if (start > end) {
        alert(
          "Starting register number cannot be greater than ending register number."
        );
        return;
      }
    } catch {
      alert("Please enter valid register numbers.");
      return;
    }

    setLoading(true);

    try {
      const result = await createStaffMember({
        name: name.trim(),
        email: email.trim(),
        role,
        department,
        year,
        section: section.trim().toUpperCase(),

        // Register number range
        rangeStart: rangeStart.trim(),
        rangeEnd: rangeEnd.trim(),
      });

      if (result.error) {
        alert(result.error);
        return;
      }

      alert("Staff added successfully. Default password: 123456");

      // Reset form
      setName("");
      setEmail("");
      setRole("Tutor");
      setDepartment("CSE");
      setYear(1);
      setSection("");
      setRangeStart("");
      setRangeEnd("");

      onSuccess();
    } catch (err) {
      console.error("Error adding staff:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800">
          Add Staff
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Enter the staff details below. A login account will be
          created automatically with the default password{" "}
          <span className="font-medium text-gray-700">123456</span>.
        </p>
      </div>

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
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Staff Name"
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
            placeholder="staff@gmail.com"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-blue-500"
          />
        </div>

        {/* Role */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Role
          </label>

          <input
            type="text"
            value="Tutor"
            readOnly
            className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-black outline-none"
          />
        </div>

        {/* Department */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Department
          </label>

          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black"
          >
            <option>CSE</option>
            <option>IT</option>
            <option>AIDS</option>
            <option>CSBS</option>
            <option>CYBER</option>

          </select>
        </div>

        {/* Year */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Year
          </label>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black"
          >
            <option value={1}>1st Year</option>
            <option value={2}>2nd Year</option>
            <option value={3}>3rd Year</option>
            <option value={4}>4th Year</option>
          </select>
        </div>

        {/* Section */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Section
          </label>

          <input
            value={section}
            onChange={(e) =>
              setSection(e.target.value.toUpperCase())
            }
            placeholder="A"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-blue-500"
          />
        </div>

        {/* Register Number From */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Register Number From
          </label>

          <input
            type="text"
            inputMode="numeric"
            value={rangeStart}
            onChange={(e) =>
              setRangeStart(e.target.value.replace(/\D/g, ""))
            }
            placeholder="710724104129"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-blue-500"
          />
        </div>

        {/* Register Number To */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Register Number To
          </label>

          <input
            type="text"
            inputMode="numeric"
            value={rangeEnd}
            onChange={(e) =>
              setRangeEnd(e.target.value.replace(/\D/g, ""))
            }
            placeholder="710724104188"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-blue-500"
          />
        </div>

        {/* Range Preview */}
        {rangeStart && rangeEnd && (
          <div className="md:col-span-2 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <span className="font-medium">Assigned Register Range:</span>{" "}
            {rangeStart} - {rangeEnd}
          </div>
        )}

        {/* Submit */}
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Adding Staff..." : "Add Staff"}
          </button>
        </div>
      </form>
    </div>
  );
}