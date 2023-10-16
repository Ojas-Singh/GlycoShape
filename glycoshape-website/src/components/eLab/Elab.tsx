// eLab.tsx

import React from 'react';
import { Box, Tab, Tabs, TabList, TabPanels, TabPanel, Text, Link, List, ListItem, Heading  } from '@chakra-ui/react';

const eLab: React.FC = () => {
  return (
    <Box p={5}>
      <Text 
          align='center'
          bgGradient='linear(to-l, #44666C, #A7C4A3)'
          bgClip='text'
          fontSize='6xl'
          fontWeight='extrabold'
          marginBottom="0.2em"
        >
          Elisa Fadda Research Group
        </Text>

        {/* <Text 
          align='center'
          bgGradient='linear(to-l, #44666C, #A7C4A3)'
          bgClip='text'
          fontSize='3xl'
          fontWeight='extrabold'
          marginBottom="0.2em"
        >
          Computational Biophysics at  <Link  href="https://www.maynoothuniversity.ie/" marginRight="20px">Maynooth University</Link>
        </Text> */}
      <Tabs align={"end"} padding={"10rem"} paddingTop={"1rem"} variant='soft-rounded' colorScheme='green'>
        <TabList>
          <Tab>eLab</Tab>
          <Tab>Team</Tab>
          <Tab>Blog</Tab>
          <Tab>Publications</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
          <Heading size="lg" marginBottom="5">
          Molecular Structure and Function of Glycans and Glycoproteins in the Biology of Health and Disease      </Heading>

      <Text mb={4}>
      In our research group we use high-performance computing (HPC) molecular simulation techniques to reconstruct complex carbohydrates (glycans) and to understand their many different roles in biology. During the past few years we have dedicated a huge amount of our time and computational resources to the creation of the GlycoShape DB, where we are continuously depositing equilibrium 3D structures of glycans, glycan fragments and epitopes, from all-atom molecular dynamics (MD) simulations, that can be used in combination with molecular docking and/or MD to study glycan recognition and with Re-Glyco to rebuild glycoproteins to their native functional state. In addition to the development of GlycoShape to advance research in structural glycobiology, we are actively working in the following research areas:
      </Text>

      {/* <Text mb={4}>
        Our research interests focus primarily on understanding the driving forces leading to protein-protein and protein-peptide recognition and the structure, dynamics and energetics of biomolecular interactions.
      </Text> */}

      <Heading size="md" mb={2}>Current research topics include,</Heading>
      <List styleType="disc" pl={5} mb={4}>
        <ListItem>Viral glycobiology</ListItem>
        <ListItem>Glycans recognition in bacterial infection</ListItem>
        <ListItem>Glycan recognition in immune response</ListItem>
        <ListItem>Glycosylation in adhesion-GPCRs</ListItem>
        <ListItem>OST regulation of protein N-glycosylation</ListItem>
        <ListItem>Hierarchy and control in N-glycosylation pathways</ListItem>
        <ListItem>Development of statistical and ML tools for advancing glycomics and glycoanalytics </ListItem>
        {/* <ListItem>Structure and dynamics of glycolipids</ListItem> */}
      </List>

      {/* <Heading size="md" mb={2}>In our research work we use different computational approaches, tailored to the question at hand. Our main research tools include,</Heading>
      <List styleType="disc" pl={5} mb={4}>
        <ListItem>Molecular Dynamics</ListItem>
        <ListItem>Enhanced Sampling Methods</ListItem>
        <ListItem>Free Energy Calculations</ListItem>
        <ListItem>Molecular Docking</ListItem>
        <ListItem>Ab initio and Density Functional Theory (DFT) Calculations</ListItem>
      </List> */}

      <Text mt={4}>
        For more information please contact <Link href="mailto:elisa.fadda@mu.ie" color="blue.500">elisa.fadda@mu.ie</Link>
      </Text>
          </TabPanel>

          <TabPanel>
            <Text>
              Meet our team of dedicated researchers and scientists...
            </Text>
            {/* Add details of each team member */}
          </TabPanel>

          <TabPanel>
            <Text>
              Check out our latest blog posts to stay updated on our research and findings...
            </Text>
            {/* Add blog summaries or links */}
          </TabPanel>

          <TabPanel>
            <Text>
              Our team has been published in numerous journals and conferences. Some of our notable publications include...
            </Text>
            {/* List publications */}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default eLab;
