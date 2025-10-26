"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type FormState = {
  title: string;
  collaboration_for: "proposal" | "research" | "exploration" | "others";
  summary: string;
  links: string;    // optional: one URL per line
  keywords: string; // REQUIRED: comma-separated
};

export default function NewCallPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    title: "",
    collaboration_for: "research",
    summary: "",
    links: "",
    keywords: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  function parseLinks(raw: string): string[] | null {
    const arr = raw.split(/\r?\n|,/).map(s => s.trim()).filter(Boolean);
    if (arr.length === 0) return null;
    const valid = arr.filter(u => /^https?:\/\/\S+/i.test(u));
    return valid.length ? valid : null;
  }

  function parseKeywords(raw: string): string[] {
    const list = raw
      .split(",")
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);
    // de-duplicate and keep short
    const dedup = Array.from(new Set(list)).slice(0, 20);
    return dedup;
  }

  async function handleCreate() {
    setError(null);
    if (!userId) { setError("You must be signed in."); return; }
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.summary.trim()) { setError("Summary is required."); return; }

    const kw = parseKeywords(form.keywords);
    if (kw.length === 0) {
      setError("Please add at least one keyword (comma-separated).");
      return;
    }

    const linksArray = parseLinks(form.links);

    setSaving(true);
    const { error } = await supabase
      .from("collab_calls")
      .insert({
        owner_user_id: userId,
        title: form.title.trim(),
        summary: form.summary.trim(),
        collaboration_for: form.collaboration_for,
        links: linksArray,
        keywords: kw,
      });
    setSaving(false);

    if (error) { setError(error.message); return; }
    router.push("/calls");
  }

  return (
    <section style={{ maxWidth: 720 }}>
      <h1>Post a new collaboration call</h1>
      {!userId && <p style={{ color: "#a00" }}>You are not signed in. <a href="/login">Login</a></p>}

      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
        {/* Title (required) */}
        <label>
          <div>Title <span style={{ color: "#a00" }}>*</span></div>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
            placeholder="e.g., AI for Green Energy"
            required
          />
        </label>

        {/* Collaboration for (dropdown) */}
        <label>
          <div>Collaboration for:</div>
          <select
            value={form.collaboration_for}
            onChange={(e) =>
              setForm({ ...form, collaboration_for: e.target.value as FormState["collaboration_for"] })
            }
            style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8, background: "white" }}
          >
            <option value="proposal">proposal</option>
            <option value="research">research</option>
            <option value="exploration">exploration</option>
            <option value="others">others</option>
          </select>
        </label>

        {/* Summary (required) */}
        <label>
          <div>Summary <span style={{ color: "#a00" }}>*</span></div>
          <textarea
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8, minHeight: 120 }}
            placeholder="Briefly describe your idea indicating the nature of technical support you desire."
            required
          />
        </label>

        {/* Keywords (REQUIRED) */}
        <label>
          <div>Keywords <span style={{ color: "#a00" }}>*</span></div>
          <input
            value={form.keywords}
            onChange={(e) => setForm({ ...form, keywords: e.target.value })}
            style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
            placeholder="e.g., inorganic chemistry, condensed matter physics, discrete mathematics, computer vision, alloy development"
            required
          />
          <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
            Keywords should be separated by commas. Include a few broader keywords like <em>inorganic chemistry</em>, <em>condensed matter physics</em>, <em>discrete mathematics</em>, <em>computer vision</em>, <em>alloy development</em> to improve discoverability.
          </div>
        </label>

        {/* Links (optional) */}
        <label>
          <div>Links to relevant papers (optional)</div>
          <textarea
            value={form.links}
            onChange={(e) => setForm({ ...form, links: e.target.value })}
            style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8, minHeight: 80 }}
            placeholder={"Paste URLs (one per line) e.g.\nhttps://doi.org/...\nhttps://arxiv.org/abs/..."}
          />
        </label>

        <button onClick={handleCreate} disabled={saving} style={{ padding: "0.6rem 1rem", borderRadius: 8 }}>
          {saving ? "Saving..." : "Post call"}
        </button>

        {error && <div style={{ color: "crimson" }}>{error}</div>}
      </div>
    </section>
  );
}
