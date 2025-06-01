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


import { Tag, Divider, Show, SimpleGrid, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, Button, VStack, Grid, Flex, Image, Container, Box, Tab, Tabs, TabList, TabPanels, TabPanel, Text, Link, List, ListItem, Heading, HStack, Spacer, Hide, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
import { Element as HastElement } from 'hast'; // Import HastElement for typing the AST node

// Define an interface for team members
interface TeamMember {
  name: string;
  role: string;
  image: string;
  hoverImage: string;
  coolImage: string;
  bio: string;
  socialLinks: Array<{ platform: string; url: string }>;
  status: "current" | "past"; // Added status field
}

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

const ELAB_DATA_REPO_CONFIG = {
  owner: 'Ojas-Singh', 
  repo: 'GlycoShape-Resources', 
  branch: 'main',
  // Base URL for raw content from this new repository
  rawBaseUrl: `https://raw.githubusercontent.com/Ojas-Singh/GlycoShape-Resources/main/`, 
  // Base URL for API calls to this new repository (for directory listings, etc.)
  apiBaseUrl: `https://api.github.com/repos/Ojas-Singh/GlycoShape-Resources/contents/` 
};

// Configuration for fetching BLOG posts from the new data repository
const BLOG_CONTENT_CONFIG = {
  owner: ELAB_DATA_REPO_CONFIG.owner,
  repo: ELAB_DATA_REPO_CONFIG.repo,
  path: 'blog', // Path to the blog directory in the new repo
  branch: ELAB_DATA_REPO_CONFIG.branch
};



const ELab: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null); // Updated type
  const [hoveredCurrentMember, setHoveredCurrentMember] = useState<number | null>(null);
  const [hoveredPastMember, setHoveredPastMember] = useState<number | null>(null);
  
  // State for team members
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [teamError, setTeamError] = useState<string | null>(null);

  // New state for markdown content
  const [publications, setPublications] = useState<Publication[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loadingPublications, setLoadingPublications] = useState(true);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [publicationsError, setPublicationsError] = useState<string | null>(null);
  const [blogsError, setBlogsError] = useState<string | null>(null);

  // State for eLab main content
  const [elabMainContent, setElabMainContent] = useState<string>('');
  const [loadingElabMain, setLoadingElabMain] = useState(true);
  const [elabMainError, setElabMainError] = useState<string | null>(null);

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
  const fetchGitHubDirectoryContents = async (config: typeof BLOG_CONTENT_CONFIG): Promise<string[]> => { // Updated to take config
    const url = `${ELAB_DATA_REPO_CONFIG.apiBaseUrl}${config.path}?ref=${config.branch}`;
    
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

  // Updated fetchBlogPosts function to use GitHub API with new config
  const fetchBlogPosts = async () => {
    try {
      setLoadingBlogs(true);
      setBlogsError(null); // Reset error
      
      // Get list of markdown files from GitHub using BLOG_CONTENT_CONFIG
      const fileUrls = await fetchGitHubDirectoryContents(BLOG_CONTENT_CONFIG);
      
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

  // Keep your existing fetchPublications function unchanged for now, will modify next
  const fetchPublications = async () => {
    try {
      setLoadingPublications(true);
      setPublicationsError(null); // Reset error
      const response = await fetch(`${ELAB_DATA_REPO_CONFIG.rawBaseUrl}publications/publications.md`); // Fetch from new repo
      if (!response.ok) throw new Error(`Failed to fetch publications from ${ELAB_DATA_REPO_CONFIG.repo}`);
      
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

  // Function to fetch team members
  const fetchTeamMembers = async () => {
    setLoadingTeam(true);
    setTeamError(null);
    try {
      const response = await fetch(`${ELAB_DATA_REPO_CONFIG.rawBaseUrl}team/members.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch team members: ${response.status}`);
      }
      const data: TeamMember[] = await response.json();
      // Prepend base URL to image paths
      const membersWithFullImagePaths = data.map(member => ({
        ...member,
        image: member.image.startsWith('http') ? member.image : `${ELAB_DATA_REPO_CONFIG.rawBaseUrl}team/images/${member.image}`,
        hoverImage: member.hoverImage.startsWith('http') ? member.hoverImage : `${ELAB_DATA_REPO_CONFIG.rawBaseUrl}team/images/${member.hoverImage}`,
        coolImage: member.coolImage.startsWith('http') ? member.coolImage : `${ELAB_DATA_REPO_CONFIG.rawBaseUrl}team/images/${member.coolImage}`,
      }));
      setTeamMembers(membersWithFullImagePaths);
    } catch (error) {
      console.error('Error fetching team members:', error);
      setTeamError(error instanceof Error ? error.message : 'Failed to load team members');
    } finally {
      setLoadingTeam(false);
    }
  };

  // Function to fetch eLab main content
  const fetchElabMainContent = async () => {
    setLoadingElabMain(true);
    setElabMainError(null);
    try {
      const response = await fetch(`${ELAB_DATA_REPO_CONFIG.rawBaseUrl}eLab/main.md`);
      if (!response.ok) {
        throw new Error(`Failed to fetch eLab content: ${response.status}`);
      }
      const markdown = await response.text();
      setElabMainContent(markdown);
    } catch (error) {
      console.error('Error fetching eLab main content:', error);
      setElabMainError(error instanceof Error ? error.message : 'Failed to load eLab content');
    } finally {
      setLoadingElabMain(false);
    }
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
    fetchTeamMembers(); // Add this
    fetchPublications();
    fetchBlogPosts();
    fetchElabMainContent(); // Fetch eLab main content
  }, []);

  const handleOpenModal = (member: TeamMember) => { // Updated type
    setSelectedMember(member);
    setIsOpen(true);
  }
  const handleCloseModal = () => {
    setSelectedMember(null);
    setIsOpen(false);
  }

  // Filter members by status
  const currentMembers = teamMembers.filter(member => member.status === 'current');
  const pastMembers = teamMembers.filter(member => member.status === 'past');

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
              {loadingElabMain && <Spinner size="xl" label="Loading content..." />}
              {elabMainError && <Alert status="error"><AlertIcon />{elabMainError}</Alert>}
              {!loadingElabMain && !elabMainError && (
                <Box
                  className="elab-content" // Add a class if you want specific global styles
                  sx={{
                    // Consistent styles for eLab content, similar to blog
                    h1: {
                      fontSize: '2xl', // Adjusted from lg for this context
                      fontWeight: 'bold',
                      color: 'gray.800',
                      mb: 5,
                    },
                    h2: {
                      fontSize: 'xl', // Adjusted from md
                      fontWeight: 'semibold',
                      color: 'gray.700',
                      mt: 6,
                      mb: 3,
                    },
                    p: {
                      fontSize: 'md',
                      lineHeight: '1.7',
                      color: 'gray.700',
                      mb: 4,
                    },
                    a: {
                      color: 'blue.500', // Changed from teal for general links
                      textDecoration: 'underline',
                      _hover: {
                        color: 'blue.600',
                      },
                    },
                    img: {
                      maxWidth: '400px', // Max width for the eLab image
                      height: 'auto',
                      my: 5,
                      mx: 'auto', // Center images by default
                      display: 'block',
                      borderRadius: 'md',
                      boxShadow: 'sm',
                    },
                    ul: { pl: 5, mb: 4, listStyleType: 'disc' },
                    li: { mb: 2, ml: 2 },
                  }}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      // Ensure relative image paths from markdown are correctly prefixed
                      img: ({ node, src, alt, ...props }) => {
                        const imageSrc = src?.startsWith('http') ? src : `${ELAB_DATA_REPO_CONFIG.rawBaseUrl}${src}`;
                        // Specific styling for the eLab Logo if needed by alt text
                        if (alt === "eLab Logo") {
                           return <Image src={imageSrc} alt={alt} width={{base: "80%", md:"400px"}} mx="auto" my={5} />;
                        }
                        return <Image src={imageSrc} alt={alt} {...props} />;
                      },
                       // You can add more custom components here if needed
                       // For example, to use Chakra's Heading, Text, List etc.
                       // h1: ({node, ...props}) => <Heading as="h1" size="lg" marginBottom="5" {...props} />,
                       // p: ({node, ...props}) => <Text mb={4} {...props} />,
                    }}
                  >
                    {elabMainContent}
                  </ReactMarkdown>
                </Box>
              )}
            </Container>
          </TabPanel>

          <TabPanel>
            <Container maxWidth={{ base: "100%", sm: "100%", md: "80%", lg: "80%", xl: "80%" }} >

              <Box padding="5rem" paddingTop={"1rem"}>
                <Heading marginBottom="2rem" color="gray.800">Current Lab Members</Heading>
                {loadingTeam && <Spinner size="xl" label="Loading team..." />}
                {teamError && <Alert status="error"><AlertIcon />{teamError}</Alert>}
                {!loadingTeam && !teamError && (
                  <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)", "repeat(3, 1fr)"]} gap={8} mb={12}>
                    {currentMembers.map((member, idx) => (
                      <Box
                        key={`current-${idx}`}
                        bg="white"
                        borderRadius="xl"
                        boxShadow="md"
                        p={6}
                        textAlign="center"
                        transition="all 0.3s ease"
                        _hover={{
                          transform: "translateY(-4px)",
                          boxShadow: "xl",
                          bg: "gray.50"
                        }}
                        cursor="pointer"
                        onClick={() => handleOpenModal(member)}
                        onMouseEnter={() => setHoveredCurrentMember(idx)}
                        onMouseLeave={() => setHoveredCurrentMember(null)}
                      >
                        <Image
                          boxSize="150px"
                          objectFit="cover"
                          borderRadius="full"
                          src={hoveredCurrentMember === idx ? member.hoverImage : member.image}
                          alt={member.name}
                          mb={4}
                          mx="auto"
                          border="4px solid"
                          borderColor={hoveredCurrentMember === idx ? "teal.400" : "gray.200"}
                          transition="all 0.3s ease"
                          _hover={{
                            borderColor: "teal.400",
                          }}
                        />
                        <Heading size="md" mb={2} color="gray.800" _hover={{ color: "teal.600" }}>
                          {member.name}
                        </Heading>
                        <Text color="gray.600" fontSize="sm" fontWeight="medium">
                          {member.role}
                        </Text>
                        <Text 
                          mt={2} 
                          fontSize="xs" 
                          color="teal.500" 
                          fontWeight="semibold"
                          opacity={hoveredCurrentMember === idx ? 1 : 0}
                          transition="opacity 0.2s ease"
                        >
                          Click to view bio
                        </Text>
                      </Box>
                    ))}
                  </Grid>
                )}

                {pastMembers.length > 0 && !loadingTeam && !teamError && (
                  <>
                    <Divider my={8} />
                    <Heading marginBottom="2rem" mt={10} color="gray.800">Past Lab Members</Heading>
                    <Grid templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)", "repeat(3, 1fr)"]} gap={8}>
                      {pastMembers.map((member, idx) => (
                        <Box
                          key={`past-${idx}`}
                          bg="white"
                          borderRadius="xl"
                          boxShadow="sm"
                          p={6}
                          textAlign="center"
                          transition="all 0.3s ease"
                          _hover={{
                            transform: "translateY(-2px)",
                            boxShadow: "md",
                            bg: "gray.50",
                            opacity: 1,
                          }}
                          cursor="pointer"
                          onClick={() => handleOpenModal(member)}
                          onMouseEnter={() => setHoveredPastMember(idx)}
                          onMouseLeave={() => setHoveredPastMember(null)}
                          opacity={0.85}
                          
                        >
                          <Image
                            boxSize="140px"
                            objectFit="cover"
                            borderRadius="full"
                            src={hoveredPastMember === idx ? member.hoverImage : member.image}
                            alt={member.name}
                            mb={4}
                            // _hover for Image is now handled by parent Box
                            filter={hoveredPastMember === idx ? "none" : "grayscale(20%)"}
                            _hover={{
                              borderColor: "gray.400",
                              filter: "none"
                            }}
                          />
                          <Heading size="sm" mb={2} color="gray.700" _hover={{ color: "gray.800" }}>
                            {member.name}
                          </Heading>
                          <Text color="gray.500" fontSize="sm">
                            {member.role}
                          </Text>
                          <Text 
                            mt={2} 
                            fontSize="xs" 
                            color="gray.400" 
                            fontWeight="semibold"
                            opacity={hoveredPastMember === idx ? 1 : 0}
                            transition="opacity 0.2s ease"
                          >
                            Click to view bio
                          </Text>
                        </Box>
                      ))}
                    </Grid>
                  </>
                )}
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
