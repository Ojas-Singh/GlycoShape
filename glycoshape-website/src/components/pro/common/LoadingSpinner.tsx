import React from 'react';
import { Spinner, Box, Text } from '@chakra-ui/react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  size = 'md' 
}) => {
  return (
    <Box 
      display="flex" 
      alignItems="center" 
      justifyContent="center"
      flexDirection="column"
      py={8}
    >
      <Spinner size={size} />
      {message && <Text mt={4} fontSize="sm" color="gray.600">{message}</Text>}
    </Box>
  );
};

export default LoadingSpinner;
