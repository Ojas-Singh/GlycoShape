import React from 'react';
import {
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
  Divider
} from "@chakra-ui/react";
import { HamburgerIcon } from '@chakra-ui/icons';
// import logo from './assets/logo.png';

const Navbar: React.FC = () => {
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    // <Flex as="nav" position="sticky" top="0" zIndex="1000" bgColor="#28363F" align="center" justify="space-between" wrap="wrap" padding="0.8rem" marginTop={"-0.6rem"} boxShadow="md">

    <Flex as="nav"  bgColor="#28363F" align="center" justify="space-between" wrap="wrap" padding="0.8rem" marginTop={"-0.6rem"} boxShadow="md">
      <Box>
        {/* <Image src={logo} alt="GlycoShape Logo" height="60px" paddingLeft={"1.5rem"} /> */}
        <Stack direction='row'>
  
          <Text top="50%" fontFamily={'texts'} 
            transform="translateY(20%)"  paddingLeft={"0.5rem"}> <Badge color='#CF6385'>Beta</Badge>   </Text>

        <Link fontWeight="bold" fontSize={"3xl"} color={"#F7FFE6"} href="/" >GlycoShape</Link> 
        {/* <Text fontWeight={"bold"} fontSize={"3xl"} color="#F7FFE6" paddingLeft={"1.5rem"}>GlycoShape.io</Text> */}
        </Stack>
      </Box>

      {isMobile ? (
        <Menu>
          <MenuButton
            as={IconButton}
            aria-label="Options"
            icon={<HamburgerIcon color={"#F7FFE6"}/>}
            variant="outline"
          />
          <MenuList>
            
            <MenuItem as={Link} href="/search?query=all" >Database</MenuItem>
            <MenuItem as={Link} href="/reglyco" >Re-Glyco</MenuItem>
            <MenuItem as={Link} href="/downloads">Downloads</MenuItem>
            <MenuItem as={Link} href="/api-docs">API</MenuItem>
            <MenuItem as={Link} href="/faq">FAQ</MenuItem>
            <MenuItem as={Link} href="/elab">Contact us</MenuItem>
            
          </MenuList>
        </Menu>
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
