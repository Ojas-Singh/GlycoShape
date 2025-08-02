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
  Code,
  Tooltip,
  Divider,
  List,
  ListItem,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay
} from '@chakra-ui/react';
import { AddIcon, CopyIcon, DeleteIcon, ViewIcon } from '@chakra-ui/icons';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';
import { getApiUrl, API_CONFIG } from '../config/api';
import { License } from '../types';
import LoadingSpinner from '../common/LoadingSpinner';
import LicenseGenerator from './Generator';

const LicenseList: React.FC = () => {
  const authenticatedFetch = useAuthenticatedFetch();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const { isOpen: isGeneratorOpen, onOpen: onGeneratorOpen, onClose: onGeneratorClose } = useDisclosure();
  const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onClose: onDetailsClose } = useDisclosure();
  const { isOpen: isRevokeOpen, onOpen: onRevokeOpen, onClose: onRevokeClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();

  const fetchLicenses = async () => {
    try {
      const response = await authenticatedFetch(getApiUrl(API_CONFIG.ENDPOINTS.LICENSES.LIST));
      
      if (response.ok) {
        const data = await response.json();
        // Ensure data is an array
        if (Array.isArray(data)) {
          setLicenses(data);
        } else if (data && Array.isArray(data.licenses)) {
          setLicenses(data.licenses);
        } else {
          console.warn('API returned unexpected data format:', data);
          setLicenses([]);
        }
      } else {
        throw new Error('Failed to fetch licenses');
      }
    } catch (error: any) {
      console.error('Error fetching licenses:', error);
      setLicenses([]); // Ensure licenses is always an array
      toast({
        title: 'Error loading licenses',
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
    fetchLicenses();
  }, []);

  const handleRevoke = async (licenseId: string) => {
    try {
      const response = await authenticatedFetch(`${getApiUrl(API_CONFIG.ENDPOINTS.LICENSES.REVOKE)}/${licenseId}/revoke`, {
        method: 'POST'
      });

      if (response.ok) {
        setLicenses(licenses.filter(license => license.id !== licenseId));
        toast({
          title: 'License revoked',
          description: 'The license has been revoked successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true
        });
      } else {
        throw new Error('Failed to revoke license');
      }
    } catch (error: any) {
      toast({
        title: 'Error revoking license',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
    onRevokeClose();
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Copied to clipboard',
        description: `${type} has been copied to your clipboard.`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'revoked': return 'red';
      case 'expired': return 'orange';
      default: return 'gray';
    }
  };

  const getLicenseTypeDisplay = (type: string) => {
    switch (type) {
      case 'academic_perpetual': return 'Academic Perpetual';
      case 'industry_onsite': return 'Industry On-Site';
      default: return type;
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading licenses..." />;
  }

  return (
    <Container maxW="7xl" py={8}>
      <VStack spacing={8} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg">Software Licenses</Heading>
          <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onGeneratorOpen}>
            Generate License
          </Button>
        </HStack>

        {licenses.length === 0 ? (
          <Card>
            <CardBody textAlign="center" py={12}>
              <VStack spacing={4}>
                <Text fontSize="lg" color="gray.500">
                  No licenses found
                </Text>
                <Text color="gray.600">
                  Generate your first software license to use GlycoShape tools offline
                </Text>
                <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onGeneratorOpen}>
                  Generate Your First License
                </Button>
              </VStack>
            </CardBody>
          </Card>
        ) : (
          <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={6}>
            {Array.isArray(licenses) && licenses.length > 0 ? licenses.map((license) => (
              <Card key={license.id}>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="bold" fontSize="lg">
                          {getLicenseTypeDisplay(license.license_type)}
                        </Text>
                        <HStack>
                          <Badge colorScheme={getStatusColor(license.status)}>
                            {license.status}
                          </Badge>
                          <Text fontSize="sm" color="gray.600">
                            ID: {license.id.slice(0, 8)}...
                          </Text>
                        </HStack>
                      </VStack>
                      <HStack>
                        <IconButton
                          aria-label="View details"
                          icon={<ViewIcon />}
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedLicense(license);
                            onDetailsOpen();
                          }}
                        />
                        <IconButton
                          aria-label="Revoke license"
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          isDisabled={license.status !== 'active'}
                          onClick={() => {
                            setSelectedLicense(license);
                            onRevokeOpen();
                          }}
                        />
                      </HStack>
                    </HStack>

                    <Box>
                      <Text fontSize="sm" fontWeight="bold" mb={2}>License Key:</Text>
                      <HStack>
                        <Code fontSize="xs" p={2} bg="gray.50" wordBreak="break-all">
                          {license.license_key}
                        </Code>
                        <Tooltip label="Copy license key">
                          <IconButton
                            aria-label="Copy license key"
                            icon={<CopyIcon />}
                            size="sm"
                            onClick={() => copyToClipboard(license.license_key, 'License key')}
                          />
                        </Tooltip>
                      </HStack>
                    </Box>

                    <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                      <Box>
                        <Text fontSize="sm" fontWeight="bold">Max Activations:</Text>
                        <Text>{license.max_activations}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" fontWeight="bold">Current Activations:</Text>
                        <Text color={license.current_activations >= license.max_activations ? 'red.500' : 'green.500'}>
                          {license.current_activations} / {license.max_activations}
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" fontWeight="bold">Created:</Text>
                        <Text fontSize="sm">{new Date(license.created_at).toLocaleDateString()}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" fontWeight="bold">Expires:</Text>
                        <Text fontSize="sm">
                          {license.expires_at ? 
                            new Date(license.expires_at).toLocaleDateString() : 
                            'Never'}
                        </Text>
                      </Box>
                    </Grid>

                    <Box>
                      <Text fontSize="sm" fontWeight="bold" mb={2}>Licensed Tools:</Text>
                      <HStack wrap="wrap">
                        {license.tools.map((tool, index) => (
                          <Badge key={index} variant="outline">
                            {tool}
                          </Badge>
                        ))}
                      </HStack>
                    </Box>

                    {license.machine_fingerprints.length > 0 && (
                      <Box>
                        <Text fontSize="sm" fontWeight="bold" mb={2}>
                          Active Machines ({license.machine_fingerprints.length}):
                        </Text>
                        <VStack align="start" spacing={1}>
                          {license.machine_fingerprints.slice(0, 2).map((fingerprint, index) => (
                            <Code key={index} fontSize="xs">
                              {fingerprint.slice(0, 16)}...
                            </Code>
                          ))}
                          {license.machine_fingerprints.length > 2 && (
                            <Text fontSize="xs" color="gray.500">
                              +{license.machine_fingerprints.length - 2} more...
                            </Text>
                          )}
                        </VStack>
                      </Box>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            )) : (
              <Card>
                <CardBody>
                  <VStack spacing={4} align="center" py={8}>
                    <Text color="gray.500">No licenses found</Text>
                    <Text fontSize="sm" color="gray.400">
                      Your licenses will appear here once they are generated
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            )}
          </Grid>
        )}
      </VStack>

      {/* License Generator Modal */}
      <Modal isOpen={isGeneratorOpen} onClose={onGeneratorClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Generate New License</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <LicenseGenerator 
              onSuccess={() => {
                onGeneratorClose();
                fetchLicenses();
              }}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* License Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={onDetailsClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>License Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedLicense && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold" mb={2}>Full License Key:</Text>
                  <Code p={3} bg="gray.50" wordBreak="break-all" w="full">
                    {selectedLicense.license_key}
                  </Code>
                  <Button
                    mt={2}
                    size="sm"
                    leftIcon={<CopyIcon />}
                    onClick={() => copyToClipboard(selectedLicense.license_key, 'License key')}
                  >
                    Copy
                  </Button>
                </Box>

                <Divider />

                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <Box>
                    <Text fontWeight="bold">License Type:</Text>
                    <Text>{getLicenseTypeDisplay(selectedLicense.license_type)}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Status:</Text>
                    <Badge colorScheme={getStatusColor(selectedLicense.status)}>
                      {selectedLicense.status}
                    </Badge>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Max Activations:</Text>
                    <Text>{selectedLicense.max_activations}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Current Activations:</Text>
                    <Text>{selectedLicense.current_activations}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Created:</Text>
                    <Text>{new Date(selectedLicense.created_at).toLocaleString()}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Expires:</Text>
                    <Text>
                      {selectedLicense.expires_at ? 
                        new Date(selectedLicense.expires_at).toLocaleString() : 
                        'Never'}
                    </Text>
                  </Box>
                </Grid>

                <Box>
                  <Text fontWeight="bold" mb={2}>Licensed Tools:</Text>
                  <List spacing={1}>
                    {selectedLicense.tools.map((tool, index) => (
                      <ListItem key={index}>• {tool}</ListItem>
                    ))}
                  </List>
                </Box>

                {selectedLicense.machine_fingerprints.length > 0 && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>Machine Fingerprints:</Text>
                    <VStack align="start" spacing={2}>
                      {selectedLicense.machine_fingerprints.map((fingerprint, index) => (
                        <HStack key={index} w="full">
                          <Code fontSize="xs" flex={1}>
                            {fingerprint}
                          </Code>
                          <IconButton
                            aria-label="Copy fingerprint"
                            icon={<CopyIcon />}
                            size="xs"
                            onClick={() => copyToClipboard(fingerprint, 'Machine fingerprint')}
                          />
                        </HStack>
                      ))}
                    </VStack>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onDetailsClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog
        isOpen={isRevokeOpen}
        leastDestructiveRef={cancelRef}
        onClose={onRevokeClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Revoke License
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to revoke this license? 
              This action cannot be undone and any software using this license will stop working.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onRevokeClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={() => selectedLicense && handleRevoke(selectedLicense.id)} 
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

export default LicenseList;
