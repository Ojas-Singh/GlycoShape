import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  Badge,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, ViewIcon } from '@chakra-ui/icons';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';
import { getApiUrl, API_CONFIG } from '../config/api';
import { APIKey } from '../types';
import LoadingSpinner from '../common/LoadingSpinner';
import APIKeyGenerator from './Generator';

const KeyList: React.FC = () => {
  const authenticatedFetch = useAuthenticatedFetch();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<APIKey | null>(null);
  const { isOpen: isGeneratorOpen, onOpen: onGeneratorOpen, onClose: onGeneratorClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();

  const fetchApiKeys = async () => {
    try {
      const response = await authenticatedFetch(getApiUrl(API_CONFIG.ENDPOINTS.API_KEYS.LIST));
      
      if (response.ok) {
        const data = await response.json();
        // Ensure data is an array
        if (Array.isArray(data)) {
          setApiKeys(data);
        } else if (data && Array.isArray(data.api_keys)) {
          setApiKeys(data.api_keys);
        } else {
          console.warn('API returned unexpected data format:', data);
          setApiKeys([]);
        }
      } else {
        throw new Error('Failed to fetch API keys');
      }
    } catch (error: any) {
      console.error('Error fetching API keys:', error);
      setApiKeys([]); // Ensure apiKeys is always an array
      toast({
        title: 'Error loading API keys',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const handleRevoke = async (keyId: string) => {
    try {
      const response = await authenticatedFetch(`${getApiUrl(API_CONFIG.ENDPOINTS.API_KEYS.REVOKE)}/${keyId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setApiKeys(apiKeys.filter(key => key.id !== keyId));
        toast({
          title: 'API key revoked',
          description: 'The API key has been revoked successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true
        });
      } else {
        throw new Error('Failed to revoke API key');
      }
    } catch (error: any) {
      toast({
        title: 'Error revoking API key',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
    onDeleteClose();
  };

  const handleAddCredits = async (keyId: string, credits: number) => {
    try {
      const response = await authenticatedFetch(getApiUrl(API_CONFIG.ENDPOINTS.API_KEYS.ADD_CREDITS), {
        method: 'POST',
        body: JSON.stringify({ key_id: keyId, credits })
      });

      if (response.ok) {
        await fetchApiKeys(); // Refresh the list
        toast({
          title: 'Credits added',
          description: `${credits} credits have been added to the API key.`,
          status: 'success',
          duration: 5000,
          isClosable: true
        });
      } else {
        throw new Error('Failed to add credits');
      }
    } catch (error: any) {
      toast({
        title: 'Error adding credits',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'green' : 'red';
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'gray';
      case 'pay_per_use': return 'blue';
      case 'unlimited': return 'purple';
      default: return 'gray';
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading API keys..." />;
  }

  return (
    <Container maxW="7xl" py={8}>
      <VStack spacing={8} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg">API Keys</Heading>
          <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onGeneratorOpen}>
            Generate New Key
          </Button>
        </HStack>

        {apiKeys.length === 0 ? (
          <Card>
            <CardBody textAlign="center" py={12}>
              <VStack spacing={4}>
                <Text fontSize="lg" color="gray.500">
                  No API keys found
                </Text>
                <Text color="gray.600">
                  Create your first API key to start using the GlycoShape API
                </Text>
                <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onGeneratorOpen}>
                  Generate Your First API Key
                </Button>
              </VStack>
            </CardBody>
          </Card>
        ) : (
          <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={6}>
            {Array.isArray(apiKeys) && apiKeys.length > 0 ? apiKeys.map((apiKey) => (
              <Card key={apiKey.id}>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="bold" fontSize="lg">
                          {apiKey.key_name}
                        </Text>
                        <HStack>
                          <Badge colorScheme={getStatusColor(apiKey.status)}>
                            {apiKey.status}
                          </Badge>
                          <Badge colorScheme={getTierColor(apiKey.pricing_tier)}>
                            {apiKey.pricing_tier.replace('_', ' ')}
                          </Badge>
                        </HStack>
                      </VStack>
                      <IconButton
                        aria-label="Delete API key"
                        icon={<DeleteIcon />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => {
                          setSelectedKey(apiKey);
                          onDeleteOpen();
                        }}
                      />
                    </HStack>

                    <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                      <Stat size="sm">
                        <StatLabel>Credits Remaining</StatLabel>
                        <StatNumber>
                          {apiKey.pricing_tier === 'unlimited' ? '∞' : 
                           apiKey.credits_remaining || 0}
                        </StatNumber>
                      </Stat>
                      <Stat size="sm">
                        <StatLabel>Usage Count</StatLabel>
                        <StatNumber>{apiKey.usage_count}</StatNumber>
                      </Stat>
                      <Stat size="sm">
                        <StatLabel>Rate Limit</StatLabel>
                        <StatNumber>{apiKey.rate_limit_per_minute}/min</StatNumber>
                      </Stat>
                      <Stat size="sm">
                        <StatLabel>Last Used</StatLabel>
                        <StatHelpText>
                          {apiKey.last_used_at ? 
                            new Date(apiKey.last_used_at).toLocaleDateString() : 
                            'Never'}
                        </StatHelpText>
                      </Stat>
                    </Grid>

                    <VStack spacing={2} align="stretch">
                      <Text fontSize="sm" fontWeight="bold">Allowed Endpoints:</Text>
                      <Box>
                        {apiKey.allowed_endpoints.map((endpoint, index) => (
                          <Badge key={index} mr={1} mb={1} variant="outline">
                            {endpoint}
                          </Badge>
                        ))}
                      </Box>
                    </VStack>

                    {apiKey.pricing_tier === 'pay_per_use' && (
                      <HStack justify="flex-end">
                        <Button
                          size="sm"
                          colorScheme="green"
                          onClick={() => {
                            const credits = prompt('How many credits would you like to add?');
                            if (credits && !isNaN(Number(credits))) {
                              handleAddCredits(apiKey.id, Number(credits));
                            }
                          }}
                        >
                          Add Credits
                        </Button>
                      </HStack>
                    )}

                    <Text fontSize="xs" color="gray.500">
                      Created: {new Date(apiKey.created_at).toLocaleDateString()}
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            )) : (
              <Card>
                <CardBody>
                  <VStack spacing={4} align="center" py={8}>
                    <Text color="gray.500">No API keys found</Text>
                    <Text fontSize="sm" color="gray.400">
                      Your API keys will appear here once they are generated
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            )}
          </Grid>
        )}
      </VStack>

      {/* API Key Generator Modal */}
      <Modal isOpen={isGeneratorOpen} onClose={onGeneratorClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Generate New API Key</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <APIKeyGenerator 
              onSuccess={() => {
                onGeneratorClose();
                fetchApiKeys();
              }}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Revoke API Key
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to revoke the API key "{selectedKey?.key_name}"? 
              This action cannot be undone and any applications using this key will stop working.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={() => selectedKey && handleRevoke(selectedKey.id)} 
                ml={3}
              >
                Revoke
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
};

export default KeyList;
