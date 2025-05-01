// Cite.tsx

import React from 'react';
import { Box, Flex, Text,Stack, Divider, Link } from '@chakra-ui/react';


const Cite = () => {
  return (
    <Flex width={{ base: "100%", sm: "100%", md: "100%", lg: "100%", xl: "100%" }}
    margin="auto">
    <Box p={10} borderWidth="0px" borderRadius="lg" overflow="hidden"
    >
        <Stack direction='row' h='80px' p={4}>
  <Divider  size="lg" border= "5px solid" borderColor='#4E6E6D' colorScheme="#44666C" orientation='vertical' />
  <Text
                align={"start"}
                bgGradient='linear(to-l, #44666C, #4E6E6D)'
                bgClip='text'
                fontSize={{base: "3xl",sm: "3xl", md: "3xl", lg: "4xl",xl: "4xl"}}
                fontWeight='bold'
                paddingBottom={5}
                marginLeft={2}
              > 
                
        Licence and Attribution
      </Text>
</Stack>
       
      <Text pl={4} mt={5} mb={4} fontFamily={'texts'} fontSize={{base: "1xl",sm: "1xl", md: "2xl", lg: "lg",xl: "lg"}}>
        All of the data provided is freely available for academic use under
        Creative Commons Attribution 4.0 <Link color={'#B07095'} href="https://creativecommons.org/licenses/by-nc-nd/4.0/">(CC BY-NC-ND 4.0 Deed)</Link> licence terms. Please contact us at <Link color={'#33588B'} href="mailto:elisa.fadda@soton.ac.uk">elisa.fadda@soton.ac.uk</Link> for Commercial licence. If you use this resource, please cite the following papers:
      </Text>
      
      
      
      <Text  pl={4} mb={5} color={'#B07095'} fontFamily={'texts'} fontSize={{base: "2xl",sm: "2xl", md: "2xl", lg: "2xl",xl: "2xl"}}>
      <Link  href="https://doi.org/10.1038/s41592-024-02464-7"  > Ives, C.M., Singh, O. et al. Restoring protein glycosylation with GlycoShape. Nat Methods (2024).</Link>
        </Text>
        
         
        
      

      {/* <Text mb={4} fontFamily={'texts'} fontSize={{base: "1xl",sm: "1xl", md: "2xl", lg: "lg",xl: "lg"}}>
      
      </Text> */}
      <Text  pl={4} fontFamily={'texts'} fontSize={{base: "1xl",sm: "1xl", md: "2xl", lg: "lg",xl: "lg"}}>
      The structures provided in this resource are generated with in-silico standards and 
        should be interpreted carefully.
      </Text>
    </Box>
    </Flex>
  );
};

export default Cite;
