"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function HeaderUser() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        console.error("getUser error:", error.message);
      }
      setEmail(data.user?.email ?? null);
      setLoading(false);
    });

    // also subscribe to auth changes (production sometimes needs this)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    // Hard reload to ensure client state resets on Vercel
    window.location.assign("/");
  }

  if (loading && email == null) {
    // While loading on first paint, show Login so users aren’t stuck
    return <Link href="/login">Login</Link>;
  }

  if (!email) {
    return <Link href="/login">Login</Link>;
  }

  const username = email.split("@")[0];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 14 }}>
        Logged in as <strong>{username}</strong>
      </span>
      <button
        onClick={handleSignOut}
        style={{ padding: "0.3rem 0.6rem", borderRadius: 6, border: "1px solid #ccc", background: "#f4f4f4" }}
      >
        Sign out
      </button>
    </div>
  );
}
