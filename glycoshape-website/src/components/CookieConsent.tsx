import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Text,
  Flex,
  Slide,
  Link,
  useBreakpointValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Input,
  useDisclosure,
} from "@chakra-ui/react";
import { Link as RouterLink, useLocation } from 'react-router-dom';

// --- Constants ---
const COOKIE_CONSENT_KEY = 'cookieConsent';
const BETA_ACCESS_KEY = 'betaAccessGranted';
const BETA_ACCESS_DURATION_MS = 9 * 60 * 60 * 1000; // 3 hours in milliseconds

const CookieConsent = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const isDevelopment = process.env.REACT_APP_BUILD_DEV === "true";

  // State for Cookie Consent Banner
  const [isCookieConsentGiven, setIsCookieConsentGiven] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(false); // Start hidden

  // State for Beta Access Modal
  const [isBetaAccessValid, setIsBetaAccessValid] = useState(false);
  const [pin, setPin] = useState('');
  const { isOpen: isBetaModalOpen, onOpen: openBetaModal, onClose: closeBetaModal } = useDisclosure();
  const location = useLocation();

  const betaModalPaths = ['/fit', '/chat', '/FIT', '/CHAT', '/xp', 'XP'];

  // --- Effects ---

  // Check Cookie Consent on mount ONLY
  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (consent === 'given') {
      setIsCookieConsentGiven(true);
      setIsBannerVisible(false); 
    } else {
      setIsCookieConsentGiven(false);
      setIsBannerVisible(true); 
    }
   
  }, []); 

  // Check Beta Access Validity on mount and location change
  useEffect(() => {
    const betaAccessData = localStorage.getItem(BETA_ACCESS_KEY);
    let isValid = false;
    if (betaAccessData) {
      try {
        const { granted, expiry } = JSON.parse(betaAccessData);
        if (granted && expiry && expiry > Date.now()) {
          isValid = true;
        } else {
          localStorage.removeItem(BETA_ACCESS_KEY);
        }
      } catch (e) {
        console.error("Error parsing beta access data", e);
        localStorage.removeItem(BETA_ACCESS_KEY);
      }
    }
    setIsBetaAccessValid(isValid);
    // No change needed here, beta access should be checked on navigation
  }, [location.pathname]);

  // Log visit effect (only depends on cookie consent now)
  useEffect(() => {
    if (isCookieConsentGiven) {
      axios.get(`${apiUrl}/api/log`, { withCredentials: true })
        .then(response => {})
        .catch(error => {
          console.error('Error logging visit:', error);
        });
    }
  }, [isCookieConsentGiven, apiUrl]);

  // Control Beta Modal visibility 
  useEffect(() => {
    const shouldShowModal = isDevelopment && betaModalPaths.includes(location.pathname) && !isBetaAccessValid;
    if (shouldShowModal && !isBetaModalOpen) {
      openBetaModal();
    } else if (!shouldShowModal && isBetaModalOpen) {
      closeBetaModal();
    }
  }, [isDevelopment, location.pathname, isBetaAccessValid, isBetaModalOpen, openBetaModal, closeBetaModal]);

  // --- Handlers ---

  const handleAcceptCookies = () => {
    // 1. Update localStorage
    localStorage.setItem(COOKIE_CONSENT_KEY, 'given');
    // 2. Update state to immediately hide banner and reflect consent
    setIsCookieConsentGiven(true);
    setIsBannerVisible(false);
    console.log('Cookie consent accepted, banner visibility state:', false); // Add log
  };

  // handlePinSubmit remains the same
  const handlePinSubmit = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/access/${pin}`);
      if (response.data.authenticated === true) {
        const expiryTimestamp = Date.now() + BETA_ACCESS_DURATION_MS;
        localStorage.setItem(BETA_ACCESS_KEY, JSON.stringify({ granted: true, expiry: expiryTimestamp }));
        setIsBetaAccessValid(true);
        closeBetaModal();
      } else {
        window.location.href = `https://glycoshape.org${location.pathname}`;
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      window.location.href = `https://glycoshape.org${location.pathname}`;
    }
  };

  // --- Rendering ---

  const flexDirection = useBreakpointValue<'column' | 'row'>({ base: 'column', sm: 'column', md: 'column', lg: 'column', xl: 'row' });

  return (
    <>
      {/* Cookie Consent Banner */}
      {isBannerVisible && (
        <Slide direction="bottom" in={isBannerVisible} style={{ zIndex: 10 }}>
          <Box
            position="fixed"
            bottom="0"
            width="100%"
            bg="#28363F"
            color="#F7FFE6"
            p={4}
            boxShadow="md"
          >
            <Flex direction={flexDirection} justify="space-between" align="center">
              <Text>
                This website requires cookies, and the limited processing of your personal data in order to function. 
                By using the site you are agreeing to this as outlined in our{" "}
                <Link color="white" href='/Glycoshape_Legal_Disclaimer_and_Privacy_Policy.pdf'>Privacy Notice and Terms of Use</Link>.
              </Text>
              <Button
                color="#545454"
                backgroundColor="#F7F9E5"
                _hover={{ backgroundColor: "#E2CE69" }}
                onClick={handleAcceptCookies}
                ml={4}
                mt={{ base: 2, xl: 0 }}
              >
                I agree, dismiss this banner
              </Button>
            </Flex>
          </Box>
        </Slide>
      )}

      {/* Beta Key Modal */}
      <Modal
        isCentered
        motionPreset='scale'
        size={'xl'}
        blockScrollOnMount={true}
        isOpen={isBetaModalOpen}
        onClose={() => {
          if (!isBetaAccessValid) {
        window.location.href = `/`;
          } else {
        closeBetaModal();
          }
        }}
      >
        <ModalOverlay
          bg='blackAlpha.600'
          backdropFilter='auto'
          backdropBlur='3px'
        />
        <ModalContent>
          <ModalHeader fontFamily={'texts'}>Beta Access Required</ModalHeader>
          {/* <ModalCloseButton /> */}
          <ModalBody>
        <Text mb={4} fontSize="sm">
          Enter the beta key to access this page on the development server (valid for 9 hours).
        </Text>
        <Input
          colorScheme="teal"
          placeholder="Enter beta key"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
        />
        <Link as={RouterLink} to="/">
          <Text margin={'2'} fontFamily='texts' fontSize={'sm'} color="blue.500">
          Or visit the home page.
          </Text>
        </Link>
          </ModalBody>
          <ModalFooter>
        <Button colorScheme="teal" mr={3} onClick={handlePinSubmit}>
          Submit Key
        </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CookieConsent;
