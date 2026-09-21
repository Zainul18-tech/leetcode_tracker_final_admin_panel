"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AddStaffForm from "@/components/dashboard/AddStaffForm";
import StaffTable from "@/components/dashboard/StaffTable";

export interface StaffType {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  year: number;
  section: string;
  created_at: string;
}

export default function TutorsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [tutors, setTutors] = useState<StaffType[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchTutors() {
    setLoading(true);

    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .eq("role", "Tutor")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Error fetching tutors:", error);
      setTutors([]);
    } else {
      setTutors(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchTutors();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  return (
    <DashboardLayout onLogout={handleLogout}>

      <div className="space-y-8">

        {/* Add Tutor */}
        <AddStaffForm
          onSuccess={fetchTutors}
        />

        {/* Tutors Table */}
        <StaffTable
          staff={tutors}
          loading={loading}
          refreshStaff={fetchTutors}
        />

      </div>

    </DashboardLayout>
  );
}