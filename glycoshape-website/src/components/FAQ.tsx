import React, { useState, useEffect, useRef } from 'react';
import { 
  useStyleConfig, 
  Box, 
  Accordion, 
  AccordionItem, 
  AccordionButton, 
  AccordionPanel, 
  AccordionIcon, 
  Text,
  Spinner, // Added Spinner for loading state
  Alert,   // Added Alert for error state
  AlertIcon // Added AlertIcon for error state
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useLocation } from 'react-router-dom';

interface FAQItem {
  title: string;
  content: string;
}

// Re-using the ELAB_DATA_REPO_CONFIG structure for consistency
// You could also import this from a shared config file if you have one
const FAQ_DATA_REPO_CONFIG = {
  owner: 'Ojas-Singh', 
  repo: 'GlycoShape-Resources', 
  branch: 'main',
  rawBaseUrl: `https://raw.githubusercontent.com/Ojas-Singh/GlycoShape-Resources/main/`, 
};

const FAQ: React.FC = () => {
  // const apiUrl = process.env.REACT_APP_API_URL; // This will be replaced
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true); // Added loading state
  const [error, setError] = useState<string | null>(null); // Added error state
 
  useEffect(() => {
    // Function to fetch FAQs
    const fetchFAQs = async () => {
      setLoading(true);
      setError(null);
      try {
        // Construct the URL to fetch faq.json from the GitHub repository
        const response = await fetch(`${FAQ_DATA_REPO_CONFIG.rawBaseUrl}FAQ/faq.json`);
        if (!response.ok) {
          throw new Error(`Failed to fetch FAQs: ${response.status} ${response.statusText}`);
        }
        const data = await response.json(); 
        // Convert the object to an array of FAQItem
        const faqsArray: FAQItem[] = Object.entries(data).map(([title, content]) => ({
          title,
          content: content as string, 
        }));
        setFaqs(faqsArray);
      } catch (error) {
        console.error('Failed to fetch FAQs:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, []); 

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

      {loading && (
        <Box textAlign="center" my={10}>
          <Spinner size="xl" label="Loading FAQs..." />
        </Box>
      )}

      {error && (
        <Alert status="error" my={10}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <Accordion defaultIndex={[0]} allowMultiple> {/* Changed defaultIndex to 0 to open the first item */}
               {faqs.map((faq, index) => (
            <AccordionItem key={index}>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  <Text 
                    // Keeping the gradient for titles, or choose a simpler style
                    bgGradient='linear(to-l, #44666C, #A7C4A3)' 
                    bgClip='text'
                    fontSize='2xl' // Adjusted for better readability
                    fontWeight='bold' // Changed from extrabold for balance
                    // marginBottom="0.2em" // Removed margin for tighter look in button
                  >
                    {faq.title}
                  </Text>
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel pb={4}>
                {/* Potentially use ReactMarkdown here if content can have markdown */}
                <Text whiteSpace="pre-line">{faq.content}</Text> 
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </Box>
    </Box>
  );
};

export default FAQ;
