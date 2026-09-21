"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  UserCheck,
  Upload,
  ClipboardList,
  Settings,
  LogOut,
  RefreshCw,
  
} from "lucide-react";

interface SidebarProps {
  onLogout?: () => void;
}

export default function Sidebar({
  onLogout,
}: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      name: "Dashboard",
      href: "/dashboard/admin",
      icon: LayoutDashboard,
    },
    {
      name: "Students",
      href: "/dashboard/students",
      icon: Users,
    },
        {
      name: "HOD / Dean",
      href: "/dashboard/hod-dean",
      icon: GraduationCap,
    },
    {
      name: "Tutors",
      href: "/dashboard/tutors",
      icon: BookOpen,
    },
    {
      name: "Class Advisors",
      href: "/dashboard/class-advisors",
      icon: UserCheck,
    },
    {
      name: "Import Data",
      href: "/dashboard/import-data",
      icon: Upload,
    },
    {
      name: "Activity Logs",
      href: "/dashboard/activity-logs",
      icon: ClipboardList,
    },
    {
      name: "Sync Logs",
      href: "/dashboard/sync-logs",
      icon: RefreshCw,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  function isActive(href: string) {
    if (href === "/dashboard/admin") {
      return pathname === "/dashboard/admin";
    }

    return (
      pathname === href ||
      pathname.startsWith(href + "/")
    );
  }

  /*
   * Sign-out handled directly here so Sidebar doesn't
   * depend on a parent-supplied onLogout function.
   *
   * Uses a hard navigation (window.location.replace)
   * instead of router.replace() — this fully tears down
   * the page's JS state on sign-out, so there's nothing
   * left in memory for the browser's bfcache to restore
   * if the user later presses back.
   *
   * If a parent DOES pass onLogout, it's called too,
   * so this stays compatible with any future wiring.
   */
  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();

    onLogout?.();

    window.location.replace("/login");
  }

  return (
    <aside className="flex h-screen w-64 flex-col overflow-hidden bg-slate-900 text-white">

      {/* Logo */}
      <div className="shrink-0 border-b border-slate-700 px-5 py-5">
        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600">
            <GraduationCap size={25} />
          </div>

          <div className="min-w-0">
            <h1 className="text-lg font-bold">
              LeetTracker
            </h1>

            <p className="text-xs text-slate-400">
              Admin Dashboard
            </p>
          </div>

        </div>
      </div>

      

      {/* Navigation */}
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">

        <div className="space-y-1">

          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3
                  rounded-xl
                  px-3 py-3
                  text-sm
                  transition
                  ${
                    active
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }
                `}
              >
                <Icon size={20} className="shrink-0" />

                <span className="truncate">
                  {item.name}
                </span>
              </Link>
            );
          })}

        </div>

      </nav>

      {/* Logout */}
      <div className="shrink-0 border-t border-slate-700 p-3">

        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-3 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          <LogOut size={19} />
          <span>Logout</span>
        </button>

      </div>

    </aside>
  );
}