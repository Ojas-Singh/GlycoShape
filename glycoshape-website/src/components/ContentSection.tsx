import React from 'react';
import {SimpleGrid , Wrap, Highlight, Text, Flex, Box, Image, Heading, Container, Link,  WrapItem} from "@chakra-ui/react";
import Searchbar from './SearchBar';
import bg from './assets/gly.png';
import cell from './assets/cell_surface.jpg';
import dem1 from './assets/dem1.jpg';
import hand from './assets/hand.png';


const ContentSection: React.FC = () => {
  return (
      
    <Flex direction="column" width="100%">
      
      <Flex 
        direction="column" 
        align="center" 
        justify="center" 
        flex="1" 
        padding="5em"
        minHeight={{ base: "60vh" }}
        
        // backgroundImage={`radial-gradient(circle, #fdfcfb 0%, #F7F9E5 60%),url(${bg})`}
        

        // backgroundSize="cover" 
        // backgroundRepeat="no-repeat"
        // backgroundPosition="50% 30%"

        sx={{
          backgroundImage: `
      radial-gradient(
        circle, 
        rgba(253, 252, 251, 0.2) 0%, 
        rgba(247, 249, 229, 0.6) 100%
      ), 
      url(${bg})`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "50% 30%"
        }}
      >        
        <Heading lineHeight={'tall'} bgGradient='linear(to-l, #FDFDA1, #E2FCC5 )' bgClip='text' fontSize={{base: "3xl",sm: "4xl", md: "5xl", lg: "5xl",xl: "6xl"}} fontWeight='bold' marginBottom="0.2em">
        <Highlight query='Glycan Structure Database' styles={{alignSelf: 'center', px: '3', py: '1', rounded: 'full', bg: 'rgba(40, 54, 63, .4)', color:'#F7FFE6'}}>
         Glycan Structure Database 
        </Highlight>

        {/* <Highlight query='GlycoShape' styles={{alignSelf: 'center', px: '3', py: '1', rounded: 'full', bg: 'rgba(40, 54, 63, .4)', color:'#F7FFE6'}}>
         GlycoShape
        </Highlight> */}
        </Heading> 
        
        <Text 
          bgGradient='linear(to-l, #F7FFE6, #F7FFE6)' 
          bgClip='text'
          fontSize='2xl'
          fontWeight='bold'
          marginBottom="1em"

        ><Link fontWeight="bold" color={"#F7FFE6"} href="/elab" marginRight="20px">
          <Highlight query='Developed by elab' styles={{alignSelf: 'center', px: '3', py: '1', rounded: 'full', bg: 'rgba(40, 54, 63, .4)', color:'#F7FFE6'}}>

          Developed by elab
          </Highlight></Link>
        </Text>
        
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
                fontSize={{base: "2xl",sm: "3xl", md: "3xl", lg: "4xl",xl: "4xl"}}
                fontWeight='bold'
                fontFamily={'texts'}
              >
                {/* <Highlight
    query='(Re-Glyco)'
    styles={{ px: '2', py: '1', rounded: 'full', color: '#AD769B' }}
  > */}
                      
              {/* GlycoShape DB provides open access to over 300 glycan structure and A Glycoprotein Builder <Link color={'#B07095'} href="/reglyco" >(Re-Glyco)</Link> to accelerate scientific research.  */}
              GlycoShape is an OA database of glycans 3D structural data and information that can be downloaded or used with <Link color={'#B07095'} href="/reglyco" >Re-Glyco</Link> to rebuild glycoproteins from <Link  href="https://www.rcsb.org/" >the RCSB PDB</Link> or <Link  href="https://alphafold.ebi.ac.uk/" >EMBL-EBI AlphaFold</Link> repositories 
              {/* </Highlight> */}
              </Text>
              </Flex>
              <SimpleGrid  alignSelf="center" justifyItems="center" columns={[1,2]} spacing={10} paddingTop={'2rem'} paddingBottom={'2rem'}>
            <Box ><Text
                align={"center"}
                bgGradient='linear(to-l, #44666C, #4E6E6D)'
                bgClip='text'
                fontSize={{base: "3xl",sm: "3xl", md: "3xl", lg: "4xl",xl: "4xl"}}
                fontWeight='bold'
              > 
                What are Glycans?
              </Text>
              <Container textAlign={'left'} padding={'0.5rem'} fontFamily={'texts'} fontSize={{base: "1xl",sm: "1xl", md: "2xl", lg: "lg",xl: "lg"}}>
              Complex carbohydrates (or glycans) are the most abundant biopolymers in Nature, covering both structural and functional roles, e.g. as key scaffolding constituents of plant cell walls, vital energy storage and nutrients of all living cells and organisms, and essential elements to the biology of virtually all domains of life. The term glycans is more often used to indicate biologically functional carbohydrates, where chemical derivatization of proteins, lipids and nucleic acids with sugars expands and changes on the fly their biological structure, functions and message-delivering potentials in health and disease. 
              </Container></Box>
            <Box ><Image maxHeight={"25rem"} width={'auto'} padding={'2rem'} src={cell} alt="Description Image" />
                  </Box>
                  <Box ><Image maxHeight={"25rem"} width={'auto'} padding={'2rem'} src={dem1} alt="Importance Image" />
                  </Box>
  <Box ><Text
                align={"center"}
                bgGradient='linear(to-l, #44666C, #4E6E6D)'
                bgClip='text'
                fontSize={{base: "3xl",sm: "3xl", md: "3xl", lg: "4xl",xl: "4xl"}}
                fontWeight='bold'
              > 
               Glycans 3D Structure and Flexibility
              </Text>
              <Container textAlign={'left'} padding={'0.5rem'} fontFamily={'texts'} fontSize={{base: "1xl",sm: "1xl", md: "2xl", lg: "lg",xl: "lg"}}>
              Complex carbohydrates are made up of monosaccharide units chained through glycosidic linkages in linear or branched patterns. The chemical nature of these linkages can confer a high degree of flexibility to the glycan polymer, which makes them largely invisible to experimental structural biology techniques, such as X-ray crystallography and cryo-EM. 3D structural information can be partially obtained from experiment only when the glycan’s degrees of freedom are highly restrained, for example by binding to receptors or to synthetic supports. Structural (3D) information on glycans can be obtained through computer simulation techniques, which we have used to build the GlycoShape database. 
              </Container></Box>
              
  <Box ><Text
                align={"center"}
                bgGradient='linear(to-l, #44666C, #4E6E6D)'
                bgClip='text'
                fontSize={{base: "3xl",sm: "3xl", md: "3xl", lg: "4xl",xl: "4xl"}}
                fontWeight='bold'
              > 
               Why Do We Need Glycans 3D Structures? 
              </Text>
              <Container textAlign={'left'} padding={'0.5rem'} fontFamily={'texts'} fontSize={{base: "1xl",sm: "1xl", md: "2xl", lg: "lg",xl: "lg"}}>
              Access to the 3D structure is the first step towards understanding how glycan recognition facilitates the transfer of biological information, triggers immune response cascades, furthers and diversifies glycan functionalization, and also triggers toxins and pathogens infection. We can imagine glycans mediating the interactions with different biological receptors like a hand-shake, where different hands recognise one another initiating specific conversations.               </Container>
            </Box>
            <Box ><Image maxHeight={"25rem"} width={'auto'} padding={'2rem'} src={hand} alt="Importance Image" /></Box>
  <Box ><Text
                align={"center"}
                bgGradient='linear(to-l, #44666C, #4E6E6D)'
                bgClip='text'
                fontSize={{base: "3xl",sm: "3xl", md: "3xl", lg: "4xl",xl: "4xl"}}
                fontWeight='bold'
              > 
               Glycans and Protein Folding
              </Text>
              <Container textAlign={'left'} padding={'0.5rem'} fontFamily={'texts'} fontSize={{base: "1xl",sm: "1xl", md: "2xl", lg: "lg",xl: "lg"}}>
              Protein glycosylation is an integral part not only of protein function, but also of protein structure. Re-Glyco, the GlycoShape glycoprotein builder tool, allows you to restore the natural glycosylation in proteins from the RCSB PDB and EMBL-EBI AlphaFold Structural Database. Among different glycosylation types, Asn-linked glycans (also known as N-glycans) are highly common. N-glycans are covalently bonded to nascent proteins co-translationally and further elaborated and functionalized post-translationally along the secretory pathway through the endoplasmic reticulum (ER) and Golgi. This process is instrumental to protein folding, leveraging on the amphipathic nature of the glycans and on their flexible and unique structural features. It is estimated that over 60% of secreted proteins are N-glycosylated. Ser and Thr-linked glycans (also known as O-glycans) are added to proteins in the Golgi and are also key to the mechanical and structural properties of proteins, such as mucins for example. Furthermore, C-mannosylation is another example of structurally essential glycosylation, where a mannose (Man) is linked to the Trp indole sidechain, creating a building block crucial to the folding and structural stability of protein domains, such as thrombospondin repeats (TSRs).                     </Container>
            </Box>
</SimpleGrid>
             

    </Flex>

  );
}

export default ContentSection;
