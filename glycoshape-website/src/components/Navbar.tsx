import React, { useEffect } from 'react';
import axios from 'axios';
import { Link as RouterLink, useLocation, useNavigate   } from 'react-router-dom';
import {
  Image,
  Button,
  Stack,Badge,
  Flex,
  Box,
  Text,
  Link,
  useBreakpointValue,
  IconButton,
  Divider,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  useDisclosure,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar,
  HStack,
  Spacer
} from "@chakra-ui/react";
import { HamburgerIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { useAuth } from './pro/contexts/AuthContext';
import logo from './assets/logo_white.png';

const Navbar: React.FC = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const isDevelopment = process.env.REACT_APP_BUILD_DEV === "true";
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  
  const handleNavigation = (path: string) => {
    console.log(`Current path: ${location.pathname}, Target path: ${path}`);
    if (location.pathname.substring(0, 5) === path.substring(0, 5)) {
      console.log(`Current path: ${location.pathname}, Target path: ${path}`);
      console.log("Path is the same. Performing full page reload.");
      navigate(path);
      window.location.reload(); // This ensures a full page reload
    } else {
      navigate(path); // Use navigate for navigation to a different path
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getUserDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.email || 'User';
  };

  return (
    <Flex 
      as="nav"  
      bgColor="#28363F" 
      align="center" 
      justify="space-between" 
      wrap="wrap" 
      padding="0.8rem" 
      marginTop={"-0.6rem"} 
      boxShadow="md"
      position="relative"
      zIndex="1000"
    >
      
        <Flex  justify="center" width={{ base: "100%", md: "100%", lg: "100%", xl: "100%" }} margin="0 auto">
      <Box>
        <Stack direction='row' align="center" spacing={2}>
        

        {isDevelopment ? (
        <Text top="50%" fontFamily={'texts'} 
        transform="translateY(0%)"  paddingLeft={"0.5rem"}> <Badge color='#CF6385'>Dev</Badge>   </Text>
      ) : (
        <Image src={logo} alt="GlycoShape Logo" height="50px" paddingLeft={"1rem"} alignSelf="center" />
      )}

        <Link as={RouterLink} fontWeight="bold" fontSize={"3xl"} color={"#F7FFE6"} to="/" fontFamily="heading" alignSelf="center" >GlycoShape</Link>

        </Stack>
      </Box>
<Spacer />  
      {isMobile ? (
        

        <>
          <IconButton
            aria-label="Options"
            icon={<HamburgerIcon color={"#F7FFE6"}/>}
            variant="outline"
            onClick={onOpen}
          />
          <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="full">
            <DrawerOverlay>
              <DrawerContent bg="#28363F" color="#F7FFE6">
                <DrawerCloseButton />
                <DrawerHeader borderBottomWidth="1px">
                <Box>
        <Stack direction='row' align="center" spacing={2}>
  
        {isDevelopment ? (
        <Text top="50%" fontFamily={'texts'} 
        transform="translateY(10%)"  paddingLeft={"0.5rem"}> <Badge color='#CF6385'>Dev</Badge>   </Text>
      ) : (
        <Image src={logo} alt="GlycoShape Logo" height="50px" paddingLeft={"1rem"} alignSelf="center" />
      )}
        
        <Link as={RouterLink} fontWeight="bold" fontSize={"3xl"} color={"#F7FFE6"} to="/" fontFamily="heading">GlycoShape</Link> 
        </Stack>
      </Box>
                </DrawerHeader>
                <DrawerBody>
                  <Button _hover={{
              backgroundColor: "#F7FFE6"
            }} as={RouterLink}  to="/dashboard" w="100%"  onClick={() => { handleNavigation('/dashboard'); onClose(); }} mb={4}>Dashboard</Button>
                  <Button _hover={{
              backgroundColor: "#F7FFE6"
            }} as={RouterLink}  to="/search?query=all" w="100%"  onClick={() => { handleNavigation('/search?query=all'); onClose(); }} mb={4}>Database</Button>
                  <Button _hover={{
              backgroundColor: "#F7FFE6"
            }} as={RouterLink}  to="/reglyco" w="100%" onClick={onClose}  mb={4}>Re-Glyco</Button>
            <Button _hover={{
              backgroundColor: "#F7FFE6"
            }} as={RouterLink}  to="/ensemble" w="100%" onClick={onClose}  mb={4}>Re-Glyco Ensemble</Button>
            
            {isDevelopment ? (
              <div>
        <Button _hover={{
          backgroundColor: "#F7FFE6"
        }} as={RouterLink}  to="/fit" w="100%" onClick={onClose} mb={4}>Re-Glyco Fit</Button>
        <Button _hover={{
          backgroundColor: "#F7FFE6"
        }} as={RouterLink}  to="/chat" w="100%" onClick={onClose} mb={4}>Copilot</Button>
        </div>
        ) : (
          <></>)}

            
            <Button _hover={{
              backgroundColor: "#F7FFE6"
            }} as={RouterLink}  to="/swap" w="100%" onClick={onClose} mb={4}>Swap</Button>
                  <Button _hover={{
              backgroundColor: "#F7FFE6"
            }} as={RouterLink}  to="/downloads" w="100%" onClick={onClose} mb={4}>Downloads</Button>
                  <Button _hover={{
              backgroundColor: "#F7FFE6"
            }} as={RouterLink}  to="/api-docs" w="100%" onClick={onClose} mb={4}>API</Button>
                  <Button _hover={{
              backgroundColor: "#F7FFE6"
            }} as={RouterLink}  to="/sparql-query" w="100%" onClick={onClose} mb={4}>SPARQL</Button>
                  <Button _hover={{
              backgroundColor: "#F7FFE6"
            }} as={RouterLink}  to="/faq" w="100%" onClick={onClose} mb={4}>FAQ</Button>
                  <Button _hover={{
              backgroundColor: "#F7FFE6"
            }} as={RouterLink}  to="/tutorial" w="100%" onClick={onClose} mb={4}>Tutorials</Button>
                  <Button _hover={{
              backgroundColor: "#F7FFE6"
            }} as={RouterLink}  to="/elab" w="100%" onClick={onClose} mb={4}>eLab</Button>
                  
                  {/* Authentication Buttons for Mobile */}
                  <Divider my={4} />
                  {user ? (
                    <>
                      <Button _hover={{
                        backgroundColor: "#F7FFE6"
                      }} as={RouterLink} to="/ums/" w="100%" onClick={onClose} mb={4}>
                        Dashboard
                      </Button>
                      <Button _hover={{
                        backgroundColor: "#F7FFE6"
                      }} as={RouterLink} to="/ums/profile" w="100%" onClick={onClose} mb={4}>
                        Profile
                      </Button>
                      <Button 
                        colorScheme="red" 
                        variant="outline" 
                        w="100%" 
                        onClick={() => { handleLogout(); onClose(); }}
                        mb={4}
                      >
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button _hover={{
                        backgroundColor: "#F7FFE6"
                      }} as={RouterLink} to="/ums/login" w="100%" onClick={onClose} mb={4}>
                        Login
                      </Button>
                    </>
                  )}
                </DrawerBody>
              </DrawerContent>
            </DrawerOverlay>
          </Drawer>
        </>
      ) : (
        <Flex align="center" >
          <Link as={RouterLink} fontWeight="bold" color={"#F7FFE6"} to="/search?query=all"  onClick={() => { handleNavigation('/search?query=all'); onClose(); }}  marginRight="20px" fontFamily="body">Database</Link>

          
        <Menu>
        <MenuButton as={Link} fontWeight="bold" color={"#F7FFE6"} href="#" _hover={{ textDecoration: "none" }} marginRight="20px" px={2} py={2} rounded={'md'} transition="all 0.2s" bg="transparent" fontFamily="body">
          Tools
        </MenuButton>
        <MenuList bg="#28363F" borderColor="#28363F">
          <MenuItem fontWeight="bold" as={RouterLink} to="/reglyco" onClick={() =>  handleNavigation('/reglyco')} _hover={{ bg: "#28363F" }} color={"#F7FFE6"} bgColor={"#28363F"} fontFamily="body">Re-Glyco</MenuItem>
          <MenuItem fontWeight="bold" as={RouterLink} to="/ensemble" onClick={() =>  handleNavigation('/ensemble')} _hover={{ bg: "#28363F" }} color={"#F7FFE6"} bgColor={"#28363F"} fontFamily="body">Re-Glyco Ensemble</MenuItem>
            {isDevelopment && (
            <MenuItem fontWeight="bold" as={RouterLink} to="/fit" onClick={() => handleNavigation('/fit')} _hover={{ bg: "#28363F" }} color={"#F7FFE6"} bgColor={"#28363F"}>
              Re-Glyco Fit
            </MenuItem>
            )}
            {isDevelopment && (
            <MenuItem fontWeight="bold" as={RouterLink} to="/xp" onClick={() => handleNavigation('/xp')} _hover={{ bg: "#28363F" }} color={"#F7FFE6"} bgColor={"#28363F"}>
              Re-Glyco XP
            </MenuItem>
            )}
          <MenuItem fontWeight="bold" as={RouterLink} to="/swap" onClick={() =>  handleNavigation('/swap')} _hover={{ bg: "#28363F" }} color={"#F7FFE6"} bgColor={"#28363F"}>Swap</MenuItem>
          
          {isDevelopment && (
            <MenuItem fontWeight="bold" as={RouterLink} to="/chat" onClick={() =>  handleNavigation('/chat')} _hover={{ bg: "#28363F" }} color={"#F7FFE6"} bgColor={"#28363F"}>GlyCopilot</MenuItem>
            )}
            </MenuList>
      </Menu>
  
          
          
          
          <Link as={RouterLink} fontWeight="bold" color={"#F7FFE6"} to="/downloads" marginRight="20px" fontFamily="body">Downloads</Link>
          <Box alignContent={"center"} height='40px'>
  {/* <Divider orientation='vertical' /> */}
          </Box>
          <Link as={RouterLink} fontWeight="bold" color={"#F7FFE6"} to="/api-docs" marginRight="20px" fontFamily="body">API</Link>
          
          <Link as={RouterLink} fontWeight="bold" color={"#F7FFE6"} to="/sparql-query" marginRight="20px" fontFamily="body">SPARQL</Link>
          <Box alignContent={"center"} height='40px'>
  {/* <Divider orientation='vertical' /> */}
          </Box> 
          <Link as={RouterLink} fontWeight="bold" color={"#F7FFE6"} to="/faq" marginRight="20px" fontFamily="body">FAQ</Link> 
          <Link as={RouterLink} fontWeight="bold" color={"#F7FFE6"} to="/tutorial" marginRight="10px" fontFamily="body">Tutorials</Link> 

          {/* <Link as={RouterLink} fontWeight="bold" color={"#F7FFE6"} to="/elab" marginRight="20px">eLab</Link> */}
          <Menu>
        <MenuButton as={Link} fontWeight="bold" color={"#F7FFE6"} href="#" _hover={{ textDecoration: "none" }} marginRight="0px" px={2} py={2} rounded={'md'} transition="all 0.2s" bg="transparent" fontFamily="body">
          eLab
        </MenuButton>
        <MenuList bg="#28363F" borderColor="#28363F">
          <MenuItem fontWeight="bold" as={RouterLink} to="/eLab" onClick={() =>  handleNavigation('/elab')} _hover={{ bg: "#28363F" }} color={"#F7FFE6"} bgColor={"#28363F"}>eLab</MenuItem>
          <MenuItem fontWeight="bold" as={RouterLink} to="/team" onClick={() =>  handleNavigation('/team')} _hover={{ bg: "#28363F" }} color={"#F7FFE6"} bgColor={"#28363F"}>Team</MenuItem>
          <MenuItem fontWeight="bold" as={RouterLink} to="/blog" onClick={() =>  handleNavigation('/blog')} _hover={{ bg: "#28363F" }} color={"#F7FFE6"} bgColor={"#28363F"}>Blog</MenuItem>
          <MenuItem fontWeight="bold" as={RouterLink} to="/publications" onClick={() =>  handleNavigation('/publications')} _hover={{ bg: "#28363F" }} color={"#F7FFE6"} bgColor={"#28363F"}>Publications</MenuItem>
        </MenuList>
      </Menu>
      
      {/* Authentication Section */}
      <Box alignContent={"center"} height='40px' mx={2}>
        <Divider orientation='vertical' />
      </Box>

      <Link as={RouterLink} fontWeight="bold" color={"#F7FFE6"} to="/pro" marginRight="0px" px={2} fontFamily="body">Pro</Link> 
      
      {user ? (
        <Menu>
          <MenuButton as={Button} rightIcon={<ChevronDownIcon />} bg="transparent" color="#F7FFE6" _hover={{ bg: "rgba(247, 255, 230, 0.1)" }} _active={{ bg: "rgba(247, 255, 230, 0.2)" }} fontFamily="body">
            <HStack spacing={2}>
              <Avatar size="sm" name={getUserDisplayName()} />
              <Text fontFamily="body">{user.first_name || user.email}</Text>
            </HStack>
          </MenuButton>
          <MenuList bg="#28363F" borderColor="#28363F">
            <MenuItem fontWeight="bold" as={RouterLink} to="/ums/dashboard" _hover={{ bg: "#28363F" }} color={"#F7FFE6"} bgColor={"#28363F"} fontFamily="body">
              Dashboard
            </MenuItem>
            <MenuItem fontWeight="bold" as={RouterLink} to="/ums/profile" _hover={{ bg: "#28363F" }} color={"#F7FFE6"} bgColor={"#28363F"} fontFamily="body">
              Profile
            </MenuItem>
            <MenuItem fontWeight="bold" as={RouterLink} to="/ums/subscriptions" _hover={{ bg: "#28363F" }} color={"#F7FFE6"} bgColor={"#28363F"} fontFamily="body">
              Subscriptions
            </MenuItem>
            <MenuItem fontWeight="bold" as={RouterLink} to="/ums/licenses" _hover={{ bg: "#28363F" }} color={"#F7FFE6"} bgColor={"#28363F"} fontFamily="body">
              Licenses
            </MenuItem>
            <MenuItem fontWeight="bold" as={RouterLink} to="/ums/api-keys" _hover={{ bg: "#28363F" }} color={"#F7FFE6"} bgColor={"#28363F"} fontFamily="body">
              API Keys
            </MenuItem>
            <MenuDivider />
            <MenuItem fontWeight="bold" onClick={handleLogout} _hover={{ bg: "#28363F" }} color={"#F7FFE6"} bgColor={"#28363F"} fontFamily="body">
              Logout
            </MenuItem>
          </MenuList>
        </Menu>
      ) : (
        <HStack spacing={4}>

          <Button as={RouterLink} to="/ums/login" fontWeight="bold" variant="ghost" color="#F7FFE6" _hover={{ bg: "rgba(247, 255, 230, 0.1)" }} fontFamily="body">
            Login
          </Button>
        </HStack>
      )}
        </Flex>
      )}
      </Flex>
    </Flex>
  );
}

export default Navbar;
