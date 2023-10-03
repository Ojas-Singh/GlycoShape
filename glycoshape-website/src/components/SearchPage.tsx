import React, { useState, useEffect, useRef,  } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { FiCopy } from 'react-icons/fi';
import { PhoneIcon, AddIcon, WarningIcon, SearchIcon, ArrowForwardIcon } from '@chakra-ui/icons'
import {
  Highlight, useClipboard ,Code, Center, Wrap, Input, Button, Text, Flex, Box, Image, useBreakpointValue, SimpleGrid, Heading, Container, Link, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, WrapItem, VStack
  } from "@chakra-ui/react";
import draw from './assets/draw.png';
import bg from './assets/Glycans_bg_dark3.png';
import { Kbd } from '@chakra-ui/react'
import Draw from './Draw';


const SearchPage = () =>{
    const navigate  = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const [results, setResults] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [searchString, setSearchString] = useState<string>(queryParams.get('query') || '');
    const [isWurcsSearch, setIsWurcsSearch] = useState(true);
    const [wurcsString, setWurcsString] = useState<string>(queryParams.get('wurcsString') || '');
    const [wurcsImageSrc, setWurcsImageSrc] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const searchRef = useRef<HTMLInputElement>(null);
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const keyHint = useBreakpointValue({ base: isMac ? '⌘K' : 'Ctrl+K', md: 'Press Ctrl+K to search' });
    const [copiedGlycan, setCopiedGlycan] = useState<string | null>(null);  // Track the copied glycan
    const { hasCopied, onCopy } = useClipboard(copiedGlycan || '');  // Provide a fallback empty string
    
  useEffect(() => {
    const fetchWurcsImage = async () => {
      try {
        if(wurcsString) {
          const response = await fetch(`https://api.glycosmos.org/wurcs2image/1.23.1/png/html/${encodeURIComponent(wurcsString)}`);
          const data = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(data, "text/html");
          const imgsrc = doc.getElementsByTagName("img")[0]?.src || null;
          setWurcsImageSrc(imgsrc);
        }
      } catch (err) {
        console.error("Error fetching WURCS image", err);
      }
    };
    fetchWurcsImage();
  }, [wurcsString]);


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
          let url, body;
          if (wurcsString && !searchString) {
            url = 'https://glycoshape.io/api/wurcs';
            body = JSON.stringify({
                wurcs_string: wurcsString,
            });
        } else if (searchString) {
            setIsWurcsSearch(false);
            url = 'https://glycoshape.io/api/search';
            body = JSON.stringify({
                search_string: searchString,
            });
        } else {
          // Handle the case when neither wurcsString nor searchString has a value
          console.warn("Please provide a valid search string or WURCS string!");
          setError("No search string or WURCS string provided.");
          return;
        }
  
          const response = await fetch(url, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: body
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
  
    
  useEffect(() => {
    handleSearch();
    
}, [searchString]);
    
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
        padding="1em"
        paddingTop="2em"
        minHeight={{ base: "15vh" }}
        backgroundImage={`url(${bg})`} 
        backgroundSize="cover" 
        // backgroundPosition="center"
        backgroundRepeat="no-repeat"  
      >
        

        <Flex 
          width="80%" 
          minWidth={{ base: "100%", md: "80%" }}
          align="center" 
          position="relative"
          // gap="1em" 
          boxShadow="xl" 
          borderRadius="full" 
          overflow="hidden" 
          p="0.5rem"
          bg="white"
        >
          <Button onClick={handleImageClick} variant="unstyled" p={0} m={0} ml={2}>
            <Image src={draw} alt="Icon Description" w="24px" h="24px" />
          </Button>
          <Modal isCentered size={'90%'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalOverlay bg='none'
      backdropFilter='auto'
      // backdropInvert='80%'
      backdropBlur='3px' />
        <ModalContent  >
          <ModalHeader  alignSelf={'center'}> <Text 
          bgGradient='linear(to-l, #44666C, #A7C4A3)'
          bgClip='text'
          fontSize='3xl'
          fontWeight='bold'
          marginBottom={'-1rem'}
        ><Highlight query='Glycan Drawer' styles={{alignSelf: 'center', px: '3', py: '1', rounded: 'full', bg: 'rgba(40, 54, 63, .4)', color:'#F7FFE6'}}>
        Glycan Drawer
       </Highlight>
          
        </Text></ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            
              {/* <Image src={un} alt="Description" /> */}

              <Draw />
          </ModalBody>
          <ModalFooter>
            {/* <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Close</Button> */}
          </ModalFooter>
        </ModalContent>
      </Modal>
      
          <Input 
            value={searchString}
            onChange={(e) => setSearchString(e.target.value)}
            width={{base: "60%",sm: "80%", md: "80%", lg: "80%",xl: "80%"}}
            fontFamily={'texts'}
            ref={searchRef}
            placeholder='Search GLYCAM ID, IUPAC, GlycoCT, WURCS...'
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
            right={{base: "2rem",sm: "2rem", md: "2rem", lg: "2rem",xl: "2rem"}}
            top="50%" 
            transform="translateY(-50%)"
            color="gray.500"
            fontSize={{base: "xs",sm: "xs", md: "sm", lg: "sm",xl: "sm"}}
            userSelect="none"
          >
            <Kbd>ctrl</Kbd> + <Kbd>K</Kbd>
          </Text>
          
          
        </Flex>
        

        <Flex direction="row" justify="space-between" width="80%" mt={2}>
          <Flex align="center">
            <Text color="white" marginRight={2}>Examples:</Text>
            <Button 
              backgroundColor="#7CC9A9" 
              _hover={{ backgroundColor: "#51BF9D" }} 
              color="white"
              onClick={url => window.location.replace('/glycan?IUPAC=GlcNAc(b1-4)Man')}
            >
              GlcNAc(b1-4)Man
            </Button>&nbsp;
            <Button 
              backgroundColor="#7CC9A9" 
              _hover={{ backgroundColor: "#51BF9D" }} 
              color="white"
              onClick={url => window.location.replace('/search?query=N-Glycan')}
            >
             N-Glycan
            </Button>
          </Flex>
          <Text color="white" cursor="pointer">See search help <ArrowForwardIcon /></Text>
        </Flex>
      </Flex>

      {results.length > 0 && (
        <Flex direction="column" align="center" width="100%">
        <Box width="100%" padding="4em" paddingTop={'2rem'}>
  <Text fontSize="2xl" marginBottom="1em">
    Showing {results.length} search results for {
      isWurcsSearch 
        ? <img src={wurcsImageSrc === null ? undefined : wurcsImageSrc} alt="WURCS Image" style={{width: '200px', height: 'auto', objectFit: 'contain'}} />
        
        : `"${searchString}"`
    }
  </Text>
</Box>


    
        <Flex direction="row" width="100%" padding="2em" paddingTop={'0.5em'}>
          {/* Filters on the left */}
          <Box width="30%" padding="1em">
            {/* Example filter */}
            {/* <Text>Filter 1</Text> */}
            {/* Add more filters as needed */}
          </Box>
          <Box width="80%" padding="1em">
          {results.map((glycan, index) => (
            <Box
              key={index}
              width="100%"
              padding="1em"
              boxShadow="md"
              marginBottom="1em"
              backgroundColor="white"
              borderRadius="md"
              display="flex"
              flex='1'
              
            ><VStack align={'left'}>
              <Heading padding={'1rem'} fontSize="xl" marginRight="1em"> {glycan.length > 60 ? glycan.substring(0, 60) + '...' : glycan}  </Heading>
              <Wrap >

                
                <WrapItem>

                  <Link href={`/glycan?IUPAC=${glycan}`}>
              <Image
                src={`/database/${glycan}/${glycan}.svg`} // Replace with the path to your dummy image
                alt="Glycan Image"
                height="150px"
                maxWidth={"200px"}
                marginRight="1em"
              /></Link>
              </WrapItem>
              <WrapItem>
                <Text>Type : Free</Text>
                
                </WrapItem>
              <WrapItem   alignContent={'center'}>
                
              </WrapItem>
              </Wrap>
              </VStack>
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

export default SearchPage;
