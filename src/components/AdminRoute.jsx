import { Navigate } from 'react-router-dom';
import { useAuth } from 'src/hooks/useAuth';

/**
 * AdminRoute
 * Renders children only for authenticated admins (user.isAdmin === true).
 * - Not logged in  -> /login
 * - Logged in, not admin -> /dashboard (normal user home)
 *
 * This is a UX gate only. The real boundary is the backend adminMiddleware,
 * which returns 403 to non-admins regardless of what the frontend renders.
 */
export function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-spurly-surface-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spurly-purple mx-auto mb-4"></div>
          <p className="text-spurly-text-secondary text-body">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
