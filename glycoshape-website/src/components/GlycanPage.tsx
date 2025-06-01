import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CopyIcon, CheckIcon } from '@chakra-ui/icons';
import { useLocation, useNavigate } from 'react-router';
import { keyframes } from "@emotion/react";
import throttle from 'lodash/throttle';
import {
  useTabs, AspectRatio, Link, Show, Hide, Grid, Divider, Spacer, Wrap, WrapItem, Code, HStack, Tab, Tabs, TabList, TabPanels, TabPanel, Button, Text, Flex, Box, Image, VStack, SimpleGrid,
  space, CircularProgress, Alert, AlertIcon, AlertTitle, AlertDescription
} from "@chakra-ui/react";
import ContourPlot from './ContourPlot';
import Scatter3D from './Scatter3D';
import PieChart from './Pie';
import { css } from '@emotion/react';
import axios from 'axios';
import MolstarViewer from "./MolstarViewer"
import Biological from './Biological';

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [hasCopied, setHasCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
      .then(() => setHasCopied(true))
      .catch(err => console.error('Failed to copy:', err));
    
    setTimeout(() => setHasCopied(false), 800);
  };
  
  return (
    <Button
      flexShrink={0}
      type="submit"
      borderRadius="full"
      size="sm"
      backgroundColor="#7CC9A9"
      _hover={{
        backgroundColor: "#51BF9D"
      }}
      onClick={handleCopy}
    >
      {hasCopied ? <CheckIcon /> : <CopyIcon />}
    </Button>
  );
};

const LightCopyButton: React.FC<{ text: string; variant?: string }> = ({ text, variant = "ghost" }) => {
  const [hasCopied, setHasCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
      .then(() => setHasCopied(true))
      .catch(err => console.error('Failed to copy:', err));
    
    setTimeout(() => setHasCopied(false), 800);
  };
  
  return (
    <Button
      flexShrink={0}
      type="submit"
      borderRadius="full"
      size="sm"
      variant={variant}
      ml={2}
      onClick={handleCopy}
    >
      {hasCopied ? <CheckIcon /> : <CopyIcon />}
    </Button>
  );
};


const GlycanPage: React.FC = () => {

  const apiUrl = process.env.REACT_APP_API_URL;
  const glytoucanBaseUrl = 'https://glycosmos.org/glycans/'; // Base URL
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const [error, setError] = useState<string | null>(null);
  const [sequence, setsequence] = useState<string>(queryParams.get('IUPAC') || '');
  const [sequenceGlytoucan, setSequenceGlytoucan] = useState<string>(queryParams.get('glytoucan') || '');
  const [sequenceId, setSequenceId] = useState<string>(queryParams.get('id') || '');
  const [isLoading, setIsLoading] = useState(true);

  // Define the async function to fetch data by glytoucan ID
  async function fetchDataByGlytoucan(sequenceGlytoucan: string) {
    setIsLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/api/glycan/${sequenceGlytoucan}`);
      if (response) {
        setData(response.data);
        setsequence(response.data.archetype.glytoucan);
        setTimeout(() => {
          scrollToContent(contentRef1)
        }, 300);
      }
    } catch (error) {
      console.error('Failed to fetch glytoucan data', error);
      setError('Failed to fetch data for this glytoucan ID');
    } finally {
      setIsLoading(false);
    }
  }

  // Define the async function to fetch data by database ID
  async function fetchDataById(id: string) {
    setIsLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/api/glycan/${id}`);
      if (response) {
        setData(response.data);
        setsequence(response.data.archetype.ID);
        setTimeout(() => {
          scrollToContent(contentRef1)
        }, 300);
      }
    } catch (error) {
      console.error('Failed to fetch ID data', error);
      setError('Failed to fetch data for this database ID');
    } finally {
      setIsLoading(false);
    }
  }

  // Define the async function to fetch data by IUPAC
  async function fetchDataByIUPAC(iupac: string) {
    setIsLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/api/glycan/${iupac}`);
      if (response) {
        setData(response.data);
        setsequence(response.data.archetype.iupac);
        setTimeout(() => {
          scrollToContent(contentRef1)
        }, 300);
      }
    } catch (error) {
      console.error('Failed to fetch IUPAC data', error);
      setError('Failed to fetch data for this IUPAC notation');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // First priority: ID parameter
    if (sequenceId) {
      fetchDataById(sequenceId);
    }
    // Second priority: Glytoucan parameter
    else if (sequenceGlytoucan) {
      fetchDataByGlytoucan(sequenceGlytoucan);
    }
    // Third priority: IUPAC parameter
    else if (sequence) {
      fetchDataByIUPAC(sequence);
    }
  }, [sequenceId, sequenceGlytoucan, sequence]);  // Dependencies for all three parameters

  const backgroundPulseAnimation = keyframes`
  0% { background-color: transparent; }
  95% { background-color: #F7F9E5; } 
  100% { background-color: transparent; }
`;

  const [hasCopied, setHasCopied] = useState(false);

  const handleCopyClick = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => setHasCopied(true))
      .catch(err => console.error('Failed to copy:', err));

    setTimeout(() => setHasCopied(false), 800);
  }, []);

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
      { threshold: 0.6 }
    );

    return () => {
      Object.keys(refs).forEach(key => {
        const ref = refs[key as keyof SectionRefs];
        if (ref && ref.current instanceof Element) {
          observer.unobserve(ref.current);
        }
      });
    };
  }, [refs, setActiveSection]);

  const scrollToContent = useCallback((ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      const offset = 80;
      const elementPosition = ref.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  interface ClusterData {
    [key: string]: number;
  }

  interface Motif {
    motif: string; // The unique motif ID
    motif_label: string; // The descriptive label for the motif
  }


  interface Components {
    Fuc: number;
    Gal: number;
    GlcNAc: number;
    Man: number;
    Glc: number;
    GalNAc: number;
    Neu5Ac: number;
    Neu5Gc: number;
    KDN: number;
    Xyl: number;
    Rha: number;
    GalA: number;
    GlcA: number;
    IdoA: number;
    Api: number;
    Fru: number;
    Tag: number;
    Sor: number;
    Psi: number;
    Bac: number;
    LDManHep: number;
    Kdo: number;
    Dha: number;
    DDManHep: number;
    MurNAc: number;
    Oli: number;
    Tyv: number;
    Abe: number;
    Par: number;
    Dig: number;
    Col: number;
    
  }

  interface Composition {
    Hex?: number;
    HexNAc?: number;
    dHex?: number; // Deoxyhexose, often Fucose
    NeuAc?: number; // Generic Sialic Acid (could be Neu5Ac, Neu5Gc)
    Neu5Ac?: number;
    Neu5Gc?: number;
    Pen?: number; // Pentose, often Xylose or Arabinose
    GlcA?: number;
    GalA?: number;
    Man?: number;
    Gal?: number;
    Glc?: number;
    Xyl?: number;
    Fuc?: number;

    [key: string]: number | undefined; // Allows for other keys not explicitly defined
  }

  interface ComponentsSearch {
    Fuc: number;
    Gal: number;
    GlcNAc: number;
    Man: number;
  }

  interface Archetype {
    ID: string;
    clusters: ClusterData;
    components: Components;
    components_search: ComponentsSearch;
    composition: Composition; 
    composition_search: Composition;
    forcefield: string;
    glycam: string;
    glycoct: string;
    glytoucan: string;
    hbond_acceptor: number;
    hbond_donor: number;
    iupac: string;
    iupac_extended: string;
    length: string;
    mass: number;
    motifs: Motif[];
    name: string;
    oxford: string | null;
    package: string;
    pressure: string;
    rot_bonds: number;
    salt: string;
    smiles: string;
    temperature: string;
    termini: string[];
    wurcs: string;
  }

  interface GlycanData {
    alpha: Archetype;
    beta: Archetype;
    archetype: Archetype;
  }

  const colors = ["#1B9C75", "#D55D02", "#746FB1", "#E12886", "#939242", "#E3A902", "#A4751D", "#646464", "#E11A1C", "#357AB3"];  // Your color array


  const [data, setData] = useState<GlycanData | null>(null);
  const clusterLength = data?.archetype.clusters ? Object.keys(data.archetype.clusters).length : 0;

  const transformedClusters = Object.fromEntries(
    Object.entries(data?.archetype.clusters || {}).map(([key, value]) => [key, value])
  );



  const generateDownloadUrls = (): string[] => {
    const baseClusterURL = `${apiUrl}/database/${data?.archetype.ID}/PDB_format_HETATM/cluster`;
    return Array.from({ length: clusterLength }, (_, i) =>
      `${baseClusterURL}${i}_alpha.PDB.pdb`
    );
  };

 
  const generateIframeSrc = (clusterLength: number) => {
    const baseClusterURL = `${apiUrl}/database/${data?.archetype.ID}/PDB_format_HETATM/cluster`;

    // Generate an array of cluster URLs based on the clusterLength
    const clusterUrls = Array.from({ length: clusterLength }, (_, i) => `${baseClusterURL}${i}_alpha.PDB.pdb`);

    // Join the URLs into a single string with commas between them
    const clusterUrlString = clusterUrls.join(',');

    return `${clusterUrlString}&formats=${"pdb,".repeat(clusterLength).slice(0, -1)}`;
  };

  const iframeSrc = generateIframeSrc(clusterLength);
  return (

    <Box >

      {isLoading ? (
        <Flex 
          height="50vh" 
          width="100%" 
          justify="center" 
          align="center" 
          direction="column"
          gap={4}
        >
          <CircularProgress isIndeterminate color="teal" />
          <Text>Loading glycan data...</Text>
        </Flex>
      ) : sequence && data ? (
        <Flex >

          <Box flex='1' width={{ base: "100%", sm: "100%", md: "100%", lg: "100%", xl: "80%" }} margin={'auto'}>
            <Tabs align={"start"} padding={'1rem'} paddingTop={"1rem"} colorScheme='green' >
              <TabList width={'100%'} position="sticky" top="0" bg="white" zIndex={1} marginRight={'2rem'} >
                <HStack >
                  <Image
                    src={`${apiUrl}/api/svg/${sequence}`}
                    alt="Glycan Image"
                    height="5rem"
                    maxWidth={'200px'}
                  />
                  <Show above='lg'>
                    <HStack>
                      {
                      data?.archetype.glytoucan ?
                        <Text fontSize={{ base: "0", sm: "1xl", md: "3xl", lg: "3xl", xl: "3xl" }}>{data.archetype.glytoucan}</Text> :
                        <Text fontSize={{ base: "0", sm: "1xl", md: "3xl", lg: "3xl", xl: "3xl" }}>
                        {sequence}
                        </Text>
                      }
                      <LightCopyButton text={data?.archetype.glytoucan || sequence} />
                    </HStack>
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
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = `${apiUrl}/database/${data?.archetype.ID}/${data?.archetype.ID}.zip`;
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
                      <Box position={'sticky'} top="2"
                        width={{ base: "0", sm: "0", md: "0", lg: "15%", xl: "15%" }} height={'50vh'} paddingTop={'5rem'} paddingLeft={'0rem'}>
                        <VStack align="right" spacing={1} justify="start"> {/* Added justify="start" */}
                          <Button
                            onClick={() => scrollToContent(contentRef1)}
                            bg={activeSection === 'Nomenclature' ? '#466263' : 'gray.300'}
                            fontSize={activeSection === 'Nomenclature' ? 'medium' : 'medium'} // Adjust font sizes as desired
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
                            fontSize={activeSection === 'Glycan_information' ? 'medium' : 'medium'} // Adjust font sizes as desired
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
                            fontSize={activeSection === 'Chemical_information' ? 'medium' : 'medium'} // Adjust font sizes as desired
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
                            fontSize={activeSection === 'Biological_information' ? 'medium' : 'medium'} // Adjust font sizes as desired
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
                            fontSize={activeSection === 'Simulation_information' ? 'medium' : 'medium'} // Adjust font sizes as desired
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



                          <Text paddingLeft={4} fontFamily={'texts'}>SNFG</Text>
                          <SimpleGrid
                            minHeight={'40vh'}
                            width={'100%'}
                            justifyItems={'center'}
                            columns={{ base: 1, sm: 1, md: 1, lg: 2, xl: 2 }}
                            margin="auto"
                            marginTop={'0'}
                            position={'relative'}
                            padding={'2rem'}
                            paddingTop={'0rem'}
                            spacing={4}
                          >
                            <Box
                              display="flex"
                              justifyContent="center"
                              alignItems="center"
                              width="100%"
                              minHeight="40vh"
                              maxHeight={'40vh'}
                            >

                              <Image
                                src={`${apiUrl}/api/svg/${sequence}`}
                                alt="Glycan Image"
                                objectFit="contain"
                                width="100%"
                                height="100%"
                              />
                            </Box>

                            <Box
                              w="100%"
                              minH="40vh"
                              position="relative"
                            >
                              

                              <iframe
                        key={sequence}
                        width="100%"
                        height="400px"

                        src={
                          `/viewer/embedded.html?pdbUrl=${apiUrl}/api/pdb/${sequence}&format=pdb`
                        }
                        allowFullScreen
                        title="Protein Structure"
                      />

                            </Box>
                          </SimpleGrid>
                            <Box paddingLeft={4} marginTop={-5} fontFamily="mono" position={'relative'}>
                            <Flex direction="column" align="start">
                              {/* Archetype Section */}
                              <Flex align="center">
                              <Text width="130px" fontFamily="texts" fontSize="md">
                                GlyTouCan:
                              </Text>
                              <Link
                                href={`${glytoucanBaseUrl}${data?.archetype?.glytoucan || ''}`}
                                isExternal
                                // textDecoration="underline"
                                // fontWeight="bold"
                                ml={2}
                              >
                                {data?.archetype?.glytoucan || 'N/A'}
                              </Link>
                              <LightCopyButton text={data?.archetype?.glytoucan || ''} />
                              </Flex>
                              <Text fontSize="sm" color="gray.500" ml="135px">
                              (Archetype)
                              </Text>

                              {/* Alpha and Beta Section */}
                              <Box ml="180px" position="relative" mt={2}>
                              {/* Vertical line connecting alpha and beta */}
                              <Box
                                position="absolute"
                                top="0px"
                                left="-20px"
                                height="45px"
                                borderLeft="2px solid grey"
                              />
                              {/* Horizontal line for Alpha */}
                              <Flex align="center" mb={2}>
                                <Box
                                position="absolute"
                                left="-20px"
                                top="12px"
                                width="20px"
                                borderTop="2px solid grey"
                                />
                                <Text color='grey' paddingLeft={'1'}>α →</Text>
                                <Link
                                href={`${glytoucanBaseUrl}${data?.alpha?.glytoucan || ''}`}
                                isExternal
                                // textDecoration="underline"
                                // fontWeight="bold"
                                ml={2}
                                >
                                {data?.alpha?.glytoucan || 'N/A'}
                                </Link>
                                <LightCopyButton text={data?.alpha?.glytoucan || ''} />
                              </Flex>
                              {/* Horizontal line for Beta */}
                              <Flex align="center">
                                <Box
                                position="absolute"
                                left="-20px"
                                top="45px"
                                width="20px"
                                borderTop="2px solid grey"
                                />
                                <Text color='grey' paddingLeft={'1'}>β →</Text>
                                <Link
                                href={`${glytoucanBaseUrl}${data?.beta?.glytoucan || ''}`}
                                isExternal
                                // textDecoration="underline"
                                // fontWeight="bold"
                                ml={2}
                                >
                                {data?.beta?.glytoucan || 'N/A'}
                                {/* &nbsp; {data?.beta?.name?.charAt(data.beta.name.length - 5)  === 'b' ? 'exist' : ''} */}
                                </Link>
                                <LightCopyButton text={data?.beta?.glytoucan || ''} />
                              </Flex>
                              </Box>
                            </Flex>
                            </Box>
                          <VStack align="stretch" width="100%" spacing={4} padding={4}>
                            {[
                              { label: "IUPAC", value: data?.archetype.iupac },
                              { label: "IUPACX", value: data?.archetype.iupac_extended },
                              { label: "GLYCAM", value: data?.archetype.glycam },
                              { label: "WURCS", value: data?.archetype.wurcs },
                              { label: "SMILES", value: data?.archetype.smiles },
                              ...(data?.archetype.oxford ? [{ label: "Oxford", value: data?.archetype.oxford }] : [])
                            ].map((item, index) => (
                              <Flex key={index} width="100%" align="flex-start" gap={4}>
                                <Text
                                  fontFamily="texts"
                                  fontSize="md"
                                  width="120px"
                                  flexShrink={0}
                                  paddingTop={2}
                                >
                                  {item.label}:
                                </Text>
                                <Box flex={1} position="relative">
                                  <Code
                                    p={2}
                                    display="block"
                                    width="100%"
                                    overflowX="auto"
                                    fontFamily="mono"
                                    wordBreak="break-word"
                                    whiteSpace="pre-wrap"
                                    maxHeight="33px"
                                    // overflowY=""
                                    css={{
                                      '&::-webkit-scrollbar': {
                                        width: '8px',
                                        height: '8px',
                                      },
                                      '&::-webkit-scrollbar-thumb': {
                                        backgroundColor: '#CBD5E0',
                                        borderRadius: '4px',
                                      }
                                    }}
                                  >
                                    {item.value}
                                  </Code>
                                </Box>
                                <CopyButton text={item.value || ''} />
                                {/* <Button
                                  flexShrink={0}
                                  type="submit"
                                  borderRadius="full"
                                  size="sm"
                                  backgroundColor="#7CC9A9"
                                  _hover={{
                                    backgroundColor: "#51BF9D"
                                  }}
                                  onClick={() => handleCopyClick(item.value || '')}
                                >
                                  {hasCopied ? <CheckIcon /> : <CopyIcon />}
                                </Button> */}
                              </Flex>
                            ))}
                          </VStack>

                        </VStack>

                      </Box>
                      <Box ref={contentRef2} id="Glycan_information" mb={2} boxShadow="md" marginBottom="1em" backgroundColor="white" borderRadius="md">
                        <VStack align={'left'} padding={'1rem'}>
                          <Text fontSize="2xl" color={"#2D5E6B"} mb={2}>Glycan information</Text>
                          <Divider />
                          <Grid templateColumns="repeat(2, 3fr)" gap={3} padding={'1rem'} >
                            {[
                              {
                                label: "Components",
                                value: (
                                  <Wrap>
                                    {data?.archetype.components && Object.entries(data.archetype.components)
                                      .filter(([_, count]) => count > 0)
                                      .map(([component, count]) => (
                                        <WrapItem key={component}>
                                          <HStack>
                                            <Image
                                              src={`${apiUrl}/api/draw/${component}`}
                                              alt={component}
                                              height="50px"
                                              width="50px"
                                            />
                                            <Text fontSize="sm">×{count}</Text>
                                          </HStack>
                                        </WrapItem>
                                      ))}
                                  </Wrap>
                                )
                              },
                              {
                                label: "Composition",
                                value: (
                                  <Wrap>
                                    {data?.archetype.composition ? ( // Check if the composition object exists
                                      (() => {
                                        try {
                                          // Directly use the composition object, no parsing needed
                                          const compositionObject: Composition = data.archetype.composition;
                                          return Object.entries(compositionObject)
                                            // Filter out entries where count is undefined, null, or not a positive number
                                            .filter(([_, count]) => typeof count === 'number' && count > 0)
                                            .map(([name, count]) => (
                                              <WrapItem key={name}>
                                                <HStack>
                                                  <Image
                                                    src={`${apiUrl}/api/draw/${name}`} // Ensure your /api/draw endpoint can handle these names
                                                    alt={name}
                                                    height="50px"
                                                    width="50px"
                                                    // Add a fallback image if needed
                                                    onError={(e) => (e.currentTarget.style.display = 'none')} // Hide if image fails to load
                                                  />
                                                  <Text fontSize="sm">×{count as number}</Text>
                                                </HStack>
                                              </WrapItem>
                                            ));
                                        } catch (e) {
                                          // This catch block might be less relevant now unless Object.entries or mapping fails
                                          console.error("Failed to render composition object:", e, data.archetype.composition);
                                          return <Text fontSize="sm" color="red.500">Error displaying composition</Text>;
                                        }
                                      })()
                                    ) : (
                                      <Text fontSize="sm">Not Available</Text>
                                    )}
                                  </Wrap>
                                )
                              },
                              // { label: "Motifs", value: JSON.stringify(data?.archetype.motifs) || "Not Available" },
                              {
                                label: "Motifs",
                                value: (
                                  <Wrap>
                                    {data?.archetype?.motifs?.map((motif, index) => (
                                      <WrapItem key={index} width={'100%'} >
                                        <HStack  width={'100%'} justify="start">
                                          {/* Link to the motif ID */}
                                          <Image
                                            src={`${apiUrl}/api/draw/${data?.archetype.iupac}/${motif.motif}`}
                                            // alt={component}
                                            height="150px"
                                            width="auto"
                                            maxWidth={'70%'}
                                          />
                                          <VStack justify={'left'} align={'initial'}>
                                          <Link
                                            href={`${glytoucanBaseUrl}${motif.motif}`}
                                            isExternal
                                            fontFamily={'mono'}
                                            // textDecoration="underline"
                                            // fontWeight="bold"
                                          >
                                            {motif.motif}
                                          </Link>
                                          {/* Display motif label */}
                                          <Text color="gray.600">{motif.motif_label}</Text>
                                          </VStack>
                                        </HStack>
                                      </WrapItem>
                                    ))}
                                  </Wrap>
                                )
                              },
                              { label: "Termini", value: (
                                <Wrap>
                                  {data?.archetype.termini && data.archetype.termini.length > 0 ? (
                                  data.archetype.termini.map((termini, index) => (
                                    <WrapItem key={index}>
                                    <HStack>
                                    <Image
                                              src={`${apiUrl}/api/draw/${termini}`}
                                              alt={termini}
                                              height="50px"
                                              width="auto"
                                            />
                                      <Text fontSize="sm">{termini}</Text>
                                    </HStack>
                                    </WrapItem>
                                  ))
                                  ) : (
                                  <Text fontSize="sm">No termini available</Text>
                                  )}
                                </Wrap>
                              ) },

                            ].map(item => (
                              <Flex key={item.label} align="center" justify="space-between">
                                <Text fontFamily={'texts'} fontSize="md" width="20%" textAlign="right">{item.label}</Text>
                                <Divider orientation="vertical" height="30px" colorScheme="teal" />
                                <Text fontFamily={'texts'} fontSize="md" width="70%" textAlign="left">
                                  {typeof item.value === 'string' ? item.value : item.value}
                                </Text>
                              </Flex>
                            ))}
                          </Grid>
                          <Wrap spacing={4} padding={4}></Wrap>
                        </VStack>
                      </Box>

                      <Box ref={contentRef3} id="Chemical_information" mb={2} boxShadow="md" marginBottom="1em" backgroundColor="white" borderRadius="md">
                        <VStack align={'left'} padding={'1rem'}>
                          <Text fontSize="2xl" color={"#2D5E6B"} mb={2}>Chemical Information</Text>
                          <Divider />
                          <Grid templateColumns="repeat(2, 1fr)" gap={{ base: "0", sm: "0", md: "4", lg: "6", xl: "6" }} padding={'1rem'}>
                            {[
                              { label: "Mass", value: data?.archetype.mass || "Not Available" },
                              // { label: "Topological Polar Surface Area", value: data?.tpsa || "Not Available" },
                              { label: "Number of Rotatable Bonds", value: data?.archetype.rot_bonds || "Not Available" },
                              { label: "Number of Hydrogen Bond Acceptors", value: data?.archetype.hbond_acceptor || "Not Available" },
                              { label: "Number of Hydrogen Bond Donors", value: data?.archetype.hbond_donor || "Not Available" }
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


                            {/* <Biological glytoucan={data?.archetype.glytoucan || ''}/> */}

                            <Tabs isLazy variant='soft-rounded' colorScheme='green' align='start' size='sm'>
                              <TabList>
                                <Tab>Archetype</Tab>
                                <Tab>Alpha</Tab>
                                <Tab>Beta</Tab>
                              </TabList>
                              <TabPanels>
                                <TabPanel>
                                  <Biological glytoucan={data?.archetype.glytoucan || ''} />
                                </TabPanel>
                                <TabPanel>
                                  <Biological glytoucan={data?.alpha.glytoucan || ''} />
                                </TabPanel>
                                <TabPanel>
                                  <Biological glytoucan={data?.beta.glytoucan || ''} />
                                </TabPanel>
                              </TabPanels>
                            </Tabs>

            
                        </VStack>
                      </Box>



                      <Box ref={contentRef5} id="Simulation_information" mb={2} boxShadow="md" marginBottom="1em" backgroundColor="white" borderRadius="md">
                        <VStack align={'left'} padding={'1rem'}>
                          <Text fontSize="2xl" color={"#2D5E6B"} mb={2}>Simulation Information</Text>
                          <Divider />
                          <Grid templateColumns="repeat(2, 1fr)" gap={{ base: "0", sm: "0", md: "4", lg: "6", xl: "6" }} padding={'1rem'}>
                            {[
                              { label: "Simulation Length (μs)", value: data?.archetype.length || "Not Available" },
                              { label: "MD Engine", value: data?.archetype.package || "Not Available" },
                              { label: "Force Field", value: data?.archetype.forcefield || "Not Available" },
                              { label: "Temperature (K)", value: data?.archetype.temperature || "Not Available" },
                              { label: "Pressure (bar)", value: data?.archetype.pressure || "Not Available" },
                              { label: "Salt (mM)", value: data?.archetype.salt || "Not Available" }
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
                  <Box textAlign="right" width="100%" paddingRight="2rem">
                    <Text color='#B195A2' fontSize={'xs'}> GlycoShape entry number: {data?.archetype.ID}</Text>
                    <Text color='#B195A2' fontSize={'xs'}>
                      If you encounter any issues on this page or suspect a bug contact us <Link href="mailto:OJAS.SINGH.2023@mumail.ie">here</Link>
                    </Text>
                  </Box>
                </TabPanel>

                <TabPanel>

                  <Box display="flex" >
                    <Show above='lg'>
                      <Box position={'sticky'} top="2"
                        width={{ base: "0", sm: "0", md: "0", lg: "15%", xl: "15%" }} height={'50vh'} paddingTop={'5rem'} paddingLeft={'0rem'}>

                        <VStack align="right" spacing={1} justify="start"> {/* Added justify="start" */}
                          <Button
                            onClick={() => scrollToContent(contentRef6)}
                            bg={'gray.300'}
                            fontSize={'medium'} // Adjust font sizes as desired
                            color={'#1A202C'}
                            fontStyle={'medium'}
                            _hover={{
                              bg: '#E2CE69', // replace with the color you want on hover
                            }}
                            borderRadius="0" // Sharp rectangular edges
                          >
                            Clusters Information
                          </Button>
                          <Button
                            onClick={() => scrollToContent(contentRef7)}
                            bg={activeSection === 'Glycan_information' ? '#466263' : 'gray.300'}
                            fontSize={activeSection === 'Glycan_information' ? 'medium' : 'medium'} // Adjust font sizes as desired
                            color={activeSection === 'Glycan_information' ? 'white' : '#1A202C'}
                            fontStyle={'medium'}
                            _hover={{
                              bg: '#E2CE69', // replace with the color you want on hover
                            }}
                            borderRadius="0" // Sharp rectangular edges
                          >
                            Torsion plots
                          </Button>
                          <Button
                            onClick={() => scrollToContent(contentRef8)}
                            bg={activeSection === 'Chemical_information' ? '#466263' : 'gray.300'}
                            fontSize={activeSection === 'Chemical_information' ? 'medium' : 'medium'} // Adjust font sizes as desired
                            color={activeSection === 'Chemical_information' ? 'white' : '#1A202C'}
                            fontStyle={'medium'}
                            _hover={{
                              bg: '#E2CE69', // replace with the color you want on hover
                            }}
                            // fontFamily={'thin'}
                            borderRadius="0" // Sharp rectangular edges
                          >
                            Conformation space
                          </Button>


                        </VStack>
                      </Box>
                    </Show>

                    <Box flex="1" p={{ base: "-2rem", sm: "0rem", md: "2rem", lg: "2rem", xl: "2rem" }} marginTop={'-2.5rem'} >

                      <Box flex='1' ref={contentRef6} id="clusters" p={'1rem'} pb={'2rem'}
                        boxShadow="md"
                        marginBottom="1em"
                        backgroundColor="white"
                        borderRadius="md">
                        <VStack align={'left'} padding={'1rem'}>
                        <Text fontSize="2xl" color={"#2D5E6B"} mb={2}>This glycan has {clusterLength} major conformations clusters</Text>
                        <Divider />
                        
                          <Box width="100%" height="50vh" position="relative" >
                            {data?.archetype.ID && (
                              // <MolstarViewer
                              //   urls={filteredUrls}
                              //   backgroundColor="#FCFBF9"
                              // />
<div>
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
                              src={"/viewer/embedded_multi_closed.html?pdbUrls=" + iframeSrc }
                              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title="Protein Structure"
                            />
                          </Show>
                          </div>
                            )}
                            {/* <HStack spacing={2} paddingTop="1rem">
                            {Array.from({ length: clusterLength }, (_, i) => (
                              <Button
                                key={i}
                                colorScheme="teal"
                                variant="outline"
                                size="sm"
                                onClick={() => toggleCluster(i)}
                              >
                                {clustersVisibility[i] ? `Hide Cluster ${i }` : `Show Cluster ${i }`}
                              </Button>
                            ))}
                          </HStack> */}
                          </Box>

                          

                          
                          <Box paddingTop={"2rem"} >
                            <SimpleGrid alignItems="center" justifyItems="center" columns={[1, 2]} spacing={0} paddingTop={'0rem'} paddingBottom={'2rem'}>

                              <VStack >
                                <HStack paddingTop={"5rem"}>
                                  <Text size={'md'}>Download Clusters : </Text>
                                  {generateDownloadUrls().map((url, index) => (
                                    <Button colorScheme='purple' variant='link' key={index} style={{ color: colors[index % colors.length] }}>
                                      <a href={url} download>
                                        Cluster {index}&nbsp;&nbsp;&nbsp;
                                      </a></Button>

                                  ))}</HStack>


                                {data?.archetype.clusters ? <PieChart data={transformedClusters} /> : <div>No cluster data available</div>}

                              </VStack>

                              <Image src={`${apiUrl}/database/${data?.archetype.ID}/output/dist.svg`} alt="No distribution plot available for this glycan!" width={{ base: '100%', lg: '40vw' }} />

                            </SimpleGrid>
                          </Box>

                        </VStack>
                        <Text color='#B195A2' alignSelf={"left"} fontSize={'xs'} paddingLeft={"1rem"}>
                          Probabilty of each cluster conformation is displayed above in the pie chart. Along with each cluster center torsion angle lies the distribution in densities plot.
                        </Text>
                      </Box>

                      <Box ref={contentRef7} id="Ramachandran_plot" mb={2} boxShadow="md" marginBottom="1em" backgroundColor="white" borderRadius="md">
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
                                link.href = `${apiUrl}/database/${data?.archetype.ID}/output/torsions.csv`;
                                link.setAttribute('download', `${data?.archetype.ID}.csv`);
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                            >Download torsion DATA</Button></HStack>
                          <Divider />
                          <ContourPlot dataUrl={`${apiUrl}/database/${data?.archetype.ID}/output/torsions.csv`} seq={`${data?.archetype.ID}`} />
                        </VStack>
                        <Text color='#B195A2' alignSelf={"left"} fontSize={'xs'} paddingBottom={"0.5rem"} paddingLeft={"1rem"}>
                          Dihedral torsion plot of the selected residues in the glycan sequence.
                        </Text>
                      </Box>



                      <Box ref={contentRef8} id="PCA_details" mb={2} boxShadow="md" marginBottom="1em" backgroundColor="white" borderRadius="md">
                        <VStack align={'left'} padding={'1rem'}>
                          <Text fontSize="2xl" color={"#2D5E6B"} mb={2}>Conformation space representation (PCA details)</Text>

                          <Divider />
                          <SimpleGrid justifyContent={'space-between'} alignSelf="left" justifyItems="center" columns={[1, 2]} spacing={0} paddingTop={'1rem'} paddingBottom={'2rem'}>

                            <Scatter3D dataUrl={`${apiUrl}/database/${data?.archetype.ID}/output/pca.csv`} />

                            <VStack width={{ base: '100%', md: '100%', lg: '50%' }}>
                              <Image width={'100%'} src={`${apiUrl}/database/${data?.archetype.ID}/output/PCA_variance.png`} />
                              <Image width={'100%'} src={`${apiUrl}/database/${data?.archetype.ID}/output/Silhouette_Score.png`} />
                            </VStack>
                          </SimpleGrid>
                        </VStack>
                        <Text color='#B195A2' fontSize={'xs'} paddingBottom={"0.5rem"} paddingLeft={"1rem"}>
                          Principal Component Analysis (PCA) of all conformation explored in Molecular Dynamics Simulation and Silhouette Score plots for no. of cluster selection.
                        </Text>
                      </Box>
                    </Box></Box>

                </TabPanel>
              </TabPanels>
            </Tabs>



          </Box>
        </Flex>
      ) : (
        <Box textAlign="center" p={8}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle mb={1}>Failed to load glycan data</AlertTitle>
              <AlertDescription>
                {error || "Please check your input and try again."}
              </AlertDescription>
            </Box>
          </Alert>
        </Box>
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
