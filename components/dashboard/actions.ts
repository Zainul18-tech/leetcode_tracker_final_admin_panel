"use server";

import { createClient } from "@supabase/supabase-js";

// Server-only client using the service role key.
// This file has "use server" at the top, so it NEVER gets bundled
// into client JavaScript — the key stays on the server.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

interface CreateAdvisorInput {
  name: string;
  email: string;
  role: string;
  department: string;
  year: number;
  section: string;
  rangeStart: string | null;
  rangeEnd: string | null;
}

// Roles that class_staff allows linking to a specific class
const CLASS_LINKED_ROLES = ["Tutor", "Class Advisor"];

export async function createStaffMember(input: CreateAdvisorInput) {
  const { name, email, role, department, year, section } = input;

  if (!name || !email || !role || !department || !section) {
    return { error: "Please fill all fields." };
  }

  // 1. Create the auth user with default password
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password: "123456",
      email_confirm: true, // skip email verification
      user_metadata: { name },
    });

  if (authError) {
    return { error: authError.message };
  }

  const userId = authData.user.id;

  const needsClassLink = CLASS_LINKED_ROLES.includes(role);
  let classRow: { id: string } | null = null;

  // 2. Only look up a class if this role gets linked via class_staff
  if (needsClassLink) {
    const { data, error: classFindError } = await supabaseAdmin
      .from("classes")
      .select("id")
      .eq("department", department)
      .eq("year", year)
      .eq("section", section)
      .maybeSingle();

    if (classFindError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return { error: classFindError.message };
    }

    if (!data) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return {
        error: `No class found for ${department} - Year ${year} - Section ${section}. Create the class first.`,
      };
    }

    classRow = data;
  }

  // 3. Insert into staff table, linked via user_id (staff.id is its own uuid)
  const { data: staffRow, error: staffError } = await supabaseAdmin
    .from("staff")
    .insert([
      {
        user_id: userId,
        name,
        email,
        role,
        department,
        year,
        section,
      },
    ])
    .select("id")
    .single();

  if (staffError) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return { error: staffError.message };
  }

  // 4. Link to the class in class_staff, only for Tutor / Class Advisor
  if (needsClassLink && classRow) {
    const { error: classStaffError } = await supabaseAdmin
      .from("class_staff")
      .insert([
        {
          class_id: classRow.id,
          staff_id: staffRow.id,
          role,
        },
      ]);

    if (classStaffError) {
      await supabaseAdmin.from("staff").delete().eq("id", staffRow.id);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return { error: classStaffError.message };
    }
  }

  return { success: true };
}

// Kept as a thin wrapper so existing imports of createClassAdvisor still work
export async function createClassAdvisor(
  input: Omit<CreateAdvisorInput, "role">
) {
  return createStaffMember({ ...input, role: "Class Advisor" });
}