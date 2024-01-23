import React from 'react';
import {
  Box,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Text,
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

      <Accordion defaultIndex={[1]} allowMultiple>
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
            <Text>GlycoShape is an OA database of glycans 3D structural data and information that can be downloaded or used with Re-Glyco to rebuild glycoproteins from the RCSB PDB or EMBL-EBI AlphaFold repositories.</Text>
           
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
          How to search?
        </Text>
              
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <Text>You can search by GlyTouCan ID, IUPAC, GLYCAM, WURCS, SMILES or you can draw your own glycan using draw' button in search bar and search the closest match from our database.</Text>
            
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
         What is Re-Glyco?
        </Text>
              
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <Text>Re-Glyco is a tool that facilitates the re-
glycosylation of protein structures with 
glycan structures from the 
GlycoShape3D database. Glycosylation 
can be added to uploaded PDB files, or 
to AlphaFold2 structures via their UniProt 
ID from the AlphaFold database9. The 
tool is able to solve clashes between the 
glycan and protein to optimise the 
glycosylation at each site.</Text>
            
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
          How are clusters calculated?
        </Text>
              
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <Text>The conformational ensembles from 
multi-microsecond MD simulations are 
clustered into representative 
conformations. To do this, a principial 
component analysis (PCA) is conducted 
on the trajectory for dimensionality 
reduction. Clusters from the PCA are then 
identified using a Gaussian mixture 
model (GMM), with representative 
structures for each conformational cluster 
identified from the kernel density (more details soon!). </Text>
            
          </AccordionPanel>
        </AccordionItem>


        



     



      </Accordion>
    </Box>
  );
}

export default FAQ;
