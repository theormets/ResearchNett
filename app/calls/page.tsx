"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type Call = {
  id: string;
  title: string;
  summary: string;
  created_at: string;
  keywords: string[] | null;
  owner_user_id: string;
};

type Profile = {
  user_id: string;
  full_name: string;
};

function prepTokens(q: string): string[] {
  return Array.from(
    new Set(
      q.toLowerCase().split(",").map(s => s.trim()).filter(Boolean)
    )
  ).slice(0, 10);
}

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const tokens = useMemo(() => prepTokens(query), [query]);

  useEffect(() => {
    async function load() {
      setLoading(true);

      let req = supabase
        .from("collab_calls")
        .select("id,title,summary,created_at,keywords,owner_user_id")
        .order("created_at", { ascending: false });

      if (tokens.length > 0) req = req.overlaps("keywords", tokens);

      const { data: callsData, error } = await req;
      if (!error && callsData) {
        setCalls(callsData);

        // fetch authors' names in one go
        const userIds = Array.from(new Set(callsData.map(c => c.owner_user_id)));
        if (userIds.length) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("user_id, full_name")
            .in("user_id", userIds);
          const map: Record<string, Profile> = {};
          for (const p of profs || []) map[p.user_id] = p as Profile;
          setProfiles(map);
        } else {
          setProfiles({});
        }
      }

      setLoading(false);
    }
    load();
  }, [tokens]);

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ marginBottom: 8, flex: 1 }}>Collab Calls</h1>
        <Link href="/calls/new" style={{ padding: "0.45rem 0.8rem", border: "1px solid #ccc", borderRadius: 8, textDecoration: "none" }}>
          ＋ Post a new collaboration call
        </Link>
      </div>

      {/* Search bar */}
      <div style={{ display: "flex", gap: 8, marginTop: 8, marginBottom: 6 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1, padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          placeholder="Search by keywords (comma-separated)… e.g., inorganic chemistry, computer vision"
        />
        {query && (
          <button onClick={() => setQuery("")} style={{ padding: "0.6rem 0.8rem", borderRadius: 8, border: "1px solid #ccc", background: "#f8f8f8" }}>
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : calls.length === 0 ? (
        <p style={{ color: "#555" }}>No calls found.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.75rem", marginTop: 8 }}>
          {calls.map((c) => {
            const author = profiles[c.owner_user_id]?.full_name || c.owner_user_id.slice(0, 8);
            return (
              <li key={c.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: "1rem" }}>
                {/* Title -> detail page */}
                <Link href={`/calls/${c.id}`} style={{ fontWeight: 700, textDecoration: "none" }}>
                  {c.title}
                </Link>

                {/* Author name -> public profile */}
                <div style={{ marginTop: 4, fontSize: 14 }}>
                  by{" "}
                  <Link href={`/profiles/${c.owner_user_id}`} style={{ textDecoration: "none" }}>
                    {author}
                  </Link>
                </div>

                {/* Snippet */}
                <div style={{ whiteSpace: "pre-wrap", marginTop: 6, color: "#555" }}>
                  {c.summary.length > 220 ? c.summary.slice(0, 220) + "…" : c.summary}
                </div>

                {/* keyword chips */}
                {c.keywords && c.keywords.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                    {c.keywords.map((k) => (
                      <span key={k} style={{ fontSize: 12, padding: "4px 8px", border: "1px solid #eee", background: "#fafafa", borderRadius: 999 }}>
                        {k}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ fontSize: 12, color: "#888", marginTop: 6 }}>
                  {new Date(c.created_at).toLocaleString()}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
