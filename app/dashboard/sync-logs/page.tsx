"use client";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import SyncLogsTable from "@/components/dashboard/SyncLogsTable";

export default function SyncLogsPage() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  return (
    <DashboardLayout onLogout={handleLogout}>
      <div className="space-y-6">
        {/* SYNC LOGS */}
        <div className="min-w-0">
          <SyncLogsTable />
        </div>
      </div>
    </DashboardLayout>
  );
}