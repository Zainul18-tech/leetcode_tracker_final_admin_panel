"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import type { ClassType } from "@/app/dashboard/admin/page";

interface Props {
  classes: ClassType[];
  loading: boolean;
  refreshClasses: () => void;
  onSelectClass: (classItem: ClassType) => void;
}

export default function ClassesTable({
  classes,
  loading,
  refreshClasses,
  onSelectClass,
}: Props) {
  const supabase = createClient();

  const [search, setSearch] = useState("");

  // Edit state
  const [editingClass, setEditingClass] =
    useState<ClassType | null>(null);

  const [editClassName, setEditClassName] = useState("");
  const [editDepartment, setEditDepartment] = useState("CSE");
  const [editYear, setEditYear] = useState(1);
  const [editSection, setEditSection] = useState("");
  const [editBatch, setEditBatch] = useState("");

  const [updating, setUpdating] = useState(false);

  const filteredClasses = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) {
      return classes;
    }

    return classes.filter((item) => {
      return (
        item.class_name.toLowerCase().includes(value) ||
        item.department.toLowerCase().includes(value) ||
        item.section.toLowerCase().includes(value) ||
        item.batch.toLowerCase().includes(value)
      );
    });
  }, [classes, search]);

  async function createActivityLog(
    action: string,
    description: string
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("activity_logs")
      .insert({
        action,
        description,
        user_email: user?.email ?? null,
      });

    if (error) {
      console.error("Activity log error:", error);
    }
  }

  async function deleteClass(id: string) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this class?"
    );

    if (!confirmDelete) return;

    const classItem = classes.find(
      (item) => item.id === id
    );

    const { error } = await supabase
      .from("classes")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await createActivityLog(
      "Class Deleted",
      `Class ${classItem?.class_name ?? id} was deleted.`
    );

    alert("Class deleted successfully.");

    refreshClasses();
  }

  function handleView(item: ClassType) {
    onSelectClass(item);
  }

  function handleEdit(item: ClassType) {
    setEditingClass(item);

    setEditClassName(item.class_name);
    setEditDepartment(item.department);
    setEditYear(item.year);
    setEditSection(item.section);
    setEditBatch(item.batch);
  }

  function closeEditModal() {
    setEditingClass(null);
  }

  async function updateClass() {
    if (!editingClass) return;

    if (
      !editClassName.trim() ||
      !editDepartment ||
      !editSection.trim() ||
      !editBatch.trim()
    ) {
      alert("Please fill all fields.");
      return;
    }

    setUpdating(true);

    const { error } = await supabase
      .from("classes")
      .update({
        class_name: editClassName.trim(),
        department: editDepartment,
        year: editYear,
        section: editSection.trim().toUpperCase(),
        batch: editBatch.trim(),
      })
      .eq("id", editingClass.id);

    setUpdating(false);

    if (error) {
      alert(error.message);
      return;
    }

    await createActivityLog(
      "Class Updated",
      `Class ${editingClass.class_name} was updated to ${editClassName.trim()}.`
    );

    alert("Class updated successfully.");

    setEditingClass(null);

    refreshClasses();
  }

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              All Classes
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              View and manage all created classes.
            </p>
          </div>

          <span className="w-fit rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
            {filteredClasses.length} Classes
          </span>

        </div>

        {/* Search */}
        <div className="relative mb-6">

          <Search
            size={18}
            className="absolute left-4 top-3.5 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search classes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-11 pr-4 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
          />

        </div>

        {/* Table */}
        <div className="overflow-x-auto">

          <table className="w-full min-w-[750px]">

            <thead>
              <tr className="bg-gray-100">

                <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700">
                  Class Name
                </th>

                <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700">
                  Department
                </th>

                <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700">
                  Year
                </th>

                <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700">
                  Section
                </th>

                <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700">
                  Batch
                </th>

                <th className="px-5 py-4 text-center text-sm font-semibold text-gray-700">
                  Actions
                </th>

              </tr>
            </thead>

            <tbody>

              {loading ? (

                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center text-gray-500"
                  >
                    Loading classes...
                  </td>
                </tr>

              ) : filteredClasses.length === 0 ? (

                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center text-gray-500"
                  >
                    No classes found.
                  </td>
                </tr>

              ) : (

                filteredClasses.map((item) => (

                  <tr
                    key={item.id}
                    className="border-b transition hover:bg-blue-50"
                  >

                    <td className="px-5 py-4 font-medium text-gray-800">
                      {item.class_name}
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {item.department}
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {item.year}
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {item.section}
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {item.batch}
                    </td>

                    <td className="px-5 py-4">

                      <div className="flex justify-center gap-2">

                        {/* VIEW */}
                        <button
                          type="button"
                          onClick={() => handleView(item)}
                          title="View Class Details"
                          className="rounded-lg p-2 hover:bg-blue-100"
                        >
                          <Eye
                            size={18}
                            className="text-blue-600"
                          />
                        </button>

                        {/* EDIT */}
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          title="Edit Class"
                          className="rounded-lg p-2 hover:bg-green-100"
                        >
                          <Pencil
                            size={18}
                            className="text-green-600"
                          />
                        </button>

                        {/* DELETE */}
                        <button
                          type="button"
                          onClick={() => deleteClass(item.id)}
                          title="Delete Class"
                          className="rounded-lg p-2 hover:bg-red-100"
                        >
                          <Trash2
                            size={18}
                            className="text-red-600"
                          />
                        </button>

                      </div>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

        {/* Footer */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-sm text-gray-500">
            Total Classes: {filteredClasses.length}
          </p>

          <div className="flex gap-2">

            <button
              type="button"
              className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              className="rounded-lg bg-blue-600 px-4 py-2 text-white"
            >
              1
            </button>

            <button
              type="button"
              className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50"
            >
              <ChevronRight size={16} />
            </button>

          </div>

        </div>

      </div>

      {/* EDIT CLASS MODAL */}
      {editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">

            {/* Modal Header */}
            <div className="mb-6 flex items-center justify-between">

              <div>
                <h2 className="text-2xl font-semibold text-gray-800">
                  Edit Class
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Update the class information.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                <X size={22} />
              </button>

            </div>

            {/* Form */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              {/* Class Name */}
              <div className="md:col-span-2">

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Class Name
                </label>

                <input
                  type="text"
                  value={editClassName}
                  onChange={(e) =>
                    setEditClassName(e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
                  placeholder="2nd CSE-B"
                />

              </div>

              {/* Department */}
              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Department
                </label>

                <select
                  value={editDepartment}
                  onChange={(e) =>
                    setEditDepartment(e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
                >
                  <option value="CSE">CSE</option>
                  <option value="IT">IT</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="MECH">MECH</option>
                  <option value="CIVIL">CIVIL</option>
                </select>

              </div>

              {/* Year */}
              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Year
                </label>

                <select
                  value={editYear}
                  onChange={(e) =>
                    setEditYear(Number(e.target.value))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
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
                  value={editSection}
                  onChange={(e) =>
                    setEditSection(
                      e.target.value.toUpperCase()
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
                  placeholder="A"
                />

              </div>

              {/* Batch */}
              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Batch
                </label>

                <input
                  type="text"
                  value={editBatch}
                  onChange={(e) =>
                    setEditBatch(e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
                  placeholder="2025-2029"
                />

              </div>

            </div>

            {/* Buttons */}
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={closeEditModal}
                disabled={updating}
                className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={updateClass}
                disabled={updating}
                className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
              >
                {updating ? "Updating..." : "Update Class"}
              </button>

            </div>

          </div>

        </div>
      )}

    </>
  );
}