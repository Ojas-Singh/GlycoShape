import React, { useState, useEffect, useRef,  } from 'react';
import { useLocation, useNavigate } from 'react-router';

import {
    Input, Button, Text, Flex, Box, Image, useBreakpointValue, SimpleGrid, Heading, Container, Link, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter
  } from "@chakra-ui/react";
import draw from './assets/draw.png';
import un from './assets/un.png';
import bg from './assets/Glycans_bg_dark.jpg';
import cell from './assets/cell_surface.jpg';
import dem1 from './assets/dem1.jpg';
import { Kbd } from '@chakra-ui/react'

const ContentSection: React.FC = () => {
    const navigate  = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    // const search_String = queryParams.get('query') || '';  // Default to an empty string if no query parameter
    const [results, setResults] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [searchString, setSearchString] = useState<string>(queryParams.get('query') || '');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const searchRef = useRef<HTMLInputElement>(null);
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const keyHint = useBreakpointValue({ base: isMac ? '⌘K' : 'Ctrl+K', md: 'Press Ctrl+K to search' });
  

    useEffect(() => {
        // Execute the handleSearch function when the component mounts or the search_String changes
        handleSearch();
      }, [searchString]);


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
            const requestBody = {
                search_string: searchString, 
            };
    
            const response = await fetch('https://glycoshape.io/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            const data = await response.json();
    
            if (data.results) {
                setResults(data.results); 
            } else {
                console.warn("Please provide a valid search string!");
            }
        } catch (err) {
            const errorMessage = (err instanceof Error) ? err.message : "An unknown error occurred";
            console.error("There was an error fetching the data", errorMessage);
            setError(errorMessage);
        }
    };
    
      
    
    const handleImageClick = () => {
      setIsModalOpen(true);
    }

  return (
    <Flex direction="column" width="100%">
      <Flex 
        direction="column" 
        align="center" 
        justify="center" 
        flex="1" 
        padding="4em"
        minHeight={{ base: "15vh" }}
        backgroundImage={`url(${bg})`} 
        backgroundSize="cover" 
        // backgroundPosition="center"
        backgroundRepeat="no-repeat"  
      >
        

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
        ><Button onClick={handleImageClick} variant="unstyled" p={0} m={0} ml={2}>
        <Image src={draw} alt="Icon Description" w="24px" h="24px" />
      </Button>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
    <ModalOverlay />
    <ModalContent>
      <ModalHeader>Freehand Glycan Drawer</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        {/* Place your modal content here */}
        <Box>
          <Image src={un} alt="Description" />
          <Text></Text>
        </Box>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Close</Button>
      </ModalFooter>
    </ModalContent>
  </Modal>

          <Input 
            onChange={(e) => setSearchString(e.target.value)}
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
          <Button position={"absolute"} transform="translateY(10%)" alignContent={"center"} right={"1rem"} type="submit"
            borderRadius="full" 
            backgroundColor="#7CC9A9"
            _hover={{
              backgroundColor: "#51BF9D"
            }}
            // onClick={handleSearch}
            
          >
            Search
          </Button>
        </Flex>
      </Flex>

      {results.length > 0 && (
        <Flex direction="column" align="center" width="100%">
        <Box width="100%" padding="4em">
          <Text fontSize="2xl" marginBottom="1em">
            Showing all search results for "{searchString}"
          </Text>
          <Text marginBottom="1em">1 - 20 of {results.length} results</Text>
        </Box>
    
        <Flex direction="row" width="100%" padding="2em">
          {/* Filters on the left */}
          <Box width="30%" padding="1em">
            {/* Example filter */}
            <Text>Filter 1</Text>
            {/* Add more filters as needed */}
          </Box>
          <Box width="80%" padding="1em">
          {results.map((glycan, index) => (
            <Box
              key={index}
              width="80%"
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
              <Text width={'100%'}>{glycan}</Text>
            </Box>
          ))}</Box></Flex>
        </Flex>
      )}
      {error && (
  <Text color="red.500" textAlign="center">
    Please enter a valid search string!
    {error}
  </Text>
)}
      

    </Flex>
  );
}

export default ContentSection;
