"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

type AnswerMap = Record<string, any>;

const QUESTIONS = [
  {
    id: "today_goal",
    label: "What would you like to do today?",
    type: "select",
    options: [
      "Social media content + posting help",
      "Canva design / brand visuals",
      "Website / e-commerce improvements",
      "Email marketing / newsletters",
      "Not sure (help me decide)",
    ],
  },
  {
    id: "outcome",
    label: "What outcome would make this a win in the next 4 weeks?",
    type: "text",
    placeholder:
      "Example: 12 posts designed + scheduled and a simple content plan I can repeat.",
  },
  {
    id: "assets",
    label: "What do you already have?",
    type: "multi",
    options: [
      "Website",
      "Shopify store",
      "Instagram",
      "TikTok",
      "Canva account",
      "Brand/logo assets",
      "Email list",
      "None of the above",
    ],
  },
  {
    id: "constraints",
    label: "Anything to avoid or keep off-limits?",
    type: "multi",
    options: [
      "No banking/payment access",
      "No ad account spend management",
      "No access to customer personal data",
      "No admin access to my website",
      "Other / unsure",
    ],
  },
  {
    id: "responsiveness",
    label:
      "Quick agreement: can you reply at least 2x/week (including an end-of-week check-in)?",
    type: "select",
    options: ["Yes", "No"],
  },
  {
    id: "access_ok",
    label:
      "If needed, are you willing to provide non-sensitive access (ex: social channel permissions)?",
    type: "select",
    options: ["Yes", "No"],
  },
];

export default function FounderIntakePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [loading, setLoading] = useState(false);

  const q = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;

  const setAnswer = (value: any) => {
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
  };

  const toggleMulti = (opt: string) => {
    const current: string[] = Array.isArray(answers[q.id]) ? answers[q.id] : [];
    if (current.includes(opt)) setAnswer(current.filter((x) => x !== opt));
    else setAnswer([...current, opt]);
  };

  const canContinue = (() => {
    const val = answers[q.id];
    if (q.type === "text") return typeof val === "string" && val.trim().length > 2;
    if (q.type === "select") return typeof val === "string" && val.length > 0;
    if (q.type === "multi") return Array.isArray(val) && val.length > 0;
    return false;
  })();

  const saveAndGenerateBrief = async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        alert("Not logged in");
        router.push("/login");
        return;
      }

      const brief = {
        title: `Founder Project: ${answers.today_goal || "New Project"}`,
        goal: answers.outcome,
        inputs_available: answers.assets,
        constraints: answers.constraints,
        commitments: {
          responsiveness: answers.responsiveness,
          access_ok: answers.access_ok,
        },
        timeline: "Up to 4 weeks",
      };

      localStorage.setItem("founder_brief", JSON.stringify(brief));
      router.push("/founder/brief");
    } catch (err: any) {
      alert(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40, fontFamily: "system-ui", maxWidth: 720, margin: "0 auto" }}>
      <h1>Founder Intake</h1>
      <p style={{ color: "#666" }}>
        Step {step + 1} of {QUESTIONS.length}
      </p>

      <div style={{ marginTop: 24, padding: 20, border: "1px solid #eee", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0 }}>{q.label}</h2>

        {q.type === "text" && (
          <textarea
            value={answers[q.id] || ""}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={q.placeholder}
            rows={4}
            style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
          />
        )}

        {q.type === "select" && (
          <div style={{ display: "grid", gap: 10 }}>
            {q.options!.map((opt) => (
              <button
                key={opt}
                onClick={() => setAnswer(opt)}
                style={{
                  textAlign: "left",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: answers[q.id] === opt ? "2px solid #111" : "1px solid #ddd",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {q.type === "multi" && (
          <div style={{ display: "grid", gap: 10 }}>
            {q.options!.map((opt) => {
              const selected = Array.isArray(answers[q.id]) && answers[q.id].includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => toggleMulti(opt)}
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
                  {selected ? "✅ " : ""}
                  {opt}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || loading}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "white",
            cursor: step === 0 ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          Back
        </button>

        {!isLast ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canContinue || loading}
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid #111",
              background: canContinue ? "#111" : "#999",
              color: "white",
              cursor: canContinue ? "pointer" : "not-allowed",
              fontWeight: 700,
              flex: 1,
            }}
          >
            Continue
          </button>
        ) : (
          <button
            onClick={saveAndGenerateBrief}
            disabled={!canContinue || loading}
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid #111",
              background: canContinue ? "#111" : "#999",
              color: "white",
              cursor: canContinue ? "pointer" : "not-allowed",
              fontWeight: 700,
              flex: 1,
            }}
          >
            {loading ? "Generating..." : "Generate Brief"}
          </button>
        )}
      </div>

      <p style={{ marginTop: 14, color: "#777", fontSize: 13 }}>
        MVP note: This version stores the brief locally. Next we’ll save to Supabase and create the actual
        project post.
      </p>
    </div>
  );
}