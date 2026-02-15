"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";

type Project = {
  id: number; // projects.id is bigint
  title: string | null;
  goal: string | null;
  status: string | null;
  created_at: string;
};

export default function BuilderProjectsFeedPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;

      if (!user) {
        router.push("/login");
        return;
      }

      // 1) Get recommended project IDs for this builder
      const { data: recs, error: recErr } = await supabase
        .from("recommendations")
        .select("project_id, score, reason")
        .eq("builder_id", user.id)
        .order("score", { ascending: false });

      if (recErr) {
        alert(recErr.message);
        setLoading(false);
        return;
      }

      const projectIds = (recs || []).map((r: any) => r.project_id).filter(Boolean);

      if (projectIds.length === 0) {
        setProjects([]);
        setLoading(false);
        return;
      }

      // 2) Load only those projects
      const { data: projs, error: projErr } = await supabase
        .from("projects")
        .select("id,title,goal,status,created_at")
        .in("id", projectIds)
        .order("created_at", { ascending: false });

      if (projErr) {
        alert(projErr.message);
        setLoading(false);
        return;
      }

      setProjects((projs as Project[]) || []);
      setLoading(false);
    };

    load();
  }, [router]);

  return (
    <div style={{ padding: 40, fontFamily: "system-ui", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>Recommended Projects</h1>
          <p style={{ color: "#c00", fontWeight: 700 }}>VERSION: RECOMMENDATIONS ONLY ✅</p>
          <p style={{ marginTop: 0, color: "#666" }}>
            For MVP, you’ll only see projects that were explicitly recommended to you.
          </p>
        </div>

        <Link
          href="/builder"
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #ddd",
            textDecoration: "none",
            color: "#111",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          Back to Builder
        </Link>
      </div>

      <div style={{ marginTop: 18 }}>
        {loading ? (
          <div style={{ color: "#666" }}>Loading…</div>
        ) : projects.length === 0 ? (
          <div style={{ padding: 20, border: "1px solid #eee", borderRadius: 12 }}>
            <p style={{ marginTop: 0, fontWeight: 700 }}>No recommendations yet.</p>
            <p style={{ color: "#666", marginBottom: 0 }}>
              Next we’ll auto-generate recommendations based on your builder profile.
              For now, we’ll seed a few recommendations manually.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {projects.map((p) => (
              <div key={p.id} style={{ padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{p.title || "Untitled project"}</h3>
                    <p style={{ marginTop: 8, color: "#555" }}>{p.goal}</p>
                  </div>

                  <div style={{ textAlign: "right", minWidth: 140 }}>
                    <div style={{ fontWeight: 700 }}>{p.status || "draft"}</div>
                    <div style={{ color: "#777", fontSize: 12 }}>
                      {new Date(p.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <code style={{ fontSize: 12, color: "#777" }}>{p.id}</code>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}