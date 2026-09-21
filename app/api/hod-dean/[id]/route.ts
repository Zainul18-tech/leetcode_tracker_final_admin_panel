import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 1. Find the staff row so we know which auth user it belongs to.
  const { data: staff, error: fetchError } = await supabase
    .from("staff")
    .select("id, user_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    console.error("Error fetching staff row:", fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!staff) {
    return NextResponse.json({ error: "Staff member not found." }, { status: 404 });
  }

  // 2. Delete the auth user (the staff row cascades automatically).
  if (staff.user_id) {
    const { error: authError } = await supabase.auth.admin.deleteUser(
      staff.user_id
    );

    if (authError) {
      console.error("Error deleting auth user:", authError);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }
  }

  // 3. Safety net: remove the staff row if it still exists
  //    (e.g. user_id was null, so nothing cascaded).
  const { error: staffError } = await supabase
    .from("staff")
    .delete()
    .eq("id", id);

  if (staffError) {
    console.error("Error deleting staff row:", staffError);
    return NextResponse.json({ error: staffError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}