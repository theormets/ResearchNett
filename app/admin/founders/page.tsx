"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type Row = {
  user_id: string;
  email: string;
  full_name: string | null;
  department: string | null;
  created_at: string;
};

export default function AdminFounders() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true); setErr(null);
      // RLS will allow only admins to read
      const { data, error } = await supabase
        .from("founding_members")
        .select("user_id,email,full_name,department,created_at")
        .order("created_at", { ascending: false });
      if (error) setErr(error.message);
      setRows(data || []);
      setLoading(false);
    })();
  }, []);

  async function handleDelete(user_id: string) {
    if (!confirm("Remove this founding member?")) return;
    const { error } = await supabase.from("founding_members").delete().eq("user_id", user_id);
    if (!error) setRows((r) => r.filter(x => x.user_id !== user_id));
  }

  if (loading) return <p>Loading…</p>;
  if (err) return <p style={{ color: "crimson" }}>{err}</p>;

  return (
    <section>
      <h1>Founding Members</h1>
      {rows.length === 0 ? <p>No founders yet.</p> : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 10 }}>
          {rows.map(r => (
            <li key={r.user_id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <strong>{r.full_name ?? "(no name)"}</strong>
                  <div style={{ color: "#555" }}>{r.email}</div>
                  <div style={{ color: "#666" }}>{r.department ?? ""}</div>
                  <div style={{ color: "#888", fontSize: 12 }}>
                    Joined {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  <Link href={`/profiles/${r.user_id}`} style={{ textDecoration: "none" }}>
                    View profile →
                  </Link>
                  <button onClick={() => handleDelete(r.user_id)} style={{ border: "1px solid #ddd", borderRadius: 6, height: 30 }}>
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
