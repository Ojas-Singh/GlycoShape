import React, { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import {
    Box,
    Button,
    Container,
    Flex,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Table,
    Tbody,
    Td,
    Text,
    Textarea,
    Th,
    Thead,
    Tr,
    useToast,
    VStack,
    Spinner,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Grid,
    GridItem,
    Code,
    Divider,
    Link,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    HStack,
    IconButton,
    Tooltip,
    Badge,
    Stack,
} from '@chakra-ui/react';
import { DownloadIcon, ArrowRightIcon, ViewIcon, ViewOffIcon, EditIcon } from '@chakra-ui/icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Interface remains the same
interface SparqlResult {
    head: {
        vars: string[];
    };
    results: {
        bindings: Array<{
            [key: string]: {
                type: string;
                value: string;
                datatype?: string;
            };
        }>;
    };
}

// Define structure for example queries
interface ExampleQuery {
    title: string;
    description: string;
    query: string;
}

// Example Queries Data
const exampleQueries: ExampleQuery[] = [
    {
        title: 'Find Glycans by Mass',
        description: 'Retrieve the first 10 glycans (including variants) with a mass less than 500 Da.',
        query: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX gs: <http://glycoshape.io/ontology/>
PREFIX glycordf: <http://purl.jp/bio/12/glyco/glycan#>

SELECT ?glycan ?type ?glytoucan_id ?mass
WHERE {
  ?glycan rdf:type ?type .
  FILTER(?type IN (gs:ArchetypeGlycan, gs:AlphaAnomerGlycan, gs:BetaAnomerGlycan))
  ?glycan gs:glytoucanID ?glytoucan_id .
  ?glycan gs:mass ?mass .
  FILTER(?mass < 500)
}
LIMIT 10`,
    },
    {
        title: 'Find Glycan by GlyTouCan ID',
        description: 'Retrieve details for a specific glycan and its variants using its GlyTouCan ID (e.g., G00031MO).',
        query: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX gs: <http://glycoshape.io/ontology/>
PREFIX glycordf: <http://purl.jp/bio/12/glyco/glycan#>

SELECT ?glycan ?type ?glytoucan_id ?mass ?iupac_name
WHERE {
  ?glycan rdf:type ?type .
  FILTER(?type IN (gs:ArchetypeGlycan, gs:AlphaAnomerGlycan, gs:BetaAnomerGlycan))
  ?glycan gs:glytoucanID "G00031MO" . # <-- Replace with desired ID
  BIND("G00031MO" as ?glytoucan_id) # Bind the ID for selection
  OPTIONAL { ?glycan gs:mass ?mass . }
  OPTIONAL { ?glycan gs:iupacName ?iupac_name . }
}`,
    },
    {
        title: 'Find N-Glycan Core Structures',
        description: 'Retrieve glycans containing the common N-Glycan core structure.',
        query: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX gs: <http://glycoshape.io/ontology/>
PREFIX glycordf: <http://purl.jp/bio/12/glyco/glycan#>

SELECT DISTINCT ?glycan ?glytoucan_id ?iupac_name
WHERE {
  ?glycan rdf:type ?type .
  FILTER(?type IN (gs:ArchetypeGlycan))
  ?glycan gs:iupacName ?iupac_name .
  ?glycan gs:glytoucanID ?glytoucan_id .

  # Filter for IUPAC names ending with the core structure
  FILTER(
    REGEX(STR(?iupac_name), "Man\\\\(b1-4\\\\)GlcNAc\\\\(b1-4\\\\)GlcNAc$", "i") ||
    REGEX(STR(?iupac_name), "Man\\\\(b1-4\\\\)GlcNAc\\\\(b1-4\\\\)\\\\[Fuc\\\\(a1-6\\\\)\\\\]GlcNAc$", "i")
  )
}
LIMIT 20`,
    },
    
];

// Move SparqlEditor outside the main component to prevent recreation on every render
const SparqlEditor = ({ 
    value, 
    onChange, 
    showSyntaxHighlight, 
    setShowSyntaxHighlight, 
    nlLoading 
}: { 
    value: string; 
    onChange: (value: string) => void;
    showSyntaxHighlight: boolean;
    setShowSyntaxHighlight: (value: boolean) => void;
    nlLoading: boolean;
}) => {
    return (
        <VStack spacing={3} align="stretch">
            <Box position="relative">
                {/* Toggle Button */}
                <Box position="absolute" top={2} left={2} zIndex={3}>
                    <Tooltip 
                        label={showSyntaxHighlight ? "Switch to text input" : "Show syntax highlighting"} 
                        placement="right"
                    >
                        <IconButton
                            aria-label={showSyntaxHighlight ? "Switch to input mode" : "Show syntax highlighting"}
                            icon={showSyntaxHighlight ? <EditIcon /> : <ViewIcon />}
                            size="sm"
                            colorScheme={showSyntaxHighlight ? "blue" : "gray"}
                            variant={showSyntaxHighlight ? "solid" : "outline"}
                            onClick={() => setShowSyntaxHighlight(!showSyntaxHighlight)}
                            bg={showSyntaxHighlight ? "blue.500" : "white"}
                            _hover={{
                                bg: showSyntaxHighlight ? "blue.600" : "gray.100"
                            }}
                            boxShadow="sm"
                        />
                    </Tooltip>
                </Box>

                {/* Loading indicator for streaming */}
                {nlLoading && (
                    <Box position="absolute" top={2} right={2} zIndex={3}>
                        <HStack spacing={2}>
                            <Spinner size="sm" color="green.500" />
                            <Badge colorScheme="green" variant="solid" fontSize="xs">
                                Generating...
                            </Badge>
                        </HStack>
                    </Box>
                )}

                {showSyntaxHighlight ? (
                    // Syntax Highlighting View (Read-only with click to edit)
                    <Box 
                        position="relative"
                        border="1px solid" 
                        borderColor="gray.200" 
                        borderRadius="md"
                        minHeight="300px"
                        maxHeight="500px"
                        cursor="text"
                        onClick={() => setShowSyntaxHighlight(false)}
                        overflow="auto"
                        _hover={{
                            borderColor: "gray.300",
                            boxShadow: "sm"
                        }}
                        css={{
                            '&::-webkit-scrollbar': {
                                width: '8px',
                                height: '8px',
                            },
                            '&::-webkit-scrollbar-track': {
                                background: '#f1f1f1',
                                borderRadius: '4px',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                background: '#c1c1c1',
                                borderRadius: '4px',
                            },
                            '&::-webkit-scrollbar-thumb:hover': {
                                background: '#a8a8a8',
                            },
                        }}
                    >
                        {/* Click to edit overlay - only show when not loading */}
                        {!nlLoading && (
                            <Box
                                position="absolute"
                                top={0}
                                left={0}
                                right={0}
                                bottom={0}
                                bg="rgba(0,0,0,0.02)"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                opacity={0}
                                _hover={{ opacity: 1 }}
                                transition="opacity 0.2s"
                                zIndex={2}
                                borderRadius="md"
                                pointerEvents="none"
                            >
                                <Badge colorScheme="blue" variant="solid" fontSize="sm" py={1} px={3}>
                                    Click to edit
                                </Badge>
                            </Box>
                        )}
                        
                        <Box
                            width="100%"
                            minWidth="max-content"
                        >
                            <SyntaxHighlighter
                                language="sparql"
                                style={tomorrow}
                                customStyle={{
                                    margin: 0,
                                    fontSize: '12px',
                                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                                    minHeight: '300px',
                                    background: 'transparent',
                                    padding: '20px',
                                    paddingTop: '40px', // Account for toggle button
                                    width: '100%',
                                    boxSizing: 'border-box',
                                }}
                                showLineNumbers={true}
                                wrapLines={false}
                                wrapLongLines={false}
                            >
                                {value || (nlLoading ? 'Generating SPARQL query...' : '# Enter your SPARQL query here...')}
                            </SyntaxHighlighter>
                        </Box>
                    </Box>
                ) : (
                    // Text Input Mode
                    <Textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="Enter your SPARQL query here..."
                        minHeight="300px"
                        fontFamily="Consolas, Monaco, 'Courier New', monospace"
                        fontSize="12px"
                        spellCheck={false}
                        resize="vertical"
                        border="1px solid"
                        borderColor="gray.200"
                        borderRadius="md"
                        p={4}
                        pt={12} // Account for toggle button
                        pl={14}
                        bg="white"
                        isDisabled={nlLoading} // Disable editing while generating
                        _focus={{
                            borderColor: "teal.500",
                            boxShadow: "0 0 0 1px teal.500",
                        }}
                        onFocus={() => {
                            // Auto-switch to input mode when focused (but not during loading)
                            if (showSyntaxHighlight && !nlLoading) {
                                setShowSyntaxHighlight(false);
                            }
                        }}
                    />
                )}
            </Box>

            {/* Status Bar */}
            <Flex justify="space-between" align="center" fontSize="xs" color="gray.500">
                <HStack spacing={2}>
                    <Badge variant="outline" colorScheme={nlLoading ? "yellow" : (showSyntaxHighlight ? "blue" : "green")}>
                        {nlLoading ? "Generating..." : (showSyntaxHighlight ? "Preview Mode" : "Edit Mode")}
                    </Badge>
                    {value && (
                        <Text>
                            {value.split('\n').length} lines, {value.length} characters
                        </Text>
                    )}
                </HStack>
                <HStack spacing={2}>
                    <Text>SPARQL</Text>
                    <Badge variant="outline" size="sm">
                        {nlLoading ? "Streaming" : (showSyntaxHighlight ? "Read-only" : "Editable")}
                    </Badge>
                </HStack>
            </Flex>
        </VStack>
    );
};

const Sparql: React.FC = () => {
    // State variables remain the same
    const [endpoint, setEndpoint] = useState('https://glycoshape.io/sparql/query');
    const [query, setQuery] = useState(exampleQueries[0].query); // Start with first example
    const [results, setResults] = useState<SparqlResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('');
    const [nlLoading, setNlLoading] = useState(false);
    const [showSyntaxHighlight, setShowSyntaxHighlight] = useState(true);
    const toast = useToast();
    const editorRef = useRef<any>(null);

    // executeQuery function remains the same
    const executeQuery = async () => {
        setLoading(true);
        setError(null);
        setResults(null);

        const formData = new URLSearchParams();
        formData.append('query', query);

        try {
            const response = await axios.post<SparqlResult>(endpoint, formData, {
                headers: {
                    'Accept': 'application/sparql-results+json',
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            setResults(response.data);
            toast({
                title: 'Query executed successfully',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (err) {
            console.error('Error executing SPARQL query:', err);
            let errorMessage = 'Failed to execute query. Please check the endpoint URL and query syntax.';
            if (axios.isAxiosError(err) && err.response) {
                errorMessage += ` Server responded with status ${err.response.status}.`;
                if (err.response.data && typeof err.response.data === 'string') {
                     errorMessage += ` Details: ${err.response.data.substring(0, 200)}${err.response.data.length > 200 ? '...' : ''}`;
                } else if (err.response.data && err.response.data.message) {
                     errorMessage += ` Details: ${err.response.data.message}`;
                }
            }
            setError(errorMessage);
            toast({
                title: 'Error',
                description: errorMessage,
                status: 'error',
                duration: 7000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const apiUrl = process.env.REACT_APP_API_URL;

    // Function to handle natural language to SPARQL conversion
    const handleNaturalLanguageQuery = async () => {
        if (!naturalLanguageQuery.trim()) {
            toast({
                title: 'Error',
                description: 'Please enter a natural language query',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setNlLoading(true);
        setError(null);
        setQuery(''); // Clear existing query
        setShowSyntaxHighlight(true); // Switch to highlight mode to show streaming

        try {
            const response = await fetch(`${apiUrl}/api/natural2sparql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream',
                },
                body: JSON.stringify({
                    query: naturalLanguageQuery,
                    endpoint: endpoint,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Failed to get response reader');
            }

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            break;
                        }
                        
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.token) {
                                setQuery(prev => prev + parsed.token);
                            }
                        } catch (e) {
                            // Handle non-JSON data or continue streaming
                            setQuery(prev => prev + data);
                        }
                    }
                }
            }

            toast({
                title: 'Query Generated',
                description: 'SPARQL query has been generated successfully',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

        } catch (err) {
            console.error('Error converting natural language to SPARQL:', err);
            setError('Failed to convert natural language to SPARQL. Please try again.');
            toast({
                title: 'Error',
                description: 'Failed to convert natural language to SPARQL',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setNlLoading(false);
        }
    };

    // Cleanup effect for Monaco Editor
    useEffect(() => {
        return () => {
            if (editorRef.current) {
                try {
                    editorRef.current.dispose();
                } catch (error) {
                    // Ignore disposal errors
                    console.log('Editor disposal handled');
                }
            }
        };
    }, []);

    // renderResults function - modify this function
    const renderResults = () => {
        if (!results) return null;
        const vars = results.head.vars;
        const bindings = results.results.bindings;

        if (bindings.length === 0) {
            return (
                <Alert status="info" mt={4}>
                    <AlertIcon /> <AlertTitle>No results</AlertTitle>
                    <AlertDescription>The query returned no results.</AlertDescription>
                </Alert>
            );
        }
        return (
            <Box 
                mt={4}
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
                maxHeight="500px" // Optional: limit height for vertical scrolling too
                overflowY="auto" // Enable vertical scrolling if needed
            >
                <Box 
                    overflowX="auto" 
                    minWidth="100%"
                    css={{
                        '&::-webkit-scrollbar': {
                            height: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                            background: '#f1f1f1',
                            borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: '#c1c1c1',
                            borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                            background: '#a8a8a8',
                        },
                    }}
                >
                    <Table variant="simple" size="sm" minWidth="max-content">
                        <Thead bg="gray.50" position="sticky" top={0} zIndex={1}>
                            <Tr> 
                                {vars.map((variable) => (
                                    <Th 
                                        key={variable}
                                        whiteSpace="nowrap"
                                        px={4}
                                        py={2}
                                        borderBottom="2px solid"
                                        borderColor="gray.200"
                                    >
                                        {variable}
                                    </Th>
                                ))} 
                            </Tr>
                        </Thead>
                        <Tbody>
                            {bindings.map((row, rowIndex) => (
                                <Tr key={rowIndex} _hover={{ bg: "gray.50" }}>
                                    {vars.map((variable) => (
                                        <Td 
                                            key={variable}
                                            whiteSpace="nowrap"
                                            px={4}
                                            py={2}
                                            maxWidth="300px" // Optional: limit cell width
                                            overflow="hidden"
                                            textOverflow="ellipsis"
                                            title={row[variable] ? row[variable].value : ''} // Show full value on hover
                                        > 
                                            {row[variable] ? row[variable].value : ''} 
                                        </Td>
                                    ))}
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </Box>
            </Box>
        );
    };

    // Function to handle downloading results as CSV
    const downloadResults = () => {
        if (!results || results.results.bindings.length === 0) {
            toast({ title: "No results to download", status: "warning", duration: 3000, isClosable: true });
            return;
        }

        const vars = results.head.vars;
        const bindings = results.results.bindings;

        // Create CSV header
        const header = vars.join(',') + '\n';

        // Create CSV rows
        const rows = bindings.map(row => {
            return vars.map(variable => {
                const value = row[variable] ? row[variable].value : '';
                // Escape commas and quotes in values
                const escapedValue = `"${value.replace(/"/g, '""')}"`;
                return escapedValue;
            }).join(',');
        }).join('\n');

        const csvContent = header + rows;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'sparql_results.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); // Clean up the object URL
    };

    // Function to load an example query
    const loadExampleQuery = (exampleQuery: string) => {
        setQuery(exampleQuery);
        // Optionally clear results when loading a new query
        // setResults(null);
        // setError(null);
        toast({ title: "Example query loaded", status: "info", duration: 2000, isClosable: true });
    };

    return (
        // Use Grid for two-column layout
        <Grid
            templateColumns={{ base: "1fr", lg: "2fr 1fr" }} // Single column on small screens, 2/3 + 1/3 on large
            gap={6} // Gap between columns
            p={4} // Padding around the grid
        >
            {/* Left Column: Query Editor and Results */}
            <GridItem w="100%">
                <VStack spacing={4} align="stretch">
                    <Text 
                              bgGradient='linear(to-l, #44666C, #A7C4A3)'
                              bgClip='text'
                              fontSize={{base: "4xl",sm: "4xl", md: "5xl", lg: "5xl",xl: "5xl"}}
                              fontWeight='extrabold'
                            //   marginBottom="0.2em"
                            >
                    SPARQL Query Explorer</Text>

                    {/* Natural Language Input Section */}
                    <Box p={4} borderWidth="1px" borderRadius="md" bg="blue.50">
                        <Heading as="h3" size="md" mb={3} color="blue.700">
                            Natural Language to SPARQL
                        </Heading>
                        <Text fontSize="sm" color="gray.600" mb={3}>
                            Describe what you want to find in plain English, and we'll generate a SPARQL query for you.
                        </Text>
                        <HStack spacing={3}>
                            <Input
                                value={naturalLanguageQuery}
                                onChange={(e) => setNaturalLanguageQuery(e.target.value)}
                                placeholder="e.g., Find all glycans with mass less than 500 Da"
                                size="md"
                                bg="white"
                                flex={1}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleNaturalLanguageQuery();
                                    }
                                }}
                            />
                            <Button
                                colorScheme="blue"
                                onClick={handleNaturalLanguageQuery}
                                isLoading={nlLoading}
                                loadingText="Converting..."
                                size="md"
                                rightIcon={<ArrowRightIcon />}
                            >
                                Generate
                            </Button>
                        </HStack>
                    </Box>

                    <Box>
                        <FormControl id="endpoint" isRequired mb={4}>
                            <FormLabel>SPARQL Endpoint</FormLabel>
                            <Input
                                value={endpoint}
                                onChange={(e) => setEndpoint(e.target.value)}
                                placeholder="Enter SPARQL endpoint URL"
                            />
                        </FormControl>

                        <FormControl id="query" isRequired mb={4}>
                            <FormLabel>SPARQL Query</FormLabel>
                            <SparqlEditor 
                                value={query} 
                                onChange={setQuery}
                                showSyntaxHighlight={showSyntaxHighlight}
                                setShowSyntaxHighlight={setShowSyntaxHighlight}
                                nlLoading={nlLoading}
                            />
                        </FormControl>

                        <Flex justify="flex-end">
                            <Button
                                colorScheme="teal"
                                onClick={executeQuery}
                                isLoading={loading}
                                loadingText="Executing"
                            >
                                Execute Query
                            </Button>
                        </Flex>
                    </Box>

                    {loading && (
                        <Flex justify="center" py={8}>
                            <Spinner size="xl" color="teal.500" />
                        </Flex>
                    )}

                    {error && (
                        <Alert status="error" mt={4}>
                            <AlertIcon />
                            <AlertTitle>Error Executing Query!</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {results && (
                        <Box mt={4}>
                            <Flex justify="space-between" align="center" mb={2}>
                                <Heading as="h2" size="lg">
                                    Results ({results.results.bindings.length})
                                </Heading>
                                <Tooltip label="Download results as CSV" placement="top">
                                    <IconButton
                                        aria-label="Download results"
                                        icon={<DownloadIcon />}
                                        onClick={downloadResults}
                                        isDisabled={!results || results.results.bindings.length === 0}
                                        colorScheme="blue"
                                        variant="outline"
                                    />
                                </Tooltip>
                            </Flex>
                            {renderResults()}
                        </Box>
                    )}
                </VStack>
            </GridItem>

            {/* Right Column: Information and Examples */}
            <GridItem w="100%">
                <Box p={4} borderWidth="1px" borderRadius="md" position="sticky" top="20px"> {/* Sticky position */}
                    <Heading as="h3" size="md" mb={4}>GlycoShape SPARQL Info</Heading>
                    <Text fontSize="sm" mb={2}>
                        Endpoint: <Code>{endpoint}</Code>
                    </Text>
                    <Text fontSize="sm" mb={4}>
                        Query the GlycoShape RDF database using SPARQL. Key prefixes include:
                        <Code display="block" whiteSpace="pre" my={1}>
                            PREFIX gs: &lt;http://glycoshape.io/ontology/&gt; <br />
                            PREFIX glycordf: &lt;http://purl.jp/bio/12/glyco/glycan#&gt;
                        </Code>
                        Common types: <Code>gs:ArchetypeGlycan</Code>, <Code>gs:GlycanVariant</Code>. <br/>
                        Common properties: <Code>gs:glytoucanID</Code>, <Code>gs:mass</Code>, <Code>gs:iupacName</Code>.
                    </Text>

                    <Divider my={4} />

                    <Heading as="h3" size="md" mb={4}>Example Queries</Heading>
                    <Accordion allowToggle>
                        {exampleQueries.map((ex, index) => (
                            <AccordionItem key={index}>
                                <h2>
                                    <AccordionButton>
                                        <Box flex="1" textAlign="left">
                                            {ex.title}
                                        </Box>
                                        <AccordionIcon />
                                    </AccordionButton>
                                </h2>
                                <AccordionPanel pb={4}>
                                    <Text fontSize="sm" mb={2}>{ex.description}</Text>
                                    <Code display="block" whiteSpace="pre-wrap" p={2} borderRadius="md" fontSize="xs" mb={2}>
                                        {ex.query}
                                    </Code>
                                    <Button size="sm" colorScheme="gray" onClick={() => loadExampleQuery(ex.query)}>
                                        Load Query
                                    </Button>
                                </AccordionPanel>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </Box>
            </GridItem>
        </Grid>
    );
};

export default Sparql;