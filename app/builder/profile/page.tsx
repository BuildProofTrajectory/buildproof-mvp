"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";

const INTERESTS = [
  "Social media",
  "Canva design",
  "E-commerce / Shopify",
  "Email marketing",
  "Brand strategy",
  "Not sure yet",
];

const WORKING_STYLE = [
  "Async only (messages + check-ins)",
  "1 call/week is fine",
  "I like clear checklists",
  "I like creative freedom",
];

export default function BuilderProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [interests, setInterests] = useState<string[]>([]);
  const [currentSkills, setCurrentSkills] = useState<string>("");
  const [desiredSkills, setDesiredSkills] = useState<string>("");
  const [workingStyle, setWorkingStyle] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) router.push("/login");
    };
    load();
  }, [router]);

  const toggle = (list: string[], setList: (v: string[]) => void, item: string) => {
    if (list.includes(item)) setList(list.filter((x) => x !== item));
    else setList([...list, item]);
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        router.push("/login");
        return;
      }

      const payload = {
        id: user.id,
        interests,
        current_skills: currentSkills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        desired_skills: desiredSkills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        working_style: workingStyle,
      };

      // upsert = insert if missing, update if exists
      const { error } = await supabase.from("builder_profiles").upsert(payload);

      if (error) {
        alert(error.message);
        return;
      }

      alert("Saved ✅");
      router.push("/builder/projects");
    } catch (err: any) {
      alert(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40, fontFamily: "system-ui", maxWidth: 820, margin: "0 auto" }}>
      <h1>Builder Profile</h1>
      <p style={{ color: "#666" }}>
        This helps us recommend projects that fit your interests.
      </p>

      <div style={{ marginTop: 18, padding: 18, border: "1px solid #eee", borderRadius: 12 }}>
        <h3 style={{ marginTop: 0 }}>What are you most interested in working on?</h3>
        <div style={{ display: "grid", gap: 10 }}>
          {INTERESTS.map((x) => {
            const selected = interests.includes(x);
            return (
              <button
                key={x}
                onClick={() => toggle(interests, setInterests, x)}
                style={{
                  textAlign: "left",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: selected ? "2px solid #111" : "1px solid #ddd",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {selected ? "✅ " : ""}{x}
              </button>
            );
          })}
        </div>

        <h3 style={{ marginTop: 18 }}>Current skills (comma-separated)</h3>
        <input
          value={currentSkills}
          onChange={(e) => setCurrentSkills(e.target.value)}
          placeholder="Example: Instagram, Canva, copywriting"
          style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
        />

        <h3 style={{ marginTop: 18 }}>Skills you want to build (comma-separated)</h3>
        <input
          value={desiredSkills}
          onChange={(e) => setDesiredSkills(e.target.value)}
          placeholder="Example: Shopify, email marketing, content strategy"
          style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
        />

        <h3 style={{ marginTop: 18 }}>Working style (pick what fits)</h3>
        <div style={{ display: "grid", gap: 10 }}>
          {WORKING_STYLE.map((x) => {
            const selected = workingStyle.includes(x);
            return (
              <button
                key={x}
                onClick={() => toggle(workingStyle, setWorkingStyle, x)}
                style={{
                  textAlign: "left",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: selected ? "2px solid #111" : "1px solid #ddd",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {selected ? "✅ " : ""}{x}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={saveProfile}
        disabled={loading || interests.length === 0}
        style={{
          marginTop: 16,
          padding: "12px 16px",
          borderRadius: 10,
          border: "1px solid #111",
          background: interests.length ? "#111" : "#999",
          color: "white",
          cursor: interests.length ? "pointer" : "not-allowed",
          fontWeight: 700,
          width: "100%",
        }}
      >
        {loading ? "Saving..." : "Save Profile"}
      </button>
    </div>
  );
}