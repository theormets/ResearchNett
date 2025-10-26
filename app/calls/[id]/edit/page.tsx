"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type FormState = {
  title: string;
  collaboration_for: "proposal" | "research" | "exploration" | "others";
  summary: string;
  links: string;    // textarea, one URL per line
  keywords: string; // comma-separated
};

export default function EditCallPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    title: "",
    collaboration_for: "research",
    summary: "",
    links: "",
    keywords: "",
  });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    (async () => {
      setErr(null);
      const { data, error } = await supabase
        .from("collab_calls")
        .select("title, summary, collaboration_for, links, keywords, owner_user_id")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) { setErr("Call not found."); setLoading(false); return; }
      if (userId && data.owner_user_id !== userId) {
        setErr("You are not allowed to edit this call.");
        setLoading(false);
        return;
      }

      setForm({
        title: data.title ?? "",
        collaboration_for: (data.collaboration_for ?? "research") as FormState["collaboration_for"],
        summary: data.summary ?? "",
        links: (data.links || []).join("\n"),
        keywords: (data.keywords || []).join(", "),
      });
      setLoading(false);
    })();
  }, [id, userId]);

  function parseLinks(raw: string): string[] | null {
    const arr = raw.split(/\r?\n|,/).map(s => s.trim()).filter(Boolean);
    if (arr.length === 0) return null;
    const valid = arr.filter(u => /^https?:\/\/\S+/i.test(u));
    return valid.length ? valid : null;
  }
  function parseKeywords(raw: string): string[] {
    const list = raw.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
    return Array.from(new Set(list)).slice(0, 20);
  }

  async function handleSave() {
    setErr(null);
    if (!userId) { setErr("You must be signed in."); return; }
    if (!form.title.trim()) { setErr("Title is required."); return; }
    if (!form.summary.trim()) { setErr("Summary is required."); return; }
    const kw = parseKeywords(form.keywords);
    if (kw.length === 0) { setErr("Please add at least one keyword."); return; }

    const linksArray = parseLinks(form.links);
    setSaving(true);
    const { error } = await supabase
      .from("collab_calls")
      .update({
        title: form.title.trim(),
        summary: form.summary.trim(),
        collaboration_for: form.collaboration_for,
        links: linksArray,
        keywords: kw,
      })
      .eq("id", id)
      .eq("owner_user_id", userId); // extra safety

    setSaving(false);
    if (error) { setErr(error.message); return; }
    router.push(`/calls/${id}`);
  }

  if (loading) return <p>Loading…</p>;
  if (err) return <p style={{ color: "crimson" }}>{err}</p>;

  return (
    <section style={{ maxWidth: 720 }}>
      <h1>Edit collaboration call</h1>

      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <label>
          <div>Title</div>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
        </label>

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

        <label>
          <div>Summary</div>
          <textarea
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8, minHeight: 120 }}
          />
        </label>

        <label>
          <div>Keywords</div>
          <input
            value={form.keywords}
            onChange={(e) => setForm({ ...form, keywords: e.target.value })}
            style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
            placeholder="comma-separated"
          />
        </label>

        <label>
          <div>Links to relevant papers (optional)</div>
          <textarea
            value={form.links}
            onChange={(e) => setForm({ ...form, links: e.target.value })}
            style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8, minHeight: 80 }}
            placeholder={"one URL per line"}
          />
        </label>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleSave} disabled={saving} style={{ padding: "0.6rem 1rem", borderRadius: 8 }}>
            {saving ? "Saving…" : "Save"}
          </button>
          <button onClick={() => router.push(`/calls/${id}`)} style={{ padding: "0.6rem 1rem", borderRadius: 8, border: "1px solid #ddd", background: "#fff" }}>
            Cancel
          </button>
        </div>

        {err && <div style={{ color: "crimson" }}>{err}</div>}
      </div>
    </section>
  );
}
