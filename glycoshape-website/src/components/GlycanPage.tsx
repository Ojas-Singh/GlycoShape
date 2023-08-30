import React, { useState, useEffect, useRef,  } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
 Spacer, useClipboard, Wrap, WrapItem, Code , HStack,Tab, Tabs, TabList, TabPanels, TabPanel, Input, Button, Text, Flex, Box, Image, useBreakpointValue, SimpleGrid, Heading, Container, Link, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, VStack
  } from "@chakra-ui/react";
import Searchbar from './SearchBar';
import draw from './assets/draw.png';
import un from './assets/un.png';
import bg from './assets/Glycans_bg_dark.jpg';
import { Kbd } from '@chakra-ui/react'

const GlycanPage: React.FC = () => {
    const navigate  = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const [results, setResults] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [sequence, setsequence] = useState<string>(queryParams.get('query') || '');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const searchRef = useRef<HTMLInputElement>(null);
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const keyHint = useBreakpointValue({ base: isMac ? '⌘K' : 'Ctrl+K', md: 'Press Ctrl+K to search' });
    const { hasCopied, onCopy } = useClipboard(sequence || '');  // Provide a fallback empty string

    const sidebarLinksForFirstTab = [
      { id: 'sequence', name: 'GLYCAM Sequence' },
      { id: 'structure', name: 'Structure' },
      { id: 'structure2', name: 'Structure' },
      { id: 'structure3', name: 'Structure' },
      { id: 'structure4', name: 'Structure' },
      { id: 'structure5', name: 'Structure' },
      { id: 'structure6', name: 'Structure' },
      { id: 'structure7', name: 'Structure' },
      { id: 'structure8', name: 'Structure' },
      // Add other links here
    ];
    const sequenceRef = useRef<HTMLDivElement>(null);
    const structureRef = useRef<HTMLDivElement>(null);

    const scrollToComponent = (ref: React.RefObject<HTMLDivElement>) => {
      ref.current?.scrollIntoView({ behavior: 'smooth' });
    };


    // const contentRef1 = useRef<HTMLDivElement | null>(null);
    // const contentRef2 = useRef<HTMLDivElement | null>(null);
    // const contentRef3 = useRef<HTMLDivElement | null>(null);

    // const scrollToContent = (ref: React.RefObject<HTMLDivElement>) => {
    //   const offsetY = -5; // Adjust this value to control how much above the heading you want to scroll
    //   const y = ref.current?.getBoundingClientRect().top || 0 + window.pageYOffset + offsetY;
    //   window.scrollTo({ top: y, behavior: 'smooth' });
    // };
    
    const [activeSection, setActiveSection] = useState<string | null>(null);

    const contentRef1 = useRef<HTMLDivElement>(null);
    const contentRef2 = useRef<HTMLDivElement>(null);
    const contentRef3 = useRef<HTMLDivElement>(null);

    type SectionRefs = {
        section1: React.MutableRefObject<HTMLDivElement | null>;
        section2: React.MutableRefObject<HTMLDivElement | null>;
        section3: React.MutableRefObject<HTMLDivElement | null>;
    };

    const refs: SectionRefs = {
        section1: contentRef1,
        section2: contentRef2,
        section3: contentRef3,
    };

    useEffect(() => {
      const observer = new IntersectionObserver(
          entries => {
              entries.forEach(entry => {
                  if (entry.isIntersecting) {
                      setActiveSection(entry.target.id);
                  }
              });
          },
          { threshold: 0.2 } // Adjust this value as needed
      );
  
      (Object.keys(refs) as Array<keyof SectionRefs>).forEach(key => {
          observer.observe(refs[key].current as Element);
      });
  
      return () => {
          (Object.keys(refs) as Array<keyof SectionRefs>).forEach(key => {
              observer.unobserve(refs[key].current as Element);
          });
      };
  }, []);
  

const scrollToContent = (ref: React.MutableRefObject<HTMLDivElement | null>) => {
  if (ref.current) {
      const offset = 80; // Adjust this value for the desired offset
      window.scrollTo({
          top: ref.current.getBoundingClientRect().top + window.pageYOffset - offset,
          behavior: 'smooth'
      });
  }
};



  return (
    <Box >
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
        backgroundRepeat="no-repeat"  
      >
       <Searchbar />
      </Flex>

      {sequence && (
        <Flex>
          {/* <Box width="20rem" position="sticky" bg="gray.700" color="white">
        Sidebar Content
      </Box> */}

      <Box flex="1" >
        <Tabs align={"end"} padding={'10rem'} paddingTop={"1rem"}  colorScheme='green'>
          <TabList  display="flex" width={'100%'} position="sticky" top="0" bg="white" zIndex="10" marginRight={'2rem'} >
            <HStack >
            <Image
              src="/glycan.jpg" 
              alt="Glycan Image"
              width="150px"
              marginRight="1em"
            />
            <Text fontSize="3xl" >
              Glycan Name
            </Text></HStack>
            <Spacer />
          <Tab>Information</Tab>
          <Tab>Structure</Tab>
          <Tab>Publications</Tab>
        </TabList>
        <TabPanels>
              <TabPanel >
                  <Flex>
                     

                      {/* Main content */}
                      <Box flex="1" overflowY="auto" padding={8}>
                      <div ref={sequenceRef}>
                    <Wrap>
                      <WrapItem alignContent={'center'}>
                      <Text transform="translateY(50%)"  fontSize="md" >
                  GLYCAM Sequence :   </Text>
                  <Box padding={'0.5rem'}>
              <Code 
                    p={2} 
                    display="block" 
                    whiteSpace="pre" 
                    width={{base: "10rem",sm: "10rem", md: "20rem", lg: "40rem",xl: "50rem"}}
                    overflowX="auto"
                    fontFamily={'mono'}
                  >
                    {sequence}
                  </Code></Box>
                  <Button marginRight={'0rem'} transform="translateY(30%)" alignContent={"center"}  type="submit"
                    borderRadius="full" 
                    size={"sm"}
                    backgroundColor="#7CC9A9"
                    _hover={{
                      backgroundColor: "#51BF9D"
                    }}  onClick={onCopy}>

                    {hasCopied ? "Copied!" : "Copy"}
            
                      </Button>
                      </WrapItem>
                    </Wrap>
                  </div>
                  <div ref={structureRef}>
                  <iframe
                      key={sequence}
                      width="90%"
                      height="400px"
                      src={`/litemol/index.html?pdbUrl=https://glycoshape.io/database/${sequence}/output/structure.pdb&format=pdb`}                                  frameBorder="0"
                      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Protein Structure"
                              /> 
                  </div>
                  
                
                 
                  

                      </Box>
                  </Flex>
              </TabPanel>


          <TabPanel>
              <Flex align={'left'} marginLeft={'1rem'}>
                <VStack align="start" spacing={4} marginRight={4}>
                  {sidebarLinksForFirstTab.map((link) => (
                    <Button key={link.id} onClick={() => scrollToComponent(link.id === 'sequence' ? sequenceRef : structureRef)}>
                      {link.name}
                    </Button>
                  ))}
                </VStack>
                <Box flex="1">
                  <div ref={sequenceRef}>
                    <Wrap>
                      <WrapItem alignContent={'center'}>
                      <Text transform="translateY(50%)"  fontSize="md" >
                  GLYCAM Sequence :   </Text>
                  <Box padding={'0.5rem'}>
              <Code 
                    p={2} 
                    display="block" 
                    whiteSpace="pre" 
                    width={{base: "10rem",sm: "10rem", md: "20rem", lg: "40rem",xl: "50rem"}}
                    overflowX="auto"
                    fontFamily={'mono'}
                  >
                    {sequence}
                  </Code></Box>
                  <Button marginRight={'0rem'} transform="translateY(30%)" alignContent={"center"}  type="submit"
                    borderRadius="full" 
                    size={"sm"}
                    backgroundColor="#7CC9A9"
                    _hover={{
                      backgroundColor: "#51BF9D"
                    }}  onClick={onCopy}>

                    {hasCopied ? "Copied!" : "Copy"}
            
                      </Button>
                      </WrapItem>
                    </Wrap>
                  </div>
                  <div ref={structureRef}>
                  <iframe
                      key={sequence}
                      width="90%"
                      height="400px"
                      src={`/litemol/index.html?pdbUrl=https://glycoshape.io/database/${sequence}/output/structure.pdb&format=pdb`}                                  frameBorder="0"
                      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Protein Structure"
                              /> 
                  </div>
                  {/* Other components to scroll to, ensure you have a ref for each... */}
                </Box>
              </Flex>
            </TabPanel>



          <TabPanel>
          <Box display="flex" >
            {/* Sidebar */}
            <Box position={'sticky'} top="0" zIndex="5"  width="15rem"  height={'50vh'} padding={'2rem'} paddingTop={'5rem'} paddingLeft={'0rem'}>
            <VStack align="start" spacing={1} justify="start"> {/* Added justify="start" */}
                    <Button 
                        onClick={() => scrollToContent(contentRef1)}
                        bg={activeSection === 'section1' ? '#466263' : 'gray.300'}
                        fontSize={activeSection === 'section1' ? 'larger' : 'medium'} // Adjust font sizes as desired
                        color={activeSection === 'section1' ? 'white' : '#1A202C'}
                        fontStyle={'medium'}

                        borderRadius="0" // Sharp rectangular edges
                    >
                        Section 1
                    </Button>
                    <Button 
                        onClick={() => scrollToContent(contentRef2)}
                        bg={activeSection === 'section2' ? '#466263' : 'gray.300'}
                        fontSize={activeSection === 'section2' ? 'larger' : 'medium'} // Adjust font sizes as desired
                        color={activeSection === 'section2' ? 'white' : '#1A202C'}
                        fontStyle={'medium'}

                        borderRadius="0" // Sharp rectangular edges
                    >
                        Section 2
                    </Button>
                    <Button 
                        onClick={() => scrollToContent(contentRef3)}
                        bg={activeSection === 'section3' ? '#466263' : 'gray.300'}
                        fontSize={activeSection === 'section3' ? 'larger' : 'medium'} // Adjust font sizes as desired
                        color={activeSection === 'section3' ? 'white' : '#1A202C'}
                        fontStyle={'medium'}

                        // fontFamily={'thin'}
                        borderRadius="0" // Sharp rectangular edges
                    >
                        Section 3
                    </Button>
                </VStack>

            </Box>
            {/* Main Content */}
            <Box flex="1" p={4} >
                <Box ref={contentRef1}  id="section1" pb={4}>
                    <Text fontSize="2xl" mb={2}>Section 1</Text>
                    <Text>
                        Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!
                    </Text>
                </Box>
                <Box ref={contentRef2}   id="section2" pb={4}>
                    <Text fontSize="2xl" mb={2}>Section 2</Text>
                    <Text>
                        Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!
                    </Text>
                </Box>
          <Box ref={contentRef3}  id="section3" pb={4}>
                    <Text fontSize="2xl" mb={2}>Section 3</Text>
                    <Text>
                        Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        eveniet! Lorem ipsum dolor sit, amet consectetur adipisicing elit. 
                        Adipisci, eveniet!
                    </Text>
                </Box>
            </Box></Box>
          </TabPanel>
        </TabPanels>
        </Tabs>

        
       
      </Box>
    </Flex>
      )}
      {error && (
  <Text color="red.500" textAlign="center">
    Please enter a valid search string!
    {error}
  </Text>
)}
      

    </Box>
  );
}

export default GlycanPage;
