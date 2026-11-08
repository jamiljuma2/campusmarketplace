"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({
  mode,
  nextPath = "/marketplace",
}: {
  mode: "login" | "register" | "reset" | "update";
  nextPath?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const form = new FormData(e.currentTarget);
      const email = String(form.get("email"));
      const password = String(form.get("password") || "");
      const supabase = createClient();
      let error;

      if (mode === "register") {
        const signupIntent = String(form.get("signup_intent") || "future_seller");
        const result = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
            data: {
              full_name: String(form.get("name")),
              signup_intent: signupIntent,
            },
          },
        });
        error = result.error;
        if (!error) {
          if (result.data.session) router.push(nextPath);
          else setMessage(nextPath === "/sell"
            ? "Check your email to confirm your account. You’ll return to posting your item after confirmation."
            : "Check your email to confirm your account. You’ll return to browsing after confirmation.");
        }
      } else if (mode === "login") {
        const result = await supabase.auth.signInWithPassword({ email, password });
        error = result.error;
        if (!error) {
          if (!result.data.user) {
            setMessage("Could not load the signed-in user.");
            return;
          }
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", result.data.user.id)
            .maybeSingle();
          if (profileError) throw profileError;
          router.push(profile?.role === "admin" ? "/admin" : nextPath === "/admin" ? "/account" : nextPath);
        }
      } else if (mode === "update") {
        const result = await supabase.auth.updateUser({ password });
        error = result.error;
        if (!error) router.push("/account?success=Password+updated");
      } else {
        const result = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${location.origin}/auth/callback?next=/account/reset&flow=recovery`,
        });
        error = result.error;
        if (!error) setMessage("If that email is registered, a reset link is on its way.");
      }

      if (error) setMessage(error.message);
    } catch {
      setMessage("Authentication is not configured yet. Add the Supabase environment variables.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
      {mode === "register" && (
        <label style={{ fontSize: 13, fontWeight: 700 }}>
          Your name
          <input required name="name" className="field" style={{ marginTop: 6 }} placeholder="e.g. Amina Wanjiku" />
        </label>
      )}
      {mode === "register" && (
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>How will you use CampusMarket?</legend>
          <div style={{ display: "grid", gap: 8 }}>
            <label className="signup-option">
              <input required type="radio" name="signup_intent" value="seller" defaultChecked={nextPath === "/sell"} />
              <span><strong>I want to sell</strong><small>Post items and manage my listings.</small></span>
            </label>
            <label className="signup-option">
              <input required type="radio" name="signup_intent" value="future_seller" defaultChecked={nextPath !== "/sell"} />
              <span><strong>I want to browse and buy</strong><small>I may sell something in the future, and can start anytime.</small></span>
            </label>
          </div>
        </fieldset>
      )}
      {mode !== "update" && (
        <label style={{ fontSize: 13, fontWeight: 700 }}>
          Email
          <input required name="email" type="email" className="field" style={{ marginTop: 6 }} placeholder="you@example.com" />
        </label>
      )}
      {mode !== "reset" && (
        <label style={{ fontSize: 13, fontWeight: 700 }}>
          {mode === "update" ? "New password" : "Password"}
          <input required name="password" type="password" minLength={8} className="field" style={{ marginTop: 6 }} placeholder="At least 8 characters" />
        </label>
      )}
      <button className="btn btn-primary" disabled={loading}>
        {loading ? "Please wait…" : mode === "login" ? "Sign in" : mode === "register" ? "Create account" : mode === "update" ? "Update password" : "Send reset link"}
      </button>
      {message && <p role="status" style={{ margin: 0, fontSize: 13, color: message.includes("error") ? "#a33" : "var(--green)" }}>{message}</p>}
    </form>
  );
}
