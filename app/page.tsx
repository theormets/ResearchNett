"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [username, setUsername] = useState<string>("");
  const [uid, setUid] = useState<string | null>(null);

  // notification state
  const [notifCount, setNotifCount] = useState<number>(0);
  const [showToast, setShowToast] = useState<boolean>(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      const email = u?.email ?? "";
      setAuthed(!!u);
      setUid(u?.id ?? null);
      if (email) setUsername(email.split("@")[0]);
    });
  }, []);

  // Load "new" notifications only for signed-in users on the home page
  useEffect(() => {
    if (!uid) return;

    (async () => {
      // 1) Find calls I own
      const { data: myCalls, error: callsErr } = await supabase
        .from("collab_calls")
        .select("id")
        .eq("owner_user_id", uid);

      if (callsErr || !myCalls || myCalls.length === 0) {
        setNotifCount(0);
        setShowToast(false);
        return;
      }

      const callIds = myCalls.map((c) => c.id);

      // 2) Find latest interests on those calls
      // Get interests newer than lastSeen (localStorage)
      const key = `notif_last_seen_${uid}`;
      const lastSeenRaw = localStorage.getItem(key);
      const lastSeen = lastSeenRaw ? new Date(lastSeenRaw) : null;

      // If we have a lastSeen timestamp, we can filter client-side; to keep
      // the query simple (and RLS-friendly), pull a recent window and filter here.
      const { data: interests, error: intsErr } = await supabase
        .from("call_interest")
        .select("created_at, call_id")
        .in("call_id", callIds)
        .order("created_at", { ascending: false })
        .limit(200); // recent window

      if (intsErr || !interests) {
        setNotifCount(0);
        setShowToast(false);
        return;
      }

      let count = 0;
      if (!lastSeen) {
        // If the user has never "seen" notifications, consider the presence of any interest as new.
        count = interests.length;
      } else {
        const seenMs = lastSeen.getTime();
        count = interests.filter((r) => new Date(r.created_at).getTime() > seenMs).length;
      }

      setNotifCount(count);
      setShowToast(count > 0);
    })();
  }, [uid]);

  function markNotificationsSeen() {
    if (!uid) return;
    localStorage.setItem(`notif_last_seen_${uid}`, new Date().toISOString());
    setShowToast(false);
    setNotifCount(0);
  }

  // ===== Signed-out view =====
  if (authed === false) {
    return (
      <main style={{ maxWidth: 1100, margin: "0 auto" }}>
        <section
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 16,
            marginTop: 24,
            padding: "48px 28px",
            background:
              "radial-gradient(1200px 400px at 10% -10%, #dfe9ff 0%, transparent 50%), radial-gradient(900px 400px at 100% -30%, #e6ffee 0%, transparent 50%), linear-gradient(180deg, #ffffff 0%, #fafafa 100%)",
            border: "1px solid #eee",
          }}
        >
          <div style={{ maxWidth: 760 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                background: "#f1f5ff",
                border: "1px solid #dce7ff",
                color: "#2548a3",
                padding: "6px 10px",
                borderRadius: 999,
                marginBottom: 12,
              }}
            >
              <span>Campus-verified</span>
              <span style={{ opacity: 0.5 }}>•</span>
              <span>@nitt.edu only</span>
            </div>

            <h1 style={{ fontSize: 34, lineHeight: 1.15, margin: "6px 0 10px" }}>
              Welcome to <span style={{ fontWeight: 700 }}>ResearchNett</span>
            </h1>
            <p style={{ color: "#444", fontSize: 18, margin: "0 0 18px" }}>
              A portal to find an accessible collaborator for your research.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 6 }}>
              <Link
                href="/login"
                style={{
                  display: "inline-block",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "1px solid #cfd6ff",
                  background: "#e9edff",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Login with @nitt.edu
              </Link>
              <span style={{ alignSelf: "center", color: "#666", fontSize: 14 }}>
                Create your profile and start posting collaboration calls.
              </span>
            </div>
          </div>

          <div
            aria-hidden
            style={{
              position: "absolute",
              right: -60,
              top: -60,
              width: 220,
              height: 220,
              borderRadius: "50%",
              background:
                "radial-gradient(closest-side, rgba(120,180,255,0.25), rgba(120,180,255,0))",
              filter: "blur(2px)",
            }}
          />
        </section>

        <section style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>Why use ResearchNett?</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 14,
            }}
          >
            <FeatureCard
              title="Collab Calls"
              desc="Post structured calls with goals, needs, and links. Discover calls around your interest."
            />
            <FeatureCard
              title="@nitt.edu Verified"
              desc="Only campus accounts can sign up, keeping outreach relevant and trusted."
            />
            <FeatureCard
              title="Profiles that help"
              desc="Name, department, institute page, and optional Scholar link help others know your work."
            />
            <FeatureCard
              title="Built for teams"
              desc="Form region-friendly collaborations quickly and reduce back-and-forth on basics."
            />
          </div>
        </section>
      </main>
    );
  }

  // ===== Signed-in view =====
  if (authed === true) {
    return (
      <main style={{ maxWidth: 1100, margin: "0 auto" }}>
        <section
          style={{
            border: "1px solid #eee",
            borderRadius: 16,
            padding: "28px 24px",
            marginTop: 24,
            background:
              "linear-gradient(180deg, rgba(245,250,255,0.9), #ffffff 60%), radial-gradient(600px 160px at 100% -10%, #f4fff2 0%, transparent 50%)",
          }}
        >
          <h1 style={{ fontSize: 26, margin: "0 0 6px" }}>
            Welcome, <span style={{ fontWeight: 700 }}>{username || "researcher"}</span>
          </h1>
          <p style={{ color: "#555", margin: "0 0 16px" }}>
            What would you like to do today?
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 14,
            }}
          >
            {/* Post a new collab call */}
            <Link href="/calls/new" style={{ textDecoration: "none" }}>
              <div style={card}>
                <div style={iconWrap}><MegaphoneIcon /></div>
                <div>
                  <div style={cardTitle}>Post a new collab call</div>
                  <div style={cardDesc}>
                    Announce your idea, needs, and links—invite campus collaborators.
                  </div>
                </div>
              </div>
            </Link>

            {/* Explore collab calls */}
            <Link href="/calls" style={{ textDecoration: "none" }}>
              <div style={card}>
                <div style={iconWrap}><BinocularsIcon /></div>
                <div>
                  <div style={cardTitle}>Explore collab calls</div>
                  <div style={cardDesc}>
                    Browse active calls across departments and find your match.
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Toast: ONLY when there are new notifications */}
        {showToast && notifCount > 0 && (
          <div
            role="status"
            style={{
              position: "fixed",
              right: 16,
              bottom: 16,
              maxWidth: 380,
              border: "1px solid #dbeafe",
              background: "#eff6ff",
              borderRadius: 12,
              boxShadow: "0 10px 20px rgba(0,0,0,0.08)",
              padding: "12px 14px",
              zIndex: 50,
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ width: 10, height: 10, borderRadius: 999, background: "#2563eb", marginTop: 6 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>New collaboration interest</div>
                <div style={{ color: "#1f2937", marginBottom: 8 }}>
                  {notifCount === 1
                    ? "Someone expressed interest in your collab call."
                    : `${notifCount} people expressed interest in your collab calls.`}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Link
                    href="/notifications"
                    onClick={markNotificationsSeen}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "1px solid #bfdbfe",
                      background: "#dbeafe",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    View notifications
                  </Link>
                  <button
                    onClick={markNotificationsSeen}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      background: "#fff",
                      fontWeight: 600,
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  // while auth state is loading
  return <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>Loading…</main>;
}

/* --- tiny UI pieces reused from your earlier page --- */
function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div
      style={{
        border: "1px solid #eee",
        borderRadius: 12,
        padding: "14px 16px",
        background: "linear-gradient(180deg, #fff, #fdfdfd)",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{title}</div>
      <div style={{ color: "#555" }}>{desc}</div>
    </div>
  );
}

const card: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "56px 1fr",
  gap: 14,
  alignItems: "center",
  border: "1px solid #eaeaea",
  borderRadius: 14,
  padding: "16px 16px",
  background: "#fff",
  transition: "transform 120ms ease, box-shadow 120ms ease",
  boxShadow: "0 1px 0 rgba(0,0,0,0.03)",
};
const iconWrap: React.CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: 12,
  display: "grid",
  placeItems: "center",
  background: "radial-gradient(closest-side, #eef4ff, #eef9ff)",
  border: "1px solid #dfe8ff",
};
const cardTitle: React.CSSProperties = { fontWeight: 700, marginBottom: 4, color: "#111" };
const cardDesc: React.CSSProperties = { color: "#555", lineHeight: 1.5, fontSize: 14 };

function MegaphoneIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
      <path d="M3 10v4a2 2 0 0 0 2 2h2l2.5 3.5a1 1 0 0 0 1.8-.6V16h1l7 3V5l-7 3H5a2 2 0 0 0-2 2Z"
        fill="none" stroke="#3756f5" strokeWidth="1.6" />
      <path d="M5 10v4" stroke="#3756f5" strokeWidth="1.6" />
    </svg>
  );
}

function BinocularsIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
      <path d="M7 7h2l1 4v7H6l-2-6 1-5h2Zm8 0h2l2 5-2 6h-4v-7l1-4Zm-7 0 1-3h4l1 3"
        fill="none" stroke="#0f9d58" strokeWidth="1.6" />
      <circle cx="8" cy="18" r="2.5" fill="none" stroke="#0f9d58" strokeWidth="1.6" />
      <circle cx="16" cy="18" r="2.5" fill="none" stroke="#0f9d58" strokeWidth="1.6" />
    </svg>
  );
}
