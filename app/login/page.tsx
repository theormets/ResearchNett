"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// allow only @nitt.edu emails where the part before @ has at least one letter
function isNittEmail(raw: string) {
  const email = String(raw || "").trim().toLowerCase();
  const at = email.lastIndexOf("@");
  if (at === -1) return false;

  const domain = email.slice(at + 1);
  if (domain !== "nitt.edu") return false;

  const localPart = email.slice(0, at); // before @
  // must contain at least one alphabetic character
  const hasLetter = /[a-z]/i.test(localPart);

  return hasLetter;
}

function normalizeUrl(s: string) {
  const x = s.trim();
  if (!x) return "";
  if (/^https?:\/\//i.test(x)) return x;
  return "https://" + x;
}

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Something went wrong";
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Handles Firefox/Chrome autofill: read from the <form> directly
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setBusy(true);

    try {
      const fd = new FormData(e.currentTarget);

      const email = String(fd.get("email") || "").trim();
      const password = String(fd.get("password") || "");
      const confirm = String(fd.get("confirm") || "");

      if (!isNittEmail(email)) {
        setErr("Only faculty/staff @nitt.edu accounts are eligible. Numeric student IDs are not yet supported.");
        return;
      }

      if (mode === "signup") {
        // Required profile fields
        const full_name = String(fd.get("full_name") || "").trim();
        const department = String(fd.get("department") || "").trim();
        const institute_url_raw = String(fd.get("institute_url") || "").trim();
        const institute_url = normalizeUrl(institute_url_raw);

        // Optional fields
        const scholar_url_raw = String(fd.get("scholar_url") || "").trim();
        const scholar_url = scholar_url_raw ? normalizeUrl(scholar_url_raw) : null;
        const overview = String(fd.get("overview") || "").trim() || null;

        if (!email || !password || !confirm) {
          setErr("Email, password and confirm password are required.");
          return;
        }
        if (password.length < 8) {
          setErr("Password must be at least 8 characters.");
          return;
        }
        if (password !== confirm) {
          setErr("Passwords do not match.");
          return;
        }
        if (!full_name || !department || !institute_url_raw) {
          setErr("Full Name, Department, and Institute webpage are required.");
          return;
        }

        // Create account
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        // If email confirmations are ON, there will be no session yet.
        // Save the profile draft locally so we can insert it after first sign-in.
        const profileDraft = { full_name, department, institute_url, scholar_url, overview };
        localStorage.setItem("pendingProfile", JSON.stringify(profileDraft));

        if (!data.session) {
          setInfo("Account created. Please confirm your email, then sign in to complete your profile.");
          return;
        }

        // If we do have a session, insert the profile now.
        const user = data.user;
        if (!user) {
          setInfo("Signed up. Please sign in to complete your profile.");
          return;
        }

        const { error: pErr } = await supabase.from("profiles").insert({
          user_id: user.id,
          full_name,
          department,
          institute_url,
          scholar_url,
          overview,
        });
        if (pErr) throw pErr;

        localStorage.removeItem("pendingProfile");
        router.replace("/");
        return;
      }

      // Sign in flow
      if (!email || !password) {
        setErr("Email and password are required.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      // After sign-in, if no profile exists, try to create it from any saved draft
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (user) {
        const { data: existing, error: selErr } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!selErr && !existing) {
          const draftRaw = localStorage.getItem("pendingProfile");
          if (draftRaw) {
            try {
              const draft = JSON.parse(draftRaw) as {
                full_name: string;
                department: string;
                institute_url: string;
                scholar_url?: string | null;
                overview?: string | null;
              };
              const { error: insErr } = await supabase.from("profiles").insert({
                user_id: user.id,
                full_name: draft.full_name,
                department: draft.department,
                institute_url: draft.institute_url,
                scholar_url: draft.scholar_url || null,
                overview: draft.overview || null,
              });
              if (!insErr) localStorage.removeItem("pendingProfile");
            } catch {
              /* ignore bad JSON */
            }
          }
        }
      }

      router.replace("/");
    } catch (e: unknown) {
      setErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    setErr(null);
    setInfo(null);

    const email = document.querySelector<HTMLInputElement>('input[name="email"]')?.value?.trim() ?? "";

    if (!email) {
      setErr("Enter your email above first.");
      return;
    }
    if (!isNittEmail(email)) {
      setErr("Password reset is restricted to eligible @nitt.edu accounts.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    if (error) setErr(error.message);
    else setInfo("Password reset link sent. Check your inbox.");
  }

  return (
    <section style={{ maxWidth: 720 }}>
      <h1 style={{ marginBottom: 8 }}>
        {mode === "signin" ? "Sign in" : "Create your account"}
      </h1>
      <p style={{ color: "#555", marginBottom: 16 }}>
        {mode === "signin"
          ? "Use your @nitt.edu email and password."
          : "Sign up with your @nitt.edu email. Please fill in your profile to help potential collaborators understand your work."}
      </p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        {/* Common fields */}
        <input
          name="email"
          type="email"
          placeholder="you@nitt.edu"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          required
        />

        {mode === "signup" && (
          <>
            {/* REQUIRED profile fields */}
            <input
              name="full_name"
              type="text"
              placeholder="Full Name"
              style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
              required
            />
            <input
              name="department"
              type="text"
              placeholder="Department"
              style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
              required
            />
            <input
              name="institute_url"
              type="url"
              placeholder="Link to institute webpage (e.g., https://www.nitt.edu/...)"
              style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
              required
            />
            <div style={{ fontSize: 13, color: "#666", marginTop: -6 }}>
              This will allow a potential collaborator to gain a better idea of your research area.
            </div>

            {/* OPTIONAL profile fields */}
            <input
              name="scholar_url"
              type="url"
              placeholder="Google Scholar Link (optional)"
              style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
            />
            <textarea
              name="overview"
              placeholder="Overview of your research interest (optional)"
              style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8, minHeight: 90 }}
            />
          </>
        )}

        {/* Auth: password + confirm */}
        <input
          name="password"
          type="password"
          placeholder={mode === "signin" ? "Password" : "Password (min 8 characters)"}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          minLength={8}
          required
        />
        {mode === "signup" && (
          <input
            name="confirm"
            type="password"
            placeholder="Confirm password"
            autoComplete="new-password"
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
            minLength={8}
            required
          />
        )}

        <button
          type="submit"
          disabled={busy}
          style={{
            padding: "0.65rem 1rem",
            borderRadius: 8,
            border: "1px solid #ccc",
            background: "#f4f4f4",
          }}
        >
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
        </button>
      </form>

      <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          style={{ background: "transparent", border: "none", color: "#0066cc", textAlign: "left", padding: 0 }}
        >
          {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>

        <button
          onClick={handleReset}
          style={{ background: "transparent", border: "none", color: "#0066cc", textAlign: "left", padding: 0 }}
        >
          Forgot password?
        </button>
      </div>

      {err && <div style={{ color: "crimson", marginTop: 8 }}>{err}</div>}
      {info && <div style={{ color: "green", marginTop: 8 }}>{info}</div>}
    </section>
  );
}
