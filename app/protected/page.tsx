"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function ProtectedPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [subStatus, setSubStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        router.push("/login");
        return;
      }

      setEmail(user.email ?? null);

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role, subscription_status")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        setRole("error: " + error.message);
      } else {
        setRole(profile?.role ?? null);
        setSubStatus(profile?.subscription_status ?? null);
      }

      setLoading(false);
    };

    load();
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return <div style={{ padding: 40, fontFamily: "system-ui" }}>Loading...</div>;
  }

  return (
    <div style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1>Protected Page ✅</h1>
      <p>You are logged in as: <b>{email}</b></p>
      <p>Your role is: <b>{role ?? "not set"}</b></p>
      <p>Subscription status: <b>{subStatus ?? "not set"}</b></p>

      {!role && (
        <p>
          Role not set yet. Go to <a href="/onboarding">/onboarding</a>
        </p>
      )}

      <button
        onClick={logout}
        style={{
          marginTop: 16,
          padding: "12px 16px",
          borderRadius: 10,
          border: "1px solid #ddd",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Log out
      </button>
    </div>
  );
}

