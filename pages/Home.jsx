import { useAuth } from "../context/AuthProvider";
import { Link } from "react-router-dom";

export default function Home() {
  const { session, profile, loading } = useAuth();

  if (loading) return <Centered>Loading…</Centered>;

  if (!session) {
    return (
      <Centered>
        <h1 style={{ marginBottom: 8 }}>Recomp Games</h1>
        <p style={{ opacity: 0.7, marginBottom: 24 }}>
          You need a personal link to sign in. Check your group chat.
        </p>
        <Link to="/leaderboard" style={link}>View public leaderboard →</Link>
      </Centered>
    );
  }

  return (
    <Centered>
      <h1 style={{ marginBottom: 8 }}>Hey, {profile?.display_name ?? "you"} 👋</h1>
      <p style={{ opacity: 0.7, marginBottom: 24 }}>
        Weekly check-in form will live here.
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <Link to="/leaderboard" style={link}>Leaderboard</Link>
        {profile?.is_admin && <Link to="/admin" style={link}>Admin</Link>}
      </div>
    </Centered>
  );
}

const link = {
  color: "#ffd166",
  textDecoration: "none",
  padding: "8px 14px",
  border: "1px solid #ffd166",
  borderRadius: 8,
};

function Centered({ children }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      background: "#0b0f1a",
      padding: 24,
      textAlign: "center",
    }}>
      {children}
    </div>
  );
}
