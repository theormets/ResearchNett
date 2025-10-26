"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [msg, setMsg] = useState("Signing you in...");

  useEffect(() => {
    async function run() {
      // New style (code in query, PKCE)
      const code = params.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMsg("Sign-in failed: " + error.message);
          return;
        }
        setMsg("Signed in! Redirecting…");
        router.replace("/");
        return;
      }

      // Old style (tokens in URL hash: #access_token=...&refresh_token=...)
      const hash = window.location.hash?.slice(1) ?? "";
      const hashParams = new URLSearchParams(hash);
      const access_token = hashParams.get("access_token");
      const refresh_token = hashParams.get("refresh_token");

      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) {
          setMsg("Sign-in failed: " + error.message);
          return;
        }
        setMsg("Signed in! Redirecting…");
        router.replace("/");
        return;
      }

      setMsg("Missing code/tokens in URL. Check Auth redirect settings.");
    }

    run();
  }, [params, router]);

  return <p>{msg}</p>;
}
