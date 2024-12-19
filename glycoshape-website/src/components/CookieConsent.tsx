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

const CookieConsent = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const isDevelopment = process.env.REACT_APP_BUILD_DEV === "true";
  const [isConsentGiven, setConsentGiven] = useState(false);
  const [isBannerVisible, setBannerVisible] = useState(true);
  const [pin, setPin] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (consent === 'given') {
      setConsentGiven(true);
      setBannerVisible(false);
    }
  }, []);

  useEffect(() => {
    axios.get(`${apiUrl}/api/log`, { withCredentials: true })
      .then(response => {
        // Handle the response if needed
      })
      .catch(error => {
        console.error('Error logging visit:', error);
      });
  }, []); // Empty dependency array

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'given');
    setConsentGiven(true);
    setBannerVisible(false);
  };

  const handlePinSubmit = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/access/${pin}`);
      if (response.data.authenticated === true) {
        localStorage.setItem('cookieConsent', 'given');
        setConsentGiven(true);
        setBannerVisible(false);
        onClose();
      } else {
        window.location.href = 'https://glycoshape.org'; // Redirect to .org website
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      window.location.href = 'https://glycoshape.org'; // Redirect to .org website
    }
  };

  // { base: "1xl", sm: "1xl", md: "2xl", lg: "lg", xl: "lg" }
  const flexDirection = useBreakpointValue<'column' | 'row'>({ base: 'column', sm: 'column', md: 'column', lg: 'column', xl: 'row' });

  useEffect(() => {
    if (isDevelopment) {
      onOpen();
    }
  }, [isDevelopment, onOpen]);

  if (!isBannerVisible) return null;

  return (
    <>
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
              This website requires cookies, and the limited processing of your personal data in order to function. By using the site you are agreeing to this as outlined in our <Link color="white" href='/Glycoshape_Legal_Disclaimer_and_Privacy_Policy.pdf' >Privacy Notice and Terms of Use.</Link>
            </Text>
            <Button color={"#545454"}
              backgroundColor="#F7F9E5"
              _hover={{
                backgroundColor: "#E2CE69"
              }} onClick={handleAccept} ml={4}>
              I agree, dismiss this banner
            </Button>
          </Flex>
        </Box>
      </Slide>

      <Modal isCentered motionPreset='scale' size={'xl'} blockScrollOnMount={true} isOpen={isOpen} onClose={() => {
        const currentPath = window.location.pathname;
        window.location.href = `https://glycoshape.org${currentPath}`;
      }}>
        <ModalOverlay bg='none'
          backdropFilter='auto'
          backdropBlur='3px' />
        <ModalContent>
          <ModalHeader fontFamily={'texts'}>This is (GlycoShape.io) beta version of GlycoShape</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
        <Input
          colorScheme="teal"
          placeholder="Enter beta key to access"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />
        <Link href={`https://glycoshape.org${window.location.pathname}`}>
          <Text margin={'2'} fontFamily='texts' fontSize={'sm'}> 
            Or visit GlycoShape.org</Text>
        </Link>
          </ModalBody>
          <ModalFooter>
        <Button colorScheme="teal" mr={3} onClick={handlePinSubmit}>
          Submit
        </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CookieConsent;
