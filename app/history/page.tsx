"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type CallLite = { id: string; title: string };
type InterestRow = { created_at: string; collab_calls: CallLite };
type BookmarkRow = { created_at: string; collab_calls: CallLite };

export default function HistoryPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [interests, setInterests] = useState<InterestRow[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (!uid) { setLoading(false); return; }

      setErr(null);
      setLoading(true);

      // Expressed Interest (inner join ensures collab_calls is present)
      const { data: ints, error: intsErr } = await supabase
        .from("call_interest")
        .select("created_at, collab_calls!inner(id,title)")
        .eq("user_id", uid)
        .order("created_at", { ascending: false }) as unknown as {
          data: InterestRow[] | null; error: { message: string } | null;
        };

      if (intsErr) {
        setErr(intsErr.message);
      } else {
        setInterests(ints ?? []);
      }

      // Revisit / Bookmarks (inner join)
      const { data: bms, error: bmsErr } = await supabase
        .from("call_bookmarks")
        .select("created_at, collab_calls!inner(id,title)")
        .eq("user_id", uid)
        .order("created_at", { ascending: false }) as unknown as {
          data: BookmarkRow[] | null; error: { message: string } | null;
        };

      if (bmsErr) {
        setErr((prev) => prev ?? bmsErr.message);
      } else {
        setBookmarks(bms ?? []);
      }

      setLoading(false);
    });
  }, []);

  if (loading) return <p>Loading…</p>;

  if (!userId) {
    return (
      <section>
        <h1>History</h1>
        <p>You are not signed in.</p>
        <a href="/login">Go to Login</a>
      </section>
    );
  }

  return (
    <section style={{ maxWidth: 900 }}>
      <h1>History</h1>
      {err && <div style={{ color: "crimson", marginTop: 8 }}>{err}</div>}

      {/* Expressed Interest */}
      <div style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Expressed Interest</h2>
        {interests.length === 0 ? (
          <p style={{ color: "#666" }}>No items yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 10 }}>
            {interests.map((r, idx) => (
              <li key={r.collab_calls.id + idx} style={{ border: "1px solid #eee", borderRadius: 8, padding: "10px 12px" }}>
                <Link href={`/calls/${r.collab_calls.id}`} style={{ fontWeight: 600, textDecoration: "none" }}>
                  {r.collab_calls.title}
                </Link>
                <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                  Expressed on {new Date(r.created_at).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Revisit */}
      <div style={{ marginTop: 22 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Revisit</h2>
        {bookmarks.length === 0 ? (
          <p style={{ color: "#666" }}>No items yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 10 }}>
            {bookmarks.map((r, idx) => (
              <li key={r.collab_calls.id + idx} style={{ border: "1px solid #eee", borderRadius: 8, padding: "10px 12px" }}>
                <Link href={`/calls/${r.collab_calls.id}`} style={{ fontWeight: 600, textDecoration: "none" }}>
                  {r.collab_calls.title}
                </Link>
                <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                  Saved on {new Date(r.created_at).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
