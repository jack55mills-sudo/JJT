"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase-client";

export default function AccountSettings() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [signingUp, setSigningUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let active = true;
    supabase.auth.getUser().then(({ data }) => { if (active) { setUser(data.user); setLoading(false); } });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user ?? null); setLoading(false); });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setMessage("");
    const result = signingUp
      ? await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin } })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (result.error) setMessage(result.error.message);
    else if (signingUp && !result.data.session) setMessage("Check your email for a confirmation link, then return here to sign in.");
    else setMessage(signingUp ? "Your account is ready." : "Signed in.");
    setPassword(""); setBusy(false);
  }

  async function signOut() {
    if (!supabase) return;
    setBusy(true); setMessage("");
    const { error } = await supabase.auth.signOut();
    setMessage(error ? error.message : "Signed out."); setBusy(false);
  }

  return <section className="panel full-panel settings-panel" aria-labelledby="account-title">
    <div className="eyebrow">YOUR ACCOUNT</div><h3 id="account-title">goodhouse account</h3>
    <p className="settings-description">Accounts are being added to the preview. Your current setup, calendar, and home details still stay on this browser and are not shared.</p>
    {!supabase ? <p role="alert">Account setup is unavailable until the project is configured.</p> : loading ? <p>Checking account…</p> : user ? <><p>Signed in as <strong>{user.email}</strong></p><button type="button" className="settings-primary" onClick={signOut} disabled={busy}>Sign out</button></> : <form onSubmit={submit} className="account-form">
      <label>Email<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} /></label>
      <label>Password<input required type="password" minLength={6} autoComplete={signingUp ? "new-password" : "current-password"} value={password} onChange={e=>setPassword(e.target.value)} /></label>
      <button className="settings-primary" disabled={busy}>{busy ? "Please wait…" : signingUp ? "Create account" : "Sign in"}</button>
      <button type="button" className="account-toggle" onClick={()=>{setSigningUp(!signingUp);setMessage("");}}>{signingUp ? "Already have an account? Sign in" : "New here? Create an account"}</button>
    </form>}
    {message && <p role="status">{message}</p>}
  </section>;
}
