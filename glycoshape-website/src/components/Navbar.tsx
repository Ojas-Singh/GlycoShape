import React, { useEffect } from 'react';
import axios from 'axios';

import {
  Image,
  Button,
  Stack,Badge,
  Flex,
  Box,
  Link,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useBreakpointValue,
  IconButton,
  Divider,
  HStack,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  useDisclosure
} from "@chakra-ui/react";
import { HamburgerIcon } from '@chakra-ui/icons';
import logo from './assets/logo_white.png';

const Navbar: React.FC = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const isDevelopment = process.env.NODE_ENV === 'development';
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    axios.get(`${apiUrl}/api/log`, { withCredentials: true })
      .then(response => {
        // Handle the response if needed
      })
      .catch(error => {
        console.error('Error logging visit:', error);
      });
  }, []); // Empty dependency array
  

  return (
    // <Flex as="nav" position="sticky" top="0" zIndex="1000" bgColor="#28363F" align="center" justify="space-between" wrap="wrap" padding="0.8rem" marginTop={"-0.6rem"} boxShadow="md">

    <Flex as="nav"  bgColor="#28363F" align="center" justify="space-between" wrap="wrap" padding="0.8rem" marginTop={"-0.6rem"} boxShadow="md">
      <Box>
        {/* <Image src={logo} alt="GlycoShape Logo" height="60px" paddingLeft={"1.5rem"} /> */}
        <Stack direction='row'>


        {isDevelopment ? (
        <Text top="50%" fontFamily={'texts'} 
        transform="translateY(30%)"  paddingLeft={"0.5rem"}> <Badge color='#CF6385'>Dev</Badge>   </Text>
      ) : (
        <Image src={logo} transform="translateY(5%)"  alt="GlycoShape Logo" height="50px" paddingLeft={"1rem"} />
      )}
  
          
         
        <Link fontWeight="bold" fontSize={"3xl"} transform="translateY(8%)" color={"#F7FFE6"} href="/" >GlycoShape</Link> 
        {/* <Text fontWeight={"bold"} fontSize={"3xl"} color="#F7FFE6" paddingLeft={"1.5rem"}>GlycoShape.io</Text> */}
        </Stack>
      </Box>

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
            }} as={Link} href="/search?query=all" w="100%" onClick={onClose} mb={4}>Database</Button>
                  <Button _hover={{
              backgroundColor: "#F7FFE6"
            }} as={Link} href="/reglyco" w="100%" onClick={onClose} mb={4}>Re-Glyco</Button>
                  <Button _hover={{
              backgroundColor: "#F7FFE6"
            }} as={Link} href="/downloads" w="100%" onClick={onClose} mb={4}>Downloads</Button>
                  <Button _hover={{
              backgroundColor: "#F7FFE6"
            }} as={Link} href="/api-docs" w="100%" onClick={onClose} mb={4}>API</Button>
                  <Button _hover={{
              backgroundColor: "#F7FFE6"
            }} as={Link} href="/faq" w="100%" onClick={onClose} mb={4}>FAQ</Button>
                  <Button _hover={{
              backgroundColor: "#F7FFE6"
            }} as={Link} href="/elab" w="100%" onClick={onClose} mb={4}>eLab</Button>
                </DrawerBody>
              </DrawerContent>
            </DrawerOverlay>
          </Drawer>
        </>
      ) : (
        <Flex align="center">
          <Link fontWeight="bold" color={"#F7FFE6"} href="/search?query=all" marginRight="20px">Database</Link>
          <Link fontWeight="bold" color={"#F7FFE6"} href="/reglyco" marginRight="20px">Re-Glyco</Link>
          
          <Link fontWeight="bold" color={"#F7FFE6"} href="/downloads" marginRight="20px">Downloads</Link>
          <Box alignContent={"center"} height='40px'>
  <Divider orientation='vertical' />
          </Box>
          <Link fontWeight="bold" color={"#F7FFE6"} href="/api-docs" marginRight="20px" marginLeft={"20px"}>API</Link>
          <Box alignContent={"center"} height='40px'>
  <Divider orientation='vertical' />
          </Box> 
          <Link fontWeight="bold" color={"#F7FFE6"} href="/faq" marginRight="20px" marginLeft={"20px"}>FAQ</Link> 
          <Link fontWeight="bold" color={"#F7FFE6"} href="/elab" marginRight="20px">eLab</Link>
          
        </Flex>
      )}
    </Flex>
  );
}

export default Navbar;
