// FAQ.tsx
import React from 'react';
import { Box, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon } from "@chakra-ui/react";

const FAQ: React.FC = () => {
  return (
    <Box p={5}>
      <h2>Frequently Asked Questions</h2>
      <Accordion allowToggle>
        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">
              What is GlycoShape?
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            GlycoShape is a platform for...
          </AccordionPanel>
        </AccordionItem>
        {/* ... Add more questions as needed */}
        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">
              How do I use GlycoShape?
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            To use GlycoShape, you can...
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Box>
  );
}

export default FAQ;
