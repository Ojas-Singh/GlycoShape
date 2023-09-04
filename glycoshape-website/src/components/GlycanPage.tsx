import React, { useState, useEffect, useRef,  } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
 Divider, Spacer, useClipboard, Wrap, WrapItem, Code , HStack,Tab, Tabs, TabList, TabPanels, TabPanel, Input, Button, Text, Flex, Box, Image, useBreakpointValue, SimpleGrid, Heading, Container, Link, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, VStack
  } from "@chakra-ui/react";
import Searchbar from './SearchBar';
import draw from './assets/draw.png';
import un from './assets/un.png';
import bg from './assets/Glycans_bg_dark.jpg';
import { Kbd } from '@chakra-ui/react'
import ContourPlot from './ContourPlot';
import Scatter3D from './Scatter3D';

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

    const [activeSection, setActiveSection] = useState<string | null>(null);

    const contentRef1 = useRef<HTMLDivElement>(null);
    const contentRef2 = useRef<HTMLDivElement>(null);
    const contentRef3 = useRef<HTMLDivElement>(null);
    const contentRef4 = useRef<HTMLDivElement>(null);
    const contentRef5 = useRef<HTMLDivElement>(null);
    const contentRef6 = useRef<HTMLDivElement>(null);

    type SectionRefs = {
        section1: React.MutableRefObject<HTMLDivElement | null>;
        section2: React.MutableRefObject<HTMLDivElement | null>;
        section3: React.MutableRefObject<HTMLDivElement | null>;
        sequence: React.MutableRefObject<HTMLDivElement | null>;
        section4: React.MutableRefObject<HTMLDivElement | null>;
        section5: React.MutableRefObject<HTMLDivElement | null>;
    };

    const refs: SectionRefs = {
        sequence: contentRef6,
        section1: contentRef1,
        section2: contentRef2,
        section3: contentRef3,
        section4: contentRef4,
        section5: contentRef5,
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
          { threshold: 0.3 } // Adjust this value as needed
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


interface GlycanData {
  glycam: string;
  iupac: string;
  wurcs: string;
  glycoct: string | null;
  smiles: string;
  components: Record<string, number>;
  composition: string | null;
  mass: string;
  motifs: string[];
  termini: string[];
  tpsa: number;
  rot_bonds: number;
  hbond_donor: number;
  hbond_acceptor: number;
  glycan_type: string | null;
  glytoucan_id: string;
  disease: string | null;
  tissue: string | null;
  species: string | null;
  genus: string | null;
  family: string | null;
  order: string | null;
  class: string | null;
  phylum: string | null;
  kingdom: string | null;
  domain: string | null;
  clusters: Record<string, number>;
  length: string;
  package: string;
  forcefield: string;
  temperature: string;
  pressure: string;
  salt: string;
  contributor: string;
}


  const [data, setData] = useState<GlycanData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`https://glycoshape.io/database/${sequence}/${sequence}.json`);
        if (!response.ok) {
          throw new Error('Network response was not ok ' + response.statusText);
        }
        const result: GlycanData = await response.json();
        setData(result);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);






  return (
    <Box >
      <Flex 
        direction="column" 
        align="center" 
        justify="center" 
        flex="1" 
        padding="1rem"
        paddingTop="2rem"
        minHeight={{ base: "15vh" }}
        backgroundImage={`url(${bg})`} 
        backgroundSize="cover" 
        backgroundRepeat="no-repeat"  
      >
       <Searchbar />
      </Flex>

      {sequence && (
        <Flex>
        
      <Box flex="1" >
        <Tabs align={"end"} padding={'1rem'} paddingTop={"1rem"}  colorScheme='green'>
          <TabList  display="flex" width={'100%'} position="sticky" top="0" bg="white" zIndex="10" marginRight={'2rem'} >
            <HStack >
            <Image
              src={`/database/${sequence}/${sequence}.svg`} 
              alt="Glycan Image"
              height="5rem"
              // marginRight="1rem"
            />
             
            <Text fontSize={{base: "0",sm: "1xl", md: "3xl", lg: "3xl",xl: "3xl"}} >
            {sequence.length > 30 ? sequence.substring(0, 60) + '...' : sequence}
            </Text></HStack>
            <Spacer />
          <Tab>Information</Tab>
          <Tab>Structure</Tab>
                            <Button  
                            marginLeft={'1rem'}
                             transform="translateY(50%)"
                              borderRadius="full"
                              backgroundColor="#7CC9A9"
                              _hover={{
                                  backgroundColor: "#51BF9D"
                              }}
                              size = {{base: "md",sm: "md", md: "md", lg: "md",xl: "md"}}
                              >Download</Button>
        </TabList>
        <TabPanels>
              <TabPanel >
              <Box display="flex" >
            {/* Sidebar */}
            <Box position={'sticky'} top="0" zIndex={5}
            visibility={{base: "hidden",sm: "hidden", md: "visible", lg: "visible",xl: "visible"}}
            width={{base: "0",sm: "0", md: "10%", lg: "10%",xl: "10%"}}  height={'50vh'}  paddingTop={'5rem'} paddingLeft={'0rem'}>
            <VStack align="start" spacing={1} justify="start"> {/* Added justify="start" */}
                    <Button 
                        onClick={() => scrollToContent(contentRef6)}
                        bg={activeSection === 'sequence' ? '#466263' : 'gray.300'}
                        fontSize={activeSection === 'sequence' ? 'larger' : 'medium'} // Adjust font sizes as desired
                        color={activeSection === 'sequence' ? 'white' : '#1A202C'}
                        fontStyle={'medium'}

                        borderRadius="0" // Sharp rectangular edges
                    >
                        Sequences
                    </Button>
                    <Button 
                        onClick={() => scrollToContent(contentRef4)}
                        bg={activeSection === 'section4' ? '#466263' : 'gray.300'}
                        fontSize={activeSection === 'section4' ? 'larger' : 'medium'} // Adjust font sizes as desired
                        color={activeSection === 'section4' ? 'white' : '#1A202C'}
                        fontStyle={'medium'}
                        borderRadius="0" // Sharp rectangular edges
                    >
                        Section 2
                    </Button>
                    <Button 
                        onClick={() => scrollToContent(contentRef5)}
                        bg={activeSection === 'section5' ? '#466263' : 'gray.300'}
                        fontSize={activeSection === 'section5' ? 'larger' : 'medium'} // Adjust font sizes as desired
                        color={activeSection === 'section5' ? 'white' : '#1A202C'}
                        fontStyle={'medium'}

                        // fontFamily={'thin'}
                        borderRadius="0" // Sharp rectangular edges
                    >
                        Section 3
                    </Button>
                </VStack>

            </Box>
            {/* Main Content */}
            <Box flex="1"  p={'2rem'} >
            
                <Box ref={contentRef6}  id="sequence" pb={'4rem'}
                    boxShadow="md"
                    marginBottom="1em"
                    backgroundColor="white"
                    borderRadius="md">
                      <VStack align={'left'} padding={'1rem'}>
                    <Text fontSize="2xl" mb={2}>Sequences</Text>
                    <Divider />

                    <Wrap >
                      
                      <VStack align={'left'} padding={'1rem'}>
                      <WrapItem alignContent={'center'}>
                      <Text fontFamily={'texts'}>SNFG</Text>
                    <Image
              src={`/database/${sequence}/${sequence}.svg`} 
              alt="Glycan Image"
              height={{base: "10rem",sm: "10rem", md: "20rem", lg: "25rem",xl: "25rem"}}
              width={'25rem'}
              // marginRight="1rem"
            />       
             <iframe
                      // key={sequence}
                      width="100%"
                      height="400px"
                      
                      src={`/litemol/index.html?pdbUrl=https://glycoshape.io/database/${sequence}/${sequence}_cluster0_alpha.pdb&format=pdb`}                                  frameBorder="0"
                      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Protein Structure"
                              /> </WrapItem>
            <Box alignItems={'center'} alignContent={'center'} justifyContent={'center'} justifyItems={'center'}>
                      <WrapItem alignContent={'center'}>
                      <Text fontFamily={'texts'} transform="translateY(50%)"  fontSize="md" >
                  GLYCAM :   </Text>
                  <Box padding={'0.5rem'} >
              <Code 
                    p={2} 
                    display="block" 
                    whiteSpace="pre" 
                    width={{base: "10rem",sm: "10rem", md: "20rem", lg: "60rem",xl: "60rem"}}
                    overflowX="auto"
                    fontFamily={'mono'}
                  >
                    {data?.glycam}
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
                      <WrapItem alignContent={'center'}>
                      <Text  fontFamily={'texts'} transform="translateY(50%)"  fontSize="md" >
                  IUPAC  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:   </Text>
                  <Box padding={'0.5rem'}>
              <Code 
                    p={2} 
                    display="block" 
                    whiteSpace="pre" 
                    width={{base: "10rem",sm: "10rem", md: "20rem", lg: "60rem",xl: "60rem"}}
                    overflowX="auto"
                    fontFamily={'mono'}
                  >
                    {data?.iupac}
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
                      <WrapItem alignContent={'center'}>
                      <Text fontFamily={'texts'} transform="translateY(50%)"  fontSize="md" >
                      WURCS  &nbsp;&nbsp;:   </Text>
                  <Box padding={'0.5rem'}>
              <Code 
                    p={2} 
                    display="block" 
                    whiteSpace="pre" 
                    width={{base: "10rem",sm: "10rem", md: "20rem", lg: "60rem",xl: "60rem"}}
                    overflowX="auto"
                    fontFamily={'mono'}
                  >
                    {data?.wurcs}
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
                      <WrapItem alignContent={'center'}>
                      <Text fontFamily={'texts'} transform="translateY(50%)"  fontSize="md" >
                      SMILES  &nbsp;&nbsp;:   </Text>
                  <Box padding={'0.5rem'}>
              <Code 
                    p={2} 
                    display="block" 
                    whiteSpace="pre" 
                    width={{base: "10rem",sm: "10rem", md: "20rem", lg: "60rem",xl: "60rem"}}
                    overflowX="auto"
                    fontFamily={'mono'}
                  >
                    {data?.smiles}
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
                      </Box>
                      </VStack>
                    </Wrap>
                    {/* <Code>{JSON.stringify(data, null, 2)}</Code> */}
                    
                      </VStack>
                      {/* <Scatter3D dataUrl="/pca.csv" /> */}
                    
                </Box>
                <Box ref={contentRef4}   id="section4"
                    mb={2}
                    boxShadow="md"
                    marginBottom="1em"
                    backgroundColor="white"
                    borderRadius="md">
                       <VStack align={'left'} padding={'1rem'}>
                    <Text fontSize="2xl" mb={2}>Section 2</Text>
                    <Divider />
                    <Text>
                        
                        Lorem ipsum dolor sit, amet consectetur adipisicing elit. Adipisci, 
                        
                    </Text>
                    
                    </VStack>
                    {/* <ContourPlot dataUrl="/torsions.csv" />  */}
                </Box>
          <Box ref={contentRef5}  id="section5" 
                    mb={2}
                    boxShadow="md"
                    marginBottom="1em"
                    backgroundColor="white"
                    borderRadius="md">
                      <VStack align={'left'} padding={'1rem'}>
                    <Text fontSize="2xl" mb={2}>Section 3</Text>
                    <Divider />
                   
                              </VStack>
                </Box>
            </Box></Box>
                 
              </TabPanel>


          



          <TabPanel>
          <Box display="flex" >
            {/* Sidebar */}
            <Box position={'sticky'} top="0" zIndex="5"  width="10%"  height={'50vh'} padding={'2rem'} paddingTop={'5rem'} paddingLeft={'0rem'}>
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
            <Box flex="1" p={'4rem'} >
                <Box ref={contentRef1}  id="section1" pb={'4rem'}>
                    <Text fontSize="2xl" mb={2}>Section 1</Text>
                    
                </Box>
                <Box ref={contentRef2}   id="section2" pb={'4rem'}>
                    <Text fontSize="2xl" mb={2}>Section 2</Text>
                    
                </Box>
          <Box ref={contentRef3}  id="section3" pb={'4rem'}>
                    <Text fontSize="2xl" mb={2}>Section 3</Text>
                    
                </Box>
            </Box></Box>
          </TabPanel>
          <TabPanel>

          {/* <ContourPlot dataUrl="/torsions.csv" /> */}
          
          {/* <Scatter3D dataUrl="/pca.csv" /> */}
          {/* </Box> */}
              
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
