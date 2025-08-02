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
  List,
  ListItem,
  ListIcon,
  Divider,
  Alert,
  AlertIcon,
  useToast
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';
import { getApiUrl, API_CONFIG } from '../config/api';
import { SubscriptionPlan, Subscription } from '../types';
import LoadingSpinner from '../common/LoadingSpinner';

const Plans: React.FC = () => {
  const { user } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansResponse, subscriptionResponse] = await Promise.all([
          fetch(getApiUrl(API_CONFIG.ENDPOINTS.SUBSCRIPTIONS.PLANS)),
          authenticatedFetch(getApiUrl(API_CONFIG.ENDPOINTS.SUBSCRIPTIONS.CURRENT))
        ]);

        if (plansResponse.ok) {
          const plansData = await plansResponse.json();
          // Ensure plansData is an array
          if (Array.isArray(plansData)) {
            setPlans(plansData);
          } else if (plansData.plans && Array.isArray(plansData.plans)) {
            setPlans(plansData.plans);
          } else {
            console.error('Plans data is not an array:', plansData);
            setPlans([]);
          }
        } else {
          console.error('Failed to fetch plans:', plansResponse.status);
          setPlans([]);
        }

        if (subscriptionResponse.ok) {
          const subData = await subscriptionResponse.json();
          setCurrentSubscription(subData);
        }
      } catch (error) {
        console.error('Error fetching subscription data:', error);
        setPlans([]); // Ensure plans is always an array
        setCurrentSubscription(null);
        toast({
          title: 'Error loading plans',
          description: 'Failed to load subscription plans. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authenticatedFetch, toast]);

  const handleSubscribe = async (planType: string) => {
    setSubscribing(planType);
    
    try {
      const response = await authenticatedFetch(getApiUrl(API_CONFIG.ENDPOINTS.SUBSCRIPTIONS.SUBSCRIBE), {
        method: 'POST',
        body: JSON.stringify({ plan_type: planType })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.approval_url) {
          // Redirect to PayPal for payment
          window.location.href = result.approval_url;
        } else {
          // Free plan activation
          setCurrentSubscription(result.subscription);
          toast({
            title: 'Subscription activated',
            description: 'Your subscription has been activated successfully!',
            status: 'success',
            duration: 5000,
            isClosable: true
          });
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Subscription failed');
      }
    } catch (error: any) {
      toast({
        title: 'Subscription failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setSubscribing(null);
    }
  };

  const getPrice = (plan: SubscriptionPlan) => {
    if (plan.is_free) return 'Free';
    
    const price = user?.user_type === 'academic' ? plan.price_academic : plan.price_industry;
    if (!price) return 'Contact us';
    
    const cycle = plan.billing_cycle === 'yearly' ? '/year' : '/month';
    return `$${price}${cycle}`;
  };

  const isCurrentPlan = (planType: string) => {
    return currentSubscription?.plan_type === planType && currentSubscription?.status === 'active';
  };

  if (loading) {
    return <LoadingSpinner message="Loading subscription plans..." />;
  }

  return (
    <Container maxW="7xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading size="xl" mb={4}>
            Choose Your Plan
          </Heading>
          <Text color="gray.600" fontSize="lg">
            Select the plan that best fits your research or business needs
          </Text>
        </Box>

        {currentSubscription && (
          <Alert status="info">
            <AlertIcon />
            <VStack align="start" spacing={1}>
              <Text fontWeight="bold">
                Current Plan: {currentSubscription.plan_type}
              </Text>
              <Text fontSize="sm">
                Status: {currentSubscription.status} 
                {currentSubscription.expires_at && (
                  ` • Expires: ${new Date(currentSubscription.expires_at).toLocaleDateString()}`
                )}
              </Text>
            </VStack>
          </Alert>
        )}

        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={8}>
          {Array.isArray(plans) && plans.length > 0 ? (
            plans.map((plan) => (
            <Card
              key={plan.plan_type}
              position="relative"
              border={isCurrentPlan(plan.plan_type) ? "2px" : "1px"}
              borderColor={isCurrentPlan(plan.plan_type) ? "blue.500" : "gray.200"}
            >
              {isCurrentPlan(plan.plan_type) && (
                <Badge
                  position="absolute"
                  top="-10px"
                  left="50%"
                  transform="translateX(-50%)"
                  colorScheme="blue"
                  px={3}
                  py={1}
                >
                  Current Plan
                </Badge>
              )}
              
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <VStack spacing={2} align="center">
                    <Heading size="lg">{plan.name}</Heading>
                    <Text color="gray.600" textAlign="center">
                      {plan.description}
                    </Text>
                    <Text fontSize="3xl" fontWeight="bold" color="blue.500">
                      {getPrice(plan)}
                    </Text>
                    {user?.user_type === 'academic' && plan.price_industry && (
                      <Text fontSize="sm" color="gray.500">
                        Industry price: ${plan.price_industry}
                        {plan.billing_cycle === 'yearly' ? '/year' : '/month'}
                      </Text>
                    )}
                  </VStack>

                  <Divider />

                  <VStack spacing={3} align="stretch">
                    <Text fontWeight="bold">Features:</Text>
                    <List spacing={2}>
                      {plan.features.map((feature, index) => (
                        <ListItem key={index}>
                          <ListIcon as={CheckIcon} color="green.500" />
                          {feature}
                        </ListItem>
                      ))}
                    </List>
                  </VStack>

                  <Button
                    colorScheme={isCurrentPlan(plan.plan_type) ? "gray" : "blue"}
                    size="lg"
                    isDisabled={isCurrentPlan(plan.plan_type)}
                    isLoading={subscribing === plan.plan_type}
                    loadingText="Processing..."
                    onClick={() => handleSubscribe(plan.plan_type)}
                  >
                    {isCurrentPlan(plan.plan_type) ? 'Current Plan' : 
                     plan.is_free ? 'Activate Free Plan' : 'Subscribe Now'}
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          ))
          ) : (
            <Card>
              <CardBody textAlign="center" py={12}>
                <VStack spacing={4}>
                  <Text fontSize="lg" color="gray.500">
                    No subscription plans available
                  </Text>
                  <Text color="gray.600">
                    Please try again later or contact support
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          )}
        </Grid>

        {/* Academic Notice */}
        {user?.user_type === 'academic' && (
          <Alert status="info">
            <AlertIcon />
            <VStack align="start" spacing={1}>
              <Text fontWeight="bold">Academic Pricing</Text>
              <Text fontSize="sm">
                You're eligible for academic pricing! Make sure to use your .edu email address
                to qualify for reduced rates.
              </Text>
            </VStack>
          </Alert>
        )}

        {/* Feature Comparison */}
        <Card>
          <CardBody>
            <Heading size="md" mb={4}>
              Need help choosing?
            </Heading>
            <VStack spacing={3} align="start">
              <Text>
                <strong>Free Academic:</strong> Perfect for students and researchers getting started
              </Text>
              <Text>
                <strong>Pro Academic:</strong> Advanced features for serious research projects
              </Text>
              <Text>
                <strong>Enterprise:</strong> Full commercial license with priority support
              </Text>
            </VStack>
            <Button mt={4} variant="outline" colorScheme="blue">
              Contact Sales for Custom Plans
            </Button>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

export default Plans;
