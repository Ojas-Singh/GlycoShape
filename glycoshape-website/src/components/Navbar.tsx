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
  Spacer
} from "@chakra-ui/react";
import { HamburgerIcon } from '@chakra-ui/icons';
import logo from './assets/logo_white.png';

const Navbar: React.FC = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const isDevelopment = process.env.REACT_APP_BUILD_DEV === "true";
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const location = useLocation();
  const navigate = useNavigate();

  
  
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

  return (
    // <Flex as="nav" position="sticky" top="0" zIndex="1000" bgColor="#28363F" align="center" justify="space-between" wrap="wrap" padding="0.8rem" marginTop={"-0.6rem"} boxShadow="md">
    
    <Flex 
   
    as="nav"  bgColor="#28363F" align="center" justify="space-between" wrap="wrap" padding="0.8rem" marginTop={"-0.6rem"} boxShadow="md">
      
        <Flex  justify="center" width={{ base: "100%", md: "100%", lg: "100%", xl: "100%" }} margin="0 auto">
      <Box >
        {/* <Image src={logo} alt="GlycoShape Logo" height="60px" paddingLeft={"1.5rem"} /> */}
        <Stack direction='row'>
        

        {isDevelopment ? (
        <Text top="50%" fontFamily={'texts'} 
        transform="translateY(30%)"  paddingLeft={"0.5rem"}> <Badge color='#CF6385'>Dev</Badge>   </Text>
      ) : (
        <Image src={logo} transform="translateY(5%)"  alt="GlycoShape Logo" height="50px" paddingLeft={"1rem"} />
      )}
  
          
         
        <Link as={RouterLink} fontWeight="bold" fontSize={"3xl"} transform="translateY(8%)" color={"#F7FFE6"} to="/" >GlycoShape</Link> 
        {/* <Text fontWeight={"bold"} fontSize={"3xl"} color="#F7FFE6" paddingLeft={"1.5rem"}>GlycoShape.io</Text> */}
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
        {/* <Image src={logo} alt="GlycoShape Logo" height="60px" paddingLeft={"1.5rem"} /> */}
        <Stack direction='row'>
  
        {isDevelopment ? (
        <Text top="50%" fontFamily={'texts'} 
        transform="translateY(10%)"  paddingLeft={"0.5rem"}> <Badge color='#CF6385'>Dev</Badge>   </Text>
      ) : (
        <Image src={logo} transform="translateY(5%)"  alt="GlycoShape Logo" height="50px" paddingLeft={"1rem"} />
      )}
        
        <Link fontWeight="bold" fontSize={"3xl"} color={"#F7FFE6"} href="/" >GlycoShape</Link> 
        {/* <Text fontWeight={"bold"} fontSize={"3xl"} color="#F7FFE6" paddingLeft={"1.5rem"}>GlycoShape.io</Text> */}
        </Stack>
      </Box>
                </DrawerHeader>
                <DrawerBody>
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
                </DrawerBody>
              </DrawerContent>
            </DrawerOverlay>
          </Drawer>
        </>
      ) : (
        <Flex align="center" >
          <Link as={RouterLink} fontWeight="bold" color={"#F7FFE6"} to="/search?query=all"  onClick={() => { handleNavigation('/search?query=all'); onClose(); }}  marginRight="20px">Database</Link>
          {/* <Link fontWeight="bold" color={"#F7FFE6"} href="/reglyco" marginRight="20px">Re-Glyco</Link> */}
          
          
          {isDevelopment ? (
        <Menu>
        <MenuButton as={Link} fontWeight="bold" color={"#F7FFE6"} href="#" _hover={{ textDecoration: "none" }} marginRight="20px" px={4} py={2} rounded={'md'} transition="all 0.2s" bg="transparent">
          Tools
        </MenuButton>
        <MenuList bg="#28363F" borderColor="#28363F">
          <MenuItem fontWeight="bold" as={RouterLink} to="/reglyco" onClick={() =>  handleNavigation('/reglyco')} _hover={{ bg: "#28363F" }} color={"#F7FFE6"} bgColor={"#28363F"}>Re-Glyco</MenuItem>
          <MenuItem fontWeight="bold" as={RouterLink} to="/ensemble" onClick={() =>  handleNavigation('/ensemble')} _hover={{ bg: "#28363F" }} color={"#F7FFE6"} bgColor={"#28363F"}>Re-Glyco Ensemble</MenuItem>
          <MenuItem fontWeight="bold" as={RouterLink} to="/fit" onClick={() =>  handleNavigation('/fit')} _hover={{ bg: "#28363F" }} color={"#F7FFE6"} bgColor={"#28363F"}>Re-Glyco Fit</MenuItem>
          <MenuItem fontWeight="bold" as={RouterLink} to="/swap" onClick={() =>  handleNavigation('/swap')} _hover={{ bg: "#28363F" }} color={"#F7FFE6"} bgColor={"#28363F"}>Swap</MenuItem>
          <MenuItem fontWeight="bold" as={RouterLink} to="/fit" onClick={() =>  handleNavigation('/chat')} _hover={{ bg: "#28363F" }} color={"#F7FFE6"} bgColor={"#28363F"}>Copilot</MenuItem>
        </MenuList>
      </Menu>) : (
          <Link as={RouterLink} fontWeight="bold" color={"#F7FFE6"} to="/reglyco" onClick={() =>  handleNavigation('/reglyco')} marginRight="20px">Re-Glyco</Link>
        )}
  
          
          
          
          <Link as={RouterLink} fontWeight="bold" color={"#F7FFE6"} to="/downloads" marginRight="20px">Downloads</Link>
          <Box alignContent={"center"} height='40px'>
  {/* <Divider orientation='vertical' /> */}
          </Box>
          <Link as={RouterLink} fontWeight="bold" color={"#F7FFE6"} to="/api-docs" marginRight="20px" >API</Link>
          
          <Link as={RouterLink} fontWeight="bold" color={"#F7FFE6"} to="/sparql-query" marginRight="20px" >SPARQL</Link>
          <Box alignContent={"center"} height='40px'>
  {/* <Divider orientation='vertical' /> */}
          </Box> 
          <Link as={RouterLink} fontWeight="bold" color={"#F7FFE6"} to="/faq" marginRight="20px" >FAQ</Link> 
          <Link as={RouterLink} fontWeight="bold" color={"#F7FFE6"} to="/tutorial" marginRight="20px" >Tutorials</Link> 

          <Link as={RouterLink} fontWeight="bold" color={"#F7FFE6"} to="/elab" marginRight="20px">eLab</Link>
          
        </Flex>
      )}
      </Flex>
    </Flex>
  );
}

export default Navbar;
