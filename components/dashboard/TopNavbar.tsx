"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronDown,
  Menu,
  UserCircle2,
  Settings,
  LogOut,
} from "lucide-react";

interface TopNavbarProps {
  onMenuClick?: () => void;
  onLogout?: () => void;
}

export default function TopNavbar({
  onMenuClick,
  onLogout,
}: TopNavbarProps) {
  const pathname = usePathname();

  const [showProfile, setShowProfile] =
    useState(false);

  const getPageTitle = () => {
    if (pathname === "/dashboard" || pathname === "/dashboard/admin") {
      return "Dashboard";
    }

    if (pathname.includes("/students")) {
      return "Students";
    }

    if (pathname.includes("/tutors")) {
      return "Tutors";
    }

    if (pathname.includes("/class-advisors")) {
      return "Class Advisors";
    }

    if (pathname.includes("/import-data")) {
      return "Import Data";
    }

    if (pathname.includes("/activity-logs")) {
      return "Activity Logs";
    }

    if (pathname.includes("/settings")) {
      return "Settings";
    }

    if (pathname.includes("/student-assignments")) {
      return "Student Assignments";
    }

    if (pathname.includes("/assign-staff")) {
      return "Assign Staff";
    }

    return "Dashboard";
  };

  const pageTitle = getPageTitle();

  /*
   * Sign-out handled directly here, same as Sidebar,
   * so TopNavbar doesn't depend on a parent-supplied
   * onLogout function to actually work.
   *
   * Uses a hard navigation (window.location.replace)
   * instead of router.replace() — this fully tears down
   * the page's JS state on sign-out, so there's nothing
   * left in memory for the browser's bfcache to restore
   * if the user later presses back.
   *
   * If a parent DOES pass onLogout, it's still called,
   * so this stays compatible with any future wiring.
   */
  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();

    onLogout?.();

    window.location.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full min-w-0 items-center justify-between border-b border-gray-200 bg-white px-3 shadow-sm sm:px-5 md:h-20 md:px-6">

      {/* LEFT SIDE */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">

        {/* Menu Button */}
        <button
          type="button"
          onClick={onMenuClick}
          className="shrink-0 rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
          title="Toggle sidebar"
        >
          <Menu
            size={24}
            className="sm:h-7 sm:w-7"
          />
        </button>

        {/* Dynamic Page Title */}
        <h1 className="truncate text-xl font-bold text-gray-800 sm:text-2xl md:text-3xl lg:text-4xl">
          {pageTitle}
        </h1>

      </div>

      {/* RIGHT SIDE */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-3 md:gap-5">

        {/* ================= ADMIN PROFILE ================= */}
        <div className="relative">

          <button
            type="button"
            onClick={() => setShowProfile((prev) => !prev)}
            className="flex items-center gap-1 rounded-lg p-1.5 transition hover:bg-gray-100 sm:gap-2 sm:p-2"
          >

            <UserCircle2
              size={32}
              className="shrink-0 text-gray-500 sm:h-10 sm:w-10 md:h-11 md:w-11"
            />

            {/* Hide text on very small screens */}
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold text-gray-800 md:text-base">
                Administrator
              </p>
            </div>

            <ChevronDown
              size={16}
              className={`shrink-0 text-gray-500 transition-transform sm:h-[18px] sm:w-[18px] ${
                showProfile
                  ? "rotate-180"
                  : ""
              }`}
            />

          </button>

          {/* Profile Dropdown */}
          {showProfile && (
            <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white py-2 shadow-xl sm:top-14">

              {/* Admin Info */}
              <div className="border-b border-gray-100 px-4 py-3">

                <p className="font-semibold text-gray-800">
                  Administrator
                </p>

                <p className="text-xs text-gray-500">
                  Admin Account
                </p>

              </div>

              {/* Settings */}
              <button
                type="button"
                onClick={() => {
                  window.location.href =
                    "/dashboard/settings";
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Settings size={18} />
                Settings
              </button>

              {/* Logout */}
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 border-t border-gray-100 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={18} />
                Logout
              </button>

            </div>
          )}

        </div>

      </div>

    </header>
  );
}