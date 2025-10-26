"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  full_name: string;
  department: string;
  institute_url: string;
  scholar_url?: string | null;
  overview?: string | null;
};

export default function PublicProfilePage() {
  const params = useParams<{ user_id: string }>();
  const [p, setP] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const uid = params.user_id;
      if (!uid) { setLoading(false); return; }
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name,department,institute_url,scholar_url,overview")
        .eq("user_id", uid)
        .maybeSingle();

      if (!error) setP((data || null) as Profile | null);
      setLoading(false);
    }
    load();
  }, [params.user_id]);

  if (loading) return <p>Loading…</p>;

  if (!p) {
    return (
      <section style={{ maxWidth: 800 }}>
        <h1>Profile not found</h1>
        <p style={{ color: "#666" }}>
          This user hasn’t completed their profile yet or it’s unavailable.
        </p>
      </section>
    );
  }

  return (
    <section style={{ maxWidth: 800 }}>
      <h1>{p.full_name}</h1>
      <div style={{ color: "#555", marginBottom: 8 }}>{p.department}</div>
      <div style={{ marginBottom: 12 }}>
        <a href={p.institute_url} target="_blank" rel="noreferrer">{p.institute_url}</a>
      </div>
      {p.scholar_url && (
        <div style={{ marginBottom: 12 }}>
          <strong>Google Scholar: </strong>
          <a href={p.scholar_url} target="_blank" rel="noreferrer">{p.scholar_url}</a>
        </div>
      )}
      {p.overview && (
        <div>
          <strong>Overview</strong>
          <div style={{ whiteSpace: "pre-wrap" }}>{p.overview}</div>
        </div>
      )}
    </section>
  );
}
