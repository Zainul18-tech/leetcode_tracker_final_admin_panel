
"use client";

import { useEffect, useState } from "react";
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
  const supabase = createClient();

  const [classes, setClasses] = useState<ClassType[]>([]);
  const [selectedClass, setSelectedClass] =
    useState<ClassType | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchClasses() {
    setLoading(true);

    // Check Supabase authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // console.log("AUTH USER:", user);
    // console.log("AUTH ERROR:", authError);

    // Fetch classes
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Error fetching classes:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
    }

    if (!error && data) {
      setClasses(data);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchClasses();

    // If Sidebar navigated here using #classes-section,
    // automatically scroll to the Classes section.
    if (window.location.hash === "#classes-section") {
      setTimeout(() => {
        document
          .getElementById("classes-section")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 150);
    }
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

