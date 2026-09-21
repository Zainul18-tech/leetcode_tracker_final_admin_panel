"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Pencil,
  Trash2,
  X,
  UserCircle2,
  Search,
  GraduationCap,
  ChevronDown,
  Check,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  year: number;
  section: string;
  created_at: string;
}

interface ClassType {
  id: string;
  class_name: string;
  department: string;
  year: number;
  section: string;
  batch: string;
}

interface Props {
  staff: Staff[];
  loading: boolean;
  refreshStaff: () => void;
}

type FilterOption = {
  label: string;
  value: string;
};

/**
 * Click-to-open dropdown filter box.
 * Shows a button with the current label; clicking it opens a panel
 * of selectable options. Selecting an option applies the filter and
 * closes the panel.
 */
function FilterDropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);
  const isActive = value !== "ALL";

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm font-medium outline-none md:w-auto ${
          isActive
            ? "border-blue-500 bg-blue-50 text-blue-700"
            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        }`}
      >
        <span className="whitespace-nowrap">
          {isActive ? selectedOption?.label ?? label : label}
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-2 max-h-64 w-52 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {options.map((option) => {
            const selected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                  selected ? "font-semibold text-blue-700" : "text-gray-700"
                }`}
              >
                {option.label}
                {selected && <Check size={15} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function StaffTable({
  staff,
  loading,
  refreshStaff,
}: Props) {
  // Create the client once (not on every render) so it is safe as an effect dependency
  const [supabase] = useState(() => createClient());

  const [search, setSearch] = useState("");

  // --- Filter dropdown state ---
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterDepartment, setFilterDepartment] = useState("ALL");
  const [filterYear, setFilterYear] = useState("ALL");
  const [filterSection, setFilterSection] = useState("ALL");

  const [classes, setClasses] = useState<ClassType[]>([]);

  // Starts as true because classes are fetched as soon as the component mounts
  const [loadingClasses, setLoadingClasses] = useState(true);

  const [assigningStaff, setAssigningStaff] =
    useState<Staff | null>(null);

  const [selectedClassId, setSelectedClassId] =
    useState("");

  const [editingStaff, setEditingStaff] =
    useState<Staff | null>(null);

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDepartment, setEditDepartment] =
    useState("CSE");
  const [editYear, setEditYear] = useState(1);
  const [editSection, setEditSection] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);

  /*
   * Fetch classes for the Assign Class dropdown
   */
  useEffect(() => {
    let cancelled = false;

    async function loadClasses() {
      const { data, error } = await supabase
        .from("classes")
        .select(
          "id, class_name, department, year, section, batch"
        )
        .order("year")
        .order("section");

      // Ignore the result if the component unmounted
      if (cancelled) return;

      if (error) {
        console.error("Error fetching classes:", error);
        setClasses([]);
      } else {
        setClasses(data || []);
      }

      setLoadingClasses(false);
    }

    loadClasses();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  /*
   * Open Assign Class modal
   */
  function openAssignModal(staffMember: Staff) {
    setAssigningStaff(staffMember);

    /*
     * Try to find the class that already matches
     * this staff member's department/year/section.
     */
    const matchingClass = classes.find(
      (item) =>
        item.department === staffMember.department &&
        item.year === staffMember.year &&
        item.section === staffMember.section
    );

    setSelectedClassId(
      matchingClass?.id || ""
    );
  }

  /*
   * Assign tutor/advisor to selected class
   */
  async function assignClass() {
    if (!assigningStaff) return;

    if (!selectedClassId) {
      alert("Please select a class.");
      return;
    }

    const selectedClass = classes.find(
      (item) => item.id === selectedClassId
    );

    if (!selectedClass) {
      alert("Selected class was not found.");
      return;
    }

    /*
     * Update staff record with the selected
     * class's department/year/section.
     */
    const { error } = await supabase
      .from("staff")
      .update({
        department: selectedClass.department,
        year: selectedClass.year,
        section: selectedClass.section,
      })
      .eq("id", assigningStaff.id);

    if (error) {
      alert(error.message);
      return;
    }

    alert(
      `${assigningStaff.name} assigned to ${selectedClass.class_name}.`
    );

    setAssigningStaff(null);
    setSelectedClassId("");

    refreshStaff();
  }

  /*
   * Delete staff
   * Goes through the server route so the linked auth.users
   * account is deleted too (staff.user_id cascades on delete).
   */
  async function deleteStaff(id: string) {
    const staffMember = staff.find((item) => item.id === id);

    const confirmDelete = window.confirm(
      `Delete ${staffMember?.name ?? "this staff member"}? This will also remove their login access.`
    );

    if (!confirmDelete) return;

    setDeletingId(id);

    try {
      const res = await fetch(`/api/class-advisors/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data.error);
        alert(data.error ?? "Failed to delete staff member.");
        return;
      }

      refreshStaff();
    } catch (err) {
      console.error(err);
      alert("Something went wrong while deleting.");
    } finally {
      setDeletingId(null);
    }
  }

  /*
   * Open edit modal
   */
  function openEdit(staffMember: Staff) {
    setEditingStaff(staffMember);

    setEditName(staffMember.name);
    setEditEmail(staffMember.email);
    setEditDepartment(staffMember.department);
    setEditYear(staffMember.year);
    setEditSection(staffMember.section);
  }

  /*
   * Update staff
   */
  async function updateStaff() {
    if (!editingStaff) return;

    if (
      !editName ||
      !editEmail ||
      !editDepartment ||
      !editYear ||
      !editSection
    ) {
      alert("Please fill all fields.");
      return;
    }

    const { error } = await supabase
      .from("staff")
      .update({
        name: editName,
        email: editEmail,
        department: editDepartment,
        year: editYear,
        section: editSection,
      })
      .eq("id", editingStaff.id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Staff updated successfully.");

    setEditingStaff(null);

    refreshStaff();
  }

  // --- Unique dropdown options derived from staff data ---
  const roleOptions: FilterOption[] = useMemo(() => {
    const set = new Set(
      staff.map((s) => s.role).filter((r): r is string => !!r)
    );
    return [
      { label: "All Roles", value: "ALL" },
      ...Array.from(set)
        .sort()
        .map((role) => ({ label: role, value: role })),
    ];
  }, [staff]);

  const departmentOptions: FilterOption[] = useMemo(() => {
    const set = new Set(
      staff.map((s) => s.department).filter((d): d is string => !!d)
    );
    return [
      { label: "All Departments", value: "ALL" },
      ...Array.from(set)
        .sort()
        .map((dept) => ({ label: dept, value: dept })),
    ];
  }, [staff]);

  const yearOptions: FilterOption[] = useMemo(() => {
    const set = new Set(staff.map((s) => s.year).filter(Boolean) as number[]);
    return [
      { label: "All Years", value: "ALL" },
      ...Array.from(set)
        .sort((a, b) => a - b)
        .map((year) => ({
          label:
            year === 1
              ? "1st Year"
              : year === 2
              ? "2nd Year"
              : year === 3
              ? "3rd Year"
              : `${year}th Year`,
          value: String(year),
        })),
    ];
  }, [staff]);

  const sectionOptions: FilterOption[] = useMemo(() => {
    const set = new Set(
      staff.map((s) => s.section).filter((sec): sec is string => !!sec)
    );
    return [
      { label: "All Sections", value: "ALL" },
      ...Array.from(set)
        .sort()
        .map((section) => ({
          label: `Section ${section}`,
          value: section,
        })),
    ];
  }, [staff]);

  function resetFilters() {
    setFilterRole("ALL");
    setFilterDepartment("ALL");
    setFilterYear("ALL");
    setFilterSection("ALL");
    setSearch("");
  }

  /*
   * Filter + Search
   */
  const filteredStaff = useMemo(() => {
    let filtered = staff;

    if (filterRole !== "ALL") {
      filtered = filtered.filter((item) => item.role === filterRole);
    }

    if (filterDepartment !== "ALL") {
      filtered = filtered.filter(
        (item) => item.department === filterDepartment
      );
    }

    if (filterYear !== "ALL") {
      filtered = filtered.filter(
        (item) => item.year === Number(filterYear)
      );
    }

    if (filterSection !== "ALL") {
      filtered = filtered.filter(
        (item) => item.section === filterSection
      );
    }

    if (!search) return filtered;

    const value = search.toLowerCase();

    return filtered.filter(
      (item) =>
        item.name.toLowerCase().includes(value) ||
        item.email.toLowerCase().includes(value) ||
        item.department.toLowerCase().includes(value) ||
        item.section.toLowerCase().includes(value)
    );
  }, [staff, search, filterRole, filterDepartment, filterYear, filterSection]);

  const hasActiveFilters =
    filterRole !== "ALL" ||
    filterDepartment !== "ALL" ||
    filterYear !== "ALL" ||
    filterSection !== "ALL" ||
    search !== "";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              Staff
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage staff members and assign them to classes.
            </p>
          </div>

          <span className="w-fit rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
            {filteredStaff.length} Staff
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="p-6 pb-0">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-3.5 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff..."
            className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-11 pr-4 text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Filter dropdowns */}
      <div className="flex flex-col flex-wrap gap-3 p-6 pb-0 md:flex-row md:items-center">
        <FilterDropdown
          label="Role"
          options={roleOptions}
          value={filterRole}
          onChange={setFilterRole}
        />

        <FilterDropdown
          label="Department"
          options={departmentOptions}
          value={filterDepartment}
          onChange={setFilterDepartment}
        />

        <FilterDropdown
          label="Year"
          options={yearOptions}
          value={filterYear}
          onChange={setFilterYear}
        />

        <FilterDropdown
          label="Section"
          options={sectionOptions}
          value={filterSection}
          onChange={setFilterSection}
        />

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 md:ml-auto"
          >
            <X size={16} />
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-10 text-center text-gray-500">
          Loading staff...
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <p className="text-lg font-medium text-gray-600">No data found</p>
          <p className="mt-1 text-sm text-gray-400">
            {hasActiveFilters
              ? "No staff match the selected filters. Try adjusting or clearing them."
              : "There are no staff members to display right now."}
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
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left">Staff</th>

                <th className="px-6 py-4 text-left">Email</th>

                <th className="px-6 py-4 text-left">Role</th>

                <th className="px-6 py-4 text-left">Department</th>

                <th className="px-6 py-4 text-left">Class</th>

                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredStaff.map((staffMember) => {
                const assignedClass = classes.find(
                  (item) =>
                    item.department === staffMember.department &&
                    item.year === staffMember.year &&
                    item.section === staffMember.section
                );

                return (
                  <tr
                    key={staffMember.id}
                    className="border-t hover:bg-gray-50"
                  >
                    {/* Staff */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserCircle2
                          size={42}
                          className="text-gray-400"
                        />

                        <div>
                          <p className="font-medium text-gray-800">
                            {staffMember.name}
                          </p>

                          <p className="text-sm text-gray-500">
                            {staffMember.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 text-gray-700">
                      {staffMember.email}
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          staffMember.role === "Class Advisor"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {staffMember.role}
                      </span>
                    </td>

                    {/* Department */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-800">
                          {staffMember.department}
                        </p>

                        <p className="text-sm text-gray-500">
                          Year {staffMember.year} - Section{" "}
                          {staffMember.section}
                        </p>
                      </div>
                    </td>

                    {/* Class */}
                    <td className="px-6 py-4">
                      {assignedClass ? (
                        <div className="flex items-center gap-2">
                          <GraduationCap
                            size={18}
                            className="text-blue-600"
                          />

                          <span className="font-medium text-gray-700">
                            {assignedClass.class_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">
                          Not assigned
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openAssignModal(staffMember)}
                          className="rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200"
                        >
                          Assign Class
                        </button>

                        <button
                          onClick={() => openEdit(staffMember)}
                          className="rounded-lg bg-green-100 p-2 text-green-600 hover:bg-green-200"
                          title="Edit"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          onClick={() => deleteStaff(staffMember.id)}
                          disabled={deletingId === staffMember.id}
                          className="rounded-lg bg-red-100 p-2 text-red-600 hover:bg-red-200 disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Class Modal */}
      {assigningStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Assign Class
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Assign {assigningStaff.name} to a class.
                </p>
              </div>

              <button
                onClick={() => {
                  setAssigningStaff(null);
                  setSelectedClassId("");
                }}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <label className="mb-2 block text-sm font-medium text-gray-700">
              Select Class
            </label>

            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              disabled={loadingClasses}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-blue-500"
            >
              <option value="">
                {loadingClasses ? "Loading classes..." : "Select a class"}
              </option>

              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.class_name} - {classItem.department} -{" "}
                  {classItem.batch}
                </option>
              ))}
            </select>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setAssigningStaff(null);
                  setSelectedClassId("");
                }}
                className="rounded-lg border border-gray-300 px-5 py-2 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={assignClass}
                disabled={!selectedClassId}
                className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                Save Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Edit Staff
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Update staff information.
                </p>
              </div>

              <button
                onClick={() => setEditingStaff(null)}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Name
                </label>

                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-3 text-black outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Email
                </label>

                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-3 text-black outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Department
                  </label>

                  <select
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white p-3 text-black"
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
                    value={editYear}
                    onChange={(e) => setEditYear(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 bg-white p-3 text-black"
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Section
                </label>

                <input
                  value={editSection}
                  onChange={(e) =>
                    setEditSection(e.target.value.toUpperCase())
                  }
                  placeholder="A"
                  className="w-full rounded-lg border border-gray-300 p-3 text-black outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditingStaff(null)}
                className="rounded-lg border border-gray-300 px-5 py-2 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={updateStaff}
                className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700"
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