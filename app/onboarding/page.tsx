"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const routeBasedOnProfile = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role, subscription_status")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      router.push("/protected");
      return;
    }

    if (!profile || !profile.role) {
      // still onboarding
      setLoading(false);
      return;
    }

    const role = String(profile.role || "").toLowerCase().trim();
    const sub = String(profile.subscription_status || "inactive").toLowerCase().trim();

    if (role === "founder") {
      router.push("/founder");
      return;
    }

    if (role === "builder") {
      router.push(sub === "active" ? "/builder" : "/subscribe");
      return;
    }

    router.push("/protected");
  };

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        router.push("/login");
        return;
      }

      setEmail(user.email ?? null);

      // If role already set, go to the right dashboard
      await routeBasedOnProfile();
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // When a builder selects role, default them to inactive until Stripe activates
    const payload =
      role === "builder"
        ? { id: user.id, role: "builder", subscription_status: "inactive" }
        : { id: user.id, role: "founder" };

    const { error } = await supabase.from("profiles").upsert(payload);

    if (error) {
      setMsg("❌ " + error.message);
      setLoading(false);
      return;
    }

    // Route immediately to correct destination
    if (role === "founder") {
      router.push("/founder");
    } else {
      router.push("/subscribe");
    }
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
