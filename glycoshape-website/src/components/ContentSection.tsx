import React, { useState, useEffect, useRef } from 'react';
import { useNavigate  } from 'react-router-dom';
import {
  Input, Button, Text, Flex, Box, Image, useBreakpointValue, SimpleGrid, Heading, Container, Link, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter
} from "@chakra-ui/react";
import { PhoneIcon, AddIcon, WarningIcon, SearchIcon, ArrowForwardIcon } from '@chakra-ui/icons'
import bg from './assets/Glycans_bg_dark.jpg';
import draw from './assets/draw.png';
import un from './assets/un.png';
import cell from './assets/cell_surface.jpg';
import dem1 from './assets/dem1.jpg';
import { Kbd } from '@chakra-ui/react'
import { url } from 'inspector';

const ContentSection: React.FC = () => {
  const navigate  = useNavigate();
  const [placeholderText, setPlaceholderText] = useState('Search GLYCAM ID, IUPAC, GlycoCT, WURCS...');
  const placeholders = [
    'Search by GLYCAM ID...',
    'Look up by IUPAC...',
    'Find by GlycoCT...',
    'Query with WURCS...',
    'Enter your search query...'
];
  const [results, setResults] = useState<string[]>([]);
  const [searchString, setSearchString] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const keyHint = useBreakpointValue({ base: isMac ? '⌘K' : 'Ctrl+K', md: 'Press Ctrl+K to search' });

  useEffect(() => {
    let index = 0;

    const interval = setInterval(() => {
        index = (index + 1) % placeholders.length;
        setPlaceholderText(placeholders[index]);
    }, 1500);

    // Cleanup on component unmount
    return () => {
        clearInterval(interval);
    };
}, []);

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
      // Ensure that searchRef and its current property is not null
      if (!searchRef || !searchRef.current) {
        console.warn("Search reference is not available.");
        return;
      }
      
      const requestBody = {
        search_string: searchRef.current.value,
      };
      navigate(`/search?query=${searchRef.current.value}`);
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
        setSearchString(data.search_string);
      }
       else {
        console.warn("Received unexpected data format");
      }
  
    } catch (error) {
      console.error("There was an error fetching the data", error);
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
        padding="5em"
        minHeight={{ base: "60vh" }}
        backgroundImage={`url(${bg})`} 
        backgroundSize="cover" 
        backgroundRepeat="no-repeat"
      >
        <Text 
          bgGradient='linear(to-l, #FDFDA1, #E2FCC5 )' 
          bgClip='text'
          fontSize='6xl'
          fontWeight='extrabold'
          marginBottom="0.0rem"
        >
          {/* GlycoShape */}
        </Text>
        <Text 
          bgGradient='linear(to-l, #FDFDA1, #E2FCC5 )' 
          bgClip='text'
          fontSize='6xl'
          fontWeight='extrabold'
          marginBottom="0.2em"
        >
          Glycan Structure Database
        </Text> 
        <Text 
          bgGradient='linear(to-l, #F7FFE6, #F7FFE6)' 
          bgClip='text'
          fontSize='2xl'
          fontWeight='bold'
          marginBottom="1em"
        >
          Developed By  <Link fontWeight="bold" color={"#F7FFE6"} href="/elab" marginRight="20px">eLab</Link>
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
            width={"100%"}
            ref={searchRef}
            placeholder={placeholderText}
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
        

        <Flex direction="row" justify="space-between" width="80%" mt={2}>
          <Flex align="center">
            <Text color="white" marginRight={2}>Examples:</Text>
            <Button 
              backgroundColor="#7CC9A9" 
              _hover={{ backgroundColor: "#51BF9D" }} 
              color="white"
              onClick={url => window.location.replace('/search?query=LFucpa1-2DGalpa1-OH')}
            >
              LFucpa1-2DGalpa1-OH
            </Button>
          </Flex>
          <Text color="white" cursor="pointer">See search help <ArrowForwardIcon /></Text>
        </Flex>

      </Flex>              
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
          <Flex 
            direction={["column", "row"]} 
            align="center"
            padding={"10rem"}
            paddingLeft={"250px"}
            backgroundColor="#FFFFFF"
          >
            <Box flex="1">
              <Text
                align={"center"}
                bgGradient='linear(to-l, #44666C, #4E6E6D)'
                bgClip='text'
                fontSize='5xl'
                fontWeight='bold'
              > 
                What are Glycans?
              </Text>
              <Container textAlign={'center'} fontSize={'2xl'}>
              Glycans, often referred to as complex carbohydrates or polysaccharides, play a crucial role in various biological processes. They are essentially chains or branches of sugar molecules that can be found on the surface of all cells in every living organism. Functioning as the "face" of cells, glycans facilitate communication between cells and their environment, influencing a vast range of processes from cell signaling to immunity. Their intricate structures and patterns determine the roles they play, making them essential for understanding health and disease states.

              </Container>
              <Text fontSize={'2xl'}>
              </Text>
            </Box>
            <Box flex="1">
              <Image maxHeight={"25rem"} width={'auto'} paddingLeft={'2rem'} src={cell} alt="Description Image" />
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
              <Image maxHeight={"35rem"} src={dem1} alt="Importance Image" />
            </Box>
          </Flex>
</Flex>

    </Flex>
  );
}

export default ContentSection;
