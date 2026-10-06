import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Static Layouts & Gates
import MainLayout from '../layouts/MainLayout';
import AccessGate from '../pages/AccessGate';
import PublicGate from '../components/common/PublicGate';


// Lazy-loaded Pages
const HomePage = lazy(() => import('../pages/HomePage'));
const MoviesPage = lazy(() => import('../pages/MoviesPage'));
const TVShowsPage = lazy(() => import('../pages/TVShowsPage'));
const SearchPage = lazy(() => import('../pages/SearchPage'));
const MovieDetails = lazy(() => import('../pages/MovieDetails'));
const TVDetails = lazy(() => import('../pages/TVDetails'));
const WatchPage = lazy(() => import('../pages/WatchPage'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const FavoritesPage = lazy(() => import('../pages/FavoritesPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const AdminPage = lazy(() => import('../pages/AdminPage'));
const ProviderPage = lazy(() => import('../pages/ProviderPage'));
const LiveTVPage = lazy(() => import('../pages/LiveTVPage'));
const LiveTVWatchPage = lazy(() => import('../pages/LiveTVWatchPage'));

import PageSkeleton from '../components/ui/PageSkeleton';

// Helper for top-level lazy routes (Auth, Welcome)
const SuspenseLayout = ({ children }) => (
  <Suspense fallback={<PageSkeleton type="home" />}>
    {children}
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: '/welcome',
    element: <SuspenseLayout><AccessGate /></SuspenseLayout>
  },
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <Navigate to="/" replace />,
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: 'movies',
        element: <MoviesPage />
      },
      {
        path: 'tv',
        element: <TVShowsPage />
      },
      {
        path: 'live-tv',
        element: <LiveTVPage />
      },
      {
        path: 'live-tv/watch/:id',
        element: <LiveTVWatchPage />
      },
      {
        path: 'search',
        element: <SearchPage />
      },
      {
        path: 'movie/:id',
        element: <MovieDetails />
      },
      {
        path: 'tv/:id',
        element: <TVDetails />
      },
      {
        path: 'watch',
        element: <WatchPage />
      },
      {
        path: 'favorites',
        element: <FavoritesPage />
      },
      {
        path: 'settings',
        element: <SettingsPage />
      },
      {
        path: 'admin',
        element: <AdminPage />
      },
      {
        path: 'provider/:id',
        element: <ProviderPage />
      }
    ]
  },
  // Clerk authentication routes with wildcards
  {
    path: '/login',
    element: <PublicGate><SuspenseLayout><Login /></SuspenseLayout></PublicGate>,
    children: [
      {
        path: '*',
        element: <PublicGate><SuspenseLayout><Login /></SuspenseLayout></PublicGate>
      }
    ]
  },
  {
    path: '/register',
    element: <PublicGate><SuspenseLayout><Register /></SuspenseLayout></PublicGate>,
    children: [
      {
        path: '*',
        element: <PublicGate><SuspenseLayout><Register /></SuspenseLayout></PublicGate>
      }
    ]
  },
  // Catch-all route
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);

export default router;
