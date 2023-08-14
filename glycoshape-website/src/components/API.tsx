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

const API: React.FC = () => {
  return (
    <Box p={5} maxWidth="800px" margin="0 auto">
      <Text 
          bgGradient='linear(to-l, #44666C, #A7C4A3)'
          bgClip='text'
          fontSize='6xl'
          fontWeight='extrabold'
          marginBottom="0.2em"
        >
          API Documentation
        </Text>

      <Accordion defaultIndex={[0]} allowMultiple>
        {/* Endpoint 1 */}
        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">
              GET /endpoint1
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <Text>Description of the endpoint</Text>
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
              POST /endpoint2
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <Text>Description of the endpoint</Text>
            <Code>
              {/* Sample request or response */}
              {`{
  "key": "value"
}`}
            </Code>
          </AccordionPanel>
        </AccordionItem>

        {/* Add more endpoints as needed */}
      </Accordion>
    </Box>
  );
}

export default API;
