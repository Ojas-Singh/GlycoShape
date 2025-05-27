// eLab.tsx

import React, { useState, useEffect } from 'react';
import { useLocation, Link as RouterLink, useParams, useNavigate } from 'react-router-dom';
import { SocialIcon } from 'react-social-icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

// Imports for LaTeX and Code Highlighting
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { gruvboxLight } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Choose a style
import 'katex/dist/katex.min.css'; // KaTeX CSS

import elab_logo from '.././assets/eLAB.png';

import { Tag, Divider, Show, SimpleGrid, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, Button, VStack, Grid, Flex, Image, Container, Box, Tab, Tabs, TabList, TabPanels, TabPanel, Text, Link, List, ListItem, Heading, HStack, Spacer, Hide, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
import { Element as HastElement } from 'hast'; // Import HastElement for typing the AST node

interface BlogPost {
  title: string;
  date: string;
  content: string;
  slug: string;
}

interface Publication {
  title: string;
  authors: string;
  source: string;
  doi?: string;
  files_doi?: string;
  status?: string;
  editor?: string;
}

// GitHub configuration
const GITHUB_CONFIG = {
  owner: 'Ojas-Singh', 
  repo: 'GlycoShape', 
  path: '/', 
  branch: 'main' 
};

const ELab: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [hoveredMember, setHoveredMember] = useState<number | null>(null);
  
  // New state for markdown content
  const [publications, setPublications] = useState<Publication[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loadingPublications, setLoadingPublications] = useState(true);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [publicationsError, setPublicationsError] = useState<string | null>(null);
  const [blogsError, setBlogsError] = useState<string | null>(null);

  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // Tab index state for controlled Tabs
  const [tabIndex, setTabIndex] = useState(0);

  // Update tabIndex whenever location changes
  useEffect(() => {
    let idx = 0;
    if (location.pathname.startsWith('/team')) {
      idx = 1;
    } else if (location.pathname.startsWith('/blog')) {
      idx = 2;
    } else if (location.pathname.startsWith('/publications')) {
      idx = 3;
    } else if (location.pathname === '/elab' || location.pathname === '/') {
      idx = 0;
    } else {
      idx = 0;
    }
    setTabIndex(idx);
  }, [location.pathname]);

  // GitHub API functions
  const fetchGitHubDirectoryContents = async (): Promise<string[]> => {
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}?ref=${GITHUB_CONFIG.branch}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Filter for markdown files and return their download URLs
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

  // Updated fetchBlogPosts function to use GitHub API
  const fetchBlogPosts = async () => {
    try {
      setLoadingBlogs(true);
      
      // Get list of markdown files from GitHub
      const fileUrls = await fetchGitHubDirectoryContents();
      
      // Fetch content for each file
      const blogPromises = fileUrls.map(async (downloadUrl) => {
        const rawContent = await fetchGitHubFile(downloadUrl);
        const { title, date } = extractBlogMetadata(rawContent);

        // Robustly remove frontmatter
        const contentWithoutFrontmatter = rawContent.replace(/^---[\s\r\n]+([\s\S]*?)^---[\s\r\n]*/m, '');

        // Extract filename from URL for slug
        const filename = downloadUrl.split('/').pop() || '';
        const slugFromFile = filename.replace(/\.md$/, '');

        return {
          title: title || slugFromFile,
          date: date || new Date().toISOString(),
          content: contentWithoutFrontmatter.trim(),
          slug: slugFromFile,
        };
      });
      
      const posts = await Promise.all(blogPromises);
      setBlogPosts(posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error('Error fetching blog posts from GitHub:', error);
      setBlogsError('Failed to load blog posts from GitHub');
    } finally {
      setLoadingBlogs(false);
    }
  };

  // Keep your existing fetchPublications function unchanged
  const fetchPublications = async () => {
    try {
      setLoadingPublications(true);
      const response = await fetch('/publications.md'); // Keep local for publications
      if (!response.ok) throw new Error('Failed to fetch publications');
      
      const markdownContent = await response.text();
      const parsedPublications = parsePublicationsMarkdown(markdownContent);
      setPublications(parsedPublications);
    } catch (error) {
      console.error('Error fetching publications:', error);
      setPublicationsError('Failed to load publications');
    } finally {
      setLoadingPublications(false);
    }
  };

  // Parse publications markdown content
  const parsePublicationsMarkdown = (markdown: string): Publication[] => {
    const publications: Publication[] = [];
    const lines = markdown.split('\n');
    
    let currentPublication: Partial<Publication> = {};
    
    for (const line of lines) {
      if (line.startsWith('**Title:**')) {
        if (currentPublication.title) {
          publications.push(currentPublication as Publication);
        }
        currentPublication = { title: line.replace('**Title:**', '').trim() };
      } else if (line.startsWith('**Authors:**')) {
        currentPublication.authors = line.replace('**Authors:**', '').trim();
      } else if (line.startsWith('**Source:**')) {
        currentPublication.source = line.replace('**Source:**', '').trim();
      } else if (line.startsWith('**DOI:**')) {
        currentPublication.doi = line.replace('**DOI:**', '').trim();
      } else if (line.startsWith('**Files DOI:**')) {
        currentPublication.files_doi = line.replace('**Files DOI:**', '').trim();
      } else if (line.startsWith('**Status:**')) {
        currentPublication.status = line.replace('**Status:**', '').trim();
      } else if (line.startsWith('**Editor:**')) {
        currentPublication.editor = line.replace('**Editor:**', '').trim();
      }
    }
    
    if (currentPublication.title) {
      publications.push(currentPublication as Publication);
    }
    
    return publications;
  };

  // Extract blog metadata from markdown frontmatter
  const extractBlogMetadata = (content: string) => {
  // Support both \n and \r\n line endings
  const frontmatterMatch = content.match(/^---\s*[\r\n]+([\s\S]*?)^---\s*$/m);
  if (!frontmatterMatch) return { title: '', date: '' };

  const frontmatter = frontmatterMatch[1];
  // Use regex with multiline and optional quotes
  const titleMatch = frontmatter.match(/^title:\s*["']?(.+?)["']?\s*$/m);
  const dateMatch = frontmatter.match(/^date:\s*["']?(.+?)["']?\s*$/m);

  return {
    title: titleMatch ? titleMatch[1].trim() : '',
    date: dateMatch ? dateMatch[1].trim() : ''
  };
};

  useEffect(() => {
    fetchPublications();
    fetchBlogPosts();
  }, []);

  const handleOpenModal = (member: any) => {
    setSelectedMember(member);
    setIsOpen(true);
  }
  const handleCloseModal = () => {
    setSelectedMember(null);
    setIsOpen(false);
  }
  let defaultIndex: number;
  // Updated defaultIndex logic to handle /blog/:slug
  if (location.pathname.startsWith('/team')) {
    defaultIndex = 1;
  } else if (location.pathname.startsWith('/blog')) {
    defaultIndex = 2;
  } else if (location.pathname.startsWith('/publications')) {
    defaultIndex = 3;
  } else if (location.pathname === '/elab' || location.pathname === '/') { // Ensure /elab is caught
    defaultIndex = 0;
  }
   else {
    defaultIndex = 0; // Default to eLab tab
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

  return (

    <Box   >


      <Tabs
        align={"start"}
        maxWidth="100%"
        padding={"0rem"}
        paddingTop={"1rem"}
        variant='soft-rounded'
        colorScheme='green'
        index={tabIndex}
        onChange={setTabIndex}
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
            {/* Blog TabPanel - render blog posts from fetched markdown */}
            <Container maxWidth={{ base: "100%", sm: "100%", md: "80%", lg: "80%", xl: "80%" }}>
              <Box>
                {loadingBlogs && <Spinner size="lg" label="Loading blog posts..." />}
                {blogsError && <Alert status="error"><AlertIcon />{blogsError}</Alert>}

                {!loadingBlogs && !blogsError && slug ? (
                  (() => {
                    const post = blogPosts.find(p => p.slug === slug);
                    if (!post) {
                      return (
                        <>
                          <Alert status="error" mb={4}>
                            <AlertIcon />
                            Blog post not found.
                          </Alert>
                          <Button onClick={() => navigate('/blog')} colorScheme="teal" variant="outline">
                            Back to Blog
                          </Button>
                        </>
                      );
                    }
                    return (
                      <>
                        <Button onClick={() => navigate('/blog')} mb={4} colorScheme="teal" variant="outline">
                          &larr; All Blog Posts
                        </Button>
                        <Heading as="h2" size="xl" paddingBottom={"1rem"}>{post.title}</Heading>
                        <Text fontSize="sm" color="gray.500" mb={4}>{new Date(post.date).toLocaleDateString()}</Text>
                        <Box 
                          className="blog-content"
                          sx={{
                            // Consistent styles for blog content
                            h1: {
                              fontSize: '3xl',
                              fontWeight: 'bold',
                              color: 'gray.800',
                              mt: 8,
                              mb: 4,
                            },
                            h2: {
                              fontSize: '2xl',
                              fontWeight: 'bold',
                              color: 'gray.700',
                              mt: 6,
                              mb: 3,
                            },
                            h3: {
                              fontSize: 'xl',
                              fontWeight: 'semibold',
                              color: 'gray.700',
                              mt: 5,
                              mb: 2,
                            },
                            p: {
                              fontSize: 'md',
                              lineHeight: '1.7',
                              color: 'gray.700',
                              mb: 4,
                            },
                            a: {
                              color: 'teal.500',
                              textDecoration: 'underline',
                              _hover: {
                                color: 'teal.600',
                              },
                            },
                            img: {
                              maxWidth: '100%',
                              height: 'auto',
                              my: 5,
                              mx: 'auto',
                              display: 'block',
                              borderRadius: 'md',
                              boxShadow: 'sm',
                            },
                            hr: {
                              my: 8,
                              borderColor: 'gray.300',
                            },
                            ul: { pl: 6, mb: 4, listStyleType: 'disc' },
                            ol: { pl: 6, mb: 4, listStyleType: 'decimal' },
                            li: { mb: 2 },
                            code: { // Styles for INLINE code
                              bg: 'gray.100',
                              px: '0.4em',
                              py: '0.2em',
                              borderRadius: 'sm',
                              fontFamily: 'mono',
                              fontSize: '0.9em',
                              color: 'purple.600',
                            },
                            pre: { // Basic pre styles, SyntaxHighlighter will add more
                              bg: 'gray.50',
                              p: 4,
                              borderRadius: 'md',
                              overflowX: 'auto',
                              my: 5,
                            },
                            // Style for image captions (Markdown: *italic text* below image)
                            'p > em': {
                              display: 'block',
                              textAlign: 'center',
                              fontSize: 'sm',
                              color: 'gray.500',
                              mt: -3, // Adjust as needed to be closer to image
                              mb: 4,
                            },
                            // Example for specific image styling if needed by alt text
                            'img[alt="ScienceCast"]': {
                                width: '120px',
                                height: '120px',
                                borderRadius: 'full',
                                mb: 2,
                            },
                          }}
                        >
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeRaw, rehypeKatex]}
                            components={{
                              code: ({
                                node,
                                inline,
                                className,
                                children,
                                ...props
                              }: React.PropsWithChildren<{
                                node?: HastElement; // Make node optional
                                inline?: boolean;
                                className?: string;
                              } & React.HTMLAttributes<HTMLElement>>) => {
                                const match = /language-(\w+)/.exec(className || '');
                                if (!inline && match && node) { // Added check for node
                                  return (
                                    <SyntaxHighlighter
                                      style={gruvboxLight as any} // Cast to 'any' or a more specific theme type
                                      language={match[1]}
                                      PreTag="div"
                                      {...props}
                                    >
                                      {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                  );
                                }
                                return (
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                );
                              },
                            }}
                          >
                            {post.content}
                          </ReactMarkdown>
                        </Box>
                      </>
                    );
                  })()
                ) : !loadingBlogs && !blogsError && (
                  <>
                    <Heading as="h2" size="xl" paddingBottom={"2rem"}>Blog</Heading>
                    <VStack spacing={8} align="stretch">
                      {blogPosts.map((post, idx) => (
                        <Box key={idx} p={5} borderWidth={1} borderRadius="lg" w="100%" boxShadow="md" _hover={{ boxShadow: "lg" }} transition="box-shadow 0.2s">
                          {/* Only show title and date from metadata */}
                          <Heading as="h3" size="lg" color="teal.600" mb={2}>
                            <RouterLink to={`/blog/${post.slug}`}>{post.title}</RouterLink>
                          </Heading>
                          <Text fontSize="sm" color="gray.500" mb={3}>
                            {new Date(post.date).toLocaleDateString()}
                          </Text>
                          {/* Show only the content snippet, not the title/date */}
                          <Box color="gray.700" noOfLines={4}>
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeRaw]}
                            >
                              {post.content.trim().substring(0, 300) + (post.content.length > 300 ? '...' : '')}
                            </ReactMarkdown>
                          </Box>
                          <RouterLink to={`/blog/${post.slug}`}>
                            <Link color="teal.500" fontWeight="bold" mt={3} display="inline-block">Read more &rarr;</Link>
                          </RouterLink>
                        </Box>
                      ))}
                    </VStack>
                  </>
                )}
              </Box>
            </Container>
          </TabPanel>
          <TabPanel>
            {/* Publications TabPanel - render publications from fetched markdown */}
            <Container maxWidth={{ base: "100%", sm: "100%", md: "80%", lg: "80%", xl: "80%" }}>
              <Box>
                <Heading as="h2" size="xl" paddingBottom={"2rem"}>Selected Publications</Heading>
                {loadingPublications && <Spinner size="lg" label="Loading publications..." />}
                {publicationsError && <Alert status="error"><AlertIcon />{publicationsError}</Alert>}
                <VStack spacing={5} align="start">
                  {publications.map((pub, idx) => (
                    <Box key={idx} mb={4}>
                      <Text color="#B07095" fontWeight="semibold">{pub.title}</Text>
                      <Text>{pub.authors}</Text>
                      <Text color="#546AC8">{pub.source}</Text>
                      {pub.doi && <Link href={pub.doi} isExternal color="#2B6CB0">{pub.doi}</Link>}
                      {pub.files_doi && pub.files_doi !== "" && (
                        <Link href={pub.files_doi} isExternal color="#6A8A81">Files: {pub.files_doi}</Link>
                      )}
                      {pub.status && <Text color="gray.500">Status: {pub.status}</Text>}
                      {pub.editor && <Text color="gray.500">Editor: {pub.editor}</Text>}
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
                ))}</HStack>
            </SimpleGrid>
          </ModalBody>

        </ModalContent>
      </Modal>


    </Box>
  );
};

export default ELab;
