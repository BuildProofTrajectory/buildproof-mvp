"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

type Project = {
  id: number;
  title: string | null;
  goal: string | null;
  status: string | null;
  created_at: string;
};

export default function FounderDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [archivingId, setArchivingId] = useState<number | null>(null);
  const [debug, setDebug] = useState("");

  const loadProjects = async () => {
    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (pErr) {
      setDebug(pErr.message);
      setLoading(false);
      return;
    }

    const role = String(profile?.role || "").toLowerCase().trim();
    if (role !== "founder") {
      router.push("/protected");
      return;
    }

    const { data: projs, error: projErr } = await supabase
      .from("projects")
      .select("id,title,goal,status,created_at")
      .eq("founder_id", user.id)
      .not("status", "in", '("archived","completed")')
      .order("created_at", { ascending: false });

    if (projErr) {
      setDebug(projErr.message);
      setLoading(false);
      return;
    }

    setProjects((projs as Project[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const archiveProject = async (projectId: number) => {
    setArchivingId(projectId);
    try {
      const ok = confirm("Archive this project? (It will stop counting toward your active limit.)");
      if (!ok) return;

      const { error } = await supabase
        .from("projects")
        .update({ status: "archived" })
        .eq("id", projectId);

      if (error) {
        alert(error.message);
        return;
      }

      await loadProjects();
    } finally {
      setArchivingId(null);
    }
  };

  return (
    <div style={{ padding: 40, fontFamily: "system-ui", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>Founder Dashboard</h1>
          <p style={{ marginTop: 0, color: "#666" }}>
            Manage your posted projects and approve builder requests.
          </p>
        </div>

        <Link
          href="/founder/intake"
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #111",
            background: "#111",
            color: "white",
            textDecoration: "none",
            fontWeight: 800,
            whiteSpace: "nowrap",
          }}
        >
          Post a Project
        </Link>
      </div>

      {debug ? <p style={{ color: "crimson" }}>{debug}</p> : null}

      <div style={{ marginTop: 18 }}>
        {loading ? (
          <p style={{ color: "#666" }}>Loading…</p>
        ) : projects.length === 0 ? (
          <div style={{ padding: 16, border: "1px solid #eee", borderRadius: 12, color: "#666" }}>
            No active projects yet.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {projects.map((p) => (
              <div key={p.id} style={{ padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
                <Link href={`/founder/project/${p.id}`} style={{ textDecoration: "none", color: "#111" }}>
                  <h3 style={{ margin: 0 }}>{p.title || "Untitled project"}</h3>
                </Link>

                <p style={{ marginTop: 8, color: "#555" }}>{p.goal}</p>

                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div style={{ color: "#777", fontSize: 12 }}>
                    Status: <b>{p.status || "draft"}</b> • {new Date(p.created_at).toLocaleString()}
                  </div>

                  <button
                    onClick={() => archiveProject(p.id)}
                    disabled={archivingId === p.id}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #ddd",
                      background: "white",
                      cursor: "pointer",
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {archivingId === p.id ? "Archiving…" : "Archive"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}