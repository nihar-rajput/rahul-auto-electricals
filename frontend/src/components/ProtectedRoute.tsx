import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AdminUser } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireSuperAdmin = false,
}) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');

  if (!token || !userJson) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  try {
    const user: AdminUser = JSON.parse(userJson);
    if (requireSuperAdmin && user.role !== 'SUPER_ADMIN') {
      return <Navigate to="/admin/overview" replace />;
    }
  } catch (err) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

