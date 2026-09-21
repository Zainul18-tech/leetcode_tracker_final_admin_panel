"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  CalendarDays,
} from "lucide-react";

type SyncLog = {
  id: string;
  synced_by: string | null;
  sync_type: "Automatic" | "Manual";
  department: string | null;
  year: number | null;
  section: string | null;
  total_students: number | null;
  started_at: string;
  completed_at: string | null;
  status: "Success" | "Failed" | null;
  created_at: string | null;
  reg_from: number | null;
  reg_to: number | null;
};

type FilterOption = {
  label: string;
  value: string;
};

/** Local YYYY-MM-DD key for a Date, used to group/compare logs by day. */
function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse a local YYYY-MM-DD key back into a Date at local midnight.
 * (new Date("YYYY-MM-DD") would be parsed as UTC and can land on the
 * previous day in timezones behind UTC, so we build it manually.)
 */
function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDayLabel(key: string) {
  return parseDateKey(key).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Click-to-open dropdown filter box.
 * Shows a button with the current label; clicking it opens a panel
 * of selectable options. Selecting an option applies the filter and
 * closes the panel.
 */
function FilterDropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);
  const isActive = value !== "ALL";

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm font-medium outline-none md:w-auto ${
          isActive
            ? "border-blue-500 bg-blue-50 text-blue-700"
            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        }`}
      >
        <span className="whitespace-nowrap">
          {isActive ? selectedOption?.label ?? label : label}
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-2 max-h-64 w-52 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {options.map((option) => {
            const selected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                  selected ? "font-semibold text-blue-700" : "text-gray-700"
                }`}
              >
                {option.label}
                {selected && <Check size={15} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Click-to-open calendar day picker.
 * Shows a button; clicking it opens a month grid. Days that have
 * sync records get a small dot. Clicking a day filters the table to
 * that day; clicking the already-selected day clears the filter.
 */
function CalendarFilter({
  selectedDate,
  onSelectDate,
  logCountsByDate,
}: {
  selectedDate: string | null;
  onSelectDate: (key: string | null) => void;
  logCountsByDate: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const base = selectedDate ? parseDateKey(selectedDate) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const today = new Date();
  const todayKey = dateKey(today);

  const gridDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();

    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: { date: Date; inMonth: boolean }[] = [];

    // Leading days from previous month
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month, -i), inMonth: false });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ date: new Date(year, month, d), inMonth: true });
    }

    // Trailing days to fill last week
    while (days.length % 7 !== 0) {
      const last = days[days.length - 1].date;
      days.push({
        date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
        inMonth: false,
      });
    }

    return days;
  }, [viewMonth]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm font-medium outline-none md:w-auto ${
          selectedDate
            ? "border-blue-500 bg-blue-50 text-blue-700"
            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        }`}
      >
        <CalendarDays size={16} />
        <span className="whitespace-nowrap">
          {selectedDate ? formatDayLabel(selectedDate) : "Filter by Date"}
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-2 w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                setViewMonth(
                  new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1)
                )
              }
              className="rounded-md p-1 hover:bg-gray-100"
            >
              <ChevronLeft size={18} />
            </button>

            <span className="text-sm font-semibold text-gray-800">
              {viewMonth.toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </span>

            <button
              type="button"
              onClick={() =>
                setViewMonth(
                  new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1)
                )
              }
              className="rounded-md p-1 hover:bg-gray-100"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={`${d}-${i}`} className="py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {gridDays.map(({ date, inMonth }) => {
              const key = dateKey(date);
              const count = logCountsByDate[key] ?? 0;
              const isSelected = selectedDate === key;
              const isToday = key === todayKey;

              return (
                <button
                  key={key}
                  type="button"
                  disabled={!inMonth}
                  onClick={() => {
                    onSelectDate(isSelected ? null : key);
                    setOpen(false);
                  }}
                  className={`relative flex h-9 flex-col items-center justify-center rounded-md text-sm ${
                    !inMonth
                      ? "text-gray-300"
                      : isSelected
                      ? "bg-blue-600 text-white font-semibold"
                      : isToday
                      ? "border border-blue-400 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {date.getDate()}
                  {inMonth && count > 0 && (
                    <span
                      className={`absolute bottom-1 h-1 w-1 rounded-full ${
                        isSelected ? "bg-white" : "bg-blue-500"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {selectedDate && (
            <button
              type="button"
              onClick={() => {
                onSelectDate(null);
                setOpen(false);
              }}
              className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
            >
              <X size={14} />
              Clear Date
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function SyncLogsTable() {
  const supabase = createClient();

  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Filter state ---
  const [filterDepartment, setFilterDepartment] = useState("ALL");
  const [filterYear, setFilterYear] = useState("ALL");
  const [filterSection, setFilterSection] = useState("ALL");
  const [filterSyncType, setFilterSyncType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Wrapped in useCallback so it has a stable identity across renders.
  // supabase is created fresh each render (createClient()), so it is
  // intentionally left out of the dependency array below to avoid
  // re-creating this callback (and re-running the effect) every render;
  // the client's query behavior doesn't change between calls.
  //
  // `ignoreRef` lets the effect below tell a stale/overlapping call
  // (e.g. one left running after unmount, or superseded by a newer
  // fetch) not to write to state once it resolves.
  const fetchLogs = useCallback(async (ignoreRef?: { current: boolean }) => {
    // Yield to a microtask before touching state. Calling setState as
    // the very first synchronous thing an Effect does (which is what
    // happens when an async function's pre-await code runs) can trigger
    // cascading renders; awaiting here moves every state update after
    // this point out of the Effect's synchronous call stack.
    await Promise.resolve();
    if (ignoreRef?.current) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("sync_logs")
      .select("*")
      .order("started_at", { ascending: false });

    if (ignoreRef?.current) return;

    if (error) {
      console.error("Error fetching sync_logs:", error);
    }

    if (!error && data) {
      setLogs(data as SyncLog[]);
    }

    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const ignoreRef = { current: false };

    // Fetch once on mount to sync local state with the `sync_logs` table.
    // This is the standard "fetch data in an Effect" pattern; the ignore
    // guard above stops a stale response from writing state after unmount
    // or a re-run of this effect. Suppressing the compiler's
    // set-state-in-effect diagnostic here is intentional for this
    // one-time synchronization with an external data source.
    // eslint-disable-next-line
    fetchLogs(ignoreRef);

    return () => {
      ignoreRef.current = true;
    };
  }, [fetchLogs]);

  // --- Options built from live data ---
  const departmentOptions: FilterOption[] = useMemo(() => {
    const set = new Set(
      logs
        .map((l) => l.department)
        .filter((d): d is string => !!d && d !== "null")
    );
    return [
      { label: "All Departments", value: "ALL" },
      ...Array.from(set)
        .sort()
        .map((dept) => ({ label: dept, value: dept })),
    ];
  }, [logs]);

  const yearOptions: FilterOption[] = useMemo(() => {
    const set = new Set(logs.map((l) => l.year).filter(Boolean) as number[]);
    return [
      { label: "All Years", value: "ALL" },
      ...Array.from(set)
        .sort((a, b) => a - b)
        .map((year) => ({
          label:
            year === 1
              ? "1st Year"
              : year === 2
              ? "2nd Year"
              : year === 3
              ? "3rd Year"
              : `${year}th Year`,
          value: String(year),
        })),
    ];
  }, [logs]);

  const sectionOptions: FilterOption[] = useMemo(() => {
    const set = new Set(
      logs
        .map((l) => l.section)
        .filter((s): s is string => !!s && s !== "null")
    );
    return [
      { label: "All Sections", value: "ALL" },
      ...Array.from(set)
        .sort()
        .map((section) => ({
          label: `Section ${section}`,
          value: section,
        })),
    ];
  }, [logs]);

  const syncTypeOptions: FilterOption[] = [
    { label: "All Sync Types", value: "ALL" },
    { label: "Automatic", value: "Automatic" },
    { label: "Manual", value: "Manual" },
  ];

  const statusOptions: FilterOption[] = [
    { label: "All Statuses", value: "ALL" },
    { label: "Success", value: "Success" },
    { label: "Failed", value: "Failed" },
  ];

  // Count of logs per calendar day (local time), used for the dot indicators.
  const logCountsByDate = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const log of logs) {
      const key = dateKey(new Date(log.started_at));
      counts[key] = (counts[key] ?? 0) + 1;
    }

    return counts;
  }, [logs]);

  function resetFilters() {
    setFilterDepartment("ALL");
    setFilterYear("ALL");
    setFilterSection("ALL");
    setFilterSyncType("ALL");
    setFilterStatus("ALL");
    setSelectedDate(null);
  }

  const filteredLogs = useMemo(() => {
    let filtered = logs;

    if (filterDepartment !== "ALL") {
      filtered = filtered.filter(
        (log) => log.department === filterDepartment
      );
    }

    if (filterYear !== "ALL") {
      filtered = filtered.filter((log) => log.year === Number(filterYear));
    }

    if (filterSection !== "ALL") {
      filtered = filtered.filter((log) => log.section === filterSection);
    }

    if (filterSyncType !== "ALL") {
      filtered = filtered.filter((log) => log.sync_type === filterSyncType);
    }

    if (filterStatus !== "ALL") {
      filtered = filtered.filter((log) => log.status === filterStatus);
    }

    if (selectedDate) {
      filtered = filtered.filter(
        (log) => dateKey(new Date(log.started_at)) === selectedDate
      );
    }

    // Always keep most-recent-first, whether or not a date is selected.
    return [...filtered].sort(
      (a, b) =>
        new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );
  }, [
    logs,
    filterDepartment,
    filterYear,
    filterSection,
    filterSyncType,
    filterStatus,
    selectedDate,
  ]);

  const hasActiveFilters =
    filterDepartment !== "ALL" ||
    filterYear !== "ALL" ||
    filterSection !== "ALL" ||
    filterSyncType !== "ALL" ||
    filterStatus !== "ALL" ||
    !!selectedDate;

  function formatDateTime(value: string | null) {
    if (!value) return "-";
    const date = new Date(value);
    return date.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function formatDuration(started: string, completed: string | null) {
    if (!completed) return "-";

    const ms = new Date(completed).getTime() - new Date(started).getTime();

    if (ms < 0) return "-";

    const seconds = Math.floor(ms / 1000);

    if (seconds < 60) return `${seconds}s`;

    const minutes = Math.floor(seconds / 60);
    const remSeconds = seconds % 60;

    return `${minutes}m ${remSeconds}s`;
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">
            Sync Logs
          </h2>

          <p className="text-sm text-gray-500">
            {selectedDate
              ? `${formatDayLabel(selectedDate)} • ${filteredLogs.length} Sync${
                  filteredLogs.length === 1 ? "" : "s"
                }`
              : `${filteredLogs.length} Sync${
                  filteredLogs.length === 1 ? "" : "s"
                } • Most Recent First`}
          </p>
        </div>

        {/*
          FIX: fetchLogs takes an optional `ignoreRef` argument, so passing it
          directly as onClick made React hand it the MouseEvent as that
          argument (the TypeScript error). Wrapping it in an arrow function
          calls it with no arguments.
        */}
        <button
          type="button"
          onClick={() => fetchLogs()}
          className="flex items-center gap-2 rounded-lg border px-4 py-2 hover:bg-gray-100"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* --- Calendar + filter dropdown boxes --- */}
      <div className="mb-6 flex flex-col flex-wrap gap-3 md:flex-row md:items-center">
        <CalendarFilter
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          logCountsByDate={logCountsByDate}
        />

        <div className="hidden h-6 w-px bg-gray-200 md:block" />

        <FilterDropdown
          label="Department"
          options={departmentOptions}
          value={filterDepartment}
          onChange={setFilterDepartment}
        />

        <FilterDropdown
          label="Year"
          options={yearOptions}
          value={filterYear}
          onChange={setFilterYear}
        />

        <FilterDropdown
          label="Section"
          options={sectionOptions}
          value={filterSection}
          onChange={setFilterSection}
        />

        <FilterDropdown
          label="Sync Type"
          options={syncTypeOptions}
          value={filterSyncType}
          onChange={setFilterSyncType}
        />

        <FilterDropdown
          label="Status"
          options={statusOptions}
          value={filterStatus}
          onChange={setFilterStatus}
        />

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 md:ml-auto"
          >
            <X size={16} />
            Clear Filters
          </button>
        )}
      </div>

      {loading && (
        <div className="py-10 text-center text-gray-500">
          Loading sync logs...
        </div>
      )}

      {!loading && filteredLogs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <p className="text-lg font-medium text-gray-600">No data found</p>
          <p className="mt-1 text-sm text-gray-400">
            {selectedDate
              ? `No sync logs on ${formatDayLabel(selectedDate)}.`
              : hasActiveFilters
              ? "No sync logs match the selected filters. Try adjusting or clearing them."
              : "There are no sync logs to display right now."}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {!loading && filteredLogs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Synced By</th>
                <th className="p-3 text-left">Department</th>
                <th className="p-3 text-left">Year</th>
                <th className="p-3 text-left">Section</th>
                <th className="p-3 text-left">Reg Range</th>
                <th className="p-3 text-center">Students</th>
                <th className="p-3 text-left">Started</th>
                <th className="p-3 text-left">Completed</th>
                <th className="p-3 text-left">Duration</th>
              </tr>
            </thead>

            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        log.sync_type === "Automatic"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {log.sync_type}
                    </span>
                  </td>

                  <td className="p-3">
                    {log.status === "Success" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                        <CheckCircle2 size={14} />
                        Success
                      </span>
                    )}

                    {log.status === "Failed" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                        <XCircle size={14} />
                        Failed
                      </span>
                    )}

                    {!log.status && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                        <Clock size={14} />
                        Pending
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-gray-600">
                    {log.synced_by ? log.synced_by.slice(0, 8) : "System"}
                  </td>

                  <td className="p-3">{log.department ?? "-"}</td>
                  <td className="p-3">{log.year ?? "-"}</td>
                  <td className="p-3">{log.section ?? "-"}</td>

                  <td className="p-3">
                    {log.reg_from && log.reg_to
                      ? `${log.reg_from} - ${log.reg_to}`
                      : "-"}
                  </td>

                  <td className="p-3 text-center">
                    {log.total_students ?? 0}
                  </td>

                  <td className="p-3 whitespace-nowrap">
                    {formatDateTime(log.started_at)}
                  </td>

                  <td className="p-3 whitespace-nowrap">
                    {formatDateTime(log.completed_at)}
                  </td>

                  <td className="p-3 whitespace-nowrap">
                    {formatDuration(log.started_at, log.completed_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}