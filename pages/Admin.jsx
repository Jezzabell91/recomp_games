import { useAuth } from "../context/AuthProvider";
import { Navigate } from "react-router-dom";

export default function Admin() {
  const { session, profile, loading } = useAuth();

  if (loading) return <div style={wrap}>Loading…</div>;
  if (!session) return <Navigate to="/app" replace />;
  if (!profile?.is_admin) return <Navigate to="/app" replace />;

  return (
    <div style={wrap}>
      <h1>Admin</h1>
      <p style={{ opacity: 0.7 }}>Weekly scoring will live here.</p>
    </div>
  );
}

const wrap = {
  minHeight: "100vh",
  background: "#0b0f1a",
  color: "white",
  padding: 24,
};
