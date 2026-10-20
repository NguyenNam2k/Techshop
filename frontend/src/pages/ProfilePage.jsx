import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CustomerDashboard from './CustomerDashboard.jsx';
import StaffDashboard from '../pages/StaffDashboard.jsx';
import ManagerDashboard from '../pages/ManagerDashboard.jsx';
import AdminDashboard from '../pages/AdminDashboard.jsx';

export default function ProfilePage() {
  const { user } = useAuth();
  const { '*': path } = useParams();

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If there's a specific path in the URL (like /profiles/orders),
  // we want to show role-appropriate content for that section
  const normalizedPath = String(path || '').replace(/^\/+|\/+$/g, '');

  // For base profile page (/profiles or /profile), show role-appropriate default section
  if (!normalizedPath) {
    switch (user.role) {
      case 'customer':
        return <CustomerDashboard routeBase="/profile" defaultSection="profile" hideChat={true} />;
      case 'staff':
        return <StaffDashboard routeBase="/profile" defaultSection="orders" hideChat={true} />;
      case 'manager':
        return <ManagerDashboard routeBase="/profile" defaultSection="catalog" />;
      case 'admin':
        return <AdminDashboard routeBase="/profile" defaultSection="accounts" />;
      default:
        return <CustomerDashboard routeBase="/profile" defaultSection="profile" hideChat={true} />;
    }
  }

  // For specific sections (like /profiles/orders), show role-appropriate content
  switch (user.role) {
    case 'customer':
      return <CustomerDashboard routeBase="/profile" defaultSection={normalizedPath} hideChat={true} />;
    case 'staff':
      return <StaffDashboard routeBase="/profile" defaultSection={normalizedPath} hideChat={true} />;
    case 'manager':
      return <ManagerDashboard routeBase="/profile" defaultSection={normalizedPath} />;
    case 'admin':
      return <AdminDashboard routeBase="/profile" defaultSection={normalizedPath} />;
    default:
      return <CustomerDashboard routeBase="/profile" defaultSection={normalizedPath} hideChat={true} />;
  }
}

export function LegacyProfileRedirect() {
  const { '*': path } = useParams();
  const { user } = useAuth();

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  const normalizedPath = String(path || '').replace(/^\/+|\/+$/g, '');

  // If we have a specific sub-path, preserve it in the redirect
  if (normalizedPath) {
    return <Navigate to={`/profile/${normalizedPath}/`} replace />;
  }

  // Otherwise redirect to base profile page
  return <Navigate to={`/profile/`} replace />;
}
