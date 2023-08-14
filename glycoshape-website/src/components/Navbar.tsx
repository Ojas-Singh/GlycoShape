import React from 'react';
import {
  Flex,
  Box,
  Link,
  Select,
  Image,
  Menu,
  MenuButton,
  Button,
  MenuList,
  MenuItem,
  useBreakpointValue,
  IconButton
} from "@chakra-ui/react";
import { HamburgerIcon } from '@chakra-ui/icons';
import logo from './assets/logo.png';

const Navbar: React.FC = () => {
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <Flex as="nav" align="center" justify="space-between" wrap="wrap" padding="1.5rem" boxShadow="md">
      <Box>
        <Image src={logo} alt="GlycoShape Logo" height="60px" />
      </Box>

      {isMobile ? (
        <Menu>
          <MenuButton
            as={IconButton}
            aria-label="Options"
            icon={<HamburgerIcon />}
            variant="outline"
          />
          <MenuList>
            <MenuItem as={Link} href="#search-link1">ReGlyco</MenuItem>
            <MenuItem as={Link} href="#search-link2">GOTW</MenuItem>
            <MenuItem as={Link} href="#search-link3">Contact us</MenuItem>
            
          </MenuList>
        </Menu>
      ) : (
        <Flex align="center">
          <Link href="#search-link1" marginRight="20px">ReGlyco</Link>
          <Link href="#search-link2" marginRight="20px">GOTW</Link>
          <Link href="#search-link3" marginRight="20px">Contact us</Link>
          
        </Flex>
      )}
    </Flex>
  );
}

export default Navbar;
