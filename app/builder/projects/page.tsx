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
  assigned_builder_id: string | null;
};

export default function BuilderProjectsFeedPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);

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

      // 2) Load only those projects (and exclude already-assigned ones)
      const { data: projs, error: projErr } = await supabase
        .from("projects")
        .select("id,title,goal,status,created_at,assigned_builder_id")
        .in("id", projectIds)
        .is("assigned_builder_id", null)
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

  const requestProject = async (projectId: number) => {
    setSubmittingId(projectId);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return alert("Not logged in");

      const { error } = await supabase.from("project_requests").insert({
        project_id: projectId,
        builder_id: user.id,
        status: "pending",
        note: "Excited to help—requesting to work on this project.",
      });

      if (error) {
        alert(error.message);
        return;
      }

      alert("Request sent ✅");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div style={{ padding: 40, fontFamily: "system-ui", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>Recommended Projects</h1>
          <p style={{ marginTop: 0, color: "#666" }}>
            You’ll only see projects recommended to you. Request one to get assigned.
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
              Post a matching founder project (or wait for new ones).
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {projects.map((p) => (
              <div key={p.id} style={{ padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
                <h3 style={{ margin: 0 }}>{p.title || "Untitled project"}</h3>
                <p style={{ marginTop: 8, color: "#555" }}>{p.goal}</p>

                <button
                  onClick={() => requestProject(p.id)}
                  disabled={submittingId === p.id}
                  style={{
                    marginTop: 10,
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #111",
                    background: "#111",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: 800,
                  }}
                >
                  {submittingId === p.id ? "Sending..." : "Request to Work on This"}
                </button>

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