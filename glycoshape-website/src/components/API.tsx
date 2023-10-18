import React from 'react';
import {
  Box,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Text,
  Code
} from "@chakra-ui/react";

const API: React.FC = () => {
  return (
    <Box p={5} maxWidth="800px" margin="0 auto">
      <Text 
          bgGradient='linear(to-l, #44666C, #A7C4A3)'
          bgClip='text'
          fontSize={{base: "4xl",sm: "4xl", md: "5xl", lg: "6xl",xl: "6xl"}}
          fontWeight='extrabold'
          marginBottom="0.2em"
        >
          API Documentation
        </Text>

      <Accordion defaultIndex={[0]} allowMultiple>
        {/* Endpoint 1 */}
        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">
              GET /api/available_glycans
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <Text>Function: list_glycans</Text>
            <Text>Description: This endpoint returns a list of available glycans from a specified directory in the server.</Text>
            <Code>
              {`curl -X GET https://glycoshape.io/api/available_glycans`}
            </Code>
          </AccordionPanel>
        </AccordionItem>

        {/* Endpoint 2 */}
        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">
              POST /api/search
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <Text>Function: search</Text>
            <Text>Description: This endpoint accepts a search string in the request body and returns a list of results based on the search string. If the search string is empty, it returns a random list of results from a specified directory.</Text>
            <Code>
              {`curl -X POST https://glycoshape.io/api/search -H "Content-Type: application/json" -d "{\\"search_string\\": \\"your_search_string_here\\"}"`}
            </Code>
          </AccordionPanel>
        </AccordionItem>

        {/* Endpoint 3 */}
        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">
              POST /api/uniprot
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <Text>Function: uniprot</Text>
            <Text>Description: This endpoint accepts a UniProt ID in the request body and fetches the corresponding protein data from the AlphaFold database and the UniProt API, returning detailed information including the sequence, glycosylation sites, and available glycans.</Text>
            <Code>
  {`curl -X POST https://glycoshape.io/api/uniprot -H "Content-Type: application/json" -d "{\\"uniprot\\": \\"your_uniprot_id_here\\"}"`}
</Code>

          </AccordionPanel>
        </AccordionItem>

        {/* Endpoint 4 */}
        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">
              POST /api/process_uniprot
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <Text>Function: process_uniprot</Text>
            <Text>Description: This endpoint processes data related to a UniProt ID. It accepts a JSON payload containing the UniProt ID and selected glycans, then returns information about the processed data.</Text>
            <Code>
              {`curl -X POST https://glycoshape.io/api/process_uniprot -H "Content-Type: application/json" -d "{\\"uniprotID\\": \\"your_uniprot_id_here\\", \\"selectedGlycans\\": {\\"glycan1\\": \\"value1\\", \\"glycan2\\": \\"value2\\"}}\\"`}
            </Code>
          </AccordionPanel>
        </AccordionItem>

        {/* Endpoint 5 */}
        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">
              POST /api/upload_pdb
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <Text>Function: upload_pdb</Text>
            <Text>Description: This endpoint allows for the uploading of a PDB file to the server. It saves the uploaded file in a specified directory on the server.</Text>
            <Code>
              {`curl -X POST https://glycoshape.io/api/upload_pdb -F "pdbFile=@path_to_your_pdb_file_here"`}
            </Code>
          </AccordionPanel>
        </AccordionItem>

        {/* Endpoint 6 */}
        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">
              POST /api/process_pdb
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <Text>Function: process_pdb</Text>
            <Text>Description: This endpoint processes a PDB file. It accepts a JSON payload containing a UniProt ID and a list of selected glycans, then attaches the glycans to the protein structure and returns a new PDB file with the modifications.</Text>
            <Code>
              {`curl -X POST https://glycoshape.io/api/process_pdb -H "Content-Type: application/json" -d '{"uniprotID": "your_uniprot_id_here", "selectedGlycans": {"location1": "glycan1", "location2": "glycan2"}}'`}
            </Code>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Box>
  );
}

export default API;
