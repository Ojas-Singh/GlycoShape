import React, { useState, ChangeEvent, useEffect, useRef, } from 'react';
import { useBreakpointValue } from "@chakra-ui/react";
import axios from 'axios';

import {

  useToast, Hide, SimpleGrid, Input, Text, Button, VStack, HStack, Link, Flex, Code, Heading, Accordion,
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
  useSteps, Badge, Box, Image,
  Alert,
  AlertIcon,
  Menu, MenuButton, MenuItem, MenuList
} from '@chakra-ui/react';
import { AttachmentIcon } from '@chakra-ui/icons'
import { Kbd } from '@chakra-ui/react';
import bg from './assets/gly.png';
import fit from './assets/fit.png'
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
  glycanIDs: string[];
}

interface UniprotData {
  glycosylation_locations: GlycosylationData;
  uniprot: string;
  requestURL: string;
  configuration: [GlycoConf];
}

const ReGlyco = () => {

  const apiUrl = process.env.REACT_APP_API_URL;
  const isDevelopment = process.env.REACT_APP_BUILD_DEV === "true";

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
  const [fitPath, setFitPath] = useState("");
  const [plotPath, setPlotPath] = useState("");
  const [clashValue, setClashValue] = useState(false);
  const [boxValue, setBoxValue] = useState("");
  const [selectedGlycanImage, setSelectedGlycanImage] = useState<{ [key: number]: string }>({});
  const toast = useToast()
  type ProcessType = 'handleProcessOne_scan' |'handleProcessOne' | 'handleProcess_shot' | 'handleProcess' | 'handleProcessCustom';
  const [lastRunType, setLastRunType] = useState<ProcessType>('handleProcessOne');
  const getCurrentHandler = () => {
    switch (lastRunType) {
        
        default:
            return () => {};
    }
};




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



  useEffect(() => {
    fetch(`${apiUrl}/database/GLYCAN_TYPE.json`)
      .then((response) => response.json())
      .then((data) => {
        if (data.N) {
          setGlycanOptions(data.N); // assuming data.N is an array of the desired structure
        }
      })
      .catch((error) => {
        console.error("Error fetching glycan options:", error);
      });
  }, []);

  const [glycanOptions, setGlycanOptions] = useState<
    string[]
  >([]);

  const [selectedGlycanOption, setSelectedGlycanOption] = useState<string | null>(null);


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
  }, []);


  const trimLength = useBreakpointValue({
    base: 10,
    sm: 10,
    md: 40,
    lg: 90,
    xl: 90
  }) ?? 0; // Fallback to 40 if undefined


  const [value, setValue] = useState<readonly ResidueOption[]>([]);

  const steps = [
    { title: 'Upload Structure', description: 'AF, PDB or upload your own' },
    { title: 'Select Glycans', description: 'and upload SAXS/density file' },
    { title: 'Download', description: 'Press process and download Re-Glyco-Fit structure!' },
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
    // setSelectedGlycans({});
    // setSelectedGlycanImage({});
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();  // Prevents the default form submission behavior
    setIsUpload(false);
    fetchProteinData();

  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Assuming you want to fetch data when upload is not in progress and uniprotID is set
        if (!isUpload && uniprotID) {
          await fetchProteinData();
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

  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isCcp4File, setIsCcp4File] = useState(false);

  const handleFitFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {

      const allowedExtensions = [".dat",".mrc",".ccp4", ".map"]; // Example extensions
      const fileExtension = file.name.slice((Math.max(0, file.name.lastIndexOf(".")) || Infinity) + 1);

      if (!allowedExtensions.includes("." + fileExtension)) {
        console.error("File type not allowed.");
        setError("File type not allowed.");
        return;
      }
      const isCcp4 = fileExtension === 'ccp4' || fileExtension === 'mrc' || fileExtension === 'map';
      setIsCcp4File(isCcp4);
      const formData = new FormData();
      formData.append('pdbFile', file);


      try {
        setIsUploading(true); // Set uploading state to true when upload begins

        const response = await axios.post(`${apiUrl}/api/upload_fit`, formData, {
          timeout: 600000,
          onUploadProgress: (progressEvent) => {
            const percentage = progressEvent.total ? (progressEvent.loaded * 100) / progressEvent.total : 0;
            setUploadProgress(Math.round(percentage)); // Update progress in state
            console.log(`Upload Progress: ${percentage}%`);
          },
        });

        if (response.status === 200) {
          setUploadedFileName(file.name);
          setIsUploading(false);
          setUploadProgress(0);
          setError(null);
          
        } else {
          console.error("Failed to upload file.");
        }
      } catch (error) {
        console.error("Error occurred during file upload:", error);
      }
    }
  };
  

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

        const response = await axios.post(`${apiUrl}/api/upload_pdb`, formData, {
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







  const fetchProteinData = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/uniprot`, {
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

        try {
          const response = await fetch(`${apiUrl}/api/rcsb`, {
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
            toast({
              title: 'Wrong uniprot id or pdb id',
              description: "Please check your input and try again.",
              status: 'error',
              duration: 4000,
              isClosable: true,
            })
          } else {
            setError("An unknown error occurred.");
          }
        }
      }
    }
  }



  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>, residueID: string, residueTag: number) => {
    const value = event.target.value;
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


 
  const handleProcessFit = async () => {
    setIsLoading(true);  // Start loading
    setActiveStep(2);
    const payload = {
      selectedGlycans: selectedGlycans,
      filename: UniprotData?.uniprot,
      customPDB: isUpload,
      fitFile: uploadedFileName
    };

    try {
      const response = await fetch(`${apiUrl}/api/process_pdb_saxs`, {
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
        setPlotPath(responseData.plotfit)
        setFitPath(responseData.fit)
        setActiveStep(3);  // Move to the 'Download' step after processing
        setElapsedTime(0);
        setLastRunType('handleProcessCustom');
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
                  rgba(177, 114, 150, 0.2) 0%, 
                  rgba(33, 115, 165, 0.6) 100%
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
          bgGradient='linear(to-l, #F7FFE6, #F7FFE6)'
          bgClip='text'
          fontSize={{ base: "4xl", sm: "4xl", md: "5xl", lg: "5xl", xl: "5xl" }}

          marginBottom="0.2em"
        >
          <Link fontWeight="bold" fontFamily={'heading'} href="/fit" marginRight="20px">Re-Glyco Fit</Link>
        </Text>

        <Flex width="40%" minWidth={{ base: "70%", md: "40%" }} align="center" position="relative" gap="1em" boxShadow="xl" borderRadius="full" overflow="hidden" p="0.5em" bg="white">

          <form onSubmit={handleSearch}>
            <Input
              onChange={(e) => {
                setUniprotID(e.target.value);
                setIsUpload(false);
              }}
              // onChange={(e) => (setUniprotID(e.target.value), setIsUpload(false))}
              ref={searchRef}
              fontFamily={'texts'}
              placeholder={placeholderText}
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
            right={{ base: "1rem", sm: "1rem", md: "5rem", lg: "7rem", xl: "7rem" }}
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
            backgroundColor="#81D8D0"
            _hover={{
              backgroundColor: "#008081"
            }}
            size={{ base: "md", sm: "md", md: "md", lg: "md", xl: "md" }}
            onClick={(handleSearch)}
          >
            Fetch
          </Button>
        </Flex>

        <Text
          marginLeft={"2rem"}
          bgGradient='linear(to-l, #008081, #008081)'
          bgClip='text'
          fontSize={{ base: "2xl", sm: "2xl", md: "2xl", lg: "2xl", xl: "2xl" }}
          alignItems="center"
          fontWeight='extrabold'
          marginBottom="0.2em"
        >
          or
        </Text>
        <Box position="relative" display="inline-block" ml="2rem" alignItems="center">
          {!isUploading ? (
            <>
              <Button as="label" backgroundColor="#81D8D0" _hover={{ backgroundColor: "#008081" }} size="md" w="full">
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
              color="#81D8D0"
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
                <Stepper width={{ base: "0%", sm: "0%", md: "auto", lg: "auto", xl: "auto" }} visibility={{ base: "hidden", sm: "hidden", md: "visible", lg: "visible", xl: "visible" }} margin="1rem" size={{ base: "sm", sm: "sm", md: "sm", lg: "md", xl: "md" }} colorScheme='teal' index={activeStep}>
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
                      <Heading as='h4' size='md' color={"#2C7A7B"}>Structure Information</Heading>
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

                      src={isCcp4File ?
                        `/viewer/embeddedfit.html?pdbUrl=${UniprotData.requestURL}&densityUrl=${apiUrl}/output/${uploadedFileName}` :
                        `/viewer/embeddedfit.html?pdbUrl=${UniprotData.requestURL}`
                      }
                      allowFullScreen
                      title="Protein Structure"
                    /></SimpleGrid>)}

                </AccordionPanel>
              </AccordionItem>

              
                <div>

<Heading margin={'1rem'} marginBottom={'1rem'} fontFamily={'texts'} color='#2C7A7B' fontSize={{ base: "1xl", sm: "1xl", md: "1xl", lg: "2xl", xl: "2xl" }} >
                        Select residues to glycosylate
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
                              <Heading margin={'1rem'} fontSize={{ base: "1xl", sm: "1xl", md: "1xl", lg: "2xl", xl: "2xl" }} id={`glycan-${index}`} fontFamily={'texts'}>
                                {`Residue: ${glycoConf.residueName}${glycoConf.residueID}${glycoConf.residueChain}`}
                              </Heading>



                              <Menu>
                                <MenuButton as={Button} bgColor={"#81D8D0"} _hover={{
                                  backgroundColor: "#008081"
                                }} width="70%" color={"#1A202C"}>
                                  {selectedGlycanImage[glycoConf.residueTag] ? selectedGlycanImage[glycoConf.residueTag].substring(0, trimLength) + "..." : 'select Glycan'}
                                </MenuButton>
                                <MenuList maxHeight="300px" overflowY="auto">
                                  {glycoConf.glycanIDs.map((glycanID, glycanIndex) => (
                                    <MenuItem
                                      key={glycanIndex}
                                      value={glycanID}
                                      onClick={() =>
                                        handleSelectChange(
                                          { target: { value: glycanID } } as any,
                                          `${glycoConf.residueID}_${glycoConf.residueChain}`,
                                          glycoConf.residueTag
                                        )
                                      }

                                    >
                                      <Image
                                        src={`${apiUrl}/database/${glycanID}/${glycanID}.svg`}
                                        alt="Glycan Image"
                                        height="80px"
                                        maxWidth={"90%"}
                                        mr={2}
                                      />
                                      {/* {glycanID.length > 40 ? glycanID.substring(0, trimLength) + "..." : glycanID} */}
                                      {glycanID}
                                    </MenuItem>
                                  ))}
                                </MenuList>
                              </Menu>

                              {selectedGlycanImage[glycoConf.residueTag] && (
                                <Link href={`/glycan?IUPAC=${selectedGlycanImage[glycoConf.residueTag]}`}>
                                  <Image
                                    src={`${apiUrl}/database/${selectedGlycanImage[glycoConf.residueTag]}/${selectedGlycanImage[glycoConf.residueTag]}.svg`}
                                    alt="Glycan Image"
                                    width="150px"
                                  /></Link>
                              )}
                            </HStack>
                          </div>
                        ) : null;
                      })}

<br></br>

<VStack align={"self-start"}>

<Box position="relative" display="inline-block" ml="1rem" alignItems="center">

          <Button colorScheme='teal' variant='outline' as="label" borderRadius="full"  size="md">
            {!uploadedFileName ? (<div>Upload your Experimental data file</div> ):(<div><AttachmentIcon /> {uploadedFileName}</div>)}
            
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
            onChange={handleFitFileUpload}
          />
</Box>
<Text color='#B195A2' alignSelf={"left"} fontSize={'xs'}>
              Based on uploaded file extenstion  (.dat or .ccp4) Re-Glyco-Fit will do SAXS data fitting from generated ensembles or fit the glycans in the density map.  </Text>

                      <Button
                        position={"relative"}
                        margin={'1rem'}
                        borderRadius="full"
                        backgroundColor="#81D8D0"
                        _hover={{ backgroundColor: "#008081" }}
                        size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}
                        onClick={handleProcessFit }
                        isDisabled={isLoading} // Disable the button while processing
                      >
                        {isLoading ? (
                          <Box position="relative" display="inline-flex" alignItems="center" justifyContent="center">
                            <CircularProgress
                              position="absolute"
                              color="#81D8D0"
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
                        It can take up to 5 minutes to process your request. Please wait. <br /> Please be advised that in the case of multiple users running simultaneously, your Re-Glyco job may take longer than expected.
                      </Alert>)}



                      </VStack>


                </div>



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

                    
                 
                  <div>
                  <iframe
                    // key={sequence}
                    width="100%"
                    height="400px"
                    // src={`/viewer/embedded.html?pdbUrl=${apiUrl}/output/${outputPath}&format=pdb`} 
                    src ={
                      isCcp4File ?
                        `/viewer/embeddedfit.html?pdbUrl=${apiUrl}/output/${outputPath}&densityUrl=${apiUrl}/output/${uploadedFileName}` :
                        `/viewer/embeddedfit.html?pdbUrl=${apiUrl}/output/${outputPath}`
                    }
                    
                    frameBorder="0"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Protein Structure"
                  />
                  
                  
                <div>
                   <a href={`${apiUrl}/output/${outputPath}`} download>
              <Button position={"relative"}
                margin={'1rem'}
                borderRadius="full"
                isDisabled={isLoading}
                backgroundColor="#81D8D0"
                _hover={{
                  backgroundColor: "#008081"
                }}
                size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}>

                Download Re-glycosylated Structure PDB File
              </Button>
              </a>
              
              {!isCcp4File && (
        <div>
          <a href={`${apiUrl}/output/${fitPath}`} download>
            <Button
              position={"relative"}
              margin={'1rem'}
              borderRadius="full"
              isDisabled={isLoading}
              backgroundColor="#81D8D0"
              _hover={{ backgroundColor: "#008081" }}
              size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}
            >
              Download SAXS Fit File
            </Button>
          </a>

          <Image
            width={'auto'}
            maxHeight={"40rem"}
            src={`${apiUrl}/output/${plotPath}`}
            alt="FOXS SAXS Fit"
          />
        </div>
      )}
                                       </div>

                                      
            

                    <Text color='#B195A2' alignSelf={"left"} fontSize={'xs'}>
             If you encounter any issues or suspect a bug contact us <Link href="mailto:OJAS.SINGH.2023@mumail.ie">here</Link> 
            </Text>
                     </div>
                  



                  
          
                    
                    <Text fontWeight="bold">Processing log:</Text><Code>
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
                bgGradient='linear(to-l,  #81D8D0, #D7C9C0)'
                bgClip='text'
                fontSize={{ base: "3xl", sm: "3xl", md: "4xl", lg: "5xl", xl: "5xl" }}
                fontWeight='bold'
                marginBottom="0.2em"
                marginLeft={'2rem'}
              >
                A GlycoProtein Builder
              </Text>
              

              <Spacer />
              <Box >
                <Stepper width={{ base: "0%", sm: "0%", md: "auto", lg: "auto", xl: "auto" }} visibility={{ base: "hidden", sm: "hidden", md: "visible", lg: "visible", xl: "visible" }} margin="1rem" size={{ base: "sm", sm: "sm", md: "sm", lg: "md", xl: "md" }} colorScheme='teal' index={activeStep}>
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
              <Image src={fit} alt="Glycoprotein" width="90%" />
              
              <Box padding={"2rem"} paddingTop={"0rem"}><Text
                bgGradient='linear(to-l,  #81D8D0, #C39CAA)'
                bgClip='text'
                fontSize={{ base: "3xl", sm: "3xl", md: "4xl", lg: "5xl", xl: "5xl" }}
                fontWeight='bold'
                marginBottom="0.2em"
                align={"center"}
                marginLeft={'2rem'}
              >
                With SAXS and Density Fit
              </Text>
                <Text fontFamily={'texts'} color='#B195A2' paddingTop="10rem" padding={"0rem"} justifySelf="left" align={'left'} fontSize={'lg'}>

                  Re-Glyco-Fit is a tool we designed to accurately restores missing glycans, aligning them within experimental constraints such as SAXS or CCP4 density maps. Significantly enhances the accuracy and reliability of glycoprotein models, bridging the gap between computational predictions and experimental data. To get started, upload your protein structure file and SAXS(.dat) or density(.ccp4) file and let Re-Glyco-Fit do the rest! 

                </Text>
{/* 
                <Text fontFamily={'texts'}>
                  <Button margin='0rem' onClick={(e) => (setUniprotID('Q9BXJ4'))} colorScheme='purple' variant='link' size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}>Q9BXJ4</Button>
                  <Button margin='0rem' onClick={(e) => (setUniprotID('P29016'))} colorScheme='purple' variant='link' size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}>P29016</Button>
                  <Button margin='0rem' onClick={(e) => (setUniprotID('O15552'))} colorScheme='purple' variant='link' size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}>O15552</Button>
                  <Button margin='0rem' onClick={(e) => (setUniprotID('P27918'))} colorScheme='purple' variant='link' size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}>P27918</Button>
                  <Button margin='0rem' onClick={(e) => (setUniprotID('B0YJ81'))} colorScheme='purple' variant='link' size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}>B0YJ81</Button>

                </Text> */}
                {/* <Text fontFamily={'texts'} paddingTop="0rem" color='#B195A2' alignSelf={"left"} fontSize={'lg'}>
                  and press fetch!</Text> */}

                <Text fontFamily={'texts'} paddingTop="2rem" color='#B195A2' alignSelf={"right"} fontSize={'xs'}>
                  Currently supported function includes :<br />
                  N-GlcNAcylation<br />
                  O-GalNAcylation<br />
                  O-GlcNAcylation<br />
                  O-Fucosylation<br />
                  O-Mannosylation<br />
                  O-Glucosylation<br />
                  O-Xylosylation<br />
                  C-Mannosylation</Text>


              </Box>

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
