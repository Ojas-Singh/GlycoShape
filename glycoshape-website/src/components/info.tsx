// ReGlyco.tsx
import React, { useState } from 'react';
import {
  Box,
  Input,
  Button,
  InputGroup,
  InputRightElement,
  Text,
  VStack,
  HStack,
} from '@chakra-ui/react';
import { AttachmentIcon } from '@chakra-ui/icons';

const ReGlyco: React.FC = () => {
  const [uniprotId, setUniprotId] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name);
    }
  };

  return (
    <VStack spacing={4} alignItems="stretch">
      <Text fontSize="xl">ReGlyco</Text>
      <HStack spacing={4}>
        <InputGroup>
          <Input
            placeholder="Enter UniProt ID"
            value={uniprotId}
            onChange={(e) => setUniprotId(e.target.value)}
          />
          <InputRightElement width="4.5rem">
            <Button h="1.75rem" size="sm" onClick={() => console.log('UniProt ID:', uniprotId)}>
              Submit
            </Button>
          </InputRightElement>
        </InputGroup>
        <Box>
          <Input
            type="file"
            accept=".pdb"
            onChange={handleFileChange}
            hidden
            id="fileUploader"
          />
          <label htmlFor="fileUploader">
            <Button as="span" leftIcon={<AttachmentIcon />} size="sm">
              Upload PDB
            </Button>
          </label>
        </Box>
      </HStack>
    </VStack>
  );
};

export default ReGlyco;

//     <Box >
//       <iframe 
//         width="100%" 
//         height="500" 
//         src="/litemol/index.html?pdbUrl=https://healoor.me/downloads/out.pdb" 
//         frameBorder="0" 
//         allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
//         allowFullScreen
//         title="Unique Title Here"
//       ></iframe>
//     </Box>
//   );
// }

// export default FAQ;
