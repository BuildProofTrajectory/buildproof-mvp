"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function FounderBriefPage() {
  const router = useRouter();
  const [brief, setBrief] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("founder_brief");
    if (!raw) {
      router.push("/founder/intake");
      return;
    }
    setBrief(JSON.parse(raw));
  }, [router]);

  const handlePost = async () => {
    if (!brief) return;

    setLoading(true);

    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        alert("Not logged in");
        router.push("/login");
        return;
      }

      // Enforce: max 3 active projects (posted or active)
    const { count, error: countErr } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("founder_id", user.id)
    .in("status", ["posted", "active"]);

    if (countErr) {
    alert("Could not check project limit: " + countErr.message);
    return;
    }

if ((count || 0) >= 3) {
  alert("You already have 3 active projects. Please complete/archive one before posting a new project.");
  return;
}
      // Category (simple MVP mapping)
      const titleLower = String(brief.title || "").toLowerCase();
      const category =
        titleLower.includes("canva") ? "Canva design" :
        titleLower.includes("social") ? "Social media" :
        titleLower.includes("email") ? "Email marketing" :
        titleLower.includes("e-commerce") || titleLower.includes("shopify") ? "E-commerce / Shopify" :
        "Social media";

      // 1) Insert project + return the new id
      const { data: inserted, error } = await supabase
        .from("projects")
        .insert({
          founder_id: user.id,
          title: brief.title,
          goal: brief.goal,
          inputs_available: brief.inputs_available,
          constraints: brief.constraints,
          commitments: brief.commitments,
          timeline: brief.timeline,
          status: "posted",
          category,
        })
        .select("id")
        .single();

      if (error) {
        alert(error.message);
        return;
      }

      // 2) Auto-seed recommendations for matching builders
      // (Uses service role on server; founder does not need access to recommendations table.)
      const seedRes = await fetch("/api/recommendations/seed-for-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: inserted.id }),
      });

      const seedData = await seedRes.json();
      if (!seedRes.ok) {
        alert("Project posted, but seeding failed ❌\n\n" + JSON.stringify(seedData, null, 2));
      }

      localStorage.removeItem("founder_brief");
      router.push("/founder/success");
    } catch (err: any) {
      alert(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!brief)
    return <div style={{ padding: 40, fontFamily: "system-ui" }}>Loading…</div>;

  return (
    <div style={{ padding: 40, fontFamily: "system-ui", maxWidth: 820, margin: "0 auto" }}>
      <h1>1-Page Project Brief</h1>

      <div style={{ marginTop: 18, padding: 20, border: "1px solid #eee", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0 }}>{brief.title}</h2>

        <h3>Outcome goal</h3>
        <p>{brief.goal}</p>

        <h3>What you already have</h3>
        <ul>
          {(brief.inputs_available || []).map((x: string) => (
            <li key={x}>{x}</li>
          ))}
        </ul>

        <h3>Constraints</h3>
        <ul>
          {(brief.constraints || []).map((x: string) => (
            <li key={x}>{x}</li>
          ))}
        </ul>

        <h3>Commitments</h3>
        <ul>
          <li>Responsiveness: {brief.commitments?.responsiveness}</li>
          <li>Access agreement: {brief.commitments?.access_ok}</li>
          <li>Timeline: {brief.timeline}</li>
        </ul>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
        <button
          onClick={() => router.push("/founder/intake")}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "white",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Edit answers
        </button>

        <button
          onClick={handlePost}
          disabled={loading}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #111",
            background: "#111",
            color: "white",
            cursor: "pointer",
            fontWeight: 700,
            flex: 1,
          }}
        >
          {loading ? "Posting..." : "Approve & Post Project"}
        </button>
      </div>
    </div>
  );
}