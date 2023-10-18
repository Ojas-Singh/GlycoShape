import React from 'react';
import { Box, Flex, Text, Link, Image, VStack, HStack, Icon, Divider} from "@chakra-ui/react";
import logo from './assets/logo_white.png';
import logo_sfi from './assets/logo_sfi.jpg';
import logo_oracle from './assets/logo_oracle.png';
import { SocialIcon } from 'react-social-icons'
import 'react-social-icons/vimeo'
import ReactDOM from 'react-dom'
// Placeholder for social media icons. Replace with actual icons.
const TwitterIcon = <SocialIcon url="https://twitter.com" />
// const TwitterIcon = () => <Icon viewBox="0 0 24 24">/* SVG content for Twitter */</Icon>;
const LinkedInIcon = () => <Icon viewBox="0 0 24 24">/* SVG content for LinkedIn */</Icon>;

const Footer: React.FC = () => {
  return (
    <Box as="footer" padding="1.5rem" paddingBottom={"0.5rem"} backgroundColor="#28363F">
      <Flex direction="row" justify="space-between" wrap="wrap" marginBottom="0em">
        <Box>
          <Image src={logo} alt="GlycoShape Logo" height="200px" marginBottom="0.2em" paddingLeft={"1.5rem"} paddingBottom={"0.5rem"}/>
          <Text alignSelf="center" color="lightblue">© GlycoShape</Text>
          <Link color="white" >Legal Disclaimer | Privacy Notice</Link>
          
        </Box>
        <VStack align="start">
          <Text color="white" fontWeight="bold">Core Data</Text>
          <Divider />
          <Link color="white" href="/search?query=N-Glycans">N linked Glycans</Link>
          <Link color="white" href="/search?query=O-Glycans">O linked Glycans</Link>
          <Link color="white" href="/search?query=GAGs">Glycosaminoglycans </Link>
        </VStack>
        <VStack align="start">
          <Text color="white" fontWeight="bold">Supporting Data</Text>
          <Divider />
          <Link color="white" href="#">Literature citations</Link>
          <Link color="white" href="#">Keywords</Link>
          <Link color="white" href="#">Cross-referenced databases</Link>
        </VStack>
        <VStack align="start">
          <Text color="white" fontWeight="bold">Tools</Text>
          <Divider />
          <Link color="white" href="/reglyco">Re-Glyco</Link>
          {/* <Link color="white" href="#">Pridiction</Link> */}
          <Link color="white" href="/viewer/index.html">Mol * Viewer</Link>
          {/* <Link color="white" href="#">Sequence search</Link> */}
          
        </VStack>
        {/* <VStack align="start">
          <Text color="white"  fontWeight="bold">Information</Text>
          <Divider />
          <Link color="white" href="#">Cite GlycoShape</Link>
          <Link color="white" href="#">About & Help</Link>
          <Link color="white" href="#">Glycam manual</Link>
          <Link color="white" href="#">Statistics</Link>
        </VStack> */}
        <Box >
            {/* ReactDOM.render(TwitterIcon, document.body) */}
            {/* ReactDOM.createRoot(document.body).render(TwitterIcon) */}
          <Text color="white" fontWeight="bold">Social</Text>
          <HStack spacing="24px" padding={"1rem"} paddingBottom={"4rem"}>
            {/* <Link href="#"><FacebookIcon /></Link>
            <Link href="#"><TwitterIcon /></Link> */}
            <SocialIcon network="mastodon" url="https://mstdn.science/@Glycoshape" />
              {/* <SocialIcon network="twitter" url="https://twitter.com/ElisaTelisa" /> */}
              
              <SocialIcon network="github" url="https://github.com/Ojas-Singh/GlycoShape" />
              
        {/* <Link color="white" href="#"><LinkedInIcon /><SocialIcon url="www.vimeo.com" /></Link> */}
            {/* <Link color="white" href="#">Contact Us</Link> */}
          </HStack>
          <Text fontWeight="Medium" color={'white'}>Main Funding by:
          <HStack direction='row'>
            <Link href='https://www.sfi.ie/'>
          <Image src={logo_sfi} alt="SFI Logo" height="60px" marginBottom="0em" /></Link><Link href='https://www.oracle.com/ie/research/'><Image src={logo_oracle} alt="Oracle Logo" height="60px" marginBottom="0em" /></Link> 
          
          </HStack> 
          </Text>
        </Box>
      </Flex>
      {/* <Flex justify="space-between">
        <Text color="white" >Release and Statistics</Text>

        

      </Flex> */}
    </Box>
  );
}

export default Footer;
