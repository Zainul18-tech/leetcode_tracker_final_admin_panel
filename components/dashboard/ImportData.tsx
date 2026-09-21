"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

interface ClassType {
  id: string;
  class_name: string;
  department: string;
  year: number;
  section: string;
  batch: string;
}

interface Props {
  classes: ClassType[];
}

interface StudentRow {
  reg_no: string;
  name: string;
  department: string;
  year: number;
  section: string;
  leetcode_username: string;
  leetcode_link: string;
  github_link: string;
  _rowIndex: number; // original row number in the sheet, for messages
}

/**
 * Normalizes a header name so that things like
 * "Leetcode_username", "LeetCode Username", "leetcode_username" etc.
 * all map to the same key: "leetcodeusername".
 */
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[\s_-]+/g, "");
}

function getField(
  normalizedRow: Record<string, unknown>,
  candidates: string[]
): string {
  for (const candidate of candidates) {
    const value = normalizedRow[normalizeKey(candidate)];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

/** Turns a raw Postgres/Supabase error into a friendly, specific message. */
function describeSupabaseError(error: {
  code?: string;
  message: string;
  details?: string | null;
}): string {
  const msg = error.message || "";

  if (error.code === "23505") {
    // unique_violation
    if (msg.includes("github_link")) {
      return "Import failed: one or more GitHub links already exist for another student (github_link must be unique). Check for duplicate or copy-pasted links in your Excel file.";
    }
    if (msg.includes("leetcode_link")) {
      return "Import failed: one or more LeetCode links already exist for another student (leetcode_link must be unique). Check for duplicate or copy-pasted links in your Excel file.";
    }
    if (msg.includes("students_pkey") || msg.includes("reg_no")) {
      return "Import failed: one or more Register Numbers already exist. If you're re-importing updated data, that's expected to update, not fail — please retry, or check for a typo in the register number.";
    }
    return `Import failed: a duplicate value was found (${msg}).`;
  }

  if (error.code === "23502") {
    // not_null_violation
    return `Import failed: a required field is missing (${msg}). Every row needs a Register Number, Name, Department, Year, Section, and LeetCode username/link/GitHub link.`;
  }

  if (error.code === "23503") {
    // foreign_key_violation
    return "Import failed: the selected class no longer exists. Please refresh and pick a class again.";
  }

  return msg || "Something went wrong while importing students.";
}

export default function ImportData({ classes }: Props) {
  const supabase = createClient();

  const [selectedClass, setSelectedClass] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [students, setStudents] = useState<StudentRow[]>([]);

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Informational only — auto-resolved by the importer, nothing to fix.
  const [notices, setNotices] = useState<string[]>([]);
  // Rows that were dropped entirely because required data was missing.
  const [skippedRows, setSkippedRows] = useState<string[]>([]);

  function resetState() {
    setMessage("");
    setErrorMessage("");
    setNotices([]);
    setSkippedRows([]);
    setStudents([]);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    resetState();

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        if (!data) {
          setErrorMessage("Unable to read the file.");
          return;
        }

        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          setErrorMessage("The Excel file has no sheet.");
          return;
        }

        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(
          worksheet
        );

        if (jsonData.length === 0) {
          setErrorMessage("The sheet appears to be empty.");
          return;
        }

        // ---- 1. Parse + normalize every row ----
        const parsed: StudentRow[] = jsonData.map((row, i) => {
          const normalized: Record<string, unknown> = {};
          for (const key of Object.keys(row)) {
            normalized[normalizeKey(key)] = row[key];
          }

          const reg_no = getField(normalized, [
            "reg_no",
            "Reg_No",
            "Reg No",
            "Register Number",
            "RegisterNo",
          ]);

          const leetcode_username = getField(normalized, [
            "leetcode_username",
            "LeetCode_Username",
            "LeetCode Username",
            "Leetcode_username",
            "Leetcode Username",
          ]);

          const leetcode_link = getField(normalized, [
            "leetcode_link",
            "LeetCode_Link",
            "LeetCode Link",
            "Leetcode_link",
            "Leetcode Link",
          ]);

          const github_link = getField(normalized, [
            "github_link",
            "GitHub_Link",
            "GitHub Link",
          ]);

          return {
            reg_no,
            name: getField(normalized, ["name", "Name", "Student Name"]),
            department: getField(normalized, [
              "department",
              "Department",
              "Dept",
            ]),
            year: Number(getField(normalized, ["year", "Year"]) || 0),
            section: getField(normalized, ["section", "Section"]),
            leetcode_username,
            // Fall back to a unique placeholder rather than "" so we never
            // send null/empty into a NOT NULL + UNIQUE column.
            leetcode_link: leetcode_link || `no-leetcode-link-${reg_no || i}`,
            github_link: github_link || `no-github-link-${reg_no || i}`,
            _rowIndex: i + 2, // +2 = header row + 1-indexing, matches Excel row #
          };
        });

        // Rows that are entirely blank (common trailing rows in exported
        // sheets) are skipped silently — they aren't a real "issue".
        const isEffectivelyBlank = (s: StudentRow) =>
          !s.reg_no && !s.name && !s.department && !s.section;

        const skippedRowMsgs: string[] = [];

        // ---- 2. Drop rows missing required identity fields ----
        const withRequiredFields = parsed.filter((s) => {
          if (isEffectivelyBlank(s)) return false; // silent, not an issue

          const ok =
            s.reg_no !== "" &&
            s.name !== "" &&
            s.department !== "" &&
            s.section !== "" &&
            s.leetcode_username !== "";

          if (!ok) {
            skippedRowMsgs.push(
              `Row ${s._rowIndex} (${s.name || "unnamed"}): missing Register Number, Name, Department, Section, or LeetCode username.`
            );
          }
          return ok;
        });

        const noticeMsgs: string[] = [];

        // ---- 3. De-duplicate by reg_no (primary key). Keep the LAST
        //         occurrence — usually the most recent form submission. ----
        const byRegNo = new Map<string, StudentRow>();
        for (const s of withRequiredFields) {
          if (byRegNo.has(s.reg_no)) {
            noticeMsgs.push(
              `"${s.name}" (Reg No ${s.reg_no}) was submitted more than once — kept the entry from row ${s._rowIndex}, ignored the earlier one.`
            );
          }
          byRegNo.set(s.reg_no, s);
        }
        const deduped = Array.from(byRegNo.values());

        // ---- 4. Detect duplicate leetcode_link / github_link across
        //         DIFFERENT students — these will violate the UNIQUE
        //         constraints in the DB, so surface them as blocking
        //         errors rather than guessing which one is "right". ----
        const conflictErrors: string[] = [];

        const linkOwners = new Map<string, string[]>(); // link -> [names]
        for (const s of deduped) {
          if (!s.leetcode_link.startsWith("no-leetcode-link-")) {
            const key = `leetcode:${s.leetcode_link}`;
            linkOwners.set(key, [...(linkOwners.get(key) || []), s.name]);
          }
          if (!s.github_link.startsWith("no-github-link-")) {
            const key = `github:${s.github_link}`;
            linkOwners.set(key, [...(linkOwners.get(key) || []), s.name]);
          }
        }
        for (const [key, names] of linkOwners.entries()) {
          if (names.length > 1) {
            const [type, link] = key.split(/:(.+)/);
            conflictErrors.push(
              `${type === "leetcode" ? "LeetCode link" : "GitHub link"} "${link}" is used by multiple students (${names.join(
                ", "
              )}). Fix this in the Excel file before importing — each link must be unique.`
            );
          }
        }

        setSkippedRows(skippedRowMsgs);
        setNotices(noticeMsgs);

        if (conflictErrors.length > 0) {
          setErrorMessage(
            "Cannot import — duplicate links found:\n" +
              conflictErrors.join("\n")
          );
          setStudents([]);
          return;
        }

        if (deduped.length === 0) {
          setErrorMessage(
            "No valid student records were found in the Excel file."
          );
          return;
        }

        setStudents(deduped);
        setMessage(`${deduped.length} student record(s) ready to import.`);
      } catch (error) {
        console.error(error);
        setErrorMessage("Unable to read the Excel file.");
      }
    };

    reader.readAsBinaryString(selectedFile);
  }

  async function handleUpload() {
    setMessage("");
    setErrorMessage("");

    if (!selectedClass) {
      setErrorMessage("Please select a class before importing.");
      return;
    }
    if (!file) {
      setErrorMessage("Please select an Excel file.");
      return;
    }
    if (students.length === 0) {
      setErrorMessage("No student records are available to import.");
      return;
    }

    setLoading(true);

    try {
      const rows = students.map((student) => ({
        reg_no: student.reg_no,
        name: student.name,
        department: student.department,
        year: student.year,
        section: student.section,
        leetcode_username: student.leetcode_username,
        leetcode_link: student.leetcode_link,
        github_link: student.github_link,
        class_id: selectedClass,
      }));

      // Upsert on reg_no (the primary key) so re-importing the same
      // student updates their record instead of erroring.
      const { error } = await supabase
        .from("students")
        .upsert(rows, { onConflict: "reg_no" });

      if (error) {
        console.error(error);
        setErrorMessage(describeSupabaseError(error));
        setLoading(false);
        return;
      }

      setMessage(`${students.length} students imported successfully.`);
      setFile(null);
      setStudents([]);
      setSelectedClass("");
      setNotices([]);
      setSkippedRows([]);
    } catch (error) {
      console.error(error);
      setErrorMessage("Something went wrong while importing students.");
    }

    setLoading(false);
  }

  const selectedClassDetails = classes.find(
    (item) => item.id === selectedClass
  );

  return (
    <div className="space-y-6">
      {/* IMPORT CARD */}
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        {/* HEADER */}
        <div className="mb-8 flex items-center gap-4">
          <div className="rounded-xl bg-blue-100 p-3">
            <FileSpreadsheet size={28} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              Import Student Data
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Upload student details using an Excel file.
            </p>
          </div>
        </div>

        {/* SELECT CLASS */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Select Class
          </label>
          <select
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setMessage("");
              setErrorMessage("");
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
          >
            <option value="">Select a class</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.class_name} - {item.department} - {item.year} Year -
                Section {item.section}
              </option>
            ))}
          </select>
        </div>

        {/* SELECTED CLASS */}
        {selectedClassDetails && (
          <div className="mb-6 rounded-lg bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-800">
              Selected Class
            </p>
            <p className="mt-1 text-sm text-blue-700">
              {selectedClassDetails.class_name} |{" "}
              {selectedClassDetails.department} |{" "}
              {selectedClassDetails.year} Year | Section{" "}
              {selectedClassDetails.section}
            </p>
          </div>
        )}

        {/* FILE UPLOAD */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Excel File
          </label>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 transition hover:border-blue-500 hover:bg-blue-50">
            <Upload size={36} className="mb-3 text-blue-600" />
            <p className="font-medium text-gray-700">
              Click to select Excel file
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Supported formats: .xlsx and .xls
            </p>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {/* FILE INFORMATION */}
        {file && (
          <div className="mb-6 flex items-center gap-3 rounded-lg bg-gray-100 p-4">
            <FileSpreadsheet size={24} className="text-green-600" />
            <div>
              <p className="font-medium text-gray-800">{file.name}</p>
              <p className="text-sm text-gray-500">
                {students.length} student records ready
              </p>
            </div>
          </div>
        )}

        {/* SUCCESS MESSAGE */}
        {message && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-700">
            <CheckCircle size={20} />
            <span>{message}</span>
          </div>
        )}

        {/* NOTICES — informational, already auto-resolved, nothing to fix */}
        {notices.length > 0 && (
          <div className="mb-6 rounded-lg bg-blue-50 p-4 text-blue-800">
            <div className="mb-2 flex items-center gap-2 font-medium">
              <Info size={20} />
              <span>{notices.length} note(s) — handled automatically</span>
            </div>
            <ul className="ml-6 list-disc space-y-1 text-sm">
              {notices.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
        )}

        {/* SKIPPED ROWS — actually missing data, need fixing in the Excel
            file and re-uploading if you want those students included */}
        {skippedRows.length > 0 && (
          <div className="mb-6 rounded-lg bg-amber-50 p-4 text-amber-800">
            <div className="mb-2 flex items-center gap-2 font-medium">
              <AlertTriangle size={20} />
              <span>{skippedRows.length} row(s) skipped — missing data</span>
            </div>
            <ul className="ml-6 list-disc space-y-1 text-sm">
              {skippedRows.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ERROR MESSAGE (blocking) */}
        {errorMessage && (
          <div className="mb-6 flex items-start gap-2 whitespace-pre-line rounded-lg bg-red-50 p-4 text-red-700">
            <XCircle size={20} className="mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* IMPORT BUTTON */}
        <button
          type="button"
          onClick={handleUpload}
          disabled={loading || students.length === 0}
          className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {loading ? "Importing Students..." : "Import Students"}
        </button>
      </div>

      {/* PREVIEW TABLE */}
      {students.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-gray-800">
              Student Preview
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Review the student records before importing.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-3 text-left">Reg No</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Department</th>
                  <th className="px-4 py-3 text-left">Year</th>
                  <th className="px-4 py-3 text-left">Section</th>
                  <th className="px-4 py-3 text-left">LeetCode Username</th>
                  <th className="px-4 py-3 text-left">LeetCode Link</th>
                  <th className="px-4 py-3 text-left">GitHub</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr
                    key={`${student.reg_no}-${index}`}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">{student.reg_no}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {student.name}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {student.department}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {student.year}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {student.section}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {student.leetcode_username}
                    </td>
                    <td
                      className={`px-4 py-3 max-w-[220px] truncate ${
                        student.leetcode_link.startsWith("no-leetcode-link-")
                          ? "font-medium text-amber-600"
                          : "text-gray-700"
                      }`}
                      title={student.leetcode_link}
                    >
                      {student.leetcode_link.startsWith("no-leetcode-link-")
                        ? "Not provided"
                        : student.leetcode_link}
                    </td>
                    <td
                      className={`px-4 py-3 max-w-[220px] truncate ${
                        student.github_link.startsWith("no-github-link-")
                          ? "font-medium text-amber-600"
                          : "text-gray-700"
                      }`}
                      title={student.github_link}
                    >
                      {student.github_link.startsWith("no-github-link-")
                        ? "Not provided"
                        : student.github_link}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}