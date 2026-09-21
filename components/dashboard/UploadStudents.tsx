"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

interface StudentRow {
  reg_no: string;
  name: string;
  department: string;
  year: number;
  section: string;
  leetcode_username: string;
  leetcode_link: string;
  github_link: string;
}

/*
 * Safely pull a readable message out of an unknown thrown value.
 *
 * Supabase errors (PostgrestError) are plain objects with a `message`
 * field, not `Error` instances, so `err instanceof Error` alone would
 * miss them. This handles both cases without using `any`.
 */
function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) {
    return err.message;
  }

  if (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string" &&
    (err as { message: string }).message
  ) {
    return (err as { message: string }).message;
  }

  return fallback;
}

export default function UploadStudents() {
  const supabase = createClient();

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [fileName, setFileName] = useState("");

  const [loading, setLoading] = useState(false);
  const [reading, setReading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function clearUpload() {
    setStudents([]);
    setFileName("");
    setMessage("");
    setError("");
  }

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setStudents([]);
    setFileName(file.name);
    setMessage("");
    setError("");

    const extension = file.name
      .substring(file.name.lastIndexOf("."))
      .toLowerCase();

    if (extension !== ".xlsx" && extension !== ".xls") {
      setError(
        "Please select a valid Excel file (.xlsx or .xls)."
      );
      return;
    }

    setReading(true);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;

        if (!data) {
          setError("Unable to read the Excel file.");
          setReading(false);
          return;
        }

        const workbook = XLSX.read(data, {
          type: "array",
        });

        if (workbook.SheetNames.length === 0) {
          setError("The Excel file has no sheets.");
          setReading(false);
          return;
        }

        const sheetName = workbook.SheetNames[0];

        const worksheet = workbook.Sheets[sheetName];

        const rows = XLSX.utils.sheet_to_json(
          worksheet,
          {
            defval: "",
          }
        ) as Record<string, unknown>[];

        if (rows.length === 0) {
          setError("The selected Excel sheet is empty.");
          setReading(false);
          return;
        }

        /*
         * Required Excel columns
         */

        const requiredColumns = [
          "reg_no",
          "name",
          "department",
          "year",
          "section",
          "leetcode_username",
          "leetcode_link",
          "github_link",
        ];

        /*
         * Convert Excel column names to lowercase
         */

        const excelColumns = Object.keys(rows[0]).map(
          (column) => column.trim().toLowerCase()
        );

        /*
         * Find missing columns
         */

        const missingColumns = requiredColumns.filter(
          (column) =>
            !excelColumns.includes(column)
        );

        if (missingColumns.length > 0) {
          setError(
            `Missing Excel columns: ${missingColumns.join(
              ", "
            )}`
          );

          setReading(false);
          return;
        }

        /*
         * Convert Excel rows into student objects
         */

        const formattedStudents: StudentRow[] =
          rows.map((row) => ({
            reg_no: String(
              row.reg_no ?? ""
            ).trim(),

            name: String(
              row.name ?? ""
            ).trim(),

            department: String(
              row.department ?? ""
            )
              .trim()
              .toUpperCase(),

            year: Number(
              row.year ?? 0
            ),

            section: String(
              row.section ?? ""
            )
              .trim()
              .toUpperCase(),

            leetcode_username: String(
              row.leetcode_username ?? ""
            ).trim(),

            leetcode_link: String(
              row.leetcode_link ?? ""
            ).trim(),

            github_link: String(
              row.github_link ?? ""
            ).trim(),
          }));

        /*
         * Validate required information
         */

        const invalidRows =
          formattedStudents.filter(
            (student) =>
              !student.reg_no ||
              !student.name ||
              !student.department ||
              !student.year ||
              !student.section
          );

        if (invalidRows.length > 0) {
          setError(
            `${invalidRows.length} row(s) have missing required information.`
          );

          setReading(false);
          return;
        }

        /*
         * Validate year
         */

        const invalidYear =
          formattedStudents.find(
            (student) =>
              student.year < 1 ||
              student.year > 4
          );

        if (invalidYear) {
          setError(
            `Invalid year for student ${invalidYear.reg_no}. Year must be between 1 and 4.`
          );

          setReading(false);
          return;
        }

        /*
         * Check duplicate register numbers
         * inside Excel itself
         */

        const registerNumbers =
          formattedStudents.map(
            (student) => student.reg_no
          );

        const duplicateRegNos =
          registerNumbers.filter(
            (regNo, index) =>
              registerNumbers.indexOf(regNo) !==
              index
          );

        if (duplicateRegNos.length > 0) {
          const uniqueDuplicates = [
            ...new Set(duplicateRegNos),
          ];

          setError(
            `Duplicate register number(s) in Excel: ${uniqueDuplicates.join(
              ", "
            )}`
          );

          setReading(false);
          return;
        }

        setStudents(formattedStudents);

        setReading(false);
      } catch (err) {
        console.error(err);

        setError(
          "Something went wrong while reading the Excel file."
        );

        setReading(false);
      }
    };

    reader.onerror = () => {
      setError("Failed to read the Excel file.");
      setReading(false);
    };

    reader.readAsArrayBuffer(file);
  }

  async function uploadStudents() {
    if (students.length === 0) {
      setError(
        "Please select a valid Excel file first."
      );
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      /*
       * Check whether register numbers
       * already exist in Supabase
       */

      const registerNumbers =
        students.map(
          (student) => student.reg_no
        );

      const { data: existingStudents, error: checkError } =
        await supabase
          .from("students")
          .select("reg_no")
          .in(
            "reg_no",
            registerNumbers
          );

      if (checkError) {
        throw checkError;
      }

      /*
       * Stop if any students already exist
       */

      if (
        existingStudents &&
        existingStudents.length > 0
      ) {
        const existingRegNos =
          existingStudents.map(
            (student) => student.reg_no
          );

        setError(
          `These register numbers already exist: ${existingRegNos.join(
            ", "
          )}`
        );

        setLoading(false);
        return;
      }

      /*
       * Insert students
       */

      const { error: insertError } =
        await supabase
          .from("students")
          .insert(students);

      if (insertError) {
        throw insertError;
      }

      /*
       * Success
       */

      setMessage(
        `${students.length} students uploaded successfully.`
      );

      setStudents([]);
      setFileName("");

      /*
       * Refresh page so StudentsTable
       * immediately shows uploaded students
       */

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: unknown) {
      console.error(err);

      setError(
        getErrorMessage(err, "Failed to upload students.")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

      {/* HEADER */}

      <div className="mb-6 flex items-start justify-between">

        <div className="flex items-center gap-3">

          <div className="rounded-lg bg-green-100 p-3">
            <FileSpreadsheet
              size={24}
              className="text-green-600"
            />
          </div>

          <div>

            <h2 className="text-2xl font-semibold text-gray-800">
              Upload Students
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Import multiple students using Excel.
            </p>

          </div>

        </div>

        {students.length > 0 && (
          <button
            type="button"
            onClick={clearUpload}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        )}

      </div>

      {/* UPLOAD AREA */}

      <label
        htmlFor="student-excel"
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 transition hover:border-blue-400 hover:bg-blue-50"
      >

        <Upload
          size={40}
          className="mb-3 text-blue-600"
        />

        <p className="font-semibold text-gray-700">
          {reading
            ? "Reading Excel file..."
            : "Click to upload Excel file"}
        </p>

        <p className="mt-1 text-sm text-gray-500">
          Supported formats: .xlsx and .xls
        </p>

        <input
          id="student-excel"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          disabled={reading || loading}
          className="hidden"
        />

      </label>

      {/* FILE NAME */}

      {fileName && (
        <div className="mt-4 flex items-center gap-3 rounded-lg bg-blue-50 p-4">

          <FileSpreadsheet
            size={22}
            className="text-green-600"
          />

          <div>

            <p className="font-medium text-gray-800">
              {fileName}
            </p>

            {students.length > 0 && (
              <p className="text-sm text-gray-500">
                {students.length} students detected
              </p>
            )}

          </div>

        </div>
      )}

      {/* ERROR */}

      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-lg bg-red-50 p-4 text-red-700">

          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0"
          />

          <p className="text-sm">
            {error}
          </p>

        </div>
      )}

      {/* SUCCESS */}

      {message && (
        <div className="mt-4 flex items-start gap-3 rounded-lg bg-green-50 p-4 text-green-700">

          <CheckCircle
            size={20}
            className="mt-0.5 shrink-0"
          />

          <p className="text-sm">
            {message}
          </p>

        </div>
      )}

      {/* PREVIEW */}

      {students.length > 0 && (

        <div className="mt-6">

          <div className="mb-4 flex items-center justify-between">

            <div>

              <h3 className="text-lg font-semibold text-gray-800">
                Excel Preview
              </h3>

              <p className="text-sm text-gray-500">
                Check the student information before importing.
              </p>

            </div>

            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
              {students.length} Students
            </span>

          </div>

          <div className="overflow-x-auto rounded-lg border">

            <table className="w-full text-sm">

              <thead className="bg-gray-100">

                <tr>

                  <th className="whitespace-nowrap px-4 py-3 text-left">
                    Reg No
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 text-left">
                    Name
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 text-left">
                    Department
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 text-left">
                    Year
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 text-left">
                    Section
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 text-left">
                    LeetCode
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 text-left">
                    GitHub
                  </th>

                </tr>

              </thead>

              <tbody>

                {students.map(
                  (student, index) => (

                    <tr
                      key={`${student.reg_no}-${index}`}
                      className="border-t hover:bg-gray-50"
                    >

                      <td className="whitespace-nowrap px-4 py-3">
                        {student.reg_no}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-800">
                        {student.name}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        {student.department}
                      </td>

                      <td className="px-4 py-3">
                        {student.year}
                      </td>

                      <td className="px-4 py-3">
                        {student.section}
                      </td>

                      <td className="max-w-40 truncate px-4 py-3">
                        {student.leetcode_username ||
                          "-"}
                      </td>

                      <td className="max-w-40 truncate px-4 py-3">
                        {student.github_link ||
                          "-"}
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

          {/* IMPORT BUTTON */}

          <div className="mt-5 flex justify-end">

            <button
              type="button"
              onClick={uploadStudents}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >

              <Upload size={18} />

              {loading
                ? "Uploading..."
                : `Import ${students.length} Students`}

            </button>

          </div>

        </div>
      )}

    </div>
  );
}