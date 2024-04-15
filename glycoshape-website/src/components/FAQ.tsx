import React, { useState, useEffect, useRef } from 'react';
import {
  IconButton , keyframes, useStyleConfig , Flex, Image, Stack, Button, Box, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Text,
} from "@chakra-ui/react";
import { ChevronRightIcon, ChevronLeftIcon } from '@chakra-ui/icons'
import { useLocation } from 'react-router-dom';

interface FAQItem {
  title: string;
  content: string;
}

interface Slide {
  gif: string;
  caption: string;
}

const FAQ: React.FC = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
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
      try {
        const response = await fetch(`${apiUrl}/database/faq.json`);
        const data = await response.json(); // No need to typecast here, will process it below
        // Convert the object to an array of FAQItem
        const faqsArray: FAQItem[] = Object.entries(data).map(([title, content]) => ({
          title,
          content: content as string, // Typecasting content to string assuming all values are strings
        }));
        setFaqs(faqsArray);
      } catch (error) {
        console.error('Failed to fetch FAQs:', error);
      }
    };

    fetchFAQs();

    if (location.pathname === '/tutorial') {
      // Set a timeout to scroll to the tutorial section after 1 second
      setTimeout(() => {
        tutorialRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 1000);  // 1000 milliseconds = 1 second
    }
  }, [location.pathname]); // Re-run when path changes

  const slides: Slide[] = [
    { gif: '/img/1.gif', caption: 'First Slide Caption' },
    { gif: '/img/2.gif', caption: 'Second Slide Caption' },
    { gif: '/img/3.gif', caption: 'Third Slide Caption' },
    // Add more slides as needed
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  const [animation, setAnimation] = useState("");

  const nextSlide = () => {
    setAnimation(`0.5s ${slideInLeft} ease-out forwards`);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 10);
  };

  const prevSlide = () => {
    setAnimation(`0.5s ${slideInRight} ease-out forwards`);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    }, 10);
  };

  return (
    <Box>
    <Box p={5} maxWidth="800px" margin="0 auto">
      <Text 
          bgGradient='linear(to-l, #44666C, #A7C4A3)'
          bgClip='text'
          fontSize={{base: "6xl",sm: "6xl", md: "6xl", lg: "6xl",xl: "6xl"}}
          fontWeight='extrabold'
          marginBottom="0.2em"
        >
          FAQs
        </Text>
      <Accordion defaultIndex={[1]} allowMultiple>
             {faqs.map((faq, index) => (
          <AccordionItem key={index}>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <Text 
                  bgGradient='linear(to-l, #44666C, #A7C4A3)'
                  bgClip='text'
                  fontSize='2xl'
                  fontWeight='extrabold'
                  marginBottom="0.2em"
                >
                  {faq.title}
                </Text>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
              <Text>{faq.content}</Text>
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </Box>
      {/* Tutorial Section */}
      <Box ref={tutorialRef} p={10}  margin="0 auto">
      <Text 
          bgGradient='linear(to-l, #44666C, #A7C4A3)'
          bgClip='text'
          fontSize={{base: "6xl",sm: "6xl", md: "6xl", lg: "6xl",xl: "6xl"}}
          fontWeight='extrabold'
          align={"center"}
          marginBottom="0.2em"
        >
          Tutorials
        </Text>
        <Flex align="center" justify="center" gap="2">
        <IconButton
  isRound={true}
  variant='solid'
  colorScheme='teal'
  aria-label='Done'
  fontSize='20px'
  icon={<ChevronLeftIcon />}
  onClick={prevSlide}
/>
        {/* <Button variant='ghost' colorScheme="teal" onClick={prevSlide} fontSize="5xl">{`<`}</Button> */}
        <Box>
          <Text 
                  bgGradient='linear(to-l, #44666C, #A7C4A3)'
                  bgClip='text'
                  fontSize='2xl'
                  fontWeight='extrabold'
                  marginBottom="0.2em"
                >
          {/* <Text fontSize="xl" p={3} textAlign="center"> */}
            {slides[currentSlide].caption}</Text>
            <Image src={slides[currentSlide].gif} height="32rem" objectFit="cover" alt="Tutorial Slide" animation={animation} />

        </Box>

        <IconButton
  isRound={true}
  variant='solid'
  colorScheme='teal'
  aria-label='Done'
  fontSize='20px'
  icon={<ChevronRightIcon />}
  onClick={nextSlide}
/>
        {/* <Button variant='ghost' colorScheme="teal" onClick={nextSlide} fontSize="5xl">{`>`}</Button> */}
        </Flex>
      </Box>
    </Box>
  );
};

export default FAQ;
