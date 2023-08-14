import React from 'react';
import { Box, Flex, Text, Link, Image, VStack, HStack, Icon } from "@chakra-ui/react";
import logo from './assets/logo.png';

// Placeholder for social media icons. Replace with actual icons.
const FacebookIcon = () => <Icon viewBox="0 0 24 24">/* SVG content for Facebook */</Icon>;
const TwitterIcon = () => <Icon viewBox="0 0 24 24">/* SVG content for Twitter */</Icon>;
const LinkedInIcon = () => <Icon viewBox="0 0 24 24">/* SVG content for LinkedIn */</Icon>;

const Footer: React.FC = () => {
  return (
    <Box as="footer" padding="1.5rem" backgroundColor="#6F9C5A">
      <Flex direction="row" justify="space-between" marginBottom="2em">
        <Box>
          <Image src={logo} alt="GlycoShape Logo" height="60px" marginBottom="1em" />
          <Text color="lightblue">© GlycoShape</Text>
          <Link>Legal Disclaimer</Link>
          <Link>Privacy Notice</Link>
        </Box>
        <VStack align="start">
          <Text fontWeight="bold">Core Data</Text>
          <Link href="#">Proteins (UniProtKB)</Link>
          <Link href="#">Species (Proteomes)</Link>
          <Link href="#">Protein clusters (UniRef)</Link>
          <Link href="#">Sequence archive (UniParc)</Link>
        </VStack>
        <VStack align="start">
          <Text fontWeight="bold">Supporting Data</Text>
          <Link href="#">Literature citations</Link>
          <Link href="#">Taxonomy</Link>
          <Link href="#">Keywords</Link>
          <Link href="#">Subcellular locations</Link>
          <Link href="#">Cross-referenced databases</Link>
          <Link href="#">Diseases</Link>
        </VStack>
        <VStack align="start">
          <Text fontWeight="bold">Tools</Text>
          <Link href="#">BLAST</Link>
          <Link href="#">Align</Link>
          <Link href="#">Retrieve/ID mapping</Link>
          <Link href="#">Peptide search</Link>
          <Link href="#">Tool results</Link>
        </VStack>
        <VStack align="start">
          <Text fontWeight="bold">Information</Text>
          <Link href="#">Cite UniProt</Link>
          <Link href="#">About & Help</Link>
          <Link href="#">UniProtKB manual</Link>
          <Link href="#">Technical corner</Link>
          <Link href="#">Expert biocuration</Link>
          <Link href="#">Statistics</Link>
        </VStack>
        <Box>
          <Text fontWeight="bold">Social</Text>
          <HStack spacing="24px">
            <Link href="#"><FacebookIcon /></Link>
            <Link href="#"><TwitterIcon /></Link>
            <Link href="#"><LinkedInIcon /></Link>
            <Link href="#">Contact Us</Link>
          </HStack>
        </Box>
      </Flex>
      <Flex justify="space-between">
        <Text>Release and Statistics</Text>
        <Text>Main Funding by: SFI, Oracle</Text>
      </Flex>
    </Box>
  );
}

export default Footer;
