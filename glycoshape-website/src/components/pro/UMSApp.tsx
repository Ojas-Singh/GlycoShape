import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Flex, Box } from '@chakra-ui/react';
import ProtectedRoute from './common/ProtectedRoute';
import Navbar from '../Navbar';
import Footer from '../Footer';
import ScrollToTopButton from '../Scroll';
import CookieConsent from '../CookieConsent';
import Cite from '../Cite';

// Auth Components
import Login from './auth/Login';
import Register from './auth/Register';
import ForgotPassword from './auth/ForgotPassword';
import ResetPassword from './auth/ResetPassword';
import VerifyEmail from './auth/VerifyEmail';

// Main Pages
import Dashboard from './pages/Dashboard';
import Profile from './user/Profile';

// Subscription Components
import Plans from './subscription/Plans';

// License Components
import LicenseList from './license/LicenseList';

// API Key Components
import KeyList from './apikey/KeyList';

// UMS Layout component - uses main Navbar, no separate UMS navigation
const UMSLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Flex direction="column" minHeight="100vh">
    <Navbar />
    <CookieConsent />
    <ScrollToTopButton />
    <Box as="main" flex="1" bg="gray.50">
      {children}
    </Box>
    <Cite />
    <Footer />
  </Flex>
);

const UMSApp: React.FC = () => {
  return (
    <Routes>
      {/* All UMS Routes - Use UMSLayout with main Navbar */}
      <Route path="login" element={<UMSLayout><Login /></UMSLayout>} />
      <Route path="register" element={<UMSLayout><Register /></UMSLayout>} />
      <Route path="forgot-password" element={<UMSLayout><ForgotPassword /></UMSLayout>} />
      <Route path="reset-password" element={<UMSLayout><ResetPassword /></UMSLayout>} />
      <Route path="verify-email" element={<UMSLayout><VerifyEmail /></UMSLayout>} />

      {/* Protected Routes - Also use UMSLayout */}
      <Route path="/" element={
        <ProtectedRoute>
          <UMSLayout><Dashboard /></UMSLayout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <UMSLayout><Dashboard /></UMSLayout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <UMSLayout><Profile /></UMSLayout>
        </ProtectedRoute>
      } />
      <Route path="/subscriptions" element={
        <ProtectedRoute>
          <UMSLayout><Plans /></UMSLayout>
        </ProtectedRoute>
      } />
      <Route path="/licenses" element={
        <ProtectedRoute>
          <UMSLayout><LicenseList /></UMSLayout>
        </ProtectedRoute>
      } />
      <Route path="/api-keys" element={
        <ProtectedRoute>
          <UMSLayout><KeyList /></UMSLayout>
        </ProtectedRoute>
      } />

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/ums/" replace />} />
    </Routes>
  );
};

export default UMSApp;
