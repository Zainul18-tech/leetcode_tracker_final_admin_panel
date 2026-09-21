"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

interface StaffType {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  year: number;
  section: string;
}

interface AssignmentType {
  id: string;
  class_id: string;
  staff_id: string;
  role: string;
}

export default function AssignStaffPage() {
  const router = useRouter();
  const supabase = createClient();

  const [classes, setClasses] = useState<ClassType[]>([]);
  const [staff, setStaff] = useState<StaffType[]>([]);
  const [assignments, setAssignments] = useState<
    AssignmentType[]
  >([]);

  const [selectedClass, setSelectedClass] =
    useState("");

  const [selectedTutor, setSelectedTutor] =
    useState("");

  const [selectedAdvisor, setSelectedAdvisor] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function fetchData() {
    setLoading(true);

    const [
      classesResult,
      staffResult,
      assignmentsResult,
    ] = await Promise.all([
      supabase
        .from("classes")
        .select("*")
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("staff")
        .select("*")
        .in("role", ["Tutor", "Class Advisor"])
        .order("name"),

      supabase
        .from("class_staff")
        .select("*"),
    ]);

    if (classesResult.error) {
      console.error(classesResult.error);
      alert(classesResult.error.message);
    }

    if (staffResult.error) {
      console.error(staffResult.error);
      alert(staffResult.error.message);
    }

    if (assignmentsResult.error) {
      console.error(assignmentsResult.error);
      alert(assignmentsResult.error.message);
    }

    setClasses(classesResult.data ?? []);
    setStaff(staffResult.data ?? []);
    setAssignments(assignmentsResult.data ?? []);

    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedClass) {
      setSelectedTutor("");
      setSelectedAdvisor("");
      return;
    }

    const currentTutor = assignments.find(
      (item) =>
        item.class_id === selectedClass &&
        item.role === "Tutor"
    );

    const currentAdvisor = assignments.find(
      (item) =>
        item.class_id === selectedClass &&
        item.role === "Class Advisor"
    );

    setSelectedTutor(currentTutor?.staff_id ?? "");
    setSelectedAdvisor(currentAdvisor?.staff_id ?? "");
  }, [selectedClass, assignments]);

  async function assignStaff() {
    if (!selectedClass) {
      alert("Please select a class.");
      return;
    }

    if (!selectedTutor && !selectedAdvisor) {
      alert("Please select a Tutor or Class Advisor.");
      return;
    }

    setSaving(true);

    try {
      const existingAssignments = assignments.filter(
        (item) => item.class_id === selectedClass
      );

      const tutorAssignment = existingAssignments.find(
        (item) => item.role === "Tutor"
      );

      const advisorAssignment = existingAssignments.find(
        (item) => item.role === "Class Advisor"
      );

      // --------------------------------
      // TUTOR
      // --------------------------------

      if (selectedTutor) {
        if (tutorAssignment) {
          const { error } = await supabase
            .from("class_staff")
            .update({
              staff_id: selectedTutor,
              role: "Tutor",
            })
            .eq("id", tutorAssignment.id);

          if (error) {
            throw error;
          }
        } else {
          const { error } = await supabase
            .from("class_staff")
            .insert({
              class_id: selectedClass,
              staff_id: selectedTutor,
              role: "Tutor",
            });

          if (error) {
            throw error;
          }
        }
      } else if (tutorAssignment) {
        const { error } = await supabase
          .from("class_staff")
          .delete()
          .eq("id", tutorAssignment.id);

        if (error) {
          throw error;
        }
      }

      // --------------------------------
      // CLASS ADVISOR
      // --------------------------------

      if (selectedAdvisor) {
        if (advisorAssignment) {
          const { error } = await supabase
            .from("class_staff")
            .update({
              staff_id: selectedAdvisor,
              role: "Class Advisor",
            })
            .eq("id", advisorAssignment.id);

          if (error) {
            throw error;
          }
        } else {
          const { error } = await supabase
            .from("class_staff")
            .insert({
              class_id: selectedClass,
              staff_id: selectedAdvisor,
              role: "Class Advisor",
            });

          if (error) {
            throw error;
          }
        }
      } else if (advisorAssignment) {
        const { error } = await supabase
          .from("class_staff")
          .delete()
          .eq("id", advisorAssignment.id);

        if (error) {
          throw error;
        }
      }

      alert("Staff assignment updated successfully.");

      await fetchData();
    } catch (error: any) {
      console.error(error);
      alert(
        error?.message ||
          "Something went wrong while assigning staff."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  const selectedClassData = classes.find(
    (item) => item.id === selectedClass
  );

  const tutors = staff.filter(
    (item) => item.role === "Tutor"
  );

  const advisors = staff.filter(
    (item) => item.role === "Class Advisor"
  );

  if (loading) {
    return (
      <DashboardLayout onLogout={handleLogout}>
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-gray-500">
            Loading assignment data...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout onLogout={handleLogout}>
      <div className="space-y-8">

        {/* Header */}

        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Assign Staff
          </h1>

          <p className="mt-2 text-gray-500">
            Assign a Tutor and Class Advisor to a class.
          </p>
        </div>

        {/* Assignment Card */}

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800">
              Class Staff Assignment
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Select a class and assign the responsible staff
              members.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

            {/* Class */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Select Class
              </label>

              <select
                value={selectedClass}
                onChange={(e) =>
                  setSelectedClass(e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-blue-500"
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
            </div>

            {/* Tutor */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Tutor
              </label>

              <select
                value={selectedTutor}
                onChange={(e) =>
                  setSelectedTutor(e.target.value)
                }
                disabled={!selectedClass}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">
                  Select Tutor
                </option>

                {tutors.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name} - {item.department}
                  </option>
                ))}
              </select>
            </div>

            {/* Class Advisor */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Class Advisor
              </label>

              <select
                value={selectedAdvisor}
                onChange={(e) =>
                  setSelectedAdvisor(e.target.value)
                }
                disabled={!selectedClass}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">
                  Select Class Advisor
                </option>

                {advisors.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name} - {item.department}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Selected Class */}

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

          {/* Save */}

          <div className="mt-8 flex justify-end">

            <button
              type="button"
              onClick={assignStaff}
              disabled={saving || !selectedClass}
              className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {saving
                ? "Saving..."
                : "Save Assignment"}
            </button>

          </div>

        </div>

        {/* Current Assignments */}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Current Assignments
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Staff currently assigned to each class.
            </p>
          </div>

          {classes.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No classes available.
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full">

                <thead>
                  <tr className="bg-gray-100">

                    <th className="p-4 text-left">
                      Class
                    </th>

                    <th className="p-4 text-left">
                      Department
                    </th>

                    <th className="p-4 text-left">
                      Year
                    </th>

                    <th className="p-4 text-left">
                      Section
                    </th>

                    <th className="p-4 text-left">
                      Tutor
                    </th>

                    <th className="p-4 text-left">
                      Class Advisor
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {classes.map((classItem) => {

                    const tutorAssignment =
                      assignments.find(
                        (item) =>
                          item.class_id ===
                            classItem.id &&
                          item.role === "Tutor"
                      );

                    const advisorAssignment =
                      assignments.find(
                        (item) =>
                          item.class_id ===
                            classItem.id &&
                          item.role ===
                            "Class Advisor"
                      );

                    const tutor = staff.find(
                      (item) =>
                        item.id ===
                        tutorAssignment?.staff_id
                    );

                    const advisor = staff.find(
                      (item) =>
                        item.id ===
                        advisorAssignment?.staff_id
                    );

                    return (
                      <tr
                        key={classItem.id}
                        className="border-b hover:bg-gray-50"
                      >

                        <td className="p-4 font-medium text-gray-800">
                          {classItem.class_name}
                        </td>

                        <td className="p-4 text-gray-600">
                          {classItem.department}
                        </td>

                        <td className="p-4 text-gray-600">
                          {classItem.year}
                        </td>

                        <td className="p-4 text-gray-600">
                          {classItem.section}
                        </td>

                        <td className="p-4">
                          {tutor ? (
                            <div>
                              <p className="font-medium text-gray-800">
                                {tutor.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {tutor.email}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-400">
                              Not assigned
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          {advisor ? (
                            <div>
                              <p className="font-medium text-gray-800">
                                {advisor.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {advisor.email}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-400">
                              Not assigned
                            </span>
                          )}
                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>
    </DashboardLayout>
  );
}