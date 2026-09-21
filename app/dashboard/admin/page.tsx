"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AddClassForm from "@/components/dashboard/AddClassForm";
import ClassesTable from "@/components/dashboard/ClassesTable";
import ClassDetails from "@/components/dashboard/ClassDetails";
import StudentsTable from "@/components/dashboard/StudentsTable";

export interface ClassType {
  id: string;
  class_name: string;
  department: string;
  year: number;
  section: string;
  batch: string;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();

  // Memoized so the client stays stable between renders
  const supabase = useMemo(() => createClient(), []);

  const [classes, setClasses] = useState<ClassType[]>([]);
  const [selectedClass, setSelectedClass] =
    useState<ClassType | null>(null);
  const [loading, setLoading] = useState(true);

  // Changing this number re-runs the fetch effect below
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch classes on first load and whenever refreshKey changes.
  // State is only set inside promise callbacks (never synchronously
  // in the effect body), which is what React expects.
  useEffect(() => {
    let cancelled = false;

    supabase.auth
      .getUser()
      .then(() =>
        supabase
          .from("classes")
          .select("*")
          .order("created_at", { ascending: false })
      )
      .then(({ data, error }) => {
        if (cancelled) return;

        if (error) {
          console.error("Error fetching classes:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
        } else if (data) {
          setClasses(data);
        }

        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;

        console.error("Unexpected error fetching classes:", err);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, refreshKey]);

  // Used by AddClassForm and ClassesTable after user actions.
  // Called from events (not from an effect), so setting state here is fine.
  function fetchClasses() {
    setLoading(true);
    setRefreshKey((key) => key + 1);
  }

  // If Sidebar navigated here using #classes-section,
  // automatically scroll to the Classes section.
  useEffect(() => {
    if (window.location.hash !== "#classes-section") return;

    const timer = setTimeout(() => {
      document
        .getElementById("classes-section")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  function handleSelectClass(classItem: ClassType) {
    setSelectedClass(classItem);
  }

  return (
    <DashboardLayout onLogout={handleLogout}>
      <div className="space-y-6">

        {/* ADD CLASS */}
        <AddClassForm onSuccess={fetchClasses} />

        {/* UPLOAD STUDENTS */}
        {/* <UploadStudents /> */}

        {/* CLASSES AND CLASS DETAILS */}
        <div
          id="classes-section"
          className="scroll-mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3"
        >

          {/* ALL CLASSES */}
          <div className="min-w-0 xl:col-span-2">
            <ClassesTable
              classes={classes}
              loading={loading}
              refreshClasses={fetchClasses}
              onSelectClass={handleSelectClass}
            />
          </div>

          {/* CLASS DETAILS */}
          <div className="min-w-0">
            <ClassDetails
              selectedClass={selectedClass}
            />
          </div>

        </div>

        {/* STUDENTS */}
        <div className="min-w-0">
          <StudentsTable
            selectedClass={selectedClass}
          />
        </div>

      </div>
    </DashboardLayout>
  );
}