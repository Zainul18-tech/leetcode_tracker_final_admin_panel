"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import StatCard from "./StatCard";

export default function DashboardStats() {
  const supabase = createClient();

  const [stats, setStats] = useState({
    students: 0,
    classes: 0,
    tutors: 0,
    advisors: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  async function fetchDashboardStats() {
    setLoading(true);

    const [
      classesResult,
      studentsResult,
      staffResult,
    ] = await Promise.all([
      supabase.from("classes").select("*", { count: "exact", head: true }),
      supabase.from("students").select("*", { count: "exact", head: true }),
      supabase.from("staff").select("*", { count: "exact", head: true }),
    ]);

    const classCount = classesResult.count ?? 0;
    const studentCount = studentsResult.count ?? 0;
    const staffCount = staffResult.count ?? 0;

    setStats({
      students: studentCount,
      classes: classCount,
      tutors: staffCount,
      advisors: staffCount,
    });

    setLoading(false);
  }

  return (
    <section>
      <h2 className="mb-6 text-2xl font-bold text-gray-800">
        Dashboard Overview
      </h2>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Total Students"
          value={loading ? "..." : stats.students.toString()}
          color="bg-blue-500"
        />

        <StatCard
          title="Total Classes"
          value={loading ? "..." : stats.classes.toString()}
          color="bg-green-500"
        />

        <StatCard
          title="Total Tutors"
          value={loading ? "..." : stats.tutors.toString()}
          color="bg-purple-500"
        />

        <StatCard
          title="Class Advisors"
          value={loading ? "..." : stats.advisors.toString()}
          color="bg-orange-500"
        />

      </div>
    </section>
  );
}