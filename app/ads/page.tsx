"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Ad = { id: string; title: string; summary: string; created_at: string };

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("ads")
        .select("id,title,summary,created_at")
        .order("created_at", { ascending: false });
      setAds(data || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p>Loading…</p>;

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ marginBottom: 8, flex: 1 }}>Open Collaboration Ads</h1>
        <a href="/ads/new" style={{ padding: "0.4rem 0.75rem", border: "1px solid #ccc", borderRadius: 8 }}>
          + New Ad
        </a>
      </div>
      {ads.length === 0 ? (
        <p style={{ color: "#555" }}>No ads yet. Be the first to post!</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.75rem", marginTop: 16 }}>
          {ads.map((a) => (
            <li key={a.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: "1rem" }}>
              <strong>{a.title}</strong>
              <div style={{ whiteSpace: "pre-wrap", marginTop: 6, color: "#555" }}>{a.summary}</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 6 }}>
                {new Date(a.created_at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
