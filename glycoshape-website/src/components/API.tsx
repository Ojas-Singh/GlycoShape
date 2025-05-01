import React, { useState, useEffect } from 'react';
import {
  Flex,
  Link,
  Box,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Text,
  Code,
  Input,
  Select,
  Textarea,
  Button,
  VStack,
  HStack,
  useToast,
  Heading,
  useClipboard, 
  Badge,        
} from "@chakra-ui/react";
import { CheckIcon, CopyIcon } from "@chakra-ui/icons"; 
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// --- Define Interfaces for API Data ---
interface ApiExampleParam {
  name: string;
  value: string;
}

interface ApiExample {
  id: string;
  label: string;
  method: "GET" | "POST";
  endpoint: string;
  params: ApiExampleParam[]; // Use the specific interface here
  body: string;
  isFileUpload?: boolean; // Optional property
}
// --- End Interfaces ---

// Strongly type the apiExamples array
const apiExamples: ApiExample[] = [ // Apply the type here
  {
    id: "available",
    label: "GET /api/available",
    method: "GET",
    endpoint: "/api/available",
    params: [],
    body: "",
  },
  {
    id: "exist",
    label: "GET /api/exist/<identifier>",
    method: "GET",
    endpoint: "/api/exist/{identifier}",
    params: [{ name: "identifier", value: "G00028MO" }],
    body: "",
  },
  {
    id: "glycan",
    label: "GET /api/glycan/<identifier>",
    method: "GET",
    endpoint: "/api/glycan/{identifier}",
    params: [{ name: "identifier", value: "G00028MO" }],
    body: "",
  },
  {
    id: "pdb",
    label: "GET /api/pdb/<identifier>",
    method: "GET",
    endpoint: "/api/pdb/{identifier}",
    params: [{ name: "identifier", value: "G00028MO" }],
    body: "",
  },
  {
    id: "search",
    label: "POST /api/search",
    method: "POST",
    endpoint: "/api/search",
    params: [],
    body: JSON.stringify({ search_string: "all" }, null, 2),
  },
  {
    id: "download",
    label: "GET /api/download/<identifier>",
    method: "GET",
    endpoint: "/api/download/{identifier}",
    params: [{ name: "identifier", value: "G00028MO" }],
    body: "",
  },
  {
    id: "upload_pdb",
    label: "POST /api/upload_pdb",
    method: "POST",
    endpoint: "/api/upload_pdb",
    params: [],
    body: "// Use form-data for file upload via curl or client-side FormData",
    isFileUpload: true,
  },
  {
    id: "process_pdb",
    label: "POST /api/process_pdb",
    method: "POST",
    endpoint: "/api/process_pdb",
    params: [],
    body: JSON.stringify(
      {
        uniprotID: "P01857",
        selectedGlycans: { 50: "G00031MO", 80: "G00055MO" },
      },
      null,
      2
    ),
  },
];

const APITester: React.FC = () => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [currentExample, setCurrentExample] = useState(apiExamples[selectedIdx]);
  const [paramValues, setParamValues] = useState<{ [key: string]: string }>(
    apiExamples[selectedIdx].params.reduce((acc, p) => ({ ...acc, [p.name]: p.value }), {})
  );
  const [body, setBody] = useState(apiExamples[selectedIdx].body);
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const example = apiExamples[selectedIdx];
    setCurrentExample(example);
    // Provide explicit types for reduce
    setParamValues(
      example.params.reduce((acc: { [key: string]: string }, p: { name: string; value: string }) => {
        acc[p.name] = p.value;
        return acc;
      }, {}) // Initial value is an empty object
    );
    setBody(example.body);
    setResponse(null);
  }, [selectedIdx]);

  const handleParamChange = (name: string, value: string) => {
    setParamValues(prev => ({ ...prev, [name]: value }));
  };

  const constructUrl = () => {
    let url = currentExample.endpoint;
    currentExample.params.forEach(param => {
      url = url.replace(`{${param.name}}`, encodeURIComponent(paramValues[param.name] || ''));
    });
    return apiUrl + url;
  };

  const generateCurlCommand = () => {
    const url = constructUrl();
    let curl = `curl -X ${currentExample.method} "${url}"`;

    if (currentExample.method === "POST") {
      if (currentExample.isFileUpload) {
        curl += ` -F "pdbFile=@/path/to/your/file.pdb"`; // Example for file upload
      } else if (body.trim()) {
        curl += ` -H "Content-Type: application/json" -d '${body.replace(/'/g, "'\\''")}'`; // Escape single quotes in body
      }
    } else if (currentExample.method === "GET" && (currentExample.id === 'pdb' || currentExample.id === 'download')) {
        // Suggest using -o for file downloads
        const extension = currentExample.id === 'pdb' ? 'pdb' : 'zip';
        curl += ` -o output.${extension}`;
    }

    return curl;
  };

  const { hasCopied: hasCopiedCurl, onCopy: onCopyCurl } = useClipboard(generateCurlCommand());

  const handleSend = async () => {
    if (currentExample.isFileUpload) {
        toast({ title: "Info", description: "File uploads must be tested via curl or a dedicated client.", status: "info" });
        return;
    }

    setLoading(true);
    setResponse(null);
    const url = constructUrl();
    let options: RequestInit = { method: currentExample.method };

    if (currentExample.method === "POST" && body.trim()) {
      options.headers = { "Content-Type": "application/json" };
      try {
        // Validate JSON before sending
        JSON.parse(body);
        options.body = body;
      } catch (e) {
        toast({ title: "Invalid JSON", description: "Please check the request body format.", status: "error" });
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch(url, options);
      const contentType = res.headers.get("content-type");
      let data;

      if (contentType?.includes("application/json")) {
        data = await res.json();
        setResponse(JSON.stringify(data, null, 2));
      } else if (contentType?.includes("text/") || contentType?.includes("application/xml")) {
         data = await res.text();
         setResponse(data); // Display text directly
      } else if (res.ok && (currentExample.id === 'pdb' || currentExample.id === 'download')) {
         // Handle successful file download response in tester
         setResponse(`// Success: Received ${contentType || 'file'}. Use curl command with '-o' to save.`);
      }
       else {
        // Fallback for other types or errors
        data = await res.text();
        setResponse(`// Status: ${res.status}\n// Content-Type: ${contentType || 'N/A'}\n\n${data}`);
      }

      if (!res.ok) {
          toast({ title: `Error ${res.status}`, description: `API returned status ${res.status}`, status: "error" });
      }

    } catch (err: any) {
      const errorMsg = err.message || String(err);
      setResponse(`// Network or Fetch Error:\n${errorMsg}`);
      toast({ title: "API Error", description: errorMsg, status: "error", duration: 4000, isClosable: true });
    }
    setLoading(false);
  };

  return (
    <Box p={5} borderWidth={1} borderRadius="lg" bg="white" shadow="md" minW={{ base: "100%", md: "30%" }} maxW="500px" ml={{ base: 0, md: 6 }} mt={{ base: 6, md: 0 }}>
      <Text fontWeight="bold" fontSize="xl" mb={4}>API Tester</Text>
      <VStack align="stretch" spacing={4}>
        <Select value={selectedIdx} onChange={e => setSelectedIdx(Number(e.target.value))}>
          {apiExamples.map((ex, i) => (
            <option key={ex.id} value={i}>{ex.label}</option>
          ))}
        </Select>

        {/* Display Method and Constructed URL */}
        <HStack>
           <Text fontWeight="semibold" minW="60px">{currentExample.method}</Text>
           <Input value={constructUrl()} isReadOnly={true} fontSize="sm" />
        </HStack>

        {/* Path Parameter Inputs */}
        {currentExample.params.length > 0 && (
          <VStack align="stretch" spacing={1}>
            <Text fontSize="sm" fontWeight="medium">Path Parameters:</Text>
            {currentExample.params.map(param => (
              <HStack key={param.name}>
                <Text minW="80px" fontSize="sm" color="gray.600">{param.name}:</Text>
                <Input
                  size="sm"
                  value={paramValues[param.name] || ''}
                  onChange={e => handleParamChange(param.name, e.target.value)}
                />
              </HStack>
            ))}
          </VStack>
        )}

        {/* Request Body Input */}
        {currentExample.method === "POST" && !currentExample.isFileUpload && (
          <VStack align="stretch" spacing={1}>
             <Text fontSize="sm" fontWeight="medium">Request Body (JSON):</Text>
             <Textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={6}
                fontFamily="mono"
                fontSize="sm"
                placeholder="Enter JSON body here..."
             />
          </VStack>
        )}
         {currentExample.isFileUpload && (
             <Text fontSize="sm" color="gray.500">File uploads require using `curl` or client-side `FormData`.</Text>
         )}

        {/* Action Buttons */}
        <HStack>
          <Button colorScheme="blue" onClick={handleSend} isLoading={loading} isDisabled={currentExample.isFileUpload}>Send Request</Button>
          <Button variant="outline" onClick={onCopyCurl} leftIcon={hasCopiedCurl ? <CheckIcon /> : <CopyIcon />}>
            {hasCopiedCurl ? "Copied" : "Copy Curl"}
          </Button>
        </HStack>

        {/* Response Area */}
        <Box>
          <Text fontWeight="semibold" mb={1}>Response:</Text>
          <Box maxH="500px" overflowY="auto" borderWidth={1} borderRadius="md" bg="gray.50" p={1}>
            <SyntaxHighlighter
              language={response?.trim().startsWith('{') || response?.trim().startsWith('[') ? "json" : "text"}
              style={tomorrow}
              customStyle={{ margin: 0, background: "inherit", fontSize: "0.85em" }}
              wrapLongLines={true}
            >
              {response || "// Response will appear here"}
            </SyntaxHighlighter>
          </Box>
        </Box>
      </VStack>
    </Box>
  );
};

// --- Define Interface for ApiEndpoint Props ---
interface ApiParam {
  name: string;
  description: string;
}

interface ApiRequestBody {
  format: string;
  example: string;
  description?: string;
}

interface ApiEndpointProps {
  method: "GET" | "POST";
  path: string;
  description: string;
  params?: ApiParam[]; // Use the interface
  requestBody?: ApiRequestBody; // Use the interface
  responseDesc: string;
  curlExample: string;
  notes?: string[];
}
// --- End Interface Definition ---

// --- Type the ApiEndpoint Component ---
const ApiEndpoint: React.FC<ApiEndpointProps> = ({ // Apply the interface here
  method,
  path,
  description,
  responseDesc,
  curlExample,
  notes = [],
  params = [],
  requestBody // No need for default {} if optional in interface
}) => {
  const methodColorScheme = method === "GET" ? "green" : "blue";

  return (
    <AccordionItem>
      <AccordionButton>
        {/* Use HStack and Badge for better styling */}
        <HStack flex="1" textAlign="left" spacing={3}>
           <Badge colorScheme={methodColorScheme} fontSize="sm" px={2} py={0.5} borderRadius="md">{method}</Badge>
           <Text fontFamily="monospace" fontSize="md">{path}</Text>
        </HStack>
        <AccordionIcon />
      </AccordionButton>
      <AccordionPanel pb={4} bg="gray.50">
        <VStack align="stretch" spacing={3}>
          <Text>{description}</Text>

          {/* Parameters Section */}
          {params && params.length > 0 && (
            <Box>
              <Text fontWeight="semibold" mb={1}>Path Parameters:</Text>
              {params.map(p => ( // 'p' is now correctly typed as ApiParam
                 <HStack key={p.name} spacing={2} mb={1}>
                    <Code fontSize="sm">{p.name}</Code>
                    <Text fontSize="sm">- {p.description}</Text>
                 </HStack>
              ))}
            </Box>
          )}

          {/* Request Body Section */}
          {requestBody && ( // requestBody is now correctly typed as ApiRequestBody | undefined
             <Box>
               <Text fontWeight="semibold" mb={1}>Request Body ({requestBody.format}):</Text>
               {requestBody.description && <Text fontSize="sm" mb={1}>{requestBody.description}</Text>}
               <SyntaxHighlighter language="json" style={tomorrow} customStyle={{ fontSize: "0.85em", borderRadius: "md" }}>
                 {requestBody.example}
               </SyntaxHighlighter>
             </Box>
          )}

          {/* Response Section */}
          <Box>
             <Text fontWeight="semibold" mb={1}>Response:</Text>
             <Text fontSize="sm">{responseDesc}</Text>
          </Box>

          {/* Curl Example Section */}
          <Box>
             <Text fontWeight="semibold" mb={1}>Example Curl:</Text>
             <Code display="block" whiteSpace="pre-wrap" p={2} borderRadius="md" bg="gray.200" fontSize="sm">
               {curlExample}
             </Code>
          </Box>

          {/* Notes Section */}
          {notes && notes.length > 0 && (
             <Box>
                {notes.map((note, i) => ( // 'note' is correctly typed as string
                   <Text key={i} fontSize="sm" color="gray.600" mt={1}>Note: {note}</Text>
                ))}
             </Box>
          )}

        </VStack>
      </AccordionPanel>
    </AccordionItem>
  );
};
// --- End ApiEndpoint Component ---

const API: React.FC = () => {
  return (
    // Use Flex for two-column layout
    <Flex direction={{ base: "column", md: "row" }} p={5} gap={6}>

      {/* Left Column: Documentation */}
      <Box flex="1" minW={0}>
        <Text
            bgGradient='linear(to-l, #44666C, #A7C4A3)'
            bgClip='text'
            fontSize={{base: "4xl",sm: "4xl", md: "5xl"}}
            fontWeight='extrabold'
            mb={1}
          >
          API Documentation
          </Text>
          <Text color='#B195A2' fontSize={'sm'} mb={6}>
              Not stabilized yet. Please contact us <Link href="mailto:OJAS.SINGH.2023@mumail.ie" color="blue.500" isExternal>here</Link> if you have any questions.
          </Text>

          {/* GlycoShape APIs Section */}
          <Heading mt={8} mb={4} bgGradient='linear(to-l, #44666C, #A7C4A3)'
          bgClip='text'
          fontSize={{base: "3xl",sm: "3xl", md: "3xl", lg: "3xl",xl: "3xl"}}
          fontWeight='extrabold'
          marginBottom="0.2em">GlycoShape APIs</Heading>
          <Accordion allowMultiple defaultIndex={[0]}>
             <ApiEndpoint
                method="GET"
                path="/api/available"
                description="Returns a list of all available GlyTouCan IDs found in the GlycoShape database (GDB_data), including archetype, alpha, and beta forms."
                responseDesc="200 OK with JSON list of GlyToucan IDs."
                curlExample={`curl -X GET ${apiUrl}/api/available`}
             />
             <ApiEndpoint
                method="GET"
                path="/api/exist/<identifier>"
                description="Checks if a glycan exists based on the provided identifier. It checks raw/upload directories, the processed GlycoShape database, and performs conversions if necessary."
                params={[{ name: "identifier", description: "GlyTouCan ID, IUPAC, GLYCAM name, or WURCS string" }]}
                responseDesc="200 OK with JSON containing existence status and reason, 404 Not Found, or 500 Internal Server Error."
                curlExample={`curl -X GET ${apiUrl}/api/exist/your_identifier_here`}
             />
             <ApiEndpoint
                method="GET"
                path="/api/glycan/<identifier>"
                description="Returns the full glycan data (archetype, alpha, beta) for a given identifier, matching by internal ID, GlyTouCan ID, or IUPAC name."
                params={[{ name: "identifier", description: "Glycan internal ID, GlyTouCan ID (any form), or IUPAC name" }]}
                responseDesc="200 OK with full glycan data JSON, or 404 Not Found."
                curlExample={`curl -X GET ${apiUrl}/api/glycan/your_identifier_here`}
             />
             <ApiEndpoint
                method="GET"
                path="/api/pdb/<identifier>"
                description="Returns the .pdb structure file associated with the identifier. Tries multiple match types (ID, GlyTouCan, IUPAC) and returns alpha or beta PDB depending on availability."
                params={[{ name: "identifier", description: "Glycan internal ID, GlyTouCan ID, or IUPAC name" }]}
                responseDesc="200 OK with .pdb file content, or 404 Not Found."
                curlExample={`curl -X GET ${apiUrl}/api/pdb/your_identifier_here -o output.pdb`}
                notes={["Use `-o filename.pdb` to save the downloaded file."]}
             />
             <ApiEndpoint
                method="POST"
                path="/api/search"
                description="Searches for glycans in the GlycoShape database based on predefined criteria."
                requestBody={{
                    format: "application/json",
                    example: JSON.stringify({ search_string: "all", search_type: "(optional)" }, null, 2),
                    description: "`search_string` can be 'all' or 'N-Glycans'. `search_type` is currently unused."
                }}
                responseDesc="200 OK with a JSON list of matching glycans, each containing glytoucan, ID, and mass."
                curlExample={`curl -X POST ${apiUrl}/api/search -H "Content-Type: application/json" -d '{"search_string": "all"}'`}
             />
             <ApiEndpoint
                method="GET"
                path="/api/download/<identifier>"
                description="Creates and downloads a ZIP archive containing all related PDB files, output files (*.npz, *.json, *.mol2), and data.json for the specified glycan."
                params={[{ name: "identifier", description: "IUPAC or GlyTouCan ID" }]}
                responseDesc="200 OK with .zip file download, or 404 Not Found if the glycan or its files are missing."
                curlExample={`curl -X GET ${apiUrl}/api/download/your_identifier_here -o output.zip`}
                notes={["Use `-o filename.zip` to save the downloaded file."]}
             />
          </Accordion>

          {/* Re-Glyco APIs Section */}
          <Heading size="lg" mt={8} mb={4}  bgGradient='linear(to-l, #44666C, #A7C4A3)'
          bgClip='text'
          fontSize={{base: "3xl",sm: "3xl", md: "3xl", lg: "3xl",xl: "3xl"}}
          fontWeight='extrabold'
          marginBottom="0.2em">Re-Glyco APIs</Heading>
          <Accordion allowMultiple>
             <ApiEndpoint
                method="POST"
                path="/api/upload_pdb"
                description="Uploads a PDB file to the server. The file is saved in a designated directory for later processing."
                requestBody={{
                    format: "multipart/form-data",
                    example: "(Use form data with a field named 'pdbFile')",
                    description: "Requires sending the PDB file as form data."
                }}
                responseDesc="200 OK with JSON confirming upload success and filename, or 400/500 on error."
                curlExample={`curl -X POST ${apiUrl}/api/upload_pdb -F "pdbFile=@/path/to/your/file.pdb"`}
                notes={["This endpoint is typically used programmatically or via curl."]}
             />
             <ApiEndpoint
                method="POST"
                path="/api/process_pdb"
                description="Attaches specified glycans to a protein structure identified by UniProt ID. Assumes the base protein PDB and glycan structures are available server-side."
                requestBody={{
                    format: "application/json",
                    example: JSON.stringify(
                        {
                          uniprotID: "P01857",
                          selectedGlycans: { 50: "G00031MO", 80: "G00055MO" },
                        },
                        null,
                        2
                      ),
                    description: "`uniprotID`: UniProt accession ID of the protein. `selectedGlycans`: A dictionary where keys are sequence positions (1-based index) and values are GlyTouCan IDs of the glycans to attach."
                }}
                responseDesc="200 OK with the modified PDB file content, or 400/404/500 on errors (e.g., missing protein/glycan, invalid position)."
                curlExample={`curl -X POST ${apiUrl}/api/process_pdb -H "Content-Type: application/json" -d '{"uniprotID": "P01857", "selectedGlycans": {"50": "G00031MO"}}' -o modified_protein.pdb`}
                notes={["Use `-o filename.pdb` to save the resulting PDB file."]}
             />
          </Accordion>

      </Box>

      {/* Right Column: API Tester */}
      <APITester />

    </Flex>
  );
};

export default API;
