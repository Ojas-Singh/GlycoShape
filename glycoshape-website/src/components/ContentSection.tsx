import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Text, Flex, Box, Image, useBreakpointValue, SimpleGrid, Heading } from "@chakra-ui/react";
import bg from './assets/Glycans_bg_dark.jpg';
import cell from './assets/cell_surface.jpg';
import dem1 from './assets/dem1.jpg';
import { Kbd } from '@chakra-ui/react'

const ContentSection: React.FC = () => {
  const [results, setResults] = useState<string[]>([]);
  const searchRef = useRef(null);
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const keyHint = useBreakpointValue({ base: isMac ? '⌘K' : 'Ctrl+K', md: 'Press Ctrl+K to search' });
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        if (searchRef.current) {
          (searchRef.current as any).focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  const handleSearch = async () => {
    try {
      const response = await fetch('https://glycoshape.io/api/available_glycans');
      const data = await response.json();
      setResults(data.glycan_list); // Update this line to correctly handle the data structure
    } catch (error) {
      console.error("There was an error fetching the data", error);
    }
  };


// const ContentSection: React.FC = () => {
//   const searchRef = useRef(null);
//   const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
//   const keyHint = useBreakpointValue({ base: isMac ? '⌘K' : 'Ctrl+K', md: 'Ctrl+K ' });

  

  return (
    <Flex direction="column" width="100%">
      <Flex 
        direction="column" 
        align="center" 
        justify="center" 
        flex="1" 
        padding="5em"
        minHeight={{ base: "60vh" }}
        backgroundImage={`url(${bg})`} 
        backgroundSize="cover" 
        // backgroundPosition="center"
        backgroundRepeat="no-repeat"  
      >
        <Text 
          bgGradient='linear(to-l, #FDFDA1, #E2FCC5 )' 
          bgClip='text'
          fontSize='6xl'
          fontWeight='extrabold'
          marginBottom="0.2em"
        >
          GlycoShape Database
        </Text>
        <Text 
          bgGradient='linear(to-l, #F7FFE6, #F7FFE6)' 
          bgClip='text'
          fontSize='2xl'
          fontWeight='bold'
          marginBottom="1em"
        >
          Developed By Elab
        </Text>

        <Flex 
          width="80%" 
          align="center" 
          position="relative"
          gap="1em" 
          boxShadow="xl" 
          borderRadius="full" 
          overflow="hidden" 
          p="0.5em"
          bg="white"
        >
          <Input 
            ref={searchRef}
            placeholder="Search GLYCAM ID, IUPAC, GlycoCT, WURCS..." 
            size="lg" 
            flex="1" 
            border="none"
            _hover={{
              boxShadow: "none"
            }}
            _focus={{
              boxShadow: "none",
              outline: "none"
            }}
          />
          <Text 
            position="absolute" 
            right="8em" 
            top="50%" 
            transform="translateY(-50%)"
            color="gray.500"
            fontSize="sm"
            userSelect="none"
          >
            <Kbd>ctrl</Kbd> + <Kbd>K</Kbd>
          </Text>
          <Button 
            borderRadius="full" 
            backgroundColor="#7CC9A9"
            _hover={{
              backgroundColor: "#51BF9D"
            }}
            onClick={handleSearch}
          >
            Search
          </Button>
        </Flex>
      </Flex>

      {results.length > 0 && (
        <Flex direction="column" align="center" width="100%" padding="2em">
          {results.map((glycan, index) => (
            <Box
              key={index}
              width="100%"
              padding="1em"
              boxShadow="sm"
              marginBottom="1em"
              backgroundColor="white"
              borderRadius="md"
              display="flex"
              alignItems="center"
            >
              <Image
                src="path_to_dummy_image.jpg" // Replace with the path to your dummy image
                alt="Glycan Image"
                width="60px"
                marginRight="1em"
              />
              <Text>{glycan}</Text>
            </Box>
          ))}
        </Flex>
      )}

      <Flex 
        direction="column" 
        align="center" 
        justify="center" 
        flex="1" 
        backgroundColor="#F7F9E5" 
        padding="20px"
      >
        <Text
        align={"center"}
  bgGradient='linear(to-l, #44666C, #A7C4A3)'
  bgClip='text'
  fontSize='4xl'
  fontWeight='bold'
>
GlycoShape DB provides open access to over 300 glycan structure and A Glycoprotein Builder to accelerate scientific research. 
</Text>
      </Flex>
      <Flex direction="column">
  {/* First Section - What are Glycans? */}
  <Flex 
    direction={["column", "row"]} 
    align="center"
    padding={"100px"}
    paddingLeft={"250px"}
    backgroundColor="#FFFFFF"
  >
    <Box flex="1">
      <Text
        align={"left"}
        bgGradient='linear(to-l, #44666C, #4E6E6D)'
        bgClip='text'
        fontSize='5xl'
        fontWeight='bold'
      > 
        What are Glycans?
      </Text>
      <Text mt={4}>
        Description about Glycans goes here...
      </Text>
    </Box>
    <Box flex="1">
      <Image height={"25rem"} src={cell} alt="Description Image" />
    </Box>
  </Flex>

  {/* Second Section - Why it's important? */}
  <Flex 
    direction={["column-reverse", "row-reverse"]} 
    align="center"
    padding={"100px"}
    paddingRight={"250px"}
    paddingLeft={"250px"}
    backgroundColor="#FFFFFF"
  >
    <Box flex="1">
      <Text
        align={"left"}
        bgGradient='linear(to-l, #44666C, #4E6E6D)'
        bgClip='text'
        fontSize='5xl'
        fontWeight='bold'
      > 
        Why it's important?
      </Text>
      <Text mt={4}>
        Description about why Glycans are important goes here...
      </Text>
    </Box>
    <Box flex="1">
      <Image height={"35rem"} src={dem1} alt="Importance Image" />
    </Box>
  </Flex>
</Flex>

    </Flex>
  );
}

export default ContentSection;
