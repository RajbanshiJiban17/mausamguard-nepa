import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem('mg_access_token');
  const location = useLocation();

  if (!token) {
    // Redirect unauthenticated user directly to login page
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
