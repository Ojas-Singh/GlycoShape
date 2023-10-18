// eLab.tsx

import React, { useState } from 'react';
import { Grid, Flex, Image, Container, Box, Tab, Tabs, TabList, TabPanels, TabPanel, Text, Link, List, ListItem, Heading  } from '@chakra-ui/react';

const ELab: React.FC = () => {
  const [hoveredMember, setHoveredMember] = useState<number | null>(null);

  const members = [
    { name: 'Elisa Fadda', role: 'Principal Investigator', image: '/img/Fadda.png', hoverImage: '/img/cat2.jpg' },
    { name: 'Callum Ives', role: 'Research Scientist', image: '/img/Ives.png', hoverImage: '/img/cat1.jpeg' },
    { name: 'Ojas Singh', role: 'PhD Student', image: '/img/Singh.jpg' , hoverImage: '/img/cat3.jpg'},
    { name: 'Silvia D Andrea', role: 'PhD Student', image: '/img/leg.png' , hoverImage: '/path_to_hover_image1.jpg'},
    { name: 'Akash Satheesan', role: 'PhD Student', image: '/img/Satheesan.png', hoverImage: '/path_to_hover_image1.jpg' },
    { name: 'Beatrice Tropea', role: 'PhD Student', image: '/img/Tropea.png' , hoverImage: '/path_to_hover_image1.jpg'},
    { name: 'Carl A Fogarty', role: 'PhD Student', image: '/img/Carl.jpeg' , hoverImage: '/path_to_hover_image1.jpg'},
];
const publications = [
  {
    title: "Title of Research Paper 1",
    authors: "Author A, Author B, ...",
    journal: "Journal Name, Year",
    link: "#"
  },
  {
    title: "Title of Research Paper 2",
    authors: "Author X, Author Y, ...",
    journal: "Journal Name, Year",
    link: "#"
  },
  // ... Add more publications as needed
];
  return (
    <Box p={5}  >
      <Text 
          align='center'
          bgGradient='linear(to-l, #44666C, #A7C4A3)'
          bgClip='text'
          fontSize={{base: "3xl",sm: "4xl", md: "6xl", lg: "6xl",xl: "6xl"}}
          fontWeight='extrabold'
          marginBottom="0.2em"
        >
          Elisa Fadda Research Group
        </Text>

      <Tabs align={"end"} maxWidth="100%" padding={"0rem"} paddingTop={"1rem"} variant='soft-rounded' colorScheme='green'>
        <TabList>
          <Tab>eLab</Tab>
          <Tab>Team</Tab>
          <Tab>Blog</Tab>
          <Tab>Publications</Tab>
        </TabList>

        <TabPanels>
          <TabPanel >
          <Container maxWidth={{base: "100%",sm: "100%", md: "80%", lg: "80%",xl: "80%"}} > 
                      <Heading size="lg" marginBottom="5" >
                      Molecular Structure and Function of Glycans and Glycoproteins in the Biology of Health and Disease      </Heading>

                  <Text mb={4} >
                  In our research group we use high-performance computing (HPC) molecular simulation techniques to reconstruct complex carbohydrates (glycans) and to understand their many different roles in biology. During the past few years we have dedicated a huge amount of our time and computational resources to the creation of the GlycoShape DB, where we are continuously depositing equilibrium 3D structures of glycans, glycan fragments and epitopes, from all-atom molecular dynamics (MD) simulations, that can be used in combination with molecular docking and/or MD to study glycan recognition and with Re-Glyco to rebuild glycoproteins to their native functional state. In addition to the development of GlycoShape to advance research in structural glycobiology, we are actively working in the following research areas:
                  </Text>

                  <Heading size="md" mb={2}>Current research topics include,</Heading>
                  <List  styleType="disc" pl={5} mb={4}>
                    <ListItem>Viral glycobiology</ListItem>
                    <ListItem>Glycans recognition in bacterial infection</ListItem>
                    <ListItem>Glycan recognition in immune response</ListItem>
                    <ListItem>Glycosylation in adhesion-GPCRs</ListItem>
                    <ListItem>OST regulation of protein N-glycosylation</ListItem>
                    <ListItem>Hierarchy and control in N-glycosylation pathways</ListItem>
                    <ListItem>Development of statistical and ML tools for advancing glycomics and glycoanalytics </ListItem>
                  
                  </List>

                  

                  <Text mt={4}>
                    For more information please contact <Link href="mailto:elisa.fadda@mu.ie" color="blue.500">elisa.fadda@mu.ie</Link>
                  </Text>
      </Container>
          </TabPanel>

          <TabPanel>
          <Container maxWidth={{base: "100%",sm: "100%", md: "80%", lg: "80%",xl: "80%"}} > 

          <Box padding="5rem">
            <Heading marginBottom="2rem">Research Lab Team</Heading>

            <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)", "repeat(3, 1fr)"]} gap={6}>
                {members.map((member, idx) => (
                    <Flex 
                        flexDirection="column" 
                        alignItems="center" 
                        key={idx}
                        onMouseEnter={() => setHoveredMember(idx)}
                        onMouseLeave={() => setHoveredMember(null)}
                    >
                        <Image 
                            boxSize="150px"
                            objectFit="cover"
                            borderRadius="full"
                            src={hoveredMember === idx ? member.hoverImage : member.image}
                            alt={member.name}
                            marginBottom="1rem"
                        />
                        <Heading size="md" marginBottom="0.5rem">{member.name}</Heading>
                        <Text>{member.role}</Text>
                    </Flex>
                ))}
            </Grid>
        </Box>
            </Container>
          </TabPanel>

          <TabPanel>
            <Text>
              Check out our latest blog posts to stay updated on our research and findings...
            </Text>
            {/* Add blog summaries or links */}
          </TabPanel>

          <TabPanel>
            <Container maxWidth={{base: "100%",sm: "100%", md: "80%", lg: "80%",xl: "80%"}} >
            <Box padding="4rem">
      <Heading marginBottom="2rem">Our Lab Publications</Heading>
      <List spacing={3}>
        {publications.map((pub, index) => (
          <ListItem key={index}>
            <Link href={pub.link} isExternal>
              <strong>{pub.title}</strong>
            </Link>
            <br />
            {pub.authors}
            <br />
            <em>{pub.journal}</em>
          </ListItem>
        ))}
      </List>
    </Box>
            </Container>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default ELab;
