import React, { useState, useEffect, useRef } from 'react';
import { useNavigate  } from 'react-router-dom';
import {
  FormControl, ChakraProvider ,AspectRatio, Wrap, Highlight, Input, Button, Text, Flex, Box, Image, useBreakpointValue, SimpleGrid, Heading, Container, Link, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, WrapItem, Spacer
} from "@chakra-ui/react";
import { PhoneIcon, AddIcon, WarningIcon, SearchIcon, ArrowForwardIcon } from '@chakra-ui/icons'
import draw from './assets/draw.png';
import un from './assets/un.png';
import { Kbd } from '@chakra-ui/react'
import Draw from './Draw';


const Bar: React.FC = () => {
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
      
    } catch (error) {
      console.error("There was an error fetching the data", error);
    }
  };
  
  const handleImageClick = () => {
    setIsModalOpen(true);
  }



  return (
    <Flex 
    width={'100%'}
    direction="column" 
    align="center" 
    justify="center" 
    flex="1" 
    // padding="1em"
    
  >    
      
      <Flex 
          width="80%" 
          minWidth={{ base: "100%", md: "80%" }}
          align="center" 
          position="relative"
          gap="1em" 
          boxShadow="xl" 
          borderRadius="full" 
          overflow="hidden" 
          p="0.5rem"
          bg="white"
        >
          <Button onClick={handleImageClick} variant="unstyled" p={0} m={0} ml={2}>
            <Image src={draw} alt="Icon Description" w="24px" h="24px" />
          </Button>
          <Modal isCentered blockScrollOnMount={true} size={'10px'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
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
          <ModalBody >
              <Draw />
          </ModalBody>
          {/* <ModalFooter>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Close</Button>
          </ModalFooter> */}
        </ModalContent>
      </Modal>
      <form style={{ width: '100%', flex:"1" }} onSubmit={handleSearch} >
          <Input 
            width={{base: "50%",sm: "50%", md: "80%", lg: "80%",xl: "80%"}}
            fontFamily={'texts'}
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
            right={{base: "1rem",sm: "1rem", md: "7rem", lg: "8rem",xl: "8rem"}}
            top="50%" 
            transform="translateY(-50%)"
            color="gray.500"
            fontSize={{base: "xs",sm: "xs", md: "sm", lg: "sm",xl: "sm"}}
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

  );
}

export default Bar;
