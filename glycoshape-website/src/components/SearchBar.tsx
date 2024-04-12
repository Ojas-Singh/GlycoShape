import React, { useState, useEffect, useRef } from 'react';
import { useNavigate  } from 'react-router-dom';
import { Link as RouterLink } from 'react-router-dom';
import { Hide, Link, Highlight, Input, Button, Text, Flex, Modal,ModalFooter, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody,
} from "@chakra-ui/react";
import { SearchIcon} from '@chakra-ui/icons'
import { Kbd } from '@chakra-ui/react'
import Draw from './Draw';


const Bar: React.FC = () => {
  const navigate  = useNavigate();
  const [placeholderText, setPlaceholderText] = useState('Search GlyTouCan...');
  const placeholders = [
    'Search by GLYCAM ID...',
    'Look up by IUPAC...',
    'Find by GlyTouCan...',
    'Query with WURCS...',
    'Enter your search query...',
];
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const searchRef = useRef<HTMLInputElement>(null);

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
      // Ensure that searchRef and its current property is not null
      if (!searchRef || !searchRef.current) {
        console.warn("Search reference is not available.");
        return;
      }
      
      // const requestBody = {
      //   search_string: searchRef.current.value,
      // };

      const query = searchRef.current?.value.trim() ? searchRef.current.value : 'all';
      navigate(`/search?query=${query}`);
      // navigate(`/search?query=${searchRef.current.value}`);
      
    } catch (error) {
      console.error("There was an error fetching the data", error);
    }
  };
  
  const handleImageClick = () => {
    setIsModalOpen(true);
  }



  return (
    <Flex 
    width={'100%'}
    direction="column" 
    align="center" 
    justify="center" 
    flex="1" 
    // padding="1em"
    
  >    
      
      <Flex 
          width="80%" 
          minWidth={{ base: "100%", md: "80%" }}
          align="center" 
          position="relative"
          gap="1em" 
          boxShadow="xl" 
          borderRadius="full" 
          overflow="hidden" 
          p="0.5rem"
          bg="white"
        >
          {/* <Button onClick={handleImageClick} variant="unstyled" p={0} m={0} ml={2}>
            <Image src={draw} alt="Icon Description" w="24px" h="24px" />
          </Button> */}

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
          <Modal isCentered motionPreset='scale' blockScrollOnMount={true} size={'10px'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalOverlay bg='none'
      backdropFilter='auto'
      // backdropInvert='80%'
      backdropBlur='3px' />
        <ModalContent  >
          <ModalHeader  alignSelf={'center'}> <Text 
          bgGradient='linear(to-l, #44666C, #A7C4A3)'
          bgClip='text'
          fontSize='3xl'
          fontWeight='bold'
          marginBottom={'-1rem'}
        ><Highlight query='Sugar Drawer' styles={{alignSelf: 'center', px: '3', py: '1', rounded: 'full', bg: 'rgba(40, 54, 63, .4)', color:'#F7FFE6'}}>
        Sugar Drawer
       </Highlight>
          
        </Text></ModalHeader>
          <ModalCloseButton />
          <ModalBody >
              <Draw />
          </ModalBody>
          <ModalFooter paddingTop={"-1"} paddingBottom={"-1"}>
            <Text color='#B195A2' alignSelf={"left"} fontSize={'xs'}>
            <Link href="https://doi.org/10.3390/molecules26237149"> Tsuchiya, S., Matsubara, M., Aoki-Kinoshita, K. F. & Yamada, I. SugarDrawer: A Web-Based Database Search Tool with Editing Glycan Structures. Molecules 26, 7149 (2021) </Link>
            </Text>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <form style={{ width: '100%', flex:"1" }} onSubmit={handleSearch} >
          <Input 
            
            width={{base: "80%",sm: "80%", md: "80%", lg: "80%",xl: "80%"}}
            fontFamily={'texts'}
            ref={searchRef}
            placeholder={placeholderText}
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
          <Hide below='md'>
          <Text 
            position="absolute" 
            right={{base: "7rem",sm: "7rem", md: "7rem", lg: "8rem",xl: "8rem"}}
            top="50%" 
            transform="translateY(-50%)"
            color="gray.500"
            fontSize={{base: "xs",sm: "xs", md: "sm", lg: "sm",xl: "sm"}}
            userSelect="none"
          >
            <Kbd>ctrl</Kbd> + <Kbd>K</Kbd>
          </Text>
          </Hide>
          <Button position={"absolute"} transform="translateY(10%)" alignContent={"center"} right={"1rem"} type="submit"
            borderRadius="full" 
            backgroundColor="#7CC9A9"
            _hover={{
              backgroundColor: "#51BF9D"
            }}
            onClick={handleSearch}
          >
            Search
          </Button></form>
          
        </Flex>
        
        <Flex direction="row" justify="space-between" width="80%" mt={2}>
         
          <Flex align="center">
          <Hide below='lg'>
          <Highlight query='Browse:' styles={{alignSelf: 'center', px: '3', py: '1', rounded: 'full', bg: 'rgba(40, 54, 63, .4)', color:'#F7FFE6'}}>
        Browse:
       </Highlight>
            

&nbsp;  
            <Button 
              as={RouterLink} 
              backgroundColor="#7CC9A9" 
              _hover={{ backgroundColor: "#51BF9D" }} 
              color="white"
              to="/search?query=N-Glycans"
              // onClick={url => window.location.replace('/search?query=N-Glycans')}
            >
             N-Glycans
            </Button>&nbsp;
            <Button 
              as={RouterLink} 
              backgroundColor="#7CC9A9" 
              _hover={{ backgroundColor: "#51BF9D" }} 
              color="white"
              to="/search?query=O-Glycans"
              // onClick={url => window.location.replace('/search?query=O-Glycans')}
            >
             O-Glycans
            </Button>&nbsp;
            <Button 
              as={RouterLink} 
              backgroundColor="#7CC9A9" 
              _hover={{ backgroundColor: "#51BF9D" }} 
              color="white"
              to="/search?query=GAGs"
              // onClick={url => window.location.replace('/search?query=GAGs')}
            >
             GAGs
            </Button>&nbsp;
            <Button 
              as={RouterLink}
              backgroundColor="#7CC9A9" 
              _hover={{ backgroundColor: "#51BF9D" }} 
              color="white"
              to="/search?query=Oligomannose"
              // onClick={url => window.location.replace('/search?query=Oligomannose')}
            >
             Oligomannose
            </Button>&nbsp;
            <Button 
              as={RouterLink}
              backgroundColor="#7CC9A9" 
              _hover={{ backgroundColor: "#51BF9D" }} 
              color="white"
              to="/search?query=Complex"
              // onClick={url => window.location.replace('/search?query=Complex')}
            >
             Complex
            </Button>&nbsp;
            <Button 
              as={RouterLink}
              backgroundColor="#7CC9A9" 
              _hover={{ backgroundColor: "#51BF9D" }} 
              color="white"
              to="/search?query=Hybrid"
              // onClick={url => window.location.replace('/search?query=Hybrid')}
            >
             Hybrid
            </Button>&nbsp;
            </Hide>
          </Flex>
          <Link as={RouterLink} to='/faq' color={"#F7FFE6"}> 
          <Highlight query='See search help' styles={{alignSelf: 'center', px: '3', py: '1', rounded: 'full', bg: 'rgba(40, 54, 63, .4)', color:'#F7FFE6'}}>
          See search help 
       </Highlight>
       </Link>
          {/* <Text color="white" cursor="pointer">See search help <ArrowForwardIcon /></Text> */}
        </Flex>
        </Flex>

  );
}

export default Bar;
