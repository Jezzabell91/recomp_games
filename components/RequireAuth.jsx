import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { theme } from '../lib/theme';

// Gate: redirect to "/" when no session. While AuthProvider is still hydrating
// the session from localStorage, render a neutral splash — DO NOT redirect.
// An early redirect would bounce already-signed-in users back to the landing
// page on first paint.
export default function RequireAuth({ children }) {
  const { session, loading } = useAuth();
  if (loading) return <Splash />;
  if (!session) return <Navigate to="/" replace />;
  return children;
}

function Splash() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: theme.bgGrad,
    }}>
      <div style={{
        fontFamily: theme.hd, fontSize: 36, color: theme.accent,
        filter: `drop-shadow(0 0 12px ${theme.accent}55)`,
      }}>
        ★
      </div>
    </div>
  );
}
