"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function NewAdPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", summary: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  async function handleCreate() {
    setError(null);
    if (!userId) { setError("You must be signed in."); return; }
    if (!form.title.trim() || !form.summary.trim()) {
      setError("Title and summary are required."); return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("ads")
      .insert({ owner_user_id: userId, title: form.title.trim(), summary: form.summary.trim() });
    setSaving(false);
    if (error) { setError(error.message); return; }
    router.push("/ads");
  }

  return (
    <section style={{ maxWidth: 600 }}>
      <h1>Create a Collaboration Ad</h1>
      {!userId && <p style={{ color: "#a00" }}>You are not signed in. <a href="/login">Login</a></p>}
      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <label>
          <div>Title</div>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
            placeholder="e.g., Digital pathology pipeline"
          />
        </label>
        <label>
          <div>Summary</div>
          <textarea
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8, minHeight: 120 }}
            placeholder="What you’re working on, what you offer, what you need"
          />
        </label>
        <button onClick={handleCreate} disabled={saving} style={{ padding: "0.6rem 1rem", borderRadius: 8 }}>
          {saving ? "Saving..." : "Create Ad"}
        </button>
        {error && <div style={{ color: "crimson" }}>{error}</div>}
      </div>
    </section>
  );
}
