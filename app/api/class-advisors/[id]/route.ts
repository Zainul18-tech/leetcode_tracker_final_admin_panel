import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service-role client - server only, never import this file from client components
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // Next.js 15+: params is a Promise, must be awaited

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  // Look up the staff row to get the linked auth user id
  const { data: staffRow, error: fetchError } = await supabaseAdmin
    .from("staff")
    .select("user_id")
    .eq("id", id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (staffRow?.user_id) {
    // Deleting the auth user cascades and deletes the staff row too
    // (staff.user_id -> auth.users.id is ON DELETE CASCADE)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
      staffRow.user_id
    );

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }
  } else {
    // No linked auth user - just delete the staff row directly
    const { error: dbError } = await supabaseAdmin
      .from("staff")
      .delete()
      .eq("id", id);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}