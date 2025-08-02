import React from 'react';
import { Box, Container, Heading, Text, VStack, Button, SimpleGrid, Card, CardBody } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

const Dashboard: React.FC = () => {
  return (
    <Container maxW="7xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading size="xl" mb={4}>GlycoShape Dashboard</Heading>
          <Text color="gray.600" fontSize="lg">
            Access GlycoShape tools and services
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          <Card>
            <CardBody>
              <VStack spacing={4}>
                <Heading size="md">Glycan Search</Heading>
                <Text textAlign="center" color="gray.600">
                  Search our comprehensive database of glycan structures
                </Text>
                <Button as={RouterLink} to="/search" colorScheme="blue">
                  Search Database
                </Button>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <VStack spacing={4}>
                <Heading size="md">ReGlyco Tools</Heading>
                <Text textAlign="center" color="gray.600">
                  Generate and analyze glycan conformations
                </Text>
                <Button as={RouterLink} to="/reglyco" colorScheme="green">
                  Launch ReGlyco
                </Button>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <VStack spacing={4}>
                <Heading size="md">User Management</Heading>
                <Text textAlign="center" color="gray.600">
                  Manage your account, subscriptions, and API access
                </Text>
                <Button as={RouterLink} to="/ums" colorScheme="purple">
                  Account Portal
                </Button>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <VStack spacing={4}>
                <Heading size="md">API Documentation</Heading>
                <Text textAlign="center" color="gray.600">
                  Integrate GlycoShape into your applications
                </Text>
                <Button as={RouterLink} to="/api-docs" colorScheme="orange">
                  View API Docs
                </Button>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <VStack spacing={4}>
                <Heading size="md">Downloads</Heading>
                <Text textAlign="center" color="gray.600">
                  Download datasets and software tools
                </Text>
                <Button as={RouterLink} to="/downloads" colorScheme="teal">
                  Browse Downloads
                </Button>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <VStack spacing={4}>
                <Heading size="md">Help & Support</Heading>
                <Text textAlign="center" color="gray.600">
                  Tutorials, FAQ, and community support
                </Text>
                <Button as={RouterLink} to="/faq" colorScheme="gray">
                  Get Help
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>
      </VStack>
    </Container>
  );
};

export default Dashboard;
