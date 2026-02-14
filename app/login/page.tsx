"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    setMsg(null);
    setLoading(true);

    try {
      if (!email || !password) {
        setMsg("Please enter email + password.");
        return;
      }

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        setMsg("✅ Account created. Now click Log in.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        router.push("/onboarding");
      }
    } catch (e: any) {
      setMsg(`❌ ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40, fontFamily: "system-ui", maxWidth: 420 }}>
      <h1>{mode === "signup" ? "Create an account" : "Log in"}</h1>

      <label style={{ display: "block", marginTop: 16 }}>Email</label>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
        placeholder="you@email.com"
      />

      <label style={{ display: "block", marginTop: 16 }}>Password</label>
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
        placeholder="••••••••"
      />

      <button
        onClick={handleAuth}
        disabled={loading}
        style={{
          marginTop: 16,
          padding: "12px 16px",
          borderRadius: 10,
          border: "1px solid #ddd",
          cursor: "pointer",
          fontWeight: 600,
          width: "100%",
        }}
      >
        {loading ? "Working..." : mode === "signup" ? "Sign up" : "Log in"}
      </button>

      <button
        onClick={() => setMode(mode === "signup" ? "login" : "signup")}
        style={{
          marginTop: 10,
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid #eee",
          cursor: "pointer",
          width: "100%",
          background: "white",
        }}
      >
        {mode === "signup" ? "I already have an account" : "I need to create an account"}
      </button>

      {msg && (
        <p style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
          {msg}
        </p>
      )}

      <p style={{ marginTop: 20, color: "#666", fontSize: 13 }}>
        MVP note: This is basic email+password auth. We’ll add roles (Founder/Builder) next.
      </p>
    </div>
  );
}
