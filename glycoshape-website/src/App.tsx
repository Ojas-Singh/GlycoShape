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
import CookieConsent from './components/CookieConsent';
import GOTW from './components/GOTW';
import Stats from './components/Stats';
import View from './components/View';

// First create a Layout component for the main layout
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Flex direction="column" minHeight="100vh">
    <Navbar />
    <CookieConsent />
    <ScrollToTopButton />
    <Flex direction="column" flex="1">
      {children}
    </Flex>
    <Cite />
    <Footer />
  </Flex>
);

// Minimal layout for View route
const ViewLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Flex direction="column" minHeight="100vh">
    {/* <CookieConsent /> */}
    {children}
  </Flex>
);

const App: React.FC = () => {
  useEffect(() => {
    document.title = "GlycoShape Glycan Structure Database";
  }, []);
  
  return (
    <Router>
      <ChakraProvider theme={theme}>
        <CSSReset />
        <Routes>
          {/* View route with minimal layout */}
          <Route 
            path="/view" 
            element={
              <ViewLayout>
                <View />
              </ViewLayout>
            } 
          />
          
          {/* All other routes with main layout */}
          <Route
            path="/*"
            element={
              <MainLayout>
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
                  <Route path="/gotw" element={<div><Search /><GOTW /></div>} />
                  <Route path="/stats" element={<div><Stats /></div>} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </MainLayout>
            }
          />
        </Routes>
      </ChakraProvider>
    </Router>
  );
}

export default App;
