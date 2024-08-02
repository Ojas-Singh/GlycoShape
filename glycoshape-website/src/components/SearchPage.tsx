import { useState, useEffect, useRef, } from 'react';
import { useBreakpointValue } from "@chakra-ui/react";
import { useLocation } from 'react-router';
import { Link as RouterLink } from 'react-router-dom';
import {
  HStack, Hide, Highlight, Input, Button, Text, Flex, Box, Image, Heading, Link, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, VStack
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
  // const [results, setResults] = useState<string[]>([]);
  // const [results, setResults] = useState<{ iupac: string, glytoucan_id: string | null }[]>([]);
  const [results, setResults] = useState<{ iupac: string, glytoucan_id: string | null, mass: string | null }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchString, setSearchString] = useState<string>(queryParams.get('query') || '');
  const [isWurcsSearch, setIsWurcsSearch] = useState(true);
  const [wurcsString, setWurcsString] = useState<string>(queryParams.get('wurcsString') || '');
  const [wurcsImageSrc, setWurcsImageSrc] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const trimLength = useBreakpointValue({
    base: 30,
    sm: 40,
    md: 40,
    lg: 80,
    xl: 80
  }) ?? 40; // Fallback to 40 if undefined

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
        url = `${apiUrl}/api/wurcs`;
        body = JSON.stringify({
          wurcs_string: wurcsString,
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

      if (data.results) {
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
        // backgroundImage={`url(${bg})`} 
        // backgroundSize="cover" 
        // // backgroundPosition="center"
        // backgroundRepeat="no-repeat"  
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
          width="80%"
          minWidth={{ base: "100%", md: "80%" }}
          align="center"
          position="relative"
          // gap="1em" 
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
          <Modal isCentered size={'90%'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <ModalOverlay bg='none'
              backdropFilter='auto'
              // backdropInvert='80%'
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

                {/* <Image src={un} alt="Description" /> */}

                <Draw />
              </ModalBody>
              <ModalFooter paddingTop={"-1"} paddingBottom={"-1"}>
                <Text color='#B195A2' alignSelf={"left"} fontSize={'xs'}>
                  <Link href="https://doi.org/10.3390/molecules26237149"> Tsuchiya, S., Matsubara, M., Aoki-Kinoshita, K. F. & Yamada, I. SugarDrawer: A Web-Based Database Search Tool with Editing Glycan Structures. Molecules 26, 7149 (2021) </Link>
                </Text>
              </ModalFooter>
            </ModalContent>
          </Modal>

          <Input
            // paddingLeft={"1rem"}
            value={searchString}
            onChange={(e) => setSearchString(e.target.value)}
            width={{ base: "60%", sm: "80%", md: "80%", lg: "80%", xl: "80%" }}
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
          </Text>


        </Flex>


        <Flex direction="row" justify="space-between" width="80%" mt={2}>
          <Flex align="center">
            <Hide below='lg'>
              <Highlight query='Browse:' styles={{ alignSelf: 'center', px: '3', py: '1', rounded: 'full', bg: 'rgba(40, 54, 63, .2)', color: '#F7FFE6' }}>
                Browse:
              </Highlight>
              {/* <Text color="white" marginRight={2}>Examples:</Text> */}
              {/* <Button 
              backgroundColor="#7CC9A9" 
              _hover={{ backgroundColor: "#51BF9D" }} 
              color="white"
              onClick={url => window.location.replace('/glycan?IUPAC=GlcNAc(b1-4)Man')}
            >
              GlcNAc(b1-4)Man
            </Button>&nbsp; */}

              &nbsp;
              <Button
                
                backgroundColor="#7CC9A9"
                _hover={{ backgroundColor: "#51BF9D" }}
                color="white"
                onClick={(e) => setSearchString('N-Glycans')}
                // onClick={url => window.location.replace('/search?query=N-Glycans')}
              >
                N-Glycans
              </Button>&nbsp;
              <Button
                backgroundColor="#7CC9A9"
                _hover={{ backgroundColor: "#51BF9D" }}
                color="white"
                onClick={(e) => setSearchString('O-Glycans')}
                // onClick={url => window.location.replace('/search?query=O-Glycans')}
              >
                O-Glycans
              </Button>&nbsp;
              <Button
                backgroundColor="#7CC9A9"
                _hover={{ backgroundColor: "#51BF9D" }}
                color="white"
                onClick={(e) => setSearchString('GAGs')}
                // onClick={url => window.location.replace('/search?query=GAGs')}
              >
                GAGs
              </Button>&nbsp;
              <Button
                backgroundColor="#7CC9A9"
                _hover={{ backgroundColor: "#51BF9D" }}
                color="white"
                onClick={(e) => setSearchString('Oligomannose')}
                // onClick={url => window.location.replace('/search?query=Oligomannose')}
              >
                Oligomannose
              </Button>&nbsp;
              <Button
                backgroundColor="#7CC9A9"
                _hover={{ backgroundColor: "#51BF9D" }}
                color="white"
                onClick={(e) => setSearchString('Complex')}
                // onClick={url => window.location.replace('/search?query=Complex')}
              >
                Complex
              </Button>&nbsp;
              <Button
                backgroundColor="#7CC9A9"
                _hover={{ backgroundColor: "#51BF9D" }}
                color="white"
                // to="/search?query=Hybrid"
                onClick={(e) => setSearchString('Hybrid')}
                // onClick={url => window.location.replace('/search?query=Hybrid')}
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
      {results.length === 0 && !error && (
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
        <Flex direction="column" align="center" width="100%">




          <Flex direction="row" width="100%" padding="2em" paddingTop={'1em'}>
            {/* Filters on the left */}
            

            <Box width="30%" paddingTop={'2rem'}>
              <Text fontSize={{ base: "xs", sm: "xs", md: "2xl", lg: "2xl", xl: "2xl" }} marginBottom="1em">
                Showing {results.length} search results for {
                  isWurcsSearch
                    ? <img src={wurcsImageSrc === null ? undefined : wurcsImageSrc} alt="WURCS" style={{ width: '200px', height: 'auto', objectFit: 'contain' }} />

                    : `"${searchString}"`
                }
              </Text>
            </Box>
           

            {/* <Box width="30%" padding="0em"> */}
            {/* Example filter */}
            {/* <Text>Filter 1</Text> */}
            {/* Add more filters as needed */}
            {/* </Box> */}
            <Box width="70%" >
              {/* {results.map((glycan, index) => (
                <Box
                  key={index}
                  // width="100%"
                  padding="1rem"
                  boxShadow="md"
                  marginBottom="1em"
                  backgroundColor="white"
                  borderRadius="md"
                  display="flex"
                  flex='1'

                ><VStack align={'left'}>
                    <Heading fontSize={{ base: "xs", sm: "xs", md: "xl", lg: "xl", xl: "xl" }}>
                      {glycan.length > trimLength ? glycan.substring(0, trimLength) + '...' : glycan}
                    </Heading>




                    <Link as={RouterLink} to={`/glycan?IUPAC=${glycan}`}>
                      <Image

                        src={`${apiUrl}/database/${glycan}/${glycan}.svg`} // Replace with the path to your dummy image
                        alt="Glycan Image"
                        // width="300px"
                        height="150px"

                        // marginRight="1rem"
                        maxWidth={"200px"}
                      /></Link>


                  </VStack>
                </Box>
              ))} */}


{results.map((glycan, index) => (
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
                {/* <Heading fontSize={{ base: "xs", sm: "xs", md: "xl", lg: "xl", xl: "xl" }}>
                    {glycan.iupac.length > trimLength ? glycan.iupac.substring(0, trimLength) + '...' : glycan.iupac}
                </Heading>

                {glycan.glytoucan_id && (
                    <Text fontSize="md" color="gray.600">
                        GlyTouCan ID: {glycan.glytoucan_id}
                    </Text>
                )} */}

              <Heading fontSize={{ base: "xs", sm: "xs", md: "xl", lg: "xl", xl: "xl" }}>
              {glycan.glytoucan_id ? glycan.glytoucan_id : (glycan.iupac.length > trimLength ? glycan.iupac.substring(0, trimLength) + '...' : glycan.iupac)}
            </Heading>
            <HStack justify="space-between" align="center" width="100%" paddingRight='3rem'>            

                <Link as={RouterLink} to={`/glycan?IUPAC=${glycan.iupac}`}>
                    <Image
                        src={`${apiUrl}/database/${glycan.iupac}/${glycan.iupac}.svg`}
                        alt="Glycan Image"
                        height="150px"
                        maxWidth={"200px"}
                    />
                </Link>
                {glycan.mass && (
              <Text fontSize="md" color="gray.600">
                Mass: {glycan.mass}
              </Text>
            )}
            </HStack>
            </VStack>
        </Box>
    ))}

              </Box></Flex>
        </Flex>
      )}
      {error && (
        <Text color="red.500" textAlign="center">
          Please enter a valid search string!
          {error}
        </Text>
      )}


    </Flex>
  );
}

export default SearchPage;
