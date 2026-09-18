import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ROLES, hasPermission } from '../lib/permissions';

// Layouts
import AdminLayout from '../components/layout/AdminLayout';
import GlobalErrorBoundary from '../components/common/GlobalErrorBoundary';

// Pages
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import BookingsPage from '../pages/BookingsPage';
import BookingDetailsPage from '../pages/BookingDetailsPage';
import TheatersPage from '../pages/TheatersPage';
import CitiesPage from '../pages/CitiesPage';
import LocationsPage from '../pages/LocationsPage';
import EventTypesPage from '../pages/EventTypesPage';
import AddOnsPage from '../pages/AddOnsPage';
import BannersPage from '../pages/BannersPage';
import TestimonialsPage from '../pages/TestimonialsPage';
import FAQsPage from '../pages/FAQsPage';
import ReviewsPage from '../pages/ReviewsPage';
import UsersPage from '../pages/UsersPage';
import ReportsPage from '../pages/ReportsPage';
import AuditLogsPage from '../pages/AuditLogsPage';
import SettingsPage from '../pages/SettingsPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import NotFoundPage from '../pages/NotFoundPage';

// New Pages
import ServicesPage from '../pages/ServicesPage';
import GalleryPage from '../pages/GalleryPage';
import StoriesPage from '../pages/StoriesPage';

const ProtectedRoute = ({ children, requiredRole, requiredPermission }) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (user?.role === ROLES.CUSTOMER) {
    return <Navigate to="/admin/unauthorized" replace />;
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== ROLES.SUPER_ADMIN) {
    return <Navigate to="/admin/unauthorized" replace />;
  }

  if (requiredPermission && !hasPermission(user?.role, requiredPermission)) {
    return <Navigate to="/admin/unauthorized" replace />;
  }

  return children;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/admin" replace />,
  },
  {
    path: '/admin/login',
    element: <LoginPage />,
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    errorElement: <GlobalErrorBoundary />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'bookings',
        element: (
          <ProtectedRoute requiredPermission="manage:bookings">
            <BookingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'bookings/:id',
        element: (
          <ProtectedRoute requiredPermission="manage:bookings">
            <BookingDetailsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'theaters',
        element: (
          <ProtectedRoute requiredPermission="manage:theaters">
            <TheatersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'cities',
        element: (
          <ProtectedRoute requiredPermission="manage:cities">
            <CitiesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'locations',
        element: (
          <ProtectedRoute requiredPermission="manage:locations">
            <LocationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'event-types',
        element: (
          <ProtectedRoute requiredPermission="manage:eventTypes">
            <EventTypesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'addons',
        element: (
          <ProtectedRoute requiredPermission="manage:addOns">
            <AddOnsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'services',
        element: (
          <ProtectedRoute requiredPermission="manage:services">
            <ServicesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'gallery',
        element: (
          <ProtectedRoute requiredPermission="manage:gallery">
            <GalleryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'stories',
        element: (
          <ProtectedRoute requiredPermission="manage:stories">
            <StoriesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'banners',
        element: (
          <ProtectedRoute requiredPermission="manage:banners">
            <BannersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'testimonials',
        element: (
          <ProtectedRoute requiredPermission="manage:testimonials">
            <TestimonialsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'faqs',
        element: (
          <ProtectedRoute requiredPermission="manage:faqs">
            <FAQsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reviews',
        element: (
          <ProtectedRoute requiredPermission="manage:reviews">
            <ReviewsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'users',
        element: (
          <ProtectedRoute requiredPermission="manage:users">
            <UsersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reports',
        element: (
          <ProtectedRoute requiredPermission="view:reports">
            <ReportsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'audit-logs',
        element: (
          <ProtectedRoute requiredPermission="view:auditLogs">
            <AuditLogsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute requiredPermission="manage:settings">
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'unauthorized',
        element: <UnauthorizedPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
