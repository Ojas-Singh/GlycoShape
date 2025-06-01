import React, { useState, useEffect, useRef } from 'react';
import {
  Heading, Link,
  IconButton , useStyleConfig , Flex, Image, Stack, Button, Box, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Text,
  VStack,
  HStack,
  Spacer,
  UnorderedList,
  ListItem,
  Container, // Added Container
  Spinner,   // Added Spinner
  Alert,     // Added Alert
  AlertIcon  // Added AlertIcon
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { ChevronRightIcon, ChevronLeftIcon } from '@chakra-ui/icons';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown'; // Added ReactMarkdown
import remarkGfm from 'remark-gfm';         // Added remarkGfm
import remarkMath from 'remark-math';       // Added remarkMath for LaTeX processing
import rehypeRaw from 'rehype-raw';           // Added rehypeRaw
import rehypeKatex from 'rehype-katex';     // Added for LaTeX
import 'katex/dist/katex.min.css';          // KaTeX CSS for LaTeX

// Configuration for fetching tutorials from the GlycoShape-Resources repository
const TUTORIALS_DATA_REPO_CONFIG = {
  owner: 'Ojas-Singh', 
  repo: 'GlycoShape-Resources', 
  branch: 'main',
  rawBaseUrl: `https://raw.githubusercontent.com/Ojas-Singh/GlycoShape-Resources/main/`, 
  apiBaseUrl: `https://api.github.com/repos/Ojas-Singh/GlycoShape-Resources/contents/` 
};

const TUTORIAL_CONTENT_CONFIG = {
  owner: TUTORIALS_DATA_REPO_CONFIG.owner,
  repo: TUTORIALS_DATA_REPO_CONFIG.repo,
  path: 'tutorials', // Path to the tutorials directory in the GlycoShape-Resources repo
  branch: TUTORIALS_DATA_REPO_CONFIG.branch
};

interface Slide {
  gif: string;
  caption: string;
}

interface TutorialPost {
  title: string;
  content: string;
  slug: string;
  order?: number; // Optional: for sorting tutorials
  // Add other metadata fields if needed, e.g., date
}

const Tutorials: React.FC = () => { // Renamed component from FAQ to Tutorials
  const tutorialRef = useRef<HTMLDivElement>(null);
  const location = useLocation(); 

  // State for GIF slides
  const [currentSlide, setCurrentSlide] = useState(0);
  const [animation, setAnimation] = useState("");

  // State for fetched Markdown tutorials
  const [tutorialPosts, setTutorialPosts] = useState<TutorialPost[]>([]);
  const [loadingTutorials, setLoadingTutorials] = useState(true);
  const [tutorialsError, setTutorialsError] = useState<string | null>(null);

  // Define animations for sliding in from left or right
  const slideInLeft = keyframes`
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  `;

  const slideInRight = keyframes`
    from { transform: translateX(-100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  `;

  // GitHub API functions (adapted from Elab.tsx)
  const fetchGitHubDirectoryContents = async (config: typeof TUTORIAL_CONTENT_CONFIG): Promise<string[]> => {
    const url = `${TUTORIALS_DATA_REPO_CONFIG.apiBaseUrl}${config.path}?ref=${config.branch}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      const data = await response.json();
      return data
        .filter((file: any) => file.name.endsWith('.md') && file.type === 'file')
        .map((file: any) => file.download_url);
    } catch (error) {
      console.error('Error fetching GitHub directory:', error);
      throw error;
    }
  };

  const fetchGitHubFile = async (downloadUrl: string): Promise<string> => {
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Error fetching GitHub file:', error);
      throw error;
    }
  };
  
  // Function to extract metadata (simple version, adapt if you use frontmatter)
  const extractTutorialMetadata = (content: string) => {
    const frontmatterMatch = content.match(/^---[\s\r\n]+([\s\S]*?)^---[\s\r\n]*/m);
    let title = '';
    let order: number | undefined = undefined;

    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      const titleMatch = frontmatter.match(/^title:\s*["']?(.+?)["']?\s*$/m);
      const orderMatch = frontmatter.match(/^order:\s*(\d+)\s*$/m);

      if (titleMatch) title = titleMatch[1].trim();
      if (orderMatch) order = parseInt(orderMatch[1], 10);
    }
    return { title, order };
  };

  // Fetch Markdown Tutorials
  const fetchTutorialPosts = async () => {
    setLoadingTutorials(true);
    setTutorialsError(null);
    try {
      const fileUrls = await fetchGitHubDirectoryContents(TUTORIAL_CONTENT_CONFIG);
      const tutorialPromises = fileUrls.map(async (downloadUrl) => {
        const rawContent = await fetchGitHubFile(downloadUrl);
        const { title, order } = extractTutorialMetadata(rawContent); // Extract metadata
        const contentWithoutFrontmatter = rawContent.replace(/^---[\s\r\n]+([\s\S]*?)^---[\s\r\n]*/m, '');
        const filename = downloadUrl.split('/').pop() || '';
        const slugFromFile = filename.replace(/\.md$/, '');

        return {
          title: title || slugFromFile.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          content: contentWithoutFrontmatter.trim(),
          slug: slugFromFile,
          order: order,
        };
      });
      let posts = await Promise.all(tutorialPromises);
      // Sort posts by order if available, then by title
      posts = posts.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        if (a.order !== undefined) return -1; // a comes first if it has order
        if (b.order !== undefined) return 1;  // b comes first if it has order
        return a.title.localeCompare(b.title); // fallback to title sort
      });
      setTutorialPosts(posts);
    } catch (error) {
      console.error('Error fetching tutorial posts:', error);
      setTutorialsError('Failed to load tutorial posts.');
    } finally {
      setLoadingTutorials(false);
    }
  };

  useEffect(() => {
    fetchTutorialPosts(); // Fetch markdown tutorials

    if (location.pathname === '/tutorial') {
      setTimeout(() => {
        tutorialRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, [location.pathname]);

  const slides: Slide[] = [
    { gif: '/img/1.gif', caption: 'The gif below shows you how to upload protein 6EAQ from the PDB on ReGlyco. To upload a structure from the AlphaFold Protein Structure Database you can follow the same procedure using the UniProt ID instead of the PDB ID. To upload your own, click on the “Upload your PDB” link.' },
    { gif: '/img/2.gif', caption: 'To predict potential N-glycosylation sites, use scan button under GlcNAc Scanning tab.' },
    { gif: '/img/3.gif', caption: 'After the GlcNAc scan, we can one shot glycosylate all the possible sites with glycan of choice.' },
    { gif: '/img/4.gif', caption: 'For site specific glycosylation use "Advanced (Site-by-Site) Glycosylation" tab.' },
    { gif: '/img/5.gif', caption: 'Press "Process Ensemble" to generate more conformation of the attached glycans, this also calculate SASA of protein with glycan effect.' },
    { gif: '/img/6.gif', caption: "If a clash warning appears for an ASN residue, easily resolve it by using the provided link in the processing summary to interchange the coordinates of ND2 and OD1 atoms. " },
  ];

  const nextSlide = () => {
    setAnimation(""); 
    setTimeout(() => {
        setAnimation(`0.5s ${slideInLeft} ease-out forwards`);
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 10);
  };

  const prevSlide = () => {
    setAnimation(""); 
    setTimeout(() => {
        setAnimation(`0.5s ${slideInRight} ease-out forwards`);
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    }, 10);
  };

  return (
    <Box>
      <Box ref={tutorialRef} p={0} paddingBottom={0}>
        <Text 
          bgGradient='linear(to-l, #44666C, #A7C4A3)'
          bgClip='text'
          fontSize={{base: "5xl",sm: "5xl", md: "5xl", lg: "5xl",xl: "5xl"}}
          fontWeight='extrabold'
          paddingLeft={"2rem"}
          mb={6} // Added margin bottom
        >
          Tutorials
        </Text>
        
        {/* GIF Carousel Section */}
        <VStack mb={10}> {/* Added margin bottom */}
          <Flex align="center" justify="center" w="full">
            <VStack>
              <IconButton
                isRound={true}
                variant='solid'
                colorScheme='teal'
                aria-label='Previous Slide'
                fontSize='20px'
                icon={<ChevronLeftIcon />}
                onClick={prevSlide}
              />
              <Text p="2"fontSize="sm" color="#B07095">Previous Slide</Text> 
            </VStack>

            <Box textAlign="center" mx={4} flexGrow={1} maxW="60rem"> {/* Added flexGrow and maxW */}
              <Text 
                padding={"0rem"}
                minHeight={"5rem"}
                color={"#B07095"}
                fontSize='lg'
                fontWeight='extrabold'
                marginBottom="0.5em" // Adjusted margin
              >
                {slides[currentSlide].caption}
              </Text>
              <Image 
                src={slides[currentSlide].gif} 
                maxHeight="35rem" 
                objectFit="contain" // Changed to contain for better visibility
                alt="Tutorial Slide" 
                animation={animation} 
                mx="auto" // Center image
              />
            </Box>

            <VStack>
              <IconButton
                isRound={true}
                variant='solid'
                colorScheme='teal'
                aria-label='Next Slide'
                fontSize='20px'
                icon={<ChevronRightIcon />}
                onClick={nextSlide}
              />
              <Text p="2" fontSize="sm" color="#B07095">Next Slide</Text> 
            </VStack>
          </Flex>
        </VStack>

        {/* Markdown Tutorials Section */}
        <Box py={5} px={{ base: 4, md: 8 }}> {/* Changed Container to Box and adjusted padding */}
          <Text 
          bgGradient='linear(to-l, #44666C, #A7C4A3)'
          bgClip='text'
          fontSize={{base: "4xl",sm: "4xl", md: "4xl", lg: "4xl",xl: "4xl"}}
          fontWeight='extrabold'
          paddingLeft={"2rem"}
          mb={6} // Added margin bottom
        >
            Step-by-Step Guides
          </Text>
          {loadingTutorials && (
            <Flex justify="center" my={10}>
              <Spinner size="xl" label="Loading tutorials..." />
            </Flex>
          )}
          {tutorialsError && (
            <Alert status="error" my={10}>
              <AlertIcon />
              {tutorialsError}
            </Alert>
          )}
          {!loadingTutorials && !tutorialsError && tutorialPosts.length > 0 && (
            <Accordion p={8} pt={2} allowMultiple defaultIndex={[]}>
              {tutorialPosts.map((post, index) => (
                <AccordionItem key={post.slug} mb={4} border="1px solid" borderColor="gray.200" borderRadius="md">
                  <h2>
                    <AccordionButton _expanded={{ bg: "#9DBA9D", color: "white" }}>
                      <Box flex="1" textAlign="left">
                        <Text fontSize="xl" fontWeight="semibold">
                          {post.title}
                        </Text>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel  pb={4} bg="white">
                    <Box 
                      className="tutorial-content" // For potential global styling
                      sx={{
                        h1: { fontSize: '2xl', fontWeight: 'bold', color: 'gray.800', mt:5, mb:3 },
                        h2: { fontSize: 'xl', fontWeight: 'bold', color: 'gray.700', mt:4, mb:2 },
                        p: { fontSize: 'md', lineHeight: '1.7', color: 'gray.700', mb: 3 },
                        a: { color: 'teal.600', textDecoration: 'underline', _hover: { color: 'teal.700'}},
                        img: { maxWidth: '100%', height: 'auto', my: 4, mx: 'auto', display: 'block', borderRadius: 'md', boxShadow: 'sm'},
                        ul: { pl: 5, mb: 3, listStyleType: 'disc' },
                        ol: { pl: 5, mb: 3, listStyleType: 'decimal' },
                        li: { mb: 1 },
                        code: { bg: 'gray.200', px: '0.3em', py: '0.1em', borderRadius: 'sm', fontFamily: 'mono', fontSize: '0.9em'},
                        pre: { bg: 'gray.100', p: 3, borderRadius: 'md', overflowX: 'auto', my: 4},
                        '.katex-display': { // Style for display mode LaTeX
                          overflowX: 'auto',
                          overflowY: 'hidden',
                          paddingBottom: '0.5em', // Add some padding if lines get cut off
                        },
                        '.katex': { // Style for inline LaTeX
                          fontSize: '1.05em', // Slightly larger for inline
                        }
                      }}
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]} // Added remarkMath
                        rehypePlugins={[rehypeRaw, rehypeKatex]} // Added rehypeKatex
                        components={{
                          // Custom image component to resolve paths from the repo
                          img: ({ node, src, alt, ...props }) => {
                            const imageSrc = src?.startsWith('http') ? src : `${TUTORIALS_DATA_REPO_CONFIG.rawBaseUrl}${TUTORIAL_CONTENT_CONFIG.path}/${src}`;
                            return <Image src={imageSrc} alt={alt} {...props} />;
                          },
                        }}
                      >
                        {post.content}
                      </ReactMarkdown>
                    </Box>
                  </AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
          )}
          {!loadingTutorials && !tutorialsError && tutorialPosts.length === 0 && (
            <Text textAlign="center" color="gray.500" my={10}>No tutorial guides available at the moment.</Text>
          )}
        </Box>

        {/* Other Learning Resources Section */}
        <Box mt={10}> {/* Added margin top */}
          <Heading padding={'5rem'} as="h3" size="lg" color={"#6A8A81"} paddingBottom={"1.5rem"} textAlign="center">
            Other Learning Resources
          </Heading>
          <Box paddingLeft={{base: "2rem", md: "10rem"}} paddingRight={{base: "2rem", md: "0"}}> {/* Responsive padding */}
            <UnorderedList stylePosition="inside"> {/* Changed to inside for better alignment */}
              <ListItem mb={2}> {/* Added margin bottom */}
                <Link color={"#B07095"} fontWeight="semibold" href='https://www.youtube.com/watch?v=oR1CeBXTvZ0&list=PLN5HMWt4P0VugGKpzqEChc7so-s1gV8FO&index=2' isExternal>
                  Sugar Drawer from Glycosmos
                </Link>
              </ListItem>
              <ListItem>
                <Link color={"#B07095"} fontWeight="semibold" href='https://www.ncbi.nlm.nih.gov/glycans/snfg.html' isExternal>
                  Symbol Nomenclature for Glycans (SNFG)
                </Link>
              </ListItem>
            </UnorderedList>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Tutorials; // Renamed export
