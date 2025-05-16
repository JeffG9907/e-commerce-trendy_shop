import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function AdminRoute({ children }) {
  const { currentUser, userData } = useAuth();

  if (!currentUser || userData?.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return children;
}

export default AdminRoute;