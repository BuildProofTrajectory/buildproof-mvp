"use client";

import { supabase } from "../../lib/supabaseClient";

export default function SubscribePage() {
  const handleSubscribe = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        alert("Please log in first.");
        window.location.href = "/login";
        return;
      }

      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      });

      if (!res.ok) {
        const text = await res.text();
        alert("API error ❌\n\n" + text);
        return;
      }

      const dataJson = await res.json();

      if (!dataJson.url) {
        alert("No URL returned ❌\n\n" + JSON.stringify(dataJson, null, 2));
        return;
      }

      window.location.href = dataJson.url;
    } catch (err: any) {
      alert("Something went wrong ❌\n\n" + (err?.message || String(err)));
    }
  };

  return (
    <div style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1>Builder Membership</h1>
      <p>$19/month</p>

      <button
        onClick={handleSubscribe}
        style={{
          padding: "12px 16px",
          borderRadius: 10,
          border: "1px solid #ddd",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Subscribe
      </button>
    </div>
  );
}
