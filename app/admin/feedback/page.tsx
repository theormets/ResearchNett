"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type Row = {
  id: string;
  created_at: string;
  email: string;
  kind: "bug" | "suggestion";
  message: string;
  page_path: string | null;
  user_id: string;
};

export default function AdminFeedback() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true); setErr(null);
      // gate: only admins will pass RLS
      const { data, error } = await supabase
        .from("feedbacks")
        .select("id,created_at,email,kind,message,page_path,user_id")
        .order("created_at", { ascending: false });
      if (error) setErr(error.message);
      setRows(data || []);
      setLoading(false);
    })();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this feedback?")) return;
    const { error } = await supabase.from("feedbacks").delete().eq("id", id);
    if (!error) setRows((r) => r.filter(x => x.id !== id));
  }

  if (loading) return <p>Loading…</p>;
  if (err) return <p style={{ color: "crimson" }}>{err}</p>;

  return (
    <section>
      <h1>Feedback</h1>
      {rows.length === 0 ? <p>No feedback yet.</p> : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 10 }}>
          {rows.map(r => (
            <li key={r.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <strong>{r.kind.toUpperCase()}</strong> • {new Date(r.created_at).toLocaleString()}
                  <div style={{ color: "#555" }}>
                    From: <Link href={`/profiles/${r.user_id}`}>{r.email}</Link>
                  </div>
                  {r.page_path && <div style={{ color: "#888" }}>Page: <code>{r.page_path}</code></div>}
                </div>
                <button onClick={() => handleDelete(r.id)} style={{ border: "1px solid #ddd", borderRadius: 6, height: 30 }}>
                  Delete
                </button>
              </div>
              <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{r.message}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
