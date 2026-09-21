"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

interface DashboardLayoutProps {
  children: ReactNode;
  onLogout: () => void;
}

export default function DashboardLayout({
  children,
  onLogout,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  /*
   * Handle browser back/forward cache (bfcache).
   *
   * When a user logs out and then hits the browser's
   * back button, some browsers restore this page from
   * an in-memory snapshot instead of making a fresh
   * request. That means proxy.ts never runs, and the
   * user sees a stale/empty dashboard.
   *
   * The "pageshow" event fires whenever the page is
   * shown, and event.persisted tells us if it came
   * from bfcache. When that happens, we re-check the
   * session ourselves.
   */
  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (!event.persisted) {
        return;
      }

      const supabase = createClient();

      supabase.auth.getUser().then(({ data }) => {
        if (!data.user) {
          // Session is gone — don't show stale dashboard
          onLogout();
        } else {
          // Still logged in, but the page is a stale
          // snapshot — force Next.js to re-fetch fresh data
          router.refresh();
        }
      });
    }

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [onLogout, router]);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gray-100">

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50
          w-64
          transform
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <Sidebar onLogout={onLogout} />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* Main Area */}
      <div className="min-h-screen lg:pl-64">

        {/* Top Navbar */}
        <TopNavbar
          onMenuClick={() => setSidebarOpen((prev) => !prev)}
          onLogout={onLogout}
        />

        {/* Content */}
        <main className="w-full min-w-0 overflow-x-hidden p-3 sm:p-4 md:p-6">
          <div className="mx-auto w-full max-w-[1600px]">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}