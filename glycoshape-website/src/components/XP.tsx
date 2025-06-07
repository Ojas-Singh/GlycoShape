import React, {
  useState,
  ChangeEvent,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import axios from 'axios';
import {
  useToast, Hide, SimpleGrid, Input, Text, Button, VStack, HStack, Link, Flex, Code, Heading, Accordion,
  Spacer,
  CircularProgress,
  CircularProgressLabel,
  Step,
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
  Menu, MenuButton, MenuItem, MenuList,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  FormControl,
  FormHelperText,
  FormLabel,
  Switch,
  Tooltip,
} from '@chakra-ui/react';
import { Kbd } from '@chakra-ui/react';
import bg from './assets/gly.png';
import Select, { ActionMeta, OnChangeValue } from 'react-select';

import { useNavigate, useLocation } from 'react-router-dom'; // Import useLocation


// ───────────────────────────────────────────────
// Interfaces

interface ResultItem {
  clash_solved: boolean;
  cluster: number;
  glycan: string;
  phi: number;
  psi: number;
  residue: string;
}

interface Results {
  box: string;
  clash: boolean;
  output: string;
  results: ResultItem[];
  jobId: string;
}

interface ResidueOption {
  label: string;
  value: number;
}

// Add uniprotGlycosylation interface
interface uniprotGlycosylation {
  begin: string; // Residue number as string
  category: string;
  description: string; // e.g., "N-linked (GlcNAc...) asparagine"
  end: string;
  evidences?: { code: string }[]; // Optional evidences
  ftId?: string;
  molecule?: string;
  type: string; // e.g., "CARBOHYD"
}

interface GlycosylationData {
  available: Glycosylation[];
  uniprot: uniprotGlycosylation[]; // Use the new interface
}

export interface Glycosylation {
  residueTag: number;
  residueID: number;
  residueName: 'ASN' | 'SER' | 'THR' | 'HYP' | 'PRO' | 'TRP';
  residueChain: string;
}

interface configurations {
  ASN: Glycan[];
  SER: Glycan[];
  THR: Glycan[];
  HYP: Glycan[];
  PRO: Glycan[];
  TRP: Glycan[];
}

export interface Glycan {
  ID: string;
  glytoucan: string | null;
  mass: number;
}

interface protData {
  id: string;
  filename: string;
  requestURL: string;
  sequence: string;
  glycosylation: GlycosylationData;
  configurations: configurations;
}

// ───────────────────────────────────────────────
// New Component: ResidueMenu
// This component is responsible for rendering the glycan selection menu
// for a given residue. It is memoized so that it does not re-render unless its own props change.
interface ResidueMenuProps {
  glycoConf: Glycosylation;
  selectedGlycan: string | undefined;
  onSelect: (residueID: string, residueTag: number, glycanValue: string) => void;
  glycans: Glycan[];
  apiUrl: string;
  residueKey: number;
}
const ResidueMenu: React.FC<ResidueMenuProps> = React.memo(({
  glycoConf,
  selectedGlycan,
  onSelect,
  glycans,
  apiUrl,
  residueKey,
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const useDebounce = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(timer);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  const debouncedSearchTerm = useDebounce(localSearchTerm, 300);

  const handleMenuOpen = () => {
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 500);
  };

  const filteredGlycans = useMemo(() => {
    const lowerTerm = debouncedSearchTerm.toLowerCase();
    return glycans.filter(glycan =>
      glycan.glytoucan?.toLowerCase().includes(lowerTerm) ||
      glycan.ID.toLowerCase().includes(lowerTerm) ||
      glycan.mass.toString().includes(lowerTerm)
    );
  }, [debouncedSearchTerm, glycans]);

  return (
    <Flex
      key={residueKey}
      w="100%"
      align="center"
      justify="space-between"
      p={2}
      gap={2}
    >
      <Box minW="200px" >
        <Heading
          fontSize={{ base: "lg", md: "lg" }}
          // fontFamily="texts"
          noOfLines={1}
        >
          {`Residue ${glycoConf.residueName} ${glycoConf.residueID}  ${glycoConf.residueChain}`}
        </Heading>
      </Box>

      <Box flex="1"> {/* Changed from w="50%" to flex="1" */}
        <Menu onOpen={handleMenuOpen}>
          <MenuButton
            as={Button}
            bgColor="#E5A267"
            _hover={{ backgroundColor: "#ECD292" }}
            w="100%"
            color="#1A202C"
          >
            {selectedGlycan || "Select Glycan"}
          </MenuButton>
          <MenuList
            maxH="300px"
            overflowY="auto"
            w="900px"
            minW="400px"
            borderRadius="xl"
            sx={{
              '&::-webkit-scrollbar': {
                width: '8px',
                borderRadius: '8px',
                backgroundColor: `rgba(0, 0, 0, 0.05)`,
              },
              '&::-webkit-scrollbar-thumb': {
                borderRadius: '8px',
                backgroundColor: `rgba(0, 0, 0, 0.15)`,
              },
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(0, 0, 0, 0.15) rgba(0, 0, 0, 0.05)',
            }}
          >
            <Box
              position="sticky"
              top={-2}
              bg="white"
              zIndex={2}
              borderTopRadius="xl"
              borderBottom="1px solid #e2e8f0"
              p={4}
            >
              <Input
                ref={searchInputRef}
                placeholder="Search Glycans"
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                size="md"
                width="100%"
              />
            </Box>

            <Box pt={2}>
              {filteredGlycans.map((glycan) => (
                <MenuItem
                  key={glycan.ID}
                  onClick={() =>
                    onSelect(
                      `${glycoConf.residueID}_${glycoConf.residueChain}`,
                      glycoConf.residueTag,
                      glycan.glytoucan || ""
                    )
                  }
                >
                  <Image
                    src={`${apiUrl}/database/${glycan.ID}/snfg.svg`}
                    alt="Glycan Image"
                    h="80px"
                    maxW="90%"
                    mr={2}
                  />
                  {`${glycan.glytoucan} (ID: ${glycan.ID}, Mass: ${glycan.mass})`}
                </MenuItem>
              ))}
            </Box>
          </MenuList>
        </Menu>
      </Box>

      {selectedGlycan && (
        <Box w="10%" h="80px"> {/* Changed from w="30%" to w="20%" */}
          <Link
            href={`/glycan?glytoucan=${selectedGlycan}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src={`${apiUrl}/api/svg/${selectedGlycan}`}
              alt="Selected Glycan Image"
              h="100%"
              objectFit="contain"
            />
          </Link>
        </Box>
      )}
    </Flex>
  );
});
// Optionally, you could add a custom props comparison function as the second argument to React.memo if needed.

// ───────────────────────────────────────────────
// Main Component: ReGlyco
const ReGlyco = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const isDevelopment = process.env.REACT_APP_BUILD_DEV === "true";

  

  const [searchTerm, setSearchTerm] = useState('');
  const [protID, setprotID] = useState<string>("");
  const [protData, setprotData] = useState<protData | null>(null);
  const [isUpload, setIsUpload] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState(67);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef(null);
  const [placeholderText, setPlaceholderText] = useState('Enter Uniprot Id');
  const [Results, setResults] = useState<Results | null>({
      box: '',
      clash: false,
      output: '',
      results: [],
      jobId: ''
    });
  const location = useLocation(); // Get location object

  // Parse query parameters when component mounts or URL changes
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const idParam = queryParams.get('id');
    const isUploadParam = queryParams.get('isUpload');
    const selectionsParam = queryParams.get('selections');

    let shouldFetchData = false;

    if (idParam && idParam !== protID) {
      setprotID(idParam);
      // Mark that data should be fetched, but fetch will be triggered by the other useEffect watching protID
      shouldFetchData = true;
    }

    if (isUploadParam !== null) {
      const uploadBool = isUploadParam === 'true';
      if (uploadBool !== isUpload) {
        setIsUpload(uploadBool);
      }
    }

    if (selectionsParam) {
      try {
        const decodedSelections = JSON.parse(decodeURIComponent(selectionsParam));
        if (JSON.stringify(decodedSelections) !== JSON.stringify(selectedGlycans)) {
          setSelectedGlycans(decodedSelections);
        }
        // Defer updating `value` and `selectedGlycanImage` until protData is available
      } catch (e) {
        console.error("Failed to parse selections from URL:", e);
        toast({
          title: 'URL Error',
          description: 'Could not parse glycan selections from the URL.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      }
    }
    

    if (idParam && !protData && shouldFetchData) {
        
    } else if (protData && selectionsParam) {
       
        applySelectionsFromURL(selectionsParam, protData);
    }

  }, [location.search]);

  // Effect to apply selections once protData is loaded and selectionsParam was present
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const selectionsParam = queryParams.get('selections');
    if (protData && selectionsParam) {
      applySelectionsFromURL(selectionsParam, protData);
    }
  }, [protData, location.search]); // Rerun if protData loads or search params change

  const applySelectionsFromURL = (selectionsParam: string, currentProtData: protData) => {
    try {
      const decodedSelections = JSON.parse(decodeURIComponent(selectionsParam));

      // Update `value` state for react-select
      if (currentProtData?.glycosylation?.available) {
        const newSelectedOptions: ResidueOption[] = [];
        const selectionKeys = Object.keys(decodedSelections);

        currentProtData.glycosylation.available.forEach(glycoConf => {
          const residueKey = `${glycoConf.residueID}_${glycoConf.residueChain}`;
          if (selectionKeys.includes(residueKey)) {
            newSelectedOptions.push({
              value: glycoConf.residueTag,
              label: `${glycoConf.residueName}${glycoConf.residueID}${glycoConf.residueChain}`
            });
          }
        });
        if (JSON.stringify(newSelectedOptions) !== JSON.stringify(value)) {
          setValue(newSelectedOptions);
        }
      }

      // Update `selectedGlycanImage`
      const newImageSelections: { [key: number]: string } = {};
      if (currentProtData?.glycosylation?.available) {
        Object.entries(decodedSelections).forEach(([resKey, glycanToucan]) => {
          const site = currentProtData.glycosylation.available.find(g => `${g.residueID}_${g.residueChain}` === resKey);
          if (site && typeof glycanToucan === 'string') {
            newImageSelections[site.residueTag] = glycanToucan;
          }
        });
        if (JSON.stringify(newImageSelections) !== JSON.stringify(selectedGlycanImage)) {
          setSelectedGlycanImage(newImageSelections);
        }
      }
       // Also update selectedGlycans directly if not already set by the first useEffect
      if (JSON.stringify(decodedSelections) !== JSON.stringify(selectedGlycans)) {
        setSelectedGlycans(decodedSelections);
      }

    } catch (e) {
      console.error("Failed to apply selections from URL after data load:", e);
    }
  };


  const [advancedMode, setAdvancedMode] = useState<'fancy' | 'lightweight'>('fancy');


  const [populationSize, setpopulationSize] = useState<number>(128);
  const [maxGenerations, setmaxGenerations] = useState<number>(4);
  const [wiggleAngle, setwiggleAngle] = useState<number>(5);
  const [wiggleAttempts, setwiggleAttempts] = useState<number>(40);
  const [outputFormat, setOutputFormat] = useState<string>("PDB");
  const [selectedGlycans, setSelectedGlycans] = useState<{ [key: string]: string }>({});
  // const [jobId, setJobId] = useState<string>("");
  const [selectedGlycanImage, setSelectedGlycanImage] = useState<{ [key: number]: string }>({});
  const toast = useToast();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const placeholders = [
    "Enter Uniprot Id",
    "Enter PDB Id",
  ];
  const scrollToRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState<readonly ResidueOption[]>([]);
  const steps = [
    { title: 'Upload Structure', description: 'AF, PDB or upload your own' },
    { title: 'Select Glycans', description: 'Choose your N- or O-glycan' },
    { title: 'Download', description: 'Press process and download Re-Glyco structure!' },
  ];
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });

  const onChange = (
    newValue: OnChangeValue<ResidueOption, true>,
    actionMeta: ActionMeta<ResidueOption>
  ) => {
    setValue(newValue ? newValue : []);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpload(false);
    fetchProteinData();
  };

  useEffect(() => {
    let timer: number;
    if (isLoading) {
      const startTime = Date.now();
      timer = window.setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(elapsedSeconds);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLoading]);

  useEffect(() => {
    if (Results?.output) {
      scrollToRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [Results]);

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
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderText(current =>
        current === placeholders[0] ? placeholders[1] : placeholders[0]
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch if protID is set and (it's not an upload OR it is an upload but protData is not yet set for it)
        if (protID && (!isUpload || (isUpload && !protData))) {
          await fetchProteinData(); // fetchProteinData will use the current protID and isUpload states
          // Results are reset inside fetchProteinData or handleFileUpload
        }
      } catch (error) {
        console.error("Error fetching protein data on initial load or ID change:", error);
      }
    };
    fetchData();
  }, [protID, isUpload]); // Trigger fetch when protID or isUpload status changes

  const fetchProteinData = async () => {
    if (!protID && !isUpload) { // Do not fetch if no ID and not an upload scenario
        // console.log("FetchProteinData: Aborted, no protID and not an upload.");
        return;
    }
    // console.log(`FetchProteinData: Fetching for ID: ${protID}, isUpload: ${isUpload}`);
    try {
      const response = await fetch(`${apiUrl}/api/reglyco/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        // Send current protID and isUpload state
        body: JSON.stringify({ protID: protID, isUpload: isUpload })
      });
      const data: protData = await response.json();
      setprotData(data);
      // setIsUpload(false); // This should be set based on URL or file upload, not reset here
      
      // Reset selections only if not coming from URL, or handled by applySelectionsFromURL
      const queryParams = new URLSearchParams(location.search);
      if (!queryParams.has('selections')) {
        setSelectedGlycans({});
        setSelectedGlycanImage({});
        setValue([]); // Reset react-select value if no selections in URL
      }



      setActiveStep(1);
      setResults(null); // Clear previous job results
      setLastSuccessfulSelections(null); // Clear last successful for ensemble switch

    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: 'Wrong uniprot id or pdb id',
          description: "Please check your input and try again.",
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      } else {
        setError("An unknown error occurred.");
      }


    }
  };


  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedExtensions = [".pdb", ".cif"];
      const fileExtension = file.name.slice((Math.max(0, file.name.lastIndexOf(".")) || Infinity) + 1);
      if (!allowedExtensions.includes("." + fileExtension)) {
        console.error("File type not allowed.");
        setError("File type not allowed.");
        return;
      }
      const formData = new FormData();
      formData.append('protFile', file);
      setSelectedGlycans({});
      setSelectedGlycanImage({});
      try {
        setIsUploading(true);
        const response = await axios.post(`${apiUrl}/api/reglyco/init`, formData, {
          timeout: 600000,
          onUploadProgress: (progressEvent) => {
            const percentage = progressEvent.total ? (progressEvent.loaded * 100) / progressEvent.total : 0;
            setUploadProgress(Math.round(percentage));
          },
        });
        if (response.status === 200) {
          setprotData(response.data);
          setIsUpload(true);
          setActiveStep(1);
          setError(null);
          setIsUploading(false);
          setUploadProgress(0);
          setResults({
            box: '',
            clash: false,
            output: '',
            results: [],
            jobId: ''
          });
          setLastSuccessfulSelections(null);
        } else {
          console.error("Failed to upload file.");
        }
      } catch (error) {
        console.error("Error occurred during file upload:", error);
      }
    }
  };

  // ───────────────────────────────────────────────
  // Use a memoized callback to update the selected glycan for a residue.
  // This ensures that the function reference is stable, so that memoized menu components are not forced to update.
  const handleResidueSelect = useCallback(
    (residueID: string, residueTag: number, glycanValue: string) => {
      setSelectedGlycans(prevState => ({
        ...prevState,
        [residueID]: glycanValue
      }));
      setSelectedGlycanImage(prevState => ({
        ...prevState,
        [residueTag]: glycanValue
      }));
    },
    []
  );

  // Add state for job results
  const [jobResults, setJobResults] = useState<ResultItem[] | null>(null);
  // Debounce Hook 
  const useDebounce = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(timer);
      };
    }, [value, delay]);

    return debouncedValue;
  };



  const [lastSuccessfulSelections, setLastSuccessfulSelections] = useState<{ [key: string]: string } | null>(null);


  // Unified handler for processing jobs
  const handleProcessJob = async () => {
    if (Object.keys(selectedGlycans).length === 0) {
      toast({ title: "No Glycans Selected", description: "Please select at least one residue and glycan.", status: "warning" });
      return;
    }

    // --- Common Job Execution Logic ---
    setIsLoading(true);
    setActiveStep(2);
    setJobResults(null); // Clear previous results

    const payload = {
      selectedGlycans: selectedGlycans,
      filename: protData?.filename,
      customPDB: isUpload,
      jobType: "optimization_xp",
      populationSize: populationSize,
      maxGenerations: maxGenerations,
      wiggleAngle: wiggleAngle,
      wiggleAttempts: wiggleAttempts,
      outputFormat: outputFormat,
    };

    try {
      const response = await fetch(`${apiUrl}/api/reglyco/job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const responseData = await response.json();
        setResults(responseData); // Keep setting the main Results state
        setJobResults(responseData.results || []); 
        
        setLastSuccessfulSelections(selectedGlycans); // <-- Store successful selections

        setActiveStep(3);
        setElapsedTime(0);
      } else {
        console.error(`Failed to post data.`);
        // Try to parse error message from server response
        let errorMsg = `Failed to process job. Server responded with status ${response.status}.`;
        try {
          const errorData = await response.json();
          if (errorData && (errorData.error || errorData.message)) {
            errorMsg += `\n${errorData.error || errorData.message}`;
          }
        } catch (e) {
          // Ignore JSON parse errors, fallback to default message
        }
        toast({ title: "Processing Error", description: errorMsg, status: "error" });
        setActiveStep(1);
      }
    } catch (error) {
      console.error(`Error occurred during processing:`, error);
      toast({ title: "Network Error", description: "Could not connect to the processing server.", status: "error" });
      setActiveStep(1);
    } finally {
      setIsLoading(false);
    }
  };



  const navigate = useNavigate();
  const handleSwitchToEnsemble = () => {
    if (!protData || !lastSuccessfulSelections) {
        toast({
            title: "Cannot Switch",
            description: "Protein data or previous successful selections are missing.",
            status: "warning",
            duration: 3000,
            isClosable: true,
        });
        return;
    }
  
    const selectionsString = encodeURIComponent(JSON.stringify(lastSuccessfulSelections));
    // Use the current protID and isUpload state for navigation
    const protIdParam = protID; 
    const isUploadParam = isUpload.toString();
  
    // Navigate to the ensemble route with query parameters
    navigate(`/ensemble?id=${protIdParam}&isUpload=${isUploadParam}&selections=${selectionsString}`);
  };

  // Memoize the list of residue selection components
  const residueSelectionComponents = useMemo(() => {
    // Ensure protData and necessary nested properties exist
    if (!protData?.glycosylation?.available || !protData.configurations) {
      return null; // Or return an empty array or placeholder
    }

    return protData.glycosylation.available.map((glycoConf: Glycosylation) => {
      const isSelected = value.find((option) => option.value === glycoConf.residueTag);
      if (!isSelected) return null;

      // Ensure configurations for the specific residue name exist
      const residueGlycans = protData.configurations[glycoConf.residueName];
      if (!residueGlycans) return null; // Handle case where glycans for residue type might be missing

      // --- Conditional Rendering Logic ---
      if (advancedMode === 'fancy') {
        // Render the existing fancy ResidueMenu
        return (
          <ResidueMenu
            key={`${glycoConf.residueTag}-fancy`} // Ensure unique key
            glycoConf={glycoConf}
            selectedGlycan={selectedGlycanImage[glycoConf.residueTag]}
            onSelect={handleResidueSelect}
            glycans={residueGlycans} // Pass the specific glycans
            apiUrl={apiUrl}
            residueKey={glycoConf.residueTag}
          />
        );
      } else {
        // Render the new lightweight Input
        const residueKeyString = `${glycoConf.residueID}_${glycoConf.residueChain}`;
        return (
          <Flex
            key={`${glycoConf.residueTag}-light`} // Ensure unique key
            w="100%"
            align="center"
            justify="space-between"
            p={2}
            gap={4} // Add some gap
            borderBottom="1px solid" // Add separator
            borderColor="gray.100"
          >
            <Box minW="200px">
              <Heading
                fontSize={{ base: "md", md: "md" }} // Slightly smaller heading
                noOfLines={1}
                color="gray.600" // Dimmed color
              >
                {`Residue ${glycoConf.residueName} ${glycoConf.residueID} ${glycoConf.residueChain}`}
              </Heading>
            </Box>
            <Input
              flex="1" // Take available space
              placeholder="Enter GlyTouCan ID or IUPAC (e.g., G00028MO or Man(a1-3)[Man(a1-6)]Man(a1-6)[Man(a1-3)]Man(b1-4)GlcNAc(b1-4)GlcNAc)"
              value={selectedGlycans[residueKeyString] || ''} // Get value from selectedGlycans
              onChange={(e) => {
                const newGlycanId = e.target.value.trim(); // Basic normalization, keep case for IUPAC
                // Update selectedGlycans directly
                setSelectedGlycans(prevState => ({
                  ...prevState,
                  [residueKeyString]: newGlycanId
                }));
                // Clear image selection if input is used
                setSelectedGlycanImage(prevState => {
                    const newState = {...prevState};
                    delete newState[glycoConf.residueTag];
                    return newState;
                });
              }}
              size="sm" // Smaller input
            />
          </Flex>
        );
      }
      // --- End Conditional Rendering Logic ---
    }).filter(Boolean); // Filter out null values if any residues were skipped
  }, [
      protData, 
      value, 
      advancedMode, 
      selectedGlycanImage, 
      selectedGlycans, 
      handleResidueSelect, 
      apiUrl 
  ]);

  // Render
  return (
    <>
      <Flex
        w="100%"
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
                rgba(269, 162, 103, 0.7) 100%
              ), 
              url(${bg})`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "50% 30%"
        }}
        backgroundRepeat="no-repeat"
        justifyContent="center"
        alignItems="center"
        p={1}
        direction={{ base: "column", sm: "column", md: "row", lg: "row", xl: "row" }}
      >
        <Text
          bgGradient='linear(to-l, #F7FFE6, #F7FFE6)'
          bgClip='text'
          fontSize={{ base: "4xl", sm: "4xl", md: "5xl", lg: "5xl", xl: "5xl" }}
          marginBottom="0.2em"
        >
          <Link fontWeight="bold" fontFamily={'heading'} href="/reglyco" marginRight="20px">
            Re-Glyco XP
          </Link>
        </Text>

        <Flex
          width="40%"
          minWidth={{ base: "70%", md: "40%" }}
          align="center"
          position="relative"
          gap="1em"
          boxShadow="xl"
          borderRadius="full"
          overflow="hidden"
          p="0.5em"
          bg="white"
        >
          <form onSubmit={handleSearch}>
            <Input
              onChange={(e) => {
                setprotID(e.target.value);
                setIsUpload(false);
              }}
              ref={searchRef}
              fontFamily={'texts'}
              placeholder={placeholderText}
              value={protID}
              size="lg"
              flex="1"
              border="none"
              _hover={{ boxShadow: "none" }}
              _focus={{ boxShadow: "none", outline: "none" }}
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
            backgroundColor="#A5494D"
            _hover={{ backgroundColor: "#D27254" }}
            size={{ base: "md", sm: "md", md: "md", lg: "md", xl: "md" }}
            onClick={handleSearch}
          >
            Fetch
          </Button>
        </Flex>

        <Text
          marginLeft={"2rem"}
          bgGradient='linear(to-l, #FFFFF0, #FFFFF0)'
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
              <Button as="label" backgroundColor="#A5494D" _hover={{ backgroundColor: "#96660A" }} size="md" w="full">
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
        {protData ? (
          <Flex
            w="100%"
            justifyContent="left"
            alignItems="center"
            p={2}
            marginTop={"0"}
            direction="column"
          >
            <Flex
              w="100%"
              align="center"
              justify="center"
              flex="1"
              padding="2rem"
              paddingTop={'0rem'}
              direction={{ base: "column", sm: "column", md: "row", lg: "row", xl: "row" }}
            >
              <Heading margin={"0rem"} marginLeft={"0"} marginBottom={'0rem'} as='h4' size='xl'>
                {isUpload ? "File:" : `Uniprot/PDB ID: `} {protData.id}
              </Heading>

              <Spacer />
              <Box>
                <Stepper
                  width={{ base: "0%", sm: "0%", md: "auto", lg: "auto", xl: "auto" }}
                  visibility={{ base: "hidden", sm: "hidden", md: "visible", lg: "visible", xl: "visible" }}
                  margin="1rem"
                  size={{ base: "sm", sm: "sm", md: "sm", lg: "md", xl: "md" }}
                  colorScheme='gray'
                  index={activeStep}
                >
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
                          <StepDescription>{step.description}</StepDescription>
                        </Hide>
                      </Box>
                      <StepSeparator />
                    </Step>
                  ))}
                </Stepper>
              </Box>
            </Flex>

            <Box w="90%" justifyContent="center" alignItems="center" p={2} marginTop={"0"}>
              <Box as="span" flex='1' textAlign='left'>
                <Heading as='h4' size='md' color={"#A5494D"}>
                  Structure Information
                </Heading>
              </Box>

              {!isUpload ? (
                <SimpleGrid
                  alignSelf="center"
                  justifyItems="center"
                  templateColumns={{ base: '1fr', lg: '30% 70%' }}
                  spacing={0}
                  paddingTop={'1rem'}
                  paddingBottom={'2rem'}
                >
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
                      AlphaFold produces a per-residue confidence score (pLDDT) between 0 and 100. Some regions below 50 pLDD may be unstructured in isolation.
                    </Text>
                  </Box>
                  {protData && protData.requestURL ? (
                    <iframe
                      key={isUpload ? "uploaded" : protData.requestURL}
                      width="100%"
                      height="400px"
                      src={`/viewer/embedded.html?pdbUrl=${protData.requestURL}&format=${protData.requestURL.endsWith('.pdb') ? 'pdb' : 'mmcif'}`}
                      allowFullScreen
                      title="Protein Structure"
                    />
                  ) : (
                    <Box
                      width="100%"
                      height="400px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      backgroundColor="gray.100"
                      borderRadius="md"
                    >
                      <Text color="gray.500">Loading structure viewer...</Text>
                    </Box>
                  )}
                </SimpleGrid>
              ) : (
                <SimpleGrid
                  alignSelf="center"
                  justifyItems="center"
                  templateColumns={{ base: '1fr', lg: '100% 0%' }}
                  spacing={0}
                  paddingTop={'0rem'}
                  paddingBottom={'2rem'}
                >
                  {protData && protData.requestURL ? (
                    <iframe
                      key={isUpload ? "uploaded" : protData.requestURL}
                      width="100%"
                      height="400px"
                      src={`/viewer/embeddedfit.html?pdbUrl=${protData.requestURL}`}
                      allowFullScreen
                      title="Protein Structure"
                    />
                  ) : (
                    <Box
                      width="100%"
                      height="400px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      backgroundColor="gray.100"
                      borderRadius="md"
                    >
                      <Text color="gray.500">Loading structure viewer...</Text>
                    </Box>
                  )}
                </SimpleGrid>
              )}

              <div>
                
                  
                      <div>
                        <Heading
                          margin={'1rem'}
                          marginBottom={'1rem'}
                          // fontFamily={'texts'}
                          color='#A5494D'
                          fontSize={{ base: "1xl", sm: "1xl", md: "1xl", lg: "2xl", xl: "2xl" }}
                        >
                          Select residues to glycosylate
                        </Heading>
                        <Select
  value={value}
  isMulti
  name="residues"
  className="basic-multi-select"
  classNamePrefix="select"
  onChange={onChange}
  closeMenuOnSelect={false}
  options={
    protData?.glycosylation?.available
      ?.filter((glycoConf: Glycosylation) => glycoConf.residueName === 'ASN') // Only ASN
      .map((glycoConf: Glycosylation) => ({
        value: glycoConf.residueTag,
        label: `${glycoConf.residueName}${glycoConf.residueID}${glycoConf.residueChain}`
      }))
  }
/>

                        <FormControl display="flex" alignItems="center" justifyContent="flex-end" my={4}>
                          <FormLabel htmlFor="advanced-mode-toggle" mb="0" fontSize="sm" mr={2}>
                            Use Lightweight Input?
                          </FormLabel>
                          <Switch
                            id="advanced-mode-toggle"
                            isChecked={advancedMode === 'lightweight'}
                            onChange={(e) => setAdvancedMode(e.target.checked ? 'lightweight' : 'fancy')}
                            colorScheme="teal" // Match theme
                          />
                        </FormControl>

                        {/* Render the memoized list */}
                        {residueSelectionComponents}

                        <br />

                        {/* Add Advanced Settings Accordion */}
                        <Accordion allowToggle width="100%" mb={2} borderRadius="md" boxShadow="sm">
                          <AccordionItem border="1px solid" borderColor="gray.200" borderRadius="md">
                            <h2>
                              <AccordionButton bg="gray.50" _hover={{ bg: "gray.100" }} borderRadius="md">
                                <Box flex="1" textAlign="left" fontWeight="medium" color="#B07095">
                                  Advanced Settings
                                </Box>
                                <AccordionIcon />
                              </AccordionButton>
                            </h2>
                            <AccordionPanel pb={4} bg="white">
                              <VStack spacing={6} align="stretch">
                                {/* Population Size */}
                                <FormControl>
                                  <FormLabel fontWeight="medium" color="#B07095" mb={2}>
                                    <Tooltip label="Population size to be used in genetic optimization. Higher values may capture more conformational space but increase computational cost.">
                                    Population Size: {populationSize}
                                    </Tooltip>
                                  </FormLabel>
                                  <Slider
                                    aria-label="Population Size"
                                    defaultValue={50}
                                    value={populationSize}
                                    min={32}
                                    max={512}
                                    step={32}
                                    colorScheme="teal"
                                    onChange={(val) => setpopulationSize(val)}
                                  >
                                    <SliderTrack>
                                      <SliderFilledTrack />
                                    </SliderTrack>
                                    <SliderThumb />
                                  </Slider>
                                  {/* <FormHelperText >Adjust ray size for glycan ensemble generation</FormHelperText> */}
                                </FormControl>

                                {/* maxGenerations Slider */}
                                <FormControl>
                                  <FormLabel fontWeight="medium" color="#B07095" mb={2}>
                                    <Tooltip label="Maximum number of generation to used in the optimization. Higher values produce better results but take longer.">
                                    Maximum generation: {maxGenerations}
                                    </Tooltip>
                                  </FormLabel>
                                  <Slider
                                    aria-label="max Generation"
                                    defaultValue={4}
                                    value={maxGenerations}
                                    min={1}
                                    max={20}
                                    step={1}
                                    colorScheme="teal"
                                    onChange={(val) => setmaxGenerations(val)}
                                  >
                                    <SliderTrack>
                                      <SliderFilledTrack />
                                    </SliderTrack>
                                    <SliderThumb />
                                  </Slider>
                                  {/* <FormHelperText fontSize={'xs'}>1 = Fast but less accurate, 10 = Slow but more accurate</FormHelperText> */}
                                </FormControl>

                                {/* wiggle Angle Slider */}
                                <FormControl>
                                  <FormLabel fontWeight="medium" color="#B07095" mb={2}>
                                    <Tooltip label="Wiggle angle for the glycan. Higher values produce more diverse conformations but may be less realistic.">
                                    Wiggle Angle: {wiggleAngle}
                                    </Tooltip>
                                  </FormLabel>
                                  <Slider
                                    aria-label="Wiggle Angle"
                                    defaultValue={5}
                                    value={wiggleAngle}
                                    min={0}
                                    max={10}
                                    step={1}
                                    colorScheme="teal"
                                    onChange={(val) => setwiggleAngle(val)}
                                  >
                                    <SliderTrack>
                                      <SliderFilledTrack />
                                    </SliderTrack>
                                    <SliderThumb />
                                  </Slider>
                                  {/* <FormHelperText fontSize={'xs'}>Adjust ray size for glycan ensemble generation</FormHelperText> */}
                                </FormControl>

                                {/* wiggle Attempts Slider */}
                                <FormControl>
                                  <FormLabel fontWeight="medium" color="#B07095" mb={2}>
                                    <Tooltip label="Number of attempts to wiggle the glycan. Higher values produce more diverse conformations but use more compute.">
                                    Wiggle Attempts: {wiggleAttempts}
                                    </Tooltip>
                                  </FormLabel>
                                  <Slider
                                    aria-label="Wiggle Attempts"
                                    defaultValue={10}
                                    value={wiggleAttempts}
                                    min={1}
                                    max={100}
                                    step={1}
                                    colorScheme="teal"
                                    onChange={(val) => setwiggleAttempts(val)}
                                  >
                                    <SliderTrack>
                                      <SliderFilledTrack />
                                    </SliderTrack>
                                    <SliderThumb />
                                  </Slider>
                                  {/* <FormHelperText fontSize={'xs'}>Adjust ray size for glycan ensemble generation</FormHelperText> */}
                                </FormControl>

                                


                                {/* Output Format */}
                                <FormControl>
                                  <HStack spacing={2}>
                                    <FormLabel justifySelf={'center'} fontWeight="medium" color="#B07095" mb={2}>
                                      <Tooltip label="Select the output format for the generated structure.">
                                        Output Format
                                      </Tooltip>
                                    </FormLabel>
                                    {["PDB", "GLYCAM", "CHARMM"].map((format) => (
                                      <Button
                                        key={format}
                                        onClick={() => setOutputFormat(format)}
                                        colorScheme={outputFormat === format ? "teal" : "gray"}
                                        variant={outputFormat === format ? "solid" : "outline"}
                                        size="sm"
                                        textTransform="uppercase"
                                      >
                                        {format}
                                      </Button>
                                    ))}
                                  </HStack>
                                </FormControl>
                              </VStack>
                            </AccordionPanel>
                          </AccordionItem>
                        </Accordion>

                        <VStack align={"self-start"}>

                          <Text color='#B195A2' alignSelf={"left"} fontSize={'xs'}>
                            This will take a few minutes. Please be patient.
                          </Text>

                          <Button
                            position={"relative"}
                            margin={'1rem'}
                            borderRadius="full"
                            backgroundColor="#ECD292"
                            _hover={{ backgroundColor: "#D27254" }}
                            size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}
                            onClick={() => handleProcessJob()}
                            isDisabled={isLoading}
                          >
                            {isLoading ? (
                              <Box position="relative" display="inline-flex" alignItems="center" justifyContent="center">
                                <CircularProgress
                                  position="absolute"
                                  color="#ECD292"
                                  size="50px"
                                  thickness="5px"
                                  isIndeterminate
                                  marginLeft={"15rem"}
                                  capIsRound
                                  onClick={() => handleProcessJob()}>
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
                        </VStack>
                      </div>
                  
              </div>


              {Results?.output && (
                <Box ref={scrollToRef}>
                  {Results?.clash ? (
                    <Alert status='warning'>
                      <AlertIcon />
                      Clash detected! Structure orientation for some spots are not glycan friendly.
                    </Alert>
                  ) : (
                    <Alert status='success'>
                      <AlertIcon />
                      Processed!
                    </Alert>
                  )}
                    <iframe
                      width="100%"
                      height="400px"
                      src={`/viewer/embeddedfit.html?pdbUrl=${apiUrl}/output/${Results?.output}&format=pdb`}
                      
                      frameBorder="0"
                      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Protein Structure"
                    />

                  
                    
                    <div>
                      <a href={`${apiUrl}/output/${Results?.output}`} download>
                        <Button
                          position={"relative"}
                          margin={'1rem'}
                          borderRadius="full"
                          isDisabled={isLoading}
                          backgroundColor="#B07095"
                          _hover={{ backgroundColor: "#CF6385" }}
                          size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}
                        >
                          Download Re-glycosylated Structure PDB File
                        </Button>
                      </a>

                      <a href={`${apiUrl}/api/reglyco/download/${Results.jobId}`} download>
                                                <Button
                                                  position={"relative"}
                                                  margin={'1rem'}
                                                  borderRadius="full"
                                                  isDisabled={isLoading}
                                                  backgroundColor="#81D8D0"
                                                  _hover={{ backgroundColor: "#008081" }}
                                                  size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}
                                                >
                                                  Download full job Files
                                                </Button>
                                              </a>
                      
                      <Button
                position={"relative"}
                margin={'1rem'}
                borderRadius="full"
                isDisabled={!lastSuccessfulSelections} // Disable if no successful selections stored
                backgroundColor="#8C619D" // Ensemble-like color
                _hover={{ backgroundColor: "#A77CA6" }}
                size={{ base: "md", lg: "lg" }}
                onClick={handleSwitchToEnsemble}
                title="Switch to Ensemble mode with current selections"
              >
                Switch to Ensemble Mode
              </Button>

                    </div>
                    <Text color='#B195A2' alignSelf={"left"} fontSize={'xs'}>
                      If you encounter any issues or suspect a bug contact us <Link href="mailto:OJAS.SINGH.2023@mumail.ie">here</Link>
                    </Text>
                  {jobResults && jobResults.length > 0 && (
                    <Box mt={6} mb={6} p={5} borderWidth="1px" borderRadius="lg" borderColor="gray.200" bg="white" boxShadow="sm">
                      <Heading as="h5" size="md" color="#B07095" mb={4}>
                        Clash Resolution Results
                      </Heading>
                      <VStack align="stretch" spacing={3}>
                        {jobResults.map((result, index) => (
                          <Flex
                            key={index}
                            align="center"
                            justify="space-between"
                            p={3}
                            borderRadius="md"
                            bg={result.clash_solved ? "green.50" : "red.50"}
                            border="1px solid"
                            borderColor={result.clash_solved ? "green.200" : "red.200"}
                            boxShadow="xs"
                            wrap="wrap"
                          >
                            <HStack spacing={3} align="center">
                              <Text fontSize="2xl" color={result.clash_solved ? "green.500" : "red.500"}>
                                {result.clash_solved ? '✓' : '✗'}
                              </Text>
                              <Badge colorScheme={result.clash_solved ? "green" : "red"} variant="solid" px={3} py={1}>
                                {result.clash_solved ? 'Solved' : 'Failed'}
                              </Badge>
                              <Text fontWeight="semibold" color="gray.700">
                                Glycan: <span style={{ color: "#B07095" }}>{result.glycan}</span>
                              </Text>
                              <Text fontWeight="semibold" color="gray.600">
                                Residue: <span style={{ color: "#008081" }}>{result.residue}</span>
                              </Text>
                            </HStack>
                            <HStack spacing={6}>
                              <Text fontSize="sm" color="gray.600">
                                Φ: <b>{typeof result.phi === "number" ? result.phi.toFixed(2) : "-"}</b>
                              </Text>
                              <Text fontSize="sm" color="gray.600">
                                Ψ: <b>{typeof result.psi === "number" ? result.psi.toFixed(2) : "-"}</b>
                              </Text>
                              <Badge colorScheme="purple" variant="subtle">
                                Cluster {result.cluster}
                              </Badge>
                            </HStack>
                          </Flex>
                        ))}
                      </VStack>
                    </Box>
                  )}
                      
                  <Text fontWeight="bold">Processing log:</Text>
                  <Code>
                    {Results?.box.split('\n').map((line, index) => (
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
        ) : (
          // --- Placeholder content when no protData ---
          <Flex
            w="100%"
            minHeight={'60vh'}
            justifyContent="left"
            alignItems="left"
            p={2}
            marginTop={"0"}
            direction="column"
          >
            <Flex
              w="100%"
              justify="center"
              flex="1"
              padding="0rem"
              paddingTop={'0rem'}
              direction={{ base: "column", sm: "column", md: "row", lg: "row", xl: "row" }}
            >
              <Text
                bgGradient='linear(to-l,  #A5494D, #ECD292)'
                bgClip='text'
                fontSize={{ base: "3xl", sm: "3xl", md: "4xl", lg: "5xl", xl: "5xl" }}
                fontWeight='bold'
                marginBottom="0.2em"
                marginLeft={'2rem'}
              >
                A GlycoProtein Builder
              </Text>
              <Spacer />
              <Box>
                <Stepper
                  width={{ base: "0%", sm: "0%", md: "auto", lg: "auto", xl: "auto" }}
                  visibility={{ base: "hidden", sm: "hidden", md: "visible", lg: "visible", xl: "visible" }}
                  margin="1rem"
                  size={{ base: "sm", sm: "sm", md: "sm", lg: "md", xl: "md" }}
                  colorScheme='yellow'
                  index={activeStep}
                >
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
                          <StepDescription>{step.description}</StepDescription>
                        </Hide>
                      </Box>
                      <StepSeparator />
                    </Step>
                  ))}
                </Stepper>
              </Box>
            </Flex>

            <SimpleGrid
              alignSelf="center"
              justifyItems="center"
              columns={[1, 2]}
              spacing={0}
              paddingTop={'1rem'}
              paddingBottom={'2rem'}
            >

              <video width={'50%'} autoPlay loop muted id="bgVideo" >
                <source src="/gamma_s.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <Box padding={"2rem"} paddingTop={"0rem"}>
                <Text
                  bgGradient='linear(to-l,  #A5494D, #E1C899)'
                  bgClip='text'
                  fontSize={{ base: "3xl", sm: "3xl", md: "4xl", lg: "5xl", xl: "5xl" }}
                  fontWeight='bold'
                  marginBottom="0.2em"
                  align={"center"}
                  marginLeft={'2rem'}
                >
                  eXtended Potential
                </Text>
                <Text fontFamily={'texts'} color='#B195A2' paddingTop="10rem" padding={"0rem"} justifySelf="left" align={'left'} fontSize={'lg'}>

                  Re-Glyco is a tool we designed to restore the missing glycosylation on glycoproteins deposited in the RCSB PDB or in the EBI-EMBL AlphaFold protein structure database. To get started, upload your protein structure file or choose a pre-existing AlphaFold or PDB structure, and let Re-Glyco do the rest! Below are some example of UniProt IDs to get you started:
                </Text>

                <Text fontFamily={'texts'}>
                  <Button margin='0rem' onClick={(e) => (setprotID('P27918'))} colorScheme='purple' variant='link' size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}>P27918</Button>
                  <Button margin='0rem' onClick={(e) => (setprotID('Q7Z3Q1'))} colorScheme='purple' variant='link' size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}>Q7Z3Q1</Button>
                  <Button margin='0rem' onClick={(e) => (setprotID('P29016'))} colorScheme='purple' variant='link' size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}>P29016</Button>
                  <Button margin='0rem' onClick={(e) => (setprotID('O15552'))} colorScheme='purple' variant='link' size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}>O15552</Button>
                  <Button margin='0rem' onClick={(e) => (setprotID('I3UJJ7'))} colorScheme='purple' variant='link' size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}>I3UJJ7</Button>
                </Text>
                <Text fontFamily={'texts'} paddingTop="0rem" color='#B195A2' alignSelf={"left"} fontSize={'lg'}>
                  and press fetch!</Text>

                <Text fontFamily={'texts'} paddingTop="2rem" color='#B195A2' alignSelf={"right"} fontSize={'xs'}>
                  Currently supported function includes :<br />
                  N-GlcNAcylation<br />
                  O-GalNAcylation<br />
                </Text>
              </Box>
            </SimpleGrid>
          </Flex>
        ) }

        {/* Error display */}
        {error && (
          <Alert status='error' mt={4}>
            <AlertIcon />
            {error}
          </Alert>
        )}
      </VStack>
    </>
  );
};

export default ReGlyco;