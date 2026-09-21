"use client";

import { useState } from "react";
import { createClassAdvisor } from "./actions";

interface Props {
  onSuccess: () => void;
}

export default function AddClassAdvisorForm({
  onSuccess,
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("CSE");
  const [year, setYear] = useState(1);
  const [section, setSection] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (
      !name.trim() ||
      !email.trim() ||
      !department ||
      !year ||
      !section.trim()
    ) {
      alert("Please fill all fields.");
      return;
    }

    setLoading(true);

    try {
      const result = await createClassAdvisor({
        name: name.trim(),
        email: email.trim(),
        department,
        year,
        section: section.trim().toUpperCase(),
        rangeStart: null,
        rangeEnd: null,
      });

      if (result.error) {
        alert(result.error);
        setLoading(false);
        return;
      }

      alert(
        "Class Advisor added successfully. Default password: 123456"
      );

      setName("");
      setEmail("");
      setDepartment("CSE");
      setYear(1);
      setSection("");

      onSuccess();
    } catch (err) {
      console.error("Error adding class advisor:", err);
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
          Add Class Advisor
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Add a class advisor and assign them to a department,
          year and section. A login account will be created
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
            placeholder="Dr. Aravind S"
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
            placeholder="aravind@college.edu"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-blue-500"
          />
        </div>

        {/* Department */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Department
          </label>

          <select
            value={department}
            onChange={(e) =>
              setDepartment(e.target.value)
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-blue-500"
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
            onChange={(e) =>
              setYear(Number(e.target.value))
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-blue-500"
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
            type="text"
            value={section}
            onChange={(e) =>
              setSection(e.target.value.toUpperCase())
            }
            placeholder="A"
            maxLength={5}
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
            value="Class Advisor"
            disabled
            className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-gray-600"
          />
        </div>

        {/* Button */}
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {loading
              ? "Adding Class Advisor..."
              : "Add Class Advisor"}
          </button>
        </div>

      </form>
    </div>
  );
}