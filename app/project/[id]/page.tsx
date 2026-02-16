"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";

type Project = {
  id: number;
  title: string | null;
  goal: string | null;
  status: string | null;
  founder_id: string;
  assigned_builder_id: string | null;
  category: string | null;
  created_at: string;
};

type Task = {
  id: string;
  title: string;
  is_done: boolean;
  created_at: string;
};

type Message = {
  id: string;
  sender_id: string | null;
  body: string;
  created_at: string;
};

type Update = {
  id: string;
  author_id: string | null;
  week_ending: string | null;
  summary: string;
  blockers: string | null;
  next_steps: string | null;
  created_at: string;
};

export default function ProjectWorkspacePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [meId, setMeId] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [updates, setUpdates] = useState<Update[]>([]);

  const [newTask, setNewTask] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const [weekEnding, setWeekEnding] = useState("");
  const [summary, setSummary] = useState("");
  const [blockers, setBlockers] = useState("");
  const [nextSteps, setNextSteps] = useState("");

  const isParticipant = useMemo(() => {
    if (!meId || !project) return false;
    return meId === project.founder_id || meId === project.assigned_builder_id;
  }, [meId, project]);

  const backHref = useMemo(() => {
    if (!meId || !project) return "/protected";
    if (meId === project.founder_id) return "/founder";
    if (meId === project.assigned_builder_id) return "/builder/active";
    return "/protected";
  }, [meId, project]);

  const loadAll = async () => {
    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;

    if (!user) {
      router.push("/login");
      return;
    }
    setMeId(user.id);

    // Load project (should only be visible to participants via RLS)
    const { data: p, error: pErr } = await supabase
      .from("projects")
      .select("id,title,goal,status,founder_id,assigned_builder_id,category,created_at")
      .eq("id", projectId)
      .maybeSingle();

    if (pErr) {
      alert(pErr.message);
      setLoading(false);
      return;
    }

    if (!p) {
      alert("Project not found (or you don't have access).");
      router.push("/protected");
      return;
    }

    setProject(p as Project);

    // Tasks
    const { data: t, error: tErr } = await supabase
      .from("project_tasks")
      .select("id,title,is_done,created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (tErr) alert(tErr.message);
    setTasks((t as Task[]) || []);

    // Messages
    const { data: m, error: mErr } = await supabase
      .from("project_messages")
      .select("id,sender_id,body,created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (mErr) alert(mErr.message);
    setMessages((m as Message[]) || []);

    // Updates (weekly check-ins)
    const { data: u, error: uErr } = await supabase
      .from("project_updates")
      .select("id,author_id,week_ending,summary,blockers,next_steps,created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (uErr) alert(uErr.message);
    setUpdates((u as Update[]) || []);

    setLoading(false);
  };

  useEffect(() => {
    if (!Number.isNaN(projectId)) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const addTask = async () => {
    if (!newTask.trim()) return;
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) return;

    const { error } = await supabase.from("project_tasks").insert({
      project_id: projectId,
      title: newTask.trim(),
      created_by: user.id,
    });

    if (error) return alert(error.message);

    setNewTask("");
    await loadAll();
  };

  const toggleTask = async (task: Task) => {
    const { error } = await supabase
      .from("project_tasks")
      .update({ is_done: !task.is_done })
      .eq("id", task.id);

    if (error) return alert(error.message);
    await loadAll();
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) return;

    const { error } = await supabase.from("project_messages").insert({
      project_id: projectId,
      sender_id: user.id,
      body: newMessage.trim(),
    });

    if (error) return alert(error.message);

    setNewMessage("");
    await loadAll();
  };

  const addWeeklyCheckIn = async () => {
    if (!summary.trim()) return alert("Add a summary first.");

    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) return;

    const { error } = await supabase.from("project_updates").insert({
      project_id: projectId,
      author_id: user.id,
      week_ending: weekEnding ? weekEnding : null,
      summary: summary.trim(),
      blockers: blockers.trim() ? blockers.trim() : null,
      next_steps: nextSteps.trim() ? nextSteps.trim() : null,
    });

    if (error) return alert(error.message);

    setWeekEnding("");
    setSummary("");
    setBlockers("");
    setNextSteps("");
    await loadAll();
  };

  if (loading) {
    return <div style={{ padding: 40, fontFamily: "system-ui" }}>Loading…</div>;
  }

  if (!project) {
    return <div style={{ padding: 40, fontFamily: "system-ui" }}>No project.</div>;
  }

  if (!isParticipant) {
    return (
      <div style={{ padding: 40, fontFamily: "system-ui" }}>
        You don’t have access to this workspace.
      </div>
    );
  }

  return (
    <div style={{ padding: 40, fontFamily: "system-ui", maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>Project Workspace</h1>
          <div style={{ color: "#555" }}>
            <b>{project.title}</b> • Status: <b>{project.status}</b> • Category: {project.category || "—"}
          </div>
          <p style={{ color: "#666", marginTop: 10 }}>{project.goal}</p>
        </div>

        <Link
          href={backHref}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #ddd",
            textDecoration: "none",
            color: "#111",
            fontWeight: 800,
            whiteSpace: "nowrap",
            height: "fit-content",
          }}
        >
          Back
        </Link>
      </div>

      {/* Checklist */}
      <section style={{ marginTop: 24, padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0 }}>Checklist</h2>

        <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a checklist item…"
            style={{ flex: 1, minWidth: 260, padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
          />
          <button
            onClick={addTask}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #111",
              background: "#111",
              color: "white",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Add
          </button>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
          {tasks.length === 0 ? (
            <div style={{ color: "#666" }}>No checklist items yet.</div>
          ) : (
            tasks.map((t) => (
              <label key={t.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input type="checkbox" checked={t.is_done} onChange={() => toggleTask(t)} />
                <span style={{ textDecoration: t.is_done ? "line-through" : "none" }}>{t.title}</span>
              </label>
            ))
          )}
        </div>
      </section>

      {/* Weekly check-in */}
      <section style={{ marginTop: 16, padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0 }}>Weekly Check-In (required)</h2>

        <div style={{ display: "grid", gap: 10 }}>
          <input
            value={weekEnding}
            onChange={(e) => setWeekEnding(e.target.value)}
            placeholder="Week ending date (YYYY-MM-DD) optional"
            style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
          />
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Summary (what did you do this week?)"
            style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd", minHeight: 90 }}
          />
          <textarea
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            placeholder="Blockers (optional)"
            style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd", minHeight: 70 }}
          />
          <textarea
            value={nextSteps}
            onChange={(e) => setNextSteps(e.target.value)}
            placeholder="Next steps (optional)"
            style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd", minHeight: 70 }}
          />

          <button
            onClick={addWeeklyCheckIn}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #111",
              background: "#111",
              color: "white",
              fontWeight: 900,
              cursor: "pointer",
              width: "fit-content",
            }}
          >
            Post Check-In
          </button>
        </div>

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          {updates.length === 0 ? (
            <div style={{ color: "#666" }}>No check-ins yet.</div>
          ) : (
            updates.map((u) => (
              <div key={u.id} style={{ padding: 12, border: "1px solid #eee", borderRadius: 10 }}>
                <div style={{ fontWeight: 900 }}>
                  {u.week_ending ? `Week ending ${u.week_ending}` : "Check-in"}{" "}
                  <span style={{ color: "#777", fontWeight: 500 }}>
                    • {new Date(u.created_at).toLocaleString()}
                  </span>
                </div>
                <div style={{ marginTop: 8 }}>{u.summary}</div>
                {u.blockers ? (
                  <div style={{ marginTop: 8, color: "#555" }}>
                    <b>Blockers:</b> {u.blockers}
                  </div>
                ) : null}
                {u.next_steps ? (
                  <div style={{ marginTop: 8, color: "#555" }}>
                    <b>Next:</b> {u.next_steps}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Messages */}
      <section style={{ marginTop: 16, padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0 }}>Messages</h2>

        <div style={{ display: "grid", gap: 10 }}>
          <div
            style={{
              display: "grid",
              gap: 8,
              maxHeight: 260,
              overflow: "auto",
              padding: 10,
              border: "1px solid #eee",
              borderRadius: 10,
            }}
          >
            {messages.length === 0 ? (
              <div style={{ color: "#666" }}>No messages yet.</div>
            ) : (
              messages.map((m) => (
                <div key={m.id} style={{ padding: 10, border: "1px solid #f0f0f0", borderRadius: 10 }}>
                  <div style={{ fontSize: 12, color: "#777" }}>
                    {m.sender_id === meId ? "You" : "Them"} • {new Date(m.created_at).toLocaleString()}
                  </div>
                  <div style={{ marginTop: 6 }}>{m.body}</div>
                </div>
              ))
            )}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Write a message…"
              style={{ flex: 1, minWidth: 260, padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
            />
            <button
              onClick={sendMessage}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #111",
                background: "#111",
                color: "white",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Send
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}