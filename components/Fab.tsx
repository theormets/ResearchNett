"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Fab() {
  const router = useRouter();
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
      setEmail(data.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleFeedback = useCallback(() => {
    // require login
    if (!userId) { router.push("/login"); return; }
    const qp = new URLSearchParams({ from: pathname || "/" }).toString();
    router.push(`/feedback?${qp}`);
  }, [router, userId, pathname]);

  const handleJoinFounder = useCallback(async () => {
    if (!userId || !email) { router.push("/login"); return; }
    const ok = window.confirm("Become a founding member? Your profile info will be shared with the admin.");
    if (!ok) return;

    // get profile extras
    const { data: prof } = await supabase
      .from("profiles")
      .select("full_name, department")
      .eq("user_id", userId)
      .maybeSingle();

    // try to insert (unique on user_id prevents duplicates)
    const { error } = await supabase
      .from("founding_members")
      .insert({
        user_id: userId,
        email,
        full_name: prof?.full_name ?? null,
        department: prof?.department ?? null,
      });

    if (error) {
      // if already joined (unique violation), show a friendly note
      alert(error.message.includes("duplicate key")
        ? "You're already a founding member. Thank you!"
        : `Could not join: ${error.message}`);
    } else {
      alert("Welcome aboard! You’ve been added as a founding member.");
    }
  }, [userId, email]);

  // hide when logged out? we keep visible; it will route to login if needed.
  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        display: "grid",
        gap: 8,
        zIndex: 60,
      }}
    >
      <button
        onClick={handleFeedback}
        title="Report a bug / Make a suggestion"
        style={btn("#0f172a", "#e2e8f0")}
      >
        ✍️&nbsp; Feedback
      </button>
      <button
        onClick={handleJoinFounder}
        title="Join as a founding member"
        style={btn("#065f46", "#d1fae5")}
      >
        ⭐&nbsp; Join as Founding member
      </button>
    </div>
  );
}

function btn(border: string, bg: string): React.CSSProperties {
  return {
    border: `1px solid ${border}`,
    background: bg,
    padding: "10px 12px",
    borderRadius: 999,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
  };
}
