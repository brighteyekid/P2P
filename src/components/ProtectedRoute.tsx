import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  // Show nothing while still loading authentication state
  if (loading) {
    return null;
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render children
  return <>{children}</>;
};

export default ProtectedRoute; 