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

  // Create the client once (not on every render) so it is safe as an effect dependency
  const [supabase] = useState(() => createClient());

  const [tutors, setTutors] = useState<StaffType[]>([]);
  const [loading, setLoading] = useState(true);

  // Bumping this value triggers a re-fetch from the effect below
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadTutors() {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .eq("role", "Tutor")
        .order("created_at", { ascending: false });

      // Ignore the result if the component unmounted or a newer fetch started
      if (cancelled) return;

      if (error) {
        console.error("Error fetching tutors:", error);
        setTutors([]);
      } else {
        setTutors(data || []);
      }

      setLoading(false);
    }

    loadTutors();

    return () => {
      cancelled = true;
    };
  }, [supabase, refreshKey]);

  // Called from event handlers / child components (not from an effect),
  // so setting state here is fine.
  async function refreshTutors() {
    setLoading(true);
    setRefreshKey((key) => key + 1);
  }

  async function handleLogout() {
    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  return (
    <DashboardLayout onLogout={handleLogout}>
      <div className="space-y-8">
        {/* Add Tutor */}
        <AddStaffForm onSuccess={refreshTutors} />

        {/* Tutors Table */}
        <StaffTable
          staff={tutors}
          loading={loading}
          refreshStaff={refreshTutors}
        />
      </div>
    </DashboardLayout>
  );
}