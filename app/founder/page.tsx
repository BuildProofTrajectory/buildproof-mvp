"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

type Project = {
  id: string;
  title: string | null;
  goal: string | null;
  status: string | null;
  created_at: string;
};

export default function FounderDashboardPage() {
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

      const { data, error } = await supabase
        .from("projects")
        .select("id,title,goal,status,created_at")
        .eq("founder_id", user.id)
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
          <h1 style={{ marginBottom: 6 }}>Founder Dashboard</h1>
          <p style={{ marginTop: 0, color: "#666" }}>
            Your posted projects (MVP). Next we’ll add recommended builders + messaging.
          </p>
        </div>

        <Link
          href="/founder/intake"
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #111",
            textDecoration: "none",
            background: "#111",
            color: "white",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          + New Project
        </Link>
      </div>

      <div style={{ marginTop: 18 }}>
        {loading ? (
          <div style={{ color: "#666" }}>Loading…</div>
        ) : projects.length === 0 ? (
          <div style={{ padding: 20, border: "1px solid #eee", borderRadius: 12 }}>
            <p style={{ marginTop: 0 }}>No projects yet.</p>
            <Link href="/founder/intake">Create your first project</Link>
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