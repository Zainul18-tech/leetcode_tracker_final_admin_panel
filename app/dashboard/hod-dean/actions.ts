"use server";

import { createAdminClient } from "@/lib/supabase/admin";

interface CreateHodDeanInput {
  name: string;
  email: string;
  role: "HOD" | "Dean";
  department: string | null;
}

const DEFAULT_PASSWORD = "123456";

export async function createHodDean(input: CreateHodDeanInput) {
  const { name, email, role, department } = input;

  if (!name || !email || !role) {
    return { error: "Please fill all required fields." };
  }

  if (role === "HOD" && !department) {
    return { error: "Please select a department for the HOD." };
  }

  const supabase = createAdminClient();

  // Friendly duplicate check before touching auth
  const { data: existing } = await supabase
    .from("staff")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return { error: "A staff member with this email already exists." };
  }

  // 1. Create the user in Supabase Auth first.
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
    });

  if (authError || !authData.user) {
    console.error("Error creating auth user:", authError);
    return {
      error: authError?.message ?? "Failed to create login account.",
    };
  }

  // 2. Insert into staff. `id` is auto-generated,
  //    `user_id` is the foreign key to auth.users.id.
  const { error: staffError } = await supabase.from("staff").insert({
    user_id: authData.user.id,
    name,
    email,
    role,
    department: role === "HOD" ? department : "All", // column is NOT NULL
    year: null,
    section: null,
  });

  if (staffError) {
    console.error("Error inserting staff row:", staffError);

    // Roll back the auth user so we don't leave an orphaned login.
    await supabase.auth.admin.deleteUser(authData.user.id);

    return { error: staffError.message };
  }

  console.log("createHodDean OK:", {
    authUserId: authData.user.id,
    role,
    email,
  });

  return { success: true };
}