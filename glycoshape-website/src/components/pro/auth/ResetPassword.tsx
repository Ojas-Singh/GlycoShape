import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Alert,
  AlertIcon,
  Card,
  CardBody,
  Heading
} from '@chakra-ui/react';
import { getApiUrl, API_CONFIG } from '../config/api';

const schema = yup.object({
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'Password must contain a lowercase letter')
    .matches(/[A-Z]/, 'Password must contain an uppercase letter')
    .matches(/[0-9]/, 'Password must contain a number')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Password confirmation is required')
});

interface ResetPasswordData {
  password: string;
  confirmPassword: string;
}

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
    }
  }, [token]);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ResetPasswordData>({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data: ResetPasswordData) => {
    if (!token) return;

    setIsLoading(true);
    setError('');
    setMessage('');
    
    try {
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          new_password: data.password
        })
      });

      if (response.ok) {
        setMessage('Password has been reset successfully!');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to reset password');
      }
    } catch (err: any) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
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
            <Alert status="error">
              <AlertIcon />
              Invalid or missing reset token. Please request a new password reset.
            </Alert>
          </CardBody>
        </Card>
      </Box>
    );
  }

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
              Reset Password
            </Heading>

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

            {!message && (
              <Box as="form" onSubmit={handleSubmit(onSubmit)} w="full">
                <VStack spacing={4}>
                  <FormControl isInvalid={!!errors.password}>
                    <FormLabel>New Password</FormLabel>
                    <Input
                      type="password"
                      {...register('password')}
                      placeholder="Enter new password"
                    />
                    <FormErrorMessage>
                      {errors.password?.message}
                    </FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.confirmPassword}>
                    <FormLabel>Confirm New Password</FormLabel>
                    <Input
                      type="password"
                      {...register('confirmPassword')}
                      placeholder="Confirm new password"
                    />
                    <FormErrorMessage>
                      {errors.confirmPassword?.message}
                    </FormErrorMessage>
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    w="full"
                    isLoading={isLoading}
                    loadingText="Resetting..."
                  >
                    Reset Password
                  </Button>
                </VStack>
              </Box>
            )}
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
};

export default ResetPassword;
