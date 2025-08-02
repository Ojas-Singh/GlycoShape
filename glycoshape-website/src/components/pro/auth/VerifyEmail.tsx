import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  VStack,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  Heading,
  Text
} from '@chakra-ui/react';
import { getApiUrl, API_CONFIG } from '../config/api';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid or missing verification token');
        return;
      }

      try {
        const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });

        if (response.ok) {
          setStatus('success');
          setMessage('Email verified successfully! You can now access all features.');
        } else {
          const errorData = await response.json();
          setStatus('error');
          setMessage(errorData.message || 'Email verification failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Network error. Please try again.');
      }
    };

    verifyEmail();
  }, [token]);

  const handleContinue = () => {
    navigate('/login');
  };

  return (
    <Box 
      minHeight="100vh" 
      display="flex" 
      alignItems="center" 
      justifyContent="center"
      bg="gray.50"
      p={4}
    >
      <Card maxW="md" w="full">
        <CardBody>
          <VStack spacing={6}>
            <Heading size="lg" textAlign="center">
              Email Verification
            </Heading>

            {status === 'loading' && (
              <Alert status="info">
                <AlertIcon />
                Verifying your email address...
              </Alert>
            )}

            {status === 'success' && (
              <>
                <Alert status="success">
                  <AlertIcon />
                  {message}
                </Alert>
                <Button
                  colorScheme="blue"
                  size="lg"
                  onClick={handleContinue}
                >
                  Continue to Login
                </Button>
              </>
            )}

            {status === 'error' && (
              <>
                <Alert status="error">
                  <AlertIcon />
                  {message}
                </Alert>
                <VStack spacing={2}>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    If you're having trouble, please contact support or try registering again.
                  </Text>
                  <Button
                    variant="outline"
                    onClick={handleContinue}
                  >
                    Go to Login
                  </Button>
                </VStack>
              </>
            )}
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
};

export default VerifyEmail;
