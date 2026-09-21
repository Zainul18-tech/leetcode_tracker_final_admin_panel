"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Activity,
  Search,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Users,
  GraduationCap,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  user_email: string | null;
  created_at: string;
}

export default function ActivityLogsPage() {
  // Memoized so the client (and loadLogs) stays stable between renders
  const supabase = useMemo(() => createClient(), []);

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true); // true initially, so no need to set it in the effect
  const [search, setSearch] = useState("");

  // Only fetches and updates state AFTER the await (async), safe to call from an effect
  const loadLogs = useCallback(async () => {
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
    }

    if (data) {
      setLogs(data);
    }

    setLoading(false);
  }, [supabase]);


  // Called from a click event, so setting state here is fine
  async function handleRefresh() {
    setLoading(true);
    await loadLogs();
  }

  async function handleLogout() {
    await supabase.auth.signOut();

    window.location.href = "/login";
  }

  const filteredLogs = useMemo(() => {
    const value = search.toLowerCase();

    return logs.filter((log) => {
      return (
        log.action.toLowerCase().includes(value) ||
        log.description.toLowerCase().includes(value) ||
        (log.user_email ?? "")
          .toLowerCase()
          .includes(value)
      );
    });
  }, [logs, search]);

  function getIcon(action: string) {
    const value = action.toLowerCase();

    if (value.includes("add")) {
      return <Plus size={18} />;
    }

    if (value.includes("update") || value.includes("edit")) {
      return <Pencil size={18} />;
    }

    if (value.includes("delete")) {
      return <Trash2 size={18} />;
    }

    if (value.includes("import")) {
      return <Upload size={18} />;
    }

    if (value.includes("student")) {
      return <Users size={18} />;
    }

    if (value.includes("class")) {
      return <GraduationCap size={18} />;
    }

    return <Activity size={18} />;
  }

  function getIconStyle(action: string) {
    const value = action.toLowerCase();

    if (value.includes("delete")) {
      return "bg-red-100 text-red-600";
    }

    if (
      value.includes("update") ||
      value.includes("edit")
    ) {
      return "bg-yellow-100 text-yellow-600";
    }

    if (value.includes("import")) {
      return "bg-purple-100 text-purple-600";
    }

    return "bg-blue-100 text-blue-600";
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  return (
    <DashboardLayout onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-100 p-3">
                <Activity
                  size={26}
                  className="text-blue-600"
                />
              </div>

              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Activity Logs
                </h1>

                <p className="mt-1 text-gray-500">
                  Track important activities performed in the admin dashboard.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
          >
            <RefreshCw
              size={18}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Search */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="relative">
            <Search
              size={19}
              className="absolute left-4 top-3.5 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search activity logs..."
              className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-11 pr-4 text-gray-900 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Logs */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-gray-800">
              Recent Activities
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {filteredLogs.length} activities found
            </p>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-500">
              Loading activity logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center">
              <Activity
                size={40}
                className="mx-auto mb-3 text-gray-300"
              />

              <p className="font-medium text-gray-600">
                No activity logs found
              </p>

              <p className="mt-1 text-sm text-gray-400">
                Activities will appear here as actions are performed.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-4 px-6 py-5 transition hover:bg-gray-50"
                >
                  {/* Icon */}
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${getIconStyle(
                      log.action
                    )}`}
                  >
                    {getIcon(log.action)}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-800">
                        {log.action}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-gray-600">
                      {log.description}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-400">
                      {log.user_email && (
                        <span>By: {log.user_email}</span>
                      )}

                      <span>{formatDate(log.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}