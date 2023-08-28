import React, { useState, useEffect, useRef } from 'react';
import { useNavigate  } from 'react-router-dom';
import {
  Input, Button, Text, Flex, Box, Image, useBreakpointValue, SimpleGrid, Heading, Container, Link, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter
} from "@chakra-ui/react";
import draw from './assets/draw.png';
import un from './assets/un.png';
import bg from './assets/Glycans_bg_dark.jpg';
import { Kbd } from '@chakra-ui/react'


const Search: React.FC = () => {
  const navigate  = useNavigate();
  const [results, setResults] = useState<string[]>([]);
  const [searchString, setSearchString] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const searchRef = useRef<HTMLInputElement>(null);
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

    
  const handleImageClick = () => {
    setIsModalOpen(true);
  }

  const handleSearch = async () => {
    try {
      // Ensure that searchRef and its current property is not null
      if (!searchRef || !searchRef.current) {
        console.warn("Search reference is not available.");
        return;
      }
      
      const requestBody = {
        search_string: searchRef.current.value,
      };
      navigate(`/search?query=${searchRef.current.value}`);
    } catch (error) {
      console.error("There was an error fetching the data", error);
    }
  };

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
          minWidth={{ base: "120%" , md: "80%"}}
          align="center" 
          position="relative"
          gap="1em" 
          boxShadow="xl" 
          borderRadius="full" 
          overflow="hidden" 
          p="0.5em"
          bg="white"
        >
          <Button onClick={handleImageClick} variant="unstyled" p={0} m={0} ml={2}>
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
  <form onSubmit={handleSearch}>
          <Input 
            ref={searchRef}
            fontFamily={'texts'}
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
            onClick={handleSearch}
          >
            Search
          </Button></form>
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

      

    </Flex>
  );
}

export default Search;
