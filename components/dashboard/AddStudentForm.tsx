"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  onSuccess: () => void;
}

export default function AddStudentForm({ onSuccess }: Props) {
  const supabase = createClient();

  const [regNo, setRegNo] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("CSE");
  const [year, setYear] = useState(1);
  const [section, setSection] = useState("");
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [leetcodeLink, setLeetcodeLink] = useState("");
  const [githubLink, setGithubLink] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (
      !regNo ||
      !name ||
      !department ||
      !section ||
      !leetcodeUsername
    ) {
      alert("Please fill all required fields.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("students").insert([
      {
        reg_no: regNo,
        name,
        department,
        year,
        section,
        leetcode_username: leetcodeUsername,
        leetcode_link: leetcodeLink,
        github_link: githubLink,
      },
    ]);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Student added successfully.");

    setRegNo("");
    setName("");
    setDepartment("CSE");
    setYear(1);
    setSection("");
    setLeetcodeUsername("");
    setLeetcodeLink("");
    setGithubLink("");

    onSuccess();
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800">
          Add Student
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Enter the student details below.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-5 md:grid-cols-2"
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Register Number
          </label>

          <input
            value={regNo}
            onChange={(e) => setRegNo(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900"
            placeholder="23CSE101"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Student Name
          </label>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Department
          </label>

          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900"
          >
            <option>CSE</option>
            <option>IT</option>
            <option>ECE</option>
            <option>EEE</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Year
          </label>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900"
          >
            <option value={1}>1st Year</option>
            <option value={2}>2nd Year</option>
            <option value={3}>3rd Year</option>
            <option value={4}>4th Year</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Section
          </label>

          <input
            value={section}
            onChange={(e) => setSection(e.target.value.toUpperCase())}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900"
            placeholder="A"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            LeetCode Username
          </label>

          <input
            value={leetcodeUsername}
            onChange={(e) => setLeetcodeUsername(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900"
            placeholder="leetcode_username"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            LeetCode Profile Link
          </label>

          <input
            value={leetcodeLink}
            onChange={(e) => setLeetcodeLink(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900"
            placeholder="https://leetcode.com/..."
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            GitHub Profile Link
          </label>

          <input
            value={githubLink}
            onChange={(e) => setGithubLink(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900"
            placeholder="https://github.com/..."
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Adding Student..." : "Add Student"}
          </button>
        </div>
      </form>
    </div>
  );
}