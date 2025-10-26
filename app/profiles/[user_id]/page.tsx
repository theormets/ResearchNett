"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  full_name: string;
  department: string;
  institute_url: string;
  scholar_url?: string | null;
  overview?: string | null;
};

export default function PublicProfilePage() {
  const { user_id } = useParams<{ user_id: string }>();
  const [p, setP] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setErr(null);
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name,department,institute_url,scholar_url,overview")
        .eq("user_id", user_id)
        .maybeSingle();

      if (error) setErr(error.message);
      setP((data || null) as Profile | null);
      setLoading(false);
    })();
  }, [user_id]);

  if (loading) return <p>Loading…</p>;

  if (err) {
    return (
      <section style={{ maxWidth: 800 }}>
        <h1>Profile</h1>
        <p style={{ color: "crimson" }}>{err}</p>
        <Link href="/calls">← Back to Collab Calls</Link>
      </section>
    );
  }

  if (!p) {
    return (
      <section style={{ maxWidth: 800 }}>
        <h1>Profile not found</h1>
        <p style={{ color: "#666" }}>
          This user hasn’t completed their profile yet or it’s unavailable.
        </p>
        <Link href="/calls">← Back to Collab Calls</Link>
      </section>
    );
  }

  return (
    <section style={{ maxWidth: 800 }}>
      <h1 style={{ marginBottom: 6 }}>{p.full_name}</h1>
      <div style={{ color: "#555", marginBottom: 10 }}>{p.department}</div>

      <div style={{ marginBottom: 12 }}>
        <strong>Institute webpage: </strong>
        <a href={p.institute_url} target="_blank" rel="noreferrer">
          {p.institute_url}
        </a>
      </div>

      {p.scholar_url && (
        <div style={{ marginBottom: 12 }}>
          <strong>Google Scholar: </strong>
          <a href={p.scholar_url} target="_blank" rel="noreferrer">
            {p.scholar_url}
          </a>
        </div>
      )}

      {p.overview && (
        <div>
          <strong>Overview</strong>
          <div style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>{p.overview}</div>
        </div>
      )}

      <div style={{ marginTop: 18 }}>
        <Link href="/calls">← Back to Collab Calls</Link>
      </div>
    </section>
  );
}
