import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { ServiceDetails } from './pages/ServiceDetails';
import { CreateService } from './pages/CreateService';
import { Dashboard } from './pages/Dashboard';
import { Orders } from './pages/Orders';
import { Messages } from './pages/Messages';
import { Profile } from './pages/Profile';
import { Sellers } from './pages/Sellers';
import { Onboarding } from './pages/Onboarding';
import { useAuth } from './AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Redirect to onboarding if logged in but no profile
  if (!loading && user && !profile && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 antialiased">
      {location.pathname !== '/onboarding' && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/services/:id" element={<ServiceDetails />} />
        <Route path="/services/:id/edit" element={<CreateService />} />
        <Route path="/services/new" element={<CreateService />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/sellers" element={<Sellers />} />
        <Route path="/onboarding" element={<Onboarding />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
