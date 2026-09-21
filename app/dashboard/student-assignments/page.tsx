"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  UserPlus,
  UserMinus,
  RefreshCw,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface ClassType {
  id: string;
  class_name: string;
  department: string;
  year: number;
  section: string;
  batch: string;
}

interface StudentType {
  reg_no: string;
  name: string;
  department: string;
  year: number;
  section: string;
  leetcode_username: string;
  leetcode_link: string;
  github_link: string;
  class_id: string | null;
}

export default function StudentAssignmentsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [classes, setClasses] = useState<ClassType[]>([]);
  const [students, setStudents] = useState<StudentType[]>([]);

  const [selectedClass, setSelectedClass] = useState("");

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);

    const [classesResult, studentsResult] =
      await Promise.all([
        supabase
          .from("classes")
          .select("*")
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("students")
          .select("*")
          .order("reg_no"),
      ]);

    if (classesResult.error) {
      console.error(classesResult.error);
      alert(classesResult.error.message);
    }

    if (studentsResult.error) {
      console.error(studentsResult.error);
      alert(studentsResult.error.message);
    }

    setClasses(classesResult.data ?? []);
    setStudents(studentsResult.data ?? []);

    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function assignStudent(
    regNo: string
  ) {
    if (!selectedClass) {
      alert("Please select a class first.");
      return;
    }

    setSaving(regNo);

    const { error } = await supabase
      .from("students")
      .update({
        class_id: selectedClass,
      })
      .eq("reg_no", regNo);

    setSaving(null);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    await fetchData();
  }

  async function removeStudent(
    regNo: string
  ) {
    const confirmRemove = window.confirm(
      "Remove this student from the selected class?"
    );

    if (!confirmRemove) {
      return;
    }

    setSaving(regNo);

    const { error } = await supabase
      .from("students")
      .update({
        class_id: null,
      })
      .eq("reg_no", regNo);

    setSaving(null);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    await fetchData();
  }

  const selectedClassData = classes.find(
    (item) => item.id === selectedClass
  );

  const assignedStudents = useMemo(() => {
    if (!selectedClass) {
      return [];
    }

    return students.filter(
      (student) =>
        student.class_id === selectedClass
    );
  }, [students, selectedClass]);

  const unassignedStudents = useMemo(() => {
    const value = search.toLowerCase().trim();

    return students.filter((student) => {
      const matchesSearch =
        student.reg_no
          .toLowerCase()
          .includes(value) ||
        student.name
          .toLowerCase()
          .includes(value);

      return (
        student.class_id === null &&
        matchesSearch
      );
    });
  }, [students, search]);

  async function handleLogout() {
    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <DashboardLayout onLogout={handleLogout}>
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-gray-500">
            Loading students and classes...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout onLogout={handleLogout}>
      <div className="space-y-8">

        {/* Header */}

        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Student Assignments
            </h1>

            <p className="mt-2 text-gray-500">
              Assign students to their respective
              classes.
            </p>
          </div>

          <button
            onClick={fetchData}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            <RefreshCw size={18} />
            Refresh
          </button>

        </div>

        {/* Select Class */}

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

          <h2 className="mb-2 text-2xl font-semibold text-gray-800">
            Select Class
          </h2>

          <p className="mb-6 text-sm text-gray-500">
            Choose a class to manage its students.
          </p>

          <select
            value={selectedClass}
            onChange={(e) =>
              setSelectedClass(e.target.value)
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-blue-500 md:w-1/2"
          >
            <option value="">
              Select a class
            </option>

            {classes.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.class_name} -{" "}
                {item.department} - Year{" "}
                {item.year} - Section{" "}
                {item.section}
              </option>
            ))}
          </select>

          {selectedClassData && (
            <div className="mt-6 rounded-xl bg-blue-50 p-5">

              <h3 className="font-semibold text-gray-800">
                Selected Class
              </h3>

              <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">

                <div>
                  <p className="text-xs text-gray-500">
                    Class
                  </p>

                  <p className="font-medium text-gray-800">
                    {selectedClassData.class_name}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Department
                  </p>

                  <p className="font-medium text-gray-800">
                    {selectedClassData.department}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Year
                  </p>

                  <p className="font-medium text-gray-800">
                    {selectedClassData.year}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Section
                  </p>

                  <p className="font-medium text-gray-800">
                    {selectedClassData.section}
                  </p>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Students */}

        {selectedClass && (
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">

            {/* Assigned Students */}

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

              <div className="mb-6">

                <h2 className="text-2xl font-semibold text-gray-800">
                  Assigned Students
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Students currently assigned to this
                  class.
                </p>

              </div>

              {assignedStudents.length === 0 ? (
                <div className="rounded-lg bg-gray-50 py-10 text-center text-gray-500">
                  No students assigned to this class.
                </div>
              ) : (
                <div className="overflow-x-auto">

                  <table className="w-full">

                    <thead>
                      <tr className="bg-gray-100">

                        <th className="p-3 text-left">
                          Reg No
                        </th>

                        <th className="p-3 text-left">
                          Name
                        </th>

                        <th className="p-3 text-center">
                          Action
                        </th>

                      </tr>
                    </thead>

                    <tbody>

                      {assignedStudents.map(
                        (student) => (
                          <tr
                            key={student.reg_no}
                            className="border-b"
                          >

                            <td className="p-3">
                              {student.reg_no}
                            </td>

                            <td className="p-3 font-medium">
                              {student.name}
                            </td>

                            <td className="p-3 text-center">

                              <button
                                onClick={() =>
                                  removeStudent(
                                    student.reg_no
                                  )
                                }
                                disabled={
                                  saving ===
                                  student.reg_no
                                }
                                className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-2 text-red-600 hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400"
                              >
                                <UserMinus
                                  size={16}
                                />

                                {saving ===
                                student.reg_no
                                  ? "Removing..."
                                  : "Remove"}
                              </button>

                            </td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>
              )}

              <div className="mt-5 text-sm text-gray-500">
                Total assigned:{" "}
                <span className="font-semibold text-gray-800">
                  {assignedStudents.length}
                </span>
              </div>

            </div>

            {/* Unassigned Students */}

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

              <div className="mb-6">

                <h2 className="text-2xl font-semibold text-gray-800">
                  Unassigned Students
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Students who have not been assigned
                  to any class.
                </p>

              </div>

              {/* Search */}

              <div className="mb-5">

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search by register number or name..."
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-blue-500"
                />

              </div>

              {unassignedStudents.length === 0 ? (
                <div className="rounded-lg bg-gray-50 py-10 text-center text-gray-500">
                  No unassigned students found.
                </div>
              ) : (
                <div className="overflow-x-auto">

                  <table className="w-full">

                    <thead>
                      <tr className="bg-gray-100">

                        <th className="p-3 text-left">
                          Reg No
                        </th>

                        <th className="p-3 text-left">
                          Name
                        </th>

                        <th className="p-3 text-center">
                          Action
                        </th>

                      </tr>
                    </thead>

                    <tbody>

                      {unassignedStudents.map(
                        (student) => (
                          <tr
                            key={student.reg_no}
                            className="border-b"
                          >

                            <td className="p-3">
                              {student.reg_no}
                            </td>

                            <td className="p-3 font-medium">
                              {student.name}
                            </td>

                            <td className="p-3 text-center">

                              <button
                                onClick={() =>
                                  assignStudent(
                                    student.reg_no
                                  )
                                }
                                disabled={
                                  saving ===
                                  student.reg_no
                                }
                                className="inline-flex items-center gap-1 rounded-lg bg-blue-100 px-3 py-2 text-blue-600 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400"
                              >
                                <UserPlus
                                  size={16}
                                />

                                {saving ===
                                student.reg_no
                                  ? "Assigning..."
                                  : "Assign"}
                              </button>

                            </td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>
              )}

              <div className="mt-5 text-sm text-gray-500">
                Unassigned students:{" "}
                <span className="font-semibold text-gray-800">
                  {students.filter(
                    (student) =>
                      student.class_id === null
                  ).length}
                </span>
              </div>

            </div>

          </div>
        )}

        {/* No class selected */}

        {!selectedClass && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">

            <h3 className="text-xl font-semibold text-gray-700">
              Select a class to continue
            </h3>

            <p className="mt-2 text-gray-500">
              Once you select a class, you can assign
              students to it.
            </p>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}