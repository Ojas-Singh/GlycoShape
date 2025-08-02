import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  VStack,
  Text,
  Link,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  Heading
} from '@chakra-ui/react';
import { getApiUrl, API_CONFIG } from '../config/api';

const schema = yup.object({
  email: yup
    .string()
    .email('Invalid email format')
    .required('Email is required')
});

interface ForgotPasswordData {
  email: string;
}

const ForgotPassword: React.FC = () => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotPasswordData>({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    setIsLoading(true);
    setError('');
    setMessage('');
    
    try {
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setMessage('Password reset instructions have been sent to your email.');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to send password reset email');
      }
    } catch (err: any) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
              Forgot Password
            </Heading>
            
            <Text color="gray.600" textAlign="center">
              Enter your email address and we'll send you instructions to reset your password.
            </Text>

            {error && (
              <Alert status="error">
                <AlertIcon />
                {error}
              </Alert>
            )}

            {message && (
              <Alert status="success">
                <AlertIcon />
                {message}
              </Alert>
            )}

            <Box as="form" onSubmit={handleSubmit(onSubmit)} w="full">
              <VStack spacing={4}>
                <FormControl isInvalid={!!errors.email}>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    {...register('email')}
                    placeholder="Enter your email"
                  />
                  <FormErrorMessage>
                    {errors.email?.message}
                  </FormErrorMessage>
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  w="full"
                  isLoading={isLoading}
                  loadingText="Sending..."
                >
                  Send Reset Instructions
                </Button>
              </VStack>
            </Box>

            <Text fontSize="sm" color="gray.600">
              Remember your password?{' '}
              <Link as={RouterLink} to="/ums/login" color="blue.500">
                Sign in
              </Link>
            </Text>
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
};

export default ForgotPassword;
