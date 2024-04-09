import React, { useState, ChangeEvent, useEffect, useRef, } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router';
import {
  Switch,
  FormControl, FormLabel, Hide, SimpleGrid, Box, Input, Text, Button, VStack, HStack, Link, Flex, Code, Heading, Accordion,
  Spacer,
  CircularProgress,
  CircularProgressLabel,
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
  useSteps, Badge,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import bg from './assets/gly.png';

import Select, { ActionMeta, OnChangeValue, } from 'react-select';

// Define an interface for the result items
interface ResultItem {
  clash_solved: boolean;
  cluster: number;
  glycan: string;
  phi: number;
  psi: number;
  residue: string;
}

// Define an interface for the scan results
interface ScanResults {
  box: string;
  clash: boolean;
  output: string;
  results: ResultItem[];
}

interface ResidueOption {
  label: string;
  value: number;
}


interface Glycosylation {
  begin: string;
  category: string;
  description: string;
  end: string;
  evidences: Evidence[];
  ftId: string;
  molecule: string;
  type: string;
}

interface Evidence {
  code: string;
  source: Source;
}

interface Source {
  alternativeUrl: string;
  id: string;
  name: string;
  url: string;
}

interface GlycosylationData {
  glycosylations: Glycosylation[];
  sequence: string;
  sequenceLength: number;
}


interface GlycoConf {
  residueTag: number;
  residueID: number;
  residueName: string;
  residueChain: string;
  glycanIDs: boolean[];
}

interface UniprotData {
  glycosylation_locations: GlycosylationData;
  uniprot: string;
  requestURL: string;
  configuration: [GlycoConf];
}

const ReGlyco = () => {

  const apiUrl = process.env.REACT_APP_API_URL;


  

  const [uniprotID, setUniprotID] = useState<string>("");
  const [UniprotData, setUniprotData] = useState<UniprotData | null>(null);
  const [isUpload, setIsUpload] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState(67);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef(null);
  const [placeholderText, setPlaceholderText] = useState('Enter Uniprot Id');

  const [selectedGlycans, setSelectedGlycans] = useState({});
  const [outputPath, setOutputPath] = useState("");
  const [clashValue, setClashValue] = useState(false);
  const [boxValue, setBoxValue] = useState("");
  const [selectedGlycanImage, setSelectedGlycanImage] = useState<{ [key: number]: string }>({});



  const placeholders = [
    "Enter Uniprot Id",
    "Enter PDB Id",

  ];
  const scrollToRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (outputPath /* condition to check */) {
      // Scroll to the element when the condition is met
      scrollToRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [outputPath]); // Depend on yourVariable to trigger effect


  const fetchProteinData = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/uniprot_swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uniprot: uniprotID.toUpperCase() })
      });

      const data: UniprotData = await response.json();
      setUniprotID(data.uniprot);
      setUniprotData(data);
      setIsUpload(false);
      setSelectedGlycans({});
      setSelectedGlycanImage({});
      setActiveStep(1);
    } catch (error) {
      if (error instanceof Error) {

        try {
          const response = await fetch(`${apiUrl}/api/rcsb_swap`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ uniprot: uniprotID })
          });

          const data: UniprotData = await response.json();
          setUniprotData(data);
          setIsUpload(false);
          setSelectedGlycans({});
          setSelectedGlycanImage({});
          setActiveStep(1);

        } catch (error) {
          if (error instanceof Error) {
            
          } else {
            setError("An unknown error occurred.");
          }
        }
      }
    }
  }


  
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const [id, setId] = useState<string>(queryParams.get('id') || '');

  useEffect(() => {
    // Update uniprotID based on id from the URL
    if (id) {
      setUniprotID(id); // Assuming setId is meant to update uniprotID. If not, directly set uniprotID here if it's stateful.
    }
  
    const debounceDelay = 1000;
  
    const timeoutId = setTimeout(() => {
      const fetchData = async () => {
        try {
          // Now checking for id as well to ensure it triggers when id is set
          if (!isUpload && (uniprotID.length > 3 || id)) {
            await fetchProteinData();
            setScanResults({
              box: '',
              clash: false,
              output: '',
              results: [] 
            });
          }
        } catch (error) {
          console.error("Error fetching protein data:", error);
        }
      };
  
      fetchData();
    }, debounceDelay);
  
    return () => clearTimeout(timeoutId);
  
    // Including id in the dependencies array ensures that the effect runs when id changes
  }, [isUpload, uniprotID, id]); 




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
  },);

  const [value, setValue] = useState<readonly ResidueOption[]>([]);

  const steps = [
    { title: 'Choose Structure', description: 'AF, PDB or upload your own' },
    { title: 'Select Asn residues', description: ' Choose your Asn residues' },
    { title: 'Swap & Download', description: 'Press swap and download pdb structure!' },
  ]


  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  })


  const onChange = (
    newValue: OnChangeValue<ResidueOption, true>,
    actionMeta: ActionMeta<ResidueOption>
  ) => {
    setValue(newValue ? newValue : []);
  };



  useEffect(() => {
    const fetchData = async () => {
      try {
        // Assuming you want to fetch data when upload is not in progress and uniprotID is set
        if (!isUpload && uniprotID) {
          setScanResults({
            box: '',
            clash: false,
            output: '',
            results: [] // Empty results array as initial value
          })

        }
      } catch (error) {
        // Handle or log error
        console.error("Error fetching protein data:", error);
      }
    };

    fetchData();
  }, [isUpload, uniprotID]);


  const [scanResults, setScanResults] = useState<ScanResults | null>({
    box: '',
    clash: false,
    output: '',
    results: [] // Empty results array as initial value
  });


  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {

      const allowedExtensions = [".pdb"]; // Example extensions
      const fileExtension = file.name.slice((Math.max(0, file.name.lastIndexOf(".")) || Infinity) + 1);

      if (!allowedExtensions.includes("." + fileExtension)) {
        console.error("File type not allowed.");
        setError("File type not allowed.");
        return;
      }
      const formData = new FormData();
      formData.append('pdbFile', file);
      setSelectedGlycans({});
      setSelectedGlycanImage({});
      // Other state updates...

      try {
        setIsUploading(true); // Set uploading state to true when upload begins

        const response = await axios.post(`${apiUrl}/api/upload_pdb_swap`, formData, {
          timeout: 600000,
          onUploadProgress: (progressEvent) => {
            const percentage = progressEvent.total ? (progressEvent.loaded * 100) / progressEvent.total : 0;
            setUploadProgress(Math.round(percentage)); // Update progress in state
            console.log(`Upload Progress: ${percentage}%`);
          },
        });

        if (response.status === 200) {
          setUniprotData(response.data);
          console.log(UniprotData?.uniprot);
          setIsUpload(true);
          setActiveStep(1);
          setError(null);
          setIsUploading(false); // Reset uploading state once upload is finished
          setUploadProgress(0);
          const data: UniprotData = response.data;
          setUniprotData(data);
          setSelectedGlycans({});
          setSelectedGlycanImage({});
          setActiveStep(1);
          setScanResults({
            box: '',
            clash: false,
            output: '',
            results: [] // Empty results array as initial value
          })
        } else {
          console.error("Failed to upload file.");
        }
      } catch (error) {
        console.error("Error occurred during file upload:", error);
      }
    }
  };




  const handleToggleChange = (isChecked: boolean, residueID: string, residueTag: number) => {
    // Convert boolean to string if necessary
    const value = isChecked.toString();

    setSelectedGlycans(prevState => ({
      ...prevState,
      [residueID]: value
    }));

    setSelectedGlycanImage(prevState => ({
      ...prevState,
      [residueTag]: value
    }));
  }


  const [isLoading, setIsLoading] = useState(false);


  const handleProcessCustom = async () => {
    setIsLoading(true);  // Start loading
    setActiveStep(2);
    const payload = {
      selectedGlycans: selectedGlycans,
      uniprotID: UniprotData?.uniprot,
      isUpload: isUpload,

    };

    try {
      const response = await fetch(`${apiUrl}/api/process_pdb_swap`, {
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
        setBoxValue(responseData.box)
        setActiveStep(3);  // Move to the 'Download' step after processing
        setElapsedTime(0);
        // console.log(responseData);
        console.log(UniprotData?.uniprot);
        // Handle the response data as needed
      } else {
        console.error("Failed to post data.");
      }
    } catch (error) {
      console.error("Error occurred:", error);
    } finally {
      setIsLoading(false);  // End loading regardless of success or failure
    }
  }




  const [elapsedTime, setElapsedTime] = useState(0);
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000); // Increment elapsed time every second
    }

    // Cleanup: Stop the timer when the component is unmounted or when processing is stopped
    return () => clearInterval(timer);
  }, [isLoading]);




  return (



    <>
      <Flex w="100%"
        align="center"
        justify="center"
        flex="1"
        padding="0em"
        minHeight={{ base: "15vh" }}
        sx={{
          backgroundImage: `
                radial-gradient(
                  circle, 
                  rgba(247 , 250, 220, 0.2)20%, 
                  rgba(247 , 250, 220, 0.6) 100%
                ), 
                url(${bg})`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "50% 30%"
        }}
        backgroundRepeat="no-repeat" justifyContent="center" alignItems="center" p={1}
        direction={{ base: "column", sm: "column", md: "row", lg: "row", xl: "row" }}
      >
        <Text
          bgGradient='linear(to-l, #E2CE69,#E2CE69)'
          bgClip='text'
          fontSize={{ base: "4xl", sm: "4xl", md: "5xl", lg: "5xl", xl: "5xl" }}

          marginBottom="0.2em"
        >
          <Link fontWeight="bold" fontFamily={'heading'} href="/swap" marginRight="20px">Swap Atoms</Link>
        </Text>





        <Box position="relative" display="inline-block" ml="2rem" alignItems="center">
          {!isUploading ? (
            <>
              <Button as="label" backgroundColor="#E2CE69" _hover={{ backgroundColor: "#E2CE69" }} size="md" w="full">
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
            </>
          ) : (
            <CircularProgress
              isIndeterminate
              // value={uploadProgress}
              color="#E2CE69"
              size="50px"
              thickness="5px"
              capIsRound
            >
              <CircularProgressLabel>{uploadProgress}%</CircularProgressLabel>
            </CircularProgress>
          )}
        </Box>


      </Flex>



      {/* Rest of the content */}
      <VStack spacing={4} w="100%" p={2} justify={'left'}>
        {UniprotData && (
          <Flex w="100%" justifyContent="left" alignItems="center" p={2} marginTop={"0"} direction="column"  >
            <Flex w="100%"
              align="center"
              justify="center"
              flex="1"
              padding="2rem" paddingTop={'0rem'} direction={{ base: "column", sm: "column", md: "row", lg: "row", xl: "row" }}>
              <Heading margin={"0rem"} marginLeft={"0"} marginBottom={'0rem'} as='h4' size='xl'>  {isUpload ? "File:" : `Uniprot/PDB ID: `} {UniprotData.uniprot}</Heading>

              <Spacer />
              <Box >
                <Stepper width={{ base: "0%", sm: "0%", md: "auto", lg: "auto", xl: "auto" }} visibility={{ base: "hidden", sm: "hidden", md: "visible", lg: "visible", xl: "visible" }} margin="1rem" size={{ base: "sm", sm: "sm", md: "sm", lg: "md", xl: "md" }} colorScheme='yellow' index={activeStep}>
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
                        <Hide below="lg">
                          <StepDescription>{step.description}</StepDescription></Hide>
                      </Box>

                      <StepSeparator />
                    </Step>
                  ))}
                </Stepper>
              </Box>
            </Flex>

            <Accordion marginTop={"-2rem"} w="90%" defaultIndex={[0]} allowMultiple>

              <AccordionItem>

                <h2>
                  <AccordionButton margin={"1rem"} marginLeft={"0"} >
                    <Box as="span" flex='1' textAlign='left'>
                      <Heading as='h4' size='md' color={"#E2CE69"}>Structure Information</Heading>
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel>
                  {!isUpload ? (
                    <SimpleGrid alignSelf="center" justifyItems="center" templateColumns={{ base: '1fr', lg: '30% 70%' }} spacing={0} paddingTop={'1rem'} paddingBottom={'2rem'}>

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
                        width="100%"
                        height="400px"

                        src={isUpload ?
                          `/viewer/embedded.html?pdbUrl=${UniprotData.requestURL}&format=pdb` :
                          `/viewer/embedded.html?pdbUrl=${UniprotData.requestURL}&format=mmcif`
                        }
                        allowFullScreen
                        title="Protein Structure"
                      /></SimpleGrid>

                  ) : (<SimpleGrid alignSelf="center" justifyItems="center" templateColumns={{ base: '1fr', lg: '100% 0%' }} spacing={0} paddingTop={'0rem'} paddingBottom={'2rem'}>


                    <iframe
                      key={isUpload ? "uploaded" : UniprotData.requestURL}
                      width="100%"
                      height="400px"

                      src={isUpload ?
                        `/viewer/embedded.html?pdbUrl=${UniprotData.requestURL}&format=pdb` :
                        `/viewer/embedded.html?pdbUrl=${UniprotData.requestURL}&format=mmcif`
                      }
                      allowFullScreen
                      title="Protein Structure"
                    /></SimpleGrid>)}

                </AccordionPanel>
              </AccordionItem>

              
                <div>
                  <Heading margin={'1rem'} marginBottom={'1rem'} fontSize={{ base: "1xl", sm: "1xl", md: "1xl", lg: "2xl", xl: "2xl" }} >
                    Select residues to swap
                  </Heading>
                  <Select
                    value={value}
                    isMulti
                    name="residues"
                    className="basic-multi-select"
                    classNamePrefix="select"
                    onChange={onChange}
                    // onSelectResetsInput = {false}
                    closeMenuOnSelect={false}

                    options={UniprotData?.configuration?.map((glycoConf: GlycoConf) => ({
                      value: glycoConf.residueTag,
                      label: `${glycoConf.residueName}${glycoConf.residueID}${glycoConf.residueChain}`
                    }))}
                  />

                  {UniprotData?.configuration && UniprotData.configuration.map((glycoConf: GlycoConf, index: number) => {
                    const isSelected = value.find(option => option.value === glycoConf.residueTag);
                    return isSelected ? (
                      <div key={index}>
                        <HStack>
                          <Heading margin={'0.5rem'} fontSize={{ base: "1xl", sm: "1xl", md: "1xl", lg: "1xl", xl: "1xl" }} id={`glycan-${index}`} fontFamily={'texts'}>
                            {`Residue: ${glycoConf.residueName}${glycoConf.residueID}${glycoConf.residueChain}`}
                          </Heading>
                          <FormControl display="flex" alignItems="center">
                            <FormLabel htmlFor="glycan-switch" mb="0" fontWeight="normal" color={"#1A202C"}>
                              {selectedGlycanImage[glycoConf.residueTag] ? 'True' : 'False'}
                            </FormLabel>
                            <Switch
                              id="glycan-switch"
                              colorScheme="yellow"
                              isChecked={selectedGlycanImage[glycoConf.residueTag] === "true"}
                              onChange={(e) =>
                                handleToggleChange(
                                  e.target.checked,
                                  `${glycoConf.residueID}_${glycoConf.residueChain}`,
                                  glycoConf.residueTag
                                )
                              }
                            />

                          </FormControl>


                        </HStack>
                      </div>
                    ) : null;
                  })}

                  <Button
                    position={"relative"}
                    margin={'1rem'}
                    borderRadius="full"
                    backgroundColor="#F7F9E5"
                    _hover={{ backgroundColor: "#E2CE69" }}
                    size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}
                    onClick={handleProcessCustom}
                    isDisabled={isLoading} // Disable the button while processing
                  >
                    {isLoading ? (
                      <Box position="relative" display="inline-flex" alignItems="center" justifyContent="center">
                        <CircularProgress
                          position="absolute"
                          color="#E2CE69"
                          size="50px"
                          thickness="5px"
                          isIndeterminate
                          marginLeft={"15rem"}
                          capIsRound
                        >
                          <CircularProgressLabel>{elapsedTime}</CircularProgressLabel>
                        </CircularProgress>
                        Processing...


                      </Box>
                    ) : (
                      "Process"
                    )}
                  </Button>
                  {isLoading && (<Alert status='info' >
                    <AlertIcon />
                    It can take up to 1 minutes to process your request. Please wait.
                  </Alert>)}





                  <br /></div>




              {outputPath && (
                <Box ref={scrollToRef}>
                  {clashValue ? (
                    <Alert status='warning'>
                      <AlertIcon />
                      Clash detected! Structure orientation for some spots are not glycan friendly.  </Alert>
                  ) : (
                    <Alert status='success'>
                      <AlertIcon />
                      Processed!
                    </Alert>
                  )}

                  <iframe
                    // key={sequence}
                    width="100%"
                    height="400px"
                    src={`/viewer/embedded.html?pdbUrl=${apiUrl}/output/${outputPath}&format=pdb`} frameBorder="0"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Protein Structure"
                  />
                  <a href={`${apiUrl}/output/${outputPath}`} download>
                    <Button position={"relative"}
                      margin={'1rem'}
                      borderRadius="full"
                      isDisabled={isLoading}
                      backgroundColor="#F7F9E5"
                      _hover={{
                        backgroundColor: "#E2CE69"
                      }}
                      size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}>

                      Download Swapped Structure PDB File
                    </Button></a> <Text fontWeight="bold">Processing log:</Text><Code>
                    {boxValue.split('\n').map((line, index) => (
                      <React.Fragment key={index}>
                        {line}
                        <br />
                      </React.Fragment>
                    ))}
                  </Code>
                </Box>
              )}
            </Accordion>


          </Flex>
        )}
        {!UniprotData && (

          <Flex w="100%" minHeight={'60vh'} justifyContent="left" alignItems="left" p={2} marginTop={"0"} direction="column" >
            <Flex w="100%"

              justify="center"
              flex="1"
              padding="0rem" paddingTop={'0rem'} direction={{ base: "column", sm: "column", md: "row", lg: "row", xl: "row" }}>
              <Text
                bgGradient='linear(to-l,  #E2CE69, #D7C9C0)'
                bgClip='text'
                fontSize={{ base: "3xl", sm: "3xl", md: "4xl", lg: "5xl", xl: "5xl" }}
                fontWeight='bold'
                marginBottom="0.2em"
                marginLeft={'2rem'}
              >
                Swap
              </Text>

              <Spacer />
              <Box >
                <Stepper width={{ base: "0%", sm: "0%", md: "auto", lg: "auto", xl: "auto" }} visibility={{ base: "hidden", sm: "hidden", md: "visible", lg: "visible", xl: "visible" }} margin="1rem" size={{ base: "sm", sm: "sm", md: "sm", lg: "md", xl: "md" }} colorScheme='yellow' index={activeStep}>
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
                        <Hide below="lg">
                          <StepDescription>{step.description}</StepDescription></Hide>
                      </Box>

                      <StepSeparator />
                    </Step>
                  ))}
                </Stepper>

              </Box>
            </Flex>


            <SimpleGrid alignSelf="center" justifyItems="center" columns={[1, 2]} spacing={0} paddingTop={'1rem'} paddingBottom={'2rem'}>


            </SimpleGrid>


          </Flex>


        )}

        {error && (
          <Text color="red.500" textAlign="center">
            {error}
          </Text>
        )}
      </VStack>
    </>
  );
}



export default ReGlyco;
