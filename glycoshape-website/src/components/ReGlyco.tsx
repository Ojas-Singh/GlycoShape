import React, { useState, ChangeEvent, useEffect, useRef, } from 'react';
import { useBreakpointValue } from "@chakra-ui/react";
import axios from 'axios';
import { useLocation} from 'react-router';
import { FaCheck, FaTimes } from 'react-icons/fa';
import {
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast, Hide, SimpleGrid, Input, Text, Button, VStack, HStack, Link, Flex, Code, Heading, 
  Spacer,
  UnorderedList, ListItem,
  CircularProgress,
  CircularProgressLabel, Step,
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
import { Kbd } from '@chakra-ui/react';
import bg from './assets/gly.png';
import uniprot_logo from './assets/uniprot.svg';
import Scanner from './assets/Scanner.png';
import Setting from './assets/setting.png';
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
  
  const [searchTerm, setSearchTerm] = React.useState('');

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
  const toast = useToast()
  type ProcessType = 'handleProcessOne_scan' |'handleProcessOne' | 'handleProcess_shot' | 'handleProcess' | 'handleProcessCustom';
  const [lastRunType, setLastRunType] = useState<ProcessType>('handleProcessOne');
  const getCurrentHandler = () => {
    switch (lastRunType) {
        case 'handleProcessOne_scan':
            return handleProcessOne_scan;
        case 'handleProcessOne':
            return handleProcessOne_sasa;
        case 'handleProcess_shot':
            return handleProcess_shotSASA;
        case 'handleProcess':
            return handleProcessCustomSasa;
        case 'handleProcessCustom':
            return handleProcessCustomSasa;
        default:
            return () => {};
    }
};



  const handleTabChange = () => {
    setOutputPath("");
    // Add more logic here if you have more variables to reset
  };

  const placeholders = [
    "Enter Uniprot Id",
    "Enter PDB Id",

  ];
  const scrollToRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    // Scroll to the element when outputPath changes
    scrollToRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [outputPath]);
  useEffect(() => {
    fetch(`${apiUrl}/database/GLYCAN_TYPE.json`)
      .then((response) => response.json())
      .then((data) => {
        if (data.N) {
          const sortedData = data.N.sort((a: string, b: string) => a.length - b.length);      
        // Set the sorted data
        setGlycanOptions(sortedData);
          // setGlycanOptions(data.N); // assuming data.N is an array of the desired structure
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
    { title: 'Choose Structure', description: 'AF, PDB or upload your own' },
    { title: 'Select Glycans', description: ' Choose your N- or O-glycan' },
    { title: 'Download', description: 'Press process and download re-glyco structure!' },
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
  


  const [scanResults, setScanResults] = useState<ScanResults | null>({
    box: '',
    clash: false,
    output: '',
    results: [] // Empty results array as initial value
  });

  const [summary, setSummary] = useState<ResultItem[] | null>(null);

  const handleProcessOne_scan = async () => {
    setIsLoading(true);  // Start loading
    setActiveStep(2);

    const payload = {
      customPDB: isUpload,
      selectedGlycans: selectedGlycans,
      uniprotID: uniprotID,
      filename: UniprotData?.uniprot,
      selectedGlycanOption: isUpload ? selectedGlycanOption : null
    };

    let endpoint = `${apiUrl}/api/scan`; // default endpoint


    try {
      const response = await fetch(endpoint, {
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
        setScanResults(responseData);
        setActiveStep(3);  // Move to the 'Download' step after processing
        setElapsedTime(0);
        setLastRunType('handleProcessOne_scan');
        console.log(responseData);
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
              description: "For the given uniprot/PDB id the strucure is not available in the AF/RSCB database. Please check your input and try again or upload your own structure.",
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


  const handleProcess = async () => {
    setIsLoading(true);  // Start loading
    setActiveStep(2);
    const payload = {
      selectedGlycans: selectedGlycans,
      uniprotID: uniprotID
    };

    try {
      const response = await fetch(`${apiUrl}/api/process_uniprot`, {
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
        setIsSASA(false);
        setSummary(responseData.summary);
        setBoxValue(responseData.box)
        setActiveStep(3);  // Move to the 'Download' step after processing
        setElapsedTime(0);
        setLastRunType('handleProcess');
        console.log(responseData);
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

  const handleProcessCustom = async () => {
    setIsLoading(true);  // Start loading
    setActiveStep(2);
    const payload = {
      selectedGlycans: selectedGlycans,
      uniprotID: UniprotData?.uniprot

    };

    try {
      const response = await fetch(`${apiUrl}/api/process_pdb`, {
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
        setIsSASA(false);
        setBoxValue(responseData.box)
        setSummary(responseData.summary);
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

  const handleProcessCustomSasa = async () => {
    setIsLoading(true);  // Start loading
    setActiveStep(2);
    const payload = {
      selectedGlycans: selectedGlycans,
      filename: UniprotData?.uniprot,
      customPDB: isUpload,

    };

    try {
      const response = await fetch(`${apiUrl}/api/process_pdb_sasa`, {
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
        setOutputPathSASA(responseData.output_sasa);
        setIsSASA(true);
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


  const handleProcessOne = async () => {
    setIsLoading(true);  // Start loading
    setActiveStep(2);

    const payload = {
      selectedGlycans: selectedGlycans,
      uniprotID: uniprotID,
      filename: UniprotData?.uniprot,
      selectedGlycanOption: isUpload ? selectedGlycanOption : null
    };

    let endpoint = `${apiUrl}/api/one_uniprot`; // default endpoint


    try {
      const response = await fetch(endpoint, {
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
        setSummary(responseData.summary);
        setIsSASA(false);
        setActiveStep(3);  // Move to the 'Download' step after processing
        setElapsedTime(0);
        setLastRunType('handleProcessOne');
        console.log(responseData);
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

  
  const handleProcessOne_sasa = async () => {
    setIsLoading(true);  // Start loading
    setActiveStep(2);

    const payload = {
      selectedGlycans: selectedGlycans,
      uniprotID: uniprotID,
      filename: UniprotData?.uniprot,
      selectedGlycanOption: isUpload ? selectedGlycanOption : null
    };

    let endpoint = `${apiUrl}/api/one_uniprot_sasa`; // default endpoint

    // If isUpload is true, change the endpoint to /screen_pdb
    // if (isUpload) {
    //   endpoint = `${apiUrl}/api/oneshot_pdb`;
    // }

    try {
      const response = await fetch(endpoint, {
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
        setOutputPathSASA(responseData.output_sasa);
        setIsSASA(true);
        setActiveStep(3);  // Move to the 'Download' step after processing
        setElapsedTime(0);
        console.log(responseData);
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

  const handleProcessShot = async () => {
    setIsLoading(true);  // Start loading
    setActiveStep(2);

    const payload = {
      customPDB: isUpload,
      selectedGlycans: selectedGlycans,
      uniprotID: uniprotID,
      filename: UniprotData?.uniprot,
      result: scanResults?.results,
      selectedGlycanOption: selectedGlycanOption
    };

    let endpoint = `${apiUrl}/api/oneshot_pdb`; // default endpoint
    setOutputPath('');

    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const responseData = await response.json();
        setClashValue(responseData.clash);
        setIsSASA(false);
        setBoxValue(responseData.box)
        setSummary(responseData.summary);
        setOutputPath(responseData.output);
        setActiveStep(3);  // Move to the 'Download' step after processing
        setElapsedTime(0);
        setLastRunType('handleProcess_shot');
        console.log(responseData);
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


  const  [isSASA, setIsSASA] = useState<boolean>(false);
  const [outputPathSASA, setOutputPathSASA] = useState("");

  
  const handleProcess_shotSASA = async () => {
    setIsLoading(true);  // Start loading
    setActiveStep(2);
    

    const payload = {
      customPDB: isUpload,
      selectedGlycans: selectedGlycans,
      uniprotID: uniprotID,
      filename: UniprotData?.uniprot,
      result: scanResults?.results,
      selectedGlycanOption: selectedGlycanOption
    };

    let endpoint = `${apiUrl}/api/oneshot_sasa`; // default endpoint


    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const responseData = await response.json();
        setIsSASA(true);
        setOutputPath(responseData.output);
        setClashValue(responseData.clash);
        setOutputPathSASA(responseData.output_sasa);
        setBoxValue(responseData.box)
        setActiveStep(3);  // Move to the 'Download' step after processing
        setElapsedTime(0);
        console.log(responseData);
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

  type GlytoucanMapping = { [key: string]: string | null }; // Allow string indexing with string keys and values of type string or null
  const [glytoucanMapping, setGlytoucanMapping] = useState<GlytoucanMapping>({}); // Properly typed state  useEffect(() => {
    useEffect(() => {  
  // Fetch the mapping JSON file
    const fetchGlytoucanMapping = async () => {
      try {
        const response = await fetch(`${apiUrl}/database/iupac_glytoucan_mapping.json`);
        const mappingData = await response.json();
        setGlytoucanMapping(mappingData);
      } catch (error) {
        console.error("Error fetching GlyTouCan mapping:", error);
      }
    };

    fetchGlytoucanMapping();
  }, [] ); // Empty dependencies array to run once on component mount




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
                  rgba(207, 99, 133, 0.6) 100%
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
          <Link fontWeight="bold" fontFamily={'heading'} href="/reglyco" marginRight="20px">Re-Glyco</Link>
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
            backgroundColor="#B07095"
            _hover={{
              backgroundColor: "#CF6385"
            }}
            size={{ base: "md", sm: "md", md: "md", lg: "md", xl: "md" }}
            onClick={(handleSearch)}
          >
            Fetch
          </Button>
        </Flex>

        <Text
          marginLeft={"2rem"}
          bgGradient='linear(to-l, #B07095, #B07095)'
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
              <Button as="label" backgroundColor="#B07095" _hover={{ backgroundColor: "#CF6385" }} size="md" w="full">
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
              color="#B07095"
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
                <Stepper width={{ base: "0%", sm: "0%", md: "auto", lg: "auto", xl: "auto" }} visibility={{ base: "hidden", sm: "hidden", md: "visible", lg: "visible", xl: "visible" }} margin="1rem" size={{ base: "sm", sm: "sm", md: "sm", lg: "md", xl: "md" }} colorScheme='pink' index={activeStep}>
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

                <Box w="90%" justifyContent="center" alignItems="center" p={2} marginTop={"0"}>

                <h2>
                    <Box as="span" flex='1' textAlign='left'>
                      <Heading as='h4' size='md' color={"#B07095"}>Structure Information</Heading>
                    </Box>

                </h2>

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


              {!isUpload && UniprotData.glycosylation_locations.glycosylations.length > 0 ? (
                <div>
                  <Tabs
                    colorScheme='pink'
                    isFitted
                    variant='enclosed-colored'

                    onChange={handleTabChange}
                    //  variant='enclosed'
                    align={"start"}
                    // alignItems={"start"}
                    maxWidth="100%"
                    padding={"0rem"}
                    paddingTop={"1rem"}

                  // variant='soft-rounded' 
                  // colorScheme='green'
                  >
                    <TabList>
                      <Tab border='1px solid' borderTopRadius='xl'>Build using &nbsp;<Image height="30px" src={uniprot_logo} />&nbsp;</Tab>
                      <Tab border='1px solid' borderTopRadius='xl'>GlcNAc Scanning&nbsp;<Image height="38px" src={Scanner} />&nbsp;</Tab>
                      <Tab border='1px solid' borderTopRadius='xl'> Advanced (Site-by-Site) Glycosylation &nbsp;<Image height="35px" src={Setting} />&nbsp;</Tab>
                    </TabList>
                    <TabPanels>
                      <TabPanel>
                        <Box margin={'1rem'}>
                          <Text fontWeight="bold" fontFamily={'texts'} color='#B07095' fontSize={{ base: "1xl", sm: "1xl", md: "1xl", lg: "2xl", xl: "2xl" }}>Glycosylation Sites</Text>
                          <UnorderedList m={3}>
                            {UniprotData.glycosylation_locations.glycosylations.map((glyco, index) => (
                              <ListItem key={index} mb={2} display="flex" alignItems="center" >

                                <HStack>
                                  <Text fontWeight={"bold"}>Residue: </Text> <Text color="black" fontSize='xs'>{glyco.begin} &nbsp;
                                    {glyco.description}</Text>
                                </HStack>

                              </ListItem>
                            ))}
                          </UnorderedList>

                          <Button
                            position={"relative"}
                            margin={'1rem'}
                            borderRadius="full"
                            backgroundColor="#B07095"
                            _hover={{ backgroundColor: "#CF6385" }}
                            size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}
                            onClick={handleProcessOne}
                            isDisabled={isLoading}
                          >
                            {isLoading ? (
                              <Box position="relative" display="inline-flex" alignItems="center" justifyContent="center">
                                <CircularProgress
                                  position="absolute"
                                  color="#B07095"
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

                          {isLoading && (
                            <Alert status='info'>
                              <AlertIcon />
                              It can take up to 5 minutes to process your request. Please wait. <br /> Please be advised that in the case of multiple users running simultaneously, your Re-Glyco job may take longer than expected.
                            </Alert>
                          )}
                        </Box>
                      </TabPanel>

                      <TabPanel>
                        {scanResults ? (
                          <Box margin={'1rem'}>
                              <Text marginBottom={'1rem'}  alignSelf={"left"} fontSize={'s'} fontFamily={'texts'}>
            The ability of Re-Glyco to resolve steric clashes can be used within GlycoShape also to assess the potential occupancy of N-glycosylation sites through an implementation we called ‘GlcNAc Scanning’.
            Where Re-Glyco will try to fit a single GlcNAc monosaccharide into all the NXS/T sequons in the protein. The process outputs a list of sequons that passed the test, marked with a simple ‘yes’ or ‘no’ label.</Text>
                            {scanResults.results ? (
                              <div>
                                <Text fontWeight="bold" fontFamily={'texts'} color='#B07095' fontSize={{ base: "1xl", sm: "1xl", md: "1xl", lg: "2xl", xl: "2xl" }}>Scanning information:</Text>
                                <UnorderedList styleType="none" m={3}>
                                  {scanResults.results.map((result, index) => (
                                    <ListItem key={index} mb={2} display="flex" alignItems="center">
                                      <Text as="span" fontWeight="bold">Residue:</Text>
                                      <Box as="span" fontFamily="monospace" minWidth="6ch" textAlign="right">
                                        {result.residue}
                                      </Box>
                                      <Text as="span" ml={2}>- <Text as="i">N-glycosylation</Text> possible: &nbsp;</Text>
                                      {result.clash_solved ? (
    <FaCheck color="green" />
  ) : (
    <FaTimes color="red" />
  )}
                                    </ListItem>
                                  ))}
                                  {scanResults.results.length === 0 && scanResults.box.length > 0 ? (
                                    <div>No <Text as="i">N-glycosylation</Text> possible</div>
                                  ) : (null)}
                                  {scanResults.results.length > 0 ? (
                                    <Box marginLeft={'0rem'} marginTop={'1rem'} marginBottom={'1rem'}>

                                      <div>
                                        <HStack>
                                          <Heading m={1} fontSize={"sm"}>On all predicted sequons : &nbsp;</Heading>
                                          <Menu>
  <MenuButton
    as={Button}
    bgColor={"#B07095"}
    _hover={{ backgroundColor: "#CF6385" }}
    width="70%"
    color={"#1A202C"}
  >
    {/* Display glytoucanID if available */}
    {selectedGlycanOption
      ? (glytoucanMapping[selectedGlycanOption]
        ? (glytoucanMapping[selectedGlycanOption]?.substring(0, trimLength) || "") 
        : selectedGlycanOption.substring(0, trimLength) + "...")
      : 'select Glycan'}
  </MenuButton>
  <MenuList
    maxHeight="300px"
    overflowY="auto"
    width="900px"  // Fixed width
    minWidth="400px"  // Ensures the menu does not go below this width
    maxWidth="100%"  // Ensures the menu does not exceed this width
  >
    {/* Search Input */}
    <MenuItem>
      <Input
        placeholder="Search Glycans"
        onClick={(e) => e.stopPropagation()} // Prevents menu from closing
        onChange={(e) => setSearchTerm(e.target.value)}
        mb={2}
        width="100%"
      />
    </MenuItem>

    {/* Filtered List */}
    {glycanOptions
      .filter(option => {
        const glytoucanID = glytoucanMapping[option] || option;
        return glytoucanID.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .map((option, index) => {
        const glytoucanID = glytoucanMapping[option] || option; // Use glytoucanID if it exists, otherwise use glycanID
        return (
          <MenuItem
            key={index}
            onClick={() => {
              setSelectedGlycanOption(option);
            }}
          >
            <Image
              src={`${apiUrl}/database/${option}/${option}.svg`}
              alt="Glycan Image"
              height="80px"
              maxWidth={"90%"}
              mr={2}
            />
            {glytoucanID.length > 40 ? glytoucanID.substring(0, 40) + "..." : glytoucanID}
          </MenuItem>
        );
      })}
  </MenuList>
</Menu>




                                          {selectedGlycanOption && (
                                    <Link href={`/glycan?IUPAC=${selectedGlycanOption}`} target="_blank" rel="noopener noreferrer">

                                            <Image
                                              src={`${apiUrl}/database/${selectedGlycanOption}/${selectedGlycanOption}.svg`}
                                              alt="Selected Glycan Image"
                                              height="80px"
                                              maxWidth={"90%"}
                                              ml={2}
                                            /></Link>
                                          )}
                                        </HStack>
                                      </div>
                                      <Button
                                        position={"relative"}
                                        margin={'1rem'}
                                        borderRadius="full"
                                        backgroundColor="#B07095"
                                        _hover={{ backgroundColor: "#CF6385" }}
                                        size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}
                                        onClick={handleProcessShot}
                                        isDisabled={isLoading}
                                      >
                                        {isLoading ? (
                                          <Box position="relative" display="inline-flex" alignItems="center" justifyContent="center">
                                            <CircularProgress
                                              position="absolute"
                                              color="#B07095"
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
                                      </Alert>)}</Box>
                                  ) : (null)}
                                </UnorderedList>



                              </div>
                            ) : (
                              <div>No <Text as="i">N-glycosylation</Text> location found.</div>
                            )}

                            {scanResults.box.length == 0 ? (
                              <div>
                                <Button
                                  position={"relative"}
                                  margin={'1rem'}
                                  borderRadius="full"
                                  backgroundColor="#B07095"
                                  _hover={{ backgroundColor: "#CF6385" }}
                                  size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}
                                  onClick={handleProcessOne_scan}
                                  isDisabled={isLoading}
                                >
                                  {isLoading ? (
                                    <Box position="relative" display="inline-flex" alignItems="center" justifyContent="center">
                                      <CircularProgress
                                        position="absolute"
                                        color="#B07095"
                                        size="50px"
                                        thickness="5px"
                                        isIndeterminate
                                        marginLeft={"15rem"}
                                        capIsRound
                                      >
                                        <CircularProgressLabel>{elapsedTime}</CircularProgressLabel>
                                      </CircularProgress>
                                      Scanning...
                                    </Box>
                                  ) : (
                                    "Scan"
                                  )}
                                </Button>
                                
                                {isLoading && (
                                  <Alert status='info'>
                                    <AlertIcon />
                                    It can take up to 5 minutes to process your request. Please wait. <br /> Please be advised that in the case of multiple users running simultaneously, your Re-Glyco job may take longer than expected.
                                  </Alert>
                                )}</div>) : (<div></div>)}
                          </Box>) : (<div></div>)}
                      </TabPanel>
                      <TabPanel>
                        <Heading margin={'1rem'} marginBottom={'1rem'} fontFamily={'texts'} color='#B07095' fontSize={{ base: "1xl", sm: "1xl", md: "1xl", lg: "2xl", xl: "2xl" }} >
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
  <MenuButton
    as={Button}
    bgColor={"#B07095"}
    _hover={{ backgroundColor: "#CF6385" }}
    width="70%"
    color={"#1A202C"}
  >
    {/* Display glytoucanID if available */}
    {selectedGlycanImage[glycoConf.residueTag] 
      ? (
        glytoucanMapping[selectedGlycanImage[glycoConf.residueTag]]
        ? glytoucanMapping[selectedGlycanImage[glycoConf.residueTag]]?.substring(0, trimLength) || ""
        : selectedGlycanImage[glycoConf.residueTag].substring(0, trimLength) + "..."
      ) : 'select Glycan'}
  </MenuButton>
  <MenuList
    maxHeight="300px"
    overflowY="auto"
    width="900px" // Set a fixed width
    minWidth="400px" // Optional: set min width to ensure it's always at least this wide
    maxWidth="100%" // Optional: set max width to prevent exceeding this width
  >
    {/* Search Input */}
    <MenuItem>
      <Input
        placeholder="Search Glycans"
        onClick={(e) => e.stopPropagation()} // Prevents menu from closing
        onChange={(e) => setSearchTerm(e.target.value)}
        mb={2}
        width="100%"
      />
    </MenuItem>

    {/* Filtered List */}
    {glycoConf.glycanIDs
      .filter(glycanID => {
        const glytoucanID = glytoucanMapping[glycanID] || glycanID;
        return glytoucanID.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .map((glycanID, glycanIndex) => {
        const glytoucanID = glytoucanMapping[glycanID] || glycanID; 
        return (
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
            {glytoucanID.length > 40 ? glytoucanID.substring(0, 40) + "..." : glytoucanID}
          </MenuItem>
        );
      })}
  </MenuList>
</Menu>


                                {selectedGlycanImage[glycoConf.residueTag] && (
                                  <Link href={`/glycan?IUPAC=${selectedGlycanImage[glycoConf.residueTag]}`} target="_blank" rel="noopener noreferrer">
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

                        <Button
                          position={"relative"}
                          margin={'1rem'}
                          borderRadius="full"
                          backgroundColor="#B07095"
                          _hover={{ backgroundColor: "#CF6385" }}
                          size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}
                          onClick={isUpload ? handleProcessCustom : handleProcess}
                          isDisabled={isLoading} // Disable the button while processing
                        >
                          {isLoading ? (
                            <Box position="relative" display="inline-flex" alignItems="center" justifyContent="center">
                              <CircularProgress
                                position="absolute"
                                color="#B07095"
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
                        {/* {outputPath && (<div>
                        <Button
                                        position={"relative"}
                                        margin={'1rem'}
                                        borderRadius="full"
                                        backgroundColor="#806CA5"
                                        _hover={{ backgroundColor: "#C094D9" }}
                                        size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}
                                        onClick={handleProcessCustomSasa}
                                        isDisabled={isLoading}
                                      >
                                        {isLoading ? (
                                          <Box position="relative" display="inline-flex" alignItems="center" justifyContent="center">
                                            <CircularProgress
                                              position="absolute"
                                              color="#B07095"
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
                                          "Process Ensemble"
                                        )}
                                      </Button>
                                      <Text color='#B195A2' alignSelf={"left"} fontSize={'xs'}>
                                      Process Ensemble will process multiple glycan conformations and calculate the SASA which can be used for docking to glycoproteins.</Text>
                                      </div>)} */}
                        {isLoading && (<Alert status='info' >
                          <AlertIcon />
                          It can take up to 5 minutes to process your request. Please wait. <br /> Please be advised that in the case of multiple users running simultaneously, your Re-Glyco job may take longer than expected.
                        </Alert>)}

                      </TabPanel>

                    </TabPanels>

                  </Tabs>
                </div>
              ) : (
                <div>
                  <Tabs
                    colorScheme='pink'
                    isFitted
                    variant='enclosed-colored'
                    onChange={handleTabChange}
                    align={"start"}
                    maxWidth="100%"
                    padding={"0rem"}
                    paddingTop={"1rem"}
                  >
                    <TabList>
                      <Tab border='1px solid' borderTopRadius='xl'>GlcNAc Scanning&nbsp;<Image height="38px" src={Scanner} />&nbsp;</Tab>
                      <Tab border='1px solid' borderTopRadius='xl'>Advanced (Site-by-Site) Glycosylation&nbsp;<Image height="35px" src={Setting} />&nbsp;</Tab>
                    </TabList>
                    <TabPanels>


                      <TabPanel >
                        {scanResults ? (
                          <Box margin={'1rem'}>
                            <Text marginBottom={'1rem'}  alignSelf={"left"} fontSize={'s'} fontFamily={'texts'}>
            The ability of Re-Glyco to resolve steric clashes can be used within GlycoShape also to assess the potential occupancy of N-glycosylation sites through an implementation we called ‘GlcNAc Scanning’.
            Where Re-Glyco will try to fit a single GlcNAc monosaccharide into all the NXS/T sequons in the protein. The process outputs a list of sequons that passed the test, marked with a simple ‘yes’ or ‘no’ label.</Text>
                            {scanResults.results ? (
                              <div>
                                <Text fontWeight="bold" fontFamily={'texts'} color='#B07095' fontSize={{ base: "1xl", sm: "1xl", md: "1xl", lg: "2xl", xl: "2xl" }}>Scanning information:</Text>
                                <UnorderedList styleType="none" m={3}>
                                  {scanResults.results.map((result, index) => (
                                    <ListItem key={index} mb={2} display="flex" alignItems="center">
                                      <Text as="span" fontWeight="bold">Residue:</Text>
                                      <Box as="span" fontFamily="monospace" minWidth="6ch" textAlign="right">
                                        {result.residue}
                                      </Box>
                                      <Text as="span" ml={2}>- <Text as="i">N-glycosylation</Text> possible:&nbsp;</Text>
                                      {result.clash_solved ? (
    <FaCheck color="green" />
  ) : (
    <FaTimes color="red" />
  )}  
                                    </ListItem>
                                  ))}
                                  {scanResults.results.length === 0 && scanResults.box.length > 0 ? (
                                    <div>No <Text as="i">N-glycosylation</Text> possible</div>
                                  ) : (null)}
                                  {scanResults.results.length > 0 ? (
                                    <Box marginLeft={'0rem'} marginTop={'1rem'} marginBottom={'1rem'}>

                                      <div>
                                        <HStack>
                                          <Heading m={1} fontSize={"sm"}>On all predicted sequons : &nbsp;</Heading>
                                          <Menu>
  <MenuButton
    as={Button}
    bgColor={"#B07095"}
    _hover={{ backgroundColor: "#CF6385" }}
    width="70%"
    color={"#1A202C"}
  >
    {/* Display glytoucanID if available */}
    {selectedGlycanOption
      ? (glytoucanMapping[selectedGlycanOption]
        ? (glytoucanMapping[selectedGlycanOption]?.substring(0, trimLength) || "") 
        : selectedGlycanOption.substring(0, trimLength) + "...")
      : 'select Glycan'}
  </MenuButton>
  <MenuList
    maxHeight="300px"
    overflowY="auto"
    width="900px"  // Fixed width
    minWidth="400px"  // Ensures the menu does not go below this width
    maxWidth="100%"  // Ensures the menu does not exceed this width
  >
    {/* Search Input */}
    <MenuItem>
      <Input
        placeholder="Search Glycans"
        onClick={(e) => e.stopPropagation()} // Prevents menu from closing
        onChange={(e) => setSearchTerm(e.target.value)}
        mb={2}
        width="100%"
      />
    </MenuItem>

    {/* Filtered List */}
    {glycanOptions
      .filter(option => {
        const glytoucanID = glytoucanMapping[option] || option;
        return glytoucanID.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .map((option, index) => {
        const glytoucanID = glytoucanMapping[option] || option; // Use glytoucanID if it exists, otherwise use glycanID
        return (
          <MenuItem
            key={index}
            onClick={() => {
              setSelectedGlycanOption(option);
            }}
          >
            <Image
              src={`${apiUrl}/database/${option}/${option}.svg`}
              alt="Glycan Image"
              height="80px"
              maxWidth={"90%"}
              mr={2}
            />
            {glytoucanID.length > 40 ? glytoucanID.substring(0, 40) + "..." : glytoucanID}
          </MenuItem>
        );
      })}
  </MenuList>
</Menu>


                                          {selectedGlycanOption && (
                                                                                <Link href={`/glycan?IUPAC=${selectedGlycanOption}`} target="_blank" rel="noopener noreferrer">

                                            <Image
                                              src={`${apiUrl}/database/${selectedGlycanOption}/${selectedGlycanOption}.svg`}
                                              alt="Selected Glycan Image"
                                              height="80px"
                                              maxWidth={"90%"}
                                              ml={2}
                                            /></Link>
                                          )}
                                        </HStack>
                                      </div>
                                      <Button
                                        position={"relative"}
                                        margin={'1rem'}
                                        borderRadius="full"
                                        backgroundColor="#B07095"
                                        _hover={{ backgroundColor: "#CF6385" }}
                                        size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}
                                        onClick={handleProcessShot}
                                        isDisabled={isLoading}
                                      >
                                        {isLoading ? (
                                          <Box position="relative" display="inline-flex" alignItems="center" justifyContent="center">
                                            <CircularProgress
                                              position="absolute"
                                              color="#B07095"
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
                                      {/* {outputPath && (<div>
                                      <Button
                                        position={"relative"}
                                        margin={'1rem'}
                                        borderRadius="full"
                                        backgroundColor="#806CA5"
                                        _hover={{ backgroundColor: "#C094D9" }}
                                        size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}
                                        onClick={handleProcess_shotSASA}
                                        isDisabled={isLoading}
                                      >
                                        {isLoading ? (
                                          <Box position="relative" display="inline-flex" alignItems="center" justifyContent="center">
                                            <CircularProgress
                                              position="absolute"
                                              color="#B07095"
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
                                          "Process Ensemble"
                                        )}
                                      </Button>
                                      <Text color='#B195A2' alignSelf={"left"} fontSize={'xs'}>
                                      Process Ensemble will process multiple glycan conformations and calculate the SASA which can be used for docking to glycoproteins.</Text>
      
                                      </div>)} */}
                                      
                                      {isLoading && (<Alert status='info' >
                                        <AlertIcon />
                                        It can take up to 5 minutes to process your request. Please wait. <br /> Please be advised that in the case of multiple users running simultaneously, your Re-Glyco job may take longer than expected.
                                      </Alert>)}</Box>
                                  ) : (null)}
                                </UnorderedList>



                              </div>
                            ) : (
                              <div>No <Text as="i">N-glycosylation</Text> location found.</div>
                            )}

                            {scanResults.box.length == 0 ? (
                              <div>
                                <Button
                                  position={"relative"}
                                  margin={'1rem'}
                                  borderRadius="full"
                                  backgroundColor="#B07095"
                                  _hover={{ backgroundColor: "#CF6385" }}
                                  size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}
                                  onClick={handleProcessOne_scan}
                                  isDisabled={isLoading}
                                >
                                  {isLoading ? (
                                    <Box position="relative" display="inline-flex" alignItems="center" justifyContent="center">
                                      <CircularProgress
                                        position="absolute"
                                        color="#B07095"
                                        size="50px"
                                        thickness="5px"
                                        isIndeterminate
                                        marginLeft={"15rem"}
                                        capIsRound
                                      >
                                        <CircularProgressLabel>{elapsedTime}</CircularProgressLabel>
                                      </CircularProgress>
                                      Scanning...
                                    </Box>
                                  ) : (
                                    "Scan"
                                  )}
                                </Button>
                                {isLoading && (
                                  <Alert status='info'>
                                    <AlertIcon />
                                    It can take up to 5 minutes to process your request. Please wait. <br /> Please be advised that in the case of multiple users running simultaneously, your Re-Glyco job may take longer than expected.
                                  </Alert>
                                )}</div>) : (<div></div>)}
                          </Box>) : (<div></div>)}
                      </TabPanel>
                      <TabPanel>
                        <Heading margin={'1rem'} marginBottom={'1rem'} fontFamily={'texts'} color='#B07095' fontSize={{ base: "1xl", sm: "1xl", md: "1xl", lg: "2xl", xl: "2xl" }} >
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
  <MenuButton
    as={Button}
    bgColor={"#B07095"}
    _hover={{ backgroundColor: "#CF6385" }}
    width="70%"
    color={"#1A202C"}
  >
    {/* Display glytoucanID if available */}
    {selectedGlycanImage[glycoConf.residueTag] 
      ? (
        glytoucanMapping[selectedGlycanImage[glycoConf.residueTag]]
        ? glytoucanMapping[selectedGlycanImage[glycoConf.residueTag]]?.substring(0, trimLength) || ""
        : selectedGlycanImage[glycoConf.residueTag].substring(0, trimLength) + "..."
      ) : 'select Glycan'}
  </MenuButton>
  <MenuList
    maxHeight="300px"
    overflowY="auto"
    width="900px" // Set a fixed width
    minWidth="400px" // Optional: set min width to ensure it's always at least this wide
    maxWidth="100%" // Optional: set max width to prevent exceeding this width
  >
    {/* Search Input */}
    <MenuItem>
      <Input
        placeholder="Search Glycans"
        onClick={(e) => e.stopPropagation()} // Prevents menu from closing
        onChange={(e) => setSearchTerm(e.target.value)}
        mb={2}
        width="100%"
      />
    </MenuItem>

    {/* Filtered List */}
    {glycoConf.glycanIDs
      .filter(glycanID => {
        const glytoucanID = glytoucanMapping[glycanID] || glycanID;
        return glytoucanID.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .map((glycanID, glycanIndex) => {
        const glytoucanID = glytoucanMapping[glycanID] || glycanID; 
        return (
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
            {glytoucanID.length > 40 ? glytoucanID.substring(0, 40) + "..." : glytoucanID}
          </MenuItem>
        );
      })}
  </MenuList>
</Menu>

                                {selectedGlycanImage[glycoConf.residueTag] && (
                                  <Link href={`/glycan?IUPAC=${selectedGlycanImage[glycoConf.residueTag]}`} target="_blank" rel="noopener noreferrer">
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

                        <Button
                          position={"relative"}
                          margin={'1rem'}
                          borderRadius="full"
                          backgroundColor="#B07095"
                          _hover={{ backgroundColor: "#CF6385" }}
                          size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}
                          onClick={isUpload ? handleProcessCustom : handleProcess}
                          isDisabled={isLoading} // Disable the button while processing
                        >
                          {isLoading ? (
                            <Box position="relative" display="inline-flex" alignItems="center" justifyContent="center">
                              <CircularProgress
                                position="absolute"
                                color="#B07095"
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
                        {/* {outputPath && (<div>
                        <Button
                                        position={"relative"}
                                        margin={'1rem'}
                                        borderRadius="full"
                                        backgroundColor="#806CA5"
                                        _hover={{ backgroundColor: "#C094D9" }}
                                        size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}
                                        onClick={handleProcessCustomSasa}
                                        isDisabled={isLoading}
                                      >
                                        {isLoading ? (
                                          <Box position="relative" display="inline-flex" alignItems="center" justifyContent="center">
                                            <CircularProgress
                                              position="absolute"
                                              color="#B07095"
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
                                          "Process Ensemble"
                                        )}
                                      </Button>
                                      <Text color='#B195A2' alignSelf={"left"} fontSize={'xs'}>
                                      Process Ensemble will process multiple glycan conformations and calculate the SASA which can be used for docking to glycoproteins.</Text>
                                      </div>)} */}
                        {isLoading && (<Alert status='info' >
                          <AlertIcon />
                          It can take up to 5 minutes to process your request. Please wait. <br /> Please be advised that in the case of multiple users running simultaneously, your Re-Glyco job may take longer than expected.
                        </Alert>)}

                      </TabPanel>

                    </TabPanels>

                  </Tabs>



                  <br /></div>)}




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

                  {isSASA ? (
                  <div>
                    <Text marginTop={"1rem"}color='#B07095' fontFamily={'heading'} fontWeight={'bold'}>Play multiple frames from the MD trajectory with  &gt; in the Lite Mol viewer</Text>
                  <iframe
                    // key={sequence}
                    width="100%"
                    height="400px"
                    src={`/viewer/embedded.html?pdbUrl=${apiUrl}/output/${outputPath}&format=pdb`} frameBorder="0"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Protein Structure"
                  />
                 <HStack marginTop={"1rem"}>
                 <Text  color='#B07095' fontFamily={'heading'} fontWeight={'bold'}>Solvent Accessible Surface Area (SASA):  Accessible</Text> <Box w='100px' h='20px' bgGradient='linear(to-r, #315CD6, #FFFFFF, #AD1F1F)'  /> <Text color='#B07095' fontFamily={'heading'} fontWeight={'bold'}>Not accessible</Text></HStack>
                  
                  <iframe
                    // key={sequence}
                    width="100%"
                    height="400px"
                    src={`/viewer/index_full.html?snapshot-url=${apiUrl}/output/${outputPathSASA}.molj&snapshot-url-type=molj`} frameBorder="0"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Protein Structure"
                  />

                  <a href={`${apiUrl}/output/${outputPath}`} download>
                    <Button position={"relative"}
                      margin={'1rem'}
                      borderRadius="full"
                      isDisabled={isLoading}
                      backgroundColor="#B07095"
                      _hover={{
                        backgroundColor: "#CF6385"
                      }}
                      size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}>

                      Download Re-glyco Ensemble PDB File
                    </Button></a> 
                  <a href={`${apiUrl}/output/${outputPathSASA}.pdb`} download>
                    <Button position={"relative"}
                      margin={'1rem'}
                      borderRadius="full"
                      isDisabled={isLoading}
                      backgroundColor="#806CA5"
                      _hover={{
                        backgroundColor: "#C094D9"
                      }}
                      size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}>

Download PDB with SASA B-values
                    </Button></a> 
                    <Text color='#B195A2' alignSelf={"left"} fontSize={'xs'}>
            Please reload the page for new calculation.  If you encounter any issues or suspect a bug contact us <Link href="mailto:OJAS.SINGH.2023@mumail.ie">here</Link> 
            </Text>
                    </div>
                  ):(
                  <div>
                  <iframe
                    // key={sequence}
                    width="100%"
                    height="400px"
                    src={`/viewer/embedded.html?pdbUrl=${apiUrl}/output/${outputPath}&format=pdb`} frameBorder="0"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Protein Structure"
                  />
                  
                  {lastRunType !== 'handleProcessOne_scan' ? (
                <div>
                   <a href={`${apiUrl}/output/${outputPath}`} download>
              <Button position={"relative"}
                margin={'1rem'}
                borderRadius="full"
                isDisabled={isLoading}
                backgroundColor="#B07095"
                _hover={{
                  backgroundColor: "#CF6385"
                }}
                size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}>

                Download Re-glycosylated Structure PDB File
              </Button>
              </a>
              <Button
                                        position={"relative"}
                                        margin={'1rem'}
                                        borderRadius="full"
                                        backgroundColor="#806CA5"
                                        _hover={{ backgroundColor: "#C094D9" }}
                                        size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}
                                        onClick={getCurrentHandler()}
                                        isDisabled={isLoading}
                                      >
                                        {isLoading ? (
                                          <Box position="relative" display="inline-flex" alignItems="center" justifyContent="center">
                                            <CircularProgress
                                              position="absolute"
                                              color="#B07095"
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
                                          "Process Ensemble"
                                        )}
                                      </Button>
                                      <Text color='#B195A2' alignSelf={"left"} fontSize={'xs'}>
                                      Process Ensemble will process multiple glycan conformations and calculate the SASA which can be used for docking to glycoproteins.</Text>
                          
                </div>
            ) : (
              <a href={`${apiUrl}/output/${outputPath}`} download>
              <Button position={"relative"}
                margin={'1rem'}
                borderRadius="full"
                isDisabled={isLoading}
                backgroundColor="#B07095"
                _hover={{
                  backgroundColor: "#CF6385"
                }}
                size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}>

                Download Re-glycosylated Structure PDB File
              </Button>
              </a>
            )}

                    <Text color='#B195A2' alignSelf={"left"} fontSize={'xs'}>
             If you encounter any issues or suspect a bug contact us <Link href="mailto:OJAS.SINGH.2023@mumail.ie">here</Link> 
            </Text>
                     </div>
                  )}


{summary ? (
                              <div>
                                <Text marginTop="1.5rem" fontWeight="bold">Processing summary:</Text>
                                <UnorderedList styleType="none" m={3}>
                                  {summary.map((result, index) => (
                                    <ListItem key={index} mb={2} display="flex" alignItems="center">
                                      <Text as="span" fontWeight="bold">Residue:</Text>
                                      <Box as="span" fontFamily="monospace" minWidth="6ch" textAlign="right">
                                        {result.residue}
                                      </Box>
                                      <Text as="span" ml={2}>- <Text as="i">{result.glycan}</Text> possible: </Text>&nbsp;
                                      {result.clash_solved ? (
    <FaCheck color="green" />
  ) : (
    <FaTimes color="red" />
  )}
                                    </ListItem>

                                  ))}
                                  
                                  
                                     
                                </UnorderedList>

                                {summary.some(result => !result.clash_solved) && (
      <Text mt={4}>
        Please <Link color="teal.500" href={`/swap?id=${uniprotID}`} target="_blank">try this link</Link> to get the clashed residue's ND2 and OD1 swapped and try with a new swapped PDB.
      </Text>
    )}

                              </div>
                            ) : (
                              <div></div>
                            )}
                  
                  
                    
                    
                    <Text  marginTop="1rem" fontWeight="bold">Processing log:</Text><Code>
                    {boxValue.split('\n').map((line, index) => (
                      <React.Fragment key={index}>
                        {line}
                        <br />
                      </React.Fragment>
                    ))}
                  </Code>
                </Box>
              )}
 </Box>

          </Flex>
        )}
       
        {!UniprotData && (

          <Flex w="100%" minHeight={'60vh'} justifyContent="left" alignItems="left" p={2} marginTop={"0"} direction="column" >
            <Flex w="100%"

              justify="center"
              flex="1"
              padding="0rem" paddingTop={'0rem'} direction={{ base: "column", sm: "column", md: "row", lg: "row", xl: "row" }}>
              <Text
                bgGradient='linear(to-l,  #B07095, #D7C9C0)'
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
                <Stepper width={{ base: "0%", sm: "0%", md: "auto", lg: "auto", xl: "auto" }} visibility={{ base: "hidden", sm: "hidden", md: "visible", lg: "visible", xl: "visible" }} margin="1rem" size={{ base: "sm", sm: "sm", md: "sm", lg: "md", xl: "md" }} colorScheme='pink' index={activeStep}>
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
              <video width={'60%'} autoPlay loop muted id="bgVideo" >
                <source src="/gamma_s.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <Box padding={"2rem"} paddingTop={"0rem"}><Text
                bgGradient='linear(to-l,  #B07095, #C39CAA)'
                bgClip='text'
                fontSize={{ base: "3xl", sm: "3xl", md: "4xl", lg: "5xl", xl: "5xl" }}
                fontWeight='bold'
                marginBottom="0.2em"
                align={"center"}
                marginLeft={'2rem'}
              >
                About
              </Text>
                <Text fontFamily={'texts'} color='#B195A2' paddingTop="10rem" padding={"0rem"} justifySelf="left" align={'left'} fontSize={'lg'}>

                  Re-Glyco is a tool we designed to restore the missing glycosylation on glycoproteins deposited in the RCSB PDB or in the EBI-EMBL AlphaFold protein structure database. To get started, upload your protein structure file or choose a pre-existing AlphaFold or PDB structure, and let Re-Glyco do the rest! Below are some example of UniProt IDs to get you started:


                </Text>

                <Text fontFamily={'texts'}>
                  <Button margin='0rem' onClick={(e) => (setUniprotID('P27918'))} colorScheme='purple' variant='link' size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}>P27918</Button>
                  <Button margin='0rem' onClick={(e) => (setUniprotID('Q7Z3Q1'))} colorScheme='purple' variant='link' size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}>Q7Z3Q1</Button>
                  <Button margin='0rem' onClick={(e) => (setUniprotID('P29016'))} colorScheme='purple' variant='link' size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}>P29016</Button>
                  <Button margin='0rem' onClick={(e) => (setUniprotID('O15552'))} colorScheme='purple' variant='link' size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}>O15552</Button>
                  <Button margin='0rem' onClick={(e) => (setUniprotID('I3UJJ7'))} colorScheme='purple' variant='link' size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}>I3UJJ7</Button>

                </Text>
                <Text fontFamily={'texts'} paddingTop="0rem" color='#B195A2' alignSelf={"left"} fontSize={'lg'}>
                  and press fetch!</Text>

                <Text fontFamily={'texts'} paddingTop="2rem" color='#B195A2' alignSelf={"right"} fontSize={'xs'}>
                  Currently supported function includes :<br />
                  N-GlcNAcylation<br />
                  O-GalNAcylation<br />
                  O-GlcNAcylation<br />
                  O-Fucosylation<br />
                  O-Mannosylation<br />
                  O-Glucosylation<br />
                  O-Xylosylation<br />
                  C-Mannosylation<br />
                  O-Arabinosylation
</Text>


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
