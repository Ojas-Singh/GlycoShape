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
    Checkbox,
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
  import { AttachmentIcon, AddIcon } from '@chakra-ui/icons'
  import { Kbd } from '@chakra-ui/react';
  import bg from './assets/gly.png';
  import fit from './assets/fit.png'
  import Select, { ActionMeta, OnChangeValue } from 'react-select';
  import LiveProgress from './LiveProgress';
  
  
  // ───────────────────────────────────────────────
  // Interfaces (unchanged)
  interface ResultItem {
    clash_solved: boolean;
    cluster: number;
    glycan: string;
    phi: number;
    psi: number;
    residue: string;
  }
  
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
  
  interface GlycosylationData {
    available: Glycosylation[];
    uniprot: Glycosylation[];
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
          bgColor="#B07095"
          _hover={{ backgroundColor: "#CF6385" }}
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
    const [scanResults, setScanResults] = useState<ScanResults | null>({
      box: '',
      clash: false,
      output: '',
      results: []
    });

    const [output_sasa, setOutputSasa] = useState("");
    const [ensembleSize, setensembleSize] = useState<number>(50);
    const [wiggle, setWiggle] = useState<number>(2);
    const [effortLevel, setEffortLevel] = useState<number>(5);
    const [checkSteric, setCheckSteric] = useState<boolean>(false);
    const [calculateSASA, setCalculateSASA] = useState<boolean>(true);
    const [outputFormat, setOutputFormat] = useState<string>("PDB");
    const [selectedGlycans, setSelectedGlycans] = useState<{ [key: string]: string }>({});
    const [jobId, setJobId] = useState<string>("");
    const [outputPath, setOutputPath] = useState("");
    const [plotPath, setPlotPath] = useState("");
    const [clashValue, setClashValue] = useState(false);
    const [boxValue, setBoxValue] = useState("");
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
      { title: 'Select Glycans', description: 'and upload SAXS/density file' },
      { title: 'Download', description: 'Press process and download Re-Glyco-Fit structure!' },
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
      if (outputPath) {
        scrollToRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }, [outputPath]);
  
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
          if (!isUpload && protID) {
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
    }, [isUpload, protID]);
  
    const fetchProteinData = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/reglyco/init`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ protID: protID, isUpload: isUpload })
        });
        const data: protData = await response.json();
        setprotData(data);
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
            setScanResults({
              box: '',
              clash: false,
              output: '',
              results: []
            });
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
  
    // ───────────────────────────────────────────────
    const handleProcess = async () => {
      setIsLoading(true);
      setActiveStep(2);
      setOutputPath("");
      // Compute job id from current datetime
      const currentJobId = new Date().toISOString();
      setJobId(currentJobId);
    
      const payload = {
        jobId: currentJobId, // job folder name in server
        selectedGlycans: selectedGlycans,
        filename: protData?.filename,
        customPDB: isUpload,
        jobType: "ensemble",
        ensembleSize: ensembleSize,
        wiggle: wiggle,
        effortLevel: effortLevel,
        checkSteric: checkSteric,
        calculateSASA: calculateSASA,
        outputFormat: outputFormat,
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
          setBoxValue(responseData.box);
          setPlotPath(responseData.plot);
          setOutputSasa(responseData.sasa);
          setActiveStep(3);
          setElapsedTime(0);
        } else {
          console.error("Failed to post data.");
        }
      } catch (error) {
        console.error("Error occurred:", error);
      } finally {
        setIsLoading(false);
      }
    };
  
    // ───────────────────────────────────────────────
    // Add this type guard function at the top level
    const isValidProtData = (data: protData | null): data is protData => {
      return data !== null && 
             typeof data === 'object' && 
             'requestURL' in data && 
             typeof data.requestURL === 'string';
    };
  
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
                rgba(88, 8, 88, 0.6) 100%
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
            <Link fontWeight="bold" fontFamily={'heading'} href="/ensemble" marginRight="20px">
              Re-Glyco Ensemble
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
              backgroundColor="#8C619D"
              _hover={{ backgroundColor: "#A77CA6" }}
              size={{ base: "md", sm: "md", md: "md", lg: "md", xl: "md" }}
              onClick={handleSearch}
            >
              Fetch
            </Button>
          </Flex>
  
          <Text
            marginLeft={"2rem"}
            bgGradient='linear(to-l,rgb(124, 77, 146),rgb(129, 92, 160))'
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
                <Button as="label" backgroundColor="#8C619D" _hover={{ backgroundColor: "#8C619D" }} size="md" w="full">
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
                  <Heading as='h4' size='md' color={"#B07095"}>
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
                        AlphaFold produces a per-residue confidence score (pLDDT) between 0 and 100. Some regions below 50 pLDDT may be unstructured in isolation.
                      </Text>
                    </Box>
                    {isValidProtData(protData) ? (
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
                    {isValidProtData(protData) ? (
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
                  <Heading
                    margin={'1rem'}
                    marginBottom={'1rem'}
                    // fontFamily={'texts'}
                    color='#B07095'
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
                    options={protData?.glycosylation?.available?.map((glycoConf: Glycosylation) => ({
                      value: glycoConf.residueTag,
                      label: `${glycoConf.residueName}${glycoConf.residueID}${glycoConf.residueChain}`
                    }))}
                  />
  
                  {/* Use the new memoized ResidueMenu component.
                      Only render menus for residues that the user has selected. */}
                  {protData?.glycosylation?.available &&
                    Array.isArray(protData.glycosylation.available) &&
                    protData.glycosylation.available.map((glycoConf: Glycosylation) => {
                      const isSelected = value.find((option) => option.value === glycoConf.residueTag);
                      if (!isSelected) return null;
                      return (
                        <ResidueMenu
                          key={glycoConf.residueTag}
                          glycoConf={glycoConf}
                          selectedGlycan={selectedGlycanImage[glycoConf.residueTag]}
                          onSelect={handleResidueSelect}
                          glycans={protData.configurations[glycoConf.residueName]}
                          apiUrl={apiUrl}
                          residueKey={glycoConf.residueTag}
                        />
                      );
                    })
                  }
  
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
                          {/* Ray Size Slider */}
                          <FormControl>
                            <FormLabel fontWeight="medium" color="#B07095" mb={2}>
                              <Tooltip label="Output ensemble size. Higher values may capture more conformational space but increase computational cost.">
                              Ensemble Size: {ensembleSize} conformations
                              </Tooltip>
                            </FormLabel>
                            <Slider
                              aria-label="Ray Size"
                              defaultValue={50}
                              value={ensembleSize}
                              min={1}
                              max={500}
                              step={1}
                              colorScheme="teal"
                              onChange={(val) => setensembleSize(val)}
                            >
                              <SliderTrack>
                                <SliderFilledTrack />
                              </SliderTrack>
                              <SliderThumb />
                            </Slider>
                            {/* <FormHelperText >Adjust ray size for glycan ensemble generation</FormHelperText> */}
                          </FormControl>

                            
                            {/* Wiggle Slider */}
                            <FormControl>
                              <FormLabel fontWeight="medium" color="#B07095" mb={2}>
                                <Tooltip label="Controls the amount of random movement applied to the glycan during modeling. Higher values produce more diverse conformations but clashes within the glycan may occur.">
                                  Wiggle: {wiggle}°
                                </Tooltip>
                              </FormLabel>
                              <Slider
                                aria-label="Wiggle"
                                defaultValue={2}
                                value={wiggle}
                                min={0}
                                max={10}
                                step={1}
                                colorScheme="teal"
                                onChange={(val) => setWiggle(val)}
                              >
                                <SliderTrack>
                                  <SliderFilledTrack />
                                </SliderTrack>
                                <SliderThumb />
                              </Slider>
                              {/* <FormHelperText fontSize={'xs'}>0 = No wiggle, 10 = Maximum wiggle</FormHelperText> */}
                            </FormControl>

                          {/* Effort Level Slider */}
                          <FormControl>
                            <FormLabel fontWeight="medium" color="#B07095" mb={2}>
                              <Tooltip label="Controls the computational effort invested in finding optimal glycan conformations. Higher values produce better results but take longer.">
                                Effort Level: {effortLevel}
                              </Tooltip>
                            </FormLabel>
                            <Slider
                              aria-label="Effort Level"
                              defaultValue={2}
                              value={effortLevel}
                              min={1}
                              max={20}
                              step={1}
                              colorScheme="teal"
                              onChange={(val) => setEffortLevel(val)}
                            >
                              <SliderTrack>
                                <SliderFilledTrack />
                              </SliderTrack>
                              <SliderThumb />
                            </Slider>
                            {/* <FormHelperText fontSize={'xs'}>1 = Fast but less accurate, 10 = Slow but more accurate</FormHelperText> */}
                          </FormControl>

                          {/* Glycan-Glycan Steric Check */}
                          <FormControl display="flex" alignItems="center">
                            <FormLabel htmlFor="glycan-steric-check" mb="0" fontWeight="medium" color="#B07095">
                              <Tooltip label="Enables checking for steric clashes between different glycans during modeling">
                                Glycan-Glycan Steric Checks
                              </Tooltip>
                            </FormLabel>
                            <Switch 
                              id="glycan-steric-check" 
                              isChecked={checkSteric} 
                              onChange={(e) => setCheckSteric(e.target.checked)}
                              colorScheme="teal"
                              size="md"
                            />
                          </FormControl>

                          {/* Calculate SASA */}
                          <FormControl display="flex" alignItems="center">
                            <FormLabel htmlFor="calculate-sasa" mb="0" fontWeight="medium" color="#B07095">
                              <Tooltip label="Calculates Solvent Accessible Surface Area for the final model">
                                Calculate SASA
                              </Tooltip>
                            </FormLabel>
                            <Switch 
                              id="calculate-sasa" 
                              isChecked={calculateSASA} 
                              onChange={(e) => setCalculateSASA(e.target.checked)}
                              colorScheme="teal"
                              size="md"
                            />
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
                    
                  {/* <Text color="#B195A2" fontFamily={'heading'} fontWeight={'bold'}>
                        Ray Size: {ensembleSize}
                    </Text>
                    <Slider width={'50rem'}
                        aria-label="Ray Size"
                        defaultValue={50}
                        min={1}
                        max={500}
                        step={1}
                        colorScheme="teal"
                        onChange={(val) => setensembleSize(val)}
                    >
                        <SliderTrack>
                        <SliderFilledTrack />
                        </SliderTrack>
                        <SliderThumb />
                    </Slider> */}

                    <Text color='#B195A2' alignSelf={"left"} fontSize={'xs'}>
                      This will take a few minutes. Please be patient.
                    </Text>
  
                    <Button
                      position={"relative"}
                      margin={'1rem'}
                      borderRadius="full"
                      backgroundColor="#81D8D0"
                      _hover={{ backgroundColor: "#008081" }}
                      size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}
                      onClick={handleProcess}
                      isDisabled={isLoading}
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
  
                    {isLoading && (
                      <Alert status='info'>
                        <AlertIcon />
                        It can take up to 5 minutes to process your request. Please wait. <br />
                        Please be advised that in the case of multiple users running simultaneously, your Re-Glyco job may take longer than expected.
                      
                      </Alert>
                    )}
                  </VStack>
                </div>
                {/* {jobId && activeStep !== 1 && (
          <Box mt={4}>
            <LiveProgress jobId={jobId} apiUrl={process.env.REACT_APP_API_URL || ""} />
          </Box>
        )} */}
                  
                {outputPath && (
                  <Box ref={scrollToRef}>
                    {clashValue ? (
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
                    <div>
                      <iframe
                        width="100%"
                        height="400px"
                        src={ `/viewer/embeddedfit.html?pdbUrl=${apiUrl}/output/${outputPath}`
                        }
                        frameBorder="0"
                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Protein Structure"
                      />

                      {calculateSASA && (
                        <>
                          <HStack marginTop={"1rem"}>
                            <Text color='#B07095' fontFamily={'heading'} fontWeight={'bold'}>
                              Solvent Accessible Surface Area (SASA): Accessible
                            </Text>
                            <Box w='100px' h='20px' bgGradient='linear(to-r, #315CD6, #FFFFFF, #AD1F1F)' />
                            <Text color='#B07095' fontFamily={'heading'} fontWeight={'bold'}>
                              Not accessible
                            </Text>
                          </HStack>

                          <iframe
                            width="100%"
                            height="400px"
                            src={`/viewer/index_full.html?snapshot-url=${apiUrl}/output/${output_sasa}&snapshot-url-type=molj`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title="Protein Structure"
                          />

                          
                        </>
                      )}
                      <Image padding= {'6'} src={`${apiUrl}/output/${plotPath}`} alt="Glycoprotein" width="100%" />
                      <div>
                        <a href={`${apiUrl}/output/${outputPath}`} download>
                          <Button
                            position={"relative"}
                            margin={'1rem'}
                            borderRadius="full"
                            isDisabled={isLoading}
                            backgroundColor="#81D8D0"
                            _hover={{ backgroundColor: "#008081" }}
                            size={{ base: "md", sm: "md", md: "md", lg: "lg", xl: "lg" }}
                          >
                            Download Re-glycosylated Structure PDB File
                          </Button>
                        </a>
                        <a href={`${apiUrl}/api/reglyco/download/${jobId}`} download>
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
                        
                      </div>
                      <Text color='#B195A2' alignSelf={"left"} fontSize={'xs'}>
                        If you encounter any issues or suspect a bug contact us <Link href="mailto:OJAS.SINGH.2023@mumail.ie">here</Link>
                      </Text>
                    </div>
                    <Text fontWeight="bold">Processing log:</Text>
                    <Code>
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
          ) : (
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
                  bgGradient='linear(to-l,  #8C619D, #D7C9C0)'
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
                    colorScheme='grey'
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
                {/* <Image src={fit} alt="Glycoprotein" width="90%" /> */}

                <video width={'50%'} autoPlay loop muted id="bgVideo" >
                <source src="/gamma_s.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
                <Box padding={"2rem"} paddingTop={"0rem"}>
                  <Text
                    bgGradient='linear(to-l,  #8C619D, #C39CAA)'
                    bgClip='text'
                    fontSize={{ base: "3xl", sm: "3xl", md: "4xl", lg: "5xl", xl: "5xl" }}
                    fontWeight='bold'
                    marginBottom="0.2em"
                    align={"center"}
                    marginLeft={'2rem'}
                  >
                    Most Accurate Glycoprotein Builder
                  </Text>
                  <Text fontFamily={'texts'} color='#B195A2' paddingTop="10rem" padding={"0rem"} justifySelf="left" align={'left'} fontSize={'lg'}>
                    Re-Glyco Ensemble is a tool we designed to accurately restores missing glycans, aligning them within torsions from privateer and glycan conformations from GlycoShape.
                  </Text>
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
                    {/* O-Arabinosylation */}
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
  };
  
  export default ReGlyco;
