import React, { useState, useEffect, useRef,  } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
 Grid,Divider, Spacer, useClipboard, Wrap, WrapItem, Code , HStack,Tab, Tabs, TabList, TabPanels, TabPanel, Input, Button, Text, Flex, Box, Image, useBreakpointValue, SimpleGrid, Heading, Container, Link, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, VStack
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


    type SectionRefs = {
        Biological_information : React.MutableRefObject<HTMLDivElement | null>;
        Chemical_information: React.MutableRefObject<HTMLDivElement | null>;
        Glycan_information: React.MutableRefObject<HTMLDivElement | null>;
        Nomenclature : React.MutableRefObject<HTMLDivElement | null>;
        Simulation_information: React.MutableRefObject<HTMLDivElement | null>;
    };

    const refs: SectionRefs = {
      Nomenclature: contentRef1,
      Glycan_information: contentRef2,
      Chemical_information: contentRef3,
      Biological_information: contentRef4,
      Simulation_information: contentRef5,
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
  components: string[];
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
            width={{base: "0",sm: "0", md: "10%", lg: "15%",xl: "15%"}}  height={'50vh'}  paddingTop={'5rem'} paddingLeft={'0rem'}>
            <VStack align="right" spacing={1} justify="start"> {/* Added justify="start" */}
                    <Button 
                        onClick={() => scrollToContent(contentRef1)}
                        bg={activeSection === 'Nomenclature' ? '#466263' : 'gray.300'}
                        fontSize={activeSection === 'Nomenclature' ? 'larger' : 'medium'} // Adjust font sizes as desired
                        color={activeSection === 'Nomenclature' ? 'white' : '#1A202C'}
                        fontStyle={'medium'}
                        _hover={{
                          bg: '#51BF9D', // replace with the color you want on hover
                        }}
                        borderRadius="0" // Sharp rectangular edges
                    >
                        Nomenclature
                    </Button>
                    <Button 
                        onClick={() => scrollToContent(contentRef2)}
                        bg={activeSection === 'Glycan_information' ? '#466263' : 'gray.300'}
                        fontSize={activeSection === 'Glycan_information' ? 'larger' : 'medium'} // Adjust font sizes as desired
                        color={activeSection === 'Glycan_information' ? 'white' : '#1A202C'}
                        fontStyle={'medium'}
                        _hover={{
                          bg: '#51BF9D', // replace with the color you want on hover
                        }}
                        borderRadius="0" // Sharp rectangular edges
                    >
                        Glycan information 
                    </Button>
                    <Button 
                        onClick={() => scrollToContent(contentRef3)}
                        bg={activeSection === 'Chemical_information' ? '#466263' : 'gray.300'}
                        fontSize={activeSection === 'Chemical_information' ? 'larger' : 'medium'} // Adjust font sizes as desired
                        color={activeSection === 'Chemical_information' ? 'white' : '#1A202C'}
                        fontStyle={'medium'}
                        _hover={{
                          bg: '#51BF9D', // replace with the color you want on hover
                        }}
                        // fontFamily={'thin'}
                        borderRadius="0" // Sharp rectangular edges
                    >
                        Chemical information
                    </Button>
                    <Button 
                        onClick={() => scrollToContent(contentRef4)}
                        bg={activeSection === 'Biological_information' ? '#466263' : 'gray.300'}
                        fontSize={activeSection === 'Biological_information' ? 'larger' : 'medium'} // Adjust font sizes as desired
                        color={activeSection === 'Biological_information' ? 'white' : '#1A202C'}
                        fontStyle={'medium'}
                        _hover={{
                          bg: '#51BF9D', // replace with the color you want on hover
                        }}
                        // fontFamily={'thin'}
                        borderRadius="0" // Sharp rectangular edges
                    >
                              Biological information                    </Button>
                    <Button 
                        onClick={() => scrollToContent(contentRef5)}
                        bg={activeSection === 'Simulation_information' ? '#466263' : 'gray.300'}
                        fontSize={activeSection === 'Simulation_information' ? 'larger' : 'medium'} // Adjust font sizes as desired
                        color={activeSection === 'Simulation_information' ? 'white' : '#1A202C'}
                        fontStyle={'medium'}
                        _hover={{
                          bg: '#51BF9D', // replace with the color you want on hover
                        }}
                        // fontFamily={'thin'}
                        borderRadius="0" // Sharp rectangular edges
                    >
                        Simulation information
                    </Button>
                </VStack>

            </Box>
            {/* Main Content */}
            <Box flex="1"  p={'2rem'} >
            
                <Box ref={contentRef1}  id="Nomenclature" pb={'4rem'}
                    boxShadow="md"
                    marginBottom="1em"
                    backgroundColor="white"
                    borderRadius="md">
                      <VStack align={'left'} padding={'1rem'}>
                    <Text fontSize="2xl" color={"#2D5E6B"} mb={2}>Nomenclature</Text>
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
                      src={`/viewer/embedded.html?pdbUrl=https://glycoshape.io/database/${sequence}/${sequence}_cluster0_alpha.pdb&format=pdb`}    
                      // src={`/litemol/index.html?pdbUrl=https://glycoshape.io/database/${sequence}/${sequence}_cluster0_alpha.pdb&format=pdb`}                                  frameBorder="0"
                      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Protein Structure"
                              /> </WrapItem>
            <Box alignItems={'center'} alignContent={'center'} justifyContent={'center'} justifyItems={'center'}>
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
                  GlyTouCan ID:   </Text>
                  <Box padding={'0.5rem'}>
              <Code 
                    p={2} 
                    display="block" 
                    whiteSpace="pre" 
                    width={{base: "10rem",sm: "10rem", md: "20rem", lg: "58rem",xl: "58rem"}}
                    overflowX="auto"
                    fontFamily={'mono'}
                  >
                    {data?.glytoucan_id} <Spacer />
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
                <Box ref={contentRef2} id="Glycan_information" mb={2} boxShadow="md" marginBottom="1em" backgroundColor="white" borderRadius="md">
       <VStack align={'left'} padding={'1rem'}>
          <Text fontSize="2xl" color={"#2D5E6B"} mb={2}>Glycan information</Text>
          <Divider />
          <Grid templateColumns="repeat(2, 5fr)" gap={3} padding={'1rem'} >
             {[
                { label: "Glycan Type", value: data?.glycan_type || "Not Available" },
                { label: "Components", value: 'JSON.stringify(data?.components)' },
                { label: "Composition", value: 'data?.composition' || "Not Available" },
                { label: "Motifs", value: data?.motifs.join(', ') },
                { label: "Termini", value: data?.termini.join(', ') }
             ].map(item => (
                <Flex key={item.label} align="center" justify="space-between">
                   <Text fontFamily={'texts'} fontSize="md" width="45%" textAlign="right">{item.label}</Text>
                   <Divider orientation="vertical" height="30px" colorScheme="teal" />
                   <Text fontFamily={'texts'} fontSize="md" width="45%" textAlign="left">{item.value}</Text>
                </Flex>
             ))}
          </Grid>
       </VStack>
    </Box>

    <Box ref={contentRef3} id="Chemical_information" mb={2} boxShadow="md" marginBottom="1em" backgroundColor="white" borderRadius="md">
   <VStack align={'left'} padding={'1rem'}>
      <Text fontSize="2xl" color={"#2D5E6B"} mb={2}>Chemical Information</Text>
      <Divider />
      <Grid templateColumns="repeat(2, 1fr)" gap={6} padding={'1rem'}>
         {[
            { label: "Mass", value: data?.mass || "Not Available" },
            { label: "Topological Polar Surface Area", value: data?.tpsa || "Not Available" },
            { label: "Number of Rotatable Bonds", value: data?.rot_bonds || "Not Available" },
            { label: "Number of Hydrogen Bond Acceptors", value: data?.hbond_acceptor || "Not Available" },
            { label: "Number of Hydrogen Bond Donors", value: data?.hbond_donor || "Not Available" }
         ].map(item => (
            <Flex key={item.label} align="center" justify="space-between">
               <Text fontFamily={'texts'} fontSize="md" width="45%" textAlign="right">{item.label}</Text>
               <Divider orientation="vertical" height="20px" />
               <Text fontFamily={'texts'} fontSize="md" width="45%" textAlign="left">{item.value}</Text>
            </Flex>
         ))}
      </Grid>
   </VStack>
</Box>



<Box ref={contentRef4} id="Biological_information" mb={2} boxShadow="md" marginBottom="1em" backgroundColor="white" borderRadius="md">
   <VStack align={'left'} padding={'1rem'}>
      <Text fontSize="2xl" color={"#2D5E6B"} mb={2}>Biological Information</Text>
      <Divider />
      <Grid templateColumns="repeat(2, 1fr)" gap={6} padding={'1rem'}>
         {[
            { label: "Species", value: data?.species || "Not Available" },
            { label: "Genus", value: data?.genus || "Not Available" },
            { label: "Family", value: data?.family || "Not Available" },
            { label: "Order", value: data?.order || "Not Available" },
            { label: "Class", value: data?.class || "Not Available" },
            { label: "Phylum", value: data?.phylum || "Not Available" },
            { label: "Kingdom", value: data?.kingdom || "Not Available" },
            { label: "Domain", value: data?.domain || "Not Available" },
            { label: "Tissue", value: data?.tissue || "Not Available" },
            { label: "Diseases", value: data?.disease || "Not Available" }
         ].map(item => (
            <Flex key={item.label} align="center" justify="space-between">
               <Text fontFamily={'texts'} fontSize="md" width="45%" textAlign="right">{item.label}</Text>
               <Divider orientation="vertical" height="20px" />
               <Text fontFamily={'texts'} fontSize="md" width="45%" textAlign="left">{item.value}</Text>
            </Flex>
         ))}
      </Grid>
   </VStack>
</Box>



<Box ref={contentRef5} id="Simulation_information" mb={2} boxShadow="md" marginBottom="1em" backgroundColor="white" borderRadius="md">
   <VStack align={'left'} padding={'1rem'}>
      <Text fontSize="2xl" color={"#2D5E6B"}  mb={2}>Simulation Information</Text>
      <Divider />
      <Grid templateColumns="repeat(2, 1fr)" gap={6} padding={'1rem'}>
         {[
            { label: "Simulation Length (μs)", value: data?.length || "Not Available" },
            { label: "MD Engine", value: data?.package || "Not Available" },
            { label: "Force Field", value: data?.forcefield || "Not Available" },
            { label: "Temperature (K)", value: data?.temperature || "Not Available" },
            { label: "Pressure (bar)", value: data?.pressure || "Not Available" },
            { label: "Salt (mM)", value: data?.salt || "Not Available" }
         ].map(item => (
            <Flex key={item.label} align="center" justify="space-between">
               <Text fontFamily={'texts'} fontSize="md"  width="45%" textAlign="right">{item.label}</Text>
               <Divider orientation="vertical" height="20px" />
               <Text fontFamily={'texts'} fontSize="md"  width="45%" textAlign="left">{item.value}</Text>
            </Flex>
         ))}
      </Grid>
   </VStack>
</Box>

            </Box></Box>
                 
              </TabPanel>


          



          <TabPanel>
          
            
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