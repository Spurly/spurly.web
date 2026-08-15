import { Navigate } from 'react-router-dom';
import { useAuth } from 'src/hooks/useAuth';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--ui-surface-page)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--ui-accent)] mx-auto mb-4"></div>
          <p className="text-[var(--ui-text-secondary)] text-[13px]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
