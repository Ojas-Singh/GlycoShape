import React, { useState, useEffect, useRef } from 'react';
import {
  Heading, Link,
  IconButton , keyframes, useStyleConfig , Flex, Image, Stack, Button, Box, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Text,
  VStack,
  HStack,
  Spacer,
  UnorderedList,
  ListItem,
} from "@chakra-ui/react";
import { ChevronRightIcon, ChevronLeftIcon } from '@chakra-ui/icons'
import { useLocation } from 'react-router-dom';



interface Slide {
  gif: string;
  caption: string;
}

const FAQ: React.FC = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const tutorialRef = useRef<HTMLDivElement>(null);
  const location = useLocation(); // To detect route change
  // Define animations for sliding in from left or right
const slideInLeft = keyframes`
from { transform: translateX(100%); opacity: 0; }
to { transform: translateX(0); opacity: 1; }
`;

const slideInRight = keyframes`
from { transform: translateX(-100%); opacity: 0; }
to { transform: translateX(0); opacity: 1; }
`;

  useEffect(() => {
    // Function to fetch FAQs
    const fetchFAQs = async () => {
      
    };

    fetchFAQs();

    if (location.pathname === '/tutorial') {
      // Set a timeout to scroll to the tutorial section after 1 second
      setTimeout(() => {
        tutorialRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 500);  // 1000 milliseconds = 0.5 second
    }
  }, [location.pathname]); // Re-run when path changes

  const slides: Slide[] = [
    { gif: '/img/1.gif', caption: 'The gif below shows you how to upload protein 6EAQ from the PDB on ReGlyco. To upload a structure from the AlphaFold Protein Structure Database you can follow the same procedure using the UniProt ID instead of the PDB ID. To upload your own, click on the “Upload your PDB” link.' },
    { gif: '/img/2.gif', caption: 'To predict potential N-glycosylation sites, use scan button under GlcNAc Scanning tab.' },
    { gif: '/img/3.gif', caption: 'After the GlcNAc scan, we can one shot glycosylate all the possible sites with glycan of choice.' },
    { gif: '/img/4.gif', caption: 'For site specific glycosylation use "Advanced (Site-by-Site) Glycosylation" tab.' },
    { gif: '/img/5.gif', caption: 'Press "Process Ensemble" to generate more conformation of the attached glycans, this also calculate SASA of protein with glycan effect.' },
    { gif: '/img/6.gif', caption: "If a clash warning appears for an ASN residue, easily resolve it by using the provided link in the processing summary to interchange the coordinates of ND2 and OD1 atoms. " },
    // Add more slides as needed
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  const [animation, setAnimation] = useState("");

  const nextSlide = () => {
    setAnimation(""); // Reset animation state
    setTimeout(() => {
        setAnimation(`0.5s ${slideInLeft} ease-out forwards`);
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 10);
};

const prevSlide = () => {
    setAnimation(""); // Reset animation state
    setTimeout(() => {
        setAnimation(`0.5s ${slideInRight} ease-out forwards`);
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    }, 10);
};


  return (
    <Box>
   
      <Box ref={tutorialRef} p={0} paddingBottom={0}>
      <Text 
          bgGradient='linear(to-l, #44666C, #A7C4A3)'
          bgClip='text'
          fontSize={{base: "5xl",sm: "5xl", md: "5xl", lg: "5xl",xl: "5xl"}}
          fontWeight='extrabold'
          // align={"start"}
          
          paddingLeft={"2rem"}
        >
          Tutorials
        </Text>
          <VStack >
            {/* <HStack >
          
        <Text 
          bgGradient='linear(to-l,  #B07095, #D7C9C0)'
          bgClip='text'
          fontSize={{base: "3xl",sm: "3xl", md: "3xl", lg: "3xl",xl: "3xl"}}
          fontWeight='extrabold'
          align={"start"}
          paddingLeft={"1rem"}
          marginBottom="0em"
        >
          Re-Glyco : A GlycoProtein Builder
        </Text>
        </HStack>
         */}
        <Flex align="center" justify="center">


        <VStack>
        <IconButton
  isRound={true}
  variant='solid'
  colorScheme='teal'
  aria-label='Done'
  fontSize='20px'
  icon={<ChevronLeftIcon />}
  onClick={prevSlide}
/>
<Text p="2"fontSize="sm" color="#B07095">Previous Slide</Text> </VStack>


        <Box>
        <Text padding={"0rem"}
        maxWidth={"60rem"}
        minHeight={"5rem"}
            align={"center"}
                   color={"#B07095"}
                  fontSize='lg'
                  fontWeight='extrabold'
                  marginBottom="0.2em"
                >
            {slides[currentSlide].caption}</Text>
            <Image src={slides[currentSlide].gif} maxHeight="35rem" objectFit="cover" alt="Tutorial Slide" animation={animation} />
            
        </Box>
<VStack>
        <IconButton
  isRound={true}
  variant='solid'
  colorScheme='teal'
  aria-label='Done'
  fontSize='20px'
  icon={<ChevronRightIcon />}
  onClick={nextSlide}
/>
<Text p="2" fontSize="sm" color="#B07095">Next Slide</Text> </VStack>
        </Flex>
        </VStack>
              <Box gap="2">

        <Heading padding={'5rem'} as="h3" size="lg" color={"#6A8A81"} paddingBottom={"1.5rem"}>Other learning resources:</Heading>
              <Box paddingLeft="10rem">
                <UnorderedList alignContent={"center"}>
                <ListItem>
                          <Link color={"#B07095"} fontWeight="semibold" href='https://www.youtube.com/watch?v=oR1CeBXTvZ0&list=PLN5HMWt4P0VugGKpzqEChc7so-s1gV8FO&index=2' isExternal>
                            Sugar Drawer from Glycosmos
                          </Link>
                          </ListItem>
              <ListItem>
                          
                          <Link color={"#B07095"} fontWeight="semibold"href='https://www.ncbi.nlm.nih.gov/glycans/snfg.html' isExternal>
                            Symbol Nomenclature for Glycans (SNFG)
                          </Link>
                          </ListItem>
                          </UnorderedList>
                          </Box>
                          </Box>


      </Box>

      
    </Box>
  );
};

export default FAQ;
