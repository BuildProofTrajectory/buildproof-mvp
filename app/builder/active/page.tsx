"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

type Project = {
  id: number;
  title: string | null;
  goal: string | null;
  status: string | null;
  created_at: string;
};

export default function BuilderActiveProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [debug, setDebug] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;

      if (!user) {
        router.push("/login");
        return;
      }

      // Ensure builder + active subscription
      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("role, subscription_status")
        .eq("id", user.id)
        .maybeSingle();

      if (pErr) {
        setDebug(pErr.message);
        setLoading(false);
        return;
      }

      const role = String(profile?.role || "").toLowerCase().trim();
      const sub = String(profile?.subscription_status || "inactive").toLowerCase().trim();

      if (role !== "builder") {
        router.push("/protected");
        return;
      }
      if (sub !== "active") {
        router.push("/subscribe");
        return;
      }

      // Load assigned active project (MVP assumes 0–1 active at a time)
      const { data: proj, error: projErr } = await supabase
        .from("projects")
        .select("id,title,goal,status,created_at")
        .eq("assigned_builder_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (projErr) {
        setDebug(projErr.message);
        setLoading(false);
        return;
      }

      setProject((proj as Project) || null);
      setLoading(false);
    };

    load();
  }, [router]);

  return (
    <div style={{ padding: 40, fontFamily: "system-ui", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>My Active Project</h1>
          <p style={{ marginTop: 0, color: "#666" }}>
            This is the project you’ve been assigned by a founder.
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
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          Back
        </Link>
      </div>

      {loading ? (
        <p style={{ color: "#666" }}>Loading…</p>
      ) : debug ? (
        <p style={{ color: "crimson" }}>{debug}</p>
      ) : !project ? (
        <div style={{ padding: 16, border: "1px solid #eee", borderRadius: 12, color: "#666" }}>
          No active project assigned yet.
        </div>
      ) : (
        <div style={{ padding: 18, border: "1px solid #eee", borderRadius: 12 }}>
          <h2 style={{ marginTop: 0 }}>{project.title || "Untitled"}</h2>
          <p style={{ color: "#555" }}>{project.goal}</p>
          <p style={{ color: "#777", fontSize: 13 }}>
            Status: <b>{project.status}</b> • Created: {new Date(project.created_at).toLocaleString()}
          </p>

          <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: "#fafafa", border: "1px solid #eee" }}>
            <b>Next MVP step:</b> we’ll add deliverables/checklist + a simple check-in log here.
          </div>
        </div>
      )}
    </div>
  );
}