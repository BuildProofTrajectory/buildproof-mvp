"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../../lib/supabaseClient";

export default function FounderProjectDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = Number(params.id);

  const [project, setProject] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.push("/login");
        return;
      }

      const { data: p, error: pErr } = await supabase
        .from("projects")
        .select("id,title,goal,status,assigned_builder_id,created_at")
        .eq("id", projectId)
        .maybeSingle();

      if (pErr) {
        alert(pErr.message);
        setLoading(false);
        return;
      }

      setProject(p);

      const { data: r, error: rErr } = await supabase
        .from("project_requests")
        .select("builder_id,status,note,created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (rErr) {
        alert(rErr.message);
        setLoading(false);
        return;
      }

      setRequests(r || []);
      setLoading(false);
    };

    if (!Number.isNaN(projectId)) load();
  }, [projectId, router]);

  const approve = async (builderId: string) => {
    setApproving(builderId);
    try {
      const res = await fetch("/api/requests/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, builderId }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert("Approve failed ❌\n\n" + JSON.stringify(data, null, 2));
        return;
      }

      alert("Builder assigned ✅");
      window.location.reload();
    } finally {
      setApproving(null);
    }
  };

  if (loading) return <div style={{ padding: 40, fontFamily: "system-ui" }}>Loading…</div>;
  if (!project) return <div style={{ padding: 40, fontFamily: "system-ui" }}>Project not found.</div>;

  return (
    <div style={{ padding: 40, fontFamily: "system-ui", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>{project.title}</h1>
          <p style={{ marginTop: 0, color: "#555" }}>{project.goal}</p>
          <p style={{ color: "#777" }}>
            Status: <b>{project.status}</b>{" "}
            {project.assigned_builder_id ? `(Assigned)` : ""}
          </p>

          {project.assigned_builder_id ? (
            <Link
              href={`/project/${project.id}`}
              style={{
                display: "inline-block",
                marginTop: 10,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #111",
                background: "#111",
                color: "white",
                textDecoration: "none",
                fontWeight: 800,
              }}
            >
              Open Workspace
            </Link>
          ) : null}
        </div>

        <Link href="/founder" style={{ alignSelf: "center" }}>
          Back
        </Link>
      </div>

      <h2 style={{ marginTop: 24 }}>Builder Requests</h2>

      {requests.length === 0 ? (
        <div style={{ padding: 16, border: "1px solid #eee", borderRadius: 12, color: "#666" }}>
          No requests yet.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {requests.map((r) => (
            <div key={r.builder_id} style={{ padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 800 }}>{r.builder_id}</div>
                  <div style={{ color: "#666", marginTop: 6 }}>{r.note || ""}</div>
                  <div style={{ color: "#777", fontSize: 12, marginTop: 8 }}>
                    Status: {r.status} • {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>

                <div>
                  <button
                    disabled={project.assigned_builder_id || r.status !== "pending" || approving === r.builder_id}
                    onClick={() => approve(r.builder_id)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #111",
                      background: project.assigned_builder_id ? "#999" : "#111",
                      color: "white",
                      cursor: "pointer",
                      fontWeight: 800,
                    }}
                  >
                    {approving === r.builder_id ? "Approving..." : "Approve"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}