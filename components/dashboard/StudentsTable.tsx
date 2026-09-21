"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  Trash2,
  ExternalLink,
  RefreshCw,
  Pencil,
  X,
} from "lucide-react";

import type { ClassType } from "@/app/dashboard/admin/page";

type Student = {
  reg_no: string;
  name: string;
  department: string;
  year: number;
  section: string;
  leetcode_username: string;
  leetcode_link: string;
  github_link: string;
};

interface Props {
  selectedClass: ClassType | null;
}

export default function StudentsTable({
  selectedClass,
}: Props) {
  const supabase = createClient();

  async function createActivityLog(action: string, description: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("activity_logs").insert({
      action,
      description,
      user_email: user?.email ?? null,
    });

    if (error) {
      console.error("Activity log error:", error);
    }
  }

  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<Student | null>(null);

  const [editName, setEditName] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editYear, setEditYear] = useState(1);
  const [editSection, setEditSection] = useState("");
  const [editLeetcodeUsername, setEditLeetcodeUsername] = useState("");
  const [editLeetcodeLink, setEditLeetcodeLink] = useState("");
  const [editGithubLink, setEditGithubLink] = useState("");

  // --- Filter dropdown state ---
  const [filterDepartment, setFilterDepartment] = useState("ALL");
  const [filterYear, setFilterYear] = useState("ALL");
  const [filterSection, setFilterSection] = useState("ALL");

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    setLoading(true);

    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("reg_no");

    if (!error && data) {
      setStudents(data);
    }

    setLoading(false);
  }

  async function deleteStudent(regNo: string) {
    const ok = confirm(`Delete student ${regNo}?`);

    if (!ok) return;

    const student = students.find((item) => item.reg_no === regNo);

    const { error } = await supabase
      .from("students")
      .delete()
      .eq("reg_no", regNo);

    if (error) {
      alert(error.message);
      return;
    }

    await createActivityLog(
      "Student Deleted",
      `Student ${regNo}${student?.name ? ` - ${student.name}` : ""} was deleted.`
    );

    fetchStudents();
  }

  function openEdit(student: Student) {
    setEditing(student);

    setEditName(student.name);
    setEditDepartment(student.department);
    setEditYear(student.year);
    setEditSection(student.section);
    setEditLeetcodeUsername(student.leetcode_username);
    setEditLeetcodeLink(student.leetcode_link);
    setEditGithubLink(student.github_link);
  }

  async function updateStudent() {
    if (!editing) return;

    const { error } = await supabase
      .from("students")
      .update({
        name: editName,
        department: editDepartment,
        year: editYear,
        section: editSection,
        leetcode_username: editLeetcodeUsername,
        leetcode_link: editLeetcodeLink,
        github_link: editGithubLink,
      })
      .eq("reg_no", editing.reg_no);

    if (error) {
      alert(error.message);
      return;
    }

    await createActivityLog(
      "Student Updated",
      `Student ${editing.reg_no} - ${editName} was updated.`
    );

    alert("Student updated successfully.");

    setEditing(null);

    fetchStudents();
  }

  // --- Unique dropdown options derived from students data ---
  const departmentOptions = useMemo(() => {
    const set = new Set(students.map((s) => s.department).filter(Boolean));
    return Array.from(set).sort();
  }, [students]);

  const yearOptions = useMemo(() => {
    const set = new Set(students.map((s) => s.year).filter(Boolean));
    return Array.from(set).sort((a, b) => a - b);
  }, [students]);

  const sectionOptions = useMemo(() => {
    const set = new Set(students.map((s) => s.section).filter(Boolean));
    return Array.from(set).sort();
  }, [students]);

  function resetFilters() {
    setFilterDepartment("ALL");
    setFilterYear("ALL");
    setFilterSection("ALL");
    setSearch("");
  }

  const filteredStudents = useMemo(() => {
    let filtered = students;

    if (selectedClass) {
      filtered = filtered.filter(
        (student) =>
          student.department === selectedClass.department &&
          student.year === selectedClass.year &&
          student.section === selectedClass.section
      );
    }

    if (filterDepartment !== "ALL") {
      filtered = filtered.filter(
        (student) => student.department === filterDepartment
      );
    }

    if (filterYear !== "ALL") {
      filtered = filtered.filter(
        (student) => student.year === Number(filterYear)
      );
    }

    if (filterSection !== "ALL") {
      filtered = filtered.filter(
        (student) => student.section === filterSection
      );
    }

    if (!search) return filtered;

    const value = search.toLowerCase();

    return filtered.filter(
      (student) =>
        student.reg_no.toLowerCase().includes(value) ||
        student.name.toLowerCase().includes(value)
    );
  }, [students, search, selectedClass, filterDepartment, filterYear, filterSection]);

  const hasActiveFilters =
    filterDepartment !== "ALL" ||
    filterYear !== "ALL" ||
    filterSection !== "ALL" ||
    search !== "";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 sm:text-2xl">
            Students
          </h2>

          <p className="text-sm text-gray-500">
            {selectedClass
              ? `${selectedClass.class_name} • ${filteredStudents.length} Students`
              : `${filteredStudents.length} Students`}
          </p>
        </div>

        <button
          onClick={fetchStudents}
          className="flex items-center justify-center gap-2 rounded-lg border px-4 py-2 hover:bg-gray-100 sm:justify-start"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-4 top-3.5 text-gray-400" />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by register number or name..."
          className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none focus:border-blue-500 sm:text-base"
        />
      </div>

      {/* --- Filter dropdowns --- */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500 sm:w-auto sm:text-base"
        >
          <option value="ALL">All Departments</option>
          {departmentOptions.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>

        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500 sm:w-auto sm:text-base"
        >
          <option value="ALL">All Years</option>
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year === 1
                ? "1st Year"
                : year === 2
                ? "2nd Year"
                : year === 3
                ? "3rd Year"
                : `${year}th Year`}
            </option>
          ))}
        </select>

        <select
          value={filterSection}
          onChange={(e) => setFilterSection(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500 sm:w-auto sm:text-base"
        >
          <option value="ALL">All Sections</option>
          {sectionOptions.map((section) => (
            <option key={section} value={section}>
              Section {section}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex w-full items-center justify-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 sm:ml-auto sm:w-auto"
          >
            <X size={16} />
            Clear Filters
          </button>
        )}
      </div>

      {loading && (
        <div className="py-10 text-center text-gray-500">
          Loading students...
        </div>
      )}

      {!loading && filteredStudents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <p className="text-lg font-medium text-gray-600">No data found</p>
          <p className="mt-1 text-sm text-gray-400">
            {hasActiveFilters
              ? "No students match the selected filters. Try adjusting or clearing them."
              : "There are no students to display right now."}
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="mt-4 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {!loading && filteredStudents.length > 0 && (
        <>
          {/* --- Mobile / tablet card list (below lg) --- */}
          <div className="flex flex-col gap-3 lg:hidden">
            {filteredStudents.map((student) => (
              <div
                key={student.reg_no}
                className="rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900">
                      {student.name}
                    </p>
                    <p className="text-sm text-gray-500">{student.reg_no}</p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => openEdit(student)}
                      className="rounded-lg bg-green-100 p-2 text-green-600 hover:bg-green-200"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={() => deleteStudent(student.reg_no)}
                      className="rounded-lg bg-red-100 p-2 text-red-600 hover:bg-red-200"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">Department</span>
                    <p className="text-gray-800">{student.department}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Year</span>
                    <p className="text-gray-800">{student.year}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Section</span>
                    <p className="text-gray-800">{student.section}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-4 border-t border-gray-100 pt-3 text-sm">
                  <div>
                    <span className="mr-1 text-gray-400">LeetCode:</span>
                    {student.leetcode_link ? (
                      <a
                        href={student.leetcode_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        Profile
                        <ExternalLink size={13} />
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>

                  <div>
                    <span className="mr-1 text-gray-400">GitHub:</span>
                    {student.github_link ? (
                      <a
                        href={student.github_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        Profile
                        <ExternalLink size={13} />
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* --- Desktop table (lg and up) --- */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-left">Reg No</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Department</th>
                  <th className="p-3 text-left">Year</th>
                  <th className="p-3 text-left">Section</th>
                  <th className="p-3 text-center">LeetCode</th>
                  <th className="p-3 text-center">GitHub</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((student) => (
                  <tr
                    key={student.reg_no}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="p-3">{student.reg_no}</td>
                    <td className="p-3 font-medium">{student.name}</td>
                    <td className="p-3">{student.department}</td>
                    <td className="p-3">{student.year}</td>
                    <td className="p-3">{student.section}</td>

                    <td className="p-3 text-center">
                      {student.leetcode_link ? (
                        <a
                          href={student.leetcode_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          Profile
                          <ExternalLink size={15} />
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="p-3 text-center">
                      {student.github_link ? (
                        <a
                          href={student.github_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          Profile
                          <ExternalLink size={15} />
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEdit(student)}
                          className="rounded-lg bg-green-100 p-2 text-green-600 hover:bg-green-200"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          onClick={() => deleteStudent(student.reg_no)}
                          className="rounded-lg bg-red-100 p-2 text-red-600 hover:bg-red-200"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-lg sm:p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 sm:text-xl">
                Edit Student
              </h3>

              <button
                onClick={() => setEditing(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Register No
                </label>
                <input
                  value={editing.reg_no}
                  disabled
                  className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-gray-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Department
                </label>
                <select
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black"
                >
                  <option>CSE</option>
                  <option>IT</option>
                  <option>ECE</option>
                  <option>EEE</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Year
                </label>
                <select
                  value={editYear}
                  onChange={(e) => setEditYear(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black"
                >
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Section
                </label>
                <input
                  value={editSection}
                  onChange={(e) => setEditSection(e.target.value.toUpperCase())}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  LeetCode Username
                </label>
                <input
                  value={editLeetcodeUsername}
                  onChange={(e) => setEditLeetcodeUsername(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  LeetCode Profile Link
                </label>
                <input
                  value={editLeetcodeLink}
                  onChange={(e) => setEditLeetcodeLink(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  GitHub Profile Link
                </label>
                <input
                  value={editGithubLink}
                  onChange={(e) => setEditGithubLink(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setEditing(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                onClick={updateStudent}
                className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}