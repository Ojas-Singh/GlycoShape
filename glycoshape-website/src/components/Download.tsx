import React from 'react';
import {
  Box,
  Button,
  Heading,
  VStack,
  HStack,
  Text,
  Divider
} from "@chakra-ui/react";

const Download: React.FC = () => {
  return (
    <Box p={5} maxWidth="800px" margin="0 auto">
      <Text 
          bgGradient='linear(to-l, #44666C, #A7C4A3)'
          bgClip='text'
          fontSize='6xl'
          fontWeight='extrabold'
          marginBottom="0.2em"
        >
          Downloads
        </Text>

      <VStack spacing={5} align="start">
        {/* Download Resource 1 */}
        <Box>
          <HStack justifyContent="space-between" width="100%">
            <Text fontSize="xl" fontWeight="bold">Glycan Structures</Text>
            <Button colorScheme="blue" size="sm" onClick={() => {
                                const link = document.createElement('a');
                                link.href = `/database/GlycoShape.zip`;
                                link.setAttribute('download', `GlycoShape.zip`);
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}>Download</Button>
          </HStack>
          <Text mt={2}>Description for Resource 1. This is some additional text to describe what this resource is and how it can be used.</Text>
        </Box>

        <Divider />

        {/* Download Resource 2 */}
        <Box>
          <HStack justifyContent="space-between" width="100%">
            <Text fontSize="xl" fontWeight="bold">Molecular Dynamics Simulations trajectory</Text>
            <Button colorScheme="blue" size="sm"  onClick={() => {
                                const link = document.createElement('a');
                                link.href = `/database/Simulation.zip`;
                                link.setAttribute('download', `Simulation.zip`);
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}>Download</Button>
          </HStack>
          <Text mt={2}>Description for Resource 2. This is some additional text to describe what this resource is and how it can be used.</Text>
        </Box>

        <Divider />

        {/* Add more resources as needed */}
      </VStack>
    </Box>
  );
}

export default Download;
