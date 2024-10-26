import React, { useState, useEffect, useRef, } from 'react';
import { CopyIcon, CheckIcon } from '@chakra-ui/icons';
import { useLocation, useNavigate } from 'react-router';
import {
 Link, keyframes, Show, Hide, Grid, Divider, Spacer, Wrap, WrapItem, Code, HStack, Tab, Tabs, TabList, TabPanels, TabPanel, Button, Text, Flex, Box, Image, VStack, SimpleGrid
} from "@chakra-ui/react";
import ContourPlot from './ContourPlot';
import Scatter3D from './Scatter3D';
import PieChart from './Pie';
import { css } from '@emotion/react';
import axios from 'axios';



const GlycanPage: React.FC = () => {

  const apiUrl = process.env.REACT_APP_API_URL;

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const [error, setError] = useState<string | null>(null);
  const [sequence, setsequence] = useState<string>(queryParams.get('IUPAC') || '');
  const [sequenceGlytoucan, setSequenceGlytoucan] = useState<string>(queryParams.get('glytoucan') || '');

  // Define the async function outside the useEffect with explicit type for the parameter
  async function fetchData(sequenceGlytoucan: string) {
    try {
      const response = await axios.get('https://glycoshape.io/api/fetch_glytoucan', {
        params: { id: sequenceGlytoucan }
      });
      if (response.data && response.data.iupac) {
        setsequence(response.data.iupac);
      }
    } catch (error) {
      console.error('Failed to fetch glytoucan data', error);
    }
  }

  useEffect(() => {
    if (sequenceGlytoucan) {
      fetchData(sequenceGlytoucan);
      
    }
  }, [sequenceGlytoucan]);  // Dependency on sequenceGlytoucan
  const backgroundPulseAnimation = keyframes`
  0% { background-color: transparent; }
  95% { background-color: #F7F9E5; } /* Example highlight color */
  100% { background-color: transparent; }
`;


  const [hasCopied, setHasCopied] = useState(false);

  const handleCopyClick = (text: string) => {
    const textarea = document.createElement("textarea");
    textarea.innerText = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    setHasCopied(true);

    // Reset after some time if you want
    setTimeout(() => setHasCopied(false), 800);
  };

  const [activeSection, setActiveSection] = useState<string | null>(null);

  const contentRef1 = useRef<HTMLDivElement>(null);
  const contentRef2 = useRef<HTMLDivElement>(null);
  const contentRef3 = useRef<HTMLDivElement>(null);
  const contentRef4 = useRef<HTMLDivElement>(null);
  const contentRef5 = useRef<HTMLDivElement>(null);
  const contentRef6 = useRef<HTMLDivElement>(null);
  const contentRef7 = useRef<HTMLDivElement>(null);
  const contentRef8 = useRef<HTMLDivElement>(null);
  const contentRef9 = useRef<HTMLDivElement>(null);


  type SectionRefs = {
    Biological_information: React.MutableRefObject<HTMLDivElement | null>;
    Chemical_information: React.MutableRefObject<HTMLDivElement | null>;
    Glycan_information: React.MutableRefObject<HTMLDivElement | null>;
    Nomenclature: React.MutableRefObject<HTMLDivElement | null>;
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
          if (entry.isIntersecting && entry.target.id) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.6 } // Adjust this value as needed
    );

    Object.keys(refs).forEach(key => {
      const ref = refs[key as keyof SectionRefs];
      if (ref && ref.current instanceof Element) {
        observer.observe(ref.current);
      }
    });

    return () => {
      Object.keys(refs).forEach(key => {
        const ref = refs[key as keyof SectionRefs];
        if (ref && ref.current instanceof Element) {
          observer.unobserve(ref.current);
        }
      });
    };
  }, [refs, setActiveSection]);


  const scrollToContent = (ref: React.MutableRefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      const offset = 80; // Adjust this value for the desired offset
      window.scrollTo({
        top: ref.current.getBoundingClientRect().top + window.pageYOffset - offset,
        behavior: 'smooth'
      });
    }
  };

  interface Cluster {
    data: Record<string, number | GLfloat>
  }

  interface GlycanData {
    glycam: string;
    iupac: string;
    wurcs: string;
    glycoct: string | null;
    smiles: string;
    oxford: string;
    components: string[];
    composition: string | null;
    mass: string;
    motifs: string[] | null;
    termini: string[] | null;
    tpsa: number;
    rot_bonds: number;
    hbond_donor: number;
    hbond_acceptor: number;
    glycan_type: string | null;
    glytoucan_id: string;
    disease: string | null;
    tissue: string | null;
    species: string[] | null;
    genus: string | null;
    family: string | null;
    order: string | null;
    class: string | null;
    phylum: string | null;
    kingdom: string | null;
    domain: string | null;
    clusters: Cluster;
    length: string;
    package: string;
    forcefield: string;
    temperature: string;
    pressure: string;
    salt: string;
    contributor: string;
  }

  const colors = ["#1B9C75", "#D55D02", "#746FB1", "#E12886", "#939242", "#E3A902", "#A4751D", "#646464", "#E11A1C", "#357AB3"];  // Your color array


  const [data, setData] = useState<GlycanData | null>(null);
  // Using conditional chaining to check if data and clusters exist
  const clusterLength = data?.clusters ? Object.keys(data.clusters).length : 0;

  const transformedClusters = data?.clusters || {};

  // const transformedClusters = Object.fromEntries(
  //   Object.entries(data?.clusters || {}).map(([key, value]) => [key, value])
  // );
  console.log("clusters data:", data?.clusters);
  console.log("transformed clusters:", transformedClusters);

  const generateIframeSrc = (sequence: string, clusterLength: number) => {
    const baseClusterURL = `${apiUrl}/database/${sequence}/PDB_format_HETATM/${sequence}_cluster`;

    // Generate an array of cluster URLs based on the clusterLength
    const clusterUrls = Array.from({ length: clusterLength }, (_, i) => `${baseClusterURL}${i}_alpha.PDB.pdb`);

    // Join the URLs into a single string with commas between them
    const clusterUrlString = clusterUrls.join(',');

    return `${clusterUrlString}&formats=${"pdb,".repeat(clusterLength).slice(0, -1)}`;
  };

  const generateDownloadUrls = (sequence: string, clusterLength: number) => {
    const baseClusterURL = `${apiUrl}/database/${sequence}/PDB_format_HETATM/${sequence}_cluster`;

    // Generate an array of cluster URLs based on the clusterLength
    return Array.from({ length: clusterLength }, (_, i) => `${baseClusterURL}${i}_alpha.PDB.pdb`);
  };

  const downloadUrls = generateDownloadUrls(sequence, clusterLength);
  const iframeSrc = generateIframeSrc(sequence, clusterLength);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${apiUrl}/database/${sequence}/${sequence}.json`);
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
    setTimeout(() => {
      scrollToContent(contentRef1)
    }, 300);  // 1000 milliseconds = 0.5 second
  }, [sequence]); 






  return (

    <Box >


      {sequence && (
        <Flex>

          <Box flex="1" >
            <Tabs align={"start"} padding={'1rem'} paddingTop={"1rem"} colorScheme='green'>
              <TabList display="flex" width={'100%'} position="sticky" top="0" bg="white" zIndex="10" marginRight={'2rem'} >
                <HStack >
                  <Image
                    src={`${apiUrl}/database/${sequence}/${sequence}.svg`}
                    alt="Glycan Image"
                    height="5rem"
                    maxWidth={'200px'}
                  // marginRight="1rem"
                  />
                  <Show above='lg'>
                    
                    {/* <Text fontSize={{ base: "0", sm: "1xl", md: "3xl", lg: "3xl", xl: "3xl" }} >
                      {sequence.length > 30 ? sequence.substring(0, 60) + '...' : sequence}
                    </Text> */}
                    {
  data?.glytoucan_id ?
  <Text fontSize={{ base: "0", sm: "1xl", md: "3xl", lg: "3xl", xl: "3xl" }}>{data.glytoucan_id}</Text> :
  <Text fontSize={{ base: "0", sm: "1xl", md: "3xl", lg: "3xl", xl: "3xl" }}>
    {sequence.length > 30 ? sequence.substring(0, 60) + '...' : sequence}
  </Text>
}

                  </Show>
                </HStack>
                <Spacer />
                <Tab>Information</Tab>
                <Tab css={css`
              animation: ${backgroundPulseAnimation} 1s ease-in-out 5;
            `}>
                  Structure
                </Tab>
                <Button
                  marginLeft={'1rem'}
                  transform="translateY(50%)"
                  borderRadius="full"
                  backgroundColor="#7CC9A9"
                  _hover={{
                    backgroundColor: "#51BF9D"
                  }}
                  size={{ base: "md", sm: "md", md: "md", lg: "md", xl: "md" }}
                  // onClick={() => navigate(`/database/${sequence}/${sequence}.zip`)}
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = `/database/${sequence}/${sequence}.zip`;
                    link.setAttribute('download', `${sequence}.zip`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >Download</Button>
              </TabList>
              <TabPanels>
                <TabPanel >
                  <Box display="flex" >
                    {/* Sidebar */}
                    <Show above='lg'>
                      <Box position={'sticky'} top="0" zIndex={5}
                        width={{ base: "0", sm: "0", md: "0", lg: "15%", xl: "15%" }} height={'50vh'} paddingTop={'5rem'} paddingLeft={'0rem'}>
                        <VStack align="right" spacing={1} justify="start"> {/* Added justify="start" */}
                          <Button
                            onClick={() => scrollToContent(contentRef1)}
                            bg={activeSection === 'Nomenclature' ? '#466263' : 'gray.300'}
                            fontSize={activeSection === 'Nomenclature' ? 'larger' : 'medium'} // Adjust font sizes as desired
                            color={activeSection === 'Nomenclature' ? 'white' : '#1A202C'}
                            fontStyle={'medium'}
                            _hover={{
                              bg: '#E2CE69', // replace with the color you want on hover
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
                              bg: '#E2CE69', // replace with the color you want on hover
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
                              bg: '#E2CE69', // replace with the color you want on hover
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
                              bg: '#E2CE69', // replace with the color you want on hover
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
                              bg: '#E2CE69', // replace with the color you want on hover
                            }}
                            // fontFamily={'thin'}
                            borderRadius="0" // Sharp rectangular edges
                          >
                            Simulation information
                          </Button>
                        </VStack>

                      </Box>
                    </Show>
                    {/* Main Content */}
                    <Box flex="1" p={{ base: "-2rem", sm: "0rem", md: "2rem", lg: "2rem", xl: "2rem" }} >

                      <Box ref={contentRef1} flex='1' id="Nomenclature" pb={'4rem'}
                        boxShadow="md"
                        marginBottom="1em"
                        backgroundColor="white"
                        borderRadius="md">
                        <VStack align={'left'} padding={'1rem'}>
                          <Text fontSize="2xl" color={"#2D5E6B"} mb={2}>Nomenclature</Text>
                          <Divider />

                          <Wrap >


                            {/* <WrapItem alignContent={'left'}> */}
                            <Text fontFamily={'texts'}>SNFG</Text>
                            <SimpleGrid alignSelf="center" justifyItems="center" alignItems={"center "} columns={[1, 2]} spacing={0} paddingTop={'1rem'} paddingBottom={'2rem'}>

                              <Image
                                src={`${apiUrl}/database/${sequence}/${sequence}.svg`}
                                alt="Glycan Image"
                                // height={{base: "10rem",sm: "10rem", md: "20rem", lg: "25rem",xl: "25rem"}}
                                width={{ base: '100%', lg: '30vw' }}
                              // marginRight="1rem"
                              />

                              <Hide below='lg'>
                                <iframe
                                  style={{ width: '35vw', height: '50vh' }}
                                  src={`/viewer/embedded.html?pdbUrl=${apiUrl}/database/${sequence}//PDB_format_HETATM/${sequence}_cluster0_alpha.PDB.pdb&format=pdb`}
                                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  title="Protein Structure"
                                /> </Hide>
                              <Show below='lg'>
                                <iframe
                                  style={{ width: '100%', height: '50vh' }}
                                  src={`/viewer/embedded.html?pdbUrl=${apiUrl}/database/${sequence}/PDB_format_HETATM/${sequence}_cluster0_alpha.PDB.pdb&format=pdb`}
                                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  title="Protein Structure"
                                />
                              </Show>
                            </SimpleGrid>
                            {/* </WrapItem> */}
                            <VStack align={'left'} padding={'1rem'}>
                              <Box alignItems={'center'} alignContent={'center'} justifyContent={'center'} justifyItems={'center'}>
                                <WrapItem alignContent={'center'}>
                                  <Text fontFamily={'texts'} transform="translateY(50%)" fontSize="md" >
                                    IUPAC  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:   </Text>
                                  <Box padding={'0.5rem'}>
                                    <Code
                                      p={2}
                                      display="block"
                                      whiteSpace="pre"
                                      // width={{base: "10rem",sm: "10rem", md: "20rem", lg: "60rem",xl: "60rem"}}
                                      width={'60vw'}
                                      overflowX="auto"
                                      fontFamily={'mono'}
                                    >
                                      {data?.iupac}
                                    </Code></Box>
                                  <Button marginRight={'0rem'} transform="translateY(30%)" alignContent={"center"} type="submit"
                                    borderRadius="full"
                                    size={"sm"}
                                    backgroundColor="#7CC9A9"
                                    _hover={{
                                      backgroundColor: "#51BF9D"
                                    }} onClick={() => handleCopyClick(data?.iupac || '')}>

                                    {hasCopied ? <CheckIcon /> : <CopyIcon />}

                                  </Button>
                                </WrapItem>
                                <WrapItem alignContent={'center'}>
                                  <Text fontFamily={'texts'} transform="translateY(50%)" fontSize="md" >
                                    GLYCAM :   </Text>
                                  <Box padding={'0.5rem'} >
                                    <Code
                                      p={2}
                                      display="block"
                                      whiteSpace="pre"
                                      // width={{base: "10rem",sm: "10rem", md: "20rem", lg: "60rem",xl: "60rem"}}
                                      width={'60vw'}
                                      overflowX="auto"
                                      fontFamily={'mono'}
                                    >
                                      {data?.glycam}
                                    </Code></Box>
                                  <Button marginRight={'0rem'} transform="translateY(30%)" alignContent={"center"} type="submit"
                                    borderRadius="full"
                                    size={"sm"}
                                    backgroundColor="#7CC9A9"
                                    _hover={{
                                      backgroundColor: "#51BF9D"
                                    }}
                                    onClick={() => handleCopyClick(data?.glycam || '')}>
                                    {hasCopied ? <CheckIcon /> : <CopyIcon />}

                                  </Button>

                                </WrapItem>
                                <WrapItem alignContent={'center'}>
                                  <Text fontFamily={'texts'} transform="translateY(50%)" fontSize="md" >
                                    GlyTouCan ID:   </Text>
                                  <Box padding={'0.5rem'}>
                                    <Code
                                      p={2}
                                      display="block"
                                      whiteSpace="pre"
                                      // width={{base: "10rem",sm: "10rem", md: "20rem", lg: "58rem",xl: "58rem"}}
                                      width={'58vw'}
                                      overflowX="auto"
                                      fontFamily={'mono'}
                                    >
                                      {data?.glytoucan_id} <Spacer />
                                    </Code></Box>
                                  <Button marginRight={'0rem'} transform="translateY(30%)" alignContent={"center"} type="submit"
                                    borderRadius="full"
                                    size={"sm"}
                                    backgroundColor="#7CC9A9"
                                    _hover={{
                                      backgroundColor: "#51BF9D"
                                    }} onClick={() => handleCopyClick(data?.glytoucan_id || '')}>

                                    {hasCopied ? <CheckIcon /> : <CopyIcon />}

                                  </Button>
                                </WrapItem>

                                <WrapItem alignContent={'center'}>
                                  <Text fontFamily={'texts'} transform="translateY(50%)" fontSize="md" >
                                    WURCS  &nbsp;&nbsp;:   </Text>
                                  <Box padding={'0.5rem'}>
                                    <Code
                                      p={2}
                                      display="block"
                                      whiteSpace="pre"
                                      // width={{base: "10rem",sm: "10rem", md: "20rem", lg: "60rem",xl: "60rem"}}
                                      width={'60vw'}
                                      overflowX="auto"
                                      fontFamily={'mono'}
                                    >
                                      {data?.wurcs}
                                    </Code></Box>
                                  <Button marginRight={'0rem'} transform="translateY(30%)" alignContent={"center"} type="submit"
                                    borderRadius="full"
                                    size={"sm"}
                                    backgroundColor="#7CC9A9"
                                    _hover={{
                                      backgroundColor: "#51BF9D"
                                    }} onClick={() => handleCopyClick(data?.wurcs || '')}>

                                    {hasCopied ? <CheckIcon /> : <CopyIcon />}

                                  </Button>
                                </WrapItem>
                                <WrapItem alignContent={'center'}>
                                  <Text fontFamily={'texts'} transform="translateY(50%)" fontSize="md" >
                                    SMILES  &nbsp;&nbsp;:   </Text>
                                  <Box padding={'0.5rem'}>
                                    <Code
                                      p={2}
                                      display="block"
                                      whiteSpace="pre"
                                      // width={{base: "10rem",sm: "10rem", md: "20rem", lg: "60rem",xl: "60rem"}}
                                      width={'60vw'}
                                      overflowX="auto"
                                      fontFamily={'mono'}
                                    >
                                      {data?.smiles}
                                    </Code></Box>
                                  <Button marginRight={'0rem'} transform="translateY(30%)" alignContent={"center"} type="submit"
                                    borderRadius="full"
                                    size={"sm"}
                                    backgroundColor="#7CC9A9"
                                    _hover={{
                                      backgroundColor: "#51BF9D"
                                    }} onClick={() => handleCopyClick(data?.smiles || '')}>

                                    {hasCopied ? <CheckIcon /> : <CopyIcon />}

                                  </Button>
                                </WrapItem>

                                {data?.oxford && (
  <WrapItem alignContent={'center'}>
    <Text fontFamily={'texts'} transform="translateY(50%)" fontSize="md">
      Oxford &nbsp;&nbsp;&nbsp;&nbsp;:
    </Text>
    <Box padding={'0.5rem'}>
      <Code
        p={2}
        display="block"
        whiteSpace="pre"
        width={'60vw'}
        overflowX="auto"
        fontFamily={'mono'}
      >
        {data.oxford}
      </Code>
    </Box>
    <Button
      marginRight={'0rem'}
      transform="translateY(30%)"
      alignContent={"center"}
      type="submit"
      borderRadius="full"
      size={"sm"}
      backgroundColor="#7CC9A9"
      _hover={{
        backgroundColor: "#51BF9D"
      }}
      onClick={() => handleCopyClick(data?.oxford || '')}
    >
      {hasCopied ? <CheckIcon /> : <CopyIcon />}
    </Button>
  </WrapItem>
)} 

{/* 
<WrapItem alignContent={'center'}>
                                  <Text fontFamily={'texts'} transform="translateY(50%)" fontSize="md" >
                                    Oxford :   </Text>
                                  <Box padding={'0.5rem'} >
                                    <Code
                                      p={2}
                                      display="block"
                                      whiteSpace="pre"
                                      // width={{base: "10rem",sm: "10rem", md: "20rem", lg: "60rem",xl: "60rem"}}
                                      width={'60vw'}
                                      overflowX="auto"
                                      fontFamily={'mono'}
                                    >
                                      {data?.oxford}
                                    </Code></Box>
                                  <Button marginRight={'0rem'} transform="translateY(30%)" alignContent={"center"} type="submit"
                                    borderRadius="full"
                                    size={"sm"}
                                    backgroundColor="#7CC9A9"
                                    _hover={{
                                      backgroundColor: "#51BF9D"
                                    }}
                                    onClick={() => handleCopyClick(data?.oxford || '')}>
                                    {hasCopied ? <CheckIcon /> : <CopyIcon />}

                                  </Button>

                                </WrapItem> */}
                              </Box>
                            </VStack>
                          </Wrap>

                        </VStack>

                      </Box>
                      <Box ref={contentRef2} id="Glycan_information" mb={2} boxShadow="md" marginBottom="1em" backgroundColor="white" borderRadius="md">
                        <VStack align={'left'} padding={'1rem'}>
                          <Text fontSize="2xl" color={"#2D5E6B"} mb={2}>Glycan information</Text>
                          <Divider />
                          <Grid templateColumns="repeat(2, 5fr)" gap={3} padding={'1rem'} >
                            {[
                              { label: "Glycan Type", value: data?.glycan_type || "Not Available" },
                              { label: "Components", value: JSON.stringify(data?.components) },
                              { label: "Composition", value: JSON.stringify(data?.composition) || "Not Available" },
                              { label: "Motifs", value: data?.motifs ? data.motifs.join(', ')  : "Not Available" },
                              { label: "Termini", value:  data?.termini ? data.termini.join(', ') : "Not Available"  }
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
                          <Grid templateColumns="repeat(2, 1fr)" gap={{ base: "0", sm: "0", md: "4", lg: "6", xl: "6" }} padding={'1rem'}>
                            {[
                              { label: "Mass", value: data?.mass || "Not Available" },
                              // { label: "Topological Polar Surface Area", value: data?.tpsa || "Not Available" },
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
                        <VStack align={'left'} padding={{ base: "0rem", sm: "0rem", md: "1rem", lg: "1rem", xl: "1rem" }}>
                          <Text fontSize="2xl" color={"#2D5E6B"} mb={2}>Biological Information</Text>
                          <Divider />
                          <Grid templateColumns="repeat(2, 1fr)" gap={{ base: "0", sm: "0", md: "4", lg: "6", xl: "6" }} padding={'1rem'}>
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
                              <Flex key={item.label} maxWidth={'30rem'} align="center" justify="space-between">
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
                          <Text fontSize="2xl" color={"#2D5E6B"} mb={2}>Simulation Information</Text>
                          <Divider />
                          <Grid templateColumns="repeat(2, 1fr)" gap={{ base: "0", sm: "0", md: "4", lg: "6", xl: "6" }} padding={'1rem'}>
                            {[
                              { label: "Simulation Length (μs)", value: data?.length || "Not Available" },
                              { label: "MD Engine", value: data?.package || "Not Available" },
                              { label: "Force Field", value: data?.forcefield || "Not Available" },
                              { label: "Temperature (K)", value: data?.temperature || "Not Available" },
                              { label: "Pressure (bar)", value: data?.pressure || "Not Available" },
                              { label: "Salt (mM)", value: data?.salt || "Not Available" }
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

                    </Box></Box>
                    <Text color='#B195A2' alignSelf={"right"} fontSize={'xs'}>
             If you encounter any issues on this page or suspect a bug contact us <Link href="mailto:callum.ives@mu.ie">here</Link> 
            </Text>
                </TabPanel>







                <TabPanel>





                  <Box display="flex" >

                    {/* Main Content */}
                    <Box flex="1" p={{ base: "-2rem", sm: "0rem", md: "2rem", lg: "2rem", xl: "2rem" }} marginTop={'-2.5rem'} >

                      <Box ref={contentRef6} id="clusters" p={'1rem'} pb={'2rem'} paddingTop={'1rem'}
                        boxShadow="md"
                        marginBottom="1em"
                        backgroundColor="white"
                        borderRadius="md">
                        <Text fontSize="2xl" color={"#2D5E6B"} mb={2}>This glycan has {clusterLength} major conformations clusters</Text>
                        <Divider />
                        <VStack>


                          <Hide below='lg'>
                            <iframe
                              style={{ width: '100%', height: '60vh' }}
                              src={"/viewer/embedded_multi.html?pdbUrls=" + iframeSrc}
                              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title="Protein Structure"
                            /> </Hide>
                          <Show below='lg'>
                            <iframe
                              style={{ width: '100%', height: '60vh' }}
                              src={"/viewer/embedded_multi_closed.html?pdbUrls=" + iframeSrc}
                              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title="Protein Structure"
                            />
                          </Show>
                          <Text color='#B195A2' alignSelf={"left"} fontSize={'xs'}>
             All major cluster conformations are displayed above. Aligned with residue 1 to 3 in the glycan sequence.
            </Text>
                          <Box paddingTop={"2rem"} >
                            <SimpleGrid alignSelf="center" justifyItems="center" columns={[1, 2]} spacing={0} paddingTop={'0rem'} paddingBottom={'2rem'}>

                              <VStack >
                                <HStack paddingTop={"5rem"}>
                                  <Text size={'md'}>Download Clusters : </Text>
                                  {downloadUrls.map((url, index) => (
                                    <Button colorScheme='purple' variant='link' key={index} style={{ color: colors[index % colors.length] }}>
                                      <a href={url} download>
                                        Cluster {index}&nbsp;&nbsp;&nbsp;
                                      </a></Button>

                                  ))}</HStack>


                                {data?.clusters ? <PieChart data={transformedClusters} /> : <div>No cluster data available</div>}

                              </VStack>

                              <Image src={`${apiUrl}/database/${sequence}/output/dist.svg`} alt="No distribution plot available for this glycan!" width={{ base: '100%', lg: '40vw' }} />
                              {/* <Image src='/torsions2.svg' width='40vw' /> */}
                              {/* </HStack>  */}
                            </SimpleGrid>
                          </Box>

                        </VStack>
                        <Text color='#B195A2' alignSelf={"left"} fontSize={'xs'}  paddingLeft={"1rem"}>
                            Probabilty of each cluster conformation is displayed above in the pie chart. Along with each cluster center torsion angle lies the distribution in densities plot.
                          </Text>
                      </Box>







                      {/* <Box ref={contentRef7} id="Torsion_distribution" mb={2} boxShadow="md" marginBottom="1em" backgroundColor="white" borderRadius="md">
   <VStack align={'left'} padding={'1rem'}>
      
   </VStack>
</Box> */}


                      <Box ref={contentRef8} id="Ramachandran_plot" mb={2} boxShadow="md" marginBottom="1em" backgroundColor="white" borderRadius="md">
                        <VStack align={'left'} padding={'1rem'}>
                          <HStack>
                            <Text fontSize="2xl" color={"#2D5E6B"} mb={2}>Torsion plots</Text> <Spacer />
                            <Button
                              marginLeft={'1rem'}
                              transform="translateY(0%)"
                              borderRadius="full"
                              backgroundColor="#7CC9A9"
                              _hover={{
                                backgroundColor: "#51BF9D"
                              }}
                              size={{ base: "md", sm: "md", md: "md", lg: "md", xl: "md" }}
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = `/database/${sequence}/output/torsions.csv`;
                                link.setAttribute('download', 'torsions.csv');
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                            >Download torsion DATA</Button></HStack>
                          <Divider />
                          <ContourPlot dataUrl={`${apiUrl}/database/${sequence}/output/torsions.csv`} seq={`${sequence}`} />
                        </VStack>
                        <Text color='#B195A2' alignSelf={"left"} fontSize={'xs'} paddingBottom={"0.5rem"} paddingLeft={"1rem"}>
                          Dihedral torsion plot of the selected residues in the glycan sequence.
              </Text>
                      </Box>



                      <Box ref={contentRef9} id="PCA_details" mb={2} boxShadow="md" marginBottom="1em" backgroundColor="white" borderRadius="md">
                        <VStack align={'left'} padding={'1rem'}>
                          <Text fontSize="2xl" color={"#2D5E6B"} mb={2}>Conformation space representation (PCA details)</Text>
                          
                          <Divider />
                          <SimpleGrid alignSelf="left" justifyItems="center" columns={[1, 2]} spacing={0} paddingTop={'1rem'} paddingBottom={'2rem'}>

                            <Scatter3D dataUrl={`${apiUrl}/database/${sequence}/output/pca.csv`} />

                            <VStack>
                              <Image width={{ base: '100%', lg: '25vw' }} src={`${apiUrl}/database/${sequence}/output/PCA_variance.png`} />
                              <Image width={{ base: '100%', lg: '25vw' }} src={`${apiUrl}/database/${sequence}/output/Silhouette_Score.png`} /></VStack>
                          </SimpleGrid>
                        </VStack>
                        <Text color='#B195A2'  fontSize={'xs'} paddingBottom={"0.5rem"} paddingLeft={"1rem"}>
                          Principal Component Analysis (PCA) of all conformation explored in Molecular Dynamics Simulation and Silhouette Score plots for no. of cluster selection.
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
