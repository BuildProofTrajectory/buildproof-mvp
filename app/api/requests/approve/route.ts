import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { projectId, builderId } = await req.json();

    if (!projectId || !builderId) {
      return NextResponse.json({ error: "Missing projectId or builderId" }, { status: 400 });
    }

    // Assign builder to project + set status active
    const { error: pErr } = await supabaseAdmin
      .from("projects")
      .update({ assigned_builder_id: builderId, status: "active" })
      .eq("id", projectId);

    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

    // Approve selected request
    const { error: aErr } = await supabaseAdmin
      .from("project_requests")
      .update({ status: "approved" })
      .eq("project_id", projectId)
      .eq("builder_id", builderId);

    if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });

    // Decline all other pending requests
    const { error: dErr } = await supabaseAdmin
      .from("project_requests")
      .update({ status: "declined" })
      .eq("project_id", projectId)
      .neq("builder_id", builderId);

    if (dErr) return NextResponse.json({ error: dErr.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}