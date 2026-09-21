"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AddHodDeanForm from "@/components/dashboard/AddHodDeanForm";
import HodDeanTable, {
  type HodDeanType,
} from "@/components/dashboard/HodDeanTable";

export default function HodDeanPage() {
  const router = useRouter();
  const supabase = createClient();

  const [staff, setStaff] = useState<HodDeanType[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchStaff() {
    setLoading(true);

    const { data, error } = await supabase
      .from("staff")
      .select("id, name, email, role, department, created_at")
      .in("role", ["HOD", "Dean"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching HOD/Dean:", error);
      alert(error.message);
      setStaff([]);
    } else {
      setStaff(data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchStaff();
  }, []);

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