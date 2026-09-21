"use client";

import { useEffect, useState } from "react";
import { UserCircle2, X } from "lucide-react";
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

// Shape of a row returned by the class_staff query (with the joined staff record)
interface AssignmentRow {
  staff_id: string;
  role: string;
  staff: StaffType | StaffType[] | null;
}

interface Props {
  selectedClass: ClassType | null;
}

export default function ClassDetails({ selectedClass }: Props) {
  // Create the client once (not on every render) so it is safe as an effect dependency
  const [supabase] = useState(() => createClient());

  const [staff, setStaff] = useState<StaffType[]>([]);
  const [assignedStaff, setAssignedStaff] = useState<StaffType[]>([]);
  const [showManage, setShowManage] = useState(false);
  const [loading, setLoading] = useState(false);

  const [selectedTutors, setSelectedTutors] = useState<string[]>([]);
  const [selectedAdvisor, setSelectedAdvisor] = useState<string>("");

  // Bumping this value re-runs the data-loading effect (used after saving)
  const [refreshKey, setRefreshKey] = useState(0);

  const classId = selectedClass?.id;

  useEffect(() => {
    if (!classId) return;

    let cancelled = false;

    async function loadData() {
      const [staffResult, assignmentResult] = await Promise.all([
        supabase.from("staff").select("*").order("name"),
        supabase
          .from("class_staff")
          .select(
            `
            staff_id,
            role,
            staff (
              id,
              name,
              email,
              role,
              department,
              year,
              section
            )
          `
          )
          .eq("class_id", classId),
      ]);

      // Ignore the result if the component unmounted or the class changed
      if (cancelled) return;

      if (!staffResult.error && staffResult.data) {
        setStaff(staffResult.data as StaffType[]);
      }

      if (assignmentResult.error) {
        console.log("Assignment fetch error:", assignmentResult.error);
        return;
      }

      if (assignmentResult.data) {
        const rows = assignmentResult.data as unknown as AssignmentRow[];

        const assigned = rows
          .map((item) =>
            Array.isArray(item.staff) ? item.staff[0] : item.staff
          )
          .filter((member): member is StaffType => Boolean(member));

        setAssignedStaff(assigned);

        setSelectedTutors(
          rows
            .filter((item) => item.role === "Tutor")
            .map((item) => item.staff_id)
        );

        const advisorRow = rows.find(
          (item) => item.role === "Class Advisor"
        );

        setSelectedAdvisor(advisorRow?.staff_id || "");
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [supabase, classId, refreshKey]);

  function toggleTutor(id: string) {
    setSelectedTutors((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      return [...current, id];
    });
  }

  async function saveAssignments() {
    if (!selectedClass) return;

    setLoading(true);

    try {
      // Remove existing assignments for this class
      const { error: deleteError } = await supabase
        .from("class_staff")
        .delete()
        .eq("class_id", selectedClass.id);

      if (deleteError) {
        alert(deleteError.message);
        return;
      }

      const assignments = [
        ...selectedTutors.map((staffId) => ({
          class_id: selectedClass.id,
          staff_id: staffId,
          role: "Tutor",
        })),
        ...(selectedAdvisor
          ? [
              {
                class_id: selectedClass.id,
                staff_id: selectedAdvisor,
                role: "Class Advisor",
              },
            ]
          : []),
      ];

      if (assignments.length > 0) {
        const { error: insertError } = await supabase
          .from("class_staff")
          .insert(assignments);

        if (insertError) {
          alert(insertError.message);
          return;
        }
      }

      alert("Staff assignment saved successfully.");

      setShowManage(false);

      // Re-load assignments via the effect
      setRefreshKey((key) => key + 1);
    } finally {
      setLoading(false);
    }
  }

  const tutors = assignedStaff.filter((member) => member.role === "Tutor");

  const advisor = assignedStaff.find(
    (member) => member.role === "Class Advisor"
  );

  const availableTutors = staff.filter(
    (member) =>
      member.role === "Tutor" &&
      member.department === selectedClass?.department
  );

  const availableAdvisors = staff.filter(
    (member) =>
      member.role === "Class Advisor" &&
      member.department === selectedClass?.department
  );

  if (!selectedClass) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800">
          Class Details
        </h2>

        <p className="mt-4 text-sm text-gray-500">
          Select a class from the table to view its details.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {/* Header */}

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Class Details
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {selectedClass.class_name}
            </p>
          </div>

          <button
            onClick={() => setShowManage(true)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Manage Staff
          </button>
        </div>

        {/* Class Information */}

        <div className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4">
          <div>
            <p className="text-xs uppercase text-gray-500">Class</p>

            <p className="mt-1 font-semibold text-gray-800">
              {selectedClass.class_name}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase text-gray-500">Department</p>

            <p className="mt-1 font-semibold text-gray-800">
              {selectedClass.department}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase text-gray-500">Year</p>

            <p className="mt-1 font-semibold text-gray-800">
              {selectedClass.year}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase text-gray-500">Section</p>

            <p className="mt-1 font-semibold text-gray-800">
              {selectedClass.section}
            </p>
          </div>

          <div className="col-span-2">
            <p className="text-xs uppercase text-gray-500">Batch</p>

            <p className="mt-1 font-semibold text-gray-800">
              {selectedClass.batch}
            </p>
          </div>
        </div>

        {/* Tutors */}

        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">Tutors</h3>

            <span className="text-sm text-gray-500">
              {tutors.length} assigned
            </span>
          </div>

          {tutors.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-5 text-center text-sm text-gray-500">
              No tutors assigned.
            </div>
          ) : (
            <div className="space-y-3">
              {tutors.map((tutor) => (
                <div
                  key={tutor.id}
                  className="flex items-center justify-between rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex items-center gap-3">
                    <UserCircle2 size={42} className="text-gray-500" />

                    <div>
                      <p className="font-medium text-gray-800">
                        {tutor.name}
                      </p>

                      <p className="text-sm text-gray-500">
                        {tutor.email}
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                    Tutor
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Class Advisor */}

        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">Class Advisor</h3>
          </div>

          {!advisor ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-5 text-center text-sm text-gray-500">
              No class advisor assigned.
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <UserCircle2 size={42} className="text-gray-500" />

                <div>
                  <p className="font-medium text-gray-800">
                    {advisor.name}
                  </p>

                  <p className="text-sm text-gray-500">{advisor.email}</p>
                </div>
              </div>

              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                Advisor
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Manage Staff Modal */}

      {showManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            {/* Modal Header */}

            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">
                  Assign Staff
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {selectedClass.class_name}
                </p>
              </div>

              <button
                onClick={() => setShowManage(false)}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <X size={22} />
              </button>
            </div>

            {/* Tutors */}

            <div>
              <h3 className="mb-3 font-semibold text-gray-800">Tutors</h3>

              {availableTutors.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-gray-500">
                  No tutors available for this department.
                </div>
              ) : (
                <div className="space-y-2">
                  {availableTutors.map((tutor) => (
                    <label
                      key={tutor.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTutors.includes(tutor.id)}
                        onChange={() => toggleTutor(tutor.id)}
                        className="h-4 w-4"
                      />

                      <div>
                        <p className="font-medium text-gray-800">
                          {tutor.name}
                        </p>

                        <p className="text-sm text-gray-500">
                          {tutor.email}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Class Advisor */}

            <div className="mt-8">
              <h3 className="mb-3 font-semibold text-gray-800">
                Class Advisor
              </h3>

              {availableAdvisors.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-gray-500">
                  No class advisors available for this department.
                </div>
              ) : (
                <div className="space-y-2">
                  {availableAdvisors.map((item) => (
                    <label
                      key={item.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name="classAdvisor"
                        checked={selectedAdvisor === item.id}
                        onChange={() => setSelectedAdvisor(item.id)}
                        className="h-4 w-4"
                      />

                      <div>
                        <p className="font-medium text-gray-800">
                          {item.name}
                        </p>

                        <p className="text-sm text-gray-500">
                          {item.email}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Buttons */}

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setShowManage(false)}
                className="rounded-lg border border-gray-300 px-5 py-2.5 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={saveAssignments}
                disabled={loading}
                className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? "Saving..." : "Save Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}