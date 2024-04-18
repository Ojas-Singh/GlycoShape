import React, { useEffect } from 'react';
import { ChakraProvider, CSSReset } from '@chakra-ui/react';
import { Flex } from "@chakra-ui/react";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// Importing your components
import Navbar from './components/Navbar';
import ScrollToTopButton from './components/Scroll';
import ContentSection from './components/ContentSection';
import Footer from './components/Footer';
import FAQ from './components/FAQ';
import Tutorials from './components/Tutorials';
import Search from './components/SearchTop';
import API from './components/API';
import Download from './components/Download';
import ReGlyco from './components/ReGlyco';
import Swap from './components/Swap';
import Elab from './components/eLab/Elab';
import SearchPage from './components/SearchPage';
import GlycanPage from './components/GlycanPage';
import theme from './components/Theme';
import Cite from './components/Cite';
import Fit from './components/ReGlycofit';
import NotFoundPage from './components/NotFoundPage'; 

const App: React.FC = () => {
  useEffect(() => {
    document.title = "GlycoShape";
  }, []);
  return (
    <Router>
      <ChakraProvider theme={theme}>
        <CSSReset />
        <Flex direction="column" minHeight="100vh">
          {/* Navbar, if you have one */}
          <Navbar />
          <ScrollToTopButton />
          {/* Main content area */}
          <Flex direction="column" flex="1">
            {/* Your main content components, like the ContentSection */}
            <Routes>
              <Route path="/" element={<ContentSection />} />
              <Route path="/faq" element={<div><Search /><FAQ /></div>} />
              <Route path="/tutorial" element={<div><Search /><Tutorials /></div>} />
              <Route path="/api-docs" element={<div><Search /><API /></div>} />
              <Route path="/downloads" element={<div><Search /> <Download /></div>} />
              <Route path="/reglyco" element={<div><ReGlyco /></div>} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/glycan" element={<div><Search /><GlycanPage /></div>} />
              <Route path="/elab" element={<div><Search /><Elab /></div>} />
              <Route path="/team" element={<div><Search /><Elab /></div>} />
              <Route path="/blog" element={<div><Search /><Elab /></div>} />
              <Route path="/publications" element={<div><Search /><Elab /></div>} />
              <Route path="/swap" element={<div><Swap /></div>} />
              <Route path="/fit" element={<div><Fit /></div>} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>

          </Flex>
          <Cite />
          {/* Footer */}
          <Footer />
        </Flex>
      </ChakraProvider>

    </Router>

  );
}



export default App;
