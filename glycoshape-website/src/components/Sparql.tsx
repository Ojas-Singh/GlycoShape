import React, { useState } from 'react';
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
    Grid, // Use Grid for layout
    GridItem, // Use GridItem for layout
    Code, // To display query examples
    Divider, // To separate sections
    Link, // For external links if needed
    Accordion, // To make examples collapsible
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    HStack, // For button layout
    IconButton, // For download button
    Tooltip, // For download button tooltip
} from '@chakra-ui/react';
import { DownloadIcon } from '@chakra-ui/icons'; // Icon for download button

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


const Sparql: React.FC = () => {
    // State variables remain the same
    const [endpoint, setEndpoint] = useState('https://glycoshape.io/sparql/query');
    const [query, setQuery] = useState(exampleQueries[0].query); // Start with first example
    const [results, setResults] = useState<SparqlResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const toast = useToast();

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

    // renderResults function remains the same
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
            <Box overflowX="auto" mt={4}>
                <Table variant="simple" size="sm">
                    <Thead>
                        <Tr> {vars.map((variable) => (<Th key={variable}>{variable}</Th>))} </Tr>
                    </Thead>
                    <Tbody>
                        {bindings.map((row, rowIndex) => (
                            <Tr key={rowIndex}>
                                {vars.map((variable) => (
                                    <Td key={variable}> {row[variable] ? row[variable].value : ''} </Td>
                                ))}
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
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
                <VStack spacing={6} align="stretch">
                    <Text 
                              bgGradient='linear(to-l, #44666C, #A7C4A3)'
                              bgClip='text'
                              fontSize={{base: "4xl",sm: "4xl", md: "5xl", lg: "6xl",xl: "6xl"}}
                              fontWeight='extrabold'
                              marginBottom="0.2em"
                            >
                    SPARQL Query Explorer</Text>

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
                            <Textarea
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Enter your SPARQL query here..."
                                rows={15}
                                fontFamily="monospace"
                                spellCheck="false" // Disable spellcheck for code
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