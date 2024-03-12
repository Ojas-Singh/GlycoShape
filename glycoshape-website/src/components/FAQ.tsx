import React , { useState, useEffect } from 'react';
import {
  Box,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Text,
} from "@chakra-ui/react";

interface FAQItem {
  title: string;
  content: string;
}
const FAQ: React.FC = () => {

  const [faqs, setFaqs] = useState<FAQItem[]>([]);

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const response = await fetch('https://glycoshape.org/database/faq.json');
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
  }, []);
  return (
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
  );
}

export default FAQ;
