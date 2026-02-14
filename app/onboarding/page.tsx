"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        router.push("/login");
        return;
      }

      setEmail(user.email ?? null);

      // If role already set, skip onboarding
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role) {
        router.push("/protected");
        return;
      }

      setLoading(false);
    };

    load();
  }, [router]);

  const setRole = async (role: "founder" | "builder") => {
    setMsg(null);
    setLoading(true);

    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, role });

    if (error) {
      setMsg("❌ " + error.message);
      setLoading(false);
      return;
    }

    router.push("/protected");
  };

  if (loading) {
    return (
      <div style={{ padding: 40, fontFamily: "system-ui" }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ padding: 40, fontFamily: "system-ui", maxWidth: 520 }}>
      <h1>Welcome{email ? `, ${email}` : ""} 👋</h1>
      <p style={{ color: "#555" }}>
        Choose how you want to use BuildProof. You can change this later.
      </p>

      <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
        <button
          onClick={() => setRole("founder")}
          style={{
            padding: "14px 16px",
            borderRadius: 12,
            border: "1px solid #ddd",
            cursor: "pointer",
            fontWeight: 700,
            textAlign: "left",
          }}
        >
          Founder
          <div style={{ fontWeight: 400, marginTop: 6, color: "#666" }}>
            I’m building a business and want help completing projects.
          </div>
        </button>

        <button
          onClick={() => setRole("builder")}
          style={{
            padding: "14px 16px",
            borderRadius: 12,
            border: "1px solid #ddd",
            cursor: "pointer",
            fontWeight: 700,
            textAlign: "left",
          }}
        >
          Builder
          <div style={{ fontWeight: 400, marginTop: 6, color: "#666" }}>
            I want hands-on experience and portfolio-ready work.
          </div>
        </button>
      </div>

      {msg && <p style={{ marginTop: 14 }}>{msg}</p>}
    </div>
  );
}
