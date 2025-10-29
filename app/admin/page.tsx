"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminHome() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (!uid) { router.replace("/login"); return; }
      const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", uid).maybeSingle();
      setOk(!!admin);
      setChecking(false);
    })();
  }, [router]);

  if (checking) return <p>Loading…</p>;
  if (!ok) return <p>Not authorized.</p>;

  return (
    <section style={{ maxWidth: 1000 }}>
      <h1>Admin</h1>
      <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
        <Link href="/admin/feedback" style={btn}>View Feedback</Link>
        <Link href="/admin/founders" style={btn}>View Founding Members</Link>
      </div>
    </section>
  );
}

const btn: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid #ddd",
  borderRadius: 8,
  textDecoration: "none",
  background: "#fff",
};
