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
} from '@chakra-ui/react';

const DATABASE_BASE_URL = 'https://glycoshape.io/database/';
const TOTAL_ENTRIES = 815;
// Assuming a consistent PDB path structure based on the example
const PDB_SUBPATH = 'PDB_format_ATOM/cluster0_alpha.PDB.pdb';

interface EntryStatus {
id: string;
imageUrl: string;
dataJsonUrl: string;
pdbUrl: string;
imageExists: boolean | null;
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

const DatabaseHealth: React.FC = () => {
const [entries, setEntries] = useState<EntryStatus[]>([]);
const [loadingInitial, setLoadingInitial] = useState(true);
const theme = useTheme();

useEffect(() => {
    const fetchAllStatuses = async () => {
        setLoadingInitial(true);
        const entryPromises = [];
        const initialEntries: EntryStatus[] = [];

        for (let i = 1; i <= TOTAL_ENTRIES; i++) {
            const entryId = `GS${String(i).padStart(5, '0')}`;
            const entryBaseUrl = `${DATABASE_BASE_URL}${entryId}/`;
            const entryData: EntryStatus = {
                id: entryId,
                imageUrl: `${entryBaseUrl}snfg.svg`,
                dataJsonUrl: `${entryBaseUrl}data.json`,
                pdbUrl: `${entryBaseUrl}${PDB_SUBPATH}`,
                imageExists: null,
                dataJsonExists: null,
                pdbExists: null,
                loading: true,
            };
            initialEntries.push(entryData);
        }
        setEntries(initialEntries); // Set initial state with loading true

        // Sequentially update status to avoid overwhelming the browser/network
        for (let i = 0; i < initialEntries.length; i++) {
            const entry = initialEntries[i];
            const imageExists = await checkUrlExists(entry.imageUrl);
            const dataJsonExists = await checkUrlExists(entry.dataJsonUrl);
            const pdbExists = await checkUrlExists(entry.pdbUrl);

            setEntries((prevEntries) =>
                prevEntries.map((e) =>
                    e.id === entry.id
                        ? { ...e, imageExists, dataJsonExists, pdbExists, loading: false }
                        : e
                )
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
                <Spinner size="xl" />
                <Text ml={4}>Loading entry list...</Text>
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
                >
                    <VStack spacing={3} align="stretch">
                        <HStack justify="space-between">
                            <Heading size="sm">{entry.id}</Heading>
                            {entry.loading && <Spinner size="sm" />}
                        </HStack>

                        <Center minH="100px" bg="gray.100" borderRadius="md">
                            {entry.imageExists === true ? (
                                <Image
                                    src={entry.imageUrl}
                                    alt={`${entry.id} SNFG`}
                                    boxSize="100px"
                                    objectFit="contain"
                                    fallback={<Text fontSize="sm" color="gray.500">Image loading...</Text>}
                                    onError={(e) => {
                                        // Handle potential late loading errors if HEAD check passed but GET fails
                                        e.currentTarget.style.display = 'none'; // Hide broken image icon
                                        setEntries(prev => prev.map(e => e.id === entry.id ? {...e, imageExists: false} : e));
                                    }}
                                />
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
                 <Spinner size="lg" />
                 <Text ml={4}>Checking file statuses ({entries.filter(e => !e.loading).length}/{TOTAL_ENTRIES})...</Text>
             </Center>
         )}
         {!loadingInitial && entries.length > 0 && (
                <Center mt={8}>
                    <Text color="gray.600">Finished checking all {TOTAL_ENTRIES} entries.</Text>
                </Center>
         )}
    </Box>
);
};

export default DatabaseHealth;