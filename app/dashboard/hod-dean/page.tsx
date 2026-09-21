"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AddHodDeanForm from "@/components/dashboard/AddHodDeanForm";
import HodDeanTable, {
  type HodDeanType,
} from "@/components/dashboard/HodDeanTable";

export default function HodDeanPage() {
  const router = useRouter();

  // Memoized so the client stays stable between renders
  const supabase = useMemo(() => createClient(), []);

  const [staff, setStaff] = useState<HodDeanType[]>([]);
  const [loading, setLoading] = useState(true);

  // Changing this number re-runs the fetch effect below
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch HOD/Dean staff on first load and whenever refreshKey changes.
  // State is only set inside promise callbacks (never synchronously
  // in the effect body), which is what React expects.
  useEffect(() => {
    let cancelled = false;

    // Promise.resolve() turns Supabase's PromiseLike into a real Promise,
    // so .catch() is available
    Promise.resolve(
      supabase
        .from("staff")
        .select("id, name, email, role, department, created_at")
        .in("role", ["HOD", "Dean"])
        .order("created_at", { ascending: false })
    )
      .then(({ data, error }) => {
        if (cancelled) return;

        if (error) {
          console.error("Error fetching HOD/Dean:", error);
          alert(error.message);
          setStaff([]);
        } else {
          setStaff(data ?? []);
        }

        setLoading(false);
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        console.error("Unexpected error fetching HOD/Dean:", error);
        setStaff([]);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, refreshKey]);

  // Used by AddHodDeanForm and HodDeanTable after user actions.
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

        <AddHodDeanForm onSuccess={fetchStaff} />

        <HodDeanTable
          staff={staff}
          loading={loading}
          refreshStaff={fetchStaff}
        />

      </div>
    </DashboardLayout>
  );
}