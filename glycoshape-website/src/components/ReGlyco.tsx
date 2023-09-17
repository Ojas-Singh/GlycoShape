import React, { useState, ChangeEvent, useEffect, useRef,  } from 'react';
import axios from 'axios';
import { Select as ChakraSelect } from '@chakra-ui/react';
import {Wrap, Box, Input, Text, Button, VStack, HStack, useToast, Link, Flex, Code, Heading,   Accordion,
  Spacer,
  Checkbox,
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
  useSteps, Badge, WrapItem, Image} from '@chakra-ui/react';
import { Kbd } from '@chakra-ui/react';
import bg from './assets/Glycans_bg_dark_neg.png';
import { Config } from '@testing-library/user-event/dist/types/setup/setup';

import Select, { ActionMeta, OnChangeValue } from 'react-select';


interface ResidueOption {
  label: string;
  value: number;
}


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

interface GlycoConf {
  residueID: number; 
  residueName: string;
  glycanIDs: string[];
}

interface UniprotData {
  glycosylation_locations: Glycosylation;
  uniprot: string;
  requestURL: string;
  configuration: [GlycoConf];
}


interface OptionType {
  label: string;
  value: number;
}

  const ReGlyco = () => {
      const [uniprotID, setUniprotID] = useState<string>("");
      const [UniprotData, setUniprotData] = useState<UniprotData | null>(null);
      const [isUpload, setIsUpload] = useState<boolean>(false);
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
    
      


      const [value, setValue] = useState<readonly ResidueOption[]>([]);

  const onChange = (
    newValue: OnChangeValue<ResidueOption, true>,
    actionMeta: ActionMeta<ResidueOption>
  ) => {
    setValue(newValue ? newValue : []);
  };

      const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();  // Prevents the default form submission behavior
        fetchProteinData();
    };
    
    
    const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const formData = new FormData();
            formData.append('pdbFile', file);
    
            try {
                const response = await axios.post('https://glycoshape.io/api/upload_pdb', formData, {
                    timeout: 600000, // Set a timeout of 10 minutes (value in milliseconds)
                    onUploadProgress: progressEvent => {
                        const percentage = progressEvent.total ? (progressEvent.loaded * 100) / progressEvent.total : 0;
                        console.log(`Upload Progress: ${Math.round(percentage)}%`);
                    }
                });
    
                if (response.status === 200) {
                    setUniprotData(response.data);
                    setIsUpload(true);
                    setActiveStep(1);
                } else {
                    console.error("Failed to upload file.");
                }
            } catch (error) {
                console.error("Error occurred during file upload:", error);
            }
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
              setActiveStep(1);
          } catch (error) {
              if (error instanceof Error) {
                  // toast({
                  //     title: "Error fetching data.",
                  //     description: error.message,
                  //     status: "error",
                  //     duration: 500,
                  //     isClosable: true,
                  // });
              }
          }
      }

      const [selectedGlycans, setSelectedGlycans] = useState({});
      const [outputPath, setOutputPath] = useState("");
      const [clashValue, setClashValue] = useState(false);
      const [selectedGlycanImage, setSelectedGlycanImage] = useState<{[key: number]: string}>({});
      


      const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>, residueID: number) => {
        const value = event.target.value;
        setSelectedGlycans(prevState => ({
            ...prevState,
            [residueID]: value
        }));
        setSelectedGlycanImage(prevState => ({
          ...prevState,
          [residueID]: value
      }));
    }



    const options = UniprotData?.configuration?.map((glycoConf: GlycoConf) => ({
      value: glycoConf.residueID,
      label: `${glycoConf.residueName}${glycoConf.residueID}`,
    }));
   
    
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
      if (uniprotID) {  // or a more specific check if needed
          fetchProteinData();
      }
  }, [uniprotID]);

    const handleProcess = async () => {
      setIsLoading(true);  // Start loading
      setActiveStep(2); 
      const payload = {
          selectedGlycans: selectedGlycans,
          uniprotID : uniprotID
      };
  
      try {
          const response = await fetch('https://glycoshape.io/api/process_uniprot', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
          });
  
          if (response.ok) {
              const responseData = await response.json();
                setOutputPath(responseData.output);
                setClashValue(responseData.clash);
                setActiveStep(3);  // Move to the 'Download' step after processing

              console.log(responseData);
              // Handle the response data as needed
          } else {
              console.error("Failed to post data.");
          }
      } catch (error) {
          console.error("Error occurred:", error);
      }finally {
        setIsLoading(false);  // End loading regardless of success or failure
    }
  }
  
  const handleProcessCustom = async () => {
    setIsLoading(true);  // Start loading
    setActiveStep(2); 
    const payload = {
        selectedGlycans: selectedGlycans,
        uniprotID : UniprotData?.uniprot
    };

    try {
        const response = await fetch('https://glycoshape.io/api/process_pdb', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const responseData = await response.json();
              setOutputPath(responseData.output);
              setClashValue(responseData.clash);
              setActiveStep(3);  // Move to the 'Download' step after processing

            console.log(responseData);
            // Handle the response data as needed
        } else {
            console.error("Failed to post data.");
        }
    } catch (error) {
        console.error("Error occurred:", error);
    }finally {
      setIsLoading(false);  // End loading regardless of success or failure
  }
}

  const steps = [
    {  title: 'Choose Structure', description: 'from AlphaFold or upload your own'},
    {  title: 'Select Glycans', description: 'N-Glycan, O-Glycans, etc ...'},
    { title: 'Download', description: 'Re-Glycosylated structure' },
  ]
  
    
      const { activeStep ,setActiveStep} = useSteps({
        index: 0,
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
                          bgGradient='linear(to-l,  #CE9D8F, #D7C9C0)'
                          bgClip='text'
                          fontSize={{base: "4xl",sm: "4xl", md: "5xl", lg: "5xl",xl: "5xl"}}
                          
                          marginBottom="0.2em"
                      >
                          <Link fontWeight="bold" fontFamily={'heading'} href="/reglyco" marginRight="20px">Re-Glyco</Link>
                      </Text>
                      {/* Search Bar Section */}
                     
                      <Flex width="40%" minWidth={{ base: "70%" , md: "40%"}} align="center" position="relative" gap="1em" boxShadow="xl" borderRadius="full" overflow="hidden" p="0.5em" bg="white">
                      
                          <form onSubmit={handleSearch}>
                              <Input
                                  onChange={(e) => (setUniprotID(e.target.value),setIsUpload(false))}
                                  ref={searchRef}
                                  fontFamily={'texts'}
                                  placeholder="Enter Uniprot Id"
                                  value={uniprotID}
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
                              backgroundColor="#B07095"
                              _hover={{
                                  backgroundColor: "#CF6385"
                              }}
                              size = {{base: "md",sm: "md", md: "md", lg: "md",xl: "md"}}
                              onClick={(e) => (setIsUpload(false),handleSearch)}
                          >
                              Fetch
                          </Button>
                      </Flex>
                      
                      <Text 
                          marginLeft={"2rem"}
                          bgGradient='linear(to-l, #B07095, #B07095)'
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
       backgroundColor="#B07095"
                              _hover={{
                                  backgroundColor: "#CF6385"
                              }}
       size={{base: "md",sm: "md", md: "md", lg: "md",xl: "md"}}
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
                  <VStack spacing={4} w="100%" p={2} justify={'left'}>
                      {UniprotData && (
                          <Flex w="100%" justifyContent="left" alignItems="center" p={2 } marginTop={"0"} direction="column"  >  
                              {/* <HStack margin={'1rem'} marginTop={'-1rem'} display="flex" width={'100%'} position="sticky" top="0" bg="white" zIndex="10" >  */}
                              <Flex w="100%" 
                  align="center" 
                  justify="center" 
                  flex="1" 
                  padding="2rem" paddingTop={'0rem'} direction={{base: "column",sm: "column", md: "row", lg: "row",xl: "row"}}>
                               <Heading  margin={"0rem"} marginLeft={"0"} marginBottom={'0rem'} as='h4'size='xl'>  {isUpload ? "File:" : `Uniprot ID: `} {UniprotData.uniprot}</Heading>
                      
                                  <Spacer />
                                    <Box >
                                      <Stepper width={{base: "0%",sm: "0%", md: "auto", lg: "auto",xl: "auto"}} visibility={{base: "hidden",sm: "hidden", md: "visible", lg: "visible",xl: "visible"}} margin="1rem" size={{base: "sm",sm: "sm", md: "sm", lg: "md",xl: "md"}} colorScheme='pink' index={activeStep}>
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
                                    {/* </HStack> */}
                                    </Flex>
                                  
                                 <Accordion marginTop={"-2rem"} w="90%" defaultIndex={[0]} allowMultiple>

                                <AccordionItem> 
                                
                                <h2>
                                    <AccordionButton  margin={"1rem"} marginLeft={"0"} >
                                      <Box as="span" flex='1' textAlign='left'>
                                      <Heading   as='h4' size='md'>Structure Information</Heading> 
                                      </Box>
                                      <AccordionIcon />
                                    </AccordionButton>
                                  </h2>
                                  <AccordionPanel>
                                  
                                  <Flex w="100%" 
                  align="center" 
                  justify="center" 
                  flex="1" 
                  padding="2rem" paddingTop={'0rem'} direction={{base: "column",sm: "column", md: "row", lg: "row",xl: "row"}}>
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
                                  key={isUpload ? "uploaded" : UniprotData.requestURL}
                                  width="90%"
                                  height="400px"

                                  src={isUpload ? 
                                    `/viewer/embedded.html?pdbUrl=${UniprotData.requestURL}&format=pdb` : 
                                    `/viewer/embedded.html?pdbUrl=${UniprotData.requestURL}&format=mmcif`
                                }                                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  title="Protein Structure"
                              /></Flex> 
                              </AccordionPanel>
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
                                  <Text fontWeight="bold">Configuration</Text>
                                  <Code width={"70rem"}>{JSON.stringify(UniprotData.configuration, null, 2)}</Code>
                                  
                              </Box>
                                  </AccordionPanel>
                                </AccordionItem>

      <Heading margin={'3rem'} marginLeft={'0rem'} marginBottom={'1rem'} fontSize={{base: "1xl",sm: "1xl", md: "1xl", lg: "2xl",xl: "2xl"}} fontFamily={'texts'}>
        Select residues to glycosylate
      </Heading>  
        <Select
      value={value}
      isMulti
      name="residues"
      className="basic-multi-select"
      classNamePrefix="select"
      onChange={onChange}
      options={UniprotData?.configuration?.map((glycoConf: GlycoConf) => ({
        value: glycoConf.residueID,
        label: `${glycoConf.residueName}${glycoConf.residueID}`
      }))}
    />

{UniprotData?.configuration && UniprotData.configuration.map((glycoConf: GlycoConf, index: number) => {
  const isSelected = value.find(option => option.value === glycoConf.residueID);
  return isSelected ? (
    <div key={index}>
      <HStack>
      <Heading margin={'1rem'} fontSize={{base: "1xl",sm: "1xl", md: "1xl", lg: "2xl",xl: "2xl"}} id={`glycan-${index}`} fontFamily={'texts'}>
        {`Residue: ${glycoConf.residueName}${glycoConf.residueID}`}
      </Heading>  
      
        <ChakraSelect 
          colorScheme='messenger' 
          width='70%'   
          defaultValue="none" 
          placeholder='Select glycan...'  
          onChange={(e) => handleSelectChange(e, glycoConf.residueID)}
        >
          {glycoConf.glycanIDs.map((glycanID, glycanIndex) => (
            
            <option key={glycanIndex} value={glycanID}>
            
              {glycanID.length > 120 ? glycanID.substring(0, 120) + '...' : glycanID}
            
            </option>
            
          ))}
        </ChakraSelect>
        {selectedGlycanImage[glycoConf.residueID] && (
                            <Image
                                src={`/database/${selectedGlycanImage[glycoConf.residueID]}/${selectedGlycanImage[glycoConf.residueID]}.svg`}
                                alt="Glycan Image"
                                width="150px"
                            />
                        )}
      </HStack>
    </div>
  ) : null;
})}

            <Button
    position={"relative"}
    margin={'1rem'}
    borderRadius="full"
    backgroundColor="#B07095"
                              _hover={{
                                  backgroundColor: "#CF6385"
                              }}
    size={{base: "md", sm: "md", md: "md", lg: "lg", xl: "lg"}}
    onClick={isUpload ? handleProcessCustom : handleProcess}
    isDisabled={isLoading}  // Disable the button while processing to prevent multiple requests
>
    {isLoading ? "Processing..." : "Process"}
</Button>
                          {outputPath &&  (
                            <Box>
                          <iframe
                      // key={sequence}
                      width="100%"
                      height="400px"
                      src={`/viewer/embedded.html?pdbUrl=https://glycoshape.io/output/${outputPath}&format=pdb`}                                  frameBorder="0"
                      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Protein Structure"
                              />
           <a href={`https://glycoshape.io/output/${outputPath}`} download>                  
    <Button position={"relative"}
     margin={'1rem'}
     borderRadius="full"
     isDisabled={isLoading}
     backgroundColor="#B07095"
                              _hover={{
                                  backgroundColor: "#CF6385"
                              }}
     size = {{base: "md",sm: "md", md: "md", lg: "lg",xl: "lg"}}>
       
        Download PDB File
    </Button></a>
</Box>
                              )} 
                              </Accordion>
                              
                              
                          </Flex>
                      )}
                      {!UniprotData && (

                        <Flex w="100%" minHeight={'90vh'} justifyContent="left" alignItems="center" p={2 } marginTop={"0"} direction="column"  background={`url('https://glycam.org/static/img/Supplemental%20Simulation1.Abundant.Rotation.mp4')`} 
                        backgroundSize="cover" 
                        backgroundPosition="center"
                        backgroundRepeat="no-repeat" >  
                        {/* <HStack margin={'1rem'} marginTop={'-1rem'} display="flex" width={'100%'} top="0" bg="white" zIndex="10" >  */}
                        <Flex w="100%" 
                   
                  justify="center" 
                  flex="1" 
                  padding="0rem" paddingTop={'0rem'} direction={{base: "column",sm: "column", md: "row", lg: "row",xl: "row"}}>
                        <Text 
                        bgGradient='linear(to-l,  #B07095, #D7C9C0)'
                        bgClip='text'
                        fontSize={{base: "3xl",sm: "3xl", md: "4xl", lg: "5xl",xl: "5xl"}}
                        fontWeight='bold'
                        marginBottom="0.2em"
                        marginLeft={'2rem'}
                      >
                        A GlycoProtein Builder
                      </Text>

                            <Spacer />
                              <Box >
                                <Stepper width={{base: "0%",sm: "0%", md: "auto", lg: "auto",xl: "auto"}} visibility={{base: "hidden",sm: "hidden", md: "visible", lg: "visible",xl: "visible"}} margin="1rem" size={{base: "sm",sm: "sm", md: "sm", lg: "md",xl: "md"}} colorScheme='pink' index={activeStep}>
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
                              {/* </HStack> */}
                              </Flex>

                        
                      <Text padding={'2rem'} paddingTop={'2rem'} paddingBottom={'2rem'}>Re-glyco is a powerful tool designed to restore the missing glycosylation in AlphaFold structures or user-uploaded protein structures.

                        To get started, upload your protein structure file or choose a pre-existing AlphaFold structure, and let re-glyco do the rest!

                        here are some example UniProt IDs to get you started:
                        </Text>
                        <Text fontFamily={'texts'}>
                        <Button margin='0rem' onClick={(e) => (setUniprotID('Q9BXJ4'))} colorScheme='purple' variant='link' size={{base: "md", sm: "md", md: "md", lg: "lg", xl: "lg"}}>Q9BXJ4</Button>
                        <Button margin='0rem' onClick={(e) => (setUniprotID('P29016'))} colorScheme='purple' variant='link' size={{base: "md", sm: "md", md: "md", lg: "lg", xl: "lg"}}>P29016</Button>
                        <Button margin='0rem' onClick={(e) => (setUniprotID('O15552'))} colorScheme='purple' variant='link' size={{base: "md", sm: "md", md: "md", lg: "lg", xl: "lg"}}>O15552</Button>
                        <Button margin='0rem' onClick={(e) => (setUniprotID('P27918'))} colorScheme='purple' variant='link' size={{base: "md", sm: "md", md: "md", lg: "lg", xl: "lg"}}>P27918</Button>
                        <Button margin='0rem' onClick={(e) => (setUniprotID('B0YJ81'))} colorScheme='purple' variant='link' size={{base: "md", sm: "md", md: "md", lg: "lg", xl: "lg"}}>B0YJ81</Button>
                        
                        </Text>
                        <video autoPlay loop muted id="bgVideo">
        <source  src="" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
                      </Flex>


                      )}
                  </VStack>
              </>
          );
      }
      
      

  export default ReGlyco;
