import React from 'react';
import {
  Box,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Heading,
  Text,
  Code
} from "@chakra-ui/react";

const FAQ: React.FC = () => {
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

      <Accordion defaultIndex={[0]} allowMultiple>
        {/* Endpoint 1 */}
        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">
            <Text 
          bgGradient='linear(to-l, #44666C, #A7C4A3)'
          bgClip='text'
          fontSize='2xl'
          fontWeight='extrabold'
          marginBottom="0.2em"
        >
          What is GlycoShape?
        </Text>
              
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <Text>Description of the GlycoShape...</Text>
            <Code>
              {/* Sample request or response */}
              {`{
  "key": "value"
}`}
            </Code>
          </AccordionPanel>
        </AccordionItem>

        {/* Endpoint 2 */}
        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">
            <Text 
          bgGradient='linear(to-l, #44666C, #A7C4A3)'
          bgClip='text'
          fontSize='2xl'
          fontWeight='extrabold'
          marginBottom="0.2em"
        >
          How it is curated?
        </Text>
              
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <Text>Description of the MD...</Text>
            <Code>
              {/* Sample request or response */}
              {`{
  "key": "value"
}`}
            </Code>
          </AccordionPanel>
        </AccordionItem>


        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">
            <Text 
          bgGradient='linear(to-l, #44666C, #A7C4A3)'
          bgClip='text'
          fontSize='2xl'
          fontWeight='extrabold'
          marginBottom="0.2em"
        >
          How it is curated?
        </Text>
              
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <Text>Description of the MD...</Text>
            <Code>
              {/* Sample request or response */}
              {`{
  "key": "value"
}`}
            </Code>
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">
            <Text 
          bgGradient='linear(to-l, #44666C, #A7C4A3)'
          bgClip='text'
          fontSize='2xl'
          fontWeight='extrabold'
          marginBottom="0.2em"
        >
          How it is curated?
        </Text>
              
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <Text>Description of the MD...</Text>
            <Code>
              {/* Sample request or response */}
              {`{
  "key": "value"
}`}
            </Code>
          </AccordionPanel>
        </AccordionItem>


        



     



      </Accordion>
    </Box>
  );
}

export default FAQ;
