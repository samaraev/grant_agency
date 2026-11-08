import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import LanguageProvider from '@/components/LanguageProvider';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Search from '@/pages/Search';
import House from '@/pages/House';
import Owners from '@/pages/Owners';
import Khamovniki from '@/pages/Khamovniki';
import Buyers from '@/pages/Buyers';
import About from '@/pages/About';
import Services from '@/pages/Services';
import Contacts from '@/pages/Contacts';
import Privacy from '@/pages/Privacy';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Mfa from '@/pages/Mfa';
import AdminLayout from '@/pages/admin/AdminLayout';
import Dashboard from '@/pages/admin/Dashboard';
import Leads from '@/pages/admin/Leads';
import BuildingsAdmin from '@/pages/admin/BuildingsAdmin';
import ServicesAdmin from '@/pages/admin/ServicesAdmin';
import TeamAdmin from '@/pages/admin/TeamAdmin';
import SettingsAdmin from '@/pages/admin/SettingsAdmin';
import Analytics from '@/pages/admin/Analytics';
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#1a2025]">
        <div className="w-8 h-8 border-4 border-slate-700 border-t-[#c8102e] rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/mfa" element={<Mfa />} />

      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/house/:id" element={<House />} />
        <Route path="/sobstvennikam" element={<Owners />} />
        <Route path="/khamovniki" element={<Khamovniki />} />
        <Route path="/pokupatelyam" element={<Buyers />} />
        <Route path="/o-nas" element={<About />} />
        <Route path="/uslugi" element={<Services />} />
        <Route path="/kontakty" element={<Contacts />} />
        <Route path="/politika-konfidencialnosti" element={<Privacy />} />
      </Route>

      <Route
        element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}
      >
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="leads" element={<Leads />} />
          <Route path="buildings" element={<BuildingsAdmin />} />
          <Route path="services" element={<ServicesAdmin />} />
          <Route path="team" element={<TeamAdmin />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<SettingsAdmin />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <LanguageProvider>
            <AuthenticatedApp />
          </LanguageProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App