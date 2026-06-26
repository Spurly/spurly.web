import { Navigate } from 'react-router-dom';
import { useAuth } from 'src/hooks/useAuth';

export function ProtectedRoute({ children }) {
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
    return <Navigate to="/?auth=signin" replace />;
  }

  return children;
}
