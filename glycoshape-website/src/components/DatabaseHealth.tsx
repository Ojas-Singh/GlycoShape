import React, { useState, useEffect } from 'react';

import { CheckCircleIcon, WarningTwoIcon } from '@chakra-ui/icons';
import {
Box,
Heading,
SimpleGrid,
Image,
VStack,
HStack,
Text,
Icon,
Spinner,
Center,
useTheme,
Tag,
Modal,
ModalOverlay,
ModalContent,
ModalHeader,
ModalFooter,
ModalBody,
ModalCloseButton,
Button,
useDisclosure,
} from '@chakra-ui/react';

const DATABASE_BASE_URL = 'https://glycoshape.io/database/';
const TOTAL_ENTRIES = 950;
// Assuming a consistent PDB path structure based on the example
const PDB_SUBPATH = 'PDB_format_ATOM/cluster0_alpha.PDB.pdb';

interface EntryStatus {
id: string;
imageUrl: string;
dataJsonUrl: string;
pdbUrl: string;
imageExists: boolean | null;
imageLoaded: boolean;
dataJsonExists: boolean | null;
pdbExists: boolean | null;
loading: boolean;
}

const checkUrlExists = async (url: string): Promise<boolean> => {
try {
    const response = await fetch(url, { method: 'HEAD', mode: 'cors' });
    // Allow 405 Method Not Allowed if HEAD is not supported, try GET
    if (!response.ok && response.status !== 405) {
            return false;
    }
    if (response.status === 405) {
            // Fallback to GET if HEAD is not allowed
            const getResponse = await fetch(url, { method: 'GET', mode: 'cors' });
            return getResponse.ok;
    }
    return response.ok;
} catch (error) {
    console.error(`Error checking URL ${url}:`, error);
    return false;
}
};

const checkFolderExists = async (folderUrl: string): Promise<boolean> => {
try {
    const response = await fetch(folderUrl, { method: 'HEAD', mode: 'cors' });
    // For folders, we might get different status codes depending on server config
    // Generally 200, 301, 302, or 403 (forbidden but exists) indicate the folder exists
    if (response.ok || response.status === 403 || response.status === 301 || response.status === 302) {
        return true;
    }
    if (response.status === 405) {
        // Fallback to GET if HEAD is not allowed
        const getResponse = await fetch(folderUrl, { method: 'GET', mode: 'cors' });
        return getResponse.ok || getResponse.status === 403;
    }
    return false;
} catch (error) {
    console.error(`Error checking folder ${folderUrl}:`, error);
    return false;
}
};

// Helper function to preload images
const preloadImage = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
        const img = new window.Image(); // <-- Fix: use window.Image for browser context
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
};

// Helper function to process items in batches
const processBatch = async <T, R>(
    items: T[],
    batchSize: number,
    processor: (item: T) => Promise<R>
): Promise<R[]> => {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(processor));
        results.push(...batchResults);
    }
    
    return results;
};

const DatabaseHealth: React.FC = () => {
const [entries, setEntries] = useState<EntryStatus[]>([]);
const [loadingInitial, setLoadingInitial] = useState(true);
const [totalExistingFolders, setTotalExistingFolders] = useState(0);
const [folderCheckProgress, setFolderCheckProgress] = useState(0);
const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
const { isOpen, onOpen, onClose } = useDisclosure();
const theme = useTheme();

const handleEntryClick = (entryId: string) => {
    setSelectedEntryId(entryId);
    onOpen();
};

useEffect(() => {
    const fetchAllStatuses = async () => {
        setLoadingInitial(true);
        
        // Generate all folder URLs to check
        const folderChecks = Array.from({ length: TOTAL_ENTRIES }, (_, i) => {
            const entryId = `GS${String(i + 1).padStart(5, '0')}`;
            const entryBaseUrl = `${DATABASE_BASE_URL}${entryId}/`;
            return { entryId, entryBaseUrl };
        });

        // Check folders in parallel batches of 20
        const BATCH_SIZE = 100;
        const existingEntries: EntryStatus[] = [];
        
        for (let i = 0; i < folderChecks.length; i += BATCH_SIZE) {
            const batch = folderChecks.slice(i, i + BATCH_SIZE);
            
            const batchResults = await Promise.all(
                batch.map(async ({ entryId, entryBaseUrl }) => {
                    const folderExists = await checkFolderExists(entryBaseUrl);
                    return folderExists ? {
                        id: entryId,
                        imageUrl: `${entryBaseUrl}snfg.svg`,
                        dataJsonUrl: `${entryBaseUrl}data.json`,
                        pdbUrl: `${entryBaseUrl}${PDB_SUBPATH}`,
                        imageExists: null,
                        imageLoaded: false,
                        dataJsonExists: null,
                        pdbExists: null,
                        loading: true,
                    } : null;
                })
            );
            
            // Add existing folders to the list
            batchResults.forEach(result => {
                if (result) existingEntries.push(result);
            });
            
            // Update progress
            setFolderCheckProgress(i + batch.length);
        }

        setTotalExistingFolders(existingEntries.length);
        setEntries(existingEntries);

        // Now check file statuses for existing folders in parallel batches
        const checkFileStatus = async (entry: EntryStatus) => {
            const [imageExists, dataJsonExists, pdbExists] = await Promise.all([
                checkUrlExists(entry.imageUrl),
                checkUrlExists(entry.dataJsonUrl),
                checkUrlExists(entry.pdbUrl)
            ]);
            
            return {
                ...entry,
                imageExists,
                dataJsonExists,
                pdbExists,
                loading: false
            };
        };

        // Process file checks in batches of 10 to avoid overwhelming the server
        const FILE_BATCH_SIZE = 100;
        const entriesWithFileStatus: EntryStatus[] = [];
        
        for (let i = 0; i < existingEntries.length; i += FILE_BATCH_SIZE) {
            const batch = existingEntries.slice(i, i + FILE_BATCH_SIZE);
            
            const updatedBatch = await Promise.all(
                batch.map(checkFileStatus)
            );
            
            // Store completed entries
            entriesWithFileStatus.push(...updatedBatch);
            
            // Update state with completed batch
            setEntries(prevEntries => 
                prevEntries.map(entry => {
                    const updated = updatedBatch.find(u => u.id === entry.id);
                    return updated || entry;
                })
            );
        }

        // Now preload images for entries that have existing images
        const entriesWithImages = entriesWithFileStatus.filter(entry => entry.imageExists === true);
        
        // Load images in batches of 5 to avoid overwhelming the browser
        const IMAGE_BATCH_SIZE = 50;
        for (let i = 0; i < entriesWithImages.length; i += IMAGE_BATCH_SIZE) {
            const batch = entriesWithImages.slice(i, i + IMAGE_BATCH_SIZE);
            
            await Promise.all(
                batch.map(async (entry) => {
                    const imageLoaded = await preloadImage(entry.imageUrl);
                    setEntries(prevEntries => 
                        prevEntries.map(e => 
                            e.id === entry.id ? { ...e, imageLoaded } : e
                        )
                    );
                })
            );
        }

        setLoadingInitial(false);
    };

    fetchAllStatuses();
}, []);

return (
    <Box p={5}>
        <Heading as="h1" mb={6} textAlign="center">
            Database Entry Health Report
        </Heading>

        {loadingInitial && entries.length === 0 && (
            <Center h="200px">
                <VStack spacing={3}>
                    <Spinner size="xl" />
                    <Text>Checking which folders exist...</Text>
                    <Text fontSize="sm" color="gray.600">
                        Progress: {folderCheckProgress}/{TOTAL_ENTRIES}
                    </Text>
                </VStack>
            </Center>
        )}

        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }} spacing={6}>
            {entries.map((entry) => (
                <Box
                    key={entry.id}
                    borderWidth="1px"
                    borderRadius="lg"
                    overflow="hidden"
                    p={4}
                    bg={entry.loading ? 'gray.50' : 'white'}
                    opacity={entry.loading ? 0.6 : 1}
                    transition="opacity 0.3s ease-in-out"
                    cursor="pointer"
                    _hover={{ transform: 'scale(1.02)', boxShadow: 'lg' }}
                    onClick={() => handleEntryClick(entry.id)}
                >
                    <VStack spacing={3} align="stretch">
                        <HStack justify="space-between">
                            <Heading size="sm">{entry.id}</Heading>
                            {entry.loading && <Spinner size="sm" />}
                        </HStack>

                        <Center minH="100px" bg="gray.100" borderRadius="md">
                            {entry.imageExists === true && entry.imageLoaded ? (
                                <Image
                                    src={entry.imageUrl}
                                    alt={`${entry.id} SNFG`}
                                    boxSize="100px"
                                    objectFit="contain"
                                />
                            ) : entry.imageExists === true && !entry.imageLoaded ? (
                                <Spinner size="sm" />
                            ) : entry.imageExists === false ? (
                                 <Icon as={WarningTwoIcon} color="red.500" boxSize={6} />
                            ) : (
                                <Spinner size="xs" /> // Show spinner while checking image
                            )}
                        </Center>

                        <VStack align="start" spacing={1}>
                            <HStack>
                                {entry.dataJsonExists === true ? (
                                    <Icon as={CheckCircleIcon} color="green.500" />
                                ) : entry.dataJsonExists === false ? (
                                    <Icon as={WarningTwoIcon} color="red.500" />
                                ) : (
                                    <Spinner size="xs" mr={1} />
                                )}
                                <Text fontSize="sm">data.json</Text>
                            </HStack>
                            <HStack>
                                {entry.pdbExists === true ? (
                                    <Icon as={CheckCircleIcon} color="green.500" />
                                ) : entry.pdbExists === false ? (
                                    <Icon as={WarningTwoIcon} color="red.500" />
                                ) : (
                                    <Spinner size="xs" mr={1} />
                                )}
                                <Text fontSize="sm">PDB File</Text>
                                 {entry.pdbExists === false && !entry.loading && (
                                     <Tag size="sm" colorScheme="orange" ml="auto">Check Path</Tag>
                                 )}
                            </HStack>
                        </VStack>
                    </VStack>
                </Box>
            ))}
        </SimpleGrid>
         {loadingInitial && entries.length > 0 && (
             <Center mt={8}>
                 <VStack spacing={2}>
                     <Spinner size="lg" />
                     <Text>Checking file statuses ({entries.filter(e => !e.loading).length}/{totalExistingFolders})...</Text>
                 </VStack>
             </Center>
         )}
         {!loadingInitial && entries.length > 0 && (
                <Center mt={8}>
                    <Text color="gray.600">
                        Found {totalExistingFolders} existing folders out of {TOTAL_ENTRIES} total entries. 
                        Finished checking all files.
                    </Text>
                </Center>
         )}

        {/* Modal for viewing glycan details */}
        <Modal isOpen={isOpen} onClose={onClose} size="6xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Glycan Details - {selectedEntryId}</ModalHeader>
                <ModalCloseButton />
                <ModalBody p={0}>
                    {selectedEntryId && (
                        <Box height="80vh" width="100%">
                            <iframe
                                src={`/glycan?id=${selectedEntryId}`}
                                width="100%"
                                height="100%"
                                style={{ border: 'none' }}
                                title={`Glycan ${selectedEntryId}`}
                            />
                        </Box>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button colorScheme="blue" mr={3} onClick={onClose}>
                        Close
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    </Box>
);
};

export default DatabaseHealth;