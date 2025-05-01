import { useState, useEffect, useRef, } from 'react';
import { useBreakpointValue } from "@chakra-ui/react";
import { useLocation } from 'react-router';
import { Link as RouterLink } from 'react-router-dom';
import {
  Switch, HStack, Hide, Highlight, Input, Button, Text, Flex, Box, Image, Heading, Link, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, VStack, ButtonGroup, Select
} from "@chakra-ui/react";
import { SearchIcon } from '@chakra-ui/icons'
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
  const [isWurcsSearch, setIsWurcsSearch] = useState(true);
  const [wurcsString, setWurcsString] = useState<string>(queryParams.get('wurcsString') || '');
  const [wurcsImageSrc, setWurcsImageSrc] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  }, [searchString]);

  const handleImageClick = () => {
    setIsModalOpen(true);
  }

  const indexOfLastItem = currentPage * pageSize;
  const indexOfFirstItem = indexOfLastItem - pageSize;
  const currentItems = results.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(results.length / pageSize);

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
          isDisabled={currentPage === totalPages}
          colorScheme="teal"
          size="sm"
        >
          Last
        </Button>
      </ButtonGroup>
      <Select
        ml={4}
        width="100px"
        value={pageSize}
        onChange={(e) => {
          setPageSize(Number(e.target.value));
          setCurrentPage(1);
        }}
      >
        <option value="10">10</option>
        <option value="25">25</option>
        <option value="50">50</option>
        <option value="100">100</option>
      </Select>
    </Flex>
  );

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
          width={{ base: "95%", md: "100%", lg: "100%", xl: "80%" }}
          margin="0 auto"
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
              paddingTop={'2rem'}
              marginBottom={{ base: "1rem", md: "0" }}
            >
                <Text fontSize={{ base: "xl", md: "2xl" }} marginBottom="1em">
                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, results.length)} of {results.length} results for {
                  isWurcsSearch
                  ? <img src={wurcsImageSrc === null ? undefined : wurcsImageSrc} alt="WURCS" style={{ width: '200px', height: 'auto', objectFit: 'contain' }} />
                  : `"${searchString}"`
                }
                </Text>
            </Box>

            <Box width={{ base: "100%", md: "70%" }}>
              {currentItems.map((glycan, index) => (
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
              ))}
              {results.length > pageSize && <PaginationControls />}
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
