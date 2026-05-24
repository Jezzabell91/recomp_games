import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import RequireAuth from './RequireAuth';

// Wraps RequireAuth: must be signed in AND profile.is_admin === true. Non-admins
// land on /app. Note: profile loads asynchronously after session — while it's
// null we don't redirect (would race the AuthProvider profile fetch and bounce
// admin users on every refresh).
export default function RequireAdmin({ children }) {
  return (
    <RequireAuth>
      <AdminGate>{children}</AdminGate>
    </RequireAuth>
  );
}

function AdminGate({ children }) {
  const { profile } = useAuth();
  if (profile === null) return null; // brief splash while profile loads
  if (profile.is_admin !== true) return <Navigate to="/app" replace />;
  return children;
}
