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
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  // ===== Feedback button logic (unchanged) =====
  const handleFeedback = useCallback(() => {
    if (!userId) {
      router.push("/login");
      return;
    }
    const qp = new URLSearchParams({ from: pathname || "/" }).toString();
    router.push(`/feedback?${qp}`);
  }, [router, userId, pathname]);

  // ===== Founding member request logic (modified) =====
  const handleJoinFounder = useCallback(async () => {
    if (!userId || !email) {
      router.push("/login");
      return;
    }

    const ok = window.confirm(
      "Request to join as a founding member? The admin will review your request."
    );
    if (!ok) return;

    // pull profile info (optional extra context for admin)
    const { data: prof } = await supabase
      .from("profiles")
      .select("full_name, department")
      .eq("user_id", userId)
      .maybeSingle();

    // Insert into founding_member_requests instead of founding_members
    // There's a UNIQUE(user_id) on that table, so duplicate requests won't spam.
    const { error } = await supabase
      .from("founding_member_requests")
      .insert({
        user_id: userId,
        email,
        full_name: prof?.full_name ?? null,
        department: prof?.department ?? null,
        // status defaults to 'pending' in DB
      });

    if (error) {
      // duplicate request case -> already asked
      if (/duplicate key|already exists|unique/i.test(error.message)) {
        alert(
          "You’ve already submitted a request. The admin will review it."
        );
      } else {
        alert(`Could not submit request: ${error.message}`);
      }
    } else {
      alert(
        "Request submitted. The admin will review it and decide on adding you as a founding member."
      );
    }
  }, [userId, email]);

  // floating buttons in bottom-right
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
