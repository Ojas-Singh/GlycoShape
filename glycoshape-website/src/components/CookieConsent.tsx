import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Text,
  Flex,
  Slide,
  Link,
  useBreakpointValue,
} from "@chakra-ui/react";

const CookieConsent = () => {
  const [isConsentGiven, setConsentGiven] = useState(false);
  const [isBannerVisible, setBannerVisible] = useState(true);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (consent === 'given') {
      setConsentGiven(true);
      setBannerVisible(false);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'given');
    setConsentGiven(true);
    setBannerVisible(false);
  };
  
  // { base: "1xl", sm: "1xl", md: "2xl", lg: "lg", xl: "lg" }
  const flexDirection = useBreakpointValue<'column' | 'row'>({ base: 'column', sm:  'column', md:  'column', lg: 'column', xl: 'row' });

  if (!isBannerVisible) return null;

  return (
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
            backgroundColor="#F7F9E5  "
            _hover={{
              backgroundColor: "#E2CE69"
            }} onClick={handleAccept} ml={4}>
            I agree, dismiss this banner
          </Button>
        </Flex>
      </Box>
    </Slide>
  );
};

export default CookieConsent;
