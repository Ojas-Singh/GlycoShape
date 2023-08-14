// ReGlyco.tsx
import React from 'react';
import { Box, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon } from "@chakra-ui/react";

const FAQ: React.FC = () => {
  return (
    <Box >
      <iframe 
        width="100%" 
        height="500" 
        src="/litemol/index.html?pdbUrl=https://healoor.me/downloads/out.pdb" 
        frameBorder="0" 
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
        allowFullScreen
        title="Unique Title Here"
      ></iframe>
    </Box>
  );
}

export default FAQ;
