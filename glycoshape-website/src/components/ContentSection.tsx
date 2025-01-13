import React, {useEffect, useState} from 'react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { Alert, AlertIcon, AlertTitle, AlertDescription,
  SimpleGrid,  Highlight, Text, Flex, Box, Image, Heading, Container, Link,  VStack, 
} from "@chakra-ui/react";
import Searchbar from './SearchBar';
import bg from './assets/ne.png';
import cell from './assets/cell_surface.jpg';
import hand from './assets/handnew2.png';
import fold from './assets/fold.png'
import fuzzy from './assets/fuzzy.png'

interface AlertData {
  title: string;
  description: string;
}
  
const ContentSection: React.FC = () => {
  const [alert, setAlert] = useState<AlertData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/database/alert.json`)
      .then(response => {
        setAlert(response.data);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, );
  return (

    <Flex direction="column" width="100%">
      {alert && (
        <Alert status="info">
          <AlertIcon />
          <AlertTitle mr={2}>{alert.title}</AlertTitle>
          <AlertDescription>{alert.description}</AlertDescription>
        </Alert>
      )}
      <Flex
        direction="column"
        align="center"
        justify="center"
        flex="1"
        padding="5rem"
        paddingLeft={{ base: "0.5rem", sm: "0.5rem", md: "5rem", lg: "5rem", xl: "5rem" }}
        paddingRight={{ base: "0.5rem", sm: "0.5rem", md: "5rem", lg: "5rem", xl: "5rem" }}
        paddingBottom={{ base: "3rem", sm: "3rem", md: "3rem", lg: "3rem", xl: "3rem" }}
        paddingTop={{ base: "5rem", sm: "5rem", md: "5rem", lg: "6rem", xl: "6rem" }}
        minHeight={{ base: "50vh", sm: "50vh", md: "50vh", lg: "45vh", xl: "30vh" }}

        // backgroundImage={`radial-gradient(circle, #fdfcfb 0%, #F7F9E5 60%),url(${bg})`}
        // backgroundSize="cover" 
        // backgroundRepeat="no-repeat"
        // backgroundPosition="50% 30%"

        sx={{
          backgroundImage: `
          radial-gradient(
            circle, 
            rgba(253, 252, 251, 0.3) 20%, 
            rgba(247, 249, 229, 0.6) 100%
          ),
          url(${bg}),
      radial-gradient(
        circle, 
        rgba(253, 252, 251, 0.5) 0%, 
        rgba(247, 249, 229, 0.8) 100%
      )`,
          backgroundSize: {
            base: "cover",
            md: "auto",
            lg: "auto"
          },
          backgroundRepeat: "no-repeat",
          backgroundPosition: {
            base: "50% 30%",
            md: "50% 35%",
            lg: "50% 35%"
          }
        }}
      >

        {/* <Image src={logo} alt="GlycoShape Logo" height="300px" marginBottom="0.2em" paddingLeft={"1.5rem"} paddingBottom={"0.5rem"} 
      style={{
        borderRadius: '50px', // This will give soft corners
        backgroundColor: 'rgba(40, 54, 63, .1)', // This will give a translucent white background
        }}
    /> */}

        <Heading lineHeight={'tall'} bgGradient='linear(to-l, #FDFDA1, #E2FCC5 )' bgClip='text' fontSize={{ base: "5xl", sm: "6xl", md: "10xl", lg: "10xl", xl: "12xl" }} fontWeight='bold' marginBottom="0em">

          <Highlight query='GlycoShape' styles={{ alignSelf: 'center', px: '3', py: '1', rounded: 'full', bg: 'rgba(40, 54, 63, .45)', color: '#F7FFE6' }}>
            GlycoShape
          </Highlight>

        </Heading>

        <Heading lineHeight={'tall'} bgGradient='linear(to-l, #FDFDA1, #E2FCC5 )' bgClip='text' fontSize={{ base: "3xl", sm: "4xl", md: "4xl", lg: "4xl", xl: "4xl" }} fontWeight='bold' marginBottom="0.7em">

          <Highlight query='Glycan Structure Database' styles={{ alignSelf: 'center', px: '3', py: '1', rounded: 'full', bg: 'rgba(40, 54, 63, .45)', color: '#F7FFE6' }}>
            Glycan Structure Database

          </Highlight>
        </Heading>


        <Searchbar />

      </Flex>
      <Flex
        direction="column"
        align="center"
        justify="center"
        flex="1"
        backgroundColor="#F7F9E5"
        padding="20px"
      >

        <Text
          align={"center"}
          bgGradient='linear(to-l, #44666C, #A7C4A3)'
          bgClip='text'
          fontSize={{ base: "xl", sm: "xl", md: "2xl", lg: "2xl", xl: "2xl" }}
          fontWeight='bold'
          fontFamily={'texts'}
          width={{ base: "100%", sm: "100%", md: "100%", lg: "100%", xl: "100%" }}

        >
          

          {/* GlycoShape DB provides open access to over 300 glycan structure and A Glycoprotein Builder <Link color={'#B07095'} href="/reglyco" >(Re-Glyco)</Link> to accelerate scientific research.  */}
          GlycoShape is an OA database of glycans 3D structural data and information that can be downloaded or used with <Link as={RouterLink} color={'#B07095'} to="/reglyco" >Re-Glyco</Link> to rebuild glycoproteins from <Link href="https://www.rcsb.org/" >the RCSB PDB</Link> or <Link href="https://alphafold.ebi.ac.uk/" >EMBL-EBI AlphaFold</Link> repositories
          {/* </Highlight> */}
        </Text>
      </Flex>
      <SimpleGrid alignSelf="center" justifyItems="center" columns={{ base: 1, sm:1, md:1, lg: 2, xl:2 }} spacing={10} padding= {{ base: '0rem', sm:'2rem', md:'2rem', lg: 2, xl:2 }} paddingTop={'2rem'} paddingBottom={'2rem'} marginTop={'2rem'} >
        <Box ><Text
          align={"center"}
          bgGradient='linear(to-l, #44666C, #4E6E6D)'
          bgClip='text'
          fontSize={{ base: "3xl", sm: "3xl", md: "3xl", lg: "4xl", xl: "4xl" }}
          fontWeight='bold'

        >
          What are Glycans?
        </Text>
          <Container textAlign="justify" padding={'0.5rem'} fontFamily={'texts'} fontSize={{ base: "1xl", sm: "1xl", md: "2xl", lg: "lg", xl: "lg" }}>
            Complex carbohydrates (or glycans) are the most abundant biopolymers in Nature, covering both structural and functional roles, e.g. as key scaffolding constituents of plant cell walls, vital energy storage and nutrients of all living cells and organisms, and essential elements to the biology of virtually all domains of life. The term glycans is more often used to indicate biologically functional carbohydrates, where chemical derivatization of proteins, lipids and nucleic acids with sugars expands and changes on the fly their biological structure, functions and message-delivering potentials in health and disease.
          </Container></Box>
        <Box ><VStack><Image maxHeight={"25rem"} width={'auto'} padding={'2rem'} src={cell} alt="Description Image" />
          <Text color='#B195A2' alignSelf={"left"} fontSize={'xs'}>
            <Link href="https://www.ncbi.nlm.nih.gov/books/NBK579927/figure/CSHLP5087CH01F4/?report=objectonly">Source: Essentials of Glycobiology [Internet]. 4th edition.</Link>
          </Text></VStack>
        </Box>
        <Box >
          <VStack><Image maxHeight={"25rem"} width={'auto'} padding={'0rem'} src={fuzzy} alt="Importance Image" />
            {/* <Text color='#B195A2' alignSelf={"left"} fontSize={'xs'}>
            <Link href="https://www.ncbi.nlm.nih.gov/books/NBK579927/figure/CSHLP5087CH01F3/?report=objectonly">Source: Essentials of Glycobiology [Internet]. 4th edition.</Link>
            </Text> */}
          </VStack>
        </Box>
        <Box ><Text
          align={"center"}
          bgGradient='linear(to-l, #44666C, #4E6E6D)'
          bgClip='text'
          fontSize={{ base: "3xl", sm: "3xl", md: "3xl", lg: "4xl", xl: "4xl" }}
          fontWeight='bold'
        >
          Glycans 3D Structure and Flexibility
        </Text>
          <Container textAlign="justify" padding={'0.5rem'} fontFamily={'texts'} fontSize={{ base: "1xl", sm: "1xl", md: "2xl", lg: "lg", xl: "lg" }}>
            Complex carbohydrates are made up of monosaccharide units chained through glycosidic linkages in linear or branched patterns. The chemical nature of these linkages can confer a high degree of flexibility to the glycan polymer, which makes them largely invisible to experimental structural biology techniques, such as X-ray crystallography and cryo-EM. 3D structural information can be partially obtained from experiment only when the glycan’s degrees of freedom are highly restrained, for example by binding to receptors or to synthetic supports. Structural (3D) information on glycans can be obtained through computer simulation techniques, which we have used to build the GlycoShape database.
          </Container></Box>

        <Box ><Text
          align={"center"}
          bgGradient='linear(to-l, #44666C, #4E6E6D)'
          bgClip='text'
          fontSize={{ base: "3xl", sm: "3xl", md: "3xl", lg: "4xl", xl: "4xl" }}
          fontWeight='bold'
        >
          Why Do We Need Glycans 3D Structures?
        </Text>
          <Container textAlign="justify" padding={'0.5rem'} fontFamily={'texts'} fontSize={{ base: "1xl", sm: "1xl", md: "2xl", lg: "lg", xl: "lg" }}>
            Access to the 3D structure is the first step towards understanding how glycan recognition facilitates the transfer of biological information, triggers immune response cascades, furthers and diversifies glycan functionalization, and also triggers toxins and pathogens infection. We can imagine glycans mediating the interactions with different biological receptors like a hand-shake, where different hands recognise one another initiating specific conversations.               </Container>
        </Box>
        <Box ><VStack><Image maxHeight={"25rem"} width={'auto'} padding={'0rem'} src={hand} alt="Importance Image" />
          <Text color='#B195A2' alignSelf={"left"} fontSize={'xs'}>
            <Link href="https://openai.com/dall-e-3">Source: Dalle-3 </Link>
          </Text>
        </VStack></Box>

        <VStack><Image maxHeight={"25rem"} width={'auto'} padding={'0rem'} src={fold} alt="Description Image" />
          <Text color='#B195A2' alignSelf={"left"} fontSize={'xs'}>
            <Link href="https://openai.com/dall-e-3">Source: Dalle-3 </Link>
          </Text></VStack>
        <Box ><Text
          align={"center"}
          bgGradient='linear(to-l, #44666C, #4E6E6D)'
          bgClip='text'
          fontSize={{ base: "3xl", sm: "3xl", md: "3xl", lg: "4xl", xl: "4xl" }}
          fontWeight='bold'
        >
          Glycans and Protein Folding
        </Text>
          <Container textAlign="justify" padding={'0.5rem'} fontFamily={'texts'} fontSize={{ base: "1xl", sm: "1xl", md: "2xl", lg: "lg", xl: "lg" }}>
            Protein glycosylation is an integral part not only of protein function, but also of protein structure. Re-Glyco, the GlycoShape glycoprotein builder tool, allows you to restore the natural glycosylation in proteins from the RCSB PDB and EMBL-EBI AlphaFold Structural Database. Among different glycosylation types, Asn-linked glycans (also known as N-glycans) are highly common. N-glycans are covalently bonded to nascent proteins co-translationally and further elaborated and functionalized post-translationally along the secretory pathway through the endoplasmic reticulum (ER) and Golgi. This process is instrumental to protein folding, leveraging on the amphipathic nature of the glycans and on their flexible and unique structural features. It is estimated that over 60% of secreted proteins are N-glycosylated. Ser and Thr-linked glycans (also known as O-glycans) are added to proteins in the Golgi and are also key to the mechanical and structural properties of proteins, such as mucins for example. Furthermore, C-mannosylation is another example of structurally essential glycosylation, where a mannose (Man) is linked to the Trp indole sidechain, creating a building block crucial to the folding and structural stability of protein domains, such as thrombospondin repeats (TSRs).                     </Container>
        </Box>

      </SimpleGrid>


    </Flex>

  );
}

export default ContentSection;
