"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AddClassAdvisorForm from "@/components/dashboard/AddClassAdvisorForm";
import ClassAdvisorsTable, {
  type ClassAdvisorType,
} from "@/components/dashboard/ClassAdvisorsTable";

export default function ClassAdvisorsPage() {
  const router = useRouter();

  // Memoized so the client stays stable between renders
  const supabase = useMemo(() => createClient(), []);

  const [advisors, setAdvisors] = useState<ClassAdvisorType[]>([]);
  const [loading, setLoading] = useState(true);

  // Changing this number re-runs the fetch effect below
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch advisors on first load and whenever refreshKey changes.
  // State is only set inside promise callbacks (never synchronously
  // in the effect body), which is what React expects.
  useEffect(() => {
    let cancelled = false;

    // Promise.resolve() turns Supabase's PromiseLike into a real Promise,
    // so .catch() is available
    Promise.resolve(
      supabase
        .from("staff")
        .select(
          "id, name, email, role, department, year, section, created_at"
        )
        .eq("role", "Class Advisor")
        .order("created_at", {
          ascending: false,
        })
    )
      .then(({ data, error }) => {
        if (cancelled) return;

        if (error) {
          console.error("Error fetching class advisors:", error);
          alert(error.message);
          setAdvisors([]);
        } else {
          setAdvisors(data ?? []);
        }

        setLoading(false);
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        console.error("Unexpected error fetching class advisors:", error);
        setAdvisors([]);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, refreshKey]);

  // Used by AddClassAdvisorForm and ClassAdvisorsTable after user actions.
  // Called from events (not from an effect), so setting state here is fine.
  function fetchAdvisors() {
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

        <AddClassAdvisorForm
          onSuccess={fetchAdvisors}
        />

        <ClassAdvisorsTable
          advisors={advisors}
          loading={loading}
          refreshAdvisors={fetchAdvisors}
        />

      </div>
    </DashboardLayout>
  );
}