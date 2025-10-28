"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";   // avoid static prerender for this page
export const revalidate = 0;

export default function FeedbackPage() {
  return (
    <Suspense fallback={<section><h1>Feedback</h1><p>Loading…</p></section>}>
      <FeedbackForm />
    </Suspense>
  );
}

function FeedbackForm() {
  const router = useRouter();
  const search = useSearchParams(); // now safely inside Suspense
  const fromPath = useMemo(() => search.get("from") || "/", [search]);

  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [kind, setKind] = useState<"bug" | "suggestion">("bug");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      setUserId(u?.id ?? null);
      setEmail(u?.email ?? null);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!userId || !email) { router.push("/login"); return; }
    if (!message.trim()) { setErr("Please describe the bug/suggestion."); return; }

    setSaving(true);
    const { error } = await supabase.from("feedbacks").insert({
      user_id: userId,
      email,
      kind,
      message: message.trim(),
      page_path: fromPath,
    });
    setSaving(false);

    if (error) setErr(error.message);
    else {
      alert("Thank you! Your feedback has been recorded.");
      router.push(fromPath || "/");
    }
  }

  return (
    <section style={{ maxWidth: 720 }}>
      <h1>Report a bug / Make a suggestion</h1>
      <p style={{ color: "#666" }}>
        You’re giving feedback about: <code>{fromPath}</code>
      </p>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 12 }}>
        <label>
          <div>Type</div>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as "bug" | "suggestion")}
            style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8, background: "#fff" }}
          >
            <option value="bug">Bug</option>
            <option value="suggestion">Suggestion</option>
          </select>
        </label>

        <label>
          <div>Description</div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe the issue or your suggestion..."
            style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8, minHeight: 140 }}
            required
          />
        </label>

        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" disabled={saving} style={{ padding: "0.6rem 1rem", borderRadius: 8 }}>
            {saving ? "Submitting..." : "Submit"}
          </button>
          <button
            type="button"
            onClick={() => router.push(fromPath || "/")}
            style={{ padding: "0.6rem 1rem", borderRadius: 8, border: "1px solid #ddd", background: "#fff" }}
          >
            Cancel
          </button>
        </div>

        {err && <div style={{ color: "crimson" }}>{err}</div>}
      </form>
    </section>
  );
}
