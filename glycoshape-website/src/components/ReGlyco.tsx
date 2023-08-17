import React, { useState } from 'react';
import { Input, Drawer, DrawerBody, DrawerFooter, DrawerHeader, DrawerOverlay, DrawerContent, Button, Box, Text } from "@chakra-ui/react";
import axios from 'axios';

function ReGlyco() {
  const [isOpen, setIsOpen] = useState(true);
  const [uniprotID, setUniprotID] = useState("");
  const [glycosylationLocations, setGlycosylationLocations] = useState(null);
  const [requestURL, setRequestURL] = useState("/litemol/index.html?pdbUrl=https://healoor.me/downloads/out.pdb");

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const fetchProtein = async () => {
      try {
          const response = await axios.post('https://glycoshape.io/api/uniprot', { uniprot: uniprotID });
          setGlycosylationLocations(response.data.glycosylation_locations);
          setRequestURL(`/litemol/index.html?pdbUrl=${response.data.requestURL}`);
      } catch (error) {
          console.error("Error fetching protein:", error);
      }
  };

  return (
      <>
          <Button onClick={onOpen}>Open Drawer</Button>

          <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
              <DrawerOverlay>
                  <DrawerContent>
                      <DrawerHeader>Enter UniProt ID or Upload PDB</DrawerHeader>

                      <DrawerBody>
                          <Input placeholder="UniProt ID" value={uniprotID} onChange={(e) => setUniprotID(e.target.value)} />
                          {/* You can add the file uploader here */}
                      </DrawerBody>

                      <DrawerFooter>
                          <Button variant="outline" mr={3} onClick={onClose}>
                              Cancel
                          </Button>
                          <Button colorScheme="blue" onClick={fetchProtein}>
                              Submit
                          </Button>
                      </DrawerFooter>
                  </DrawerContent>
              </DrawerOverlay>
          </Drawer>

          {/* Main content */}
          <Box p={5}>
              <iframe 
                  width="100%" 
                  height="500" 
                  src={requestURL} 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                  title="Protein Viewer"
              ></iframe>

              {glycosylationLocations && (
                  <Box mt={4}>
                      <Text fontWeight="bold">Glycosylation Locations:</Text>
                      <pre>{JSON.stringify(glycosylationLocations, null, 2)}</pre>
                  </Box>
              )}
          </Box>
      </>
  );
}

export default ReGlyco;
