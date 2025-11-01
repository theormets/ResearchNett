"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type RequestRow = {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  department: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  decided_at: string | null;
  decided_by: string | null;
  decision_note: string | null;
};

export default function AdminFounders() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [me, setMe] = useState<string | null>(null); // current admin user_id
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null); // which row we're updating

  // load all founder requests (RLS: only admins should pass)
  async function loadRequests() {
    setLoading(true);
    setErr(null);

    // who am I
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr) {
      setErr(authErr.message);
      setLoading(false);
      return;
    }
    const uid = authData.user?.id ?? null;
    setMe(uid);

    // now fetch all requests
    const { data, error } = await supabase
      .from("founding_member_requests")
      .select(
        "id,user_id,email,full_name,department,status,created_at,decided_at,decided_by,decision_note"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setErr(error.message);
      setRows([]);
    } else {
      setRows(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadRequests();
  }, []);

  // Approve or reject handler
  const handleDecision = useCallback(
    async (reqId: string, newStatus: "approved" | "rejected") => {
      if (!me) {
        alert("No admin user found in session.");
        return;
      }

      const confirmText =
        newStatus === "approved"
          ? "Approve this request and mark as founding member?"
          : "Reject this request?";
      if (!window.confirm(confirmText)) return;

      setActingId(reqId);

      // We set decided_at = now(), decided_by = me, and status = newStatus.
      const { error } = await supabase
        .from("founding_member_requests")
        .update({
          status: newStatus,
          decided_at: new Date().toISOString(),
          decided_by: me,
          decision_note: null, // you could prompt later for a note
        })
        .eq("id", reqId);

      setActingId(null);

      if (error) {
        alert("Could not update status: " + error.message);
        return;
      }

      // optimistic update locally so we don't reload the page
      setRows((old) =>
        old.map((r) =>
          r.id === reqId
            ? {
                ...r,
                status: newStatus,
                decided_at: new Date().toISOString(),
                decided_by: me,
              }
            : r
        )
      );
    },
    [me]
  );

  if (loading) return <p>Loading…</p>;
  if (err) return <p style={{ color: "crimson" }}>{err}</p>;

  return (
    <section style={{ maxWidth: 1000 }}>
      <h1>Founding Member Requests</h1>
      <p style={{ color: "#555", marginBottom: 16 }}>
        Everyone who clicked “Join as Founding member”. You can approve or
        reject each request here.
      </p>

      {rows.length === 0 ? (
        <p>No requests yet.</p>
      ) : (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            display: "grid",
            gap: 12,
          }}
        >
          {rows.map((r) => (
            <li
              key={r.id}
              style={{
                border: "1px solid #eee",
                borderRadius: 8,
                padding: 12,
                background:
                  r.status === "approved"
                    ? "#e6ffed"
                    : r.status === "rejected"
                    ? "#ffecec"
                    : "#fff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                {/* left side */}
                <div style={{ minWidth: 240 }}>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>
                    {r.full_name ?? "(no name)"}{" "}
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        marginLeft: 8,
                        padding: "2px 6px",
                        borderRadius: 6,
                        background:
                          r.status === "approved"
                            ? "#10b98133"
                            : r.status === "rejected"
                            ? "#ef444433"
                            : "#e5e7eb",
                        border:
                          r.status === "approved"
                            ? "1px solid #10b981"
                            : r.status === "rejected"
                            ? "1px solid #ef4444"
                            : "1px solid #9ca3af",
                        color:
                          r.status === "approved"
                            ? "#065f46"
                            : r.status === "rejected"
                            ? "#7f1d1d"
                            : "#374151",
                      }}
                    >
                      {r.status}
                    </span>
                  </div>

                  <div style={{ color: "#555" }}>{r.email}</div>
                  <div style={{ color: "#666" }}>
                    {r.department ?? ""}
                  </div>

                  <div style={{ color: "#888", fontSize: 12, marginTop: 6 }}>
                    Requested:&nbsp;
                    {new Date(r.created_at).toLocaleString()}
                  </div>

                  {r.decided_at && (
                    <div style={{ color: "#888", fontSize: 12 }}>
                      Decided:&nbsp;
                      {new Date(r.decided_at).toLocaleString()}
                    </div>
                  )}

                  <div style={{ marginTop: 8 }}>
                    <Link
                      href={`/profiles/${r.user_id}`}
                      style={{ textDecoration: "none", fontSize: 14 }}
                    >
                      View profile →
                    </Link>
                  </div>
                </div>

                {/* right side actions */}
                <div
                  style={{
                    display: "grid",
                    gap: 8,
                    alignContent: "flex-start",
                    minWidth: 140,
                  }}
                >
                  <button
                    disabled={
                      actingId === r.id ||
                      r.status === "approved"
                    }
                    onClick={() =>
                      handleDecision(r.id, "approved")
                    }
                    style={{
                      border: "1px solid #059669",
                      borderRadius: 6,
                      padding: "8px 10px",
                      background:
                        r.status === "approved"
                          ? "#d1fae5"
                          : "#ecfdf5",
                      fontWeight: 600,
                      cursor:
                        r.status === "approved"
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {actingId === r.id && r.status !== "approved"
                      ? "Approving…"
                      : "Approve"}
                  </button>

                  <button
                    disabled={
                      actingId === r.id ||
                      r.status === "rejected"
                    }
                    onClick={() =>
                      handleDecision(r.id, "rejected")
                    }
                    style={{
                      border: "1px solid #dc2626",
                      borderRadius: 6,
                      padding: "8px 10px",
                      background:
                        r.status === "rejected"
                          ? "#fee2e2"
                          : "#fef2f2",
                      fontWeight: 600,
                      cursor:
                        r.status === "rejected"
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {actingId === r.id && r.status !== "rejected"
                      ? "Rejecting…"
                      : "Reject"}
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
