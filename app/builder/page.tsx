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

      const role = (profile.role ?? "").toLowerCase().trim();
      const sub = (profile.subscription_status ?? "inactive").toLowerCase().trim();

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
      <h1>Builder Dashboard ✅</h1>
      <p style={{ color: "#555" }}>
        You now have access to live founder projects.
      </p>

      <div style={{ marginTop: 20 }}>
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
            display: "inline-block",
          }}
        >
          View Available Projects
        </Link>
      </div>
    </div>
  );
}
