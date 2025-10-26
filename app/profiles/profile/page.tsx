"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  full_name: string;
  department: string;
  institute_url: string;
  scholar_url?: string | null;
  overview?: string | null;
};

export default function ProfilePage() {
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      setEmail(user?.email ?? null);

      if (user) {
        const { data: p } = await supabase
          .from("profiles")
          .select("full_name, department, institute_url, scholar_url, overview")
          .eq("user_id", user.id)
          .maybeSingle();
        setProfile(p ?? null);
      }

      setLoading(false);
    }
    load();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/"; // simple reload to reset state
  }

  if (loading) return <p>Loading...</p>;

  if (!email) {
    return (
      <section>
        <h1>Your Profile</h1>
        <p>You are not signed in.</p>
        <a href="/login">Go to Login</a>
      </section>
    );
  }

  return (
    <section style={{ maxWidth: 700 }}>
      <h1>Your Profile</h1>
      <p style={{ color: "#555" }}>
        Signed in as <strong>{email}</strong>
      </p>
      <button onClick={handleLogout} style={{ padding: "0.6rem 1rem", borderRadius: 8 }}>
        Sign out
      </button>

      <hr style={{ margin: "1.5rem 0" }} />

      {/* Show Name, Department, Institute URL */}
      {profile ? (
        <div style={{ display: "grid", gap: 10 }}>
          <div>
            <div style={{ fontSize: 12, color: "#666" }}>Name</div>
            <div style={{ fontWeight: 600 }}>{profile.full_name}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#666" }}>Department</div>
            <div>{profile.department}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#666" }}>Institute URL</div>
            <div>
              <a href={profile.institute_url} target="_blank" rel="noreferrer">
                {profile.institute_url}
              </a>
            </div>
          </div>

          {/* Optional extras if present */}
          {profile.scholar_url && (
            <div>
              <div style={{ fontSize: 12, color: "#666" }}>Google Scholar</div>
              <div>
                <a href={profile.scholar_url} target="_blank" rel="noreferrer">
                  {profile.scholar_url}
                </a>
              </div>
            </div>
          )}
          {profile.overview && (
            <div>
              <div style={{ fontSize: 12, color: "#666" }}>Overview</div>
              <div style={{ whiteSpace: "pre-wrap" }}>{profile.overview}</div>
            </div>
          )}
        </div>
      ) : (
        <p style={{ color: "#a00" }}>
          No profile found yet. Try signing out and signing back in right after sign-up, or recreate
          your account so the profile can be saved.
        </p>
      )}
    </section>
  );
}
