import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import AppSkeleton from '../components/AppSkeleton';

export const ProtectedRoute = ({ children }) => {
  const { loading } = useAuthStore();

  if (loading) {
    return <AppSkeleton />;
  }

  return children;
};

export default ProtectedRoute;
