"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type CallLite = { id: string; title: string };
type Interest = { call_id: string; user_id: string; created_at: string };

export default function NotificationsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [myCalls, setMyCalls] = useState<CallLite[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { full_name: string; department: string }>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Map for quick lookup
  const callTitleById = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of myCalls) m[c.id] = c.title;
    return m;
  }, [myCalls]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr(null);

      // who am I?
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;
      setUserId(uid);
      if (!uid) { setLoading(false); return; }

      // 1) fetch my calls (I am the owner)
      const { data: calls, error: callsErr } = await supabase
        .from("collab_calls")
        .select("id,title")
        .eq("owner_user_id", uid)
        .order("created_at", { ascending: false });

      if (callsErr) { setErr(callsErr.message); setLoading(false); return; }
      setMyCalls(calls || []);
      const callIds = (calls || []).map(c => c.id);
      if (callIds.length === 0) { setLoading(false); return; }

      // 2) fetch interests for those call ids
      const { data: ints, error: intsErr } = await supabase
        .from("call_interest")
        .select("call_id,user_id,created_at")
        .in("call_id", callIds)
        .order("created_at", { ascending: false });

      if (intsErr) { setErr(intsErr.message); setLoading(false); return; }
      setInterests(ints || []);

      // 3) fetch the profiles of users who expressed interest
      const uniqueUserIds = Array.from(new Set((ints || []).map(r => r.user_id)));
      if (uniqueUserIds.length) {
        const { data: profs, error: profErr } = await supabase
          .from("profiles")
          .select("user_id, full_name, department")
          .in("user_id", uniqueUserIds);

        if (!profErr) {
          const map: Record<string, { full_name: string; department: string }> = {};
          for (const p of profs || []) {
            map[(p as any).user_id] = {
              full_name: (p as any).full_name,
              department: (p as any).department,
            };
          }
          setProfiles(map);
        }
      }

      setLoading(false);
    }

    load();
  }, []);

  if (loading) return <p>Loading…</p>;

  if (!userId) {
    return (
      <section>
        <h1>Notifications</h1>
        <p>You are not signed in.</p>
        <a href="/login">Go to Login</a>
      </section>
    );
  }

  return (
    <section style={{ maxWidth: 900 }}>
      <h1>Notifications</h1>
      <p style={{ color: "#666" }}>
        People who expressed interest in your Collab Calls.
      </p>

      {err && <div style={{ color: "crimson", marginTop: 8 }}>{err}</div>}

      {myCalls.length === 0 ? (
        <p style={{ color: "#666", marginTop: 10 }}>You haven’t posted any calls yet.</p>
      ) : interests.length === 0 ? (
        <p style={{ color: "#666", marginTop: 10 }}>No new interests yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 10, marginTop: 12 }}>
          {interests.map((r, idx) => {
            const callTitle = callTitleById[r.call_id] ?? "(Untitled call)";
            const prof = profiles[r.user_id];
            const name = prof?.full_name ?? r.user_id.slice(0, 8);
            const dept = prof?.department ? ` — ${prof.department}` : "";

            return (
              <li key={r.call_id + r.user_id + idx} style={{ border: "1px solid #eee", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ marginBottom: 6 }}>
                  <strong>
                    <Link href={`/profiles/${r.user_id}`} style={{ textDecoration: "none" }}>
                      {name}
                    </Link>
                  </strong>
                  <span style={{ color: "#777" }}>{dept}</span>
                  <span style={{ color: "#aaa", fontSize: 12, marginLeft: 8 }}>
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                </div>
                <div style={{ color: "#333" }}>
                  showed interest in{" "}
                  <Link href={`/calls/${r.call_id}`} style={{ textDecoration: "none", fontWeight: 600 }}>
                    {callTitle}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
