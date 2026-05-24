import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Leaderboard() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("user_id, display_name, avatar_url, total_points, weeks_checked_in");
      if (error) { setError(error.message); return; }
      setRows(data ?? []);
    })();
  }, []);

  return (
    <div style={wrap}>
      <h1 style={{ textAlign: "center", marginBottom: 24 }}>Leaderboard</h1>
      {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}
      {!rows && !error && <p style={{ opacity: 0.7 }}>Loading…</p>}
      {rows && rows.length === 0 && <p style={{ opacity: 0.7 }}>No participants yet.</p>}
      {rows && rows.length > 0 && (
        <ol style={list}>
          {rows.map((r, i) => (
            <li key={r.user_id} style={row}>
              <span style={{ width: 32, opacity: 0.6 }}>{i + 1}</span>
              <span style={{ flex: 1 }}>{r.display_name}</span>
              <span style={{ opacity: 0.7, marginRight: 16 }}>{r.weeks_checked_in} wks</span>
              <strong>{r.total_points} pts</strong>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

const wrap = {
  minHeight: "100vh",
  background: "#0b0f1a",
  color: "white",
  padding: 24,
  maxWidth: 600,
  margin: "0 auto",
};
const list = { listStyle: "none", padding: 0, margin: 0 };
const row = {
  display: "flex",
  alignItems: "center",
  padding: "12px 16px",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
};
