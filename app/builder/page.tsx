"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function BuilderPage() {
  const router = useRouter();
  const [debug, setDebug] = useState("Starting...");
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        setDebug("No user found -> redirect /login");
        router.push("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role, subscription_status")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        setDebug("Profile error: " + error.message);
        return;
      }

      if (!profile) {
        setDebug("No profile row -> redirect /onboarding");
        router.push("/onboarding");
        return;
      }

      const role = String(profile.role || "").toLowerCase().trim();
      const sub = String(profile.subscription_status || "inactive").toLowerCase().trim();

      setDebug(`role="${role}" sub="${sub}"`);

      if (role !== "builder") {
        router.push("/protected");
        return;
      }

      if (sub !== "active") {
        router.push("/subscribe");
        return;
      }

      setAllowed(true);
    };

    load();
  }, [router]);

  if (!allowed) {
    return (
      <div style={{ padding: 40, fontFamily: "system-ui" }}>
        <h2>Checking Builder access…</h2>
        <p style={{ color: "#666" }}>{debug}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 40, fontFamily: "system-ui", maxWidth: 900, margin: "0 auto" }}>
      <h1>Builder Dashboard</h1>

      <p style={{ color: "#555" }}>
        Explore projects recommended specifically for you.
      </p>

      <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
        <Link
          href="/builder/profile"
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "white",
            color: "#111",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          Edit Builder Profile
        </Link>

        <Link
          href="/builder/projects"
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #111",
            background: "#111",
            color: "white",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          View Recommended Projects
        </Link>

        <Link
          href="/builder/active"
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "white",
            color: "#111",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          My Active Project
        </Link>
      </div>
    </div>
  );
}