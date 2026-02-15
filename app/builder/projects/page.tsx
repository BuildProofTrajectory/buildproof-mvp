"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";

type Project = {
  id: string;
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

      // Require login
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        router.push("/login");
        return;
      }

      // OPTIONAL: if you want to enforce subscription here too later,
      // we can check profiles.subscription_status === "active"

      const { data, error } = await supabase
        .from("projects")
        .select("id,title,goal,status,created_at")
        .eq("status", "posted")
        .order("created_at", { ascending: false });

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      setProjects((data as Project[]) || []);
      setLoading(false);
    };

    load();
  }, [router]);

  return (
    <div style={{ padding: 40, fontFamily: "system-ui", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>Available Projects</h1>
          <p style={{ marginTop: 0, color: "#666" }}>
            These are posted founder projects. Next we’ll add “recommended for you” matching.
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
            <p style={{ marginTop: 0 }}>No posted projects yet.</p>
            <p style={{ color: "#666", marginBottom: 0 }}>
              Ask a founder (you) to post one via /founder/intake.
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