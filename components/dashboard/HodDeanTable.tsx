"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  ChevronDown,
  Check,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export interface HodDeanType {
  id: string;
  name: string;
  email: string;
  role: "HOD" | "Dean";
  department: string | null;
  created_at: string;
}

interface Props {
  staff: HodDeanType[];
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

export default function HodDeanTable({
  staff,
  loading,
  refreshStaff,
}: Props) {
  const supabase = createClient();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<HodDeanType | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<"HOD" | "Dean">("HOD");
  const [editDepartment, setEditDepartment] = useState("CSE");

  // --- Filter dropdown state ---
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterDepartment, setFilterDepartment] = useState("ALL");

  const roleOptions: FilterOption[] = [
    { label: "All Roles", value: "ALL" },
    { label: "HOD", value: "HOD" },
    { label: "Dean", value: "Dean" },
  ];

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

  function resetFilters() {
    setFilterRole("ALL");
    setFilterDepartment("ALL");
    setSearch("");
  }

  const filteredStaff = useMemo(() => {
    let filtered = staff;

    if (filterRole !== "ALL") {
      filtered = filtered.filter((s) => s.role === filterRole);
    }

    if (filterDepartment !== "ALL") {
      filtered = filtered.filter((s) => s.department === filterDepartment);
    }

    const value = search.toLowerCase().trim();

    if (!value) return filtered;

    return filtered.filter((s) => {
      return (
        s.name.toLowerCase().includes(value) ||
        s.email.toLowerCase().includes(value) ||
        s.role.toLowerCase().includes(value) ||
        (s.department ?? "").toLowerCase().includes(value)
      );
    });
  }, [staff, search, filterRole, filterDepartment]);

  const hasActiveFilters =
    filterRole !== "ALL" || filterDepartment !== "ALL" || search !== "";

  function openEdit(person: HodDeanType) {
    setEditing(person);

    setEditName(person.name);
    setEditEmail(person.email);
    setEditRole(person.role);
    setEditDepartment(person.department ?? "CSE");
  }

  async function updatePerson() {
    if (!editing) return;

    if (!editName.trim() || !editEmail.trim() || !editRole) {
      alert("Please fill all fields.");
      return;
    }

    if (editRole === "HOD" && !editDepartment) {
      alert("Please select a department.");
      return;
    }

    const { error } = await supabase
      .from("staff")
      .update({
        name: editName.trim(),
        email: editEmail.trim(),
        role: editRole,
        department: editRole === "HOD" ? editDepartment : null,
      })
      .eq("id", editing.id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    alert(`${editRole} updated successfully.`);

    setEditing(null);
    refreshStaff();
  }

  async function deletePerson(id: string) {
    const person = staff.find((item) => item.id === id);

    const confirmDelete = window.confirm(
      `Delete ${person?.name ?? "this staff member"}? This will also remove their login access.`
    );

    if (!confirmDelete) return;

    setDeletingId(id);

    try {
      const res = await fetch(`/api/hod-dean/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data.error);
        alert(data.error ?? "Failed to delete.");
        return;
      }

      alert("Deleted successfully.");
      refreshStaff();
    } catch (err) {
      console.error(err);
      alert("Something went wrong while deleting.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              HODs & Deans
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              View and manage all HODs and Deans.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshStaff}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-100"
          >
            <RefreshCw size={18} />
            Refresh
          </button>

        </div>

        {/* Search */}
        <div className="relative mb-4">

          <Search
            size={18}
            className="absolute left-4 top-3.5 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search HODs and Deans..."
            className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-11 pr-4 text-black placeholder:text-gray-400 outline-none focus:border-blue-500"
          />

        </div>

        {/* Filter dropdowns */}
        <div className="mb-6 flex flex-col flex-wrap gap-3 md:flex-row md:items-center">

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

        {/* Loading */}
        {loading && (
          <div className="py-10 text-center text-gray-500">
            Loading HODs and Deans...
          </div>
        )}

        {/* Empty */}
        {!loading && filteredStaff.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <p className="text-lg font-medium text-gray-600">
              No data found
            </p>
            <p className="mt-1 text-sm text-gray-400">
              {hasActiveFilters
                ? "No HODs or Deans match the selected filters. Try adjusting or clearing them."
                : "There are no HODs or Deans to display right now."}
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

        {/* Table */}
        {!loading && filteredStaff.length > 0 && (
          <div className="overflow-x-auto">

            <table className="w-full border-collapse">

              <thead>
                <tr className="bg-gray-100">

                  <th className="p-4 text-left text-sm font-semibold text-gray-700">
                    Name
                  </th>

                  <th className="p-4 text-left text-sm font-semibold text-gray-700">
                    Email
                  </th>

                  <th className="p-4 text-left text-sm font-semibold text-gray-700">
                    Role
                  </th>

                  <th className="p-4 text-left text-sm font-semibold text-gray-700">
                    Department
                  </th>

                  <th className="p-4 text-center text-sm font-semibold text-gray-700">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredStaff.map((person) => (
                  <tr
                    key={person.id}
                    className="border-b border-gray-200 transition hover:bg-gray-50"
                  >

                    <td className="p-4 font-medium text-gray-800">
                      {person.name}
                    </td>

                    <td className="p-4 text-gray-600">
                      {person.email}
                    </td>

                    <td className="p-4 text-gray-600">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          person.role === "Dean"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {person.role}
                      </span>
                    </td>

                    <td className="p-4 text-gray-600">
                      {person.department || "All Departments"}
                    </td>

                    <td className="p-4">

                      <div className="flex justify-center gap-2">

                        <button
                          type="button"
                          onClick={() => openEdit(person)}
                          className="rounded-lg bg-green-100 p-2 text-green-600 transition hover:bg-green-200"
                          title="Edit"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={() => deletePerson(person.id)}
                          disabled={deletingId === person.id}
                          className="rounded-lg bg-red-100 p-2 text-red-600 transition hover:bg-red-200 disabled:opacity-50"
                          title="Delete"
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
        )}

        {/* Footer */}
        {!loading && (
          <div className="mt-6 text-sm text-gray-500">
            Total HODs & Deans: {filteredStaff.length}
          </div>
        )}

      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">

            {/* Modal Header */}
            <div className="mb-6 flex items-center justify-between">

              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Edit {editing.role}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Update HOD/Dean details.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                <X size={22} />
              </button>

            </div>

            {/* Edit Fields */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Name
                </label>

                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black outline-none focus:border-blue-500"
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
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Role
                </label>

                <select
                  value={editRole}
                  onChange={(e) =>
                    setEditRole(e.target.value as "HOD" | "Dean")
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black outline-none focus:border-blue-500"
                >
                  <option value="HOD">HOD</option>
                  <option value="Dean">Dean</option>
                </select>
              </div>

              {editRole === "HOD" ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Department
                  </label>

                  <select
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black outline-none focus:border-blue-500"
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

            </div>

            {/* Modal Buttons */}
            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg border border-gray-300 px-5 py-3 text-gray-700 transition hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={updatePerson}
                className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700"
              >
                Save Changes
              </button>

            </div>

          </div>

        </div>
      )}
    </>
  );
}