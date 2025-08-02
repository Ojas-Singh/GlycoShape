import React, { useState, useEffect } from 'react';
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
  Grid,
  GridItem,
  Badge,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Flex,
  useColorModeValue
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FiUser, FiKey, FiCreditCard, FiActivity, FiSettings } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';
import { getApiUrl, API_CONFIG } from '../config/api';
import { UsageSummary, Subscription } from '../types';
import LoadingSpinner from '../common/LoadingSpinner';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [usageResponse, subscriptionResponse] = await Promise.all([
          authenticatedFetch(getApiUrl(API_CONFIG.ENDPOINTS.USER.USAGE)),
          authenticatedFetch(getApiUrl(API_CONFIG.ENDPOINTS.SUBSCRIPTIONS.CURRENT))
        ]);

        if (usageResponse.ok) {
          const usageData = await usageResponse.json();
          setUsageSummary(usageData);
        }

        if (subscriptionResponse.ok) {
          const subData = await subscriptionResponse.json();
          setSubscription(subData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [authenticatedFetch]);

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const getSubscriptionStatus = () => {
    if (!subscription) return { text: 'No Subscription', color: 'gray' };
    
    switch (subscription.status) {
      case 'active':
        return { text: 'Active', color: 'green' };
      case 'cancelled':
        return { text: 'Cancelled', color: 'red' };
      case 'pending':
        return { text: 'Pending', color: 'yellow' };
      case 'expired':
        return { text: 'Expired', color: 'red' };
      default:
        return { text: 'Unknown', color: 'gray' };
    }
  };

  const subscriptionStatus = getSubscriptionStatus();

  return (
    <Container maxW="7xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Welcome Section */}
        <Box>
          <Heading size="lg" mb={2}>
            Welcome back, {user?.first_name}!
          </Heading>
          <Text color="gray.600">
            Here's an overview of your GlycoShape account and usage.
          </Text>
        </Box>

        {/* Quick Stats */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={6}>
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel>API Requests (30 days)</StatLabel>
                <StatNumber>{usageSummary?.api_requests_last_30_days || 0}</StatNumber>
                <StatHelpText>Total: {usageSummary?.total_api_requests || 0}</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel>Active Licenses</StatLabel>
                <StatNumber>{usageSummary?.active_licenses || 0}</StatNumber>
                <StatHelpText>Software licenses</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel>API Keys</StatLabel>
                <StatNumber>{usageSummary?.active_api_keys || 0}</StatNumber>
                <StatHelpText>Active keys</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel>Credits Used</StatLabel>
                <StatNumber>{usageSummary?.credits_consumed || 0}</StatNumber>
                <StatHelpText>Total consumed</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </Grid>

        {/* Subscription Status */}
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Flex justify="space-between" align="center">
              <VStack align="start" spacing={2}>
                <Heading size="md">Subscription Status</Heading>
                <HStack>
                  <Badge colorScheme={subscriptionStatus.color}>
                    {subscriptionStatus.text}
                  </Badge>
                  {subscription && (
                    <Text fontSize="sm" color="gray.600">
                      Plan: {subscription.plan_type}
                    </Text>
                  )}
                </HStack>
                {subscription?.expires_at && (
                  <Text fontSize="sm" color="gray.600">
                    Expires: {new Date(subscription.expires_at).toLocaleDateString()}
                  </Text>
                )}
              </VStack>
              <Button as={RouterLink} to="/ums/subscriptions" colorScheme="blue">
                Manage Subscription
              </Button>
            </Flex>
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Heading size="md" mb={4}>Quick Actions</Heading>
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={4}>
              <Button
                as={RouterLink}
                to="/ums/profile"
                leftIcon={<Icon as={FiUser} />}
                variant="outline"
                justifyContent="flex-start"
                h="auto"
                py={4}
              >
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold">Profile Settings</Text>
                  <Text fontSize="sm" color="gray.600">Update your information</Text>
                </VStack>
              </Button>

              <Button
                as={RouterLink}
                to="/ums/api-keys"
                leftIcon={<Icon as={FiKey} />}
                variant="outline"
                justifyContent="flex-start"
                h="auto"
                py={4}
              >
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold">API Keys</Text>
                  <Text fontSize="sm" color="gray.600">Manage your API access</Text>
                </VStack>
              </Button>

              <Button
                as={RouterLink}
                to="/ums/licenses"
                leftIcon={<Icon as={FiCreditCard} />}
                variant="outline"
                justifyContent="flex-start"
                h="auto"
                py={4}
              >
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold">Licenses</Text>
                  <Text fontSize="sm" color="gray.600">Software licenses</Text>
                </VStack>
              </Button>

              <Button
                as={RouterLink}
                to="/ums/usage"
                leftIcon={<Icon as={FiActivity} />}
                variant="outline"
                justifyContent="flex-start"
                h="auto"
                py={4}
              >
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold">Usage Analytics</Text>
                  <Text fontSize="sm" color="gray.600">View detailed usage</Text>
                </VStack>
              </Button>

              <Button
                as={RouterLink}
                to="/ums/subscriptions"
                leftIcon={<Icon as={FiSettings} />}
                variant="outline"
                justifyContent="flex-start"
                h="auto"
                py={4}
              >
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold">Subscriptions</Text>
                  <Text fontSize="sm" color="gray.600">Upgrade or manage plans</Text>
                </VStack>
              </Button>
            </Grid>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

export default Dashboard;
