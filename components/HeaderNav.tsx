"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function HeaderNav() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return;
      if (error) console.error("getUser error:", error.message);
      setAuthed(!!data.user);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session?.user);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!authed) return null; // signed out or still loading → only HeaderUser shows Login

  return (
    <>
      <Link href="/calls">Collab Calls</Link>
      <Link href="/history">History</Link>
      <Link href="/notifications">Notifications</Link>
      <Link href="/profile">Profile</Link>
    </>
  );
}
