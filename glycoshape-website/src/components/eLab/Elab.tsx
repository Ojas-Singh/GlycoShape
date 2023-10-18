// eLab.tsx

import React, { useState } from 'react';
import { VStack, Grid, Flex, Image, Container, Box, Tab, Tabs, TabList, TabPanels, TabPanel, Text, Link, List, ListItem, Heading  } from '@chakra-ui/react';

const ELab: React.FC = () => {
  const [hoveredMember, setHoveredMember] = useState<number | null>(null);

  const members = [
    { name: 'Elisa Fadda', role: 'Principal Investigator', image: '/img/Fadda.png', hoverImage: '/img/cat2.jpg' },
    { name: 'Callum Ives', role: 'Research Scientist', image: '/img/Ives.png', hoverImage: '/img/cat1.jpeg' },
    { name: 'Ojas Singh', role: 'PhD Student', image: '/img/Singh.jpg' , hoverImage: '/img/cat3.jpg'},
    { name: 'Silvia D Andrea', role: 'PhD Student', image: '/img/leg.png' , hoverImage: '/img/cat4.jpeg'},
    { name: 'Akash Satheesan', role: 'PhD Student', image: '/img/Satheesan.png', hoverImage: '/img/cat5.jpeg' },
    { name: 'Beatrice Tropea', role: 'PhD Student', image: '/img/Tropea.png' , hoverImage: '/img/cat6.jpeg'},
    { name: 'Carl A Fogarty', role: 'PhD Student', image: '/img/Carl.jpeg' , hoverImage: '/img/cat7.jpeg'},
];
const publications = [
  {
      type: "Research Articles in Glycobiology",
      entries: [
          {
              title: "Variations within the Glycan Shield of SARS-CoV-2 Impact Viral Spike Dynamics",
              authors: "Newby ML, Fogarty CA, Allen JD, Butler J, Fadda E, Crispin M",
              source: "J Mol Biol (2022)",
              doi: "https://doi.org/10.1016/j.jmb.2022.167928"
          },
          {
              title: "Fine-tuning the Spike: Role of the nature and topology of the glycan shield in the structure and dynamics of SARS-CoV-2 S",
              authors: "Harbison AM, Fogarty CA, Phung T, Satheesan A, Schulz BL, Fadda E",
              source: "Chem Sci (2022)",
              doi: "https://doi.org/10.1039/D1SC04832E"
          },
          {
              title: "The case for post-predictional modifications in the AlphaFold Protein Structure Database",
              authors: "Bagdonas H, Fogarty AC, Fadda E, Agirre J",
              source: "Nat Struct Mol Biol (2021)",
              doi: "https://doi.org/10.1038/s41594-021-00680-9"
          },
          {
              title: "SARS-CoV-2 simulations go exascale to predict dramatic spike opening and cryptic pockets across the proteome",
              authors: "Zimmerman MI, Porter JR, Ward MD, Singh S, Vithani N, Meller A, Mallimadugula UL, Kuhn CE, Borowsky JH, Wiewiora RP, Hurley MFD, Harbison AM, Fogarty CA, Coffland JE, Fadda E, Voelz VA, Chodera JD, Bowman GR",
              source: "Nat Chem (2021)",
              doi: "https://doi.org/10.1038/s41557-021-00707-0"
          },
          {
              title: "Oligomannose N-Glycans 3D Architecture and Its Response to the FcγRIIIa Structural Landscape",
              authors: "Fogarty CA and Fadda E",
              source: "J Phys Chem B (2021)",
              doi: "https://doi.org/10.1021/acs.jpcb.1c00304"
          },
          {
              title: "Circulating SARS-CoV-2 spike N439K variants maintain fitness while evading antibody-mediated immunity",
              authors: "Thomson EC, Rosen LE, Shepherd JG, Spreafico R, da Silva Filipe A, Wojcechowskyj JA, Davis C, Piccoli L, Pascall DJ, Dillen J, Lytras S, Czudnochowski N, Shah R, Meury M, Jesudason N, De Marco A, Li K, Bassi J, O'Toole A, Pinto D, Colquhoun RM, Culap K, Jackson B, Zatta F, Rambaut A, Jaconi S, Sreenu VP, Nix J, Zhang, Jarrett RF, Glass WG, Beltramello M, Nomikou K, Pizzuto M, Tong L, Cameroni E, Croll TI, Johnson N, Di Iulio J, Wickenhagen A, Ceschi A, Harbison AM, Mair D, Ferrari P, Smollett K, Sallusto F, Carmichael S, Garzoni C, Nichols J, Galli M, Hughes J, Riva A, Ho A, Schiuma M, Semple MG, Openshaw PJM, Fadda E, Baillie JK, Chodera JD, ISARIC4C Investigators; COVID-19 Genomics UK (COG-UK) Consortium; Rihn SJ, Lycett SJ, Virgin HW, Telenti A, Corti D, Robertson DL, Snell G",
              source: "Cell (2021)",
              doi: "https://doi.org/10.1016/j.cell.2021.01.037"
          },
          {
              title: "Beyond Shielding: The Roles of Glycans in the SARS-CoV-2 Spike Protein",
              authors: "Casalino L, Gaieb Z, Goldsmith JA, Hjorth CK, Dommer AC, Harbison AM, Fogarty CA, Barros EP, Taylor BC, McLellan JS, Fadda E, Amaro RE",
              source: "ACS Central Sci (2020)",
              doi: "https://doi.org/10.1021/acscentsci.0c01056"
          },
          {
              title: "How and why plants and human N-glycans are different: Insight from molecular dynamics into the “glycoblocks” architecture of complex carbohydrates",
              authors: "Fogarty CA, Harbison AM, Dugdale AR, Fadda E",
              source: "Beilstein J Org Chem (2020)",
              doi: "https://doi.org/10.3762/bjoc.16.171"
          },
          {
              title: "An atomistic perspective on ADCC quenching by core-fucosylation of IgG1 Fc N-glycans from enhanced sampling molecular dynamics",
              authors: "Harbison AM and Fadda E",
              source: "Glycobiology (2020)",
              doi: "https://doi.org/10.1093/glycob/cwz101"
          },
          {
              title: "Sequence-to-structure dependence of isolated IgG Fc complex biantennary N-glycans: A molecular dynamics study",
              authors: "Harbison AM, Brosnan LP, Fenlon K, Fadda E",
              source: "Glycobiology (2019)",
              doi: "https://doi.org/10.1093/glycob/cwy097"
          },
          {
              title: "Aminoquinoline Fluorescent Labels Obstruct Efficient Removal of N-Glycan Core (1-6) Fucose by Bovine Kidney -L-fucosidase (BKF)",
              authors: "O'Flaherty R, Harbison AM, Hanley PJ, Taron CH, Fadda E, Rudd PM",
              source: "J Proteome Res (2017)",
              doi: "https://doi.org/10.1021/acs.jproteome.7b00580"
          },
          {
              title: "Defining the structural origin of the substrate sequence independence of O-GlcNAcase using a combination of molecular docking and dynamics simulation",
              authors: "Martin JC, Fadda E, Ito K, Woods RJ",
              source: "Glycobiology (2014)",
              doi: "https://doi.org/10.1093/glycob/cwt094"
          },
          {
              title: "Presentation, presentation, presentation! Molecular level insight into linker effects on glycan array screening data",
              authors: "Grant OC, Smith MK, Firsova D, Fadda E, Woods RJ",
              source: "Glycobiology (2014)",
              doi: "https://doi.org/10.1093/glycob/cwt083"
          },
          {
              title: "The influence of N-linked glycans on the molecular dynamics of the HIV-1 gp120 V3 loop",
              authors: "Wood NT, Fadda E, Davis R, Grant OC, Martin JC, Woods RJ, Travers SA",
              source: "PLoS ONE (2013)",
              doi: "http://doi.org/10.1371/journal.pone.0080301"
          },
          {
              title: "On the role of water models in quantifying the standard binding free energy of highly conserved water molecules in proteins: the case of Concanavalin A",
              authors: "Fadda E and Woods RJ",
              source: "J Chem Theo Comput (2011)",
              doi: "https://doi.org/10.1021/ct200404z"
          },
          {
              title: "Structure of a human-type influenza epitope [Neu5Ac-a(2,6)-Gal-b(1,4)-GlcNAc] bound to P squamosus lectin",
              authors: "Kadirvelraj R, Grant OC, Goldstein IJ, Tateno H, Fadda E, Woods RJ",
              source: "Glycobiology (2011)",
              doi: "https://doi.org/10.1093/glycob/cwr030"
          }
      ]
  },
  {
      type: "Science Communication and Education in Glycobiology",
      entries: [
          {
              title: "Can ChatGPT pass Glycobiology",
              authors: "Ormsby-Williams D and Fadda E",
              source: "Glycobiology (2023)",
              doi: "https://doi.org/10.1093/glycob/cwad064"
          },
          // {
          //     title: "Can ChatGPT pass Glycobiology",
          //     authors: "Ormsby-Williams D and Fadda E",
          //     source: "bioRxiv (2023)",
          //     doi: "https://doi.org/10.1101/2023.04.13.536705"
          // }
      ]
  },
  {
      type: "Reviews and Books Chapters in Glycobiology",
      entries: [
          {
              title: "Rebuilding glycosylation: A new approach to incorporate glycans’ structural disorder by molecular dynamics-generated 3D libraries",
              authors: "Fogarty CA and Fadda E",
              source: "Glycoprotein Analysis (2023)",
              status: "in press"
          },
          {
              title: "Glycosaminoglycans: What Remains to be Deciphered?",
              authors: "Perez S, Mashkakova O, Angulo J, Bedini E, Bisio A, de Paz JL, Fadda E, Guerrini M, Hricovini M, Hricovini M, Lisacek F, Nieto P, Pagel K, Paiardi, G, Richter R, Samsonov S, Vives R, Nikitovic D, Ricard-Blum S",
              source: "ACS Omega (2023)",
              doi: "https://doi.org/10.1021/jacsau.2c00569"
          },
          {
              title: "Molecular simulations of complex carbohydrates and glycoconjugates",
              authors: "Fadda E",
              source: "Curr Opin Chem Biol (2022)",
              doi: "https://doi.org/10.1016/j.cbpa.2022.102175"
          },
          {
              title: "Principles of SARS-CoV-2 Glycosylation",
              authors: "Chawla H, Fadda E, Crispin M",
              source: "Curr Opin Struct Biol (2022)",
              doi: "https://doi.org/10.1016/j.sbi.2022.102402"
          },
          {
              title: "Understanding the structure and function of viral glycosylation by molecular simulations: State-of-the-art and recent case studies",
              authors: "Fadda E",
              source: "Comprehensive Glycoscience, 2nd Ed (2021)",
              editor: "JJ Barchi Jr, Elsevier",
              doi: "https://doi.org/10.1016/B978-0-12-819475-1.00056-0"
          },
          {
              title: "Computational Modelling in Glycoscience",
              authors: "Perez S, Fadda E, Maskshakova O",
              source: "Comprehensive Glycoscience, 2nd Ed (2021)",
              editor: "JJ Barchi Jr, Elsevier",
              doi: "https://doi.org/10.1016/B978-0-12-819475-1.00004-3"
          },
          {
              title: "Calculating binding free energies for protein-carbohydrate complexes",
              authors: "Hadden JA, Tessier M, Fadda E, Woods RJ",
              source: "Methods in Molecular Biology: Glycoinformatics (2015)",
              editor: "Martin Frank, Springer-Nature",
              doi: "https://doi.org/10.1007/978-1-4939-2343-4_26"
          },
          {
              title: "Molecular simulation of carbohydrates and protein-carbohydrate interactions: motivations, issues and prospects",
              authors: "Fadda E and Woods RJ",
              source: "Drug Discov Today (2010)",
              doi: "https://doi.org/10.1016/j.drudis.2010.06.001"
          }
      ]
  }
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
            <Box>
      {/* <Heading as="h2" size="xl" paddingBottom={"2rem"}>Selected Publications</Heading> */}

      <VStack spacing={5} align="start">
      {publications.map((publication, idx) => (
  <Box key={idx}>
    <Heading as="h3" size="lg" color={"#6A8A81"} paddingBottom={"1.5rem"}>{publication.type}</Heading>
    {publication.entries.map((entry, entryIdx) => (
      <Box key={entryIdx} mb={4}>
        <Link href={entry.doi} isExternal>
        <Text color={"#B07095"} fontWeight="semibold">{entry.title}</Text>
        <Text >{entry.authors}</Text>
        <Text color="#546AC8">{entry.source}</Text>
        <Text color="#2B6CB0">{entry.doi}</Text>
        </Link>
        {/* ... (any other fields you want to display) */}
      </Box>
    ))}
  </Box>
))}
      </VStack>
    </Box>
            </Container>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default ELab;
