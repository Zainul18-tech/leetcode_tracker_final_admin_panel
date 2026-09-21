"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AddClassAdvisorForm from "@/components/dashboard/AddClassAdvisorForm";
import ClassAdvisorsTable, {
  type ClassAdvisorType,
} from "@/components/dashboard/ClassAdvisorsTable";

export default function ClassAdvisorsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [advisors, setAdvisors] = useState<ClassAdvisorType[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchAdvisors() {
    setLoading(true);

    const { data, error } = await supabase
      .from("staff")
      .select(
        "id, name, email, role, department, year, section, created_at"
      )
      .eq("role", "Class Advisor")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Error fetching class advisors:", error);
      alert(error.message);
      setAdvisors([]);
    } else {
      setAdvisors(data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchAdvisors();
  }, []);

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