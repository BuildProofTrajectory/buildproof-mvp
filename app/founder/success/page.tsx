"use client";

import Link from "next/link";

export default function FounderSuccessPage() {
  return (
    <div style={{ padding: 40, fontFamily: "system-ui", maxWidth: 720, margin: "0 auto" }}>
      <h1>Project Posted ✅</h1>
      <p style={{ color: "#555" }}>
        Your project has been saved. Next we’ll build the page that shows your posted projects and your recommended
        builder matches.
      </p>

      <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
        <Link
          href="/founder/intake"
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #ddd",
            textDecoration: "none",
            color: "#111",
            fontWeight: 600,
          }}
        >
          Post another project
        </Link>

        <Link
          href="/protected"
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #111",
            textDecoration: "none",
            background: "#111",
            color: "white",
            fontWeight: 700,
          }}
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}