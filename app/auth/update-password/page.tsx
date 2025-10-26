"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // Ensure we have a session (Supabase sets one after the reset link)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setReady(true);
      if (!data.session) setErr("Reset link expired or invalid. Please retry.");
    });
  }, []);

  async function handleUpdate() {
    setErr(null); setOk(null);
    if (!password || password.length < 8) {
      setErr("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setErr(error.message); return; }
    setOk("Password updated. Redirecting…");
    setTimeout(() => router.replace("/"), 1000);
  }

  if (!ready) return <p>Loading…</p>;

  return (
    <section style={{ maxWidth: 480 }}>
      <h1>Set a new password</h1>
      <p style={{ color: "#555" }}>Enter and confirm your new password.</p>

      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
        />
        <button onClick={handleUpdate} style={{ padding: "0.6rem 1rem", borderRadius: 8 }}>
          Update password
        </button>

        {err && <div style={{ color: "crimson" }}>{err}</div>}
        {ok && <div style={{ color: "green" }}>{ok}</div>}
      </div>
    </section>
  );
}
