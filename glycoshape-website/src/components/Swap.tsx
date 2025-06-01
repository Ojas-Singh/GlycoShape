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
  value: number; // This usually corresponds to residueTag
}

// Updated Interfaces to align with ReGlyco2.tsx and the /api/reglyco/init endpoint
interface UniProtGlycosylation {
  begin: string;
  category: string;
  description: string;
  end: string;
  evidences?: { code: string }[];
  ftId?: string;
  molecule?: string;
  type: string;
}

interface GlycosylationSite {
  residueTag: number;
  residueID: number;
  residueName: 'ASN' | 'SER' | 'THR' | 'HYP' | 'PRO' | 'TRP' | 'CYS';
  residueChain: string;
}

interface ProtData {
  id: string; // Canonical ID (Uniprot ID or generated for upload)
  filename: string; // Original filename for uploads
  requestURL: string; // URL for fetching PDB/CIF, or data URL for uploads
  sequence: string;
  glycosylation: {
    available: GlycosylationSite[]; // All potential sites
    uniprot: UniProtGlycosylation[]; // Sites reported by UniProt
  };
  // configurations might not be needed if Swap only deals with ASN and doesn't show glycan options
}


const Swap = () => {

  const apiUrl = process.env.REACT_APP_API_URL;


  

  const [protID, setProtID] = useState<string>(""); // Stores the ID used for fetching or the ID from uploaded file
  const [protData, setProtData] = useState<ProtData | null>(null);
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
      const response = await fetch(`${apiUrl}/api/reglyco/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ protID: protID, isUpload: false })
      });

      if (!response.ok) {
        // Try PDB ID if Uniprot ID failed or if it was a PDB ID initially
        const pdbResponse = await fetch(`${apiUrl}/api/reglyco/init`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ protID: protID, isUpload: false, isPDB: true }) // Assuming backend can check PDB
        });
        if (!pdbResponse.ok) {
          throw new Error(`Failed to fetch data for ID: ${protID}`);
        }
        const pdbData: ProtData = await pdbResponse.json();
        setProtID(pdbData.id);
        setProtData(pdbData);

      } else {
        const data: ProtData = await response.json();
        setProtID(data.id); // data.id should be the canonical ID from backend
        setProtData(data);
      }
      
      setIsUpload(false);
      setSelectedGlycans({});
      setSelectedGlycanImage({}); // Reset this if it's used for visual cues
      setActiveStep(1);
      setError(null);
    } catch (error) {
      if (error instanceof Error) {
        setError(`Error fetching protein data: ${error.message}`);
        setProtData(null);
      } else {
        setError("An unknown error occurred while fetching protein data.");
        setProtData(null);
      }
    }
  }


  
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const [id, setId] = useState<string>(queryParams.get('id') || '');

  // Add new state variables for URL parameters
  const [urlIsUpload, setUrlIsUpload] = useState<boolean>(queryParams.get('isUpload') === 'true');
  const [urlClashingResidues, setUrlClashingResidues] = useState<string[]>([]);

  useEffect(() => {
    // Parse URL parameters
    const idParam = queryParams.get('id');
    const isUploadParam = queryParams.get('isUpload');
    const clashingResiduesParam = queryParams.get('clashingResidues');

    if (idParam) {
      // setId(idParam); // id state might be redundant if protID is the primary one
      setProtID(idParam); // Set protID to trigger fetch if needed
    }

    if (isUploadParam) {
      const uploadStatus = isUploadParam === 'true';
      setUrlIsUpload(uploadStatus);
      setIsUpload(uploadStatus); // Set main isUpload state
    }

    if (clashingResiduesParam) {
      try {
        const decodedClashingResidues = JSON.parse(decodeURIComponent(clashingResiduesParam));
        setUrlClashingResidues(decodedClashingResidues);
      } catch (error) {
        console.error("Failed to parse clashingResidues parameter:", error);
      }
    }
  }, [location.search]);

  // Add useEffect to auto-select clashing residues after UniprotData is loaded
  useEffect(() => {
    if (protData?.glycosylation?.available && urlClashingResidues.length > 0) {
      const matchingOptions: ResidueOption[] = [];
      const matchingSelections: { [key: string]: string } = {};
      const matchingImageSelections: { [key: number]: string } = {}; // If used

      urlClashingResidues.forEach(residueString => {
        const [residueIdStr, chain] = residueString.split('_');
        
        const matchingSite = protData.glycosylation.available.find(site =>
          site.residueName === 'ASN' &&
          site.residueID.toString() === residueIdStr &&
          site.residueChain === chain
        );

        if (matchingSite) {
          matchingOptions.push({
            value: matchingSite.residueTag,
            label: `${matchingSite.residueName}${matchingSite.residueID}${matchingSite.residueChain}`
          });
          matchingSelections[`${matchingSite.residueID}_${matchingSite.residueChain}`] = "true";
          matchingImageSelections[matchingSite.residueTag] = "true"; // if selectedGlycanImage is for visual toggle state
        }
      });

      if (matchingOptions.length > 0) {
        setValue(matchingOptions);
        setSelectedGlycans(matchingSelections);
        setSelectedGlycanImage(matchingImageSelections);
      }
    }
  }, [protData, urlClashingResidues]);



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
        // Fetch data if protID is set (e.g., from URL) and not an upload flow initially
        if (protID && !isUpload && !protData) { // Added !protData to prevent re-fetch on param change if data exists
          await fetchProteinData();
        }
        // Reset scan results if it's not an upload or if protID changes
        // This part might need adjustment based on how scanResults is used in Swap
        if ((!isUpload || protID) && scanResults) { // Condition to reset scanResults
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
  }, [isUpload, protID]);


  const [scanResults, setScanResults] = useState<ScanResults | null>({
    box: '',
    clash: false,
    output: '',
    results: [] // Empty results array as initial value
  });


  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {

      const allowedExtensions = [".pdb", ".cif"]; // Allow PDB and CIF
      const fileExtension = file.name.slice((Math.max(0, file.name.lastIndexOf(".")) || Infinity) + 1).toLowerCase();

      if (!allowedExtensions.includes("." + fileExtension)) {
        console.error("File type not allowed.");
        setError("File type not allowed.");
        return;
      }
      const formData = new FormData();
      formData.append('pdbFile', file); // Changed from 'protFile' to 'pdbFile' if backend expects that for swap init
      // If backend /api/reglyco/init uses 'protFile', keep it as 'protFile'
      // For consistency with ReGlyco2, 'protFile' is likely correct.
      formData.append('protFile', file);


      setSelectedGlycans({});
      setSelectedGlycanImage({});
      // Other state updates...

      try {
        setIsUploading(true); 

        const response = await axios.post(`${apiUrl}/api/reglyco/init`, formData, {
          timeout: 600000,
          onUploadProgress: (progressEvent) => {
            const percentage = progressEvent.total ? (progressEvent.loaded * 100) / progressEvent.total : 0;
            setUploadProgress(Math.round(percentage)); // Update progress in state
            console.log(`Upload Progress: ${percentage}%`);
          },
        });

        if (response.status === 200) {
          const data: ProtData = response.data;
          setProtData(data);
          setProtID(data.id); // Set protID from the response
          setIsUpload(true);
          setActiveStep(1);
          setError(null);
          setIsUploading(false); // Reset uploading state once upload is finished
          setUploadProgress(0);
          // const data: ProtData = response.data; // This is a redeclaration
          // setProtData(data); // Already set above
          setSelectedGlycans({});
          setSelectedGlycanImage({});
          // setActiveStep(1); // Already set above
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
      filename:  protData?.filename,
      customPDB: isUpload,
      jobType: "swap",
    };

    try {
      const response = await fetch(`${apiUrl}/api/reglyco/job`, {
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
        console.log(protData?.id); // Changed from protData?.uniprot to protData?.id
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
        {protData && (
          <Flex w="100%" justifyContent="left" alignItems="center" p={2} marginTop={"0"} direction="column"  >
            <Flex w="100%"
              align="center"
              justify="center"
              flex="1"
              padding="2rem" paddingTop={'0rem'} direction={{ base: "column", sm: "column", md: "row", lg: "row", xl: "row" }}>
              <Heading margin={"0rem"} marginLeft={"0"} marginBottom={'0rem'} as='h4' size='xl'>  {isUpload ? `File: ${protData.filename}` : `ID: ${protData.id}`}</Heading>

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
                        key={isUpload ? protData.filename : protData.requestURL}
                        width="100%"
                        height="400px"

                        src={`/viewer/embedded.html?pdbUrl=${protData.requestURL}&format=${protData.requestURL.endsWith('.pdb') ? 'pdb' : 'mmcif'}`}
                        allowFullScreen
                        title="Protein Structure"
                      /></SimpleGrid>

                  ) : (<SimpleGrid alignSelf="center" justifyItems="center" templateColumns={{ base: '1fr', lg: '100% 0%' }} spacing={0} paddingTop={'0rem'} paddingBottom={'2rem'}>


                    <iframe
                      key={isUpload ? protData.filename : protData.requestURL}
                      width="100%"
                      height="400px"

                      src={`/viewer/embedded.html?pdbUrl=${protData.requestURL}&format=${protData.requestURL.endsWith('.pdb') ? 'pdb' : 'mmcif'}`}
                      allowFullScreen
                      title="Protein Structure"
                    /></SimpleGrid>)}

                </AccordionPanel>
              </AccordionItem>

              
                <div>
                  <Heading margin={'1rem'} marginBottom={'1rem'} fontSize={{ base: "1xl", sm: "1xl", md: "1xl", lg: "2xl", xl: "2xl" }} >
                    Select clashed residues
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

                    options={protData?.glycosylation?.available
                      ?.filter(site => site.residueName === 'ASN')
                      .map((asnSite: GlycosylationSite) => ({
                        value: asnSite.residueTag,
                        label: `${asnSite.residueName}${asnSite.residueID}${asnSite.residueChain}`
                      })) || []}
                  />

                  {protData?.glycosylation?.available
                    .filter(site => site.residueName === 'ASN') // Process only ASN sites
                    .map((asnSite: GlycosylationSite) => {
                      const isSelected = value.find(option => option.value === asnSite.residueTag);
                      return isSelected ? (
                        <div key={asnSite.residueTag}>
                          <HStack>
                            <Heading margin={'0.5rem'} fontSize={{ base: "1xl", sm: "1xl", md: "1xl", lg: "1xl", xl: "1xl" }} id={`glycan-${asnSite.residueTag}`} fontFamily={'texts'}>
                              {`Residue: ${asnSite.residueName}${asnSite.residueID}${asnSite.residueChain}`}
                            </Heading>
                            <FormControl display="flex" alignItems="center">
                              <FormLabel htmlFor={`swap-switch-${asnSite.residueTag}`} mb="0" fontWeight="normal" color={"#1A202C"}>
                                {selectedGlycanImage[asnSite.residueTag] === "true" ? 'Swap ND2 and OD1' : 'Do not swap'}
                              </FormLabel>
                              <Switch
                                id={`swap-switch-${asnSite.residueTag}`}
                                colorScheme="yellow"
                                isChecked={selectedGlycanImage[asnSite.residueTag] === "true"}
                                onChange={(e) =>
                                  handleToggleChange(
                                    e.target.checked,
                                    `${asnSite.residueID}_${asnSite.residueChain}`, // Key for selectedGlycans
                                    asnSite.residueTag // Key for selectedGlycanImage
                                  )
                                }
                              />
                            </FormControl>
                          </HStack>
                        </div>
                      ) : null;
                    })}
<Text color='#B195A2' alignSelf={"left"} fontSize={'xs'}>
             Flip the toggle button to swap the atoms.
            </Text>
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
        {!protData && (

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
                Swap ASN Side-Chain Atoms
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


            <SimpleGrid alignSelf="center" justifyItems="center" columns={[1, 1]} spacing={4} paddingTop={'1rem'} paddingBottom={'2rem'} px={'2rem'}>
              <Box>
                <Text fontFamily={'texts'} color='#B195A2' justifySelf="left" align={'left'} fontSize={'lg'}>
                  The Swap Atoms tool is designed to address steric clashes involving asparagine (ASN) residues, particularly in the context of N-glycosylation.
                  When an ASN side-chain is oriented unfavorably, it can lead to clashes with attached glycans or surrounding protein structure.
                </Text>
                <Text fontFamily={'texts'} color='#B195A2' justifySelf="left" align={'left'} fontSize={'lg'} mt={2}>
                  This tool attempts to resolve such clashes by swapping the positions of the ND2 and OD1 atoms in the amide group of the specified ASN residue(s).
                  This effectively rotates the amide plane by 180 degrees, which can often alleviate the steric hindrance without significantly altering the local backbone conformation.
                </Text>
                <Text fontFamily={'texts'} color='#B195A2' justifySelf="left" align={'left'} fontSize={'lg'} mt={2}>
                  Upload your PDB/CIF structure or enter a UniProt/PDB ID to begin. If you are coming from the ReGlyco2 GlcNAc scan, clashing ASN residues will be pre-selected for swapping.
                </Text>
              </Box>
              {/* You can add an illustrative image or video here if desired */}
              {/* <video width={'50%'} autoPlay loop muted> <source src="/path_to_swap_video.mp4" type="video/mp4" /> </video> */}
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



export default Swap;
