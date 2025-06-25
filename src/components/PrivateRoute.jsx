// frontend-admin/src/components/PrivateRoute.jsx

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Tampilkan loading screen sederhana selagi AuthContext memeriksa status login
    return <div>Memuat sesi...</div>;
  }

  if (!currentUser) {
    // Jika tidak ada user yang login, arahkan ke halaman login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Jika ada user yang login, tampilkan halaman yang diminta
  return children;
};

export default PrivateRoute;