import React from 'react';
import { Box, Flex, Text, Link, Image, VStack, HStack, Icon, Divider} from "@chakra-ui/react";
import logo from './assets/logo_white.png';
import logo_sfi from './assets/logo_sfi.jpg';
import logo_oracle from './assets/logo_oracle.png';

// Placeholder for social media icons. Replace with actual icons.
const FacebookIcon = () => <Icon viewBox="0 0 24 24">/* SVG content for Facebook */</Icon>;
const TwitterIcon = () => <Icon viewBox="0 0 24 24">/* SVG content for Twitter */</Icon>;
const LinkedInIcon = () => <Icon viewBox="0 0 24 24">/* SVG content for LinkedIn */</Icon>;

const Footer: React.FC = () => {
  return (
    <Box as="footer" padding="1.5rem" backgroundColor="#4E6E6D">
      <Flex direction="row" justify="space-between" wrap="wrap" marginBottom="0em">
        <Box>
          <Image src={logo} alt="GlycoShape Logo" height="150px" marginBottom="0.2em" paddingLeft={"1.5rem"}/>
          <Text color="lightblue">© GlycoShape</Text>
          <Link>Legal Disclaimer</Link>
          <Link>Privacy Notice</Link>
        </Box>
        <VStack align="start">
          <Text fontWeight="bold">Core Data</Text>
          <Divider />
          <Link href="#">N linked Glycans</Link>
          <Link href="#">O linked Glycans</Link>
          <Link href="#">Glycosaminoglycans </Link>
        </VStack>
        <VStack align="start">
          <Text fontWeight="bold">Supporting Data</Text>
          <Divider />
          <Link href="#">Literature citations</Link>
          <Link href="#">Keywords</Link>
          <Link href="#">Subcellular locations</Link>
          <Link href="#">Cross-referenced databases</Link>
          <Link href="#">Diseases</Link>
        </VStack>
        <VStack align="start">
          <Text fontWeight="bold">Tools</Text>
          <Divider />
          <Link href="#">Re-Glyco</Link>
          <Link href="#">Pridiction</Link>
          <Link href="#">Glyco Blocks</Link>
          <Link href="#">Sequence search</Link>
          <Link href="#">Tool results</Link>
        </VStack>
        <VStack align="start">
          <Text fontWeight="bold">Information</Text>
          <Divider />
          <Link href="#">Cite GlycoShape</Link>
          <Link href="#">About & Help</Link>
          <Link href="#">Glycam manual</Link>
          <Link href="#">Technical corner</Link>
          <Link href="#">Statistics</Link>
        </VStack>
        <Box >
          <Text fontWeight="bold">Social</Text>
          <HStack spacing="24px" paddingBottom={"4rem"}>
            {/* <Link href="#"><FacebookIcon /></Link>
            <Link href="#"><TwitterIcon /></Link> */}
            <Link href="#"><LinkedInIcon /></Link>
            <Link href="#">Contact Us</Link>
          </HStack>
          <Text fontWeight="Medium" color={'white'}>Main Funding by:
          <HStack direction='row'>
          <Image src={logo_sfi} alt="SFI Logo" height="60px" marginBottom="1em" /><Image src={logo_oracle} alt="Oracle Logo" height="60px" marginBottom="1em" />
          </HStack> 
          </Text>
        </Box>
      </Flex>
      <Flex justify="space-between">
        <Text>Release and Statistics</Text>

        

      </Flex>
    </Box>
  );
}

export default Footer;
