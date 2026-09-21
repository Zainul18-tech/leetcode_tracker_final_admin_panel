"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  onSuccess: () => void;
}

export default function AddClassForm({ onSuccess }: Props) {
  const supabase = createClient();

  const [className, setClassName] = useState("");
  const [department, setDepartment] = useState("CSE");
  const [year, setYear] = useState(1);
  const [section, setSection] = useState("");
  const [batch, setBatch] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (
      !className ||
      !department ||
      !year ||
      !section ||
      !batch
    ) {
      alert("Please fill all fields.");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("classes")
      .insert([
        {
          class_name: className,
          department,
          year,
          section,
          batch,
        },
      ]);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Class created successfully.");

    setClassName("");
    setDepartment("CSE");
    setYear(1);
    setSection("");
    setBatch("");

    onSuccess();
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800">
          Add New Class
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Create a new class and optionally import students using an Excel file.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-5 md:grid-cols-6"
      >

        <div className="md:col-span-2">

          <label className="mb-2 block text-sm font-medium text-gray-700">
            Class Name
          </label>

          <input
            type="text"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="3rd CSE-A"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
          />

        </div>

        <div>

          <label className="mb-2 block text-sm font-medium text-gray-700">
            Department
          </label>

          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none"
          >
            <option>CSE</option>
            <option>IT</option>
            <option>AIDS</option>
            <option>CSBS</option>
            <option>CYBER</option>
          </select>

        </div>

        <div>

          <label className="mb-2 block text-sm font-medium text-gray-700">
            Year
          </label>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none"
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
            type="text"
            value={section}
            onChange={(e) => setSection(e.target.value.toUpperCase())}
            placeholder="A"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
          />

        </div>

        <div>

          <label className="mb-2 block text-sm font-medium text-gray-700">
            Batch
          </label>

          <input
            type="text"
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            placeholder="2023-2027"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
          />

        </div>

        <div className="flex items-end">

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {loading ? "Creating..." : "Create Class"}
          </button>

        </div>

      </form>

      {/* <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5">

        <div className="flex items-center justify-between">

          <div>

            <p className="font-medium text-gray-800">
              Import Students
            </p>

            <p className="text-sm text-gray-500">
              Upload an Excel (.xlsx) file to import student details.
            </p>

          </div>

          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 hover:bg-gray-100"
          >
            <Upload size={18} />
            Upload Excel
          </button>

        </div>

      </div> */}

    </div>
  );
}