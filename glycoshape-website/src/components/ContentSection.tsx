import React from 'react';
import { Wrap, Highlight, Text, Flex, Box, Image, Heading, Container, Link,  WrapItem} from "@chakra-ui/react";
import Searchbar from './SearchBar';
import bg from './assets/gly.png';
import cell from './assets/cell_surface.jpg';
import dem1 from './assets/dem1.jpg';


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
                      
              GlycoShape DB provides open access to over 300 glycan structure and A Glycoprotein Builder <Link color={'#B07095'} href="/reglyco" >(Re-Glyco)</Link> to accelerate scientific research. 
              
              {/* </Highlight> */}
              </Text>
              </Flex>
              <Flex direction="column" align={'center'} padding={'2rem'}>
          
            <Wrap align='center'>
              <WrapItem >
            <Box flex="1">
              <Text
                align={"center"}
                bgGradient='linear(to-l, #44666C, #4E6E6D)'
                bgClip='text'
                fontSize={{base: "3xl",sm: "3xl", md: "3xl", lg: "5xl",xl: "5xl"}}
                fontWeight='bold'
              > 
                What are Glycans?
              </Text>
              <Container textAlign={'left'} padding={'2rem'} fontFamily={'texts'} fontSize={{base: "1xl",sm: "1xl", md: "2xl", lg: "lg",xl: "lg"}}>
              Glycans, often referred to as complex carbohydrates or polysaccharides, play a crucial role in various biological processes. They are essentially chains or branches of sugar molecules that can be found on the surface of all cells in every living organism. Functioning as the "face" of cells, glycans facilitate communication between cells and their environment, influencing a vast range of processes from cell signaling to immunity. Their intricate structures and patterns determine the roles they play, making them essential for understanding health and disease states.

              </Container>
              <Text fontSize={'2xl'}>
              </Text>
            </Box>
            </WrapItem>
            <WrapItem>
            <Box flex="1">
              <Image maxHeight={"25rem"} width={'auto'} padding={'2rem'} src={cell} alt="Description Image" />
            </Box>
            </WrapItem>
            </Wrap>
          
          
            <Wrap align='center'>
            <WrapItem>
            <Box flex="1" >
              <Image padding={'2rem'} maxHeight={"45rem"} src={dem1} alt="Importance Image" />
            </Box>
            </WrapItem>
              <WrapItem>
            <Box flex="1">
              <Text
                align={"center"}
                bgGradient='linear(to-l, #44666C, #4E6E6D)'
                bgClip='text'
                fontSize={{base: "3xl",sm: "3xl", md: "3xl", lg: "5xl",xl: "5xl"}}
                fontWeight='bold'
              > 
                Why it's important?
              </Text>
              <Container textAlign={'left'} padding={'2rem'} fontFamily={'texts'} fontSize={{base: "1xl",sm: "1xl", md: "2xl", lg: "lg",xl: "lg"}}>
              Glycans, often referred to as complex carbohydrates or polysaccharides, play a crucial role in various biological processes. They are essentially chains or branches of sugar molecules that can be found on the surface of all cells in every living organism. Functioning as the "face" of cells, glycans facilitate communication between cells and their environment, influencing a vast range of processes from cell signaling to immunity. Their intricate structures and patterns determine the roles they play, making them essential for understanding health and disease states.

              </Container>
            
            </Box>
            </WrapItem>
            
            </Wrap>
            
          
</Flex>

    </Flex>

  );
}

export default ContentSection;
