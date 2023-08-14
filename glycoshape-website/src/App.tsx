import React, { useEffect } from 'react';
import { ChakraProvider, Box, CSSReset, theme } from '@chakra-ui/react';
import { Flex } from "@chakra-ui/react";
import { Helmet } from 'react-helmet';
import { BrowserRouter as Router, Route, Routes  } from 'react-router-dom';

// Importing your components
import Navbar from './components/Navbar';
import ContentSection from './components/ContentSection';
import Footer from './components/Footer';
import FAQ from './components/FAQ';
import Search from './components/Search';


const App: React.FC = () => {
  useEffect(() => {
    document.title = "GlycoShape";
  }, []);
  return (
    <Router>
    <ChakraProvider theme={theme}>
      <CSSReset />
      <Helmet>
        {/* Basic Meta Tags */}
        <title>GlycoShape</title>
        <meta name="description" content="A concise and accurate description of your website's content." />
        <meta name="keywords" content="your, primary, keywords, here" />
        <link rel="icon" href="/path/to/favicon.ico" />
        <link rel="apple-touch-icon" href="./contents/assets/logo.png" />

        {/* Google / Search Engine Tags */}
        <meta itemProp="name" content="The Name or Title Here" />
        <meta itemProp="description" content="A concise and accurate description of your website's content." />
        <meta itemProp="image" content="https://yourwebsite.com/path/to/image.jpg" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yourwebsite.com/" />
        <meta property="og:title" content="Your Website Title" />
        <meta property="og:description" content="A concise and accurate description of your website's content." />
        <meta property="og:image" content="https://yourwebsite.com/path/to/image.jpg" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://yourwebsite.com/" />
        <meta property="twitter:title" content="Your Website Title" />
        <meta property="twitter:description" content="A concise and accurate description of your website's content." />
        <meta property="twitter:image" content="https://yourwebsite.com/path/to/image.jpg" />

        {/* Additional Metadata for SEO */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="X-UA-Compatible" content="ie=edge" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Your Name or Company Name" />
        <meta name="theme-color" content="#yourColorCode" />
      </Helmet>
      <Flex direction="column" minHeight="100vh">
      {/* Navbar, if you have one */}
      <Navbar />

      {/* Main content area */}
      <Flex direction="column" flex="1">
        {/* Your main content components, like the ContentSection */}
        <Routes>
          <Route path="/" element={<ContentSection />} />
          <Route path="/faq" element={<div><Search /><FAQ /></div>} />
          <Route path="/api-docs" element={<div><Search /></div>} />
          <Route path="/downloads" element={<div><Search /></div>} />
          <Route path="/reglyco" element={<div><Search /></div>} />
          <Route path="/contact-us" element={<div><Search /></div>} />
        </Routes>
      </Flex>

      {/* Footer */}
      <Footer />
    </Flex>
    </ChakraProvider>
    </Router>
  );
}



export default App;
