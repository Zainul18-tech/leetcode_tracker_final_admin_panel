"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function StaffPage() {
  const router = useRouter();

  // Memoized so the client stays stable between renders
  const supabase = useMemo(() => createClient(), []);

  const [staff, setStaff] = useState<StaffType[]>([]);
  const [loading, setLoading] = useState(true);

  // Changing this number re-runs the fetch effect below
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch staff on first load and whenever refreshKey changes.
  // State is only set inside promise callbacks (never synchronously
  // in the effect body), which is what React expects.
  useEffect(() => {
    let cancelled = false;

    // Promise.resolve() turns Supabase's PromiseLike into a real Promise,
    // so .catch() is available
    Promise.resolve(
      supabase
        .from("staff")
        .select("*")
        .order("created_at", { ascending: false })
    )
      .then(({ data, error }) => {
        if (cancelled) return;

        if (!error && data) {
          setStaff(data);
        }

        setLoading(false);
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        console.error("Unexpected error fetching staff:", error);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, refreshKey]);

  // Used by AddStaffForm and StaffTable after user actions.
  // Called from events (not from an effect), so setting state here is fine.
  function fetchStaff() {
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

        <AddStaffForm onSuccess={fetchStaff} />

        <StaffTable
          staff={staff}
          loading={loading}
          refreshStaff={fetchStaff}
        />

      </div>
    </DashboardLayout>
  );
}