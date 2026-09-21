"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ClassType {
  id: string;
  class_name: string;
  department: string;
  year: number;
  section: string;
  batch: string;
}

interface StaffType {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  year: number;
  section: string;
}

interface Props {
  classes: ClassType[];
}

export default function AssignStaffForm({ classes }: Props) {
  const supabase = createClient();

  const [selectedClass, setSelectedClass] = useState("");
  const [staff, setStaff] = useState<StaffType[]>([]);

  const [selectedTutors, setSelectedTutors] = useState<string[]>([]);
  const [selectedAdvisor, setSelectedAdvisor] = useState("");

  const [loadingStaff, setLoadingStaff] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff() {
    setLoadingStaff(true);

    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .order("name");

    if (error) {
      console.error(error);
      alert(error.message);
      setLoadingStaff(false);
      return;
    }

    setStaff(data || []);
    setLoadingStaff(false);
  }

  function toggleTutor(id: string) {
    setSelectedTutors((current) => {
      if (current.includes(id)) {
        return current.filter((staffId) => staffId !== id);
      }

      return [...current, id];
    });
  }

  async function assignStaff() {
    if (!selectedClass) {
      alert("Please select a class.");
      return;
    }

    if (selectedTutors.length === 0) {
      alert("Please select at least one tutor.");
      return;
    }

    if (!selectedAdvisor) {
      alert("Please select a class advisor.");
      return;
    }

    setSaving(true);

    // Remove existing assignments for this class
    const { error: deleteError } = await supabase
      .from("class_staff")
      .delete()
      .eq("class_id", selectedClass);

    if (deleteError) {
      alert(deleteError.message);
      setSaving(false);
      return;
    }

    const assignments = [
      ...selectedTutors.map((staffId) => ({
        class_id: selectedClass,
        staff_id: staffId,
        role: "Tutor",
      })),

      {
        class_id: selectedClass,
        staff_id: selectedAdvisor,
        role: "Class Advisor",
      },
    ];

    const { error: insertError } = await supabase
      .from("class_staff")
      .insert(assignments);

    setSaving(false);

    if (insertError) {
      alert(insertError.message);
      return;
    }

    alert("Staff assigned successfully.");

    setSelectedTutors([]);
    setSelectedAdvisor("");
  }

  const tutors = staff.filter(
    (member) => member.role === "Tutor"
  );

  const advisors = staff.filter(
    (member) => member.role === "Class Advisor"
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

      {/* Header */}

      <div className="mb-8">

        <h2 className="text-2xl font-semibold text-gray-800">
          Assign Staff
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Assign tutors and a class advisor to a class.
        </p>

      </div>

      {/* Select Class */}

      <div className="mb-8">

        <label className="mb-2 block text-sm font-medium text-gray-700">
          Select Class
        </label>

        <select
          value={selectedClass}
          onChange={(e) => {
            setSelectedClass(e.target.value);
            setSelectedTutors([]);
            setSelectedAdvisor("");
          }}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
        >

          <option value="">
            Select a class
          </option>

          {classes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.class_name} - {item.department} - Section{" "}
              {item.section}
            </option>
          ))}

        </select>

      </div>

      {selectedClass && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

          {/* Tutors */}

          <div className="rounded-xl border border-gray-200 p-6">

            <div className="mb-5">

              <h3 className="text-lg font-semibold text-gray-800">
                Tutors
              </h3>

              <p className="text-sm text-gray-500">
                Select one or more tutors.
              </p>

            </div>

            {loadingStaff ? (
              <p className="text-gray-500">
                Loading staff...
              </p>
            ) : tutors.length === 0 ? (
              <p className="text-gray-500">
                No tutors available.
              </p>
            ) : (
              <div className="space-y-3">

                {tutors.map((tutor) => {

                  const selected = selectedTutors.includes(
                    tutor.id
                  );

                  return (
                    <label
                      key={tutor.id}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition ${
                        selected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >

                      <div>

                        <p className="font-medium text-gray-800">
                          {tutor.name}
                        </p>

                        <p className="text-sm text-gray-500">
                          {tutor.email}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {tutor.department} • Year{" "}
                          {tutor.year} • Section{" "}
                          {tutor.section}
                        </p>

                      </div>

                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          toggleTutor(tutor.id)
                        }
                        className="h-5 w-5 accent-blue-600"
                      />

                    </label>
                  );
                })}

              </div>
            )}

          </div>

          {/* Class Advisor */}

          <div className="rounded-xl border border-gray-200 p-6">

            <div className="mb-5">

              <h3 className="text-lg font-semibold text-gray-800">
                Class Advisor
              </h3>

              <p className="text-sm text-gray-500">
                Select one class advisor.
              </p>

            </div>

            {loadingStaff ? (
              <p className="text-gray-500">
                Loading staff...
              </p>
            ) : advisors.length === 0 ? (
              <p className="text-gray-500">
                No class advisors available.
              </p>
            ) : (
              <div className="space-y-3">

                {advisors.map((advisor) => {

                  const selected =
                    selectedAdvisor === advisor.id;

                  return (
                    <label
                      key={advisor.id}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition ${
                        selected
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >

                      <div>

                        <p className="font-medium text-gray-800">
                          {advisor.name}
                        </p>

                        <p className="text-sm text-gray-500">
                          {advisor.email}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {advisor.department} • Year{" "}
                          {advisor.year} • Section{" "}
                          {advisor.section}
                        </p>

                      </div>

                      <input
                        type="radio"
                        name="classAdvisor"
                        checked={selected}
                        onChange={() =>
                          setSelectedAdvisor(advisor.id)
                        }
                        className="h-5 w-5 accent-green-600"
                      />

                    </label>
                  );
                })}

              </div>
            )}

          </div>

        </div>
      )}

      {/* Save */}

      {selectedClass && (
        <div className="mt-8 flex justify-end">

          <button
            type="button"
            onClick={assignStaff}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-8 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {saving
              ? "Assigning..."
              : "Assign Staff"}
          </button>

        </div>
      )}

    </div>
  );
}