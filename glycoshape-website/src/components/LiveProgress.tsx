import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Flex,
  Image,
  Text,
  Spinner,
  VStack,
  Progress,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useDisclosure,
  IconButton,
  Tooltip,
  Button,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons';
import Papa from 'papaparse'; // You'll need to install this: npm install papaparse @types/papaparse

interface LogEntry {
  timestamp: string;
  message: string;
}

interface ProcessData {
  job_id: string;
  status: 'in_progress' | 'finished' | 'error';
  progress: number;
  logs: LogEntry[];
  images: {
    image_url: string;
    caption: string;
  }[];
}

interface LiveProcessProps {
  jobId: string;
  apiUrl: string;
}

interface CsvData {
  headers: string[];
  rows: string[][];
}

const MotionBox = motion(Box);

const LiveProcess: React.FC<LiveProcessProps> = ({ jobId, apiUrl }) => {
  const [processData, setProcessData] = useState<ProcessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [prevLogCount, setPrevLogCount] = useState(0);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // Modal states
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [modalContent, setModalContent] = useState<{
    type: 'image' | 'csv';
    url: string;
    caption: string;
    csvData?: CsvData;
    columnTypes?: ('number' | 'string')[];
  } | null>(null);
  
  // CSV sorting states
  const [sortConfig, setSortConfig] = useState<{
    key: number;
    direction: 'ascending' | 'descending';
  } | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${apiUrl}/output/${jobId}/progress.json`);
        if (response.ok) {
          const data: ProcessData = await response.json();
          setProcessData((prevData) => {
            if (prevData && data.logs.length > prevData.logs.length) {
              setPrevLogCount(prevData.logs.length);
            }
            return data;
          });
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching process data:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [apiUrl, jobId]);

  // Function to check if a file is CSV (by extension)
  const isCSV = (url: string) => {
    return url.toLowerCase().endsWith('.csv');
  };

  // Function to load and parse CSV data
  const loadCSVData = async (url: string) => {
    try {
      const response = await fetch(`${apiUrl}/output/${url}`);
      const text = await response.text();
      
      return new Promise<CsvData>((resolve) => {
        Papa.parse(text, {
          complete: (result) => {
            // First row as headers
            const headers = result.data[0] as string[];
            // Rest as data rows
            const rows = result.data.slice(1) as string[][];
            resolve({ headers, rows });
          }
        });
      });
    } catch (err) {
      console.error('Error loading CSV:', err);
      return { headers: [], rows: [] };
    }
  };

  // Function to handle opening a modal with content
  const handleOpenModal = async (img: { image_url: string, caption: string }) => {
    if (isCSV(img.image_url)) {
      const csvData = await loadCSVData(img.image_url);
      
      // Pre-compute column types
      const columnTypes = csvData.headers.map((_, colIndex) => {
        const columnValues = csvData.rows.map(row => row[colIndex]);
        return detectColumnType(columnValues);
      });
      
      setModalContent({
        type: 'csv',
        url: img.image_url,
        caption: img.caption,
        csvData,
        columnTypes // Store the column types
      });
    } else {
      setModalContent({
        type: 'image',
        url: `${apiUrl}/output/${img.image_url}`,
        caption: img.caption
      });
    }
    onOpen();
  };

  // Function to sort CSV data
  const sortData = (columnIndex: number) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    
    if (sortConfig && sortConfig.key === columnIndex) {
      direction = sortConfig.direction === 'ascending' ? 'descending' : 'ascending';
    }
    
    setSortConfig({ key: columnIndex, direction });
  };

  // Function to detect the data type for a CSV column
  const detectColumnType = (column: string[]): 'number' | 'string' => {
    // Filter out undefined or empty values
    const validValues = column.filter(value => value !== undefined && value !== null && value !== '');
    
    // If no valid values or too few values, default to string
    if (validValues.length === 0) return 'string';
    
    // Sample a few values to determine the column type
    const sample = validValues.slice(0, Math.min(validValues.length, 5));
    
    // Check if all sampled values can be parsed as numbers
    const isNumeric = sample.every(value => {
      try {
        const trimmed = (value || '').trim();
        // Empty string is not a number
        if (trimmed === '') return false;
        // Check if it's a valid number (integer or float)
        return !isNaN(parseFloat(trimmed)) && isFinite(Number(trimmed));
      } catch (e) {
        // If any error occurs during parsing, it's not a number
        return false;
      }
    });
    
    return isNumeric ? 'number' : 'string';
  };

  // Function to get sorted rows with type-aware sorting
  const getSortedRows = (csvData?: CsvData) => {
    if (!csvData || !sortConfig) return csvData?.rows || [];
    
    const columnIndex = sortConfig.key;
    
    // First, detect the column type
    const columnValues = csvData.rows.map(row => row[columnIndex]);
    const columnType = detectColumnType(columnValues);
    
    return [...csvData.rows].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      // Sort based on detected type
      if (columnType === 'number') {
        const aNum = parseFloat(aValue);
        const bNum = parseFloat(bValue);
        
        if (sortConfig.direction === 'ascending') {
          return aNum - bNum;
        } else {
          return bNum - aNum;
        }
      } else {
        // String comparison
        if (sortConfig.direction === 'ascending') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      }
    });
  };

  if (loading || !processData) {
    return (
      <Flex align="center" justify="center" p={4}>
        <Spinner size="lg" />
        <Text ml={4}>Loading process data...</Text>
      </Flex>
    );
  }

  return (
    <>
      <Flex
        p={4}
        borderWidth="1px"
        borderRadius="lg"
        boxShadow="sm"
        overflow="hidden"
        h="600px"
      >
        {/* Left Panel: Terminal-like Logs & Progress */}
        <Box
          flex="1"
          pr={4}
          borderRight="1px solid #e2e8f0"
          display="flex"
          flexDirection="column"
          width="50%"
        >
          {/* Header with status and progress bar */}
          <Box mb={2}>
            <Text fontSize="2xl" fontWeight="bold" mb={2}>
              {processData.status === 'in_progress'
                ? `Processing: ${processData.progress}%`
                : processData.status === 'finished'
                ? 'Processing finished'
                : 'Error during processing.'}
            </Text>
            <Progress
              value={processData.progress}
              size="sm"
              borderRadius="full"
              mb={4}
              colorScheme="blue"
            />
          </Box>
          {/* Logs container (scrollable) */}
          <Box flex="1" overflowY="auto" position="relative">
            <VStack align="stretch" spacing={3} pr={2}>
              {processData.logs.map((log, idx) => {
                const isLatest = idx === processData.logs.length - 1;
                return (
                  <MotionBox
                    key={idx}
                    p={3}
                    borderRadius="md"
                    bg={isLatest ? "#282828" : "#F8F4D9"}
                    color="#97962E"
                    fontFamily="monospace"
                    initial={{ opacity: idx >= prevLogCount ? 0 : 1, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    position={isLatest ? 'sticky' : 'relative'}
                    bottom={isLatest ? 0 : undefined}
                    zIndex={isLatest ? 1 : undefined}
                  >
                    <Text fontSize="xs" color="gray.500" mb={1}>
                      {new Date(log.timestamp).toLocaleString()}
                    </Text>
                    <Text whiteSpace="pre-wrap">{log.message}</Text>
                  </MotionBox>
                );
              })}
              <Box ref={logsEndRef} />
            </VStack>
          </Box>
        </Box>

        {/* Right Panel: Images/CSV (scrollable if many) */}
        <Box 
          flex="1" 
          pl={4} 
          overflowY="auto" 
          h="100%"
          width="50%"
        >
          {processData.images.map((img, idx) => (
            <Box
              key={idx}
              mb={4}
              borderRadius="lg"
              overflow="hidden"
              boxShadow="sm"
              cursor="pointer"
              onClick={() => handleOpenModal(img)}
              transition="transform 0.3s"
              _hover={{ transform: 'scale(1.02)' }}
            >
              {isCSV(img.image_url) ? (
                <Box p={4} bg="gray.50" borderRadius="lg">
                  <Flex align="center" mb={2}>
                    <Text fontWeight="bold" mr={2}>CSV Data:</Text>
                    <Text>{img.image_url.split('/').pop()}</Text>
                  </Flex>
                  <Text fontSize="sm" color="blue.500">Click to view interactive data</Text>
                </Box>
              ) : (
                <Image
                  src={`${apiUrl}/output/${img.image_url}`}
                  alt={img.caption}
                  borderRadius="lg"
                  objectFit="cover"
                />
              )}
              <Text mt={1} fontSize="sm" textAlign="center" p={2}>
                {img.caption}
              </Text>
            </Box>
          ))}
        </Box>
      </Flex>

      {/* Modal for fullscreen viewing */}
      <Modal isOpen={isOpen} onClose={onClose} size="full">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{modalContent?.caption || 'View'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {modalContent?.type === 'image' ? (
              <Flex justify="center" align="center" h="calc(100vh - 120px)">
                <Image 
                  src={modalContent.url} 
                  alt={modalContent.caption} 
                  maxH="100%" 
                  maxW="100%" 
                  objectFit="contain"
                />
              </Flex>
            ) : (
              <Box overflowX="auto">
                {modalContent?.csvData && (
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        {modalContent.csvData.headers.map((header, idx) => (
                          <Th key={idx}>
                            <Flex align="center">
                              {header}
                              {modalContent.columnTypes && modalContent.columnTypes[idx] === 'number' && (
                                <IconButton
                                  aria-label={`Sort by ${header}`}
                                  icon={sortConfig?.key === idx ? 
                                    (sortConfig.direction === 'ascending' ? <TriangleUpIcon /> : <TriangleDownIcon />) : 
                                    <TriangleDownIcon opacity={0.3} />}
                                  size="xs"
                                  ml={1}
                                  onClick={() => sortData(idx)}
                                />
                              )}
                            </Flex>
                          </Th>
                        ))}
                      </Tr>
                    </Thead>
                    <Tbody>
                      {getSortedRows(modalContent.csvData).map((row, rowIdx) => (
                        <Tr key={rowIdx}>
                          {row.map((cell, cellIdx) => (
                            <Td key={cellIdx}>{cell}</Td>
                          ))}
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};


export default LiveProcess;