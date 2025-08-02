import React from 'react';
import {
  Box,
  Flex,
  HStack,
  VStack,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar,
  Text,
  useColorModeValue,
  Container,
  Badge
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleLogout = async () => {
    await logout();
    navigate('/ums/login');
  };

  return (
    <Box bg={bg} borderBottom="1px" borderColor={borderColor} px={4}>
      <Container maxW="7xl">
        <Flex h={16} alignItems="center" justifyContent="space-between">
          <HStack spacing={8} alignItems="center">
            <RouterLink to="/ums/">
              <Text fontSize="xl" fontWeight="bold" color="blue.500" fontFamily="heading">
                GlycoShape UMS
              </Text>
            </RouterLink>

            <HStack as="nav" spacing={4} display={{ base: 'none', md: 'flex' }}>
              <Button as={RouterLink} to="/ums/" variant="ghost" fontFamily="body">
                Dashboard
              </Button>
              <Button as={RouterLink} to="/ums/subscriptions" variant="ghost" fontFamily="body">
                Subscriptions
              </Button>
              <Button as={RouterLink} to="/ums/licenses" variant="ghost" fontFamily="body">
                Licenses
              </Button>
              <Button as={RouterLink} to="/ums/api-keys" variant="ghost" fontFamily="body">
                API Keys
              </Button>
            </HStack>
          </HStack>

          <Flex alignItems="center">
            <Menu>
              <MenuButton
                as={Button}
                rounded="full"
                variant="link"
                cursor="pointer"
                minW={0}
              >
                <HStack>
                  <Avatar
                    size="sm"
                    name={user ? `${user.first_name} ${user.last_name}` : 'User'}
                  />
                  <VStack
                    display={{ base: 'none', md: 'flex' }}
                    alignItems="flex-start"
                    spacing="1px"
                    ml="2"
                  >
                    <Text fontSize="sm" fontFamily="body">{user?.first_name} {user?.last_name}</Text>
                    <Badge size="sm" colorScheme="blue">
                      {user?.user_type === 'academic' ? 'Academic' : 'Industry'}
                    </Badge>
                  </VStack>
                  <Box display={{ base: 'none', md: 'flex' }}>
                    <ChevronDownIcon />
                  </Box>
                </HStack>
              </MenuButton>
              <MenuList>
                <MenuItem as={RouterLink} to="/profile">
                  Profile Settings
                </MenuItem>
                <MenuItem as={RouterLink} to="/usage">
                  Usage Analytics
                </MenuItem>
                <MenuDivider />
                <MenuItem onClick={handleLogout}>
                  Sign Out
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
};

export default Navigation;
