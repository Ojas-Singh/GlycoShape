import React from 'react';
import { ChakraProvider, Box, CSSReset, theme } from '@chakra-ui/react';
import { Flex } from "@chakra-ui/react";

// Importing your components
import Navbar from './components/Navbar';
import ContentSection from './components/ContentSection';
import Footer from './components/Footer';


const App: React.FC = () => {
  return (
    
    <ChakraProvider theme={theme}>
      <CSSReset />
      <Flex direction="column" minHeight="100vh">
      {/* Navbar, if you have one */}
      <Navbar />

      {/* Main content area */}
      <Flex direction="column" flex="1">
        {/* Your main content components, like the ContentSection */}
        <ContentSection />
      </Flex>

      {/* Footer */}
      <Footer />
    </Flex>
    </ChakraProvider>
  );
}



export default App;
