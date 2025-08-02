import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spinner, Box, Text } from '@chakra-ui/react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredSubscription?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredSubscription 
}) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box 
        height="100vh" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
        flexDirection="column"
      >
        <Spinner size="xl" />
        <Text mt={4}>Loading...</Text>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/ums/login" state={{ from: location }} replace />;
  }

  // Check subscription requirement
  if (requiredSubscription && user) {
    // This would need to be implemented based on your subscription logic
    // For now, we'll assume all authenticated users have access
    // You can enhance this based on the user's subscription status
  }

  return <>{children}</>;
};

export default ProtectedRoute;
