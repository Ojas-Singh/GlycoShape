import { useState, useEffect, useRef, useMemo } from 'react';
import { useBreakpointValue } from "@chakra-ui/react";
import { useLocation } from 'react-router';
import { Link as RouterLink } from 'react-router-dom';
import {
  Switch, HStack, Hide, Highlight, Input, Button, Text, Flex, Box, Image, Heading, Link, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, VStack, ButtonGroup, Select,
  FormControl, FormLabel,
  RangeSlider, RangeSliderTrack, RangeSliderFilledTrack, RangeSliderThumb
} from "@chakra-ui/react";
import { SearchIcon, ArrowUpIcon, ArrowDownIcon, UpDownIcon } from '@chakra-ui/icons'
import bg from './assets/gly.png';
import { Kbd } from '@chakra-ui/react'
import Draw from './Draw';
import notfound from './assets/404.png';


const SearchPage = () => {

  const apiUrl = process.env.REACT_APP_API_URL;
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const [results, setResults] = useState<{ ID: string, glytoucan: string | null, mass: number | null }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchString, setSearchString] = useState<string>(queryParams.get('query') || '');
  const [isWurcsSearch, setIsWurcsSearch] = useState(!!queryParams.get('wurcsString'));
  const [wurcsString, setWurcsString] = useState<string>(queryParams.get('wurcsString') || '');
  const [wurcsImageSrc, setWurcsImageSrc] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // State for dynamic slider bounds, initialized to a default range
  const [dynamicSliderMinVal, setDynamicSliderMinVal] = useState<number>(0);
  const [dynamicSliderMaxVal, setDynamicSliderMaxVal] = useState<number>(5000);

  const [minMass, setMinMass] = useState<string>(''); // Will be set by useEffect or slider interaction
  const [maxMass, setMaxMass] = useState<string>(''); // Will be set by useEffect or slider interaction
  const [sortOrder, setSortOrder] = useState<string>('none'); // 'none', 'asc', 'desc'
  const [sliderRange, setSliderRange] = useState<[number, number]>([dynamicSliderMinVal, dynamicSliderMaxVal]);


  const handleImageClick = () => {
    setIsModalOpen(true);
  };

  useEffect(() => {
    const fetchWurcsImage = async () => {
      try {
        if (wurcsString) {
          const response = await fetch(`https://api.glycosmos.org/wurcs2image/1.23.1/png/html/${encodeURIComponent(wurcsString)}`);
          const data = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(data, "text/html");
          const imgsrc = doc.getElementsByTagName("img")[0]?.src || null;
          setWurcsImageSrc(imgsrc);
        }
      } catch (err) {
        console.error("Error fetching WURCS image", err);
      }
    };
    fetchWurcsImage();
  }, [wurcsString]);


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

  const handleSearch = async () => {
    try {
      setIsLoading(true);
      let url, body;
      if (wurcsString && !searchString) {
        url = `${apiUrl}/api/search`;
        body = JSON.stringify({
          search_string: wurcsString,
          search_type: 'wurcs',
        });
      } else if (searchString) {
        setIsWurcsSearch(false);

        url = `${apiUrl}/api/search`;
        body = JSON.stringify({
          search_string: searchString,
        });
      } else {
        // Handle the case when neither wurcsString nor searchString has a value
        // console.warn("Please provide a valid search string or WURCS string!");
        setError("No search string or WURCS string provided.");
        setIsLoading(false);
        return;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: body
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data) {
        setResults(data.results);
        setIsLoading(false);
      } else {
        console.warn("Please provide a valid search string!");
      }
    } catch (err) {
      const errorMessage = (err instanceof Error) ? err.message : "An unknown error occurred";
      console.error("There was an error fetching the data", errorMessage);
      setError(errorMessage);
      setIsLoading(false);
    }
  };


  useEffect(() => {
    handleSearch();
    // Reset dependent states if searchString changes, but not for initial load if queryParams are present
    if (queryParams.get('query') !== searchString && !queryParams.get('wurcsString')) {
        setWurcsString('');
        setIsWurcsSearch(false);
    }
  }, [searchString]);


  const processedResults = useMemo(() => {
    let filtered = [...results]; // Create a new array to avoid mutating the original results

    const min = parseFloat(minMass);
    const max = parseFloat(maxMass);

    if (!isNaN(min)) {
      filtered = filtered.filter(item => item.mass !== null && item.mass >= min);
    }
    if (!isNaN(max)) {
      filtered = filtered.filter(item => item.mass !== null && item.mass <= max);
    }

    if (sortOrder === 'asc') {
      filtered.sort((a, b) => (a.mass ?? Infinity) - (b.mass ?? Infinity));
    } else if (sortOrder === 'desc') {
      filtered.sort((a, b) => (b.mass ?? -Infinity) - (a.mass ?? -Infinity));
    }
    return filtered;
  }, [results, minMass, maxMass, sortOrder]);

  const indexOfLastItem = currentPage * pageSize;
  const indexOfFirstItem = indexOfLastItem - pageSize;
  const currentItems = processedResults.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(processedResults.length / pageSize);

  const PaginationControls = () => (
    <Flex justify="center" align="center" mt={4} mb={8}>
      <ButtonGroup spacing={2}>
        <Button
          onClick={() => setCurrentPage(1)}
          isDisabled={currentPage === 1}
          colorScheme="teal"
          size="sm"
        >
          First
        </Button>
        <Button
          onClick={() => setCurrentPage(prev => prev - 1)}
          isDisabled={currentPage === 1}
          colorScheme="teal"
          size="sm"
        >
          Previous
        </Button>
        <Text mx={4}>
          Page {currentPage} of {totalPages}
        </Text>
        <Button
          onClick={() => setCurrentPage(prev => prev + 1)}
          isDisabled={currentPage === totalPages}
          colorScheme="teal"
          size="sm"
        >
          Next
        </Button>
        <Button
          onClick={() => setCurrentPage(totalPages)}
          isDisabled={currentPage === totalPages || totalPages === 0}
          colorScheme="teal"
          size="sm"
        >
          Last
        </Button>
      </ButtonGroup>
      <Select
        ml={4}
        width="120px"
        value={pageSize}
        onChange={(e) => {
          setPageSize(Number(e.target.value));
          setCurrentPage(1);
        }}
        size="sm"
      >
        <option value="10">10 / page</option>
        <option value="25">25 / page</option>
        <option value="50">50 / page</option>
        <option value="100">100 / page</option>
        {processedResults.length > 0 && <option value={processedResults.length}>All ({processedResults.length})</option>}
      </Select>
    </Flex>
  );

  const handleSortToggle = () => {
    let nextSortOrder = 'asc';
    if (sortOrder === 'asc') {
      nextSortOrder = 'desc';
    } else if (sortOrder === 'desc') {
      nextSortOrder = 'none';
    }
    setSortOrder(nextSortOrder);
    setCurrentPage(1);
  };

  const getSortButtonProps = () => {
    if (sortOrder === 'asc') {
      return { icon: <ArrowUpIcon />, text: "Mass: Low to High" };
    } else if (sortOrder === 'desc') {
      return { icon: <ArrowDownIcon />, text: "Mass: High to Low" };
    }
    return { icon: <UpDownIcon />, text: "Sort by Mass" };
  };
  
  const sortButtonProps = getSortButtonProps();


  useEffect(() => {
    if (results.length > 0) {
      // Filter out null mass values and calculate min/max
      const massValues = results
        .map(item => item.mass)
        .filter((mass): mass is number => mass !== null);
      
      if (massValues.length > 0) {
        const minMassFromResults = Math.min(...massValues);
        const maxMassFromResults = Math.max(...massValues);
        
        setDynamicSliderMinVal(minMassFromResults);
        setDynamicSliderMaxVal(maxMassFromResults);
        
        // Update slider range to match the new bounds
        setSliderRange([minMassFromResults, maxMassFromResults]);
        
        // Reset mass filters to show all results initially
        setMinMass(minMassFromResults.toString());
        setMaxMass(maxMassFromResults.toString());
      }
    }
  }, [results]);

  return (
    <Flex direction="column" width="100%">
      <Flex
        direction="column"
        align="center"
        justify="center"
        flex="1"
        padding="1em"
        paddingTop="2em"
        minHeight={{ base: "15vh" }}
        sx={{
          backgroundImage: `
      radial-gradient(
        circle, 
        rgba(253, 252, 251, 0.2) 0%, 
        rgba(65, 104, 106, 0.6) 100%
      ), 
      url(${bg})`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "50% 30%"
        }}
      >


        <Flex
          width={{ base: "100%", md: "100%", lg: "80%", xl: "70%" }}
          minWidth={{ base: "100%", md: "80%" }}
          align="center"
          position="relative"
          boxShadow="xl"
          borderRadius="full"
          overflow="hidden"
          p="0.5rem"
          bg="white"
        >
          <Button transform="translateY(2%)" alignContent={"center"} left={"0.5rem"} type="submit"
            borderRadius="full"
            color={"#545454"}
            backgroundColor="#F7F9E5  "
            _hover={{
              backgroundColor: "#E2CE69"
            }}
            onClick={handleImageClick}

          >
            Draw' &nbsp; <SearchIcon />
          </Button>
          
          <Modal isCentered motionPreset='scale' size={'10px'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <ModalOverlay bg='none'
              backdropFilter='auto'
              backdropBlur='3px' />
            <ModalContent  >
              <ModalHeader alignSelf={'center'}> <Text
                bgGradient='linear(to-l, #44666C, #A7C4A3)'
                bgClip='text'
                fontSize='3xl'
                fontWeight='bold'
                marginBottom={'-1rem'}
              ><Highlight query='Glycan Drawer' styles={{ alignSelf: 'center', px: '3', py: '1', rounded: 'full', bg: 'rgba(40, 54, 63, .4)', color: '#F7FFE6' }}>
                  Glycan Drawer
                </Highlight>

              </Text></ModalHeader>
              <ModalCloseButton />
              <ModalBody>

                <Draw />
              </ModalBody>
              <ModalFooter paddingTop={"-1"} paddingBottom={"-1"}>
                <Text color='#B195A2' alignSelf={"left"} fontSize={'xs'}>
                  <Link href="https://doi.org/10.3390/molecules26237149"> Tsuchiya, S., Matsubara, M., Aoki-Kinoshita, K. F. & Yamada, I. SugarDrawer: A Web-Based Database Search Tool with Editing Glycan Structures. Molecules 26, 7149 (2021) </Link>
                </Text>
              </ModalFooter>
            </ModalContent>
          </Modal>
          <Flex style={{ width: '100%', flex: "1" }} >
            <Input
              // paddingLeft={"1rem"}
              value={searchString}
              onChange={(e) => setSearchString(e.target.value)}
              width={{ base: "80%", sm: "80%", md: "80%", lg: "80%", xl: "80%" }}
              fontFamily={'texts'}
              ref={searchRef}
              placeholder='Search GLYCAM ID, IUPAC, GlycoCT, WURCS...'
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
            <Text
              position="absolute"
              right={{ base: "2rem", sm: "2rem", md: "2rem", lg: "2rem", xl: "2rem" }}
              top="50%"
              transform="translateY(-50%)"
              color="gray.500"
              fontSize={{ base: "xs", sm: "xs", md: "sm", lg: "sm", xl: "sm" }}
              userSelect="none"
            >
              <Kbd>ctrl</Kbd> + <Kbd>K</Kbd>
              {/* &nbsp;  &nbsp; 
              Motif search
              <Switch paddingLeft='2'colorScheme='teal' size='lg' /> */}

            </Text>
          </Flex>

        </Flex>


        <Flex direction="row" justify="space-between" width="80%" mt={2}>
          <Flex align="center">
            <Hide below='lg'>
              <Highlight query='Browse:' styles={{ alignSelf: 'center', px: '3', py: '1', rounded: 'full', bg: 'rgba(40, 54, 63, .2)', color: '#F7FFE6' }}>
                Browse:
              </Highlight>

              &nbsp;
                <Button
                backgroundColor="#7CC9A9"
                _hover={{ backgroundColor: "#51BF9D" }}
                color="white"
                onClick={(e) => {
                  setSearchString('N-Glycans');
                  setCurrentPage(1);
                }}
                >
                N-Glycans
                </Button>&nbsp;
              <Button
                backgroundColor="#7CC9A9"
                _hover={{ backgroundColor: "#51BF9D" }}
                color="white"
                onClick={(e) => {
                  setSearchString('O-Glycans')
                  setCurrentPage(1);
                }}
              >
                O-Glycans
              </Button>&nbsp;
              <Button
                backgroundColor="#7CC9A9"
                _hover={{ backgroundColor: "#51BF9D" }}
                color="white"
                onClick={(e) => {
                  setSearchString('GAGs');
                  setCurrentPage(1);
                }}
              >
                GAGs
              </Button>&nbsp;
              <Button
                backgroundColor="#7CC9A9"
                _hover={{ backgroundColor: "#51BF9D" }}
                color="white"
                onClick={(e) => {
                  setSearchString('Oligomannose');
                  setCurrentPage(1);
                }}
              >
                Oligomannose
              </Button>&nbsp;
              <Button
                backgroundColor="#7CC9A9"
                _hover={{ backgroundColor: "#51BF9D" }}
                color="white"
                onClick={(e) => {
                  setSearchString('Complex');
                  setCurrentPage(1);
                }}
              >
                Complex
              </Button>&nbsp;
              <Button
                backgroundColor="#7CC9A9"
                _hover={{ backgroundColor: "#51BF9D" }}
                color="white"
                onClick={(e) => {
                  setSearchString('Hybrid');
                  setCurrentPage(1);
                }}
              >
                Hybrid
              </Button>&nbsp;
            </Hide>
          </Flex>
          <Link as={RouterLink} to='/faq' color={"#F7FFE6"}>
            <Highlight query='See search help' styles={{ alignSelf: 'center', px: '3', py: '1', rounded: 'full', bg: 'rgba(40, 54, 63, .2)', color: '#F7FFE6' }}>
              See search help
            </Highlight></Link>
        </Flex>
      </Flex>
      {isLoading ? (
        <Text></Text>
      ) : (
        <div>
          {results.length === 0 && (
            <Box textAlign={"center"} alignSelf={"center"} py={10} px={6}>
              <HStack>

                <Image height="10rem" src={notfound} alt="404" />
                <Heading
                  display="inline-block"
                  as="h2"
                  size="3xl"
                  bgGradient="linear(to-r,#B72521, #ECC7A1)"
                  backgroundClip="text">
                  The glycan you are looking for is currently not in the database.
                </Heading>
              </HStack>

              <Button
                backgroundColor="#7CC9A9"
                _hover={{ backgroundColor: "#51BF9D" }}
                color="white"
              >
                <RouterLink to="mailto:elisa.fadda@soton.ac.uk"> Please contact us if you would like us to add it.
                </RouterLink>
              </Button>

              <Text color="gray.500" textAlign="center" marginBottom="1em">
              </Text>
            </Box>
          )}</div>)}
      {results.length > 0 && (
        <Flex
          justify="center"
          direction="column"
          width={{ base: "95%", md: "100%", lg: "100%", xl: "80%" }} // Ensure this centers the content block
          margin="0 auto" // Center the overall flex container
        >
          <Flex
            direction={{ base: "column", md: "row" }}
            width="100%"
            padding="2em"
            paddingTop={'1em'}
          >
            {/* Filters on the left */}
            <Box
              width={{ base: "100%", md: "30%" }}
              paddingRight={{ md: "2rem" }}
              marginBottom={{ base: "2rem", md: "0" }}
            >
              <VStack spacing={6} align="stretch">
                {/* <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color="teal.700">
                  Refine Results
                </Text> */}

                <Text fontSize={{ base: "sm", md: "md" }} color="gray.600" mt={4} lineHeight="tall">
                  Showing {processedResults.length > 0 ? indexOfFirstItem + 1 : 0}-
                  {Math.min(indexOfLastItem, processedResults.length)} of {processedResults.length} results for {
                  isWurcsSearch && wurcsString
                  ? (
                  <>
                    <Text as="span" fontWeight="semibold" color="teal.700">WURCS Query</Text>
                    <Image 
                    src={wurcsImageSrc || undefined} 
                    alt="WURCS Structure" 
                    maxHeight="120px" 
                    width="100%"
                    objectFit="contain" 
                    border="1px solid #e2e8f0" 
                    padding="8px" 
                    borderRadius="8px"
                    bg="white"
                    mt={2}
                    display="inline-block"
                    />
                  </>
                  )
                  : searchString ? <Text as="span" fontWeight="semibold" color="teal.700">"{searchString}"</Text> : "your query"
                  }
                </Text>

                {/* Mass Filter with RangeSlider */}
                <Box borderWidth="1px" borderRadius="lg" p={4} shadow="sm">
                  <Text fontSize="lg" paddingBottom={4} color="gray.700">Filter by Mass</Text>
                  
                  <Box position="relative" mt={6} mb={2} mx={4}> {/* Added mx={4} for horizontal margin */}
                  <RangeSlider
                    aria-label={['min mass', 'max mass']}
                    min={dynamicSliderMinVal}
                    max={dynamicSliderMaxVal}
                    step={ (dynamicSliderMaxVal - dynamicSliderMinVal) > 100 ? 10 : 1} // Adjust step based on range
                    value={sliderRange} // sliderRange should always be within dynamic bounds
                    onChange={(val) => setSliderRange(val as [number, number])}
                    onChangeEnd={(val) => {
                    setMinMass(val[0].toString());
                    setMaxMass(val[1].toString());
                    setCurrentPage(1);
                    }}
                    isDisabled={dynamicSliderMinVal === dynamicSliderMaxVal} // Disable if no range
                  >
                    <RangeSliderTrack bg="teal.100">
                    <RangeSliderFilledTrack bg="teal.500" />
                    </RangeSliderTrack>
                    <RangeSliderThumb boxSize={6} index={0} />
                    <RangeSliderThumb boxSize={6} index={1} />
                  </RangeSlider>
                  <Text
                    position="absolute"
                    top="-25px"
                    left={dynamicSliderMaxVal - dynamicSliderMinVal > 0 ? `${((sliderRange[0] - dynamicSliderMinVal) / (dynamicSliderMaxVal - dynamicSliderMinVal)) * 100}%` : '0%'}
                    transform="translateX(-50%)"
                    fontSize="xs"
                    color="teal.500"
                    // fontWeight="semibold"
                  >
                    {sliderRange[0]}
                  </Text>
                  <Text
                    position="absolute"
                    top="-25px"
                    left={dynamicSliderMaxVal - dynamicSliderMinVal > 0 ? `${((sliderRange[1] - dynamicSliderMinVal) / (dynamicSliderMaxVal - dynamicSliderMinVal)) * 100}%` : '100%'}
                    transform="translateX(-50%)"
                    fontSize="xs"
                    color="teal.500"
                    // fontWeight="semibold"
                  >
                    {sliderRange[1]}
                  </Text>
                  </Box>
                  <Button
                    marginTop={'1rem'}
                    padding={3}
                    leftIcon={sortButtonProps.icon}
                    onClick={handleSortToggle}
                    variant="outline"
                    colorScheme="teal"
                    width="100%"
                    size="sm"
                  >
                    {sortButtonProps.text}
                  </Button>
                </Box>


               
              </VStack>
            </Box>

            <Box width={{ base: "100%", md: "70%" }}>
              {currentItems.length > 0 ? currentItems.map((glycan, index) => (
                <Box
                  key={index}
                  padding="1rem"
                  boxShadow="md"
                  marginBottom="1em"
                  backgroundColor="white"
                  borderRadius="md"
                  display="flex"
                  flex='1'
                >
                  <VStack align={'stretch'} width="100%">
                  <Link as={RouterLink} to={glycan.glytoucan 
                    ? `/glycan?glytoucan=${glycan.glytoucan}` 
                    : `/glycan?id=${glycan.ID}`}>

                    <Heading fontSize={{ base: "lg", md: "xl" }}>
                    {glycan.glytoucan ? glycan.glytoucan : glycan.ID}
                    </Heading>
                    <HStack
                    justify="space-between"
                    align="center"
                    width="100%"
                    paddingRight='3rem'
                    flexDirection={{ base: "column", sm: "row" }}
                    spacing={{ base: "1rem", sm: "inherit" }}
                    >
                    <Image
                      src={`${apiUrl}/api/svg/${glycan.glytoucan || glycan.ID}`}
                      alt="Glycan Image"
                      height="150px"
                      maxWidth={"200px"}
                    />

                    {glycan.mass && (
                      <Text fontSize="md" color="gray.600">
                      Mass: {glycan.mass}
                      </Text>
                    )}
                    </HStack>
                  </Link>
                  </VStack>
                </Box>
              )) : (
                 <Text mt={10} textAlign="center" color="gray.500">No results match your current filters.</Text>
              )}
              {processedResults.length > pageSize && <PaginationControls />}
            </Box>
          </Flex>
        </Flex>
      )}
      {/* {error && (
        <Text color="red.500" textAlign="center">
          Please enter a valid search string!
          {error}
        </Text>
      )} */}

    </Flex>
  );
}

export default SearchPage;
