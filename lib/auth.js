import { supabase } from "./supabase";

// Personal-link format: https://site/#login=<base64(email:password)>
// We use the URL fragment (#) so credentials never reach any server log.
// Once signed in, Supabase persists the session in localStorage; the link
// is no longer needed on that device.

export async function consumeLoginFragmentIfPresent() {
  const hash = window.location.hash;
  const marker = "#login=";
  const idx = hash.indexOf(marker);
  if (idx === -1) return null;

  const payload = hash.slice(idx + marker.length).split("&")[0];
  let creds;
  try {
    creds = atob(decodeURIComponent(payload));
  } catch {
    window.location.hash = "/app";
    return { error: "Invalid login link." };
  }
  const sep = creds.indexOf(":");
  if (sep === -1) {
    window.location.hash = "/app";
    return { error: "Invalid login link." };
  }
  const email = creds.slice(0, sep);
  const password = creds.slice(sep + 1);

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  // Replace the credential fragment with the app route. HashRouter picks up
  // the hashchange and navigates; the credential is no longer in the URL bar.
  window.location.hash = "/app";
  return error ? { error: error.message } : { ok: true };
}

export async function signOut() {
  await supabase.auth.signOut();
}
