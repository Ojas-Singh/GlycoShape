// eLab.tsx

import React, { useState } from 'react';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import { SocialIcon } from 'react-social-icons'

import elab_logo from '.././assets/eLAB.png';

import { Tag, Divider, Show, SimpleGrid, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, Button, VStack, Grid, Flex, Image, Container, Box, Tab, Tabs, TabList, TabPanels, TabPanel, Text, Link, List, ListItem, Heading, HStack, Spacer, Hide } from '@chakra-ui/react';



const ELab: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [hoveredMember, setHoveredMember] = useState<number | null>(null);
  const handleOpenModal = (member: any) => {
    setSelectedMember(member);
    setIsOpen(true);
  }
  const handleCloseModal = () => {
    setSelectedMember(null);
    setIsOpen(false);
  }
  let defaultIndex: number;
  switch (location.pathname) {
    case '/team':
      defaultIndex = 1;
      break;
    case '/blog':
      defaultIndex = 2;
      break;
    case '/publications':
      defaultIndex = 3;
      break;
    default:
      defaultIndex = 0;
      break;
  }
  const members = [
    {
      name: 'Dr. Elisa Fadda', role: 'Principal Investigator', image: '/img/Fadda.png', hoverImage: '/img/cat2.jpg', coolImage: '/img/elisa.jpg', bio: 'Elisa (she/her) got a BSc and MSc (Laurea 110/110 cum laude) in Chemistry from the Università degli Studi di Cagliari. She obtained her Ph.D. in theoretical chemistry at the Université de Montréal in 2004 under the supervision of Prof Dennis R. Salahub. After her Ph.D. she worked as a Postdoctoral Fellow in Molecular Structure and Function at the Hospital for Sick Children (Sickkids) Research Institute in Toronto, where she specialised in biophysics and statistical mechanics-based methods in Dr Regis Pomes’ research group. In 2008 Elisa joined Prof Rob Woods’ Computational Glycobiology Laboratory as a Senior Research Scientist in the School of Chemistry at the University of Galway. She started her independent career in 2013 in the Department of Chemistry at Maynooth University, where she is now an Associate Professor. From January 2024 Elisa will be taking a new position in the School of Biological Sciences at the University of Southampton, where she will be an Associate Professor in Pharmacology. Elisa loves cats, running (slowly), good food, nice drinks, reading and most of all travelling to visit friends and places. Her astrological sign (and favourite monosaccharide) is a-L-fucose.'
      , socialLinks: [
        { platform: 'twitter', url: 'https://twitter.com/ElisaTelisa' },
        { platform: 'mastodon', url: 'https://mastodon.world/@Elisa' },


      ]
    },
    {
      name: 'Dr. Callum Ives', role: 'Postdoctoral Researcher', image: '/img/Ives.png', hoverImage: '/img/cat1.jpeg', coolImage: '/img/Ives.png', bio: 'Callum (he/him) obtained a BSc (Hons) in biochemistry from the University of Surrey. During this time he undertook a professional training year in the lab of Professor Martin Caffrey at Trinity College Dublin, where he conducted structure-function studies of membrane proteins using X-ray crystallography. Following on from this, he obtained a PhD with a focus on computational chemistry and biophysics from the University of Dundee under the supervision of Professor Ulrich Zachariae, where he conducted novel research on the cation selectivity mechanisms of the TRP family of ion channels. In the eLab, his current research focuses on determining the structure of glycans, and understanding how glycosylation modulates the structure and function of membrane proteins and antibodies. Outside of science, Callum enjoys watching sport, and hiking in the hills of Donegal.', socialLinks: [
        { platform: 'twitter', url: 'https://twitter.com/CallumMIves' },

      ]
    },
    {
      name: 'Ojas Singh', role: 'PhD Student', image: '/img/Singh.jpg', hoverImage: '/img/cat3.jpg', coolImage: '/img/ojas.jpg', bio: "Ojas (he/him) got his BSc and MSc in Chemistry from the Indian Institute of Science Education and Research Mohali. During his masters under the supervision of Dr. P. Balanarayan, he dabbled with different low level programming languages to develop code to optimize the Configuration Interaction (CI) Hamiltonian construction. Working as a research assistant for a year in the lab of Dr. Sabyasachi Rakshit, he designed a high-performance algorithm for magnetic tweezers to monitor real-time protein folding and unfolding at the millisecond temporal resolution and nanometer spatial resolution. Currently, He is pursuing a PhD in computational chemistry at Maynooth University in Ireland. In the eLab, he is building the glycoshape database and creating Re-Glyco. Outside of work, Ojas likes to playing CS, Valorant with his buddies, analysing sci-fi movies, hiding cat pics in this website.", socialLinks: [
        { platform: 'twitter', url: 'https://twitter.com/Ojas_Singh_' },
        { platform: 'github', url: 'https://github.com/Ojas-Singh' },
        { platform: 'linkedin', url: 'https://www.linkedin.com/in/ojas-singh-192477200/' }

      ]
    },
    {
      name: "Silvia D'Andrea", role: 'PhD Student', image: '/img/andrea.jpg', hoverImage: '/img/cat4.jpeg', coolImage: '/img/silvia.jpg', bio: "Silvia D'Andrea holds a master's degree in Industrial Pharmacy from the University of Luigi Vanvitelli in Caserta, Italy. She is currently pursuing a PhD in computational chemistry at Maynooth University in Ireland, with a specific interest in characterizing the structure and dynamics of N/O-glycans to understand the crucial role of glycosylation in proteins. Beyond her studies and career, Silvia loves pizza and enjoys spending time with friends and family. Additionally, she is learning to play the piano to accompany Christmas songs all year round.", socialLinks: [
        { platgorm: 'linkedin', url: 'https://www.linkedin.com/in/silvia-d-andrea-8b2b10187/' }]
    },
    {
      name: 'Akash Satheesan', role: 'PhD Student', image: '/img/Satheesan.png', hoverImage: '/img/cat5.jpeg', coolImage: '/img/akash.jpg', bio: "Akash Satheesan (he/him) earned his BSc in Pharmaceutical and Biomedical Chemistry in Maynooth University during which he completed an industrial placement where he conducted solid phase peptide synthesis of peptide therapeutics coupled with comprehensive analysis utilizing HPLC and UPLC techniques. Currently, he is pursuing a PhD in Computational Chemistry in Maynooth University. His research is mainly focused on the characterisation of glycan interactions in the context of bacterial infection. Outside of research, Akash enjoys playing basketball, kick-boxing and picking up injuries all year round.", socialLinks: [

        { platform: 'linkedin', url: 'https://www.linkedin.com/in/akash-s-471435124/' }

      ]
    },
    {
      name: 'Beatrice Tropea', role: 'PhD Student', image: '/img/Tropea.png', hoverImage: '/img/cat6.jpeg', coolImage: '/img/bea.jpg', bio: "Beatrice is from Italy, and her interests and background span across medicinal chemistry, life sciences, and data science. With a Master’s degree in Medicinal Chemistry from 'La Sapienza' University of Rome, she discovered her passion for computational chemistry. While working at the 'Policlinico A. Gemelli' hospital in Rome, she combined her expertise in computational chemistry with data science. Now, as a PhD student at eLab, her focus is on understanding the selectivity of the N-glycosylation process. She not only loves sugars but also has a passion for cats, astronomy, and travelling.", socialLinks: [
        { platform: 'twitter', url: 'https://twitter.com/beatrice_tropea' },
        { platform: 'linkedin', url: 'http://linkedin.com/in/beatrice-tropea-8b9524182' }
      ]
    },
    {
      name: 'Carl A Fogarty', role: 'PhD Student', image: '/img/Carl.jpeg', hoverImage: '/img/cat7.jpeg', coolImage: '/img/Fogarty.jpeg', bio: "Carl Fogarty earned a BSc in Chemistry and Statistics from Maynooth University, Beginning In E-lab during his BSc his 4th year project involved iminosuggar derivatives and their 𝛼 ‑ Glucosidase activity. Continuing in the group under the Government of Ireland Postgraduate Scholarship he worked on Characterisation of structure to function relationships in glycans and glycosylated proteins by computer simulation techniques which he created structural models from oligomannose glycan to the SARS-CoV-2 S protein. Currently finishing writing his thesis with the same name. Outside of science Carl is working on getting himself into some semblance of fitness.", socialLinks: [
        { platform: 'twitter', url: 'https://twitter.com/2016Carl' },
      ]
    },
  ];
  const publications = [
    {
      type: "Research Articles in Glycobiology",
      entries: [
        {
          title: "Restoring Protein Glycosylation with GlycoShape",
          authors: "Callum M Ives*, Ojas Singh*, Silvia D’Andrea, Carl A Fogarty, Aoife M Harbison, Akash Satheesan, Beatrice Tropea, Elisa Fadda",
          source: "bioRxiv (2023)",
          doi: "https://doi.org/10.1101/2023.12.11.571101",
          files_doi: ""
        },
        {
          title: "#GotGlycans: Role of N343 Glycosylation on the SARS-CoV-2 S RBD Structure and Co-Receptor Binding Across Variants of Concern",
          authors: "Callum M Ives, Linh Nguyen, Carl A. Fogarty, Aoife M Harbison, Yves Durocher, John S. Klassen, Elisa Fadda",
          source: "bioRxiv (2023)",
          doi: "https://doi.org/10.1101/2023.12.05.570076",
          files_doi: "https://doi.org/10.5281/zenodo.10441732"
        },
        {
          title: "Variations within the Glycan Shield of SARS-CoV-2 Impact Viral Spike Dynamics",
          authors: "Newby ML, Fogarty CA, Allen JD, Butler J, Fadda E, Crispin M",
          source: "J Mol Biol (2022)",
          doi: "https://doi.org/10.1016/j.jmb.2022.167928",
          files_doi: ""
        },
        {
          title: "Fine-tuning the Spike: Role of the nature and topology of the glycan shield in the structure and dynamics of SARS-CoV-2 S",
          authors: "Harbison AM, Fogarty CA, Phung T, Satheesan A, Schulz BL, Fadda E",
          source: "Chem Sci (2022)",
          doi: "https://doi.org/10.1039/D1SC04832E",
          files_doi: ""
        },
        {
          title: "The case for post-predictional modifications in the AlphaFold Protein Structure Database",
          authors: "Bagdonas H, Fogarty AC, Fadda E, Agirre J",
          source: "Nat Struct Mol Biol (2021)",
          doi: "https://doi.org/10.1038/s41594-021-00680-9",
          files_doi: ""
        },
        {
          title: "SARS-CoV-2 simulations go exascale to predict dramatic spike opening and cryptic pockets across the proteome",
          authors: "Zimmerman MI, Porter JR, Ward MD, Singh S, Vithani N, Meller A, Mallimadugula UL, Kuhn CE, Borowsky JH, Wiewiora RP, Hurley MFD, Harbison AM, Fogarty CA, Coffland JE, Fadda E, Voelz VA, Chodera JD, Bowman GR",
          source: "Nat Chem (2021)",
          doi: "https://doi.org/10.1038/s41557-021-00707-0",
          files_doi: ""
        },
        {
          title: "Oligomannose N-Glycans 3D Architecture and Its Response to the FcγRIIIa Structural Landscape",
          authors: "Fogarty CA and Fadda E",
          source: "J Phys Chem B (2021)",
          doi: "https://doi.org/10.1021/acs.jpcb.1c00304",
          files_doi: ""
        },
        {
          title: "Circulating SARS-CoV-2 spike N439K variants maintain fitness while evading antibody-mediated immunity",
          authors: "Thomson EC, Rosen LE, Shepherd JG, Spreafico R, da Silva Filipe A, Wojcechowskyj JA, Davis C, Piccoli L, Pascall DJ, Dillen J, Lytras S, Czudnochowski N, Shah R, Meury M, Jesudason N, De Marco A, Li K, Bassi J, O'Toole A, Pinto D, Colquhoun RM, Culap K, Jackson B, Zatta F, Rambaut A, Jaconi S, Sreenu VP, Nix J, Zhang, Jarrett RF, Glass WG, Beltramello M, Nomikou K, Pizzuto M, Tong L, Cameroni E, Croll TI, Johnson N, Di Iulio J, Wickenhagen A, Ceschi A, Harbison AM, Mair D, Ferrari P, Smollett K, Sallusto F, Carmichael S, Garzoni C, Nichols J, Galli M, Hughes J, Riva A, Ho A, Schiuma M, Semple MG, Openshaw PJM, Fadda E, Baillie JK, Chodera JD, ISARIC4C Investigators; COVID-19 Genomics UK (COG-UK) Consortium; Rihn SJ, Lycett SJ, Virgin HW, Telenti A, Corti D, Robertson DL, Snell G",
          source: "Cell (2021)",
          doi: "https://doi.org/10.1016/j.cell.2021.01.037",
          files_doi: ""
        },
        {
          title: "Beyond Shielding: The Roles of Glycans in the SARS-CoV-2 Spike Protein",
          authors: "Casalino L, Gaieb Z, Goldsmith JA, Hjorth CK, Dommer AC, Harbison AM, Fogarty CA, Barros EP, Taylor BC, McLellan JS, Fadda E, Amaro RE",
          source: "ACS Central Sci (2020)",
          doi: "https://doi.org/10.1021/acscentsci.0c01056",
          files_doi: ""
        },
        {
          title: "How and why plants and human N-glycans are different: Insight from molecular dynamics into the “glycoblocks” architecture of complex carbohydrates",
          authors: "Fogarty CA, Harbison AM, Dugdale AR, Fadda E",
          source: "Beilstein J Org Chem (2020)",
          doi: "https://doi.org/10.3762/bjoc.16.171",
          files_doi: ""
        },
        {
          title: "An atomistic perspective on ADCC quenching by core-fucosylation of IgG1 Fc N-glycans from enhanced sampling molecular dynamics",
          authors: "Harbison AM and Fadda E",
          source: "Glycobiology (2020)",
          doi: "https://doi.org/10.1093/glycob/cwz101",
          files_doi: ""
        },
        {
          title: "Sequence-to-structure dependence of isolated IgG Fc complex biantennary N-glycans: A molecular dynamics study",
          authors: "Harbison AM, Brosnan LP, Fenlon K, Fadda E",
          source: "Glycobiology (2019)",
          doi: "https://doi.org/10.1093/glycob/cwy097",
          files_doi: ""
        },
        {
          title: "Aminoquinoline Fluorescent Labels Obstruct Efficient Removal of N-Glycan Core (1-6) Fucose by Bovine Kidney -L-fucosidase (BKF)",
          authors: "O'Flaherty R, Harbison AM, Hanley PJ, Taron CH, Fadda E, Rudd PM",
          source: "J Proteome Res (2017)",
          doi: "https://doi.org/10.1021/acs.jproteome.7b00580",
          files_doi: ""
        },
        {
          title: "Defining the structural origin of the substrate sequence independence of O-GlcNAcase using a combination of molecular docking and dynamics simulation",
          authors: "Martin JC, Fadda E, Ito K, Woods RJ",
          source: "Glycobiology (2014)",
          doi: "https://doi.org/10.1093/glycob/cwt094",
          files_doi: ""
        },
        {
          title: "Presentation, presentation, presentation! Molecular level insight into linker effects on glycan array screening data",
          authors: "Grant OC, Smith MK, Firsova D, Fadda E, Woods RJ",
          source: "Glycobiology (2014)",
          doi: "https://doi.org/10.1093/glycob/cwt083",
          files_doi: ""
        },
        {
          title: "The influence of N-linked glycans on the molecular dynamics of the HIV-1 gp120 V3 loop",
          authors: "Wood NT, Fadda E, Davis R, Grant OC, Martin JC, Woods RJ, Travers SA",
          source: "PLoS ONE (2013)",
          doi: "http://doi.org/10.1371/journal.pone.0080301",
          files_doi: ""
        },
        {
          title: "On the role of water models in quantifying the standard binding free energy of highly conserved water molecules in proteins: the case of Concanavalin A",
          authors: "Fadda E and Woods RJ",
          source: "J Chem Theo Comput (2011)",
          doi: "https://doi.org/10.1021/ct200404z",
          files_doi: ""
        },
        {
          title: "Structure of a human-type influenza epitope [Neu5Ac-a(2,6)-Gal-b(1,4)-GlcNAc] bound to P squamosus lectin",
          authors: "Kadirvelraj R, Grant OC, Goldstein IJ, Tateno H, Fadda E, Woods RJ",
          source: "Glycobiology (2011)",
          doi: "https://doi.org/10.1093/glycob/cwr030",
          files_doi: ""
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
          doi: "https://doi.org/10.1093/glycob/cwad064",
          files_doi: ""
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
          status: "in press",
          files_doi: ""
        },
        {
          title: "Glycosaminoglycans: What Remains to be Deciphered?",
          authors: "Perez S, Mashkakova O, Angulo J, Bedini E, Bisio A, de Paz JL, Fadda E, Guerrini M, Hricovini M, Hricovini M, Lisacek F, Nieto P, Pagel K, Paiardi, G, Richter R, Samsonov S, Vives R, Nikitovic D, Ricard-Blum S",
          source: "ACS Omega (2023)",
          doi: "https://doi.org/10.1021/jacsau.2c00569",
          files_doi: ""
        },
        {
          title: "Molecular simulations of complex carbohydrates and glycoconjugates",
          authors: "Fadda E",
          source: "Curr Opin Chem Biol (2022)",
          doi: "https://doi.org/10.1016/j.cbpa.2022.102175",
          files_doi: ""
        },
        {
          title: "Principles of SARS-CoV-2 Glycosylation",
          authors: "Chawla H, Fadda E, Crispin M",
          source: "Curr Opin Struct Biol (2022)",
          doi: "https://doi.org/10.1016/j.sbi.2022.102402",
          files_doi: ""
        },
        {
          title: "Understanding the structure and function of viral glycosylation by molecular simulations: State-of-the-art and recent case studies",
          authors: "Fadda E",
          source: "Comprehensive Glycoscience, 2nd Ed (2021)",
          editor: "JJ Barchi Jr, Elsevier",
          doi: "https://doi.org/10.1016/B978-0-12-819475-1.00056-0",
          files_doi: ""
        },
        {
          title: "Computational Modelling in Glycoscience",
          authors: "Perez S, Fadda E, Maskshakova O",
          source: "Comprehensive Glycoscience, 2nd Ed (2021)",
          editor: "JJ Barchi Jr, Elsevier",
          doi: "https://doi.org/10.1016/B978-0-12-819475-1.00004-3",
          files_doi: ""
        },
        {
          title: "Calculating binding free energies for protein-carbohydrate complexes",
          authors: "Hadden JA, Tessier M, Fadda E, Woods RJ",
          source: "Methods in Molecular Biology: Glycoinformatics (2015)",
          editor: "Martin Frank, Springer-Nature",
          doi: "https://doi.org/10.1007/978-1-4939-2343-4_26",
          files_doi: ""
        },
        {
          title: "Molecular simulation of carbohydrates and protein-carbohydrate interactions: motivations, issues and prospects",
          authors: "Fadda E and Woods RJ",
          source: "Drug Discov Today (2010)",
          doi: "https://doi.org/10.1016/j.drudis.2010.06.001",
          files_doi: ""
        }
      ]
    }
  ];

  return (

    <Box   >


      <Tabs
        align={"start"}
        // alignItems={"start"}
        maxWidth="100%"
        padding={"0rem"}
        paddingTop={"1rem"}
        variant='soft-rounded'
        colorScheme='green'
        defaultIndex={defaultIndex}
      >
        <TabList display="flex" width={'100%'} position="sticky" top="0" bg="white" zIndex="10" padding={"0rem"}>


          {/* <SimpleGrid    columns={[1,2]} spacing={10} paddingTop={'0rem'} paddingBottom={'0rem'}> */}
          <Hide below="lg">
            <Text
              paddingLeft={{ base: "0.2rem", sm: "0.2rem", md: "0.2rem", lg: "5rem", xl: "5rem" }}
              bgGradient='linear(to-l, #44666C, #A7C4A3)'
              bgClip='text'
              fontSize={{ base: "xl", sm: "3xl", md: "3xl", lg: "5xl", xl: "5xl" }}
              fontWeight='extrabold'
            // marginBottom="0.2em"
            >
              Elisa Fadda Research Group
            </Text></Hide>
          <Show below="lg">
            <Text
              paddingLeft={{ base: "0.2rem", sm: "0.2rem", md: "0.2rem", lg: "5rem", xl: "5rem" }}
              bgGradient='linear(to-l, #44666C, #A7C4A3)'
              bgClip='text'
              fontSize={{ base: "xl", sm: "3xl", md: "3xl", lg: "5xl", xl: "5xl" }}
              fontWeight='extrabold'
            // marginBottom="0.2em"
            >
              Elisa Group
            </Text>
          </Show>
          <Spacer />
          <HStack>
            <Tab as={RouterLink} to="/elab">eLab</Tab>
            <Tab as={RouterLink} to="/team">Team</Tab>
            <Tab as={RouterLink} to="/blog">Blog</Tab>
            <Tab as={RouterLink} to="/publications">Publications</Tab></HStack>
          {/* </SimpleGrid> */}
        </TabList>

        <TabPanels>
          <TabPanel paddingTop={"2rem"}>
            <Container maxWidth={{ base: "100%", sm: "100%", md: "80%", lg: "80%", xl: "80%" }} >
              <Heading size="lg" marginBottom="5" >
                Molecular Structure and Function of Glycans and Glycoproteins in the Biology of Health and Disease      </Heading>

              <Text mb={4} >
                In our research group we use high-performance computing (HPC) molecular simulation techniques to reconstruct complex carbohydrates (glycans) and to understand their many different roles in biology. During the past few years we have dedicated a huge amount of our time and computational resources to the creation of the GlycoShape DB, where we are continuously depositing equilibrium 3D structures of glycans, glycan fragments and epitopes, from all-atom molecular dynamics (MD) simulations, that can be used in combination with molecular docking and/or MD to study glycan recognition and with Re-Glyco to rebuild glycoproteins to their native functional state. In addition to the development of GlycoShape to advance research in structural glycobiology, we are actively working in the following research areas:
              </Text>
              
              
              <SimpleGrid alignSelf="center" justifyItems="center" columns={[1, 2]} spacing={10} paddingTop={'2rem'} paddingBottom={'2rem'}>
                <div>
              <Heading size="md" mb={2}>Current research topics include,</Heading>
              <List styleType="disc" pl={5} mb={4}>
                <ListItem>Viral glycobiology</ListItem>
                <ListItem>Glycans recognition in bacterial infection</ListItem>
                <ListItem>Glycan recognition in immune response</ListItem>
                <ListItem>Glycosylation in adhesion-GPCRs</ListItem>
                <ListItem>OST regulation of protein N-glycosylation</ListItem>
                <ListItem>Hierarchy and control in N-glycosylation pathways</ListItem>
                <ListItem>Development of statistical and ML tools for advancing glycomics and glycoanalytics </ListItem>

              </List>
              </div>
              
              <Image  marginLeft={"2rem"} width="400px" src={elab_logo} /></SimpleGrid>
              <Text mt={4}>
                For more information please contact <Link href="mailto:elisa.fadda@soton.ac.uk " color="blue.500">elisa.fadda@soton.ac.uk</Link>
              </Text>
            </Container>
          </TabPanel>

          <TabPanel>
            <Container maxWidth={{ base: "100%", sm: "100%", md: "80%", lg: "80%", xl: "80%" }} >

              <Box padding="5rem" paddingTop={"1rem"}>
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
                        onClick={() => handleOpenModal(member)}
                      />
                      <Link onClick={() => handleOpenModal(member)}>
                        <Heading size="md" marginBottom="0.5rem">{member.name}</Heading>
                        <Text>{member.role}</Text></Link>
                    </Flex>
                  ))}
                </Grid>
              </Box>
            </Container>
          </TabPanel>

          <TabPanel>
            <Box flex='1' alignItems={'center'} id="Nomenclature" pb={'4rem'}
              boxShadow="md"
              marginBottom="1em"
              margin={"1em"}
              backgroundColor="white"
              borderRadius="md"

            >
              <Flex bgPosition="center" bgRepeat="no-repeat" bgSize="cover" flexDirection="column" alignItems="center" justifyContent="center" height="30vh" width="100%"

              >
                <Text
                  padding={{ base: "0.2rem", sm: "0.2rem", md: "4rem", lg: "4rem", xl: "4rem" }}
                  bgGradient='linear(to-l, #6530A5, #898E32)'
                  bgClip='text'
                  fontSize={{ base: "xl", sm: "3xl", md: "3xl", lg: "3xl", xl: "3xl" }}
                  fontWeight='extrabold'
                // marginBottom="0.2em"
                >
                  #GotGlycans: Role of N343 Glycosylation on the SARS-CoV-2 S RBD Structure and Co-Receptor Binding Across Variants of Concern
                </Text>
                {/* <Image maxHeight={"40rem"} width={'auto'} src="/img/blog/F1.large.jpg" alt="Figure 1" /> */}
              </Flex>
              <Divider />
              <Grid
                templateColumns={{ base: "1fr", md: "1fr 3fr 1fr" }}
                gap={5}
                justifyItems="center"
                alignSelf="center"
              >
                <Box marginTop={"1rem"}> <Image
                  boxSize="120px"
                  objectFit="cover"
                  borderRadius="full"
                  src={'/img/sciencecast.jpeg'}
                  alt={'/img/cat2.jpg'}
                  marginBottom="0rem"
                  alignItems={'center'}
                />
                  ScienceCast <br></br> AI-generated summary</Box>
                <Box>
                  <Text fontFamily={'texts'} textAlign="justify" fontSize="md" paddingLeft="0rem" paddingRight="0rem" paddingTop="1rem">
                    In the context of SARS-CoV-2's evolution and immune evasion, the glycosylation of the spike protein's receptor binding domain (RBD) is a focal point. The study delves into the specific role of N343 glycosylation across various variants, utilizing over 45 seconds of molecular dynamics (MD) simulations. Results indicate the amphipathic N-glycan at N343 preserves the RBD's structural integrity, with its removal causing a uniform conformational change, affecting the receptor binding motif (RBM) in early strains (WHu-1, alpha, beta) but not in later ones (delta, omicron). Omicron variants, with key mutations near N343, maintain RBD architecture independent of the glycan, underscoring an evolutionary adaptation. Empirical data on RBD binding to monosialylated ganglioside co-receptors show dependency on N343 glycosylation for WHu-1 but not for delta, suggesting additional evolutionary changes in co-receptor interactions.</Text>

                  <Image maxHeight={"40rem"} width={'auto'} src="/img/blog/F1.large.jpg" alt="Figure 1" />
                  <Text color='#B195A2' alignSelf={"left"} fontSize={'xs'}>
                    Panel a) Atomistic model of the SARS-CoV-2 (WHu-1) S glycoprotein trimer embedded in a lipid bilayer as reported in ref(Casalino et al., 2020). In the conformation shown, the S bears the RBD of chain A in an open conformation, highlighted with a solvent accessible surface rendering. The topological S1 and S2 subdomains are indicated on the left-hand side. Glycans are represented with sticks in white, the protein is represented with cartoon rendering with different shades of cyan to highlight the chains. Panel b) Close-up of the open RBD (WHu-1) in a ACE2-bound conformation (PDB 6M0J), with regions colour-coded as described in the legend. Key residues for anchoring the FA2G2 (GlyTouCan-ID G00998NI) N343 glycan, namely S371, S373 and S375, across the beta sheet core are highlighted also in the Symbol Nomenclature for Glycans (SNFG) diagram on the bottom-right with links to the monosaccharides corresponding to primary contacts. Key residues of the hydrophobic patch (orange) found to be inverted in the recently isolated FLip XBB1.5 variant are also indicated. Panel c) Heat map indicating the interactions frequency (%) classified in terms of hydrogen bonding and van der Waals contacts between the N343 glycan and the RBD residues 365 to 375 for each VoC, over the cumulative conventional MD (cMD) and enhanced GaMD sampling. Panel d) Side view of the RBD with the antigenic Region 1 (green), Region 2 (or RBM in yellow), and Region 3 (orange) highlighted. Key residues Y351 and L452 at the intersection between Region 1 and the Receptor Binding Motif (RBM) are indicated, together with the predicted site for the GM1 co-receptor binding. Rendering with VMD (https://www.ks.uiuc.edu/Research/vmd/).
                  </Text>
                  <Text fontFamily={'texts'} textAlign="justify" fontSize="md" paddingLeft="0rem" paddingRight="0rem" paddingTop="1rem">
                    Molecular insights were acquired using all-atom force fields for protein, glycan, and solvent molecules, with analysis extending to variant under monitoring (VUM) omicron BA.2.86 ('pirola'). This variant has gained a new N-glycosylation site at N354, indicating the glycan shield's adaptive evolution.
                  </Text>
                  <Image maxHeight={"50rem"} width={'auto'} src="/img/blog/F2.large.jpg" alt="Figure 1" />
                  <Text color='#B195A2' alignSelf={"left"} fontSize={'xs'}>
                    Panel a) Kernel Density Estimates (KDE) plot of the backbone RMSD values calculated relative to frame 1 (t = 0) of the trajectory for Region 1 (green) aa 337-353, Region 2 (yellow) aa 439-506, and Region 3 (orange) aa 411-426 of the glycosylated (left plot) and non-glycosylated (right plot) WHu-1 RBDs. Duration of the MD sampling is indicated on the top-right corner of each plot with the conformational equilibration time subtracted as the corresponding data were not included in the analysis. Representative structures from the MD trajectories of the WHu-1 RBD glycosylated (cyan) and non-glycosylated (blue) at N343 are shown on the right-hand side of the panel. The N343 glycan (GlyTouCan-ID G00998NI) is rendered with sticks in white, the hydrophobic residues underneath the N343 glycan are highlighted with VDW spheres, while the protein structure is represented with cartoons. Panel b) KDE plot of the backbone RMSD values (see details in panel a) above) calculated for the alpha (B.1.1.7) RBD glycosylated (left) and non-glycosylated (right) at N343. Representative structures from the MD simulation of the alpha RBDs are shown on the right-hand side of the panel, with the N343 glycosylated RBD shown with pink cartoons and the non-glycosylated alpha RBD in purple cartoons. Panel c) KDE plots of the backbone RMSD values calculated for the beta (B.1.351) RBD glycosylated (left) and non-glycosylated (right) at N343. Representative structures from the MD simulation of the beta RBDs are shown on the right-hand side of the panel, with the N343 glycosylated RBD shown with orange cartoons and the non-glycosylated alpha RBD in red cartoons. Panel d) Binding affinities (1/Kd, x103 M-1) for interactions between different RBDs (including intact and endoF3 treated WHu-1 RBD and alpha and beta RBD) and the GM1os (GlyTouCan-ID G46613JI) and GM2os (GlyTouCan-ID G61168WC) oligosaccharides. HEK293a samples(Nguyen et al., 2021) and shown here as reference. HEK293b samples all carry FLAG and His tags and are shown for WHu-1 (glycosylated and treated with endoF3 treated), alpha and beta sequences. Further details in Supplementary Material. Panel e) Predicted complex between the WHu-1 RBD and GM1os, with GM1os represented with sticks in SNFG colours, the protein represented with cartoons (cyan) and the N343 with sticks (white). Residues directly involved in the GM1os binding or proximal are labelled and highlighted with sticks. All N343 glycosylated RBDs carry also a FA2G2 N-glycan (GlyTouCan-ID G00998NI) at N331, which is not shown for clarity. Rendering done with VMD (https://www.ks.uiuc.edu/Research/vmd/), KDE analysis with seaborn (https://seaborn.pydata.org/) and bar plot with MS Excel.
                  </Text>
                  <Image maxHeight={"30rem"} width={'auto'} src="/img/blog/F3.large.jpg" alt="Figure 1" />
                  <Text color='#B195A2' alignSelf={"left"} fontSize={'xs'}>
                    Panel a) KDE plot of the backbone RMSD values calculated relative to frame 1 (t = 0) of the MD1 trajectory for Region 1 (green) aa 337-353, Region 2 (yellow) aa 439-506, and Region 3 (orange) aa 411-426 of the N343 glycosylated delta (B.1.617.2) RBD. The MD1 simulation was started from the open RBD conformation from the cryo-EM structure PDB 7V7Q. Based on the conformation of the N-glycan reconstructed at N353, the first 100 ns of the MD1 production trajectory were considered part of the conformational equilibration and not included in the data analysis. Panel b) KDE plot of the backbone RMSD values calculated relative to frame 1 (t = 0) of the MD2 trajectory for Regions 1-3 (see details above) of the N343 glycosylated delta (B.1.617.2) RBD. The MD2 simulation was started from the open RBD conformation from the cryo-EM structure PDB 7V7Q with different velocities relative to MD1. The first 350 ns of the MD2 production trajectory were considered part of the conformational equilibration and not included in the data analysis. Panel c) KDE plot of the backbone RMSD values calculated relative to frame 1 (t = 0) of the GaMD trajectory for Regions 1-3 of the N343 glycosylated delta (B.1.617.2) RBD. The first 400 ns of the GaMD production trajectory were considered part of the conformational equilibration and not included in the data analysis. Panel e) Graphical representation of the delta RBD with the protein structure (lime cartoon) from a representative snapshot from MD1. The N343 FA2G2 glycan (GlyTouCan-ID G00998NI) is represented in different colours, corresponding to the different MD trajectories, as described in the legend, with snapshots taken at intervals of 100 ns. Residues in the hydrophobic core of the delta RBD are represented with VDW spheres partially visible under the N-glycans overlay. Panel f) Insert showing the junction between Regions 1 and 2 from the left-hand side of the RBD in panel e). The residues involved in the network solidifying the junction are highlighted with sticks and labelled. Panel f) Affinities (1/Kd, x103 M-1) for interactions between GM1os (GlyTouCan-ID G46613JI) and GM2os (GlyTouCan-ID G61168WC) oligosaccharides and the intact and endoF3-treated delta RBD and omicron RBD. Rendering done with VMD (https://www.ks.uiuc.edu/Research/vmd/), KDE analysis with seaborn (https://seaborn.pydata.org/) and bar plot with MS Excel.
                  </Text>
                  <Image maxHeight={"20rem"} width={'auto'} src="/img/blog/F4.large.jpg" alt="Figure 1" />
                  <Text color='#B195A2' alignSelf={"left"} fontSize={'xs'}>
                    Panel a) KDE plot of the backbone RMSD values calculated relative to frame 1 (t = 0) of the GaMD trajectory for Region 1 (green) aa 337-353, Region 2 (yellow) aa 439-506, and Region 3 (orange) aa 411-426 of the glycosylated omicron (BA.1) RBD. Panel b) KDE plot of the backbone RMSD values calculated relative to frame 1 (t = 0) of the GaMD trajectory (see details above) of the non-glycosylated omicron (BA.1) RBD. Panel c) Graphical representation of the glycosylated (protein in yellow cartoons and N343-FA2G2 in white sticks, N331 omitted for clarity) and non-glycosylated (protein in cyan cartoons) of the omicron (BA.1) RBD. Structures correspond to the last frame of the GaMD trajectories, see details in the legend. Panel d) KDE plot of the backbone RMSD values calculated relative to frame 1 (t = 0) of the MD trajectory of the omicron BA.2.86 RBD glycosylated with FA2G2 N-glycans at N343, N354 and N331(not shown). Panel e) Graphical representation of the omicron BA.2.86 RBD (protein in violet cartoons and N-glycans in violet sticks) structurally aligned to the glycosylated omicron (BA.1) RBD (protein in yellow cartoons) for reference. The N343 and N354 glycans are intertwined throughout the trajectory. Panel f) Same graphical representation of the omicron BA.2.86 and BA.1 RBDs with the N-glycans not shown. The purple arrow points to the displacement of the loop in response to the presence of the N354 glycan in BA.2.86. Rendering with VMD (https://www.ks.uiuc.edu/Research/vmd/) and KDE analysis with seaborn (https://seaborn.pydata.org/).
                  </Text>
                  <Text marginBottom="3rem" fontFamily={'texts'} textAlign="justify" fontSize="md" paddingLeft="0rem" paddingRight="0rem" paddingTop="1rem">
                    This paper's findings expand our understanding of glycosylation's critical roles in structure-function relationships of viral proteins. The potential for N343 to become a mutational hotspot and the structural dispensability of its glycosylation site may inform immune surveillance and vaccine design, considering the balance between protein fold integrity and immune recognition.
                  </Text>
                  <Link href="https://doi.org/10.1101/2023.12.05.570076" isExternal>
                    <Button alignSelf="center" variant='outline' colorScheme="teal" >Read full paper</Button>
                  </Link>&nbsp;&nbsp;
                  <Link href="https://doi.org/10.5281/zenodo.10441732" isExternal>
                    <Button alignSelf="center" variant='outline' colorScheme="teal" >Download the files</Button>
                  </Link>
                </Box>

                <Box marginTop={"1rem"}>

                  <Tag variant='outline' colorScheme='teal'>Covid</Tag>&nbsp;
                  <Tag variant='outline' colorScheme='teal'>Glycan</Tag>&nbsp;
                  <Tag variant='outline' colorScheme='teal'>N343</Tag>&nbsp;
                  <Tag variant='outline' colorScheme='teal'>viral evasion and fitness</Tag>

                </Box>


              </Grid>

            </Box>
          </TabPanel>

          <TabPanel>
            <Container maxWidth={{ base: "100%", sm: "100%", md: "80%", lg: "80%", xl: "80%" }} >
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
                          {/* Check if files property exists and render link */}
                          {entry.files_doi !== "" && (
                            <Link href={entry.files_doi} isExternal>
                              <Text color="#6A8A81">Files : {entry.files_doi}</Text>
                            </Link>
                          )}
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
      <Modal size={'10px  '} isOpen={isOpen} onClose={handleCloseModal}>
        <ModalOverlay bg='none'
          backdropFilter='auto'
          // backdropInvert='80%'
          backdropBlur='3px' />
        <ModalContent>
          <ModalHeader alignSelf={'center'}>
            <Text
              bgGradient='linear(to-l,  #B07095, #D7C9C0)'
              bgClip='text'
              fontSize={{ base: "3xl", sm: "3xl", md: "4xl", lg: "4xl", xl: "4xl" }}
              fontWeight='bold'
              marginBottom="0.2em"
              marginLeft={'2rem'}
            >
              {selectedMember?.name}
            </Text>
          </ModalHeader>
          <ModalCloseButton onClick={handleCloseModal} />
          <ModalBody>
            <SimpleGrid alignSelf="center" justifyItems="center" columns={[1, 2]} spacing={10} paddingTop={'2rem'} paddingBottom={'2rem'}>

              <Image
                // boxSize="150px"
                width="60vh"
                objectFit="cover"
                src={selectedMember?.coolImage}
                alt={selectedMember?.name}
                marginBottom="1rem"
              />
              <Text marginBottom="1rem">{selectedMember?.bio || "Bio information goes here."}</Text>
              <HStack>
                {selectedMember?.socialLinks?.map((link: any, idx: number) => (

                  <SocialIcon network={link.platform} url={link.url} />
                  // <Link key={idx} href={link.url} isExternal>
                  //     {link.platform}
                  // </Link>
                ))}</HStack>
            </SimpleGrid>
          </ModalBody>

        </ModalContent>
      </Modal>


    </Box>
  );
};

export default ELab;
