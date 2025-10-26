"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Call = {
  id: string;
  title: string;
  summary: string;
  collaboration_for: string | null;
  keywords: string[] | null;
  links: string[] | null;
  created_at: string;
  owner_user_id: string;
};

type Profile = {
  full_name: string;
  department: string;
  institute_url: string;
};

export default function CallDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [callData, setCallData] = useState<Call | null>(null);
  const [author, setAuthor] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    // load current user
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    async function load() {
      setErr(null); setMsg(null);
      const id = params.id;
      const { data: call, error } = await supabase
        .from("collab_calls")
        .select("id,title,summary,collaboration_for,keywords,links,created_at,owner_user_id")
        .eq("id", id)
        .maybeSingle();
      if (error || !call) { setErr("Call not found."); return; }
      setCallData(call as Call);

      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name,department,institute_url")
        .eq("user_id", (call as Call).owner_user_id)
        .maybeSingle();
      setAuthor((prof || null) as Profile | null);
    }
    load();
  }, [params.id]);

  async function handleExpressInterest() {
    setMsg(null); setErr(null);
    if (!userId) { router.push("/login"); return; }
    const { error } = await supabase
      .from("call_interest")
      .insert({ call_id: callData!.id, user_id: userId });
    if (error) setErr(error.message);
    else setMsg("Interest recorded. The author can now see your interest.");
  }

  async function handleRevisit() {
    setMsg(null); setErr(null);
    if (!userId) { router.push("/login"); return; }
    const { error } = await supabase
      .from("call_bookmarks")
      .insert({ call_id: callData!.id, user_id: userId });
    if (error) setErr(error.message);
    else setMsg("Saved to Revisit.");
  }

  async function handleDeleteOwn() {
    if (!callData) return;
    const ok = window.confirm("Remove this collab call? This cannot be undone.");
    if (!ok) return;
    const { error } = await supabase
      .from("collab_calls")
      .delete()
      .eq("id", callData.id)
      .eq("owner_user_id", userId!);
    if (error) { setErr(error.message); return; }
    router.push("/calls");
  }

  if (!callData) {
    return <section style={{ maxWidth: 800 }}><p>{err ?? "Loading..."}</p></section>;
  }

  const created = new Date(callData.created_at).toLocaleString();
  const isOwner = userId && callData.owner_user_id === userId;

  return (
    <section style={{ maxWidth: 800 }}>
      <h1 style={{ marginBottom: 4 }}>{callData.title}</h1>

      <div style={{ color: "#444", marginBottom: 6, fontSize: 14 }}>
        by{" "}
        <Link href={`/profiles/${callData.owner_user_id}`} style={{ textDecoration: "none" }}>
          {author?.full_name ?? callData.owner_user_id.slice(0, 8)}
        </Link>
        <span style={{ color: "#888" }}> • {created}</span>
      </div>

      {callData.collaboration_for && (
        <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
          Collaboration for: <strong>{callData.collaboration_for}</strong>
        </div>
      )}

      {callData.keywords && callData.keywords.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {callData.keywords.map((k) => (
            <span key={k} style={{ fontSize: 12, padding: "4px 8px", border: "1px solid #eee", background: "#fafafa", borderRadius: 999 }}>
              {k}
            </span>
          ))}
        </div>
      )}

      <div style={{ whiteSpace: "pre-wrap", color: "#222", marginBottom: 12 }}>
        {callData.summary}
      </div>

      {callData.links && callData.links.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: "#666" }}>Links</div>
          <ul style={{ margin: "6px 0 0 18px" }}>
            {callData.links.map((u) => (
              <li key={u}><a href={u} target="_blank" rel="noreferrer">{u}</a></li>
            ))}
          </ul>
        </div>
      )}

      {/* BUTTONS */}
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        {isOwner ? (
          <>
            <Link
              href={`/calls/${callData.id}/edit`}
              style={{ padding: "0.6rem 1rem", borderRadius: 8, border: "1px solid #ddd", background: "#fff", textDecoration: "none" }}
            >
              Edit
            </Link>
            <button
              onClick={handleDeleteOwn}
              style={{ padding: "0.6rem 1rem", borderRadius: 8, border: "1px solid #f5c2c7", background: "#fde2e4" }}
            >
              Remove
            </button>
          </>
        ) : (
          <>
            <button onClick={handleExpressInterest} style={{ padding: "0.6rem 1rem", borderRadius: 8, border: "1px solid #cfe7d6", background: "#e9fff0" }}>
              Express Interest
            </button>
            <button onClick={handleRevisit} style={{ padding: "0.6rem 1rem", borderRadius: 8, border: "1px solid #ddd", background: "#fff" }}>
              Revisit
            </button>
          </>
        )}
      </div>

      {msg && <div style={{ color: "green", marginTop: 10 }}>{msg}</div>}
      {err && <div style={{ color: "crimson", marginTop: 10 }}>{err}</div>}
    </section>
  );
}
