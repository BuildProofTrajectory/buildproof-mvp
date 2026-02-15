import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { builderId } = await req.json();

    if (!builderId) {
      return NextResponse.json({ error: "Missing builderId" }, { status: 400 });
    }

    // 1) Load builder profile interests
    const { data: bp, error: bpErr } = await supabaseAdmin
      .from("builder_profiles")
      .select("interests")
      .eq("id", builderId)
      .maybeSingle();

    if (bpErr) return NextResponse.json({ error: bpErr.message }, { status: 500 });
    if (!bp) return NextResponse.json({ error: "No builder_profile found" }, { status: 404 });

    const interests: string[] = Array.isArray(bp.interests) ? bp.interests : [];

    if (interests.length === 0) {
      return NextResponse.json({ created: 0, note: "No interests selected" });
    }

    // 2) Load posted projects
    const { data: projects, error: projErr } = await supabaseAdmin
      .from("projects")
      .select("id, category, title")
      .eq("status", "posted");

    if (projErr) return NextResponse.json({ error: projErr.message }, { status: 500 });

    // 3) Very simple matching: category contains an interest keyword
    const toInsert: any[] = [];
    for (const p of projects || []) {
      const cat = (p.category || "").toLowerCase();
      const matched = interests.some((i) => cat.includes(String(i).toLowerCase()));
      if (matched) {
        toInsert.push({
          builder_id: builderId,
          project_id: p.id, // bigint in DB
          score: 80,
          reason: `Matched interest to category: ${p.category || "unknown"}`,
        });
      }
    }

    if (toInsert.length === 0) {
      return NextResponse.json({ created: 0, note: "No matching projects found" });
    }

    // 4) Insert with upsert-like behavior by ignoring duplicates
    const { error: insErr } = await supabaseAdmin
      .from("recommendations")
      .upsert(toInsert, { onConflict: "builder_id,project_id" });

    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

    return NextResponse.json({ created: toInsert.length });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}