import React, { useState, useEffect, useRef } from 'react';
import { useNavigate  } from 'react-router-dom';
import {
  Input, Button, Text, Flex, Box, Image, useBreakpointValue, SimpleGrid, Heading, Container, Link, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter
} from "@chakra-ui/react";
import draw from './assets/draw.png';
import un from './assets/un.png';
import bg from './assets/Glycans_bg_dark.jpg';
import { Kbd } from '@chakra-ui/react'
import Searchbar from './SearchBar';


const Search: React.FC = () => {
  return (
    <Flex direction="column" width="100%">
      <Flex 
        direction="column" 
        align="center" 
        justify="center" 
        flex="1" 
        padding="1em"
        paddingTop="2em"
        minHeight={{ base: "15vh" }}
        backgroundImage={`url(${bg})`} 
        backgroundSize="cover" 
        // backgroundPosition="center"
        backgroundRepeat="no-repeat"  
      >
        

        <Searchbar />
      </Flex>

  

    </Flex>
  );
}

export default Search;
