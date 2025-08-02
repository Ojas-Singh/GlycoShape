import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Card,
  CardBody,
  Divider,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useToast,
  Badge
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';
import { getApiUrl, API_CONFIG } from '../config/api';
import { User } from '../types';
import LoadingSpinner from '../common/LoadingSpinner';

interface ProfileFormData {
  first_name: string;
  last_name: string;
  institution?: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Profile: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile
  } = useForm<ProfileFormData>({
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      institution: user?.institution || ''
    }
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword
  } = useForm<PasswordFormData>();

  useEffect(() => {
    if (user) {
      resetProfile({
        first_name: user.first_name,
        last_name: user.last_name,
        institution: user.institution || ''
      });
    }
  }, [user, resetProfile]);

  const onSubmitProfile = async (data: ProfileFormData) => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(getApiUrl(API_CONFIG.ENDPOINTS.USER.PROFILE), {
        method: 'PUT',
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const updatedUser: User = await response.json();
        updateUser(updatedUser);
        setIsEditing(false);
        toast({
          title: 'Profile updated',
          description: 'Your profile has been updated successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmitPassword = async (data: PasswordFormData) => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(getApiUrl(API_CONFIG.ENDPOINTS.USER.CHANGE_PASSWORD), {
        method: 'POST',
        body: JSON.stringify({
          current_password: data.currentPassword,
          new_password: data.newPassword
        })
      });

      if (response.ok) {
        resetPassword();
        onClose();
        toast({
          title: 'Password changed',
          description: 'Your password has been changed successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change password');
      }
    } catch (error: any) {
      toast({
        title: 'Password change failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        const response = await authenticatedFetch(getApiUrl(API_CONFIG.ENDPOINTS.USER.PROFILE), {
          method: 'DELETE'
        });

        if (response.ok) {
          toast({
            title: 'Account deleted',
            description: 'Your account has been deleted successfully.',
            status: 'success',
            duration: 5000,
            isClosable: true
          });
          logout();
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete account');
        }
      } catch (error: any) {
        toast({
          title: 'Deletion failed',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true
        });
      }
    }
  };

  if (!user) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  return (
    <Container maxW="4xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading size="lg">Profile Settings</Heading>

        {/* Account Information */}
        <Card>
          <CardBody>
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between">
                <Heading size="md">Account Information</Heading>
                <HStack>
                  <Badge colorScheme={user.email_verified ? 'green' : 'yellow'}>
                    {user.email_verified ? 'Email Verified' : 'Email Pending'}
                  </Badge>
                  <Badge colorScheme="blue">
                    {user.user_type === 'academic' ? 'Academic' : 'Industry'}
                  </Badge>
                </HStack>
              </HStack>

              <Text color="gray.600">
                <strong>Email:</strong> {user.email}
              </Text>
              <Text color="gray.600">
                <strong>Member since:</strong> {new Date(user.created_at).toLocaleDateString()}
              </Text>

              {!user.email_verified && (
                <Alert status="warning">
                  <AlertIcon />
                  Please verify your email address to access all features.
                </Alert>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Profile Form */}
        <Card>
          <CardBody>
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between">
                <Heading size="md">Personal Information</Heading>
                {!isEditing && (
                  <Button onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                )}
              </HStack>

              <Box as="form" onSubmit={handleSubmitProfile(onSubmitProfile)}>
                <VStack spacing={4}>
                  <HStack w="full">
                    <FormControl isInvalid={!!profileErrors.first_name}>
                      <FormLabel>First Name</FormLabel>
                      <Input
                        {...registerProfile('first_name')}
                        isReadOnly={!isEditing}
                        bg={!isEditing ? 'gray.50' : 'white'}
                      />
                      <FormErrorMessage>
                        {profileErrors.first_name?.message}
                      </FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={!!profileErrors.last_name}>
                      <FormLabel>Last Name</FormLabel>
                      <Input
                        {...registerProfile('last_name')}
                        isReadOnly={!isEditing}
                        bg={!isEditing ? 'gray.50' : 'white'}
                      />
                      <FormErrorMessage>
                        {profileErrors.last_name?.message}
                      </FormErrorMessage>
                    </FormControl>
                  </HStack>

                  <FormControl isInvalid={!!profileErrors.institution}>
                    <FormLabel>Institution</FormLabel>
                    <Input
                      {...registerProfile('institution')}
                      isReadOnly={!isEditing}
                      bg={!isEditing ? 'gray.50' : 'white'}
                      placeholder="Your institution or company"
                    />
                    <FormErrorMessage>
                      {profileErrors.institution?.message}
                    </FormErrorMessage>
                  </FormControl>

                  {isEditing && (
                    <HStack w="full" justify="flex-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          resetProfile();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        colorScheme="blue"
                        isLoading={loading}
                        loadingText="Saving..."
                      >
                        Save Changes
                      </Button>
                    </HStack>
                  )}
                </VStack>
              </Box>
            </VStack>
          </CardBody>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardBody>
            <VStack spacing={6} align="stretch">
              <Heading size="md">Security Settings</Heading>
              
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold">Password</Text>
                    <Text fontSize="sm" color="gray.600">
                      Change your account password
                    </Text>
                  </VStack>
                  <Button onClick={onOpen}>
                    Change Password
                  </Button>
                </HStack>

                <Divider />

                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold" color="red.500">Delete Account</Text>
                    <Text fontSize="sm" color="gray.600">
                      Permanently delete your account and all associated data
                    </Text>
                  </VStack>
                  <Button colorScheme="red" variant="outline" onClick={handleDeleteAccount}>
                    Delete Account
                  </Button>
                </HStack>
              </VStack>
            </VStack>
          </CardBody>
        </Card>
      </VStack>

      {/* Change Password Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Change Password</ModalHeader>
          <ModalCloseButton />
          <Box as="form" onSubmit={handleSubmitPassword(onSubmitPassword)}>
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isInvalid={!!passwordErrors.currentPassword}>
                  <FormLabel>Current Password</FormLabel>
                  <Input
                    type="password"
                    {...registerPassword('currentPassword')}
                    placeholder="Enter current password"
                  />
                  <FormErrorMessage>
                    {passwordErrors.currentPassword?.message}
                  </FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!passwordErrors.newPassword}>
                  <FormLabel>New Password</FormLabel>
                  <Input
                    type="password"
                    {...registerPassword('newPassword')}
                    placeholder="Enter new password"
                  />
                  <FormErrorMessage>
                    {passwordErrors.newPassword?.message}
                  </FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!passwordErrors.confirmPassword}>
                  <FormLabel>Confirm New Password</FormLabel>
                  <Input
                    type="password"
                    {...registerPassword('confirmPassword')}
                    placeholder="Confirm new password"
                  />
                  <FormErrorMessage>
                    {passwordErrors.confirmPassword?.message}
                  </FormErrorMessage>
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                colorScheme="blue"
                isLoading={loading}
                loadingText="Changing..."
              >
                Change Password
              </Button>
            </ModalFooter>
          </Box>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default Profile;
