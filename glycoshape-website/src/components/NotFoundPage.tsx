// components/NotFoundPage.jsx

import React from 'react';
import {Image, Box, Heading, Text, Button, HStack } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import notfound from './assets/404.png';

const NotFoundPage = () => {
  return (
    <Box textAlign={"center"} alignSelf={"center"} py={10} px={6}>
        <HStack>
      
      <Image height="10rem" src={notfound} alt="404" />
      <Heading
        display="inline-block"
        as="h2"
        size="4xl"
        bgGradient="linear(to-r,#B72521, #ECC7A1)"
        backgroundClip="text">
        404 Page Not Found
      </Heading>
      </HStack>
      
      <Button 
              backgroundColor="#7CC9A9" 
              _hover={{ backgroundColor: "#51BF9D" }} 
              color="white"
            >
             <Link to="/">Go to Home</Link>
            </Button>
      {/* <Button
        colorScheme="#28363F"
        color="white"
        variant="solid">
        <Link to="/">Go to Home</Link>
      </Button> */}
    </Box>
  );
}

export default NotFoundPage;
