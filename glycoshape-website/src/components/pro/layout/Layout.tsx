import React from 'react';
import { Box } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import ErrorBoundary from '../common/ErrorBoundary';

const Layout: React.FC = () => {
  return (
    <ErrorBoundary>
      <Box minHeight="100vh" bg="gray.50">
        <Navigation />
        <Box as="main">
          <Outlet />
        </Box>
      </Box>
    </ErrorBoundary>
  );
};

export default Layout;
