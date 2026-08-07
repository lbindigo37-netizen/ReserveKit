import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/lib/auth';
import { RequireAdmin, RequireAuth } from '@/lib/route-guards';
import { useBrandTheme } from '@/lib/brand-theme';
import NotFound from '@/pages/not-found';

import PublicHome from '@/pages/public/PublicHome';
import BookingPage from '@/pages/public/BookingPage';
import LoginPage from '@/pages/public/LoginPage';
import SignupPage from '@/pages/public/SignupPage';

import AccountBookingsPage from '@/pages/account/AccountBookingsPage';
import AccountFavoritesPage from '@/pages/account/AccountFavoritesPage';
import AccountNotificationsPage from '@/pages/account/AccountNotificationsPage';
import AccountProfilePage from '@/pages/account/AccountProfilePage';

import DashboardPage from '@/pages/admin/DashboardPage';
import BookingsPage from '@/pages/admin/BookingsPage';
import CustomersPage from '@/pages/admin/CustomersPage';
import CustomerDetailPage from '@/pages/admin/CustomerDetailPage';
import ServicesPage from '@/pages/admin/ServicesPage';
import StaffPage from '@/pages/admin/StaffPage';
import SettingsPage from '@/pages/admin/SettingsPage';
import AdminNotificationsPage from '@/pages/admin/NotificationsPage';

import '@/index.css';

const queryClient = new QueryClient();

function AppRouter() {
  useBrandTheme();

  return (
    <Switch>
      <Route path="/" component={PublicHome} />
      <Route path="/book" component={BookingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />

      <Route path="/account">
        <RequireAuth><AccountBookingsPage /></RequireAuth>
      </Route>
      <Route path="/account/favorites">
        <RequireAuth><AccountFavoritesPage /></RequireAuth>
      </Route>
      <Route path="/account/notifications">
        <RequireAuth><AccountNotificationsPage /></RequireAuth>
      </Route>
      <Route path="/account/profile">
        <RequireAuth><AccountProfilePage /></RequireAuth>
      </Route>

      <Route path="/admin">
        <RequireAdmin><DashboardPage /></RequireAdmin>
      </Route>
      <Route path="/admin/bookings">
        <RequireAdmin><BookingsPage /></RequireAdmin>
      </Route>
      <Route path="/admin/customers">
        <RequireAdmin><CustomersPage /></RequireAdmin>
      </Route>
      <Route path="/admin/customers/:id">
        <RequireAdmin><CustomerDetailPage /></RequireAdmin>
      </Route>
      <Route path="/admin/services">
        <RequireAdmin><ServicesPage /></RequireAdmin>
      </Route>
      <Route path="/admin/staff">
        <RequireAdmin><StaffPage /></RequireAdmin>
      </Route>
      <Route path="/admin/settings">
        <RequireAdmin><SettingsPage /></RequireAdmin>
      </Route>
      <Route path="/admin/notifications">
        <RequireAdmin><AdminNotificationsPage /></RequireAdmin>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </WouterRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
