"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AddStudentForm from "@/components/dashboard/AddStudentForm";
import StudentsTable from "@/components/dashboard/StudentsTable";
import type { ClassType } from "@/app/dashboard/admin/page";

// Result of the "students in this class" count query, tagged with the
// class and refreshKey it was fetched for so stale results are ignored.
interface CountResult {
  classId: string;
  key: number;
  count: number | null; // null = the query failed
}

export default function StudentsPage() {
  const router = useRouter();

  // Memoized so the client stays stable between renders
  const supabase = useMemo(() => createClient(), []);

  const [refreshKey, setRefreshKey] = useState(0);

  const [classes, setClasses] = useState<ClassType[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);

  const [selectedClassId, setSelectedClassId] = useState("");
  const [countResult, setCountResult] =
    useState<CountResult | null>(null);
  const [deleting, setDeleting] = useState(false);

  function refreshStudents() {
    setRefreshKey((prev) => prev + 1);
  }

  // Fetch classes once on load.
  // State is only set inside promise callbacks (never synchronously
  // in the effect body), which is what React expects.
  useEffect(() => {
    let cancelled = false;

    // Promise.resolve() turns Supabase's PromiseLike into a real Promise,
    // so .catch() is available
    Promise.resolve(
      supabase
        .from("classes")
        .select("*")
        .order("created_at", { ascending: false })
    )
      .then(({ data, error }) => {
        if (cancelled) return;

        if (error) {
          console.error(error);
          alert(error.message);
        }

        setClasses(data ?? []);
        setClassesLoading(false);
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        console.error("Unexpected error fetching classes:", error);
        setClasses([]);
        setClassesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // Count the students in the selected class whenever the class or
  // refreshKey changes. The result is stored with the class/key it belongs to.
  useEffect(() => {
    if (!selectedClassId) return;

    let cancelled = false;

    Promise.resolve(
      supabase
        .from("students")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("class_id", selectedClassId)
    )
      .then(({ count, error }) => {
        if (cancelled) return;

        if (error) {
          console.error(error);
          alert(error.message);

          setCountResult({
            classId: selectedClassId,
            key: refreshKey,
            count: null,
          });
          return;
        }

        setCountResult({
          classId: selectedClassId,
          key: refreshKey,
          count: count ?? 0,
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        console.error("Unexpected error counting students:", error);

        setCountResult({
          classId: selectedClassId,
          key: refreshKey,
          count: null,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, selectedClassId, refreshKey]);

  // Derived values (calculated during render, not stored in state)
  const countReady =
    countResult !== null &&
    countResult.classId === selectedClassId &&
    countResult.key === refreshKey;

  const classStudentCount = countReady ? countResult.count : null;
  const countLoading = Boolean(selectedClassId) && !countReady;

  const selectedClassData =
    classes.find((item) => item.id === selectedClassId) ?? null;

  async function deleteClassStudents() {
    if (!selectedClassId) {
      alert("Please select a class first.");
      return;
    }

    if (!classStudentCount) {
      alert("There are no students in this class.");
      return;
    }

    const confirmDelete = window.confirm(
      `This will PERMANENTLY delete all ${classStudentCount} student(s) in "${selectedClassData?.class_name ?? "this class"}". This action cannot be undone. Are you sure?`
    );

    if (!confirmDelete) {
      return;
    }

    const confirmAgain = window.confirm(
      "Please confirm again: delete these students permanently?"
    );

    if (!confirmAgain) {
      return;
    }

    setDeleting(true);

    const { error } = await supabase
      .from("students")
      .delete()
      .eq("class_id", selectedClassId);

    setDeleting(false);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setSelectedClassId("");
    refreshStudents();
  }

  async function handleLogout() {
    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  return (
    <DashboardLayout onLogout={handleLogout}>
      <div className="space-y-6">

        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Students
          </h1>

          <p className="mt-2 text-gray-500">
            Add, view and manage student details.
          </p>
        </div>

        <AddStudentForm onSuccess={refreshStudents} />

        {/* Delete Students by Class */}

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">

          <h2 className="text-xl font-semibold text-gray-800">
            Delete Students by Class
          </h2>

          <p className="mt-1 text-sm text-gray-600">
            Permanently delete every student belonging to
            a selected class. This cannot be undone.
          </p>

          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center">

            <select
              value={selectedClassId}
              onChange={(e) =>
                setSelectedClassId(e.target.value)
              }
              disabled={classesLoading}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-red-500 md:w-1/2"
            >
              <option value="">
                {classesLoading
                  ? "Loading classes..."
                  : "Select a class"}
              </option>

              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.class_name} - {item.department} -
                  Year {item.year} - Section{" "}
                  {item.section}
                </option>
              ))}
            </select>

            <button
              onClick={deleteClassStudents}
              disabled={
                !selectedClassId ||
                deleting ||
                countLoading ||
                !classStudentCount
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              <Trash2 size={18} />
              {deleting
                ? "Deleting..."
                : "Delete Class Students"}
            </button>

          </div>

          {selectedClassId && (
            <p className="mt-3 text-sm text-gray-600">
              {countLoading
                ? "Checking students in this class..."
                : classStudentCount === null
                ? "Could not check the students in this class."
                : classStudentCount === 0
                ? "This class has no students to delete."
                : `${classStudentCount} student(s) will be permanently deleted.`}
            </p>
          )}

        </div>

        <StudentsTable
          key={refreshKey}
          selectedClass={selectedClassData}
        />

      </div>
    </DashboardLayout>
  );
}