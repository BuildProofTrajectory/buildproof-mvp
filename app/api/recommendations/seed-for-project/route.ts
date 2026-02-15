import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { projectId } = await req.json();

    if (projectId === undefined || projectId === null) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    // 1) Load the project (needs category + status)
    const { data: project, error: pErr } = await supabaseAdmin
      .from("projects")
      .select("id, category, status, title")
      .eq("id", projectId)
      .maybeSingle();

    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    if (project.status !== "posted") {
      return NextResponse.json({ created: 0, note: "Project is not posted yet" });
    }

    const category = (project.category || "").toLowerCase().trim();
    if (!category) {
      return NextResponse.json({ created: 0, note: "Project has no category to match" });
    }

    // 2) Load all builders who have interests
    const { data: builders, error: bErr } = await supabaseAdmin
      .from("builder_profiles")
      .select("id, interests");

    if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 });

    const toInsert: any[] = [];

    for (const b of builders || []) {
      const interests: string[] = Array.isArray(b.interests) ? b.interests : [];
      const matches = interests.some((i) => String(i).toLowerCase().trim() === category);

      if (matches) {
        toInsert.push({
          builder_id: b.id,
          project_id: project.id, // bigint in DB
          score: 90,
          reason: `Auto-match: builder interest "${category}"`,
        });
      }
    }

    if (toInsert.length === 0) {
      return NextResponse.json({ created: 0, note: "No builders matched this category" });
    }

    const { error: upErr } = await supabaseAdmin
      .from("recommendations")
      .upsert(toInsert, { onConflict: "builder_id,project_id" });

    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    return NextResponse.json({ created: toInsert.length });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}