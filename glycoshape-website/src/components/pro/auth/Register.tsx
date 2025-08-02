import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
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
  Heading,
  Divider,
  Checkbox
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { RegisterRequest } from '../types';

interface RegisterFormData extends RegisterRequest {
  confirmPassword: string;
  acceptTerms: boolean;
}

const Register: React.FC = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<RegisterFormData>();

  const email = watch('email');

  // Auto-detect user type based on email domain
  const isAcademicEmail = email && email.endsWith('.edu');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError('');
    
    try {
      const registerData: RegisterRequest = {
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        institution: data.institution
      };

      await registerUser(registerData);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
              Create Your Account
            </Heading>
            
            {error && (
              <Alert status="error">
                <AlertIcon />
                {error}
              </Alert>
            )}

            {isAcademicEmail && (
              <Alert status="info">
                <AlertIcon />
                Academic email detected! You'll be eligible for academic pricing.
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

                <Box w="full" display="flex" gap={2}>
                  <FormControl isInvalid={!!errors.first_name}>
                    <FormLabel>First Name</FormLabel>
                    <Input
                      {...register('first_name')}
                      placeholder="First name"
                    />
                    <FormErrorMessage>
                      {errors.first_name?.message}
                    </FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors.last_name}>
                    <FormLabel>Last Name</FormLabel>
                    <Input
                      {...register('last_name')}
                      placeholder="Last name"
                    />
                    <FormErrorMessage>
                      {errors.last_name?.message}
                    </FormErrorMessage>
                  </FormControl>
                </Box>

                <FormControl isInvalid={!!errors.institution}>
                  <FormLabel>Institution (Optional)</FormLabel>
                  <Input
                    {...register('institution')}
                    placeholder="Your institution or company"
                  />
                  <FormErrorMessage>
                    {errors.institution?.message}
                  </FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.password}>
                  <FormLabel>Password</FormLabel>
                  <Input
                    type="password"
                    {...register('password')}
                    placeholder="Create a password"
                  />
                  <FormErrorMessage>
                    {errors.password?.message}
                  </FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.confirmPassword}>
                  <FormLabel>Confirm Password</FormLabel>
                  <Input
                    type="password"
                    {...register('confirmPassword')}
                    placeholder="Confirm your password"
                  />
                  <FormErrorMessage>
                    {errors.confirmPassword?.message}
                  </FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.acceptTerms}>
                  <Checkbox {...register('acceptTerms')}>
                    <Text fontSize="sm">
                      I accept the{' '}
                      <Link color="blue.500" href="/terms" target="_blank">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link color="blue.500" href="/privacy" target="_blank">
                        Privacy Policy
                      </Link>
                    </Text>
                  </Checkbox>
                  <FormErrorMessage>
                    {errors.acceptTerms?.message}
                  </FormErrorMessage>
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  w="full"
                  isLoading={isLoading}
                  loadingText="Creating account..."
                >
                  Create Account
                </Button>
              </VStack>
            </Box>

            <VStack spacing={2}>
              <Divider />
              
              <Text fontSize="sm" color="gray.600">
                Already have an account?{' '}
                <Link as={RouterLink} to="/ums/login" color="blue.500">
                  Sign in
                </Link>
              </Text>
            </VStack>
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
};

export default Register;
