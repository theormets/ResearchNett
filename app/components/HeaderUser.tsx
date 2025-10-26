"use client";

import { useAuth } from "@/app/components/AuthProvider";
import { supabase } from "@/lib/supabaseClient";

export default function HeaderUser() {
  const { user, loading } = useAuth();

  if (loading) return <span style={{ fontSize: 12, color: "#888" }}>…</span>;
  if (!user) return <a href="/login">Login</a>;

  const email = user.email ?? "";
  const username = email.split("@")[0] || "you";

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

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
