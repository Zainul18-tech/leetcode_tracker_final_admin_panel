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

export interface ClassAdvisorType {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  year: number | null;
  section: string | null;
  created_at: string;
}

interface Props {
  advisors: ClassAdvisorType[];
  loading: boolean;
  refreshAdvisors: () => void;
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

export default function ClassAdvisorsTable({
  advisors,
  loading,
  refreshAdvisors,
}: Props) {
  const supabase = createClient();

  const [search, setSearch] = useState("");
  const [editing, setEditing] =
    useState<ClassAdvisorType | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDepartment, setEditDepartment] =
    useState("CSE");
  const [editYear, setEditYear] = useState(1);
  const [editSection, setEditSection] = useState("");

  // --- Filter dropdown state ---
  const [filterDepartment, setFilterDepartment] = useState("ALL");
  const [filterYear, setFilterYear] = useState("ALL");
  const [filterSection, setFilterSection] = useState("ALL");

  // --- Unique dropdown options derived from advisors data ---
  const departmentOptions: FilterOption[] = useMemo(() => {
    const set = new Set(
      advisors.map((a) => a.department).filter((d): d is string => !!d)
    );
    return [
      { label: "All Departments", value: "ALL" },
      ...Array.from(set)
        .sort()
        .map((dept) => ({ label: dept, value: dept })),
    ];
  }, [advisors]);

  const yearOptions: FilterOption[] = useMemo(() => {
    const set = new Set(
      advisors.map((a) => a.year).filter(Boolean) as number[]
    );
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
  }, [advisors]);

  const sectionOptions: FilterOption[] = useMemo(() => {
    const set = new Set(
      advisors.map((a) => a.section).filter((s): s is string => !!s)
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
  }, [advisors]);

  function resetFilters() {
    setFilterDepartment("ALL");
    setFilterYear("ALL");
    setFilterSection("ALL");
    setSearch("");
  }

  const filteredAdvisors = useMemo(() => {
    let filtered = advisors;

    if (filterDepartment !== "ALL") {
      filtered = filtered.filter(
        (advisor) => advisor.department === filterDepartment
      );
    }

    if (filterYear !== "ALL") {
      filtered = filtered.filter(
        (advisor) => advisor.year === Number(filterYear)
      );
    }

    if (filterSection !== "ALL") {
      filtered = filtered.filter(
        (advisor) => advisor.section === filterSection
      );
    }

    const value = search.toLowerCase().trim();

    if (!value) return filtered;

    return filtered.filter((advisor) => {
      return (
        advisor.name.toLowerCase().includes(value) ||
        advisor.email.toLowerCase().includes(value) ||
        advisor.department.toLowerCase().includes(value) ||
        (advisor.section ?? "")
          .toLowerCase()
          .includes(value)
      );
    });
  }, [advisors, search, filterDepartment, filterYear, filterSection]);

  const hasActiveFilters =
    filterDepartment !== "ALL" ||
    filterYear !== "ALL" ||
    filterSection !== "ALL" ||
    search !== "";

  function openEdit(advisor: ClassAdvisorType) {
    setEditing(advisor);

    setEditName(advisor.name);
    setEditEmail(advisor.email);
    setEditDepartment(advisor.department);
    setEditYear(advisor.year ?? 1);
    setEditSection(advisor.section ?? "");
  }

  async function updateAdvisor() {
    if (!editing) return;

    if (
      !editName.trim() ||
      !editEmail.trim() ||
      !editDepartment ||
      !editYear ||
      !editSection.trim()
    ) {
      alert("Please fill all fields.");
      return;
    }

    const { error } = await supabase
      .from("staff")
      .update({
        name: editName.trim(),
        email: editEmail.trim(),
        department: editDepartment,
        year: editYear,
        section: editSection.trim().toUpperCase(),
      })
      .eq("id", editing.id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    alert("Class Advisor updated successfully.");

    setEditing(null);
    refreshAdvisors();
  }

  async function deleteAdvisor(id: string) {
    const advisor = advisors.find(
      (item) => item.id === id
    );

    const confirmDelete = window.confirm(
      `Delete ${advisor?.name ?? "this Class Advisor"}? This will also remove their login access.`
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
        alert(data.error ?? "Failed to delete class advisor.");
        return;
      }

      alert("Class Advisor and their login deleted successfully.");
      refreshAdvisors();
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
              Class Advisors
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              View and manage all class advisors.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshAdvisors}
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
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search class advisors..."
            className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-11 pr-4 text-black placeholder:text-gray-400 outline-none focus:border-blue-500"
          />

        </div>

        {/* Filter dropdowns */}
        <div className="mb-6 flex flex-col flex-wrap gap-3 md:flex-row md:items-center">

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

        {/* Loading */}
        {loading && (
          <div className="py-10 text-center text-gray-500">
            Loading class advisors...
          </div>
        )}

        {/* Empty */}
        {!loading &&
          filteredAdvisors.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <p className="text-lg font-medium text-gray-600">
                No data found
              </p>
              <p className="mt-1 text-sm text-gray-400">
                {hasActiveFilters
                  ? "No class advisors match the selected filters. Try adjusting or clearing them."
                  : "There are no class advisors to display right now."}
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
        {!loading &&
          filteredAdvisors.length > 0 && (
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
                      Department
                    </th>

                    <th className="p-4 text-left text-sm font-semibold text-gray-700">
                      Year
                    </th>

                    <th className="p-4 text-left text-sm font-semibold text-gray-700">
                      Section
                    </th>

                    <th className="p-4 text-center text-sm font-semibold text-gray-700">
                      Actions
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {filteredAdvisors.map((advisor) => (
                    <tr
                      key={advisor.id}
                      className="border-b border-gray-200 transition hover:bg-gray-50"
                    >

                      <td className="p-4 font-medium text-gray-800">
                        {advisor.name}
                      </td>

                      <td className="p-4 text-gray-600">
                        {advisor.email}
                      </td>

                      <td className="p-4 text-gray-600">
                        {advisor.department}
                      </td>

                      <td className="p-4 text-gray-600">
                        {advisor.year
                          ? `${advisor.year}${advisor.year === 1
                            ? "st"
                            : advisor.year === 2
                            ? "nd"
                            : advisor.year === 3
                            ? "rd"
                            : "th"} Year`
                          : "-"}
                      </td>

                      <td className="p-4 text-gray-600">
                        {advisor.section || "-"}
                      </td>

                      <td className="p-4">

                        <div className="flex justify-center gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              openEdit(advisor)
                            }
                            className="rounded-lg bg-green-100 p-2 text-green-600 transition hover:bg-green-200"
                            title="Edit"
                          >
                            <Pencil size={18} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteAdvisor(advisor.id)
                            }
                            disabled={deletingId === advisor.id}
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
            Total Class Advisors:{" "}
            {filteredAdvisors.length}
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
                  Edit Class Advisor
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Update class advisor details.
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
                  onChange={(e) =>
                    setEditName(e.target.value)
                  }
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
                  onChange={(e) =>
                    setEditEmail(e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Department
                </label>

                <select
                  value={editDepartment}
                  onChange={(e) =>
                    setEditDepartment(e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black outline-none focus:border-blue-500"
                >
                  <option value="CSE">CSE</option>
                  <option value="IT">IT</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Year
                </label>

                <select
                  value={editYear}
                  onChange={(e) =>
                    setEditYear(Number(e.target.value))
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black outline-none focus:border-blue-500"
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
                  value={editSection}
                  onChange={(e) =>
                    setEditSection(
                      e.target.value.toUpperCase()
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-black outline-none focus:border-blue-500"
                />
              </div>

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
                onClick={updateAdvisor}
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