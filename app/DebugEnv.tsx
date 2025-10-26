"use client";

import { useEffect } from "react";

export default function DebugEnv() {
  useEffect(() => {
    // Safe: NEXT_PUBLIC_* is exposed to the browser
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "(missing)";
    console.log("SUPABASE URL used by app:", url);
  }, []);

  return null; // nothing visible on the page
}
