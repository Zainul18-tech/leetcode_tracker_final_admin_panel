"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ImportData from "@/components/dashboard/ImportData";

interface ClassType {
  id: string;
  class_name: string;
  department: string;
  year: number;
  section: string;
  batch: string;
}

export default function ImportDataPage() {
  const supabase = createClient();

  const [classes, setClasses] = useState<ClassType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  async function fetchClasses() {
    setLoading(true);

    const { data, error } = await supabase
      .from("classes")
      .select(
        "id, class_name, department, year, section, batch"
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
    }

    if (data) {
      setClasses(data);
    }

    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();

    window.location.href = "/login";
  }

  return (
    <DashboardLayout onLogout={handleLogout}>

      <div className="space-y-6">

        <div>

          <h1 className="text-3xl font-bold text-gray-800">
            Import Data
          </h1>

          <p className="mt-1 text-gray-500">
            Import student information from an Excel file.
          </p>

        </div>

        {loading ? (

          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm">
            Loading classes...
          </div>

        ) : (

          <ImportData classes={classes} />

        )}

      </div>

    </DashboardLayout>
  );
}