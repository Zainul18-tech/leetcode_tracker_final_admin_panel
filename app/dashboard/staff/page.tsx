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

export default function StaffPage() {
  const router = useRouter();
  const supabase = createClient();

  const [staff, setStaff] = useState<StaffType[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchStaff() {
    setLoading(true);

    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setStaff(data);
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