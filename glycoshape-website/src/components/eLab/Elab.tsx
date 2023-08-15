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

        <Text 
          align='center'
          bgGradient='linear(to-l, #44666C, #A7C4A3)'
          bgClip='text'
          fontSize='3xl'
          fontWeight='extrabold'
          marginBottom="0.2em"
        >
          Computational Biophysics at  <Link  href="https://www.maynoothuniversity.ie/" marginRight="20px">Maynooth University</Link>
        </Text>
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
        Understanding molecular interactions through computer simulations
      </Heading>

      <Text mb={4}>
        Computer-based molecular simulations are one of the most modern and powerful techniques that we can use to understand molecular interaction at the atomistic level of detail.
      </Text>

      <Text mb={4}>
        Our research interests focus primarily on understanding the driving forces leading to protein-protein and protein-peptide recognition and the structure, dynamics and energetics of biomolecular interactions.
      </Text>

      <Heading size="md" mb={2}>Current research topics include,</Heading>
      <List styleType="disc" pl={5} mb={4}>
        <ListItem>DNA repair proteins and their role in oncogenesis and chemotherapeutic resistance</ListItem>
        <ListItem>Design of high affinity and high specificity peptides for diagnostic and prognostic peptide microarrays</ListItem>
        <ListItem>Balance of conformational order and disorder in molecular recognition</ListItem>
        <ListItem>Sequence/structure/function and specificity relationships in PHD domains</ListItem>
        <ListItem>DNA packaging in the nucleosome</ListItem>
      </List>

      <Heading size="md" mb={2}>In our research work we use different computational approaches, tailored to the question at hand. Our main research tools include,</Heading>
      <List styleType="disc" pl={5} mb={4}>
        <ListItem>Molecular Dynamics</ListItem>
        <ListItem>Enhanced Sampling Methods</ListItem>
        <ListItem>Free Energy Calculations</ListItem>
        <ListItem>Molecular Docking</ListItem>
        <ListItem>Ab initio and Density Functional Theory (DFT) Calculations</ListItem>
      </List>

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
