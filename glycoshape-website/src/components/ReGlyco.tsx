import React, { useState, ChangeEvent, useEffect, useRef } from 'react';
import {Wrap, Box, Input, Text, Button, VStack, HStack, useToast, Link, Flex, Code, Heading,   Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon, Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  useSteps, Badge, WrapItem} from '@chakra-ui/react';
import { Kbd } from '@chakra-ui/react'

import bg from './assets/Glycans_bg_dark.jpg';

interface Glycosylation {
  glycosylations: {
    begin: string;
    category: string;
    description: string;
    end: string;
    evidences: { code: string }[];
    ftId: string;
    molecule: string;
    type: string;
  }[];
  sequence: string;
  sequenceLength: number;
}

interface UniprotData {
  glycosylation_locations: Glycosylation;
  uniprot: string;
  requestURL: string;
}
const steps = [
  { title: 'Select Residues', description: 'ResID of Glycosylated residue' },
  { title: 'Select Glycans', description: 'N-Glycan, O-Glycans, etc ...' },
  { title: 'Download', description: 'Re-Glycosylated structure' },
]

  const ReGlyco = () => {
      const [uniprotID, setUniprotID] = useState<string>("");
      const [UniprotData, setUniprotData] = useState<UniprotData | null>(null);
      const toast = useToast();
      const searchRef = useRef(null);
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
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
    
      
      const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();  // Prevents the default form submission behavior
        fetchProteinData();
    };
      const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files;
        if (file) {
          // Logic to upload the file and get its URL
          // For demonstration purposes, I'll set a mock URL. You'll need to replace this with real logic.
          // setPdbUrl(`https://healoor.me/downloads/${file.name}`);
        }
      };

      const fetchProteinData = async () => {
          try {
              const response = await fetch("https://glycoshape.io/api/uniprot", {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ uniprot: uniprotID })
              });

              const data: UniprotData = await response.json();
              setUniprotData(data);
          } catch (error) {
              if (error instanceof Error) {
                  toast({
                      title: "Error fetching data.",
                      description: error.message,
                      status: "error",
                      duration: 500,
                      isClosable: true,
                  });
              }
          }
      }
      const { activeStep } = useSteps({
        index: 1,
        count: steps.length,
      })

      return (

          
    
              <>
                  <Flex w="100%" 
                  align="center" 
                  justify="center" 
                  flex="1" 
                  padding="0em"
                  minHeight={{ base: "15vh" }}
                  backgroundImage={`url(${bg})`} 
                  backgroundSize="cover" 
                  // backgroundPosition="center"
                  backgroundRepeat="no-repeat"  justifyContent="center" alignItems="center" p={1}
                  direction={{base: "column",sm: "column", md: "row", lg: "row",xl: "row"}}
                   >
                      <Text
                          bgGradient='linear(to-l,  #FDFDA1, #E2FCC5)'
                          bgClip='text'
                          fontSize={{base: "3xl",sm: "3xl", md: "5xl", lg: "5xl",xl: "5xl"}}
                          
                          marginBottom="0.2em"
                      >
                          <Link fontWeight="bold" fontFamily={'heading'} href="/reglyco" marginRight="20px">Re-Glyco</Link>
                      </Text>
                      {/* Search Bar Section */}
                     
                      <Flex width="40%" minWidth={{ base: "50%" , md: "40%"}} align="center" position="relative" gap="1em" boxShadow="xl" borderRadius="full" overflow="hidden" p="0.5em" bg="white">
                      
                          <form onSubmit={handleSearch}>
                              <Input
                                  onChange={(e) => setUniprotID(e.target.value)}
                                  ref={searchRef}
                                  fontFamily={'texts'}
                                  placeholder="Enter Uniprot Id"
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
                          </form>
                          <Text
                              position="absolute"
                              right={{base: "1rem",sm: "1rem", md: "5rem", lg: "7rem",xl: "7rem"}}
                              top="50%"
                              transform="translateY(-50%)"
                              color="gray.500"
                              fontSize="xs"
                              userSelect="none"
                          >
                              <Kbd>ctrl</Kbd>+<Kbd>K</Kbd>
                          </Text>
                          <Button
                              position={"absolute"}
                              right="3%"
                              borderRadius="full"
                              backgroundColor="#7CC9A9"
                              _hover={{
                                  backgroundColor: "#51BF9D"
                              }}
                              size = {{base: "md",sm: "md", md: "md", lg: "md",xl: "md"}}
                              onClick={handleSearch}
                          >
                              Fetch
                          </Button>
                      </Flex>
                      
                      <Text 
                          marginLeft={"2rem"}
                          bgGradient='linear(to-l, #44666C, #44666C)'
                          bgClip='text'
                          fontSize={{base: "2xl",sm: "2xl", md: "2xl", lg: "2xl",xl: "2xl"}}
                          alignItems="center"
                          fontWeight='extrabold'
                          marginBottom="0.2em"
                      >
                          or
                      </Text>
                      <Box position="relative" display="inline-block" marginLeft={"2rem"} alignItems="center">
                          <Button
                              as="label"
                              colorScheme="teal"
                              size={{base: "sm",sm: "sm", md: "sm", lg: "md",xl: "md"}}
                              cursor="pointer"
                              w="full"
                          >
                              Upload your .pdb
                          </Button>
                          <Input
                              type="file"
                              position="absolute"
                              top="0"
                              left="0"
                              opacity="0"
                              width="100%"
                              height="100%"
                              cursor="pointer"
                              onChange={handleFileUpload}
                          />
                      </Box>
                      
                  </Flex>
                  
                      
    
                  {/* Rest of the content */}
                  <VStack spacing={4} w="100%" p={8}>
                      {UniprotData && (
                          <Flex w="100%" justifyContent="left" alignItems="center" p={8} marginTop={"0"} direction="column"  >  
                              
                              <Accordion marginTop={"-2rem"} w="90%" defaultIndex={[1]} allowMultiple>
                              <AccordionItem> <Heading margin={"2rem"} marginLeft={"0"} as='h4'size='xl'> Uniprot ID : {UniprotData.uniprot}</Heading>
                              
                              </AccordionItem>
                                <AccordionItem>
                                  <h2>
                                    <AccordionButton  margin={"1rem"} marginLeft={"0"} >
                                      <Box as="span" flex='1' textAlign='left'>
                                      <Heading   as='h4' size='md'>Glycosylation Information</Heading> 
                                      </Box>
                                      <AccordionIcon />
                                    </AccordionButton>
                                  </h2>
                                  <AccordionPanel pb={4}>
                                  <Box mt={4}>
                                  <Text fontWeight="bold">Sequence:</Text>
                                  <Code width={"70rem"}>{JSON.stringify(UniprotData.glycosylation_locations.sequence, null, 2)}</Code>
                                  <Text fontWeight="bold">Glycosylations</Text>
                                  <Code width={"70rem"}>{JSON.stringify(UniprotData.glycosylation_locations.glycosylations, null, 2)}</Code>
                                  
                              </Box>
                                  </AccordionPanel>
                                </AccordionItem>
                                <AccordionItem> 
                                  <HStack>
                                <Box borderWidth="1px" borderRadius="md" padding={4} width="300px">
                                    <Text fontSize="lg" fontWeight="bold" mb={3}>
                                      3D Viewer
                                    </Text>

                                    <Text fontWeight="semibold" mb={2}>Model Confidence:</Text>

                                    <Text mb={1}>
                                      <Badge bg="#0053D6" borderRadius="full" px={2}>Very high (pLDDT {'>'} 90)</Badge>
                                    </Text>

                                    <Text mb={1}>
                                      <Badge bg="#65CBF3" borderRadius="full" px={2}>Confident (90 {'>'} pLDDT {'>'} 70)</Badge>
                                    </Text>

                                    <Text mb={1}>
                                      <Badge bg="#FFDB13" borderRadius="full" px={2}>Low (70 {'>'} pLDDT {'>'} 50)</Badge>
                                    </Text>

                                    <Text mb={3}>
                                      <Badge bg="#FF7D45" borderRadius="full" px={2}>Very low (pLDDT {'<'} 50)</Badge>
                                    </Text>

                                    <Text fontSize="sm">
                                      AlphaFold produces a per-residue confidence score (pLDDT) between 0 and 100. Some regions below 50 pLDDT may be unstructured in isolation.
                                    </Text>
                                  </Box>
                                  <iframe
                                  key={UniprotData.requestURL}
                                  width="90%"
                                  height="400px"
                                  src={`/pdbe/index.html?Url=${UniprotData.requestURL}&format=cif&timestamp=${Date.now()}`}                                  frameBorder="0"
                                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  title="Protein Structure"
                              /> </HStack>
                              </AccordionItem>
                                <AccordionItem>
                                  <h2>
                                    <AccordionButton>
                                      <Box as="span" flex='1' textAlign='left'>
                                      <Stepper margin="2rem" size='lg' colorScheme='green' index={activeStep}>
                                        {steps.map((step, index) => (
                                          <Step key={index}>
                                            <StepIndicator>
                                              <StepStatus
                                                complete={<StepIcon />}
                                                incomplete={<StepNumber />}
                                                active={<StepNumber />}
                                              />
                                            </StepIndicator>

                                            <Box flexShrink='0'>
                                              <StepTitle>{step.title}</StepTitle>
                                              <StepDescription>{step.description}</StepDescription>
                                            </Box>

                                            <StepSeparator />
                                          </Step>
                                        ))}
                                </Stepper>  
                                      </Box>
                                      <AccordionIcon />
                                    </AccordionButton>
                                  </h2>
                                  <AccordionPanel pb={4}>
                                  
                                  </AccordionPanel>
                                </AccordionItem>
                              </Accordion>
                              
                              
                          </Flex>
                      )}
                      {!UniprotData && (
                        <Flex w="100%" justifyContent="center" alignItems="center" p={8} marginTop={"0"} direction="column"  >
                        <Text 
                        bgGradient='linear(to-l, #44666C, #A7C4A3)'
                        bgClip='text'
                        fontSize={{base: "3xl",sm: "4xl", md: "5xl", lg: "5xl",xl: "6xl"}}
                        fontWeight='bold'
                        marginBottom="0.2em"
                      >
                        Welcome to Re-Glyco!
                      </Text>
                      <Text padding={'10rem'} paddingTop={'2rem'} paddingBottom={'2rem'}>Re-glyco is a powerful tool designed to restore the missing glycosylation in AlphaFold structures or user-uploaded protein structures.

                        To get started, upload your protein structure file or choose a pre-existing AlphaFold structure, and let re-glyco do the rest!

                        here are some example UniProt IDs to get you started:
                        </Text>
                        <Text fontFamily={'texts'}>
                        O15552, P29016, Q9BXJ4, P27918, B0YJ81</Text>
                      </Flex>


                      )}
                  </VStack>
              </>
          );
      }
      
      

  export default ReGlyco;
