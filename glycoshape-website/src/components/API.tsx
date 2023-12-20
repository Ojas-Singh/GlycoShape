import React from 'react';
import {
  Link,
  Box,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Text,
  Code
} from "@chakra-ui/react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeDisplayProps {
  code: string;
}

const pythonCode = `
#demo code for uploading pdb file and downloading processed pdb file

import requests
import os
import json
from datetime import datetime

# Constants
API_BASE_URL = "https://glycoshape.org" #GlycoShape API URL
UPLOAD_ENDPOINT = "/api/upload_pdb"
PROCESS_ENDPOINT = "/api/process_pdb"
UPLOAD_DIR = "output"  # Local directory to save downloaded PDB files

# Ensure upload directory exists
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

def upload_pdb(file_path):
    """Uploads a PDB file and gets glycosylation configurations."""
    with open(file_path, 'rb') as file:
        files = {'pdbFile': file}
        response = requests.post(API_BASE_URL + UPLOAD_ENDPOINT, files=files)
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Error uploading PDB file: {response.json()}")

def process_pdb(uniprot_id, glycan_configurations):
    """Processes a PDB file with given glycan configurations."""
    data = {
        'uniprotID': uniprot_id,
        'selectedGlycans': glycan_configurations
    }
    response = requests.post(API_BASE_URL + PROCESS_ENDPOINT, json=data)
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Error processing PDB file: {response.json()}")

def download_processed_pdb(file_name):
    """Downloads the processed PDB file."""
    response = requests.get(f"{API_BASE_URL}/output/{file_name}")
    if response.status_code == 200:
        with open(os.path.join(UPLOAD_DIR, file_name), 'wb') as file:
            file.write(response.content)
    else:
        raise Exception("Error downloading processed PDB file")

def main():
    # Example usage
    pdb_file_path = 'AF-P63279-F1-model_v4.pdb'  # Replace with actual PDB file path
    upload_response = upload_pdb(pdb_file_path)


#       Response layout of upload_pdb
#     {
#     "configuration": [     -----> This is the glycan_configurations we use for the next step
#         {
#             "glycanIDs": [
#                 "Fuc(a1-3)[Gal(b1-4)]GlcNAc(b1-3)Gal(b1-4)[Fuc(a1-3)]GlcNAc(b1-4)Glc",
#                 "GlcNAc(b1-6)GalNAc",
#                 "GlcNAc"
#             ],
#             "residueChain": "A",
#             "residueID": 2,
#             "residueName": "SER",
#             "residueTag": 2
#         },
#         {
#             "glycanIDs": [
#                 "GlcNAc(b1-6)GalNAc",
#                 "GlcNAc(a1-4)Gal(b1-4)GlcNAc(b1-6)[GlcNAc(a1-4)Gal(b1-3)]GalNAc",
#                 "Neu5Ac(a2-3)Gal(b1-4)GlcNAc(b1-3)GalNAc",
#                 "GlcNAc"
#             ],
#             "residueChain": "A",
#             "residueID": 135,
#             "residueName": "THR",
#             "residueTag": 135
#         }
#     ],
#     "glycosylation_locations": {   -----> This is the glycosylation_locations not relevant here
#         "glycosylations": [
#             [
#                 2,
#                 2,
#                 "A"
#             ],
#             [
#                 135,
#                 135,
#                 "A"
#             ]
#         ],
#         "sequence": "MSGIALSRLAQERKAWRKDHPFGFVAVPTKNPDGTMNLMNWECAIPGKKGTPWEGGLFKLRMLFKDDYPSSPPKCKFEPPLFHPNVYPSGTVCLSILEEDKDWRPAITIKQILLGIQELLNEPNIQDPAQAEAYTIYCQNRVEYEKRVRAQAKKFAPS",
#         "sequenceLength": 158
#     },
#     "requestURL": "https://glycoshape.io/output/AF-P63279-F1-model_v4.pdb",    -----> This is the URL of the uploaded pdb file
#     "uniprot": "AF-P63279-F1-model_v4.pdb"  ---> This is the fileid we use for the next step (its key is uniprot but it is actually the filename of uploaded pdb file)
# }


    glycan_configurations = {
        '135_A': "GlcNAc",   # ---> residueID_residueChain :  glycanID (glycanID of choice from corresponding configurations)
        '2_A': "Fuc(a1-3)[Gal(b1-4)]GlcNAc(b1-3)Gal(b1-4)[Fuc(a1-3)]GlcNAc(b1-4)Glc"
    }


    file_id = upload_response['uniprot']
    print(f"Uploaded PDB file: {pdb_file_path}")
    process_response = process_pdb(file_id, glycan_configurations)
    output_file_name = process_response['output']
    download_processed_pdb(output_file_name)
    print(f"Processed PDB file downloaded: {output_file_name}")

#       Response layout of process_pdb
#     {
#     "box": "Calculation started\nResidue : 135A\n GlcNAc ..... ---> Processing log
#     "clash": true,    ----> Overall clash status
#     "output": "AF-P63279-F1-model_v4_reglyco_202312190141.pdb",   ----> This is the filename of the processed pdb file with reglyco_YYYYMMDDHHMMSS in the end
# }

if __name__ == "__main__":
    main()

`;

const API: React.FC = () => {
  return (
    <div>
    <Box p={5} maxWidth="800px" margin="0 auto">
      {/* <iframe
                src={`https://gist.github.com/Ojas-Singh/d112d260d41eb1875528376d84a4de9c`}
                style={{ width: '100%', overflow: 'hidden' }}
                scrolling="no"
                frameBorder="0"
            ></iframe> */}
      <Text 
          bgGradient='linear(to-l, #44666C, #A7C4A3)'
          bgClip='text'
          fontSize={{base: "4xl",sm: "4xl", md: "5xl", lg: "6xl",xl: "6xl"}}
          fontWeight='extrabold'
          marginBottom="0.2em"
        >
          API Documentation
        </Text>
        <Text color='#B195A2' alignSelf={"left"} fontSize={'xs'}>
            Not stabliized yet. Please contact us <Link href="mailto:OJAS.SINGH.2023@mumail.ie">here</Link> if you have any questions.
            </Text>

            <Text 
          bgGradient='linear(to-l, #44666C, #A7C4A3)'
          bgClip='text'
          fontSize={{base: "3xl",sm: "3xl", md: "3xl", lg: "3xl",xl: "3xl"}}
          fontWeight='extrabold'
          marginBottom="0.2em"
        >
          GlycoShape APIs
        </Text>
      <Accordion 
      // defaultIndex={[0]}
       allowMultiple>

      
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
        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">
            GET /api/fetch_glytoucan
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <Text>Function: fetch_glytoucan</Text>
            <Text>Description: This endpoint returns a JSON containing information about the queried glycan.</Text>
            <Code>
              {`curl "https://glycoshape.org/api/fetch_glytoucan?id=GS00180"`}
            </Code>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">
            Access PDB structure
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <Text>All the database files can be accessed at <Link color='#B195A2' href="https://glycoshape.org/database">https://glycoshape.org/database</Link></Text>
            <Text>example: for glycan <Code>IUPAC_name</Code> and cluster <Code>i</Code> </Text>
            <Code p="1">
              
              {`curl "https://glycoshape.org/database/{IUAPC_name}/PDB_format_HETATM/{IUPAC_name}_cluster{i}_alpha.PDB.pdb"`}
            </Code>
            <Text>This will fetch cluster pdb of cluster <Code>i</Code></Text>
             Please check the database folder for other formats and more information.
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">
            Database Information JSON 
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <Text>Database information can be accessed at <Link color='#B195A2' href="https://glycoshape.org/database/GLYCOSHAPE.json">https://glycoshape.org/database/GLYCOSHAPE.json</Link></Text>
            
          </AccordionPanel>
        </AccordionItem>


        


      </Accordion>

      <Text 
          bgGradient='linear(to-l, #44666C, #A7C4A3)'
          bgClip='text'
          fontSize={{base: "3xl",sm: "3xl", md: "3xl", lg: "3xl",xl: "3xl"}}
          fontWeight='extrabold'
          marginBottom="0.2em"
        >
          Re-Glyco APIs
        </Text>
        <Accordion  allowMultiple>
        {/* Endpoint 1 */}
        


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


        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">
              Python code example
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
          <Box p="4" borderWidth="1px" borderRadius="lg" maxWidth="1000px"  overflow="hidden">
            <SyntaxHighlighter language="python" style={tomorrow}>
                {pythonCode}
            </SyntaxHighlighter>
        </Box>
          </AccordionPanel>
        </AccordionItem>
        

      </Accordion>
      
      
     
    </Box>

    </div>
    
  );
}

export default API;
