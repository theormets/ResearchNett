"use client";

import Link from "next/link";
import { useAuth } from "@/app/components/AuthProvider";

export default function HeaderNav() {
  const { user, loading } = useAuth();
  if (loading || !user) return null;

  return (
    <>
      <Link href="/calls">Collab Calls</Link>
      <Link href="/history">History</Link>
      <Link href="/notifications">Notifications</Link>
      <Link href="/profile">Profile</Link>
    </>
  );
}
