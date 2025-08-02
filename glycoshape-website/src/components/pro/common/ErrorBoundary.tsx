import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Text, Button, VStack } from '@chakra-ui/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box 
          height="100vh" 
          display="flex" 
          alignItems="center" 
          justifyContent="center"
          p={8}
        >
          <VStack spacing={4} textAlign="center">
            <Text fontSize="2xl" fontWeight="bold" color="red.500">
              Something went wrong
            </Text>
            <Text color="gray.600" maxW="md">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </Text>
            <Button 
              colorScheme="blue" 
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
