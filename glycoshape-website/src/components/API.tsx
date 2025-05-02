import React, { useState, useEffect, useRef } from 'react'; // Added useRef
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
  InputGroup, // Added
  InputRightElement, // Added
  IconButton, // Added
} from "@chakra-ui/react";
import { CheckIcon, CopyIcon, AttachmentIcon } from "@chakra-ui/icons"; // Added AttachmentIcon
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
  params: ApiExampleParam[];
  body: string;
  isFileUpload?: boolean; // For file input in tester
  isBase64Upload?: boolean; // For base64 input in tester
}
// --- End Interfaces ---

// --- Updated apiExamples array ---
const apiExamples: ApiExample[] = [
  // --- GlycoShape APIs ---
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
  // --- Re-Glyco APIs ---
  {
    id: "reglyco_init_configs",
    label: "POST /api/reglyco/init (Configs Only)",
    method: "POST",
    endpoint: "/api/reglyco/init",
    params: [],
    body: JSON.stringify({ configsOnly: true }, null, 2),
  },
  {
    id: "reglyco_init_id",
    label: "POST /api/reglyco/init (Fetch ID)",
    method: "POST",
    endpoint: "/api/reglyco/init",
    params: [],
    body: JSON.stringify({ protID: "P01857" }, null, 2),
  },
  {
    id: "reglyco_init_file_upload",
    label: "POST /api/reglyco/init (File Upload)",
    method: "POST",
    endpoint: "/api/reglyco/init",
    params: [],
    body: "// Use form-data for file upload via curl or client-side FormData",
    isFileUpload: true, // Mark for tester UI
  },
  {
    id: "reglyco_job_scan",
    label: "POST /api/reglyco/job (Scan)",
    method: "POST",
    endpoint: "/api/reglyco/job",
    params: [],
    body: JSON.stringify(
      {
        jobId: "unique-job-id-scan",
        jobType: "scan",
        filename: "P01857.pdb", // Assumes init was run for P01857
      },
      null,
      2
    ),
  },
  {
    id: "reglyco_job_scan_base64",
    label: "POST /api/reglyco/job (Scan Base64)",
    method: "POST",
    endpoint: "/api/reglyco/job",
    params: [],
    body: JSON.stringify(
      {
        jobId: "unique-job-id-scan-b64",
        jobType: "scan",
        filename: "my_protein.pdb",
        protFileBase64: "<base64_encoded_pdb_content>",
      },
      null,
      2
    ),
    isBase64Upload: true, // Mark for tester UI
  },
  {
    id: "reglyco_job_optimization",
    label: "POST /api/reglyco/job (Optimization)",
    method: "POST",
    endpoint: "/api/reglyco/job",
    params: [],
    body: JSON.stringify(
      {
        jobId: "unique-job-id-opt",
        jobType: "optimization",
        filename: "P01857.pdb", // Assumes init was run for P01857
        selectedGlycans: { "50_A": "G00031MO", "80_B": "G00055MO" },
        populationSize: 128,
        maxGenerations: 4,
        wiggleAttempts: 10,
        wiggleAngle: 5,
        outputFormat: "PDB",
      },
      null,
      2
    ),
    
  },
  {
    id: "reglyco_job_optimization_base64",
    label: "POST /api/reglyco/job (Optimization Base64)",
    method: "POST",
    endpoint: "/api/reglyco/job",
    params: [],
    body: JSON.stringify(
      {
        jobId: "unique-job-id-opt",
        jobType: "optimization",
        filename: "protein.pdb", // Assumes init was run for P01857
        selectedGlycans: { "50_A": "G00031MO", "80_B": "G00055MO" },
        populationSize: 128,
        maxGenerations: 4,
        wiggleAttempts: 10,
        wiggleAngle: 5,
        outputFormat: "PDB",
      },
      null,
      2
    ),
    isBase64Upload: true, // Mark for tester UI
  },
  {
    id: "reglyco_job_ensemble",
    label: "POST /api/reglyco/job (Ensemble)",
    method: "POST",
    endpoint: "/api/reglyco/job",
    params: [],
    body: JSON.stringify(
      {
        jobId: "unique-job-id-ens",
        jobType: "ensemble",
        filename: "P01857.pdb", // Assumes init was run for P01857
        selectedGlycans: { "50_A": "G00031MO" },
        ensembleSize: 10,
        calculateSASA: true,
        effortLevel: 5, // Example effort level (will be *100 on server)
        wiggleAngle: 2,
        checkSteric: true,
        outputFormat: "PDB",
      },
      null,
      2
    ),
  },
];
// --- End Updated apiExamples array ---

// --- APITester Component ---
const APITester: React.FC = () => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [currentExample, setCurrentExample] = useState(apiExamples[selectedIdx]);
  const [paramValues, setParamValues] = useState<{ [key: string]: string }>(
    apiExamples[selectedIdx].params.reduce((acc, p) => ({ ...acc, [p.name]: p.value }), {})
  );
  const [body, setBody] = useState(apiExamples[selectedIdx].body);
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // For file uploads
  const [base64Input, setBase64Input] = useState<string>(""); // For base64 input
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input
  const toast = useToast();

  useEffect(() => {
    const example = apiExamples[selectedIdx];
    setCurrentExample(example);
    setParamValues(
      example.params.reduce((acc: { [key: string]: string }, p: { name: string; value: string }) => {
        acc[p.name] = p.value;
        return acc;
      }, {})
    );
    setBody(example.body);
    setResponse(null);
    setSelectedFile(null); // Reset file input on example change
    setBase64Input(""); // Reset base64 input
    if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Clear the actual file input element
    }
  }, [selectedIdx]);

  const handleParamChange = (name: string, value: string) => {
    setParamValues(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleBase64FileRead = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files[0]) {
          const file = event.target.files[0];
          const reader = new FileReader();
          reader.onload = (loadEvent) => {
              const base64String = (loadEvent.target?.result as string)?.split(',')[1]; // Get base64 part
              if (base64String) {
                  setBase64Input(base64String);
                  // Optionally update the body template
                  try {
                      const bodyJson = JSON.parse(body);
                      bodyJson.protFileBase64 = base64String;
                      bodyJson.filename = file.name; // Update filename too
                      setBody(JSON.stringify(bodyJson, null, 2));
                  } catch (e) {
                      console.error("Could not parse body JSON to insert base64");
                      setBody(prev => prev.replace("<base64_encoded_pdb_content>", base64String)); // Simple replace as fallback
                  }
              }
          };
          reader.onerror = (error) => {
              toast({ title: "File Read Error", description: "Could not read file for base64 encoding.", status: "error" });
          };
          reader.readAsDataURL(file); // Read as Data URL to get base64
      }
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
        curl += ` -F "protFile=@/path/to/your/file.pdb"`; // Updated field name for /init
      } else if (body.trim()) {
        // Ensure body is valid JSON before adding
        try {
            JSON.parse(body); // Validate
            curl += ` -H "Content-Type: application/json" -d '${body.replace(/'/g, "'\\''")}'`; // Escape single quotes
        } catch (e) {
            curl += ` # Body is not valid JSON`;
        }
      }
    } else if (currentExample.method === "GET" && (currentExample.id === 'pdb' || currentExample.id === 'download')) {
        const extension = currentExample.id === 'pdb' ? 'pdb' : 'zip';
        curl += ` -o output.${extension}`;
    }

    return curl;
  };

  const { hasCopied: hasCopiedCurl, onCopy: onCopyCurl } = useClipboard(generateCurlCommand());

  const handleSend = async () => {
    setLoading(true);
    setResponse(null);
    const url = constructUrl();
    let options: RequestInit = { method: currentExample.method };
    let requestBody: BodyInit | null = null;

    if (currentExample.method === "POST") {
        if (currentExample.isFileUpload) {
            if (!selectedFile) {
                toast({ title: "File Required", description: "Please select a file to upload.", status: "warning" });
                setLoading(false);
                return;
            }
            const formData = new FormData();
            formData.append("protFile", selectedFile); // Use 'protFile' for /init
            requestBody = formData;
        } else {
            options.headers = { "Content-Type": "application/json" };
            try {
                JSON.parse(body); // Validate JSON
                requestBody = body;
            } catch (e) {
                toast({ title: "Invalid JSON", description: "Please check the request body format.", status: "error" });
                setLoading(false);
                return;
            }
        }
        options.body = requestBody;
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
         setResponse(data);
      } else if (res.ok && (currentExample.id === 'pdb' || currentExample.id === 'download')) {
         setResponse(`// Success: Received ${contentType || 'file'}. Use curl command with '-o' to save.`);
      } else {
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

        <HStack>
           <Text fontWeight="semibold" minW="60px">{currentExample.method}</Text>
           <Input value={constructUrl()} isReadOnly={true} fontSize="sm" />
        </HStack>

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

        {/* File Upload Input */}
        {currentExample.isFileUpload && (
            <VStack align="stretch" spacing={1}>
                <Text fontSize="sm" fontWeight="medium">File Upload:</Text>
                <InputGroup size="sm">
                    <Input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        p={1}
                        accept=".pdb,.cif"
                    />
                </InputGroup>
                {selectedFile && <Text fontSize="xs" color="gray.500">Selected: {selectedFile.name}</Text>}
            </VStack>
        )}

        {/* Base64 File Input Helper */}
        {currentExample.isBase64Upload && (
            <VStack align="stretch" spacing={1}>
                <Text fontSize="sm" fontWeight="medium">Load Base64 from File:</Text>
                <InputGroup size="sm">
                     <Input
                        type="file"
                        onChange={handleBase64FileRead}
                        p={1}
                        accept=".pdb,.cif"
                    />
                </InputGroup>
                <Text fontSize="xs" color="gray.500">Select a file to auto-fill the 'protFileBase64' field below.</Text>
            </VStack>
        )}


        {/* Request Body Input */}
        {currentExample.method === "POST" && !currentExample.isFileUpload && (
          <VStack align="stretch" spacing={1}>
             <Text fontSize="sm" fontWeight="medium">Request Body (JSON):</Text>
             <Textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={currentExample.isBase64Upload ? 10 : 6}
                fontFamily="mono"
                fontSize="sm"
                placeholder="Enter JSON body here..."
             />
          </VStack>
        )}

        <HStack>
          <Button colorScheme="blue" onClick={handleSend} isLoading={loading}>Send Request</Button>
          <Button variant="outline" onClick={onCopyCurl} leftIcon={hasCopiedCurl ? <CheckIcon /> : <CopyIcon />}>
            {hasCopiedCurl ? "Copied" : "Copy Curl"}
          </Button>
        </HStack>

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
// --- End APITester Component ---

// --- ApiEndpoint Component ---
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
  params?: ApiParam[];
  requestBody?: ApiRequestBody;
  responseDesc: string;
  curlExample: string;
  notes?: string[];
}

const ApiEndpoint: React.FC<ApiEndpointProps> = ({
  method,
  path,
  description,
  responseDesc,
  curlExample,
  notes = [],
  params = [],
  requestBody
}) => {
  const methodColorScheme = method === "GET" ? "green" : "blue";

  return (
    <AccordionItem>
      <AccordionButton>
        <HStack flex="1" textAlign="left" spacing={3}>
           <Badge colorScheme={methodColorScheme} fontSize="sm" px={2} py={0.5} borderRadius="md">{method}</Badge>
           <Text fontFamily="monospace" fontSize="md">{path}</Text>
        </HStack>
        <AccordionIcon />
      </AccordionButton>
      <AccordionPanel pb={4} bg="gray.50">
        <VStack align="stretch" spacing={3}>
          <Text>{description}</Text>

          {params && params.length > 0 && (
            <Box>
              <Text fontWeight="semibold" mb={1}>Path Parameters:</Text>
              {params.map(p => (
                 <HStack key={p.name} spacing={2} mb={1}>
                    <Code fontSize="sm">{p.name}</Code>
                    <Text fontSize="sm">- {p.description}</Text>
                 </HStack>
              ))}
            </Box>
          )}

          {requestBody && (
             <Box>
               <Text fontWeight="semibold" mb={1}>Request Body ({requestBody.format}):</Text>
               {requestBody.description && <Text fontSize="sm" mb={1}>{requestBody.description}</Text>}
               <SyntaxHighlighter language="json" style={tomorrow} customStyle={{ fontSize: "0.85em", borderRadius: "md" }}>
                 {requestBody.example}
               </SyntaxHighlighter>
             </Box>
          )}

          <Box>
             <Text fontWeight="semibold" mb={1}>Response:</Text>
             <Text fontSize="sm">{responseDesc}</Text>
          </Box>

          <Box>
             <Text fontWeight="semibold" mb={1}>Example Curl:</Text>
             <Code display="block" whiteSpace="pre-wrap" p={2} borderRadius="md" bg="gray.200" fontSize="sm">
               {curlExample}
             </Code>
          </Box>

          {notes && notes.length > 0 && (
             <Box>
                {notes.map((note, i) => (
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
    <Flex direction={{ base: "column", md: "row" }} p={5} gap={6}>

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

          <Heading size="lg" mt={8} mb={4}  bgGradient='linear(to-l, #44666C, #A7C4A3)'
          bgClip='text'
          fontSize={{base: "3xl",sm: "3xl", md: "3xl", lg: "3xl",xl: "3xl"}}
          fontWeight='extrabold'
          marginBottom="0.2em">Re-Glyco APIs</Heading>
          <Accordion allowMultiple>
             <ApiEndpoint
                method="POST"
                path="/api/reglyco/init"
                description="Initializes the Re-Glyco process. Fetches protein structure (AlphaFold/RCSB) by ID, uses a previously uploaded file, or accepts a direct file upload. Identifies potential glycosylation sites and returns protein info, sequence, available sites, UniProt data (if applicable), and glycan configurations. Can also be used to fetch only glycan configurations."
                requestBody={{
                    format: "application/json OR multipart/form-data",
                    example: JSON.stringify(
                        {
                          protID: "P01857",
                          isUpload: false,
                          configsOnly: false
                        },
                        null,
                        2
                      ),
                    description: "Use JSON to fetch by ID or reference an upload. Use multipart/form-data with a 'protFile' field to upload directly."
                }}
                responseDesc="200 OK with JSON containing protein details (`id`, `filename`, `requestURL`, `sequence`), `glycosylation` info (available sites, UniProt data), and `configurations`. If `configsOnly` is true, returns only `configurations`. Errors on 400/404/500."
                curlExample={`# Fetch by ID:\ncurl -X POST ${apiUrl}/api/reglyco/init -H "Content-Type: application/json" -d '{"protID": "P01857"}'\n\n# Upload file:\ncurl -X POST ${apiUrl}/api/reglyco/init -F "protFile=@/path/to/your/file.pdb"`}
                notes={[
                    "Fetches from AlphaFold first, then RCSB if ID is provided.",
                    "Returns .cif filename/URL if fetched from AlphaFold CIF.",
                    "Glycan configurations are cached server-side."
                ]}
             />
             <ApiEndpoint
                method="POST"
                path="/api/reglyco/job"
                description="Executes a Re-Glyco job: 'scan' (checks N-glycosylation sequons), 'optimization' (attaches selected glycans with optimization), or 'ensemble' (generates conformational ensemble)."
                requestBody={{
                    format: "application/json",
                    example: JSON.stringify(
                        {
                          jobId: "<unique-job-identifier>",
                          jobType: "<scan|optimization|ensemble>",
                          filename: "<protein.pdb>",
                          protFileBase64: "<base64_string>",
                          selectedGlycans: { "ResID_Chain": "GlyTouCan/IUPAC", "...": "..." },
                          outputFormat: "PDB",
                          wiggleAngle: 60,
                          populationSize: 50,
                          maxGenerations: 100,
                          wiggleAttempts: 10,
                          ensembleSize: 10,
                          calculateSASA: true,
                          effortLevel: 5,
                          checkSteric: true,
                        },
                        null,
                        2
                      ),
                    description: "Provide job parameters. `selectedGlycans` maps residue locations (e.g., '50_A') to glycan identifiers. Include optimization or ensemble parameters as needed."
                }}
                responseDesc="200 OK with JSON containing job results: `output` (path to main result file), `box` (log messages). Scan/Optimization also include `clash` (boolean) and `results` (list). Ensemble also includes `sasa` (path) and `plot` (path). Errors on 400/500."
                curlExample={`# Scan Job:\ncurl -X POST ${apiUrl}/api/reglyco/job -H "Content-Type: application/json" -d '{"jobId": "job1", "jobType": "scan", "filename": "P01857.pdb"}'\n\n# Optimization Job:\ncurl -X POST ${apiUrl}/api/reglyco/job -H "Content-Type: application/json" -d '{"jobId": "job2", "jobType": "optimization", "filename": "P01857.pdb", "selectedGlycans": {"50_A": "G00031MO"}}'`}
                notes={[
                    "Use `filename` obtained from the `/api/reglyco/init` response.",
                    "Alternatively, provide `protFileBase64` to send the file content directly.",
                    "Ensure `jobId` is unique for each job run.",
                    "Returned `output` filepath are saved in the server's `output` directory.",
                    `E.g 'output': 'unique-job-id/all.pdb is at ${apiUrl}/output/unique-job-id/all.pdb'`,
                ]}
             />
          </Accordion>

          <Heading mt={8} mb={4} bgGradient='linear(to-l, #44666C, #A7C4A3)'
          bgClip='text'
          fontSize={{base: "3xl",sm: "3xl", md: "3xl", lg: "3xl",xl: "3xl"}}
          fontWeight='extrabold'
          marginBottom="0.2em">GlycoShape structure viewer</Heading>
          <Text fontSize="sm" mb={4} p={2}>
            The GlycoShape structure viewer is a web-based tool for visualizing glycan structures. It allows users to view glycan structures in 3D using GlyTouCan identifiers or IUPAC names.  
            </Text>
            <Box borderWidth={1} borderRadius="md" overflow="hidden" mb={6} bg="gray.50" p={2}>
              <Text fontSize="sm" mb={2} fontWeight="medium">
                Example Viewer (GlyTouCan ID: G00028MO) URL: {apiUrl}/view?glytoucan=G00028MO
              </Text>
              
              <Box as="iframe"
                src={`${apiUrl}/view?glytoucan=G00028MO`}
                width="100%"
                height="320px"
                border="0"
                borderRadius="md"
                bg="white"
                title="GlycoShape Structure Viewer"
                />
            </Box>

      </Box>

      <APITester />

    </Flex>
  );
};

export default API;
