"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function HeaderNav() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      setAuthed(!!user);

      if (user) {
        const { data: a } = await supabase
          .from("admins")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (mounted) setIsAdmin(!!a);
      } else {
        if (mounted) setIsAdmin(false);
      }
    }

    load();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setAuthed(!!s?.user);
      if (s?.user) {
        supabase.from("admins").select("user_id").eq("user_id", s.user.id).maybeSingle()
          .then(({ data }) => setIsAdmin(!!data));
      } else {
        setIsAdmin(false);
      }
    });

    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  if (!authed) return null;

  return (
    <>
      <Link href="/calls">Collab Calls</Link>
      <Link href="/history">History</Link>
      <Link href="/notifications">Notifications</Link>
      {isAdmin && <Link href="/admin">Admin</Link>}
      <Link href="/profile">Profile</Link>
    </>
  );
}
